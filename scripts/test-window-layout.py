"""Vérifie la disposition sur le vrai bureau Windows d'un runner jetable."""
import ctypes as c
from ctypes import wintypes as w
import os
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
user.IsWindowVisible.argtypes = [w.HWND]
user.IsZoomed.argtypes = [w.HWND]
user.GetWindowRect.argtypes = [w.HWND, c.POINTER(w.RECT)]
user.SystemParametersInfoW.argtypes = [w.UINT, w.UINT, c.c_void_p, w.UINT]
user.MoveWindow.argtypes = [w.HWND, c.c_int, c.c_int, c.c_int, c.c_int, w.BOOL]
user.ShowWindow.argtypes = [w.HWND, c.c_int]
user.PostMessageW.argtypes = [w.HWND, w.UINT, w.WPARAM, w.LPARAM]
processes = []


def wait_for(find, label, timeout=30):
    until = time.monotonic() + timeout
    while time.monotonic() < until:
        result = find()
        if result:
            return result
        time.sleep(.1)
    raise AssertionError(f"Délai dépassé : {label}")


def find_window(pid):
    found = []

    @callback
    def collect(hwnd, _):
        owner = w.DWORD()
        user.GetWindowThreadProcessId(hwnd, c.byref(owner))
        if owner.value == pid and user.IsWindowVisible(hwnd):
            found.append(hwnd)
        return True

    user.EnumWindows(collect, 0)
    return found[0] if found else None


def rect(hwnd):
    value = w.RECT()
    assert user.GetWindowRect(hwnd, c.byref(value))
    return (value.left, value.top, value.right - value.left, value.bottom - value.top)


def launch():
    proc = subprocess.Popen([str(binary)])
    processes.append(proc)
    hwnd = wait_for(lambda: find_window(proc.pid), "fenêtre visible")
    return proc, hwnd


def close(proc, hwnd):
    assert user.PostMessageW(hwnd, 0x10, 0, 0)  # WM_CLOSE, parcours normal avec enregistrement des préférences.
    assert proc.wait(timeout=20) == 0


try:
    proc, hwnd = launch()
    wait_for(lambda: user.IsZoomed(hwnd), "premier lancement maximisé")
    print("PASS: first launch is maximized", flush=True)
    user.ShowWindow(hwnd, 9)  # SW_RESTORE
    wait_for(lambda: not user.IsZoomed(hwnd), "mode fenêtre")
    work = w.RECT()
    assert user.SystemParametersInfoW(48, 0, c.byref(work), 0)  # SPI_GETWORKAREA
    assert user.MoveWindow(hwnd, work.left + 16, work.top + 16,
                           min(1100, work.right - work.left - 64), min(740, work.bottom - work.top - 96), True)
    expected = rect(hwnd)
    close(proc, hwnd)  # Sans attendre le délai de mémorisation des déplacements.

    proc, hwnd = launch()
    assert not user.IsZoomed(hwnd), "Le choix du mode fenêtre n'a pas été repris"
    assert all(abs(a - b) <= 2 for a, b in zip(rect(hwnd), expected)), (rect(hwnd), expected)
    print("PASS: window size and position survive closing and relaunching", flush=True)
    user.ShowWindow(hwnd, 3)  # SW_MAXIMIZE
    wait_for(lambda: user.IsZoomed(hwnd), "agrandissement")
    close(proc, hwnd)

    proc, hwnd = launch()
    wait_for(lambda: user.IsZoomed(hwnd), "agrandissement restauré")
    user.ShowWindow(hwnd, 9)
    wait_for(lambda: not user.IsZoomed(hwnd), "retour à la taille normale")
    assert all(abs(a - b) <= 2 for a, b in zip(rect(hwnd), expected)), (rect(hwnd), expected)
    print("PASS: maximized state preserves the normal window geometry", flush=True)
    close(proc, hwnd)
finally:
    for proc in processes:
        if proc.poll() is None:
            proc.kill()
