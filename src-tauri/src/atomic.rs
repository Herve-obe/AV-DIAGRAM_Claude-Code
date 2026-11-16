// Enregistrement atomique d'un fichier texte (projet .avd) : le contenu est écrit dans un fichier
// temporaire du même dossier, synchronisé sur le disque, puis renommé sur la cible. Une coupure pendant
// l'écriture laisse donc l'ancien fichier intact, jamais un projet tronqué.
// Le plugin fs ne peut pas créer de fichier voisin (la portée accordée par la fenêtre système couvre
// souvent le seul fichier choisi) : la partie native le fait, après avoir vérifié elle-même que la cible
// est dans la portée du plugin fs.
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use tauri_plugin_fs::FsExt;

/// Taille maximale d'un projet, identique à MAX_PROJECT_BYTES de src/io/files.ts
const MAX_BYTES: usize = 200_000_000;

/// Chemin du fichier temporaire voisin : même dossier (le renommage reste sur le même volume).
fn temp_path(target: &Path) -> PathBuf {
    let name = target.file_name().and_then(|n| n.to_str()).unwrap_or("projet");
    target.with_file_name(format!(".{name}.{:016x}.tmp", rand::random::<u64>()))
}

/// Écrit `content` dans `target` de façon atomique. Ne vérifie pas la portée (voir la commande).
pub(crate) fn write_atomic(target: &Path, content: &[u8]) -> Result<(), String> {
    if !target.is_absolute() { return Err("chemin non absolu".into()); }
    if content.len() > MAX_BYTES { return Err("fichier trop volumineux".into()); }
    if target.file_name().is_none() || target.is_dir() { return Err("chemin invalide".into()); }
    let tmp = temp_path(target);
    let result = (|| -> std::io::Result<()> {
        // create_new : jamais un fichier existant ni un lien symbolique déposé à l'avance
        let mut file = OpenOptions::new().write(true).create_new(true).open(&tmp)?;
        file.write_all(content)?;
        file.sync_all()?;
        drop(file);
        fs::rename(&tmp, target)
    })();
    if let Err(e) = result {
        let _ = fs::remove_file(&tmp);
        return Err(format!("enregistrement impossible : {e}"));
    }
    Ok(())
}

#[tauri::command]
pub fn save_text_atomic(app: tauri::AppHandle, path: String, content: String) -> Result<(), String> {
    let target = PathBuf::from(&path);
    if !target.is_absolute() { return Err("chemin non absolu".into()); }
    if !app.fs_scope().is_allowed(&target) { return Err("chemin non autorisé".into()); }
    write_atomic(&target, content.as_bytes())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn dossier(nom: &str) -> PathBuf {
        let d = std::env::temp_dir().join(format!("avd-atomic-{nom}-{}-{:08x}", std::process::id(), rand::random::<u32>()));
        fs::create_dir_all(&d).unwrap();
        d
    }

    fn fichiers(d: &Path) -> Vec<String> {
        let mut v: Vec<String> = fs::read_dir(d).unwrap().map(|e| e.unwrap().file_name().to_string_lossy().into_owned()).collect();
        v.sort();
        v
    }

    #[test]
    fn ecrit_un_nouveau_fichier() {
        let d = dossier("nouveau");
        let f = d.join("a.avd");
        write_atomic(&f, "bonjour é".as_bytes()).unwrap();
        assert_eq!(fs::read_to_string(&f).unwrap(), "bonjour é");
        assert_eq!(fichiers(&d), ["a.avd"], "aucun temporaire ne reste");
        fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn remplace_un_fichier_existant() {
        let d = dossier("remplace");
        let f = d.join("a.avd");
        fs::write(&f, "ancien contenu bien plus long que le nouveau").unwrap();
        write_atomic(&f, b"nouveau").unwrap();
        assert_eq!(fs::read_to_string(&f).unwrap(), "nouveau");
        assert_eq!(fichiers(&d), ["a.avd"]);
        fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn nettoie_le_temporaire_et_garde_l_ancien_en_cas_d_echec() {
        let d = dossier("echec");
        // Cible = dossier non vide : le renommage échoue après l'écriture du temporaire
        let f = d.join("cible");
        fs::create_dir(&f).unwrap();
        fs::write(f.join("x"), "x").unwrap();
        assert!(write_atomic(&f, b"contenu").is_err());
        assert_eq!(fichiers(&d), ["cible"], "temporaire supprimé");
        // Dossier parent absent : le temporaire ne peut pas être créé
        assert!(write_atomic(&d.join("absent").join("a.avd"), b"x").is_err());
        fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn refuse_un_chemin_relatif_et_un_contenu_trop_gros() {
        assert_eq!(write_atomic(Path::new("a.avd"), b"x").unwrap_err(), "chemin non absolu");
        assert_eq!(write_atomic(Path::new("../a.avd"), b"x").unwrap_err(), "chemin non absolu");
        let d = dossier("gros");
        assert_eq!(write_atomic(&d.join("a.avd"), &vec![0u8; MAX_BYTES + 1]).unwrap_err(), "fichier trop volumineux");
        assert!(fichiers(&d).is_empty());
        fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn le_temporaire_est_voisin_et_unique() {
        let t = Path::new("/p/projet.avd");
        let (a, b) = (temp_path(t), temp_path(t));
        assert_eq!(a.parent(), t.parent());
        assert_ne!(a, b);
        assert!(a.to_string_lossy().ends_with(".tmp"));
    }
}
