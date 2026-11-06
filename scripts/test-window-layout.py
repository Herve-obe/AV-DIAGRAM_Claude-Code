"""Vérifie la disposition sur le vrai bureau Windows d'un runner jetable."""
import ctypes as c
from ctypes import wintypes as w
import os
import json
from pathlib import Path
import subprocess
import sys
import time

assert os.environ.get("GITHUB_ACTIONS") == "true", "Runner GitHub Actions jetable uniquement"
for folder in ("APPDATA", "LOCALAPPDATA"):
    assert not (Path(os.environ[folder]) / "io.github.herveobe.avdiagram").exists(), "Préférences existantes : test refusé"
binary = Path(sys.argv[1]).resolve()
assert binary.is_file()
user = c.WinDLL("user32", use_last_error=True)
callback = c.WINFUNCTYPE(w.BOOL, w.HWND, w.LPARAM)
user.EnumWindows.argtypes = [callback, w.LPARAM]
user.GetWindowThreadProcessId.argtypes = [w.HWND, c.POINTER(w.DWORD)]
user.GetWindowTextW.argtypes = [w.HWND, w.LPWSTR, c.c_int]
user.GetClassNameW.argtypes = [w.HWND, w.LPWSTR, c.c_int]
user.IsWindowVisible.argtypes = [w.HWND]
user.IsZoomed.argtypes = [w.HWND]
user.GetWindowRect.argtypes = [w.HWND, c.POINTER(w.RECT)]
user.SystemParametersInfoW.argtypes = [w.UINT, w.UINT, c.c_void_p, w.UINT]
user.MoveWindow.argtypes = [w.HWND, c.c_int, c.c_int, c.c_int, c.c_int, w.BOOL]
user.PostMessageW.argtypes = [w.HWND, w.UINT, w.WPARAM, w.LPARAM]
processes = []


def wait_for(find, label, timeout=30):
    until = time.monotonic() + timeout
    while time.monotonic() < until:
        result = find()
        if result:
            return result
        time.sleep(.1)
    details = app_windows(processes[-1].pid) if processes else []
    raise AssertionError(f"Délai dépassé : {label}. Fenêtres : {json.dumps(details)}")


def app_windows(pid):
    found = []

    @callback
    def collect(hwnd, _):
        owner = w.DWORD()
        user.GetWindowThreadProcessId(hwnd, c.byref(owner))
        if owner.value == pid and user.IsWindowVisible(hwnd):
            title, cls = c.create_unicode_buffer(256), c.create_unicode_buffer(256)
            user.GetWindowTextW(hwnd, title, len(title))
            user.GetClassNameW(hwnd, cls, len(cls))
            found.append(dict(hwnd=hwnd, title=title.value, cls=cls.value, rect=rect(hwnd), maximized=bool(user.IsZoomed(hwnd))))
        return True

    user.EnumWindows(collect, 0)
    return found


def find_window(pid):
    return next((x['hwnd'] for x in app_windows(pid) if x['title'] == 'AV Diagram'), None)


def rect(hwnd):
    value = w.RECT()
    assert user.GetWindowRect(hwnd, c.byref(value))
    return (value.left, value.top, value.right - value.left, value.bottom - value.top)


def launch():
    proc = subprocess.Popen([str(binary)])
    processes.append(proc)
    hwnd = wait_for(lambda: find_window(proc.pid), "fenêtre visible")
    print(f"Application windows: {json.dumps(app_windows(proc.pid))}", flush=True)
    return proc, hwnd


def close(proc, hwnd):
    assert user.PostMessageW(hwnd, 0x10, 0, 0)  # WM_CLOSE, parcours normal avec enregistrement des préférences.
    assert proc.wait(timeout=20) == 0


def window_command(hwnd, command):
    # Même message que les boutons Windows : traité dans la file de la fenêtre, pas depuis le thread Python.
    assert user.PostMessageW(hwnd, 0x0112, command, 0), c.get_last_error()  # WM_SYSCOMMAND


try:
    proc, hwnd = launch()
    wait_for(lambda: user.IsZoomed(hwnd), "premier lancement maximisé")
    print("PASS: first launch is maximized", flush=True)
    window_command(hwnd, 0xF120)  # SC_RESTORE
    wait_for(lambda: not user.IsZoomed(hwnd), "mode fenêtre")
    work = w.RECT()
    assert user.SystemParametersInfoW(48, 0, c.byref(work), 0)  # SPI_GETWORKAREA
    assert user.MoveWindow(hwnd, work.left + 16, work.top + 16,
                           min(1100, work.right - work.left - 64), min(740, work.bottom - work.top - 96), True)
    expected = rect(hwnd)
    close(proc, hwnd)  # Sans attendre le délai de mémorisation des déplacements.

    proc, hwnd = launch()
    wait_for(lambda: not user.IsZoomed(hwnd) and all(abs(a - b) <= 2 for a, b in zip(rect(hwnd), expected)),
             "mode fenêtre et géométrie restaurés")
    print("PASS: window size and position survive closing and relaunching", flush=True)
    window_command(hwnd, 0xF030)  # SC_MAXIMIZE
    wait_for(lambda: user.IsZoomed(hwnd), "agrandissement")
    close(proc, hwnd)

    proc, hwnd = launch()
    wait_for(lambda: user.IsZoomed(hwnd), "agrandissement restauré")
    window_command(hwnd, 0xF120)
    # IsZoomed peut être faux avant la fin de l’animation Windows.
    wait_for(lambda: not user.IsZoomed(hwnd) and all(abs(a - b) <= 2 for a, b in zip(rect(hwnd), expected)),
             "retour à la taille normale et géométrie restaurée")
    print("PASS: maximized state preserves the normal window geometry", flush=True)
    close(proc, hwnd)
finally:
    for proc in processes:
        if proc.poll() is None:
            proc.kill()
