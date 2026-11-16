// Protection des PDF exportés : chiffrement AES-256 (norme PDF 2.0, ISO 32000-2, gestionnaire standard
// V5 / R6), à la place du RC4 de la bibliothèque PDF de l'interface.
//
// Deux usages :
// - droits seuls (sans mot de passe d'ouverture) : le PDF s'ouvre partout, la modification et la
//   copie sont interdites dans les lecteurs qui respectent les droits ; comme la clé se déduit du mot
//   de passe vide, c'est une dissuasion, quel que soit l'algorithme ;
// - avec mot de passe d'ouverture : le contenu est réellement illisible sans lui (AES-256, clé dérivée
//   par SHA-256/384/512 répétés selon la norme).
use lopdf::encryption::crypt_filters::{Aes256CryptFilter, CryptFilter};
use lopdf::encryption::{EncryptionState, EncryptionVersion, Permissions};
use lopdf::Document;
use rand::Rng;
use std::collections::BTreeMap;
use std::sync::Arc;

pub struct Protection<'a> {
    /// Mot de passe d'ouverture ; vide : le PDF s'ouvre sans mot de passe
    pub user_password: &'a str,
    /// Mot de passe propriétaire (lever les restrictions) ; vide : mot de passe aléatoire, inconnu de tous
    pub owner_password: &'a str,
    pub allow_print: bool,
    pub allow_copy: bool,
    pub allow_modify: bool,
}

fn random_password() -> String {
    let mut b = [0u8; 24];
    rand::rng().fill(&mut b);
    b.iter().map(|x| format!("{x:02x}")).collect()
}

/// Chiffre un PDF en AES-256 et renvoie le nouveau fichier.
pub fn protect(pdf: &[u8], p: &Protection) -> Result<Vec<u8>, String> {
    let mut doc = Document::load_mem(pdf).map_err(|e| format!("PDF illisible : {e}"))?;
    if doc.is_encrypted() {
        return Err("PDF déjà chiffré".into());
    }
    let mut perms = Permissions::empty();
    if p.allow_print {
        perms |= Permissions::PRINTABLE | Permissions::PRINTABLE_IN_HIGH_QUALITY;
    }
    if p.allow_copy {
        perms |= Permissions::COPYABLE;
    }
    if p.allow_modify {
        perms |= Permissions::MODIFIABLE | Permissions::ANNOTABLE | Permissions::FILLABLE | Permissions::ASSEMBLABLE;
    }
    // Lecture d'écran toujours permise (accessibilité)
    perms |= Permissions::COPYABLE_FOR_ACCESSIBILITY;

    let owner = if p.owner_password.is_empty() { random_password() } else { p.owner_password.to_string() };
    let mut key = [0u8; 32];
    rand::rng().fill(&mut key);
    let filter: Arc<dyn CryptFilter> = Arc::new(Aes256CryptFilter);
    let version = EncryptionVersion::V5 {
        encrypt_metadata: true,
        crypt_filters: BTreeMap::from([(b"StdCF".to_vec(), filter)]),
        file_encryption_key: &key,
        stream_filter: b"StdCF".to_vec(),
        string_filter: b"StdCF".to_vec(),
        owner_password: &owner,
        user_password: p.user_password,
        permissions: perms,
    };
    let state = EncryptionState::try_from(version).map_err(|e| format!("chiffrement : {e}"))?;
    doc.encrypt(&state).map_err(|e| format!("chiffrement : {e}"))?;
    harden_for_readers(&mut doc);
    // AES-256 (R6) est défini par PDF 2.0 ; les lecteurs actuels l'acceptent dans un fichier 1.7
    doc.version = "1.7".into();
    let mut out = Vec::new();
    doc.save_to(&mut out).map_err(|e| format!("écriture : {e}"))?;
    Ok(out)
}

/// Compléments facultatifs selon la norme, attendus par certains lecteurs (Poppler) : longueur de clé
/// du filtre (32 octets), événement d'authentification, et identifiant de fichier dans la fin de fichier.
fn harden_for_readers(doc: &mut Document) {
    use lopdf::Object;
    if let Ok(Object::Reference(id)) = doc.trailer.get(b"Encrypt").cloned() {
        if let Ok(Object::Dictionary(enc)) = doc.get_object_mut(id) {
            if let Ok(Object::Dictionary(cf)) = enc.get_mut(b"CF") {
                if let Ok(Object::Dictionary(std)) = cf.get_mut(b"StdCF") {
                    std.set("Length", 32);
                    std.set("AuthEvent", Object::Name(b"DocOpen".to_vec()));
                }
            }
        }
    }
    if doc.trailer.get(b"ID").is_err() {
        let mut id = [0u8; 16];
        rand::rng().fill(&mut id);
        let s = Object::String(id.to_vec(), lopdf::StringFormat::Hexadecimal);
        doc.trailer.set("ID", Object::Array(vec![s.clone(), s]));
    }
}

/// Commande : corps de la requête = PDF ; en-têtes = options. Réponse = PDF chiffré.
#[tauri::command]
pub fn pdf_protect(request: tauri::ipc::Request) -> Result<tauri::ipc::Response, String> {
    let tauri::ipc::InvokeBody::Raw(pdf) = request.body() else {
        return Err("PDF attendu".into());
    };
    let h = request.headers();
    let get = |k: &str| h.get(k).and_then(|v| v.to_str().ok()).map(percent_decode).unwrap_or_default();
    let flag = |k: &str| get(k) == "1";
    let user = get("x-user-password");
    let owner = get("x-owner-password");
    let out = protect(
        pdf,
        &Protection { user_password: &user, owner_password: &owner, allow_print: flag("x-allow-print"), allow_copy: flag("x-allow-copy"), allow_modify: flag("x-allow-modify") },
    )?;
    Ok(tauri::ipc::Response::new(out))
}

/// Les en-têtes HTTP ne portent que de l'ASCII : les mots de passe sont encodés côté interface.
fn percent_decode(s: &str) -> String {
    let b = s.as_bytes();
    let mut out = Vec::with_capacity(b.len());
    let mut i = 0;
    while i < b.len() {
        if b[i] == b'%' && i + 2 < b.len() {
            if let Ok(v) = u8::from_str_radix(&s[i + 1..i + 3], 16) {
                out.push(v);
                i += 3;
                continue;
            }
        }
        out.push(b[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

#[cfg(test)]
mod tests {
    use super::*;
    use lopdf::dictionary;
    use lopdf::{Object, Stream};

    fn sample() -> Vec<u8> {
        let mut doc = Document::with_version("1.4");
        let pages_id = doc.new_object_id();
        let content = Stream::new(dictionary! {}, b"BT /F1 12 Tf 72 712 Td (Synoptique confidentiel) Tj ET".to_vec());
        let content_id = doc.add_object(content);
        let font_id = doc.add_object(dictionary! { "Type" => "Font", "Subtype" => "Type1", "BaseFont" => "Helvetica" });
        let page_id = doc.add_object(dictionary! {
            "Type" => "Page", "Parent" => pages_id, "Contents" => content_id,
            "Resources" => dictionary! { "Font" => dictionary! { "F1" => font_id } },
            "MediaBox" => vec![0.into(), 0.into(), 595.into(), 842.into()],
        });
        doc.objects.insert(pages_id, Object::Dictionary(dictionary! { "Type" => "Pages", "Kids" => vec![page_id.into()], "Count" => 1 }));
        let catalog = doc.add_object(dictionary! { "Type" => "Catalog", "Pages" => pages_id });
        doc.trailer.set("Root", catalog);
        let mut out = Vec::new();
        doc.save_to(&mut out).unwrap();
        out
    }

    #[test]
    fn aes256_avec_mot_de_passe_d_ouverture() {
        let out = protect(&sample(), &Protection { user_password: "Régie-2026", owner_password: "", allow_print: true, allow_copy: false, allow_modify: false }).unwrap();
        // Texte en clair absent du fichier
        assert!(!out.windows(11).any(|w| w == b"Synoptique "));
        let mut doc = Document::load_mem(&out).unwrap();
        assert!(doc.is_encrypted());
        let enc = doc.get_encrypted().unwrap();
        assert_eq!(enc.get(b"V").unwrap().as_i64().unwrap(), 5);
        assert_eq!(enc.get(b"R").unwrap().as_i64().unwrap(), 6);
        assert!(doc.decrypt("mauvais").is_err());
        assert!(doc.decrypt("Régie-2026").is_ok());
    }

    #[test]
    fn droits_seuls_sans_mot_de_passe() {
        let out = protect(&sample(), &Protection { user_password: "", owner_password: "", allow_print: true, allow_copy: false, allow_modify: false }).unwrap();
        // Le lecteur ouvre le fichier sans mot de passe (déchiffrement automatique avec le mot de passe vide)
        let doc = Document::load_mem(&out).unwrap();
        assert!(doc.get_object((1, 0)).is_ok());
        // Droits lus dans le dictionnaire /Encrypt du fichier : /P
        let text = String::from_utf8_lossy(&out);
        let at = text.find("/P ").expect("droits /P");
        let p: i64 = text[at + 3..].split(|c: char| !(c == '-' || c.is_ascii_digit())).next().unwrap().parse().unwrap();
        let p = p as u32;
        assert!(p & (1 << 2) != 0, "impression permise");
        assert!(p & (1 << 4) == 0, "copie interdite");
        assert!(p & (1 << 3) == 0, "modification interdite");
        assert!(text.contains("/AESV3"), "AES-256");
        // Contrôle avec un lecteur externe : AVD_PDF_OUT=/chemin/fichier.pdf
        if let Ok(path) = std::env::var("AVD_PDF_OUT") {
            std::fs::write(path, &out).unwrap();
        }
    }

    #[test]
    fn decodage_des_mots_de_passe() {
        assert_eq!(percent_decode("R%C3%A9gie%2026"), "Régie 26");
        assert_eq!(percent_decode("abc%"), "abc%");
    }
}
