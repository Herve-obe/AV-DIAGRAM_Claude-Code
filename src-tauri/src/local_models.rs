// Catalogue figé : aucune adresse ni destination de téléchargement fournie par le modèle ou l'interface.
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs::{self, File, OpenOptions};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, atomic::{AtomicBool, AtomicU64, Ordering}};
use std::time::Duration;
use tauri::Manager;

#[derive(Clone, Deserialize, Serialize)]
pub struct Model {
    pub id: String,
    pub label: String,
    pub repo: String,
    pub revision: String,
    pub file: String,
    pub size: u64,
    pub sha256: String,
    pub license: String,
    pub minimum_ram_gb: u64,
}

pub fn catalog() -> Vec<Model> {
    serde_json::from_str(include_str!("../../resources/local-ai/models.json")).expect("catalogue IA invalide")
}

pub fn model(id: &str) -> Result<Model, String> {
    catalog().into_iter().find(|m| m.id == id).ok_or_else(|| "model".into())
}

pub fn model_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let base = app.path().app_local_data_dir().map_err(|_| "storage")?.join("local-ai");
    directory_at(&base)
}

fn directory_at(base: &Path) -> Result<PathBuf, String> {
    match fs::read(base.join("models-directory.json")) {
        Ok(data) => {
            let path: PathBuf = serde_json::from_slice(&data).map_err(|_| "storage")?;
            if !path.is_absolute() { return Err("storage".into()); }
            Ok(path)
        }
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(base.join("models")),
        Err(_) => Err("storage".into()),
    }
}

fn save_directory(base: &Path, path: &Path) -> Result<(), String> {
    if !path.is_absolute() || path.to_string_lossy().chars().any(char::is_control) { return Err("storage".into()); }
    fs::create_dir_all(path).map_err(|_| "storage")?;
    let probe = path.join(format!(".avd-write-{}", rand::random::<u64>()));
    File::create_new(&probe).map_err(|_| "storage")?;
    fs::remove_file(probe).map_err(|_| "storage")?;
    fs::create_dir_all(base).map_err(|_| "storage")?;
    let pending = base.join("models-directory.json.tmp");
    fs::write(&pending, serde_json::to_vec(path).map_err(|_| "storage")?).map_err(|_| "storage")?;
    fs::rename(pending, base.join("models-directory.json")).map_err(|_| "storage".into())
}

#[tauri::command]
pub fn local_model_directory_set(app: tauri::AppHandle, state: tauri::State<Downloads>, server: tauri::State<crate::local::LocalServer>, directory: String) -> Result<(), String> {
    if state.busy.compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst).is_err() { return Err("busy".into()); }
    let _running = Running(state.inner().clone());
    let base = app.path().app_local_data_dir().map_err(|_| "storage")?.join("local-ai");
    save_directory(&base, Path::new(&directory))?;
    server.stop();
    Ok(())
}

pub struct InstallerSetup(pub Mutex<Option<String>>);

pub fn installer_directory(args: impl IntoIterator<Item = std::ffi::OsString>) -> Option<String> {
    let mut args = args.into_iter();
    if args.next()?.to_str()? != "--install-local-ai" { return None; }
    let directory = args.next()?.into_string().ok()?;
    if args.next().is_some() || !Path::new(&directory).is_absolute() { return None; }
    Some(directory)
}

#[tauri::command]
pub fn local_ai_setup_request(state: tauri::State<InstallerSetup>) -> Option<String> {
    state.0.lock().ok()?.take()
}

pub fn verify_file(path: &Path, m: &Model) -> Result<(), String> {
    if fs::metadata(path).map_err(|_| "missing")?.len() != m.size { return Err("integrity".into()); }
    let mut file = File::open(path).map_err(|_| "storage")?;
    let mut digest = Sha256::new();
    let mut buffer = [0_u8; 131072];
    loop {
        let n = file.read(&mut buffer).map_err(|_| "storage")?;
        if n == 0 { break; }
        digest.update(&buffer[..n]);
    }
    if format!("{:x}", digest.finalize()) != m.sha256 { return Err("integrity".into()); }
    Ok(())
}

#[derive(Clone, Default, Serialize)]
pub struct Progress {
    pub id: Option<String>,
    pub downloaded: u64,
    pub total: u64,
    pub running: bool,
}

#[derive(Clone, Default)]
pub struct Downloads {
    busy: Arc<AtomicBool>,
    epoch: Arc<AtomicU64>,
    cancel: Arc<tokio::sync::Notify>,
    progress: Arc<Mutex<Progress>>,
}

impl Downloads {
    pub fn stop(&self) {
        self.epoch.fetch_add(1, Ordering::SeqCst);
        self.cancel.notify_waiters();
    }
    fn progress(&self, m: &Model, downloaded: u64, running: bool) {
        if let Ok(mut p) = self.progress.lock() { *p = Progress { id: Some(m.id.clone()), downloaded, total: m.size, running }; }
    }
}

struct Running(Downloads);
impl Drop for Running {
    fn drop(&mut self) {
        self.0.busy.store(false, Ordering::SeqCst);
        if let Ok(mut p) = self.0.progress.lock() { p.running = false; }
    }
}

fn allowed_download(url: &url::Url) -> bool {
    let host = url.host_str().unwrap_or_default();
    url.scheme() == "https" && (host == "huggingface.co" || host.ends_with(".hf.co") || host == "hf.co")
        && url.username().is_empty() && url.password().is_none()
}

fn download_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder().connect_timeout(Duration::from_secs(20))
        .redirect(reqwest::redirect::Policy::custom(|attempt| {
            if attempt.previous().len() < 5 && allowed_download(attempt.url()) { attempt.follow() } else { attempt.stop() }
        })).build().map_err(|_| "network".into())
}

fn valid_range(value: &str, start: u64, size: u64) -> bool {
    value == format!("bytes {}-{}/{}", start, size - 1, size)
}

async fn download(state: Downloads, m: Model, app: tauri::AppHandle) -> Result<String, String> {
    if state.busy.compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst).is_err() { return Err("busy".into()); }
    let _running = Running(state.clone());
    let dir = model_dir(&app)?;
    let epoch = state.epoch.load(Ordering::SeqCst);
    let cancelled = || state.epoch.load(Ordering::SeqCst) != epoch;
    fs::create_dir_all(&dir).map_err(|_| "storage")?;
    let target = dir.join(&m.file);
    let partial = dir.join(format!("{}.part", m.file));
    state.progress(&m, 0, true);
    if target.is_file() {
        let p = target.clone(); let spec = m.clone();
        if tauri::async_runtime::spawn_blocking(move || verify_file(&p, &spec)).await.map_err(|_| "storage")?.is_ok() {
            state.progress(&m, m.size, false);
            return Ok(target.to_string_lossy().into_owned());
        }
    }
    let mut start = fs::metadata(&partial).map(|p| p.len()).unwrap_or(0);
    if start == m.size {
        let p = partial.clone(); let spec = m.clone();
        if tauri::async_runtime::spawn_blocking(move || verify_file(&p, &spec)).await.map_err(|_| "storage")?.is_ok() {
            if cancelled() { return Err("cancelled".into()); }
            if target.exists() { fs::remove_file(&target).map_err(|_| "storage")?; }
            fs::rename(&partial, &target).map_err(|_| "storage")?;
            state.progress(&m, m.size, false);
            return Ok(target.to_string_lossy().into_owned());
        }
    }
    if start >= m.size { fs::remove_file(&partial).map_err(|_| "storage")?; start = 0; }
    let client = download_client()?;
    let url = format!("https://huggingface.co/{}/resolve/{}/{}", m.repo, m.revision, m.file);
    let mut request = client.get(url).header("accept-encoding", "identity");
    if start > 0 { request = request.header("range", format!("bytes={start}-")); }
    let response = tokio::select! {
        r = request.send() => r.map_err(|_| "network")?,
        _ = state.cancel.notified() => return Err("cancelled".into()),
    };
    if cancelled() { return Err("cancelled".into()); }
    if !allowed_download(response.url()) { return Err("network".into()); }
    transfer(&state, &m, &target, &partial, start, response, epoch).await
}

async fn transfer(state: &Downloads, m: &Model, target: &Path, partial: &Path, mut start: u64, mut response: reqwest::Response, epoch: u64) -> Result<String, String> {
    let cancelled = || state.epoch.load(Ordering::SeqCst) != epoch;
    if cancelled() { return Err("cancelled".into()); }
    if response.status() == reqwest::StatusCode::OK { start = 0; }
    else if response.status() != reqwest::StatusCode::PARTIAL_CONTENT || !response.headers()
        .get("content-range").and_then(|s| s.to_str().ok()).map(|s| valid_range(s, start, m.size)).unwrap_or(false) {
        return Err("network".into());
    }
    if let Some(n) = response.content_length() { if n != m.size - start { return Err("integrity".into()); } }
    let mut file = OpenOptions::new().create(true).write(true).truncate(start == 0).append(start > 0).open(&partial).map_err(|_| "storage")?;
    let mut received = start;
    state.progress(&m, received, true);
    loop {
        if cancelled() { return Err("cancelled".into()); }
        let chunk = tokio::select! {
            r = tokio::time::timeout(Duration::from_secs(30), response.chunk()) => r.map_err(|_| "network")?.map_err(|_| "network")?,
            _ = state.cancel.notified() => return Err("cancelled".into()),
        };
        let Some(chunk) = chunk else { break; };
        received += chunk.len() as u64;
        if received > m.size { drop(file); let _ = fs::remove_file(&partial); return Err("integrity".into()); }
        file.write_all(&chunk).map_err(|_| "storage")?;
        state.progress(&m, received, true);
    }
    file.sync_all().map_err(|_| "storage")?;
    drop(file);
    let p = partial.to_path_buf(); let spec = m.clone();
    let verified = tauri::async_runtime::spawn_blocking(move || verify_file(&p, &spec)).await.map_err(|_| "storage")?;
    if let Err(e) = verified { let _ = fs::remove_file(&partial); return Err(e); }
    if cancelled() { return Err("cancelled".into()); }
    if target.exists() { fs::remove_file(target).map_err(|_| "storage")?; }
    fs::rename(partial, target).map_err(|_| "storage")?;
    state.progress(&m, m.size, false);
    Ok(target.to_string_lossy().into_owned())
}

#[derive(Serialize)]
pub struct InstalledModel { #[serde(flatten)] model: Model, installed: bool, partial: u64 }
#[derive(Serialize)]
pub struct Catalog { models: Vec<InstalledModel>, memory_bytes: u64, runtime_available: bool, runtime_error: Option<String>, directory: String }

#[tauri::command]
pub fn local_model_catalog(app: tauri::AppHandle) -> Result<Catalog, String> {
    let dir = model_dir(&app)?;
    let models = catalog().into_iter().map(|m| {
        let installed = fs::metadata(dir.join(&m.file)).map(|f| f.len() == m.size).unwrap_or(false);
        let partial = fs::metadata(dir.join(format!("{}.part", m.file))).map(|f| f.len()).unwrap_or(0);
        InstalledModel { model: m, installed, partial }
    }).collect();
    let runtime = crate::local::bundled_server(&app);
    Ok(Catalog { models, memory_bytes: memory_bytes(), runtime_available: runtime.is_ok(), runtime_error: runtime.err(), directory: dir.to_string_lossy().into_owned() })
}

#[tauri::command]
pub async fn local_model_download(app: tauri::AppHandle, state: tauri::State<'_, Downloads>, id: String) -> Result<String, String> {
    download(state.inner().clone(), model(&id)?, app).await
}
#[tauri::command]
pub fn local_model_cancel(state: tauri::State<Downloads>) { state.stop(); }
#[tauri::command]
pub fn local_model_progress(state: tauri::State<Downloads>) -> Progress { state.progress.lock().map(|p| p.clone()).unwrap_or_default() }

#[cfg(windows)]
fn memory_bytes() -> u64 {
    #[repr(C)] struct Memory { length: u32, load: u32, total: u64, available: u64, page: u64, available_page: u64, virtual_size: u64, available_virtual: u64, extended: u64 }
    #[link(name = "kernel32")] extern "system" { fn GlobalMemoryStatusEx(status: *mut Memory) -> i32; }
    let mut status: Memory = unsafe { std::mem::zeroed() };
    status.length = std::mem::size_of::<Memory>() as u32;
    if unsafe { GlobalMemoryStatusEx(&mut status) } != 0 { status.total } else { 0 }
}
#[cfg(target_os = "macos")]
fn memory_bytes() -> u64 {
    extern "C" { fn sysctlbyname(name: *const std::ffi::c_char, old: *mut std::ffi::c_void, len: *mut usize, new: *mut std::ffi::c_void, newlen: usize) -> i32; }
    let mut value = 0_u64;
    let mut len = std::mem::size_of::<u64>();
    if unsafe { sysctlbyname(b"hw.memsize\0".as_ptr().cast(), (&mut value as *mut u64).cast(), &mut len, std::ptr::null_mut(), 0) } == 0 { value } else { 0 }
}
#[cfg(not(any(windows, target_os = "macos")))]
fn memory_bytes() -> u64 {
    fs::read_to_string("/proc/meminfo").ok().and_then(|s| s.lines().find(|l| l.starts_with("MemTotal:")).and_then(|l| l.split_whitespace().nth(1)).and_then(|v| v.parse::<u64>().ok())).unwrap_or(0) * 1024
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn choix_du_dossier_sans_deplacer_les_modeles() {
        let root = std::env::temp_dir().join(format!("avd-directory-{}", rand::random::<u64>()));
        let base = root.join("config");
        let first = root.join("IA locale é test");
        let second = root.join("autre");
        assert_eq!(directory_at(&base).unwrap(), base.join("models"));
        assert!(save_directory(&base, Path::new("relative")).is_err());
        save_directory(&base, &first).unwrap();
        fs::write(first.join("keep.gguf"), b"original").unwrap();
        save_directory(&base, &second).unwrap();
        assert_eq!(directory_at(&base).unwrap(), second);
        assert_eq!(fs::read(first.join("keep.gguf")).unwrap(), b"original");
        fs::remove_file(first.join("keep.gguf")).unwrap();
        fs::remove_file(base.join("models-directory.json")).unwrap();
        for dir in [first, second, base, root] { fs::remove_dir(dir).unwrap(); }
    }
    #[test]
    fn demande_installeur_limitee_au_dossier_explicitement_choisi() {
        let directory = std::env::temp_dir().join("IA locale é test").to_string_lossy().into_owned();
        let args = |values: &[&str]| values.iter().map(std::ffi::OsString::from).collect::<Vec<_>>();
        assert_eq!(installer_directory(args(&["--install-local-ai", &directory])), Some(directory));
        assert!(installer_directory(args(&["--install-local-ai", "relative"])).is_none());
        assert!(installer_directory(args(&["--other", "x"])).is_none());
        assert!(installer_directory(args(&["--install-local-ai", "x", "extra"])).is_none());
    }
    #[test]
    fn catalogue_et_frontieres() {
        for m in catalog() {
            assert!(m.repo.starts_with("Qwen/")); assert_eq!(m.revision.len(), 40); assert_eq!(m.sha256.len(), 64);
            assert_eq!(Path::new(&m.file).components().count(), 1); assert!(m.size > 1_000_000_000);
        }
        assert!(model("../../x").is_err());
        for u in ["http://huggingface.co/x", "https://huggingface.co.evil.test/x", "https://127.0.0.1/x"] { assert!(!allowed_download(&url::Url::parse(u).unwrap())); }
        assert!(allowed_download(&url::Url::parse("https://cas-bridge.xethub.hf.co/x").unwrap()));
        assert!(valid_range("bytes 10-99/100", 10, 100)); assert!(!valid_range("bytes 0-99/100", 10, 100));
    }
    #[test]
    fn controle_integrite_reel() {
        let path = std::env::temp_dir().join(format!("avd-sha-{}", rand::random::<u64>()));
        fs::write(&path, b"GGUFtest").unwrap();
        let mut m = catalog().remove(0); m.size = 8; m.sha256 = format!("{:x}", Sha256::digest(b"GGUFtest"));
        assert!(verify_file(&path, &m).is_ok()); fs::write(&path, b"GGUFfake").unwrap(); assert!(verify_file(&path, &m).is_err());
        fs::remove_file(path).unwrap();
    }

    async fn response(status: &str, extra: &str, body: &[u8]) -> reqwest::Response {
        let listener = std::net::TcpListener::bind(("127.0.0.1", 0)).unwrap();
        let address = listener.local_addr().unwrap();
        let packet = format!("HTTP/1.1 {status}\r\nContent-Length: {}\r\n{extra}Connection: close\r\n\r\n", body.len()).into_bytes();
        let body = body.to_vec();
        std::thread::spawn(move || {
            let (mut socket, _) = listener.accept().unwrap();
            let mut input = [0_u8; 4096]; let _ = socket.read(&mut input);
            socket.write_all(&packet).unwrap(); socket.write_all(&body).unwrap();
        });
        reqwest::Client::builder().no_proxy().timeout(Duration::from_secs(5)).build().unwrap().get(format!("http://{address}")).send().await.unwrap()
    }

    #[tokio::test]
    async fn telechargement_reprise_integrite_et_annulation() {
        let dir = std::env::temp_dir().join(format!("avd-model-{}", rand::random::<u64>()));
        fs::create_dir(&dir).unwrap();
        let target = dir.join("model.gguf"); let part = dir.join("model.gguf.part");
        let mut m = catalog().remove(0); m.size = 8; m.sha256 = format!("{:x}", Sha256::digest(b"GGUFtest"));
        let state = Downloads::default();
        transfer(&state, &m, &target, &part, 0, response("200 OK", "", b"GGUFtest").await, 0).await.unwrap();
        assert_eq!(fs::read(&target).unwrap(), b"GGUFtest"); fs::remove_file(&target).unwrap();
        fs::write(&part, b"GGUF").unwrap();
        assert!(transfer(&state, &m, &target, &part, 4, response("206 Partial Content", "Content-Range: bytes 0-3/8\r\n", b"test").await, 0).await.is_err());
        assert_eq!(fs::read(&part).unwrap(), b"GGUF");
        transfer(&state, &m, &target, &part, 4, response("206 Partial Content", "Content-Range: bytes 4-7/8\r\n", b"test").await, 0).await.unwrap();
        assert_eq!(fs::read(&target).unwrap(), b"GGUFtest"); fs::remove_file(&target).unwrap();
        assert_eq!(transfer(&state, &m, &target, &part, 0, response("200 OK", "", b"GGUFfake").await, 0).await.unwrap_err(), "integrity");
        assert!(!target.exists()); assert!(!part.exists());
        state.stop();
        assert_eq!(transfer(&state, &m, &target, &part, 0, response("200 OK", "", b"GGUFtest").await, 0).await.unwrap_err(), "cancelled");
        assert!(!target.exists());
        let _ = fs::remove_file(&part);
        fs::remove_dir(&dir).unwrap();
    }
}
