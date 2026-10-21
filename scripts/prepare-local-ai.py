"""Prépare les binaires officiels vérifiés, sans installer de service sur le poste."""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import re
import sys
import subprocess
import tarfile
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
RESOURCES = ROOT / 'resources' / 'local-ai'


def wanted(name):
    return (name in ('llama-server', 'llama-server.exe')
            or name.endswith(('.dll', '.dylib', '.metallib'))
            or name.startswith(('LICENSE', 'NOTICE', 'COPYING')))


def windows_crt():
    # Répertoire Redist officiel uniquement : aucun prélèvement dans System32 ni dans Debug_NonRedist.
    vswhere = Path(os.environ.get('ProgramFiles(x86)', 'C:/Program Files (x86)')) / 'Microsoft Visual Studio/Installer/vswhere.exe'
    if not vswhere.is_file():
        raise RuntimeError('Visual Studio Build Tools requis pour préparer les DLL redistribuables Windows')
    installation = subprocess.check_output([str(vswhere), '-latest', '-products', '*', '-requires', 'Microsoft.VisualStudio.Component.VC.Tools.x86.x64', '-property', 'installationPath'], text=True, creationflags=subprocess.CREATE_NO_WINDOW).strip()
    redist = Path(installation) / 'VC/Redist/MSVC'
    candidates = [p for p in redist.glob('*/x64/Microsoft.VC*.CRT') if re.fullmatch(r'Microsoft\.VC\d+\.CRT', p.name)]
    candidates.sort(key=lambda p: (bool(re.fullmatch(r'\d+(?:\.\d+)+', p.parent.parent.name)), tuple(int(n) for n in re.findall(r'\d+', p.parent.parent.name))))
    if not candidates:
        raise RuntimeError('DLL redistribuables Visual C++ x64 introuvables')
    files = {p.name: p.read_bytes() for p in candidates[-1].glob('*.dll')}
    if not {'msvcp140.dll', 'vcruntime140.dll', 'vcruntime140_1.dll'}.issubset(files):
        raise RuntimeError('Jeu de DLL Visual C++ x64 incomplet')
    files['Microsoft-CRT-NOTICE.txt'] = (ROOT / 'docs/third-party/msvc-runtime-NOTICE.txt').read_bytes()
    return files


def stage(platform):
    manifest = json.loads((RESOURCES / 'engines.json').read_text(encoding='utf-8'))
    spec = manifest['assets'][platform]
    target = RESOURCES / platform
    crt = windows_crt() if platform == 'win-x64' else {}
    marker = target / 'manifest.json'
    if marker.exists():
        old = json.loads(marker.read_text(encoding='utf-8'))
        if old.get('archive_sha256') == spec['sha256'] and all(old['files'].get(name) == hashlib.sha256(data).hexdigest() for name, data in crt.items()) and all(
            (target / name).is_file() and hashlib.sha256((target / name).read_bytes()).hexdigest() == digest
            for name, digest in old['files'].items()
        ):
            print(f'{platform}: moteur vérifié déjà présent')
            return
    url = f"https://github.com/ggml-org/llama.cpp/releases/download/{manifest['version']}/{spec['name']}"
    with urllib.request.urlopen(url, timeout=60) as response:
        data = response.read(spec['size'] + 1)
    if len(data) != spec['size'] or hashlib.sha256(data).hexdigest() != spec['sha256']:
        raise ValueError(f'{platform}: archive refusée (taille ou SHA-256)')
    files = {}
    if spec['name'].endswith('.zip'):
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            for entry in archive.infolist():
                name = Path(entry.filename).name
                if not entry.is_dir() and wanted(name):
                    if name in files:
                        raise ValueError('nom de ressource dupliqué')
                    files[name] = archive.read(entry)
    else:
        with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as archive:
            # Noms aplatis ; aucun lien symbolique ni chemin d'archive n'est extrait sur le disque.
            for entry in archive.getmembers():
                name = Path(entry.name).name
                if (entry.isfile() or entry.issym()) and wanted(name):
                    if name in files:
                        raise ValueError('nom de ressource dupliqué')
                    files[name] = archive.extractfile(entry).read()
    server = 'llama-server.exe' if platform.startswith('win') else 'llama-server'
    if server not in files:
        raise ValueError('llama-server absent')
    files['llama.cpp-LICENSE.txt'] = (ROOT / 'docs' / 'third-party' / 'llama.cpp-LICENSE.txt').read_bytes()
    files.update(crt)
    target.mkdir(parents=True, exist_ok=True)
    for name, content in files.items():
        destination = target / name
        destination.write_bytes(content)
        if name == server:
            destination.chmod(0o755)
    if sys.platform == 'darwin':
        for name in files:
            if name == server or name.endswith('.dylib'):
                subprocess.run(['codesign', '--force', '--sign', '-', str(target / name)], check=True, capture_output=True)
                files[name] = (target / name).read_bytes()
    marker.write_text(json.dumps({
        'version': manifest['version'], 'archive_sha256': spec['sha256'],
        'files': {name: hashlib.sha256(content).hexdigest() for name, content in files.items()},
    }, indent=2), encoding='utf-8')
    print(f'{platform}: {len(files)} fichiers vérifiés')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--platform', choices=('win-x64', 'mac-arm64', 'mac-x64'))
    args = parser.parse_args()
    platforms = [args.platform] if args.platform else (
        ['win-x64'] if sys.platform == 'win32' else ['mac-arm64', 'mac-x64'] if sys.platform == 'darwin' else []
    )
    for selected in platforms:
        stage(selected)
