// Conversion facultative par le programme ODA installé et choisi sur ce poste. Aucun binaire embarqué.
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex, atomic::{AtomicBool, AtomicU64, Ordering}};
use std::time::{Duration, Instant};

#[derive(Clone, Default)]
pub struct DwgConverter { child: Arc<Mutex<Option<Child>>>, busy: Arc<AtomicBool>, cancelled: Arc<AtomicU64> }
impl DwgConverter {
    pub fn stop(&self) { self.cancelled.fetch_add(1, Ordering::SeqCst); if let Ok(mut guard) = self.child.lock() { if let Some(mut child) = guard.take() { let _ = child.kill(); let _ = child.wait(); } } }
}
struct Running(DwgConverter, Option<Scratch>);
impl Drop for Running { fn drop(&mut self) { self.0.stop(); self.0.busy.store(false, Ordering::SeqCst); } }
struct Scratch(PathBuf);
impl Scratch {
    fn new() -> Result<Self, String> {
        let path = std::env::temp_dir().join(format!("av-diagram-dwg-{:032x}", rand::random::<u128>()));
        let mut builder = fs::DirBuilder::new();
        #[cfg(unix)] { use std::os::unix::fs::DirBuilderExt; builder.mode(0o700); }
        builder.create(&path).map_err(|_| "storage")?;
        Ok(Self(path))
    }
}
impl Drop for Scratch { fn drop(&mut self) { let _ = fs::remove_dir_all(&self.0); } }
fn validate_data(data: &[u8]) -> Result<(), String> {
    if data.len() > 10_000_000 { return Err("large".into()); }
    if data.len() < 6 || &data[..4] != b"AC10" || !data[4..6].iter().all(u8::is_ascii_digit) { return Err("invalid".into()); }
    Ok(())
}
fn checked_converter(path: &Path) -> Result<PathBuf, String> {
    if !path.is_absolute() { return Err("converter".into()); }
    let actual = path.canonicalize().map_err(|_| "converter")?;
    let name = actual.file_name().and_then(|s| s.to_str()).unwrap_or_default();
    let expected = if cfg!(windows) { "ODAFileConverter.exe" } else { "ODAFileConverter" };
    if !name.eq_ignore_ascii_case(expected) || !actual.is_file() { return Err("converter".into()); }
    Ok(actual)
}
fn conversion_command(binary: &Path, input: &Path, output: &Path) -> Command {
    let mut cmd = Command::new(binary);
    // Arguments séparés et nom interne fixe : aucun nom de fichier fourni ne devient une commande.
    cmd.arg(input).arg(output).args(["ACAD2018", "DXF", "0", "0", "source.dwg"])
        .stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());
    #[cfg(windows)] { use std::os::windows::process::CommandExt; cmd.creation_flags(0x0800_0000); }
    cmd
}
fn convert(state: DwgConverter, converter: String, data: Vec<u8>, epoch: u64) -> Result<Vec<u8>, String> {
    validate_data(&data)?;
    let binary = checked_converter(Path::new(&converter))?;
    if state.busy.compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst).is_err() { return Err("busy".into()); }
    let mut running = Running(state.clone(), None);
    running.1 = Some(Scratch::new()?);
    let scratch = &running.1.as_ref().unwrap().0;
    if state.cancelled.load(Ordering::SeqCst) != epoch { return Err("cancelled".into()); }
    let input = scratch.join("input");
    let output = scratch.join("output");
    fs::create_dir(&input).and_then(|_| fs::create_dir(&output)).map_err(|_| "storage")?;
    fs::write(input.join("source.dwg"), data).map_err(|_| "storage")?;
    let process = conversion_command(&binary, &input, &output).spawn().map_err(|_| "converter")?;
    *state.child.lock().map_err(|_| "busy")? = Some(process);
    let start = Instant::now();
    loop {
        if state.cancelled.load(Ordering::SeqCst) != epoch { return Err("cancelled".into()); }
        if start.elapsed() > Duration::from_secs(60) { return Err("timeout".into()); }
        let status = {
            let mut guard = state.child.lock().map_err(|_| "busy")?;
            let process = guard.as_mut().ok_or("cancelled")?;
            process.try_wait().map_err(|_| "conversion")?
        };
        if let Some(status) = status { if !status.success() { return Err("conversion".into()); } break; }
        std::thread::sleep(Duration::from_millis(100));
    }
    let file = output.join("source.dxf");
    let file = if file.is_file() { file } else { output.join("source.DXF") };
    let size = fs::symlink_metadata(&file).map_err(|_| "conversion")?;
    if !size.file_type().is_file() || size.len() > 10_000_000 { return Err("large".into()); }
    let bytes = fs::read(file).map_err(|_| "conversion")?;
    if bytes.len() > 10_000_000 { return Err("large".into()); }
    Ok(bytes)
}

#[tauri::command]
pub async fn dwg_to_dxf(state: tauri::State<'_, DwgConverter>, converter: String, data: Vec<u8>) -> Result<Vec<u8>, String> {
    let state = state.inner().clone();
    let epoch = state.cancelled.load(Ordering::SeqCst);
    tauri::async_runtime::spawn_blocking(move || convert(state, converter, data, epoch)).await.map_err(|_| "conversion".to_string())?
}
#[tauri::command]
pub fn dwg_cancel(state: tauri::State<'_, DwgConverter>) { state.stop(); }

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn validates_input_and_converter_without_running_it() {
        assert!(validate_data(b"AC1032test").is_ok());
        assert_eq!(validate_data(b"not-dwg").unwrap_err(), "invalid");
        assert_eq!(validate_data(&vec![0; 10_000_001]).unwrap_err(), "large");
        assert!(checked_converter(Path::new("ODAFileConverter.exe")).is_err());
        let scratch = Scratch::new().unwrap();
        let name = if cfg!(windows) { "ODAFileConverter.exe" } else { "ODAFileConverter" };
        let file = scratch.0.join(name); fs::write(&file, b"test fixture, never executed").unwrap();
        assert!(checked_converter(&file).is_ok());
        assert!(checked_converter(&scratch.0).is_err());
    }
    #[test]
    fn arguments_are_separate_and_temporary_files_are_removed() {
        let scratch = Scratch::new().unwrap(); let path = scratch.0.clone();
        let cmd = conversion_command(Path::new("ODAFileConverter"), Path::new("input dir & data"), Path::new("output dir"));
        let args: Vec<_> = cmd.get_args().map(|s| s.to_string_lossy().to_string()).collect();
        assert_eq!(args, ["input dir & data", "output dir", "ACAD2018", "DXF", "0", "0", "source.dwg"]);
        fs::write(path.join("temporary.dwg"), b"AC1032test").unwrap(); drop(scratch); assert!(!path.exists());
    }
    #[test]
    fn cancels_before_launch_and_releases_busy_state() {
        let scratch = Scratch::new().unwrap();
        let file = scratch.0.join(if cfg!(windows) { "ODAFileConverter.exe" } else { "ODAFileConverter" });
        fs::write(&file, b"never executed").unwrap();
        let state = DwgConverter::default(); let epoch = state.cancelled.load(Ordering::SeqCst); state.stop();
        assert_eq!(convert(state.clone(), file.to_string_lossy().into_owned(), b"AC1032fixture".to_vec(), epoch).unwrap_err(), "cancelled");
        assert!(!state.busy.load(Ordering::SeqCst)); assert!(state.child.lock().unwrap().is_none());
    }
}
