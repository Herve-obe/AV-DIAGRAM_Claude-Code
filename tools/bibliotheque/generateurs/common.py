# Aide à l'écriture des fiches de bibliothèque (src/library/devices/*.json).
import json, os
DEV = '/home/user/av-diagram_claude-code/src/library/devices'
ACCESSED = '2026-09-25'
written = []

def P(id, name, direction, signal, connector, **kw):
    p = {'id': id, 'name': name, 'direction': direction, 'signal': signal, 'connector': connector}
    for k in ('level', 'channels', 'format', 'phantom'):
        if kw.get(k) is not None:
            p[k] = kw[k]
    return p

def src(url=None, document=None):
    s = {}
    if url: s['url'] = url
    if document: s['document'] = document
    s['accessed'] = ACCESSED
    return s

def sheet(id, family, manufacturer, model, pictogram, sources, ports, status='verified', **kw):
    d = {'id': id, 'family': family, 'manufacturer': manufacturer, 'model': model, 'pictogram': pictogram, 'status': status}
    for k in ('domain', 'powerW', 'weightKg', 'rackU'):
        if kw.get(k) is not None:
            d[k] = kw[k]
    d['sources'] = sources
    d['ports'] = ports
    ids = [p['id'] for p in ports]
    assert len(ids) == len(set(ids)), f'{id}: ports en double'
    with open(os.path.join(DEV, id + '.json'), 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
        f.write('\n')
    written.append(id)

def spk(prefix, n, name, connector, fmt, first_in=True, level='speaker'):
    """n connecteurs haut-parleur identiques : le premier en entrée, les suivants en recopie (link)."""
    out = []
    for i in range(n):
        d = 'in' if (i == 0 and first_in) else 'out'
        out.append(P(f'{prefix}{i+1}', name if n == 1 else (f'{name} {i+1}' if i == 0 else f'{name} {i+1} (link)'), d, 'audioAnalog', connector, level=level, format=fmt if i == 0 else 'En parallèle avec l\'entrée (chaînage)'))
    return out

def mic(id, manufacturer, model, sources, phantom, connector='xlr3', fmt=None, status='verified', weightKg=None, family='capture', pictogram='mic'):
    """Microphone : une sortie niveau micro ; phantom = 'required' ou 'none'."""
    f = fmt or ('Statique, alimentation fantôme requise' if phantom == 'required' else 'Dynamique')
    sheet(id, family, manufacturer, model, pictogram, sources,
          [P('out', 'Sortie', 'out', 'audioAnalog', connector, level='mic', phantom=phantom, format=f)],
          status=status, weightKg=weightKg)
