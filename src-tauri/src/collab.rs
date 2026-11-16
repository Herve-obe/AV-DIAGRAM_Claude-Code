// Collaboration sur le réseau local : un poste ouvre une session, les autres la rejoignent avec un code.
// Le relais authentifie le poste hôte avec un secret local. Les propositions invitées vont uniquement
// à cet hôte, qui vérifie les droits avant de diffuser le document accepté.
//
// Sécurité : le port n'est ouvert que pendant la session ; tout échange est chiffré (src/secure.rs) :
// un échange de clé CPace protégé par le code à 6 chiffres, sans jamais l'envoyer, puis ChaCha20-Poly1305 ;
// le relais prouve qu'il connaît le code, ce qui démasque une fausse session annoncée sur le réseau ;
// chaque tentative compte avant la poignée de main (5 par minute et par adresse, des connexions
// ouvertes en parallèle ne les multiplient pas), au plus 8 poignées de main en cours ; un plafond global
// limite les échecs toutes adresses confondues (30 par fenêtre de 10 minutes) : au-delà, toute nouvelle
// poignée de main est refusée jusqu'à la fin de la fenêtre, sauf celle du poste hôte lui-même (boucle
// locale), et l'hôte en est averti (HostInfo.locked) ; une page web autre que l'application est refusée
// (en-tête Origin) ; nombre de participants et taille des messages limités ; la file d'envoi de chaque
// participant est bornée (messages et octets) : un invité qui ne lit plus est retiré, comme à un départ
// normal ; l'hôte peut exclure un participant.
//
// Fin de session : « terminée » (l'hôte clique Terminer : les participants sont prévenus et gardent le
// projet) ou « interrompue » (fermeture de l'application, passage de relais : les participants se
// reconnectent ou un poste de secours prend le relais, voir src/collab/session.ts).
use crate::secure::{self, Cipher, KIND_BINARY, KIND_TEXT};
use futures_util::{SinkExt, StreamExt};
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::net::{IpAddr, SocketAddr};
use std::sync::atomic::{AtomicU32, AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::{mpsc, watch, Notify};
use tokio_tungstenite::tungstenite::handshake::server::{ErrorResponse, Request, Response};
use tokio_tungstenite::tungstenite::http::StatusCode;
use tokio_tungstenite::tungstenite::protocol::WebSocketConfig;
use tokio_tungstenite::tungstenite::Message;

const MAX_PEERS: usize = 16;
const MAX_MESSAGE: usize = 16 * 1024 * 1024;
/// Octets ajoutés par le chiffrement : type de trame et étiquette d'authentification
const FRAME_OVERHEAD: usize = 1 + 16;
const HELLO_TIMEOUT: Duration = Duration::from_secs(10);
const MAX_FAILURES: u32 = 5;
const LOCKOUT: Duration = Duration::from_secs(60);
/// Plafond global d'échecs de code, toutes adresses confondues. Sans lui, un attaquant qui occupe 250
/// adresses du réseau teste 1 250 codes par minute (code à 6 chiffres trouvé en 6 h 40 en moyenne) ;
/// avec 30 échecs par 10 minutes, l'espérance passe à plusieurs mois. Un code juste n'est pas un échec.
const MAX_GLOBAL_FAILURES: u32 = 30;
const GLOBAL_WINDOW: Duration = Duration::from_secs(600);
/// Au-delà de ce nombre d'adresses suivies, les entrées expirées sont purgées (mémoire bornée).
const MAX_TRACKED_ADDRESSES: usize = 1024;
/// File d'envoi d'un invité. Une pointe passagère (réseau Wi-Fi qui hoquette pendant quelques secondes :
/// mises à jour du document, curseurs, discussion) tient dans 256 messages ; la synchronisation initiale
/// d'un gros projet est un ou deux messages de 16 Mio au plus, d'où 64 Mio d'octets en attente. Au-delà,
/// l'invité ne lit plus : il est retiré (sa connexion se ferme) plutôt que de faire grossir la mémoire de l'hôte.
const MAX_QUEUE_MESSAGES: usize = 256;
const MAX_QUEUE_BYTES: usize = 64 * 1024 * 1024;
/// Le poste hôte lit sur la boucle locale, mais son interface peut être occupée (grosse fusion) pendant
/// que les messages de tous les invités arrivent : seuils plus larges pour qu'une pointe ne l'éjecte pas.
const HOST_QUEUE_FACTOR: usize = 4;
/// Une connexion qui ne se ferme pas proprement (invité bloqué) est abandonnée après ce délai.
const CLOSE_TIMEOUT: Duration = Duration::from_secs(2);
/// Poignées de main simultanées, toutes adresses confondues
const MAX_HANDSHAKES: usize = 8;
// À conserver identique à src/collab/ydoc.ts (cartes et slots partagés).
const COLLAB_PROTOCOL: u64 = 7;

/// État du canal d'arrêt : en cours, terminée par l'hôte, interrompue
const RUNNING: u8 = 0;
const ENDED: u8 = 1;
const INTERRUPTED: u8 = 2;

/// Seuils de la file d'envoi d'un participant
#[derive(Clone, Copy)]
struct QueueLimits {
    messages: usize,
    bytes: usize,
}

impl QueueLimits {
    const GUEST: QueueLimits = QueueLimits { messages: MAX_QUEUE_MESSAGES, bytes: MAX_QUEUE_BYTES };

    fn for_host(self) -> QueueLimits {
        QueueLimits { messages: self.messages * HOST_QUEUE_FACTOR, bytes: self.bytes * 2 }
    }
}

/// Messages et octets en attente dans la file d'un participant
#[derive(Default)]
struct Pending {
    messages: AtomicUsize,
    bytes: AtomicUsize,
}

fn weight(m: &Message) -> usize {
    match m {
        Message::Text(t) => t.len(),
        Message::Binary(b) => b.len(),
        _ => 0,
    }
}

/// Résultat d'un envoi dans la file d'un participant
#[derive(Debug, PartialEq)]
enum Enqueue {
    Queued,
    /// Seuils dépassés : le message n'est pas mis en file, le participant doit être retiré
    Full,
    /// Connexion déjà fermée
    Closed,
}

/// Côté émission de la file d'un participant : file bornée en nombre de messages et en octets.
/// Les envois se font sous le verrou de `Hub::peers`, ce qui sérialise les compteurs.
struct Outbox {
    tx: mpsc::UnboundedSender<Message>,
    pending: Arc<Pending>,
    limits: QueueLimits,
}

/// Côté lecture de la file : la connexion y prend les messages à envoyer au participant.
struct Inbox {
    rx: mpsc::UnboundedReceiver<Message>,
    pending: Arc<Pending>,
}

fn queue(limits: QueueLimits) -> (Outbox, Inbox) {
    let (tx, rx) = mpsc::unbounded_channel();
    let pending = Arc::new(Pending::default());
    (Outbox { tx, pending: pending.clone(), limits }, Inbox { rx, pending })
}

impl Outbox {
    fn send(&self, m: Message) -> Enqueue {
        let size = weight(&m);
        let (count, bytes) = (self.pending.messages.load(Ordering::Relaxed), self.pending.bytes.load(Ordering::Relaxed));
        // Une file vide accepte toujours un message (un seul message peut atteindre 16 Mio)
        if count > 0 && (count + 1 > self.limits.messages || bytes + size > self.limits.bytes) { return Enqueue::Full; }
        self.pending.messages.fetch_add(1, Ordering::Relaxed);
        self.pending.bytes.fetch_add(size, Ordering::Relaxed);
        if self.tx.send(m).is_err() {
            self.pending.messages.fetch_sub(1, Ordering::Relaxed);
            self.pending.bytes.fetch_sub(size, Ordering::Relaxed);
            return Enqueue::Closed;
        }
        Enqueue::Queued
    }
}

impl Inbox {
    async fn recv(&mut self) -> Option<Message> {
        let m = self.rx.recv().await?;
        self.pending.messages.fetch_sub(1, Ordering::Relaxed);
        self.pending.bytes.fetch_sub(weight(&m), Ordering::Relaxed);
        Some(m)
    }
}

struct Peer {
    host: bool,
    user_id: String,
    name: String,
    addr: SocketAddr,
    out: Outbox,
    /// Réveille la connexion pour qu'elle se ferme même si elle est bloquée à écrire vers un invité qui ne lit plus
    evict: Arc<Notify>,
}

/// Retire de la liste les participants dont la file a débordé et ferme leur connexion ; chaque connexion
/// annonce ensuite `peer-left` aux autres en se terminant, comme pour un départ normal.
fn evict(peers: &mut HashMap<u32, Peer>, slow: Vec<u32>) {
    for id in slow {
        if let Some(p) = peers.remove(&id) { p.evict.notify_one(); }
    }
}

/// État partagé d'une session : participants connectés et tentatives de code erronées.
pub struct Hub {
    code: String,
    host_token: String,
    peers: Mutex<HashMap<u32, Peer>>,
    next_id: AtomicU32,
    failures: Mutex<HashMap<IpAddr, (u32, Instant)>>,
    /// Échecs de code toutes adresses confondues : (nombre, début de la fenêtre)
    global_failures: Mutex<(u32, Instant)>,
    handshakes: AtomicUsize,
    limits: QueueLimits,
}

impl Hub {
    pub fn new(code: String) -> Arc<Self> {
        Self::with_limits(code, QueueLimits::GUEST)
    }

    fn with_limits(code: String, limits: QueueLimits) -> Arc<Self> {
        Arc::new(Hub { code, host_token: rand::random::<[u8; 32]>().iter().map(|b| format!("{b:02x}")).collect(), peers: Mutex::new(HashMap::new()), next_id: AtomicU32::new(1), failures: Mutex::new(HashMap::new()), global_failures: Mutex::new((0, Instant::now())), handshakes: AtomicUsize::new(0), limits })
    }

    /// Échecs comptés dans la fenêtre globale en cours, et plafond atteint ou non.
    fn global_state(&self) -> (u32, bool) {
        let mut g = self.global_failures.lock().unwrap();
        if g.1.elapsed() >= GLOBAL_WINDOW { *g = (0, Instant::now()); }
        (g.0, g.0 >= MAX_GLOBAL_FAILURES)
    }

    /// Refus d'une nouvelle poignée de main : adresse bloquée, ou plafond global atteint. Le poste hôte
    /// (boucle locale) n'est pas concerné par le plafond global : il doit pouvoir rejoindre sa propre
    /// session ; un attaquant du réseau ne peut pas se présenter depuis la boucle locale.
    fn refuses(&self, ip: IpAddr) -> bool {
        self.locked_out(ip) || (!ip.is_loopback() && self.global_state().1)
    }

    fn locked_out(&self, ip: IpAddr) -> bool {
        let mut f = self.failures.lock().unwrap();
        match f.get(&ip) {
            Some((n, since)) if since.elapsed() < LOCKOUT => *n >= MAX_FAILURES,
            Some(_) => {
                f.remove(&ip);
                false
            }
            None => false,
        }
    }

    fn record_failure(&self, ip: IpAddr) {
        {
            let mut g = self.global_failures.lock().unwrap();
            if g.1.elapsed() >= GLOBAL_WINDOW { *g = (0, Instant::now()); }
            g.0 += 1;
        }
        let mut f = self.failures.lock().unwrap();
        if f.len() >= MAX_TRACKED_ADDRESSES { f.retain(|_, (_, since)| since.elapsed() < LOCKOUT); }
        let e = f.entry(ip).or_insert((0, Instant::now()));
        if e.1.elapsed() >= LOCKOUT {
            *e = (0, Instant::now());
        }
        e.0 += 1;
    }

    /// Code juste (ou version refusée, qui ne révèle rien du code) : la tentative comptée avant la
    /// poignée de main est annulée, pour l'adresse et pour le plafond global.
    fn forgive(&self, ip: IpAddr) {
        if let Some(e) = self.failures.lock().unwrap().get_mut(&ip) { e.0 = e.0.saturating_sub(1); }
        let mut g = self.global_failures.lock().unwrap();
        g.0 = g.0.saturating_sub(1);
    }

    /// Envoie un message à un participant ; renvoie false si sa file a débordé.
    fn deliver(&self, p: &Peer, msg: Message) -> bool {
        p.out.send(msg) != Enqueue::Full
    }

    /// Envoie un message à tous les participants sauf l'expéditeur.
    fn broadcast(&self, from: u32, msg: Message) {
        let mut peers = self.peers.lock().unwrap();
        let slow: Vec<u32> = peers.iter().filter(|(id, p)| **id != from && !self.deliver(p, msg.clone())).map(|(id, _)| *id).collect();
        evict(&mut peers, slow);
    }

    /// 255 + id réseau + proposition : seul le poste hôte reçoit cette enveloppe.
    /// 254 + destinataire + réponse : seul l'hôte authentifié peut adresser un invité.
    fn route(&self, from: u32, data: &[u8]) {
        let mut peers = self.peers.lock().unwrap();
        let Some(sender) = peers.get(&from) else { return };
        let mut slow = Vec::new();
        if sender.host {
            if data.first() == Some(&254) {
                if data.len() < 6 { return; }
                let id = u32::from_be_bytes(data[1..5].try_into().unwrap());
                if let Some(p) = peers.get(&id) { if !self.deliver(p, Message::binary(data[5..].to_vec())) { slow.push(id); } }
            } else {
                for (id, p) in peers.iter() { if *id != from && !self.deliver(p, Message::binary(data.to_vec())) { slow.push(*id); } }
            }
        } else {
            let mut wrapped = vec![255];
            wrapped.extend_from_slice(&from.to_be_bytes());
            wrapped.extend_from_slice(data);
            for (id, p) in peers.iter().filter(|(_, p)| p.host) { if !self.deliver(p, Message::binary(wrapped.clone())) { slow.push(*id); } }
        }
        evict(&mut peers, slow);
    }

    pub fn kick(&self, id: u32) -> bool {
        // Le participant est prévenu (il ne se reconnecte pas), puis retirer l'émetteur ferme la connexion
        match self.peers.lock().unwrap().remove(&id) {
            Some(p) => {
                let _ = p.out.send(json(serde_json::json!({ "type": "kicked" })));
                true
            }
            None => false,
        }
    }

    fn peer_list(&self) -> Vec<PeerInfo> {
        let mut v: Vec<PeerInfo> = self
            .peers
            .lock()
            .unwrap()
            .iter()
            .map(|(id, p)| PeerInfo { id: *id, name: p.name.clone(), user_id: p.user_id.clone(), address: p.addr.ip().to_string() })
            .collect();
        v.sort_by_key(|p| p.id);
        v
    }
}

#[derive(Serialize, Clone)]
pub struct PeerInfo {
    #[serde(rename = "userId")]
    user_id: String,
    id: u32,
    name: String,
    address: String,
}

/// Poignée de main en cours : libère sa place à la fin, quelle qu'en soit l'issue.
struct Handshake<'a>(&'a Hub);
impl Drop for Handshake<'_> {
    fn drop(&mut self) { self.0.handshakes.fetch_sub(1, Ordering::SeqCst); }
}

/// Origines admises : la fenêtre de l'application (Windows, macOS, Linux) et le serveur de développement.
/// Un client sans en-tête Origin n'est pas un navigateur ; il doit quand même donner le code.
fn allowed_origin(origin: Option<&str>) -> bool {
    match origin {
        None => true,
        Some("tauri://localhost" | "http://tauri.localhost" | "https://tauri.localhost") => true,
        Some(o) => cfg!(debug_assertions) && o == "http://localhost:5173",
    }
}

/// Comparaison en temps constant : la durée ne révèle pas combien de chiffres sont justes.
fn same_code(a: &str, b: &str) -> bool {
    a.len() == b.len() && a.bytes().zip(b.bytes()).fold(0u8, |acc, (x, y)| acc | (x ^ y)) == 0
}

fn json(v: serde_json::Value) -> Message {
    Message::text(v.to_string())
}

/// Message du relais chiffré pour un participant (texte de contrôle ou message y-protocols)
fn seal(cipher: &mut Cipher, m: Message) -> Message {
    match m {
        Message::Text(t) => Message::binary(cipher.seal(KIND_TEXT, t.as_bytes())),
        Message::Binary(b) => Message::binary(cipher.seal(KIND_BINARY, &b)),
        other => other,
    }
}

fn to_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

/// Part d'échange de clé : exactement 32 octets en hexadécimal
fn from_hex(text: &str) -> Option<Vec<u8>> {
    if text.len() != 64 || !text.bytes().all(|b| b.is_ascii_hexdigit()) { return None; }
    (0..64).step_by(2).map(|i| u8::from_str_radix(&text[i..i + 2], 16).ok()).collect()
}

/// Boucle d'acceptation, jusqu'à la fermeture de la session.
pub async fn serve(listener: TcpListener, hub: Arc<Hub>, mut shutdown: watch::Receiver<u8>) {
    loop {
        tokio::select! {
            _ = shutdown.changed() => break,
            accepted = listener.accept() => {
                let Ok((stream, addr)) = accepted else { continue };
                let hub = hub.clone();
                let shutdown = shutdown.clone();
                tokio::spawn(async move { handle(stream, addr, hub, shutdown).await });
            }
        }
    }
    // Fin de session : toutes les connexions se ferment
    hub.peers.lock().unwrap().clear();
}

async fn handle(stream: TcpStream, addr: SocketAddr, hub: Arc<Hub>, mut shutdown: watch::Receiver<u8>) {
    if hub.refuses(addr.ip()) || hub.peers.lock().unwrap().len() >= MAX_PEERS {
        return;
    }
    if hub.handshakes.fetch_add(1, Ordering::SeqCst) >= MAX_HANDSHAKES {
        hub.handshakes.fetch_sub(1, Ordering::SeqCst);
        return;
    }
    let handshake = Handshake(&hub);
    // La tentative compte dès maintenant : attendre avant d'envoyer le code ne permet plus d'en essayer davantage
    hub.record_failure(addr.ip());
    let mut config = WebSocketConfig::default();
    config.max_message_size = Some(MAX_MESSAGE + FRAME_OVERHEAD);
    config.max_frame_size = Some(MAX_MESSAGE + FRAME_OVERHEAD);
    // Le type d'erreur est imposé par la signature de rappel de tungstenite
    #[allow(clippy::result_large_err)]
    let check_origin = |request: &Request, response: Response| {
        let origin = request.headers().get("origin").and_then(|o| o.to_str().ok());
        if allowed_origin(origin) { Ok(response) } else {
            let mut refused = ErrorResponse::new(Some("origine refusée".into()));
            *refused.status_mut() = StatusCode::FORBIDDEN;
            Err(refused)
        }
    };
    let Ok(ws) = tokio_tungstenite::accept_hdr_async_with_config(stream, check_origin, Some(config)).await else { return };
    let (mut sink, mut source) = ws.split();

    let refuse = |reason: &str| json(serde_json::json!({ "type": "refused", "reason": reason }));

    // 1. Échange de clé : {"type":"pake","protocol":7,"share":"<hex>"} ; le code n'est jamais transmis
    let pake = match tokio::time::timeout(HELLO_TIMEOUT, source.next()).await {
        Ok(Some(Ok(Message::Text(t)))) => serde_json::from_str::<serde_json::Value>(&t).ok(),
        _ => None,
    };
    if pake.as_ref().and_then(|h| h.get("protocol").and_then(|v| v.as_u64())) != Some(COLLAB_PROTOCOL) {
        // Une version différente ne devine pas le code : la tentative ne compte pas
        hub.forgive(addr.ip());
        let _ = sink.send(refuse("version")).await;
        let _ = sink.close().await;
        return;
    }
    let client_share = pake.as_ref().and_then(|h| h.get("share").and_then(|v| v.as_str())).and_then(from_hex);
    let Some((server_share, keys)) = client_share.and_then(|c| secure::respond(&hub.code, &c, &rand::random::<[u8; 64]>())) else {
        let _ = sink.send(refuse("code")).await;
        let _ = sink.close().await;
        return;
    };
    if sink.send(json(serde_json::json!({ "type": "pake", "share": to_hex(&server_share), "confirm": to_hex(&keys.confirm) }))).await.is_err() { return; }
    let mut incoming = Cipher::new(&keys.client_to_server);
    let mut outgoing = Cipher::new(&keys.server_to_client);

    // 2. Présentation chiffrée : {"type":"hello","name","clientToken","hostToken"}. Un mauvais code
    // donne d'autres clés : la trame ne se déchiffre pas.
    let hello = match tokio::time::timeout(HELLO_TIMEOUT, source.next()).await {
        Ok(Some(Ok(Message::Binary(b)))) => match incoming.open(&b) {
            Some((KIND_TEXT, text)) => serde_json::from_slice::<serde_json::Value>(&text).ok(),
            _ => None,
        },
        _ => None,
    };
    if hello.as_ref().and_then(|h| h.get("type").and_then(|t| t.as_str())) != Some("hello") {
        let _ = sink.send(refuse("code")).await;
        let _ = sink.close().await;
        return;
    }
    hub.forgive(addr.ip());
    drop(handshake);
    let host = addr.ip().is_loopback() && hello.as_ref()
        .and_then(|h| h.get("hostToken").and_then(|t| t.as_str()))
        .map(|t| same_code(t, &hub.host_token)).unwrap_or(false);
    let client_token = hello.as_ref().and_then(|h| h.get("clientToken").and_then(|t| t.as_str()))
        .filter(|t| t.len() == 64 && t.bytes().all(|b| b.is_ascii_hexdigit()));
    let user_id = match client_token {
        Some(t) => format!("{:x}", Sha256::digest(t.as_bytes())),
        None => format!("{:x}", Sha256::digest(rand::random::<[u8; 32]>())),
    };
    let name: String = hello
        .as_ref()
        .and_then(|h| h.get("name").and_then(|n| n.as_str()))
        .unwrap_or("")
        .chars()
        .filter(|c| !c.is_control())
        .take(40)
        .collect();

    // 2. Inscription et annonce aux autres
    let id = hub.next_id.fetch_add(1, Ordering::Relaxed);
    let (out, mut rx) = queue(if host { hub.limits.for_host() } else { hub.limits });
    let evicted = Arc::new(Notify::new());
    let others = hub.peer_list();
    {
        let mut peers = hub.peers.lock().unwrap();
        if peers.len() >= MAX_PEERS || (host && peers.values().any(|p| p.host)) { return; }
        peers.insert(id, Peer { host, user_id: user_id.clone(), name: name.clone(), addr, out, evict: evicted.clone() });
    }
    let welcome = json(serde_json::json!({ "type": "welcome", "protocol": COLLAB_PROTOCOL, "peerId": id, "userId": user_id, "peers": others }));
    if sink.send(seal(&mut outgoing, welcome)).await.is_err() {
        hub.peers.lock().unwrap().remove(&id);
        return;
    }
    hub.broadcast(id, json(serde_json::json!({ "type": "peer-joined", "peerId": id, "userId": user_id, "name": name })));

    // 3. Relais : binaire reçu -> autres participants ; messages des autres -> ce participant.
    // Chaque connexion a ses propres clés : le relais déchiffre puis rechiffre pour chaque destinataire.
    loop {
        tokio::select! {
            _ = shutdown.changed() => break,
            _ = evicted.notified() => break, // file débordée : l'invité ne lit plus
            out = rx.recv() => match out {
                Some(m) => {
                    // Écrire vers un invité qui ne lit plus peut bloquer : le retrait doit pouvoir l'interrompre
                    tokio::select! {
                        sent = sink.send(seal(&mut outgoing, m)) => if sent.is_err() { break },
                        _ = evicted.notified() => break,
                    }
                }
                None => break, // exclu par l'hôte
            },
            received = source.next() => match received {
                Some(Ok(Message::Binary(b))) => match incoming.open(&b) {
                    Some((KIND_BINARY, data)) => hub.route(id, &data),
                    _ => break, // trame altérée, rejouée ou inattendue
                },
                Some(Ok(Message::Ping(p))) => { let _ = sink.send(Message::Pong(p)).await; }
                Some(Ok(Message::Close(_))) | None | Some(Err(_)) => break,
                Some(Ok(_)) => {}
            },
        }
    }
    // Le relais peut fermer rx avant que cette connexion ne lise l'arrêt.
    if *shutdown.borrow() == ENDED {
        let _ = tokio::time::timeout(CLOSE_TIMEOUT, sink.send(seal(&mut outgoing, json(serde_json::json!({ "type": "ended" }))))).await;
    }
    let _ = tokio::time::timeout(CLOSE_TIMEOUT, sink.close()).await;
    hub.peers.lock().unwrap().remove(&id);
    if host { hub.peers.lock().unwrap().clear(); }
    hub.broadcast(id, json(serde_json::json!({ "type": "peer-left", "peerId": id })));
}

struct Running {
    port: u16,
    code: String,
    hub: Arc<Hub>,
    stop: watch::Sender<u8>,
    discovery_available: bool,
}

#[derive(Default)]
pub struct CollabServer(Mutex<Option<Running>>);

impl CollabServer {
    /// ended : session terminée par l'hôte ; sinon interrompue (les participants attendent son retour)
    pub fn stop(&self, ended: bool) {
        if let Some(r) = self.0.lock().unwrap().take() {
            let _ = r.stop.send(if ended { ENDED } else { INTERRUPTED });
        }
    }
}

#[derive(Serialize)]
pub struct HostInfo {
    #[serde(rename = "hostToken")]
    host_token: String,
    port: u16,
    code: String,
    /// Adresses IPv4 du poste sur le réseau local (ex. 192.168.1.20:4455)
    addresses: Vec<String>,
    peers: Vec<PeerInfo>,
    #[serde(rename = "discoveryAvailable")]
    discovery_available: bool,
    /// Échecs de code dans la fenêtre globale en cours (toutes adresses confondues)
    #[serde(rename = "failedAttempts")]
    failed_attempts: u32,
    /// Plafond global atteint : les nouvelles poignées de main sont refusées jusqu'à la fin de la fenêtre
    locked: bool,
}

fn local_addresses(port: u16) -> Vec<String> {
    let mut v: Vec<String> = if_addrs::get_if_addrs()
        .unwrap_or_default()
        .into_iter()
        .filter(|i| !i.is_loopback())
        .filter_map(|i| match i.ip() {
            IpAddr::V4(ip) if !ip.is_link_local() => Some(format!("{ip}:{port}")),
            _ => None,
        })
        .collect();
    v.sort();
    v.dedup();
    v
}

fn info(r: &Running) -> HostInfo {
    let (failed_attempts, locked) = r.hub.global_state();
    HostInfo { failed_attempts, locked, host_token: r.hub.host_token.clone(), port: r.port, code: r.code.clone(), addresses: local_addresses(r.port), peers: r.hub.peer_list(), discovery_available: r.discovery_available }
}

fn new_code() -> String {
    use rand::Rng;
    format!("{:06}", rand::rng().random_range(0..1_000_000u32))
}

/// Ouvre une session sur le port demandé (1024 à 65535) et renvoie le code et les adresses à communiquer.
/// code : reprise d'une session existante (retour de l'hôte, poste de secours) ; sinon un nouveau code.
#[tauri::command]
pub async fn collab_host_start(state: tauri::State<'_, CollabServer>, port: u16, code: Option<String>, session_name: Option<String>, host_name: Option<String>) -> Result<HostInfo, String> {
    if port < 1024 {
        return Err("port réservé : choisir un port à partir de 1024".into());
    }
    let code = match code {
        Some(c) if c.len() == 6 && c.bytes().all(|b| b.is_ascii_digit()) => c,
        Some(_) => return Err("code de session invalide".into()),
        None => new_code(),
    };
    state.stop(false);
    let listener = TcpListener::bind(("0.0.0.0", port)).await.map_err(|e| format!("port {port} indisponible : {e}"))?;
    let hub = Hub::new(code.clone());
    let (stop, rx) = watch::channel(RUNNING);
    let discovery_available = crate::discovery::advertise(crate::discovery::Advertisement::new(port, session_name, host_name), rx.clone()).await;
    tauri::async_runtime::spawn(serve(listener, hub.clone(), rx));
    let running = Running { port, code, hub, stop, discovery_available };
    let out = info(&running);
    *state.0.lock().unwrap() = Some(running);
    Ok(out)
}

/// ended : l'hôte termine la session pour tout le monde ; sinon simple arrêt du relais (passage de relais).
#[tauri::command]
pub fn collab_host_stop(state: tauri::State<CollabServer>, ended: bool) {
    state.stop(ended);
}

/// Adresses de ce poste, annoncées aux autres pour qu'il puisse prendre le relais si l'hôte disparaît.
#[tauri::command]
pub fn collab_local_addresses(port: u16) -> Vec<String> {
    local_addresses(port)
}

#[tauri::command]
pub fn collab_host_status(state: tauri::State<CollabServer>) -> Option<HostInfo> {
    state.0.lock().unwrap().as_ref().map(info)
}

#[tauri::command]
pub fn collab_kick(state: tauri::State<CollabServer>, peer_id: u32) -> bool {
    state.0.lock().unwrap().as_ref().map(|r| r.hub.kick(peer_id)).unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio_tungstenite::connect_async;

    #[test]
    fn origines_admises() {
        for ok in [None, Some("tauri://localhost"), Some("http://tauri.localhost"), Some("https://tauri.localhost")] { assert!(allowed_origin(ok)); }
        for ko in ["https://evil.example", "http://localhost:8080", "null"] { assert!(!allowed_origin(Some(ko))); }
    }

    /// Participant sans connexion : sa file se lit directement.
    fn test_peer(hub: &Hub, id: u32, host: bool) -> (Arc<Notify>, Inbox) {
        let (out, inbox) = queue(if host { hub.limits.for_host() } else { hub.limits });
        let evict = Arc::new(Notify::new());
        hub.peers.lock().unwrap().insert(id, Peer { host, user_id: "id".into(), name: "test".into(), addr: "127.0.0.1:1000".parse().unwrap(), out, evict: evict.clone() });
        (evict, inbox)
    }

    async fn start() -> (u16, Arc<Hub>, watch::Sender<u8>) {
        start_with(QueueLimits::GUEST).await
    }

    async fn start_with(limits: QueueLimits) -> (u16, Arc<Hub>, watch::Sender<u8>) {
        let listener = TcpListener::bind(("127.0.0.1", 0)).await.unwrap();
        let port = listener.local_addr().unwrap().port();
        let hub = Hub::with_limits("123456".into(), limits);
        let (stop, rx) = watch::channel(RUNNING);
        tokio::spawn(serve(listener, hub.clone(), rx));
        (port, hub, stop)
    }

    /// Relais manuel pour les essais de bout en bout (navigateurs) : port 4455, code 123456 par défaut
    /// (AVD_RELAY_PORT, AVD_RELAY_CODE, AVD_RELAY_SECS pour les changer).
    /// cargo test --lib collab::tests::relais_manuel -- --ignored
    #[tokio::test]
    #[ignore]
    async fn relais_manuel() {
        let env = |k: &str| std::env::var(k).ok();
        let port: u16 = env("AVD_RELAY_PORT").and_then(|s| s.parse().ok()).unwrap_or(4455);
        let code = env("AVD_RELAY_CODE").unwrap_or_else(|| "123456".into());
        let listener = TcpListener::bind(("127.0.0.1", port)).await.unwrap();
        let (_stop, rx) = watch::channel(RUNNING);
        let secs = env("AVD_RELAY_SECS").and_then(|s| s.parse().ok()).unwrap_or(120);
        tokio::select! {
            _ = serve(listener, Hub::new(code), rx) => {}
            _ = tokio::time::sleep(std::time::Duration::from_secs(secs)) => {}
        }
    }

    type Ws = tokio_tungstenite::WebSocketStream<tokio_tungstenite::MaybeTlsStream<TcpStream>>;

    /// Participant de test : même échange de clé et même chiffrement que src/collab/secure.ts.
    struct Client { ws: Ws, out: Option<Cipher>, inn: Option<Cipher> }

    impl Client {
        async fn send_binary(&mut self, data: &[u8]) {
            let frame = self.out.as_mut().unwrap().seal(KIND_BINARY, data);
            self.ws.send(Message::binary(frame)).await.unwrap();
        }

        /// Trame suivante déchiffrée, None à la fermeture
        async fn recv(&mut self) -> Option<(u8, Vec<u8>)> {
            loop {
                match tokio::time::timeout(Duration::from_secs(5), self.ws.next()).await.expect("message de session attendu") {
                    Some(Ok(Message::Binary(b))) => return Some(self.inn.as_mut().unwrap().open(&b).expect("trame authentique")),
                    Some(Ok(Message::Ping(_) | Message::Pong(_))) => {}
                    Some(Ok(Message::Close(_))) | None | Some(Err(_)) => return None,
                    other => panic!("message en clair inattendu : {other:?}"),
                }
            }
        }
    }

    async fn plain_json(ws: &mut Ws) -> serde_json::Value {
        match tokio::time::timeout(Duration::from_secs(5), ws.next()).await.expect("réponse attendue") {
            Some(Ok(Message::Text(t))) => serde_json::from_str(&t).unwrap(),
            other => panic!("réponse inattendue : {other:?}"),
        }
    }

    async fn join_with_token(port: u16, code: &str, token: Option<&str>) -> (Client, serde_json::Value) {
        let (mut ws, _) = connect_async(format!("ws://127.0.0.1:{port}")).await.unwrap();
        let (scalar, share) = secure::start(code, &rand::random::<[u8; 64]>()).unwrap();
        ws.send(json(serde_json::json!({ "type": "pake", "protocol": COLLAB_PROTOCOL, "share": to_hex(&share) }))).await.unwrap();
        let reply = plain_json(&mut ws).await;
        let server = reply["share"].as_str().and_then(from_hex);
        let keys = server.and_then(|s| secure::keys(&scalar, &s, &share, &s.as_slice().try_into().unwrap()));
        // Le relais doit prouver qu'il connaît le code, sinon l'invité s'arrête là
        let Some(keys) = keys.filter(|k| reply["confirm"] == to_hex(&k.confirm)) else {
            return (Client { ws, out: None, inn: None }, serde_json::json!({ "type": "refused", "reason": reply["reason"].as_str().unwrap_or("code") }));
        };
        let mut client = Client { ws, out: Some(Cipher::new(&keys.client_to_server)), inn: Some(Cipher::new(&keys.server_to_client)) };
        let hello = serde_json::json!({ "type": "hello", "name": "Régie\u{7}", "hostToken": token }).to_string();
        let frame = client.out.as_mut().unwrap().seal(KIND_TEXT, hello.as_bytes());
        client.ws.send(Message::binary(frame)).await.unwrap();
        let welcome = next_json(&mut client).await;
        (client, welcome)
    }

    async fn join(port: u16, code: &str) -> (Client, serde_json::Value) {
        join_with_token(port, code, None).await
    }

    async fn next_json(client: &mut Client) -> serde_json::Value {
        match client.recv().await {
            Some((KIND_TEXT, text)) => serde_json::from_slice(&text).unwrap(),
            other => panic!("message de session inattendu : {other:?}"),
        }
    }

    #[tokio::test]
    async fn refuse_un_code_faux_puis_bloque_l_adresse() {
        let (port, hub, _stop) = start().await;
        for _ in 0..MAX_FAILURES {
            let (_ws, reply) = join(port, "000000").await;
            assert_eq!(reply["type"], "refused");
        }
        assert!(hub.locked_out("127.0.0.1".parse().unwrap()));
        assert!(hub.peers.lock().unwrap().is_empty());
    }

    #[tokio::test]
    async fn refuse_un_client_ancien_avant_tout_echange_du_projet() {
        let (port, hub, _stop) = start().await;
        let (mut ws, _) = connect_async(format!("ws://127.0.0.1:{port}")).await.unwrap();
        ws.send(json(serde_json::json!({ "type": "hello", "code": "123456", "name": "Ancienne version" }))).await.unwrap();
        let reply = plain_json(&mut ws).await;
        assert_eq!(reply["type"], "refused");
        assert_eq!(reply["reason"], "version");
        assert!(hub.peers.lock().unwrap().is_empty());
        assert!(!hub.locked_out("127.0.0.1".parse().unwrap()));
    }

    #[tokio::test]
    async fn relaie_les_messages_binaires_entre_participants() {
        let (port, hub, stop) = start().await;
        let (mut a, wa) = join_with_token(port, "123456", Some(&hub.host_token)).await;
        assert_eq!(wa["type"], "welcome");
        let (mut b, wb) = join(port, "123456").await;
        assert_eq!(wb["peers"][0]["name"], "Régie", "caractères de contrôle retirés du nom");
        let joined = next_json(&mut a).await;
        assert_eq!(joined["type"], "peer-joined");
        a.send_binary(&[0u8, 1, 2]).await;
        assert_eq!(b.recv().await, Some((KIND_BINARY, vec![0, 1, 2])));
        // Exclusion par l'hôte : B est prévenu puis déconnecté, A est prévenu
        let b_id = wb["peerId"].as_u64().unwrap() as u32;
        assert!(hub.kick(b_id));
        assert_eq!(next_json(&mut b).await["type"], "kicked");
        let left = next_json(&mut a).await;
        assert_eq!(left["type"], "peer-left");
        // Fin de session par l'hôte : les participants restants sont prévenus
        let _ = stop.send(ENDED);
        assert_eq!(next_json(&mut a).await["type"], "ended");
    }

    #[tokio::test]
    async fn annonce_la_fin_meme_si_les_canaux_des_participants_sont_deja_fermes() {
        for _ in 0..16 {
            let (port, hub, stop) = start().await;
            let (mut a, _) = join_with_token(port, "123456", Some(&hub.host_token)).await;
            let (mut b, _) = join(port, "123456").await;
            assert_eq!(next_json(&mut a).await["type"], "peer-joined");
            stop.send(ENDED).unwrap();
            hub.peers.lock().unwrap().clear();
            assert_eq!(next_json(&mut a).await["type"], "ended");
            assert_eq!(next_json(&mut b).await["type"], "ended");
        }
    }

    #[tokio::test]
    async fn interruption_sans_message_de_fin() {
        let (port, _hub, stop) = start().await;
        let (mut a, _) = join(port, "123456").await;
        let _ = stop.send(INTERRUPTED);
        // La connexion se ferme sans « ended » : le participant tentera de se reconnecter
        while let Some((_, data)) = a.recv().await {
            assert!(!String::from_utf8_lossy(&data).contains("ended"), "pas de fin annoncée");
        }
    }

    #[test]
    fn seules_les_propositions_de_l_hote_sont_diffusees() {
        let hub = Hub::new("123456".into());
        let (_, mut host_rx) = test_peer(&hub, 1, true);
        let (_, mut a_rx) = test_peer(&hub, 2, false);
        let (_, mut b_rx) = test_peer(&hub, 3, false);
        hub.route(2, &[0, 2, 42]);
        assert_eq!(host_rx.rx.try_recv().unwrap(), Message::binary(vec![255, 0, 0, 0, 2, 0, 2, 42]));
        assert!(a_rx.rx.try_recv().is_err());
        assert!(b_rx.rx.try_recv().is_err(), "un invité ne reçoit jamais une proposition non validée");
        // Une fausse enveloppe ciblée reste une proposition invitée, avec son identité réelle.
        hub.route(2, &[254, 0, 0, 0, 3, 99]);
        assert_eq!(host_rx.rx.try_recv().unwrap(), Message::binary(vec![255, 0, 0, 0, 2, 254, 0, 0, 0, 3, 99]));
        assert!(b_rx.rx.try_recv().is_err());
        hub.route(1, &[254, 0, 0, 0, 3, 7]);
        assert_eq!(b_rx.rx.try_recv().unwrap(), Message::binary(vec![7]));
        assert!(a_rx.rx.try_recv().is_err());
        hub.route(1, &[0, 2, 8]);
        assert_eq!(a_rx.rx.try_recv().unwrap(), Message::binary(vec![0, 2, 8]));
        assert_eq!(b_rx.rx.try_recv().unwrap(), Message::binary(vec![0, 2, 8]));
    }

    #[test]
    fn code_a_six_chiffres() {
        let c = new_code();
        assert_eq!(c.len(), 6);
        assert!(c.chars().all(|ch| ch.is_ascii_digit()));
        assert!(same_code("123456", "123456"));
        assert!(!same_code("123456", "123457"));
    }

    fn ip(n: u8) -> IpAddr { format!("192.168.1.{n}").parse().unwrap() }

    #[test]
    fn plafond_global_toutes_adresses_confondues() {
        let hub = Hub::new("123456".into());
        // 29 échecs depuis 29 adresses différentes (aucune n'atteint sa limite de 5) : pas encore bloqué
        for n in 1..MAX_GLOBAL_FAILURES as u8 { hub.record_failure(ip(n)); }
        assert!(!hub.refuses(ip(200)));
        assert_eq!(hub.global_state(), (MAX_GLOBAL_FAILURES - 1, false));
        hub.record_failure(ip(100));
        assert_eq!(hub.global_state(), (MAX_GLOBAL_FAILURES, true));
        // Une adresse neuve est refusée, une adresse jamais vue aussi
        assert!(hub.refuses(ip(201)));
        // Le poste hôte (boucle locale) peut toujours rejoindre sa propre session
        assert!(!hub.refuses("127.0.0.1".parse().unwrap()));
        assert!(!hub.refuses("::1".parse().unwrap()));
    }

    #[test]
    fn le_plafond_global_se_leve_a_la_fin_de_la_fenetre() {
        let hub = Hub::new("123456".into());
        for n in 0..MAX_GLOBAL_FAILURES as u8 { hub.record_failure(ip(n)); }
        assert!(hub.refuses(ip(250)));
        hub.global_failures.lock().unwrap().1 = Instant::now() - GLOBAL_WINDOW;
        assert!(!hub.refuses(ip(250)));
        assert_eq!(hub.global_state(), (0, false));
    }

    #[test]
    fn un_code_juste_ne_compte_pas_comme_un_echec() {
        let hub = Hub::new("123456".into());
        // Cent connexions réussies depuis la même adresse ou des adresses différentes : jamais bloqué
        for n in 0..100u8 {
            hub.record_failure(ip(n % 7));
            hub.forgive(ip(n % 7));
        }
        assert_eq!(hub.global_state(), (0, false));
        assert!(!hub.refuses(ip(1)));
    }

    #[tokio::test]
    async fn un_code_juste_ne_consomme_pas_le_plafond_de_bout_en_bout() {
        let (port, hub, _stop) = start().await;
        let mut clients = Vec::new();
        for _ in 0..MAX_PEERS - 1 {
            let (c, welcome) = join(port, "123456").await;
            assert_eq!(welcome["type"], "welcome");
            clients.push(c);
        }
        assert_eq!(hub.global_state().0, 0, "chaque tentative réussie est annulée");
        // Un mauvais code, lui, compte
        let (_c, reply) = join(port, "000000").await;
        assert_eq!(reply["type"], "refused");
        assert_eq!(hub.global_state().0, 1);
    }

    #[tokio::test]
    async fn le_plafond_global_est_signale_dans_les_infos_de_l_hote() {
        let hub = Hub::new("123456".into());
        for n in 0..MAX_GLOBAL_FAILURES as u8 { hub.record_failure(ip(n)); }
        let (failed, locked) = hub.global_state();
        assert!(locked && failed == MAX_GLOBAL_FAILURES);
        let (stop, _rx) = watch::channel(RUNNING);
        let running = Running { port: 1, code: "123456".into(), hub, stop, discovery_available: true };
        let value = serde_json::to_value(info(&running)).unwrap();
        assert_eq!(value["locked"], true);
        assert_eq!(value["failedAttempts"], MAX_GLOBAL_FAILURES);
    }

    #[test]
    fn la_file_est_bornee_en_messages() {
        let (out, mut inbox) = queue(QueueLimits { messages: 3, bytes: 1_000_000 });
        for _ in 0..3 { assert_eq!(out.send(Message::binary(vec![1])), Enqueue::Queued); }
        assert_eq!(out.send(Message::binary(vec![1])), Enqueue::Full);
        // Lire libère de la place
        assert!(inbox.rx.try_recv().is_ok());
        inbox.pending.messages.fetch_sub(1, Ordering::Relaxed);
        inbox.pending.bytes.fetch_sub(1, Ordering::Relaxed);
        assert_eq!(out.send(Message::binary(vec![1])), Enqueue::Queued);
    }

    #[tokio::test]
    async fn la_file_est_bornee_en_octets_et_accepte_un_gros_message_isole() {
        let (out, mut inbox) = queue(QueueLimits { messages: 100, bytes: 1000 });
        // Un message plus gros que le plafond passe quand la file est vide (synchronisation initiale)
        assert_eq!(out.send(Message::binary(vec![0; 5000])), Enqueue::Queued);
        assert_eq!(out.send(Message::binary(vec![0; 1])), Enqueue::Full);
        assert_eq!(inbox.recv().await.map(|m| weight(&m)), Some(5000));
        assert_eq!(out.send(Message::binary(vec![0; 600])), Enqueue::Queued);
        assert_eq!(out.send(Message::binary(vec![0; 600])), Enqueue::Full);
        assert_eq!(out.send(Message::binary(vec![0; 400])), Enqueue::Queued);
        drop(inbox);
        assert_eq!(out.send(Message::binary(vec![0; 1])), Enqueue::Full, "file pleine avant la fermeture constatée");
    }

    #[tokio::test]
    async fn un_participant_lent_est_retire_sans_toucher_aux_autres() {
        let hub = Hub::with_limits("123456".into(), QueueLimits { messages: 4, bytes: 1_000_000 });
        let (_, mut host_rx) = test_peer(&hub, 1, true);
        let (slow_evict, _slow_rx) = test_peer(&hub, 2, false);
        let (_, mut fast_rx) = test_peer(&hub, 3, false);
        // L'hôte (seuil ×4 = 16) envoie 10 messages : l'invité 2 (seuil 4, ne lit jamais) déborde, l'invité 3 lit
        for i in 0..10u8 {
            hub.route(1, &[0, 0, i]);
            assert_eq!(fast_rx.recv().await, Some(Message::binary(vec![0, 0, i])));
        }
        let ids: Vec<u32> = { let mut v: Vec<u32> = hub.peers.lock().unwrap().keys().copied().collect(); v.sort(); v };
        assert_eq!(ids, [1, 3], "l'invité lent est retiré");
        // Sa connexion est réveillée pour se fermer, même bloquée en écriture
        tokio::time::timeout(Duration::from_secs(1), slow_evict.notified()).await.expect("retrait signalé");
        // L'hôte n'est pas éjecté et ne reçoit rien d'inattendu
        assert!(hub.peers.lock().unwrap().contains_key(&1));
        assert!(host_rx.rx.try_recv().is_err());
    }

    #[tokio::test]
    async fn l_hote_tolere_une_pointe_que_refuse_un_invite() {
        let hub = Hub::with_limits("123456".into(), QueueLimits { messages: 4, bytes: 1_000_000 });
        let (_, _host_rx) = test_peer(&hub, 1, true);
        let (_, _guest_rx) = test_peer(&hub, 2, false);
        let (_, _other_rx) = test_peer(&hub, 3, false);
        // Les invités 2 et 3 envoient 8 messages chacun, l'hôte (seuil 16) n'a rien lu : il reste
        for i in 0..8u8 { hub.route(2, &[0, i]); hub.route(3, &[0, i]); }
        let ids: Vec<u32> = { let mut v: Vec<u32> = hub.peers.lock().unwrap().keys().copied().collect(); v.sort(); v };
        assert_eq!(ids, [1, 2, 3]);
        // Au-delà du seuil de l'hôte, il est retiré aussi
        for i in 0..4u8 { hub.route(2, &[0, i]); }
        assert!(!hub.peers.lock().unwrap().contains_key(&1));
    }

    #[tokio::test]
    async fn un_invite_qui_ne_lit_plus_est_retire_et_les_autres_sont_prevenus() {
        // Seuils réduits pour que le test reste rapide ; les connexions et les tampons TCP sont réels
        let (port, hub, _stop) = start_with(QueueLimits { messages: 4, bytes: 64 * 1024 * 1024 }).await;
        let (mut a, _) = join_with_token(port, "123456", Some(&hub.host_token)).await;
        let (_slow, welcome) = join(port, "123456").await; // ne lit plus rien après l'accueil
        let slow_id = welcome["peerId"].as_u64().unwrap() as u32;
        assert_eq!(next_json(&mut a).await["type"], "peer-joined");
        let chunk = vec![7u8; 1024 * 1024];
        let mut left = None;
        for _ in 0..400 {
            a.send_binary(&chunk).await;
            if let Ok(Some((KIND_TEXT, text))) = tokio::time::timeout(Duration::from_millis(20), a.recv()).await {
                left = Some(serde_json::from_slice::<serde_json::Value>(&text).unwrap());
                break;
            }
        }
        let left = left.expect("peer-left attendu après le débordement");
        assert_eq!(left["type"], "peer-left");
        assert_eq!(left["peerId"], slow_id);
        assert!(!hub.peers.lock().unwrap().contains_key(&slow_id));
        assert!(hub.peers.lock().unwrap().values().any(|p| p.host), "l'hôte reste connecté");
    }
}
