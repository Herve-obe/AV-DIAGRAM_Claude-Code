# Usage : python3 specs.py URL  -> lignes « libellé : valeur » des tableaux de la page (cache local)
import sys, re, html, os, subprocess, hashlib
url = sys.argv[1]
cache = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cache', hashlib.md5(url.encode()).hexdigest() + '.html')
os.makedirs(os.path.dirname(cache), exist_ok=True)
if not os.path.exists(cache) or os.path.getsize(cache) < 1000:
    subprocess.run(['curl', '-sS', '-L', '-m', '150', '-A', 'Mozilla/5.0', '-o', cache, url])
t = open(cache, encoding='utf-8', errors='ignore').read()
def clean(s):
    s = re.sub(r'<br\s*/?>', ' / ', s)
    s = html.unescape(re.sub(r'<[^>]+>', ' ', s))
    return re.sub(r'\s+', ' ', s).strip()
tables = re.findall(r'<table\b.*?</table>', t, flags=re.S | re.I)
print(f'# {len(tables)} tableaux')
for tab in tables:
    for row in re.findall(r'<tr\b.*?</tr>', tab, flags=re.S | re.I):
        cells = [clean(c) for c in re.findall(r'<t[dh]\b[^>]*>(.*?)</t[dh]>', row, flags=re.S | re.I)]
        if any(cells): print(' : '.join(cells))
    print('--')
