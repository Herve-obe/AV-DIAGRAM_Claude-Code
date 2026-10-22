"""Essai isolé du vrai moteur/modèle ; ne lance pas l'application et ne lit aucun projet utilisateur."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import secrets
import shutil
import socket
import subprocess
import sys
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        while data := f.read(4 * 1024 * 1024):
            h.update(data)
    return h.hexdigest()


def verify_local_crt(pid, engine):
    if sys.platform != 'win32':
        return
    import ctypes
    from ctypes import wintypes
    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    psapi = ctypes.WinDLL('psapi', use_last_error=True)
    kernel.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
    kernel.OpenProcess.restype = wintypes.HANDLE
    kernel.CloseHandle.argtypes = [wintypes.HANDLE]
    psapi.EnumProcessModules.argtypes = [wintypes.HANDLE, ctypes.POINTER(wintypes.HMODULE), wintypes.DWORD, ctypes.POINTER(wintypes.DWORD)]
    psapi.GetModuleFileNameExW.argtypes = [wintypes.HANDLE, wintypes.HMODULE, wintypes.LPWSTR, wintypes.DWORD]
    handle = kernel.OpenProcess(0x0410, False, pid)
    assert handle, 'processus de test inaccessible'
    try:
        modules = (wintypes.HMODULE * 1024)()
        needed = wintypes.DWORD()
        assert psapi.EnumProcessModules(handle, modules, ctypes.sizeof(modules), ctypes.byref(needed))
        found = {}
        for module in modules[:needed.value // ctypes.sizeof(wintypes.HMODULE)]:
            name = ctypes.create_unicode_buffer(32768)
            if psapi.GetModuleFileNameExW(handle, module, name, len(name)):
                path = Path(name.value)
                found[path.name.lower()] = path
        for name in ['msvcp140.dll', 'vcruntime140.dll', 'vcruntime140_1.dll']:
            assert name in found and found[name].parent.resolve() == engine.parent.resolve(), f'{name} doit être chargée depuis le moteur, pas depuis le système'
        print('PASS : dépendances Visual C++ chargées depuis le dossier de l’application', flush=True)
    finally:
        kernel.CloseHandle(handle)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--directory', type=Path, required=True, help='Dossier réservé à cet essai')
    parser.add_argument('--node', default=shutil.which('node'))
    parser.add_argument('--engine-directory', type=Path, default=ROOT / 'resources/local-ai')
    args = parser.parse_args()
    folder = args.directory.resolve()
    folder.mkdir(parents=True, exist_ok=True)
    spec = json.loads((ROOT / 'resources/local-ai/models.json').read_text(encoding='utf-8'))[0]
    model = folder / spec['file']
    if not model.exists():
        partial = model.with_suffix('.gguf.part')
        with urllib.request.urlopen(f"https://huggingface.co/{spec['repo']}/resolve/{spec['revision']}/{spec['file']}", timeout=60) as response, partial.open('wb') as out:
            while data := response.read(4 * 1024 * 1024):
                out.write(data)
        partial.replace(model)
    assert model.stat().st_size == spec['size'] and digest(model) == spec['sha256'], 'modèle refusé'
    platform = 'win-x64' if sys.platform == 'win32' else 'mac-arm64' if os.uname().machine == 'arm64' else 'mac-x64'
    engine = args.engine_directory / platform / ('llama-server.exe' if sys.platform == 'win32' else 'llama-server')
    assert engine.is_file() and args.node, 'préparer le moteur et Node avant cet essai'
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        port = s.getsockname()[1]
    token = secrets.token_hex(32)
    trace = folder / 'model-trace.jsonl'
    trace.write_text('', encoding='utf-8')
    env = {**os.environ, 'LLAMA_API_KEY': token, 'AVD_LOCAL_AI_TEST_URL': f'http://127.0.0.1:{port}/v1', 'AVD_LOCAL_AI_TEST_TOKEN': token, 'AVD_LOCAL_AI_TEST_DIAGRAM': str(folder / 'diagram-tv.avd'), 'AVD_LOCAL_AI_TEST_TRACE': str(trace)}
    flags = subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0
    command = [str(engine), '-m', str(model), '--host', '127.0.0.1', '--port', str(port), '--jinja', '-c', '16384', '--parallel', '1', '--offline', '--no-webui', '--no-agent', '--alias', spec['id']]
    with (folder / 'engine.log').open('wb') as log:
        process = subprocess.Popen(command, stdin=subprocess.DEVNULL, stdout=log, stderr=log, env=env, creationflags=flags)
        try:
            opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
            for _ in range(180):
                if process.poll() is not None:
                    raise RuntimeError(f'moteur arrêté : {process.returncode}, voir engine.log')
                try:
                    req = urllib.request.Request(f'http://127.0.0.1:{port}/v1/models', headers={'Authorization': f'Bearer {token}'})
                    with opener.open(req, timeout=2) as response:
                        assert response.status == 200
                    break
                except OSError:
                    time.sleep(1)
            else:
                raise TimeoutError('chargement trop long')
            verify_local_crt(process.pid, engine)
            print('Moteur chargé, exécution des vrais appels d’outils', flush=True)
            result = folder / 'integration-result.json'
            try:
                subprocess.run([args.node, str(ROOT / 'node_modules/vitest/vitest.mjs'), 'run', 'src/ai/local.integration.test.ts', '--reporter=json', '--outputFile', str(result)], cwd=ROOT, env=env, check=True, timeout=960, creationflags=flags)
            except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
                if result.is_file():
                    print(result.read_text(encoding='utf-8'), flush=True)
                # Ce banc utilise seulement un projet fictif et ne journalise jamais le jeton d'accès.
                print(trace.read_text(encoding='utf-8')[-24000:], flush=True)
                print((folder / 'engine.log').read_text(encoding='utf-8', errors='replace')[-16000:], flush=True)
                raise
            summary = json.loads(result.read_text(encoding='utf-8'))
            assert summary['success'] and summary['numPassedTests'] == 2 and summary['numPendingTests'] == 0
            print('PASS : vrai modèle, vérification et proposition validées', flush=True)
        finally:
            process.terminate()
            try:
                process.wait(timeout=15)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)
    print('PASS : processus de test arrêté ; aucun projet utilisateur utilisé')


if __name__ == '__main__':
    main()
