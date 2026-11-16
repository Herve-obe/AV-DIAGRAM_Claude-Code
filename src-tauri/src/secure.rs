// Chiffrement de la collaboration sur le réseau local (protocole 7), côté relais.
// Mêmes règles que src/collab/secure.ts : échange de clé CPace sur ristretto255 protégé par le code
// de session, preuve envoyée par le relais, puis ChaCha20-Poly1305 avec une clé par sens et un
// compteur implicite comme nonce. Les vecteurs de test ci-dessous sont aussi vérifiés côté application.
use chacha20poly1305::aead::{Aead, KeyInit};
use chacha20poly1305::{ChaCha20Poly1305, Key, Nonce};
use curve25519_dalek::ristretto::{CompressedRistretto, RistrettoPoint};
use curve25519_dalek::scalar::Scalar;
use curve25519_dalek::traits::IsIdentity;
use sha2::{Digest, Sha256, Sha512};

/// Contenu d'une trame chiffrée
pub const KIND_TEXT: u8 = 0;
pub const KIND_BINARY: u8 = 1;

pub struct SessionKeys {
    /// Clé invité → relais
    pub client_to_server: [u8; 32],
    /// Clé relais → invité
    pub server_to_client: [u8; 32],
    /// Preuve envoyée par le relais
    pub confirm: [u8; 32],
}

/// Générateur propre au code (élément dérivé RFC 9496 de SHA-512(« AVD-CPace-G-v1 » ‖ code)).
fn generator(code: &str) -> RistrettoPoint {
    let hash: [u8; 64] = Sha512::new().chain_update(b"AVD-CPace-G-v1").chain_update(code.as_bytes()).finalize().into();
    RistrettoPoint::from_uniform_bytes(&hash)
}

fn derive(label: &[u8], isk: &[u8]) -> [u8; 32] {
    Sha256::new().chain_update(label).chain_update(isk).finalize().into()
}

/// Scalaire secret et part publique d'un participant ; `random` (64 octets) est tiré au hasard hors des tests.
pub fn start(code: &str, random: &[u8; 64]) -> Option<(Scalar, [u8; 32])> {
    let scalar = Scalar::from_bytes_mod_order_wide(random);
    if scalar == Scalar::ZERO { return None; }
    Some((scalar, (generator(code) * scalar).compress().to_bytes()))
}

/// Clés de session d'après son scalaire et la part de l'autre ; les deux parts fixent l'ordre (invité, relais).
pub fn keys(scalar: &Scalar, peer_share: &[u8], client_share: &[u8; 32], server_share: &[u8; 32]) -> Option<SessionKeys> {
    let peer: [u8; 32] = peer_share.try_into().ok()?;
    // Encodage non canonique refusé ; la part neutre donnerait un secret nul, refusé aussi
    let k = CompressedRistretto(peer).decompress()? * scalar;
    if k.is_identity() { return None; }
    let isk = Sha512::new().chain_update(b"AVD-CPace-ISK-v1").chain_update(client_share).chain_update(server_share)
        .chain_update(k.compress().as_bytes()).finalize();
    Some(SessionKeys { client_to_server: derive(b"c2s", &isk), server_to_client: derive(b"s2c", &isk), confirm: derive(b"confirm-s", &isk) })
}

/// Réponse du relais à la part de l'invité : sa propre part et les clés de session.
pub fn respond(code: &str, client_share: &[u8], random: &[u8; 64]) -> Option<([u8; 32], SessionKeys)> {
    let client: [u8; 32] = client_share.try_into().ok()?;
    let (scalar, server) = start(code, random)?;
    Some((server, keys(&scalar, &client, &client, &server)?))
}

/// Un sens de la connexion : nonce = 4 octets nuls + compteur sur 8 octets (gros-boutiste).
pub struct Cipher {
    aead: ChaCha20Poly1305,
    counter: u64,
}

impl Cipher {
    pub fn new(key: &[u8; 32]) -> Self {
        Cipher { aead: ChaCha20Poly1305::new(Key::from_slice(key)), counter: 0 }
    }

    fn nonce(&mut self) -> Nonce {
        let mut nonce = [0u8; 12];
        nonce[4..].copy_from_slice(&self.counter.to_be_bytes());
        self.counter += 1;
        *Nonce::from_slice(&nonce)
    }

    pub fn seal(&mut self, kind: u8, payload: &[u8]) -> Vec<u8> {
        let mut plain = Vec::with_capacity(payload.len() + 1);
        plain.push(kind);
        plain.extend_from_slice(payload);
        let nonce = self.nonce();
        self.aead.encrypt(&nonce, plain.as_slice()).expect("chiffrement en mémoire")
    }

    /// None si la trame a été modifiée, rejouée ou n'est pas la suivante attendue.
    pub fn open(&mut self, frame: &[u8]) -> Option<(u8, Vec<u8>)> {
        let nonce = self.nonce();
        let mut plain = self.aead.decrypt(&nonce, frame).ok()?;
        if plain.is_empty() { return None; }
        let kind = plain.remove(0);
        Some((kind, plain))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn hex(bytes: &[u8]) -> String { bytes.iter().map(|b| format!("{b:02x}")).collect() }
    fn unhex(s: &str) -> Vec<u8> { (0..s.len()).step_by(2).map(|i| u8::from_str_radix(&s[i..i + 2], 16).unwrap()).collect() }

    // Vecteurs partagés avec src/collab/secure.test.ts : scalaires tirés de 64 octets 0x01 (invité) et 0x02 (relais)
    const CODE: &str = "123456";
    const CLIENT_SHARE: &str = "d81e41fbf86d63d9857f95330bd723296f2af3861422bff96ddbba600435f86a";
    const SERVER_SHARE: &str = "2c6958bdeb45c9dd409d5b322be87b8af178e857534e3123b828a4d887110c66";
    const KEYS: &str = "195dd4bf813bcae8462c725065819e011f199004457fa8edaa1bed555d3844a1 5faaac10dc6b0299a4d145c5dc943ce208e4e71e141a5ffcbc84a8d5ae9b9765 39db6413837c22fb6712fe1a4c783ef594eb03f6f0c578ff0ddbc788df5dc64d";
    const FRAME: &str = "8bd1f6fce0ebafe2d9a2b007215faccab31dd7232174";

    #[test]
    fn accord_avec_l_application() {
        let (server, keys) = respond(CODE, &unhex(CLIENT_SHARE), &[2u8; 64]).unwrap();
        assert_eq!(hex(&server), SERVER_SHARE);
        assert_eq!(format!("{} {} {}", hex(&keys.client_to_server), hex(&keys.server_to_client), hex(&keys.confirm)), KEYS);
        // Première trame de l'invité : texte « hello », chiffrée avec la clé invité → relais
        let mut incoming = Cipher::new(&keys.client_to_server);
        assert_eq!(incoming.open(&unhex(FRAME)), Some((KIND_TEXT, b"hello".to_vec())));
    }

    #[test]
    fn mauvais_code_ou_trame_alteree_refuses() {
        let (_, right) = respond(CODE, &unhex(CLIENT_SHARE), &[2u8; 64]).unwrap();
        let (_, wrong) = respond("654321", &unhex(CLIENT_SHARE), &[2u8; 64]).unwrap();
        assert_ne!(right.confirm, wrong.confirm);
        let mut frame = unhex(FRAME);
        assert!(Cipher::new(&wrong.client_to_server).open(&frame).is_none());
        frame[0] ^= 1;
        assert!(Cipher::new(&right.client_to_server).open(&frame).is_none());
        // Part neutre ou mal formée
        assert!(respond(CODE, &[0u8; 32], &[2u8; 64]).is_none());
        assert!(respond(CODE, &[0xffu8; 32], &[2u8; 64]).is_none());
        assert!(respond(CODE, &[1u8; 5], &[2u8; 64]).is_none());
    }

    #[test]
    fn rejeu_refuse() {
        let key = [7u8; 32];
        let mut out = Cipher::new(&key);
        let mut inn = Cipher::new(&key);
        let a = out.seal(KIND_BINARY, b"a");
        assert_eq!(inn.open(&a), Some((KIND_BINARY, b"a".to_vec())));
        assert!(inn.open(&a).is_none(), "trame rejouée");
    }
}
