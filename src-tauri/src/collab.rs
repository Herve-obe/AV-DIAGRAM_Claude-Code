// Collaboration sur le réseau local : un poste ouvre une session, les autres la rejoignent avec un code.
// Ce module est un simple relais WebSocket : il ne lit pas le projet. Chaque message binaire (mise à jour
// du document partagé ou présence) reçu d'un participant authentifié est retransmis aux autres.
//
// Sécurité : le port n'est ouvert que pendant la session ; un code à 6 chiffres est exigé avant tout
// échange ; après 5 codes faux en une minute, l'adresse est refusée pendant une minute ; nombre de
// participants et taille des messages limités ; l'hôte peut exclure un participant.
//
// Fin de session : « terminée » (l'hôte clique Terminer : les participants sont prévenus et gardent le
// projet) ou « interrompue » (fermeture de l'application, passage de relais : les participants se
// reconnectent ou un poste de secours prend le relais, voir src/collab/session.ts).
use futures_util::{SinkExt, StreamExt};
use serde::Serialize;
use std::collections::HashMap;
use std::net::{IpAddr, SocketAddr};
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::{mpsc, watch};
use tokio_tungstenite::tungstenite::protocol::WebSocketConfig;
use tokio_tungstenite::tungstenite::Message;

const MAX_PEERS: usize = 16;
const MAX_MESSAGE: usize = 16 * 1024 * 1024;
const HELLO_TIMEOUT: Duration = Duration::from_secs(10);
const MAX_FAILURES: u32 = 5;
const LOCKOUT: Duration = Duration::from_secs(60);

/// État du canal d'arrêt : en cours, terminée par l'hôte, interrompue
const RUNNING: u8 = 0;
const ENDED: u8 = 1;
const INTERRUPTED: u8 = 2;

struct Peer {
    name: String,
    addr: SocketAddr,
    tx: mpsc::UnboundedSender<Message>,
}

/// État partagé d'une session : participants connectés et tentatives de code erronées.
pub struct Hub {
    code: String,
    peers: Mutex<HashMap<u32, Peer>>,
    next_id: AtomicU32,
    failures: Mutex<HashMap<IpAddr, (u32, Instant)>>,
}

impl Hub {
    pub fn new(code: String) -> Arc<Self> {
        Arc::new(Hub { code, peers: Mutex::new(HashMap::new()), next_id: AtomicU32::new(1), failures: Mutex::new(HashMap::new()) })
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
        let mut f = self.failures.lock().unwrap();
        let e = f.entry(ip).or_insert((0, Instant::now()));
        if e.1.elapsed() >= LOCKOUT {
            *e = (0, Instant::now());
        }
        e.0 += 1;
    }

    /// Envoie un message à tous les participants sauf l'expéditeur.
    fn broadcast(&self, from: u32, msg: Message) {
        for (id, p) in self.peers.lock().unwrap().iter() {
            if *id != from {
                let _ = p.tx.send(msg.clone());
            }
        }
    }

    pub fn kick(&self, id: u32) -> bool {
        // Le participant est prévenu (il ne se reconnecte pas), puis retirer l'émetteur ferme la connexion
        match self.peers.lock().unwrap().remove(&id) {
            Some(p) => {
                let _ = p.tx.send(json(serde_json::json!({ "type": "kicked" })));
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
            .map(|(id, p)| PeerInfo { id: *id, name: p.name.clone(), address: p.addr.ip().to_string() })
            .collect();
        v.sort_by_key(|p| p.id);
        v
    }
}

#[derive(Serialize, Clone)]
pub struct PeerInfo {
    id: u32,
    name: String,
    address: String,
}

/// Comparaison en temps constant : la durée ne révèle pas combien de chiffres sont justes.
fn same_code(a: &str, b: &str) -> bool {
    a.len() == b.len() && a.bytes().zip(b.bytes()).fold(0u8, |acc, (x, y)| acc | (x ^ y)) == 0
}

fn json(v: serde_json::Value) -> Message {
    Message::text(v.to_string())
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
    if hub.locked_out(addr.ip()) || hub.peers.lock().unwrap().len() >= MAX_PEERS {
        return;
    }
    let mut config = WebSocketConfig::default();
    config.max_message_size = Some(MAX_MESSAGE);
    config.max_frame_size = Some(MAX_MESSAGE);
    let Ok(ws) = tokio_tungstenite::accept_async_with_config(stream, Some(config)).await else { return };
    let (mut sink, mut source) = ws.split();

    // 1. Présentation : {"type":"hello","code":"123456","name":"…"}
    let hello = match tokio::time::timeout(HELLO_TIMEOUT, source.next()).await {
        Ok(Some(Ok(Message::Text(t)))) => serde_json::from_str::<serde_json::Value>(&t).ok(),
        _ => None,
    };
    let code_ok = hello
        .as_ref()
        .and_then(|h| h.get("code").and_then(|c| c.as_str()))
        .map(|c| same_code(c, &hub.code))
        .unwrap_or(false);
    if !code_ok {
        hub.record_failure(addr.ip());
        let _ = sink.send(json(serde_json::json!({ "type": "refused", "reason": "code" }))).await;
        let _ = sink.close().await;
        return;
    }
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
    let (tx, mut rx) = mpsc::unbounded_channel::<Message>();
    let others = hub.peer_list();
    hub.peers.lock().unwrap().insert(id, Peer { name: name.clone(), addr, tx });
    if sink.send(json(serde_json::json!({ "type": "welcome", "peerId": id, "peers": others }))).await.is_err() {
        hub.peers.lock().unwrap().remove(&id);
        return;
    }
    hub.broadcast(id, json(serde_json::json!({ "type": "peer-joined", "peerId": id, "name": name })));

    // 3. Relais : binaire reçu -> autres participants ; messages des autres -> ce participant
    loop {
        tokio::select! {
            _ = shutdown.changed() => {
                if *shutdown.borrow() == ENDED {
                    let _ = sink.send(json(serde_json::json!({ "type": "ended" }))).await;
                }
                break
            }
            out = rx.recv() => match out {
                Some(m) => if sink.send(m).await.is_err() { break },
                None => break, // exclu par l'hôte
            },
            incoming = source.next() => match incoming {
                Some(Ok(Message::Binary(b))) => hub.broadcast(id, Message::Binary(b)),
                Some(Ok(Message::Ping(p))) => { let _ = sink.send(Message::Pong(p)).await; }
                Some(Ok(Message::Close(_))) | None | Some(Err(_)) => break,
                Some(Ok(_)) => {}
            },
        }
    }
    let _ = sink.close().await;
    hub.peers.lock().unwrap().remove(&id);
    hub.broadcast(id, json(serde_json::json!({ "type": "peer-left", "peerId": id })));
}

struct Running {
    port: u16,
    code: String,
    hub: Arc<Hub>,
    stop: watch::Sender<u8>,
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
    port: u16,
    code: String,
    /// Adresses IPv4 du poste sur le réseau local (ex. 192.168.1.20:4455)
    addresses: Vec<String>,
    peers: Vec<PeerInfo>,
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
    HostInfo { port: r.port, code: r.code.clone(), addresses: local_addresses(r.port), peers: r.hub.peer_list() }
}

fn new_code() -> String {
    use rand::Rng;
    format!("{:06}", rand::rng().random_range(0..1_000_000u32))
}

/// Ouvre une session sur le port demandé (1024 à 65535) et renvoie le code et les adresses à communiquer.
/// code : reprise d'une session existante (retour de l'hôte, poste de secours) ; sinon un nouveau code.
#[tauri::command]
pub async fn collab_host_start(state: tauri::State<'_, CollabServer>, port: u16, code: Option<String>) -> Result<HostInfo, String> {
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
    tauri::async_runtime::spawn(serve(listener, hub.clone(), rx));
    let running = Running { port, code, hub, stop };
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

    async fn start() -> (u16, Arc<Hub>, watch::Sender<u8>) {
        let listener = TcpListener::bind(("127.0.0.1", 0)).await.unwrap();
        let port = listener.local_addr().unwrap().port();
        let hub = Hub::new("123456".into());
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

    async fn join(port: u16, code: &str) -> (tokio_tungstenite::WebSocketStream<tokio_tungstenite::MaybeTlsStream<TcpStream>>, serde_json::Value) {
        let (mut ws, _) = connect_async(format!("ws://127.0.0.1:{port}")).await.unwrap();
        ws.send(json(serde_json::json!({ "type": "hello", "code": code, "name": "Régie\u{7}" }))).await.unwrap();
        let reply = match ws.next().await {
            Some(Ok(Message::Text(t))) => serde_json::from_str(&t).unwrap(),
            other => panic!("réponse inattendue : {other:?}"),
        };
        (ws, reply)
    }

    async fn next_json(ws: &mut tokio_tungstenite::WebSocketStream<tokio_tungstenite::MaybeTlsStream<TcpStream>>) -> serde_json::Value {
        loop {
            if let Some(Ok(Message::Text(t))) = ws.next().await {
                return serde_json::from_str(&t).unwrap();
            }
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
    async fn relaie_les_messages_binaires_entre_participants() {
        let (port, hub, stop) = start().await;
        let (mut a, wa) = join(port, "123456").await;
        assert_eq!(wa["type"], "welcome");
        let (mut b, wb) = join(port, "123456").await;
        assert_eq!(wb["peers"][0]["name"], "Régie", "caractères de contrôle retirés du nom");
        let joined = next_json(&mut a).await;
        assert_eq!(joined["type"], "peer-joined");
        a.send(Message::binary(vec![0u8, 1, 2])).await.unwrap();
        let got = loop {
            if let Some(Ok(Message::Binary(d))) = b.next().await {
                break d;
            }
        };
        assert_eq!(&got[..], &[0, 1, 2]);
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
    async fn interruption_sans_message_de_fin() {
        let (port, _hub, stop) = start().await;
        let (mut a, _) = join(port, "123456").await;
        let _ = stop.send(INTERRUPTED);
        // La connexion se ferme sans « ended » : le participant tentera de se reconnecter
        loop {
            match a.next().await {
                Some(Ok(Message::Text(t))) => assert!(!t.contains("ended"), "pas de fin annoncée"),
                Some(Ok(Message::Close(_))) | None | Some(Err(_)) => break,
                Some(Ok(_)) => {}
            }
        }
    }

    #[test]
    fn code_a_six_chiffres() {
        let c = new_code();
        assert_eq!(c.len(), 6);
        assert!(c.chars().all(|ch| ch.is_ascii_digit()));
        assert!(same_code("123456", "123456"));
        assert!(!same_code("123456", "123457"));
    }
}
