# Projecteurs Robe (catalogue Novelty), lus dans les fiches PDF du constructeur (cdn.aws.robe.cz/print/en_product_<n>.pdf).
import os, re, subprocess, urllib.request
from common import P, src, sheet, written

CACHE = '/tmp/claude-0/-home-user-AV-DIAGRAM/1e2d7728-05ac-5fcc-8561-5f14338399e0/scratchpad/robe'
URL = 'https://cdn.aws.robe.cz/print/en_product_{}.pdf'

def text(pid):
    f = f'{CACHE}/p{pid}.pdf'
    if not os.path.exists(f):
        os.makedirs(CACHE, exist_ok=True)
        urllib.request.urlretrieve(URL.format(pid), f)
    return subprocess.run(['pdftotext', '-layout', f, '-'], capture_output=True, text=True).stdout

def field(lines, *keys):
    for l in lines:
        m = re.match(r'^[\s•]*(' + '|'.join(keys) + r')\s*:\s*(.*)$', l, re.I)
        if m:
            return m.group(2).strip()
    return None

def fixture(id, pid, model):
    lines = text(pid).splitlines()
    ports = []
    protocols = field(lines, 'Protocols') or ''
    crmx_note = ''
    for l in lines:
        if 'Wireless CRMX' in l:
            crmx_note = ' ; sans fil CRMX LumenRadio' + (' en option' if re.search(r'on request', l, re.I) else '')
            break
    data = field(lines, 'DMX and RDM data in/out', 'Data in/out')
    if data:
        f = 'DMX-512 / RDM' + crmx_note
        for pins in ('5', '3'):
            if f'{pins}-pin' in data:
                ports += [P(f'dmx-in{pins}', f'DMX In (XLR{pins})', 'in', 'dmx', f'xlr{pins}', format=f),
                          P(f'dmx-out{pins}', f'DMX Out (XLR{pins})', 'out', 'dmx', f'xlr{pins}', format='Recopie DMX')]
    net = [l for l in lines if re.match(r'^[\s•]*Ethernet port', l)]
    nf = ', '.join(p.strip() for p in protocols.split(',') if p.strip() not in ('USITT DMX-512', 'RDM')) or 'Ethernet'
    for l in net:
        v = l.split(':', 1)[1].strip()
        opt = ' (en option)' if re.search(r'on request', v, re.I) else ''
        epass = ' ; switch Epass intégré' if 'Epass' in v else ''
        kind = re.match(r'^[\s•]*Ethernet port (in/out|in|out)', l).group(1)
        if 'camera' in v:
            ports.append(P('video', 'Sortie vidéo caméra', 'out', 'network', 'rj45', format='RJ45, flux vidéo de la caméra'))
            continue
        conn = 'rj45'
        if kind in ('in', 'in/out') and not any(p['id'] == 'eth-in' for p in ports):
            ports.append(P('eth-in', 'Ethernet In', 'bidir', 'network', conn, format=nf + epass + opt))
        if kind == 'in/out' and not any(p['id'] == 'eth-out' for p in ports):
            ports.append(P('eth-out', 'Ethernet Out', 'bidir', 'network', conn, format='Recopie Ethernet' + epass + opt))
    pw = field(lines, 'Power in connector', 'Power in/out connector', 'Power connector in')
    if pw:
        conn = 'powercon-true1' if 'TRUE1' in pw else 'powercon'
        ports.append(P('ac-in', 'Secteur', 'in', 'power', conn, format='Neutrik ' + ('powerCON TRUE1' if 'TRUE1' in pw else 'powerCON') + (' IP65' if 'IP65' in pw else '')))
        if 'in/out' in pw:
            ports.append(P('ac-out', 'Recopie secteur', 'out', 'power', conn, format='Chaînage secteur'))
    else:
        ports.append(P('ac-in', 'Secteur', 'in', 'power', 'unspecified', format='Connecteur non précisé dans la fiche'))
    cons = field(lines, 'Power consumption')
    w = re.search(r'([\d.]+)\s*W', cons or '')
    weights = [field([l], 'Weight') for l in lines if re.match(r'^[\s•]*Weight\s*:', l)]
    kg = float(re.match(r'([\d.]+)', weights[0]).group(1)) if len(weights) == 1 else None
    sheet(id, 'luminaire', 'Robe', model, 'light', [src(URL.format(pid), f'Robe lighting, fiche produit {model}')], ports,
          powerW=float(w.group(1)) if w else None, weightKg=kg)

for id, pid, model in [
    ('robe-bmfl-blade', 1063, 'BMFL Blade'),
    ('robe-megapointe', 635, 'MegaPointe'),
    ('robe-pointe', 2, 'Pointe'),
    ('robe-bmfl-followspot-lt', 643, 'BMFL FollowSpot LT'),
    ('robe-bmfl-washbeam', 650, 'BMFL WashBeam'),
    ('robe-iforte-ltx', 5442, 'iFORTE LTX'),
    ('robe-forte', 4220, 'FORTE'),
    ('robe-esprite', 651, 'ESPRITE'),
    ('robe-minime', 867, 'MiniMe'),
    ('robe-tarrantula', 666, 'Tarrantula'),
    ('robe-spiider', 667, 'Spiider'),
    ('robe-spikie', 664, 'Spikie'),
    ('robe-ibolt', 5444, 'iBOLT'),
    ('robe-ledbeam-150', 668, 'LEDBeam 150'),
    ('robe-iforte-fresnel', 6154, 'iFORTE Fresnel'),
    ('robe-patt-2013', 682, 'PATT 2013'),
    ('robe-onepatt', 683, 'ONEPATT'),
]:
    fixture(id, pid, model)

print(len(written), 'fiches :', ', '.join(written))
