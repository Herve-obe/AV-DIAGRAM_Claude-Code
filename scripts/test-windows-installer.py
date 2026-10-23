"""Exercise the built NSIS installer on a disposable GitHub Actions Windows runner."""

import ctypes as c
from ctypes import wintypes as w
import os
import json
from pathlib import Path
import subprocess
import time
import winreg

assert os.environ.get("GITHUB_ACTIONS") == "true", "Disposable GitHub Actions runner only"
UNINSTALL_KEY = r"Software\Microsoft\Windows\CurrentVersion\Uninstall\AV Diagram"
for hive in (winreg.HKEY_CURRENT_USER, winreg.HKEY_LOCAL_MACHINE):
    try:
        with winreg.OpenKey(hive, UNINSTALL_KEY):
            raise RuntimeError("Refusing to alter an existing AV Diagram installation")
    except FileNotFoundError:
        pass

user = c.WinDLL("user32", use_last_error=True)
callback_type = c.WINFUNCTYPE(w.BOOL, w.HWND, w.LPARAM)
user.EnumWindows.argtypes = [callback_type, w.LPARAM]
user.EnumChildWindows.argtypes = [w.HWND, callback_type, w.LPARAM]
user.GetWindowTextW.argtypes = [w.HWND, w.LPWSTR, c.c_int]
user.GetClassNameW.argtypes = [w.HWND, w.LPWSTR, c.c_int]
user.GetWindowThreadProcessId.argtypes = [w.HWND, c.POINTER(w.DWORD)]
user.GetDlgCtrlID.argtypes = [w.HWND]
user.IsWindowVisible.argtypes = [w.HWND]
user.IsWindowEnabled.argtypes = [w.HWND]
user.GetWindowLongW.argtypes = [w.HWND, c.c_int]
user.PostMessageW.argtypes = [w.HWND, w.UINT, w.WPARAM, w.LPARAM]
user.ShowWindow.argtypes = [w.HWND, c.c_int]
user.SetForegroundWindow.argtypes = [w.HWND]
user.SendMessageW.argtypes = [w.HWND, w.UINT, w.WPARAM, w.LPARAM]
user.GetParent.argtypes = [w.HWND]
user.GetParent.restype = w.HWND
user.IsWindow.argtypes = [w.HWND]


def windows(parent=None):
    result = []

    @callback_type
    def collect(hwnd, _):
        # The installer is launched hidden; child pages still have their own visible style.
        if parent is None or user.GetWindowLongW(hwnd, -16) & 0x10000000:
            text, cls, pid = c.create_unicode_buffer(2048), c.create_unicode_buffer(80), w.DWORD()
            user.GetWindowTextW(hwnd, text, len(text))
            user.GetClassNameW(hwnd, cls, len(cls))
            user.GetWindowThreadProcessId(hwnd, c.byref(pid))
            result.append(dict(hwnd=hwnd, text=text.value.replace("&", ""), cls=cls.value,
                               pid=pid.value, id=user.GetDlgCtrlID(hwnd), enabled=user.IsWindowEnabled(hwnd)))
        return True

    if parent is None:
        user.EnumWindows(collect, 0)
    else:
        user.EnumChildWindows(parent, collect, 0)
    return result


def wait_for(find, description, timeout=30):
    until = time.monotonic() + timeout
    while time.monotonic() < until:
        result = find()
        if result:
            return result
        time.sleep(0.15)
    dialogs = [x for x in windows() if x["text"].startswith("AV Diagram")]
    raise AssertionError(f"Timed out: {description}. Dialogs: {[(x, windows(x['hwnd'])) for x in dialogs]}")


def click(control):
    assert control["enabled"], control
    # Post rather than Send: Next waits synchronously for the child uninstaller.
    if control["id"] in (1, 2, 3, 6):
        assert user.PostMessageW(user.GetParent(control["hwnd"]), 0x111, control["id"], 0)
    else:
        assert user.PostMessageW(control["hwnd"], 0xF5, 0, 0)
    time.sleep(0.25)


def button(hwnd, control_id):
    return wait_for(lambda: next((x for x in windows(hwnd) if x["cls"] == "Button"
                                 and x["id"] == control_id and x["enabled"]), None), f"button {control_id}")


def cancel(hwnd):
    click(button(hwnd, 2))
    # The installer asks for confirmation; the uninstall confirmation page may close immediately.
    for dialog in windows():
        if dialog["text"].startswith("AV Diagram"):
            yes = next((x for x in windows(dialog["hwnd"]) if x["cls"] == "Button" and x["id"] == 6), None)
            if yes:
                click(yes)


installer = next(Path("src-tauri/target/release/bundle/nsis").glob("*-setup.exe")).resolve()
install_dir = Path(os.environ["RUNNER_TEMP"]) / "av-diagram-installer-test"
binary = install_dir / "av-diagram.exe"
processes = []
launched_app = None
profile = Path(os.environ['LOCALAPPDATA']) / 'io.github.herveobe.avdiagram'
assert not profile.exists(), 'Refusing to alter an existing AV Diagram profile'
machine_dir = Path(os.environ.get('ProgramW6432', os.environ['ProgramFiles'])) / 'AV Diagram'
assert not machine_dir.exists(), 'Refusing to alter an existing all-users installation folder'


def launch(*args):
    startup = subprocess.STARTUPINFO()
    startup.dwFlags |= subprocess.STARTF_USESHOWWINDOW
    startup.wShowWindow = 0
    proc = subprocess.Popen([str(installer), *args], startupinfo=startup)
    processes.append(proc)
    return proc


def install_silently():
    assert launch("/S", "/CurrentUser", f"/D={install_dir}").wait(timeout=90) == 0
    assert binary.is_file(), "Fresh installation failed"
    with winreg.OpenKey(winreg.HKEY_CURRENT_USER, UNINSTALL_KEY) as key:
        installed = {name: winreg.QueryValueEx(key, name)[0]
                     for name in ("DisplayVersion", "InstallLocation", "UninstallString")}
    expected = json.loads(Path("src-tauri/tauri.conf.json").read_text(encoding="utf-8"))["version"]
    assert installed["DisplayVersion"] == expected, installed
    assert Path(installed["InstallLocation"].strip('"')).resolve() == install_dir.resolve(), installed
    engine_dir = install_dir / 'local-ai' / 'win-x64'
    assert all((engine_dir / name).is_file() for name in ['llama-server.exe', 'msvcp140.dll', 'vcruntime140.dll', 'vcruntime140_1.dll']), 'Moteur local ou dépendances Visual C++ absents de l’installation'
    engine = subprocess.run([str(engine_dir / 'llama-server.exe'), '--version'], capture_output=True, timeout=30, creationflags=subprocess.CREATE_NO_WINDOW)
    assert engine.returncode == 0, f'Moteur installé inutilisable : {engine.stderr!r}'
    print('PASS: installed local AI engine and app-local Visual C++ runtime', flush=True)
    print(f"Installed metadata: {installed}", flush=True)


def test_install_modes():
    proc = launch()
    root = wait_for(lambda: next((x for x in windows() if x['pid'] == proc.pid
                                 and x['cls'] == '#32770' and x['text'].startswith('AV Diagram')), None), 'install modes')
    hwnd = root['hwnd']
    user.ShowWindow(hwnd, 5)
    user.SetForegroundWindow(hwnd)
    for _ in range(5):
        everyone = next((x for x in windows(hwnd) if x['cls'] == 'Button' and 'anyone using this computer' in x['text']), None)
        if everyone:
            break
        before = page_signature(hwnd)
        click(button(hwnd, 1))
        wait_for(lambda: page_signature(hwnd) and not set(before).intersection(page_signature(hwnd)), 'install mode page')
    assert everyone, 'Installation scope must be offered'
    personal = next(x for x in windows(hwnd) if x['cls'] == 'Button' and 'just for me' in x['text'])
    assert user.SendMessageW(personal['hwnd'], 0xF0, 0, 0) == 1, 'Existing per-user installation must remain selected'
    click(everyone)
    click(button(hwnd, 1))
    directory = wait_for(lambda: next((x for x in windows(hwnd) if x['cls'] == 'Edit'), None), 'all-users directory')
    assert Path(directory['text']).resolve() == machine_dir.resolve(), directory
    click(button(hwnd, 1))
    wait_for(lambda: any(x['text'].startswith('Install local AI -') for x in windows(hwnd)), 'AI page')
    models = next(x for x in windows(hwnd) if x['cls'] == 'Edit')
    assert Path(models['text']).resolve() == (profile / 'local-ai' / 'models').resolve(), models
    cancel(hwnd)
    proc.wait(timeout=20)
    assert not machine_dir.exists(), 'Cancelling must not install anything'

    assert launch('/S', '/AllUsers').wait(timeout=90) == 0
    machine_binary = machine_dir / 'av-diagram.exe'
    assert machine_binary.is_file(), 'All-users installation must use Program Files'
    with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, UNINSTALL_KEY) as key:
        assert winreg.QueryValueEx(key, 'InstallMode')[0] == 'AllUsers'
        assert '/AllUsers' in winreg.QueryValueEx(key, 'UninstallString')[0]
    # Même un lancement direct doit désinstaller uniquement cette copie, malgré la copie HKCU.
    result = subprocess.run([str(machine_dir / 'uninstall.exe'), '/S', f'_?={machine_dir}'], timeout=90,
                            creationflags=subprocess.CREATE_NO_WINDOW)
    assert result.returncode == 0 and not machine_binary.exists()
    try:
        with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, UNINSTALL_KEY):
            raise AssertionError('All-users registration was not removed')
    except FileNotFoundError:
        pass
    assert binary.is_file(), 'All-users uninstall removed the personal copy'
    with winreg.OpenKey(winreg.HKEY_CURRENT_USER, UNINSTALL_KEY):
        pass
    print('PASS: scope selection, Program Files installation, independent AI folder and scoped uninstall', flush=True)


def page_signature(hwnd):
    # NSIS replaces its inner dialog on each page. Wait for that change rather than queueing Next.
    return tuple(sorted(x["hwnd"] for x in windows(hwnd)
                        if x["cls"] == "#32770" and user.GetParent(x["hwnd"]) == hwnd))


def maintenance(choice):
    proc = launch()
    root = wait_for(lambda: next((x for x in windows() if x["pid"] == proc.pid
                                 and x["cls"] == "#32770" and x["text"].startswith("AV Diagram")), None), "installer")
    hwnd = root["hwnd"]
    # This disposable CI desktop must activate the dialog for NSIS button notifications.
    user.ShowWindow(hwnd, 5)
    user.SetForegroundWindow(hwnd)
    wait_for(lambda: page_signature(hwnd), "initial installer page")
    for _ in range(5):
        radio = next((x for x in windows(hwnd) if x["cls"] == "Button" and x["text"] == choice), None)
        if radio:
            click(radio)
            wait_for(lambda: user.SendMessageW(radio["hwnd"], 0xF0, 0, 0) == 1, f"radio selected: {choice}")
            click(button(hwnd, 1))
            print(f"Selected {choice}: {windows(hwnd)}", flush=True)
            return proc, hwnd
        before = page_signature(hwnd)
        next_button = button(hwnd, 1)
        assert next_button["text"] not in ("Install", "Uninstall", "Finish", "Close"), \
            f"Maintenance skipped: {choice}; controls: {windows(hwnd)}"
        click(next_button)
        wait_for(lambda: page_signature(hwnd) and not set(before).intersection(page_signature(hwnd)),
                 "next installer page")
    raise AssertionError(f"Maintenance choice not found: {choice}; controls: {windows(hwnd)}")


def uninstaller():
    return wait_for(lambda: next((x for x in windows() if x["text"].startswith("AV Diagram Uninstall")), None),
                    "child uninstaller")["hwnd"]


def finish_uninstall(hwnd):
    click(button(hwnd, 1))
    wait_for(lambda: not binary.exists(), "application removed")
    close = wait_for(lambda: next((x for x in windows(hwnd) if x["cls"] == "Button"
                                  and x["enabled"] and x["text"] == "Close"), None), "uninstall finished")
    click(close)


try:
    install_silently()
    test_install_modes()
    proc, hwnd = maintenance("Add/Reinstall components")
    wait_for(lambda: any(x["cls"] == "Edit" for x in windows(hwnd)), "reinstall directory page")
    cancel(hwnd)
    proc.wait(timeout=20)
    assert binary.is_file(), "Cancelling reinstall removed the application"
    print("PASS: reinstall still reaches the directory page", flush=True)

    # Parcours réel : choix explicite, dossier avec espaces/Unicode, lancement et réception native.
    proc, hwnd = maintenance('Add/Reinstall components')
    click(button(hwnd, 1))
    checkbox = wait_for(lambda: next((x for x in windows(hwnd) if x['cls'] == 'Button'
                                     and x['text'].startswith('Install local AI -')), None), 'optional local AI page')
    assert user.SendMessageW(checkbox['hwnd'], 0xF0, 0, 0) == 0, 'Local AI must be opt-in'
    edit = next(x for x in windows(hwnd) if x['cls'] == 'Edit')
    assert not edit['enabled'], 'Model folder must be disabled until local AI is selected'
    click(checkbox)
    models = Path(os.environ['RUNNER_TEMP']) / 'IA locale é test'
    text = c.create_unicode_buffer(str(models))
    assert user.SendMessageW(edit['hwnd'], 0x0C, 0, c.cast(text, c.c_void_p).value)
    before = page_signature(hwnd)
    click(button(hwnd, 1))
    wait_for(lambda: page_signature(hwnd) and not set(before).intersection(page_signature(hwnd)), 'leave optional AI page')
    # Le menu Démarrer n'a pas de page dans notre configuration : InstFiles démarre directement.
    wait_for(lambda: any(x['cls'] == 'msctls_progress32' for x in windows(hwnd)), 'installation progress page')
    wait_for(lambda: button(hwnd, 1)['text'] == 'Next >', 'installation completed')
    click(button(hwnd, 1))
    finish_run = wait_for(lambda: next((x for x in windows(hwnd) if x['cls'] == 'Button'
                                       and x['text'] == 'Open AV Diagram and download local AI'), None), 'AI launch on finish')
    assert user.SendMessageW(finish_run['hwnd'], 0xF0, 0, 0) == 1 and not finish_run['enabled']
    click(button(hwnd, 1))
    proc.wait(timeout=20)
    app = wait_for(lambda: next((x for x in windows() if x['text'] == 'AV Diagram'
                                and x['pid'] != proc.pid and x['cls'] != '#32770'), None), 'application launched by installer')
    launched_app = app['pid']
    config = profile / 'local-ai' / 'models-directory.json'
    wait_for(config.is_file, 'installer folder received by the local AI setup')
    assert Path(json.loads(config.read_text(encoding='utf-8'))).resolve() == models.resolve()
    user.PostMessageW(app['hwnd'], 0x10, 0, 0)
    wait_for(lambda: not user.IsWindow(app['hwnd']), 'setup application closed')
    launched_app = None
    print('PASS: optional AI selection, Unicode model folder and native setup handoff', flush=True)

    proc, hwnd = maintenance("Uninstall AV Diagram")
    child = uninstaller()
    cancel(child)
    wait_for(lambda: any(x["text"] == "Uninstall AV Diagram" for x in windows(hwnd)), "maintenance after cancel")
    assert proc.poll() is None and binary.is_file(), "Cancelling uninstall must preserve installation"
    print("PASS: cancelling uninstall returns to maintenance", flush=True)

    click(button(hwnd, 1))
    finish_uninstall(uninstaller())
    assert proc.wait(timeout=20) == 0, "Uninstall must close its parent installer successfully"
    assert not binary.exists()
    print("PASS: Uninstall closes both processes without reopening installation", flush=True)

    install_silently()
    # Only the version metadata differs, exercising the genuine upgrade branch.
    with winreg.OpenKey(winreg.HKEY_CURRENT_USER, UNINSTALL_KEY, 0, winreg.KEY_SET_VALUE) as key:
        winreg.SetValueEx(key, "DisplayVersion", 0, winreg.REG_SZ, "0.0.1")
    proc, hwnd = maintenance("Uninstall before installing")
    finish_uninstall(uninstaller())
    wait_for(lambda: any(x["cls"] == "Edit" for x in windows(hwnd)), "upgrade directory page")
    assert proc.poll() is None, "Upgrade must continue after uninstalling the older version"
    cancel(hwnd)
    proc.wait(timeout=20)
    print("PASS: upgrade continues after uninstalling the older version", flush=True)
finally:
    if launched_app:
        subprocess.run(['taskkill', '/PID', str(launched_app), '/T', '/F'], check=False, capture_output=True)
    for proc in processes:
        if proc.poll() is None:
            proc.kill()
    # All files and registry entries belong to this disposable runner, never a user's installation.
    uninstall = install_dir / "uninstall.exe"
    if uninstall.exists():
        subprocess.run([str(uninstall), "/S", "/CurrentUser", f"_?={install_dir}"], timeout=30, check=False)
    if (machine_dir / 'av-diagram.exe').exists():
        subprocess.run([str(machine_dir / 'uninstall.exe'), '/S', '/AllUsers', f'_?={machine_dir}'], timeout=30, check=False)
