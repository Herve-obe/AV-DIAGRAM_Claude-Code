"""Exercise the built NSIS installer on a disposable GitHub Actions Windows runner."""

import ctypes as c
from ctypes import wintypes as w
import os
from pathlib import Path
import subprocess
import time
import winreg

assert os.environ.get("GITHUB_ACTIONS") == "true", "Disposable GitHub Actions runner only"
UNINSTALL_KEY = r"Software\Microsoft\Windows\CurrentVersion\Uninstall\AV Diagram"
try:
    with winreg.OpenKey(winreg.HKEY_CURRENT_USER, UNINSTALL_KEY):
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
    raise AssertionError(f"Timed out: {description}. Windows: {windows()}")


def click(control):
    assert control["enabled"], control
    # Post rather than Send: Next waits synchronously for the child uninstaller.
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


def launch(*args):
    startup = subprocess.STARTUPINFO()
    startup.dwFlags |= subprocess.STARTF_USESHOWWINDOW
    startup.wShowWindow = 0
    proc = subprocess.Popen([str(installer), *args], startupinfo=startup)
    processes.append(proc)
    return proc


def install_silently():
    assert launch("/S", f"/D={install_dir}").wait(timeout=90) == 0
    assert binary.is_file(), "Fresh installation failed"


def maintenance(choice):
    proc = launch()
    root = wait_for(lambda: next((x for x in windows() if x["pid"] == proc.pid
                                 and x["cls"] == "#32770" and x["text"].startswith("AV Diagram")), None), "installer")
    hwnd = root["hwnd"]
    for _ in range(5):
        radio = next((x for x in windows(hwnd) if x["cls"] == "Button" and x["text"] == choice), None)
        if radio:
            click(radio)
            click(button(hwnd, 1))
            return proc, hwnd
        click(button(hwnd, 1))
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
    proc, hwnd = maintenance("Add/Reinstall components")
    wait_for(lambda: any(x["cls"] == "Edit" for x in windows(hwnd)), "reinstall directory page")
    cancel(hwnd)
    proc.wait(timeout=20)
    assert binary.is_file(), "Cancelling reinstall removed the application"
    print("PASS: reinstall still reaches the directory page", flush=True)

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
    for proc in processes:
        if proc.poll() is None:
            proc.kill()
    # All files and registry entries belong to this disposable runner, never a user's installation.
    uninstall = install_dir / "uninstall.exe"
    if uninstall.exists():
        subprocess.run([str(uninstall), "/S", f"_?={install_dir}"], timeout=30, check=False)
