// IA locale gérée par AV Diagram (option A) : lance et arrête llama-server (llama.cpp, licence MIT)
// avec un modèle GGUF choisi par l'utilisateur. Le serveur n'écoute que sur 127.0.0.1 ; il est arrêté
// à la fermeture de l'application.
use serde::Serialize;
use std::path::Path;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::sync::atomic::{AtomicU64, Ordering};
use tauri::Manager;

#[derive(Default)]
pub struct LocalServer(pub Mutex<Option<Child>>, pub Mutex<Option<(String, String, String)>>, pub AtomicU64);

impl LocalServer {
    pub fn stop(&self) -> u64 {
        let epoch = self.2.fetch_add(1, Ordering::SeqCst) + 1;
        if let Ok(mut guard) = self.0.lock() {
            if let Some(mut child) = guard.take() {
                let _ = child.kill();
                let _ = child.wait();
            }
            if let Ok(mut connection) = self.1.lock() { *connection = None; }
        }
        epoch
    }

    fn launch(&self, epoch: u64, create: impl FnOnce() -> Result<Child, String>, connection: Option<(String, String, String)>) -> Result<(), String> {
        let mut child = self.0.lock().map_err(|_| "serveur indisponible")?;
        if self.2.load(Ordering::SeqCst) != epoch { return Err("cancelled".into()); }
        *child = Some(create()?);
        *self.1.lock().map_err(|_| "serveur indisponible")? = connection;
        Ok(())
    }

    pub fn connection(&self) -> Result<(String, String), String> {
        let mut process = self.0.lock().map_err(|_| "serveur indisponible")?;
        if !matches!(process.as_mut().map(|c| c.try_wait()), Some(Ok(None))) { return Err("serveur local arrêté".into()); }
        self.1.lock().map_err(|_| "serveur indisponible")?.as_ref().map(|(url, key, _)| (url.clone(), key.clone())).ok_or_else(|| "serveur local arrêté".into())
    }
}

pub fn bundled_server(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let platform = if cfg!(windows) { "win-x64" } else if cfg!(target_os = "macos") {
        if cfg!(target_arch = "aarch64") { "mac-arm64" } else { "mac-x64" }
    } else { return Err("runtime".into()); };
    let path = app.path().resource_dir().map_err(|_| "runtime")?.join("local-ai").join(platform)
        .join(if cfg!(windows) { "llama-server.exe" } else { "llama-server" });
    check_server_binary(&path).map_err(|_| "runtime")?;
    Ok(path)
}

fn check_server_binary(path: &Path) -> Result<(), String> {
    let name = path.file_name().and_then(|n| n.to_str()).unwrap_or_default().to_lowercase();
    if !path.is_absolute() || !matches!(name.as_str(), "llama-server" | "llama-server.exe") {
        return Err("le programme choisi doit être llama-server (llama.cpp)".into());
    }
    if !path.is_file() {
        return Err("programme llama-server introuvable".into());
    }
    Ok(())
}

fn check_model(path: &Path) -> Result<(), String> {
    let ok = path.extension().and_then(|e| e.to_str()).map(|e| e.eq_ignore_ascii_case("gguf")).unwrap_or(false);
    if !ok {
        return Err("le modèle doit être un fichier .gguf".into());
    }
    if !path.is_file() {
        return Err("fichier modèle introuvable".into());
    }
    Ok(())
}

fn spawn(server: &Path, model: &Path, port: u16, context: u32) -> Result<Child, String> {
    spawn_with_key(server, model, port, context, None, None)
}

fn spawn_with_key(server: &Path, model: &Path, port: u16, context: u32, key: Option<&str>, alias: Option<&str>) -> Result<Child, String> {
    check_server_binary(server)?;
    check_model(model)?;
    if port < 1024 {
        return Err("port réservé : choisir un port à partir de 1024".into());
    }
    let mut cmd = Command::new(server);
    // Windows : pas de fenêtre de console pour ce processus de fond (CREATE_NO_WINDOW)
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x0800_0000);
    }
    cmd.arg("-m")
        .arg(model)
        .args(["--host", "127.0.0.1", "--port", &port.to_string()])
        // Gabarit de discussion du modèle, nécessaire à l'appel d'outils
        .arg("--jinja")
        .args(["-c", &context.to_string()])
        .args(["--offline", "--no-webui", "--no-agent", "--parallel", "1"])
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());
    // Clé éphémère native : une page web ouverte sur le poste ne peut pas interroger le schéma.
    if let Some(key) = key { cmd.env("LLAMA_API_KEY", key); }
    if let Some(alias) = alias { cmd.args(["--alias", alias]); }
    // Aucun outil natif (fichiers, shell ou MCP) du moteur n'est activé par l'environnement.
    for name in ["LLAMA_ARG_TOOLS", "LLAMA_ARG_MCP_SERVERS_CONFIG", "LLAMA_ARG_MCP_SERVERS_JSON", "LLAMA_ARG_CONNECT", "LLAMA_ARG_CONNECT_CODE", "LLAMA_ARG_MODEL_URL", "LLAMA_ARG_HF_REPO"] { cmd.env_remove(name); }
    cmd.spawn().map_err(|e| format!("lancement impossible : {e}"))
}

#[tauri::command]
pub async fn local_builtin_start(app: tauri::AppHandle, state: tauri::State<'_, LocalServer>, id: String) -> Result<(), String> {
    let epoch = state.stop();
    let model = crate::local_models::model(&id)?;
    let path = crate::local_models::model_dir(&app)?.join(&model.file);
    let verify = path.clone();
    tauri::async_runtime::spawn_blocking(move || crate::local_models::verify_file(&verify, &model)).await.map_err(|_| "storage")??;
    let binary = bundled_server(&app)?;
    // Port libre choisi par le système ; la clé empêche toute confusion si le port est repris entre-temps.
    let socket = std::net::TcpListener::bind(("127.0.0.1", 0)).map_err(|_| "port")?;
    let port = socket.local_addr().map_err(|_| "port")?.port();
    drop(socket);
    let key = format!("{:032x}{:032x}", rand::random::<u128>(), rand::random::<u128>());
    let connection = (format!("http://127.0.0.1:{port}/v1"), key.clone(), id.clone());
    state.launch(epoch, || spawn_with_key(&binary, &path, port, 16384, Some(&key), Some(&id)), Some(connection))
}

#[tauri::command]
pub fn local_start(
    state: tauri::State<LocalServer>,
    server_path: String,
    model_path: String,
    port: u16,
    context: Option<u32>,
) -> Result<(), String> {
    let epoch = state.stop();
    state.launch(epoch, || spawn(Path::new(&server_path), Path::new(&model_path), port, context.unwrap_or(8192)), None)
}

#[tauri::command]
pub fn local_stop(state: tauri::State<LocalServer>) {
    state.stop();
}

#[derive(Serialize)]
pub struct LocalStatus {
    running: bool,
    /// Code de sortie si le serveur s'est arrêté seul (modèle illisible, port occupé, mémoire insuffisante)
    exit_code: Option<i32>,
    model_id: Option<String>,
}

#[tauri::command]
pub fn local_status(state: tauri::State<LocalServer>) -> Result<LocalStatus, String> {
    let mut guard = state.0.lock().map_err(|_| "état indisponible")?;
    let Some(child) = guard.as_mut() else {
        return Ok(LocalStatus { running: false, exit_code: None, model_id: None });
    };
    match child.try_wait() {
        Ok(None) => Ok(LocalStatus { running: true, exit_code: None, model_id: state.1.lock().ok().and_then(|c| c.as_ref().map(|(_, _, id)| id.clone())) }),
        Ok(Some(status)) => {
            *guard = None;
            Ok(LocalStatus { running: false, exit_code: status.code(), model_id: None })
        }
        Err(e) => Err(e.to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fichiers_refuses() {
        assert!(check_server_binary(Path::new("/bin/sh")).is_err());
        assert!(check_model(Path::new("/etc/hostname")).is_err());
        assert!(check_model(Path::new("/nexiste/pas.gguf")).is_err());
    }

    #[test]
    fn annuler_pendant_la_verification_ne_lance_pas_le_modele() {
        let state = LocalServer::default();
        let epoch = state.2.load(Ordering::SeqCst);
        state.stop();
        assert_eq!(state.launch(epoch, || panic!("un chargement annulé ne doit pas créer de processus"), None).unwrap_err(), "cancelled");
        assert!(state.0.lock().unwrap().is_none());
    }

    #[cfg(unix)]
    #[test]
    fn lance_et_arrete_un_serveur() {
        use std::os::unix::fs::PermissionsExt;
        let dir = std::env::temp_dir().join(format!("avd-local-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let server = dir.join("llama-server");
        // Faux serveur : note ses arguments puis attend
        std::fs::write(&server, format!("#!/bin/sh\necho \"$@\" > {}\nexec sleep 30\n", dir.join("args").display())).unwrap();
        std::fs::set_permissions(&server, std::fs::Permissions::from_mode(0o755)).unwrap();
        let model = dir.join("m.gguf");
        std::fs::write(&model, b"GGUF").unwrap();
        assert!(spawn(&server, &model, 80, 4096).is_err());
        let state = LocalServer(Mutex::new(Some(spawn(&server, &model, 8089, 4096).unwrap())), Mutex::new(None), AtomicU64::new(0));
        std::thread::sleep(std::time::Duration::from_millis(300));
        let args = std::fs::read_to_string(dir.join("args")).unwrap();
        assert!(args.contains("--host 127.0.0.1 --port 8089 --jinja -c 4096"));
        state.stop();
        assert!(state.0.lock().unwrap().is_none());
        std::fs::remove_dir_all(&dir).ok();
    }
}
