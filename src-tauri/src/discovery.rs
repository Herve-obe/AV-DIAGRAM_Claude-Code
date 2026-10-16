// Découverte IPv4 sur le LAN : annonce du nom de session uniquement, jamais du code ni d'un secret.
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, net::{Ipv4Addr, SocketAddr}, time::{Duration, Instant}};
use tokio::{net::UdpSocket, sync::watch};

const PORT: u16 = 4456;
const PREFIX: &str = "AV-DIAGRAM-DISCOVERY/1 ";
const MAX_PACKET: usize = 1024;

fn random_id() -> String {
    rand::random::<[u8; 16]>().iter().map(|b| format!("{b:02x}")).collect()
}
fn label(value: Option<String>, max: usize) -> String {
    let text: String = value.unwrap_or_default().chars().filter(|c| !c.is_control()).take(max).collect();
    if text.trim().is_empty() { "AV Diagram".into() } else { text.trim().into() }
}
fn interfaces() -> Vec<if_addrs::Ifv4Addr> {
    if_addrs::get_if_addrs().unwrap_or_default().into_iter().filter_map(|i| {
        if i.is_loopback() { return None; }
        match i.addr { if_addrs::IfAddr::V4(v) => Some(v), _ => None }
    }).collect()
}
fn local_sender(source: SocketAddr, nets: &[if_addrs::Ifv4Addr]) -> bool {
    let std::net::IpAddr::V4(ip) = source.ip() else { return false };
    ip.is_loopback() || nets.iter().any(|n| n.netmask != Ipv4Addr::UNSPECIFIED && (u32::from(ip) & u32::from(n.netmask)) == (u32::from(n.ip) & u32::from(n.netmask)))
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Advertisement {
    id: String,
    port: u16,
    session_name: String,
    host_name: String,
}
impl Advertisement {
    pub fn new(port: u16, session_name: Option<String>, host_name: Option<String>) -> Self {
        Self { id: random_id(), port, session_name: label(session_name, 80), host_name: label(host_name, 40) }
    }
}
#[derive(Serialize, Deserialize)]
struct Reply {
    protocol: u8,
    nonce: String,
    #[serde(flatten)]
    session: Advertisement,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveredSession {
    id: String,
    address: String,
    session_name: String,
    host_name: String,
}

fn nonce(packet: &[u8]) -> Option<&str> {
    let value = std::str::from_utf8(packet).ok()?.strip_prefix(PREFIX)?;
    (value.len() == 32 && value.bytes().all(|c| c.is_ascii_hexdigit())).then_some(value)
}
fn response(packet: &[u8], source: SocketAddr, expected: &str) -> Option<DiscoveredSession> {
    if packet.len() > MAX_PACKET { return None; }
    let reply: Reply = serde_json::from_slice(packet).ok()?;
    let s = reply.session;
    if reply.protocol != 1 || reply.nonce != expected || s.port < 1024 || s.id.len() != 32
        || !s.id.bytes().all(|c| c.is_ascii_hexdigit()) || s.session_name.chars().count() > 80
        || s.host_name.chars().count() > 40 || s.session_name.trim().is_empty() || s.host_name.trim().is_empty()
        || s.session_name.chars().chain(s.host_name.chars()).any(char::is_control) { return None; }
    Some(DiscoveredSession { id: s.id, address: format!("{}:{}", source.ip(), s.port), session_name: s.session_name, host_name: s.host_name })
}

pub async fn advertise(ad: Advertisement, shutdown: watch::Receiver<u8>) -> bool {
    let Ok(socket) = UdpSocket::bind((Ipv4Addr::UNSPECIFIED, PORT)).await else { return false };
    tauri::async_runtime::spawn(serve(socket, ad, shutdown));
    true
}
async fn serve(socket: UdpSocket, ad: Advertisement, mut shutdown: watch::Receiver<u8>) {
    let nets = interfaces();
    let mut buffer = [0; MAX_PACKET + 1];
    let mut recent = HashMap::<std::net::IpAddr, Instant>::new();
    loop {
        tokio::select! {
            _ = shutdown.changed() => break,
            received = socket.recv_from(&mut buffer) => {
                let Ok((length, source)) = received else { break };
                if !local_sender(source, &nets) { continue; }
                let Some(nonce) = nonce(&buffer[..length]) else { continue };
                recent.retain(|_, at| at.elapsed() < Duration::from_secs(1));
                if recent.len() >= 64 || recent.get(&source.ip()).is_some_and(|at| at.elapsed() < Duration::from_millis(500)) { continue; }
                recent.insert(source.ip(), Instant::now());
                let reply = Reply { protocol: 1, nonce: nonce.into(), session: ad.clone() };
                if let Ok(bytes) = serde_json::to_vec(&reply) { let _ = socket.send_to(&bytes, source).await; }
            }
        }
    }
}

async fn scan(targets: &[SocketAddr], duration: Duration) -> Result<Vec<DiscoveredSession>, String> {
    let socket = UdpSocket::bind((Ipv4Addr::UNSPECIFIED, 0)).await.map_err(|_| "discovery unavailable")?;
    socket.set_broadcast(true).map_err(|_| "discovery unavailable")?;
    let id = random_id();
    let query = format!("{PREFIX}{id}");
    let nets = interfaces();
    let deadline = tokio::time::Instant::now() + duration;
    let mut retry = tokio::time::interval(Duration::from_millis(800));
    let mut found = HashMap::new();
    let mut buffer = [0; MAX_PACKET + 1];
    loop {
        tokio::select! {
            _ = tokio::time::sleep_until(deadline) => break,
            _ = retry.tick() => { for target in targets { let _ = socket.send_to(query.as_bytes(), target).await; } },
            received = socket.recv_from(&mut buffer) => {
                let Ok((length, source)) = received else { break };
                if !local_sender(source, &nets) { continue; }
                if let Some(session) = response(&buffer[..length], source, &id) {
                    if found.len() < 32 { found.entry(session.id.clone()).or_insert(session); }
                }
            }
        }
    }
    let mut sessions: Vec<DiscoveredSession> = found.into_values().collect();
    sessions.sort_by(|a, b| a.session_name.cmp(&b.session_name).then(a.id.cmp(&b.id)));
    Ok(sessions)
}

#[tauri::command]
pub async fn collab_discover() -> Result<Vec<DiscoveredSession>, String> {
    let mut targets = vec![SocketAddr::from((Ipv4Addr::BROADCAST, PORT)), SocketAddr::from((Ipv4Addr::LOCALHOST, PORT))];
    for interface in interfaces() {
        if let Some(broadcast) = interface.broadcast { targets.push(SocketAddr::from((broadcast, PORT))); }
    }
    targets.sort(); targets.dedup();
    scan(&targets, Duration::from_millis(2500)).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn refuse_les_reponses_non_sollicitees_ou_malformees() {
        let source = "127.0.0.1:4456".parse().unwrap();
        let mut reply = Reply { protocol: 1, nonce: "a".repeat(32), session: Advertisement::new(4455, Some("Concert".into()), Some("Régie".into())) };
        let bytes = serde_json::to_vec(&reply).unwrap();
        assert!(response(&bytes, source, &reply.nonce).is_some());
        assert!(response(&bytes, source, "autre recherche").is_none());
        assert!(response(&vec![b' '; MAX_PACKET + 1], source, &reply.nonce).is_none());
        reply.session.port = 80;
        assert!(response(&serde_json::to_vec(&reply).unwrap(), source, &reply.nonce).is_none());
        assert!(nonce(b"autre logiciel").is_none());
        assert!(!String::from_utf8(bytes).unwrap().contains("code"));
    }

    #[tokio::test]
    async fn decouvre_plusieurs_hotes_sans_doublons_puis_arrete_les_annonces() {
        let mut targets = vec![];
        let mut stops = vec![];
        let mut tasks = vec![];
        for name in ["Concert", "Studio"] {
            let socket = UdpSocket::bind("127.0.0.1:0").await.unwrap();
            let address = socket.local_addr().unwrap();
            targets.extend([address, address]);
            let (tx, rx) = watch::channel(0);
            stops.push(tx);
            tasks.push(tokio::spawn(serve(socket, Advertisement::new(4455, Some(name.into()), Some("Hôte".into())), rx)));
        }
        let sessions = scan(&targets, Duration::from_millis(200)).await.unwrap();
        assert_eq!(sessions.len(), 2);
        assert_eq!(sessions[0].session_name, "Concert");
        assert_eq!(sessions[0].address, "127.0.0.1:4455");
        for stop in stops { stop.send(1).unwrap(); }
        for task in tasks { task.await.unwrap(); }
        assert!(scan(&targets, Duration::from_millis(100)).await.unwrap().is_empty());
    }

    #[test]
    fn limite_les_annonces_aux_interfaces_locales() {
        assert!(local_sender("127.0.0.1:1234".parse().unwrap(), &[]));
        assert!(!local_sender("8.8.8.8:1234".parse().unwrap(), &[]));
        let ad = Advertisement::new(4455, Some("\nConcert\t".into()), None);
        assert_eq!(ad.session_name, "Concert");
        assert_eq!(ad.host_name, "AV Diagram");
    }
}
