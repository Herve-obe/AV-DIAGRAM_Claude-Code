#!/usr/bin/env python3
# Couverture des catalogues prestataires (docs/inventaire/*.csv) par la bibliothèque (src/library/devices).
# Usage : python3 couverture.py [--reste] [--marque NOM]
# Une référence est couverte si une fiche a le même fabricant (approché) et un modèle dont la forme
# normalisée correspond (égalité, ou l'un contient l'autre pour les variantes de désignation).
import csv, glob, json, os, re, sys, unicodedata
from collections import defaultdict

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DEV = os.path.join(ROOT, 'src', 'library', 'devices')

def norm(s):
    s = unicodedata.normalize('NFD', s or '').encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]', '', s)

ALIAS = {'dbaudiotechnik': 'db', 'dbaudio': 'db', 'allenheath': 'allenheath', 'lacoustics': 'lacoustics', 'sennheiser': 'sennheiser'}
def maker(s):
    n = norm(s)
    return ALIAS.get(n, n)

lib = []
for f in glob.glob(os.path.join(DEV, '*.json')):
    d = json.load(open(f, encoding='utf-8'))
    lib.append((maker(d.get('manufacturer', '')), norm(d.get('model', '')), d['id'], d.get('status')))

def covered(m, model):
    mm, mo = maker(m), norm(model)
    for lm, lmo, lid, st in lib:
        if not (lm.startswith(mm[:4]) or mm.startswith(lm[:4])):
            continue
        if lmo == mo or (len(mo) >= 3 and (mo in lmo or lmo in mo)):
            return lid
    return None

# Traitement manuel : hors périmètre (câbles, consommables), imprécis, doublons, correspondances
TREAT = {}
tp = os.path.join(os.path.dirname(__file__), 'inventaire-traitement.csv')
if os.path.exists(tp):
    for r in csv.DictReader(open(tp, encoding='utf-8'), delimiter=';'):
        TREAT[(maker(r['marque']), norm(r['modele']))] = (r['traitement'], [x for x in r['fiches'].split(',') if x])
ids = {x[2] for x in lib}

rows = []
for path in sorted(glob.glob(os.path.join(ROOT, 'docs', 'inventaire', '*.csv'))):
    src = os.path.basename(path).split('-')[0]
    for r in csv.DictReader(open(path, encoding='utf-8'), delimiter=';'):
        rows.append((src, r.get('menu', ''), r.get('marque', ''), r.get('modele', ''), r.get('description_catalogue', '')))

seen = set()
todo = defaultdict(list)
done = 0
skipped = defaultdict(int)
for src, menu, m, model, desc in rows:
    key = (maker(m), norm(model))
    if key in seen:
        continue
    seen.add(key)
    tr = TREAT.get(key)
    if tr and tr[0] in ('hors', 'imprecis'):
        skipped[tr[0]] += 1
        continue
    if tr and tr[1] and all(f in ids for f in tr[1]):
        done += 1
        continue
    if covered(m, model):
        done += 1
    else:
        todo[(menu, m.strip())].append((model.strip(), desc.strip()))

total = len(seen) - sum(skipped.values())
print(f'Équipements distincts : {total} ; couverts : {done} ; reste : {total - done}'
      f' (hors périmètre : {skipped["hors"]}, imprécis : {skipped["imprecis"]})')
if '--reste' in sys.argv:
    only = sys.argv[sys.argv.index('--marque') + 1].lower() if '--marque' in sys.argv else None
    for (menu, m), items in sorted(todo.items(), key=lambda x: (x[0][0], -len(x[1]))):
        if only and only not in m.lower():
            continue
        print(f'\n[{menu}] {m} ({len(items)})')
        for model, desc in items:
            print(f'  - {model} : {desc[:80]}')
