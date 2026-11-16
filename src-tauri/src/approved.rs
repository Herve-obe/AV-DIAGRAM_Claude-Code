// Programmes externes approuvés : llama-server (IA locale) et ODAFileConverter (import DWG).
// L'interface ne fournit plus un chemin à lancer : elle demande à la partie native d'ouvrir elle-même la
// fenêtre de sélection du système (`program_choose`). Le fichier choisi est validé, puis son chemin
// canonique est mémorisé dans une liste d'approbation écrite uniquement par ce module (JSON dans
// `app_local_data_dir`). `local_start` et `dwg_to_dxf` refusent tout chemin absent de cette liste
// (code d'erreur `not-approved`) : une page ou un script de l'interface ne peut pas faire lancer un
// exécutable que l'utilisateur n'a pas désigné dans la fenêtre du système.
// Un chemin enregistré par une version précédente n'est pas dans la liste : l'interface demande alors de
// choisir à nouveau le programme.
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

/// Code d'erreur : le programme n'a pas été choisi dans la fenêtre native de cette installation
pub const NOT_APPROVED: &str = "not-approved";
/// Code d'erreur : le fichier choisi n'est pas le programme attendu
pub const INVALID_PROGRAM: &str = "invalid-program";

const FILE_NAME: &str = "approved-programs.json";
/// Nombre de chemins gardés par programme (les plus anciens sont oubliés)
const MAX_PER_KIND: usize = 16;
/// Une liste plus grosse n'a pas pu être écrite par ce module : elle est ignorée
const MAX_LIST_BYTES: u64 = 1_000_000;

/// Écritures de la liste sérialisées (lecture, ajout, remplacement)
static WRITE: Mutex<()> = Mutex::new(());

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Kind {
    LlamaServer,
    Oda,
}

impl Kind {
    fn id(self) -> &'static str {
        match self { Kind::LlamaServer => "llama-server", Kind::Oda => "oda" }
    }

    fn parse(id: &str) -> Option<Kind> {
        [Kind::LlamaServer, Kind::Oda].into_iter().find(|k| k.id() == id)
    }

    /// Valide le fichier choisi et renvoie son chemin canonique
    fn validate(self, path: &Path) -> Result<PathBuf, String> {
        match self {
            Kind::Oda => crate::dwg::checked_converter(path).map_err(|_| INVALID_PROGRAM.to_string()),
            Kind::LlamaServer => {
                if !path.is_absolute() { return Err(INVALID_PROGRAM.into()); }
                let actual = path.canonicalize().map_err(|_| INVALID_PROGRAM.to_string())?;
                crate::local::check_server_binary(&actual).map_err(|_| INVALID_PROGRAM.to_string())?;
                Ok(actual)
            }
        }
    }
}

#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
struct Entry {
    kind: String,
    path: String,
}

#[derive(Serialize, Deserialize, Default)]
struct List {
    version: u32,
    programs: Vec<Entry>,
}

/// Liste lue sur le disque ; absente, illisible, trop grosse ou corrompue : liste vide.
fn read_list(file: &Path) -> Vec<Entry> {
    let Ok(meta) = fs::metadata(file) else { return Vec::new() };
    if !meta.is_file() || meta.len() > MAX_LIST_BYTES { return Vec::new(); }
    let Ok(text) = fs::read_to_string(file) else { return Vec::new() };
    serde_json::from_str::<List>(&text).map(|l| l.programs).unwrap_or_default()
}

fn key(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}

fn is_approved(file: &Path, kind: Kind, canonical: &Path) -> bool {
    let wanted = key(canonical);
    read_list(file).iter().any(|e| e.kind == kind.id() && e.path == wanted)
}

fn approve(file: &Path, kind: Kind, canonical: &Path) -> Result<(), String> {
    let _guard = WRITE.lock().unwrap_or_else(|e| e.into_inner());
    let mut programs = read_list(file);
    let entry = Entry { kind: kind.id().into(), path: key(canonical) };
    programs.retain(|e| *e != entry);
    programs.push(entry);
    // Au-delà du plafond, les approbations les plus anciennes de ce programme sont oubliées
    let same = programs.iter().filter(|e| e.kind == kind.id()).count();
    for _ in MAX_PER_KIND..same {
        if let Some(i) = programs.iter().position(|e| e.kind == kind.id()) { programs.remove(i); }
    }
    let text = serde_json::to_string_pretty(&List { version: 1, programs }).map_err(|e| e.to_string())?;
    if let Some(dir) = file.parent() { fs::create_dir_all(dir).map_err(|e| format!("enregistrement impossible : {e}"))?; }
    crate::atomic::write_atomic(file, text.as_bytes())
}

/// Chemin affiché et renvoyé à l'interface : sans le préfixe `\\?\` des chemins canoniques Windows.
fn display(path: &Path) -> String {
    let text = key(path);
    match text.strip_prefix(r"\\?\") {
        Some(rest) if !rest.starts_with("UNC\\") => rest.to_string(),
        _ => text,
    }
}

/// Chemin canonique d'un chemin fourni par l'interface (absolu, existant)
fn canonical(path: &str) -> Result<PathBuf, String> {
    let p = Path::new(path);
    if !p.is_absolute() { return Err(NOT_APPROVED.into()); }
    p.canonicalize().map_err(|_| NOT_APPROVED.to_string())
}

/// Chemin canonique du programme, à condition qu'il ait été choisi dans la fenêtre native.
fn require_in(file: &Path, kind: Kind, path: &str) -> Result<PathBuf, String> {
    let actual = canonical(path)?;
    if is_approved(file, kind, &actual) { Ok(actual) } else { Err(NOT_APPROVED.into()) }
}

fn list_file(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app.path().app_local_data_dir().map_err(|_| "storage")?.join(FILE_NAME))
}

/// Vérifie l'approbation d'un chemin fourni par l'interface avant de lancer le programme.
pub fn require(app: &tauri::AppHandle, kind: Kind, path: &str) -> Result<PathBuf, String> {
    require_in(&list_file(app)?, kind, path)
}

/// Valide le fichier choisi, l'approuve et renvoie le chemin à mémoriser côté interface.
fn choose_from(file: &Path, kind: Kind, picked: &Path) -> Result<String, String> {
    let actual = kind.validate(picked)?;
    approve(file, kind, &actual)?;
    Ok(display(&actual))
}

/// Ouvre la fenêtre de sélection du système, valide et approuve le programme choisi.
/// `kind` : « llama-server » ou « oda ». Renvoie null si l'utilisateur annule.
#[tauri::command]
pub async fn program_choose(app: tauri::AppHandle, kind: String, title: Option<String>) -> Result<Option<String>, String> {
    let kind = Kind::parse(&kind).ok_or("kind")?;
    let file = list_file(&app)?;
    tauri::async_runtime::spawn_blocking(move || {
        let mut dialog = app.dialog().file();
        if let Some(t) = title { dialog = dialog.set_title(t); }
        #[cfg(windows)]
        { dialog = dialog.add_filter("exe", &["exe"]); }
        let Some(picked) = dialog.blocking_pick_file() else { return Ok(None) };
        let path = picked.into_path().map_err(|_| INVALID_PROGRAM.to_string())?;
        choose_from(&file, kind, &path).map(Some)
    })
    .await
    .map_err(|_| "storage".to_string())?
}

/// Le chemin mémorisé par l'interface est-il encore approuvé ? (versions précédentes : non)
#[tauri::command]
pub fn program_is_approved(app: tauri::AppHandle, kind: String, path: String) -> bool {
    Kind::parse(&kind).is_some_and(|k| require(&app, k, &path).is_ok())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn dossier(nom: &str) -> PathBuf {
        let d = std::env::temp_dir().join(format!("avd-approved-{nom}-{}-{:08x}", std::process::id(), rand::random::<u32>()));
        fs::create_dir_all(&d).unwrap();
        d.canonicalize().unwrap()
    }

    fn faux_programme(dir: &Path, name: &str) -> PathBuf {
        let f = dir.join(name);
        fs::write(&f, b"fixture, jamais lancee").unwrap();
        f
    }

    const LLAMA: &str = if cfg!(windows) { "llama-server.exe" } else { "llama-server" };
    const ODA: &str = if cfg!(windows) { "ODAFileConverter.exe" } else { "ODAFileConverter" };

    #[test]
    fn un_chemin_non_approuve_est_refuse() {
        let d = dossier("refus");
        let liste = d.join("liste.json");
        let prog = faux_programme(&d, LLAMA);
        assert_eq!(require_in(&liste, Kind::LlamaServer, &prog.to_string_lossy()).unwrap_err(), NOT_APPROVED);
        // Un chemin relatif ou inexistant est refusé de la même façon
        assert_eq!(require_in(&liste, Kind::LlamaServer, "llama-server").unwrap_err(), NOT_APPROVED);
        assert_eq!(require_in(&liste, Kind::LlamaServer, &d.join("absent").to_string_lossy()).unwrap_err(), NOT_APPROVED);
        fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn un_chemin_approuve_est_accepte_pour_son_programme_seulement() {
        let d = dossier("accepte");
        let liste = d.join("liste.json");
        let prog = faux_programme(&d, LLAMA);
        let shown = choose_from(&liste, Kind::LlamaServer, &prog).unwrap();
        assert_eq!(require_in(&liste, Kind::LlamaServer, &shown).unwrap(), prog);
        // Approuvé comme llama-server : pas utilisable comme convertisseur
        assert_eq!(require_in(&liste, Kind::Oda, &shown).unwrap_err(), NOT_APPROVED);
        // Un autre fichier du même dossier reste refusé
        let autre = faux_programme(&d, "autre");
        assert_eq!(require_in(&liste, Kind::LlamaServer, &autre.to_string_lossy()).unwrap_err(), NOT_APPROVED);
        fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn le_convertisseur_est_valide_et_approuve_comme_le_serveur() {
        let d = dossier("oda");
        let liste = d.join("liste.json");
        assert_eq!(choose_from(&liste, Kind::Oda, &faux_programme(&d, "notepad")).unwrap_err(), INVALID_PROGRAM);
        let oda = faux_programme(&d, ODA);
        let shown = choose_from(&liste, Kind::Oda, &oda).unwrap();
        assert!(require_in(&liste, Kind::Oda, &shown).is_ok());
        fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn un_fichier_qui_n_est_pas_le_bon_programme_n_est_pas_approuve() {
        let d = dossier("invalide");
        let liste = d.join("liste.json");
        assert_eq!(choose_from(&liste, Kind::LlamaServer, &faux_programme(&d, "sh")).unwrap_err(), INVALID_PROGRAM);
        assert_eq!(choose_from(&liste, Kind::LlamaServer, Path::new("llama-server")).unwrap_err(), INVALID_PROGRAM);
        assert_eq!(choose_from(&liste, Kind::LlamaServer, &d.join(LLAMA)).unwrap_err(), INVALID_PROGRAM, "fichier absent");
        assert!(!liste.exists(), "rien n'est écrit pour un refus");
        fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn la_liste_est_relue_apres_un_redemarrage() {
        let d = dossier("relecture");
        let liste = d.join("sous").join("liste.json");
        let prog = faux_programme(&d, LLAMA);
        choose_from(&liste, Kind::LlamaServer, &prog).unwrap();
        // « Redémarrage » : aucun état en mémoire, seule la liste sur disque compte
        assert!(is_approved(&liste, Kind::LlamaServer, &prog));
        let dedoublee = faux_programme(&dossier("autre"), LLAMA);
        choose_from(&liste, Kind::LlamaServer, &dedoublee).unwrap();
        choose_from(&liste, Kind::LlamaServer, &prog).unwrap();
        assert_eq!(read_list(&liste).len(), 2, "pas de doublon");
        assert!(is_approved(&liste, Kind::LlamaServer, &prog) && is_approved(&liste, Kind::LlamaServer, &dedoublee));
        fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn une_liste_corrompue_est_traitee_comme_vide_puis_remplacee() {
        let d = dossier("corrompu");
        let liste = d.join("liste.json");
        let prog = faux_programme(&d, LLAMA);
        for contenu in ["", "pas du json", "{\"version\":1,\"programs\":42}", "[1,2,3]", "{\"version\":1}"] {
            fs::write(&liste, contenu).unwrap();
            assert!(read_list(&liste).is_empty(), "{contenu}");
            assert!(!is_approved(&liste, Kind::LlamaServer, &prog));
        }
        fs::write(&liste, vec![b'x'; MAX_LIST_BYTES as usize + 1]).unwrap();
        assert!(read_list(&liste).is_empty(), "liste démesurée ignorée");
        // Un nouveau choix répare le fichier
        choose_from(&liste, Kind::LlamaServer, &prog).unwrap();
        assert!(is_approved(&liste, Kind::LlamaServer, &prog));
        fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn la_liste_est_bornee_par_programme() {
        let d = dossier("borne");
        let liste = d.join("liste.json");
        let mut premiers = None;
        for n in 0..MAX_PER_KIND + 3 {
            let dir = d.join(format!("v{n}"));
            fs::create_dir_all(&dir).unwrap();
            let p = faux_programme(&dir, LLAMA);
            choose_from(&liste, Kind::LlamaServer, &p).unwrap();
            premiers.get_or_insert(p);
        }
        assert_eq!(read_list(&liste).len(), MAX_PER_KIND);
        assert!(!is_approved(&liste, Kind::LlamaServer, &premiers.unwrap()), "la plus ancienne est oubliée");
        fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn programme_inconnu_et_prefixe_windows() {
        assert!(Kind::parse("sh").is_none());
        assert_eq!(Kind::parse("oda"), Some(Kind::Oda));
        assert_eq!(display(Path::new(r"\\?\C:\Outils\llama-server.exe")), r"C:\Outils\llama-server.exe");
        assert_eq!(display(Path::new(r"\\?\UNC\srv\partage\x.exe")), r"\\?\UNC\srv\partage\x.exe");
        assert_eq!(display(Path::new("/usr/bin/x")), "/usr/bin/x");
    }
}
