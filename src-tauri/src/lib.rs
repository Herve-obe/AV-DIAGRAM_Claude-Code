// Application bureau : fenêtre native + dialogues système (ouvrir, enregistrer) et accès aux fichiers
// choisis par l'utilisateur. Accès réseau : l'assistant IA (module ai), désactivé par défaut et limité au
// fournisseur choisi ; la session de collaboration (module collab), ouverte seulement à la demande, sur
// le réseau local.
mod ai;
mod collab;
mod pdfsec;
mod local;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        // Dossier d'enregistrement choisi dans les Paramètres : l'autorisation d'y écrire survit au redémarrage
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_opener::init())
        .manage(local::LocalServer::default())
        .manage(collab::CollabServer::default())
        .invoke_handler(tauri::generate_handler![
            ai::ai_request,
            ai::ai_key_set,
            ai::ai_key_delete,
            ai::ai_key_present,
            local::local_start,
            local::local_stop,
            local::local_status,
            collab::collab_host_start,
            collab::collab_host_stop,
            collab::collab_host_status,
            collab::collab_kick,
            collab::collab_local_addresses,
            pdfsec::pdf_protect
        ])
        .build(tauri::generate_context!())
        .expect("erreur au lancement d'AV Diagram")
        .run(|app, event| {
            // Le serveur d'IA locale ne survit pas à l'application
            if let tauri::RunEvent::Exit = event {
                use tauri::Manager;
                app.state::<local::LocalServer>().stop();
                // Fermeture de l'application : session interrompue, pas terminée (un poste de secours peut
                // prendre le relais, la session reprend au retour de l'hôte)
                app.state::<collab::CollabServer>().stop(false);
            }
        });
}
