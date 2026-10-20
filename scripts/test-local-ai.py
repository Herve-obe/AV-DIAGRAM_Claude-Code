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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--directory', type=Path, required=True, help='Dossier réservé à cet essai')
    parser.add_argument('--node', default=shutil.which('node'))
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
    engine = ROOT / 'resources/local-ai' / platform / ('llama-server.exe' if sys.platform == 'win32' else 'llama-server')
    assert engine.is_file() and args.node, 'préparer le moteur et Node avant cet essai'
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        port = s.getsockname()[1]
    token = secrets.token_hex(32)
    env = {**os.environ, 'LLAMA_API_KEY': token, 'AVD_LOCAL_AI_TEST_URL': f'http://127.0.0.1:{port}/v1', 'AVD_LOCAL_AI_TEST_TOKEN': token}
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
            print('Moteur chargé, exécution des vrais appels d’outils', flush=True)
            result = folder / 'integration-result.json'
            subprocess.run([args.node, str(ROOT / 'node_modules/vitest/vitest.mjs'), 'run', 'src/ai/local.integration.test.ts', '--reporter=json', '--outputFile', str(result)], cwd=ROOT, env=env, check=True, timeout=660, creationflags=flags)
            summary = json.loads(result.read_text(encoding='utf-8'))
            assert summary['success'] and summary['numPassedTests'] == 1 and summary['numPendingTests'] == 0
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
