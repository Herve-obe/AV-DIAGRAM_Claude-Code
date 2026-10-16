// IA locale gérée par AV Diagram (option A) : lance et arrête llama-server (llama.cpp, licence MIT)
// avec un modèle GGUF choisi par l'utilisateur. Le serveur n'écoute que sur 127.0.0.1 ; il est arrêté
// à la fermeture de l'application.
use serde::Serialize;
use std::path::Path;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;

#[derive(Default)]
pub struct LocalServer(pub Mutex<Option<Child>>);

impl LocalServer {
    pub fn stop(&self) {
        if let Ok(mut guard) = self.0.lock() {
            if let Some(mut child) = guard.take() {
                let _ = child.kill();
                let _ = child.wait();
            }
        }
    }
}

fn check_server_binary(path: &Path) -> Result<(), String> {
    let name = path.file_name().and_then(|n| n.to_str()).unwrap_or_default().to_lowercase();
    if !name.starts_with("llama-server") {
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
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("lancement impossible : {e}"))
}

#[tauri::command]
pub fn local_start(
    state: tauri::State<LocalServer>,
    server_path: String,
    model_path: String,
    port: u16,
    context: Option<u32>,
) -> Result<(), String> {
    state.stop();
    let child = spawn(Path::new(&server_path), Path::new(&model_path), port, context.unwrap_or(8192))?;
    *state.0.lock().map_err(|_| "état indisponible")? = Some(child);
    Ok(())
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
}

#[tauri::command]
pub fn local_status(state: tauri::State<LocalServer>) -> Result<LocalStatus, String> {
    let mut guard = state.0.lock().map_err(|_| "état indisponible")?;
    let Some(child) = guard.as_mut() else {
        return Ok(LocalStatus { running: false, exit_code: None });
    };
    match child.try_wait() {
        Ok(None) => Ok(LocalStatus { running: true, exit_code: None }),
        Ok(Some(status)) => {
            *guard = None;
            Ok(LocalStatus { running: false, exit_code: status.code() })
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

    #[cfg(unix)]
    #[test]
    fn lance_et_arrete_un_serveur() {
        use std::os::unix::fs::PermissionsExt;
        let dir = std::env::temp_dir().join(format!("avd-local-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let server = dir.join("llama-server");
        // Faux serveur : note ses arguments puis attend
        std::fs::write(&server, format!("#!/bin/sh\necho \"$@\" > {}\nsleep 30\n", dir.join("args").display())).unwrap();
        std::fs::set_permissions(&server, std::fs::Permissions::from_mode(0o755)).unwrap();
        let model = dir.join("m.gguf");
        std::fs::write(&model, b"GGUF").unwrap();
        assert!(spawn(&server, &model, 80, 4096).is_err());
        let state = LocalServer(Mutex::new(Some(spawn(&server, &model, 8089, 4096).unwrap())));
        std::thread::sleep(std::time::Duration::from_millis(300));
        let args = std::fs::read_to_string(dir.join("args")).unwrap();
        assert!(args.contains("--host 127.0.0.1 --port 8089 --jinja -c 4096"));
        state.stop();
        assert!(state.0.lock().unwrap().is_none());
        std::fs::remove_dir_all(&dir).ok();
    }
}
