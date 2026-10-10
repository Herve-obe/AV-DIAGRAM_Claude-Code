# Usage : python3 nextdata.py URL  -> texte des chaînes HTML contenues dans __NEXT_DATA__ (sites Next.js, ex. Shure)
import sys, re, json, html, os, subprocess, hashlib
url = sys.argv[1]
cache = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cache', hashlib.md5(url.encode()).hexdigest() + '.html')
os.makedirs(os.path.dirname(cache), exist_ok=True)
if not os.path.exists(cache) or os.path.getsize(cache) < 1000:
    subprocess.run(['curl', '-sS', '-L', '-m', '150', '-A', 'Mozilla/5.0', '-o', cache, url])
t = open(cache, encoding='utf-8', errors='ignore').read()
m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', t, flags=re.S)
if not m:
    print('pas de __NEXT_DATA__'); sys.exit()
data = json.loads(m.group(1))
out = []
def walk(o):
    if isinstance(o, dict):
        for v in o.values(): walk(v)
    elif isinstance(o, list):
        for v in o: walk(v)
    elif isinstance(o, str) and ('<' in o and '>' in o) and len(o) > 40:
        s = re.sub(r'</(p|li|tr|h\d|div|td|th)>', '\n', o)
        s = re.sub(r'<(td|th)[^>]*>', ' | ', s)
        s = html.unescape(re.sub(r'<[^>]+>', '', s))
        out.append(re.sub(r'[ \t]+', ' ', s))
walk(data)
text = '\n'.join(out)
text = re.sub(r'\n\s*\n+', '\n', text)
print(text)
