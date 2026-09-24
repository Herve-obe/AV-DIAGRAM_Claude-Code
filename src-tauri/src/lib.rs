// Application bureau : fenêtre native + dialogues système (ouvrir, enregistrer) et accès aux fichiers
// choisis par l'utilisateur. Aucune connexion réseau n'est nécessaire.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("erreur au lancement d'AV Diagram");
}
