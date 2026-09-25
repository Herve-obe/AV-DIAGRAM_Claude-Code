// Application bureau : fenêtre native + dialogues système (ouvrir, enregistrer) et accès aux fichiers
// choisis par l'utilisateur. Le seul accès réseau est celui de l'assistant IA (module ai), désactivé
// par défaut et limité au fournisseur choisi par l'utilisateur.
mod ai;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![ai::ai_request, ai::ai_key_set, ai::ai_key_delete, ai::ai_key_present])
        .run(tauri::generate_context!())
        .expect("erreur au lancement d'AV Diagram");
}
