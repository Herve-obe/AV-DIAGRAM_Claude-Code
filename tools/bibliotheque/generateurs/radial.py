# Boîtes de direct et accessoires Radial Engineering, d'après les pages produit (onglet Specifications) et les Smart Sheets.
from common import P, src, sheet, written

R = 'https://www.radialeng.com/product/'
def S(slug, pdf=None, name=None):
    s = [src(R + slug)]
    if pdf:
        s.append(src('https://www.radialeng.com/wp-content/uploads/' + pdf, f'Radial Engineering, Smart Sheet {name}'))
    return s
def di(id, model, sources, ports, **kw):
    sheet(id, 'capture', 'Radial Engineering', model, 'di', sources, ports, **kw)

# J48 : active, fantôme 48 V
di('radial-j48', 'J48', S('j48', '2018/03/J48-SmartSheet-05-2021.pdf', 'J48'), [
    P('in', 'Entrée', 'in', 'audioAnalog', 'jack-ts', level='instrument', format='Jack 6,35, 220 kohm'),
    P('thru', 'Thru', 'out', 'audioAnalog', 'jack-ts', level='instrument', format='Recopie de l\'entrée vers l\'ampli'),
    P('out', 'Sortie', 'out', 'audioAnalog', 'xlr3', level='mic', phantom='required', format='XLR symétrique 200 ohms ; alimentation fantôme 48 V (convertisseur à découpage)'),
], weightKg=0.72)

# JDI : passive à transformateur
di('radial-jdi', 'JDI', S('jdi', '2017/12/Radial-SmartSheetBook-JDI.pdf', 'JDI'), [
    P('in', 'Input', 'in', 'audioAnalog', 'jack-ts', level='instrument', format='Jack, 140 kohm asymétrique'),
    P('thru', 'Thru', 'out', 'audioAnalog', 'jack-ts', level='instrument', format='Recopie vers l\'ampli (fonction Merge : mélange passif input + thru)'),
    P('out', 'Sortie', 'out', 'audioAnalog', 'xlr3', level='mic', format='XLR symétrique niveau micro, 150 ohms, transformateur JT-DB-EPC, passif'),
], weightKg=0.703)

# ProD2 : passive stéréo
ports = []
for c, n in (('l', 'G'), ('r', 'D')):
    ports += [P(f'in-{c}', f'Entrée {n}', 'in', 'audioAnalog', 'jack-ts', level='instrument', format='Jack 6,35, 140 kohm asymétrique'),
              P(f'thru-{c}', f'Thru {n}', 'out', 'audioAnalog', 'jack-ts', level='instrument', format='Recopie de l\'entrée'),
              P(f'out-{c}', f'Sortie {n}', 'out', 'audioAnalog', 'xlr3', level='mic', format='XLR symétrique 150 ohms, passif')]
di('radial-prod2', 'ProD2', S('prod2'), ports, weightKg=0.54)

# ProAV1 : passive mono, entrées multiples
di('radial-proav1', 'ProAV1', S('proav1'), [
    P('in-jack', 'Entrée jack', 'in', 'audioAnalog', 'jack-ts', level='instrument', format='Jack 6,35, 140 kohm'),
    P('in-rca', 'Entrée RCA', 'in', 'audioAnalog', 'rca', level='line-10'),
    P('in-mini', 'Entrée mini-jack', 'in', 'audioAnalog', 'minijack', level='line-10', format='3,5 mm TRS (fonction Mono Sum)'),
    P('in-xlr', 'Entrée XLR', 'in', 'audioAnalog', 'xlr3'),
    P('thru-jack', 'Thru jack', 'out', 'audioAnalog', 'jack-ts', format='Recopie'),
    P('thru-rca', 'Thru RCA', 'out', 'audioAnalog', 'rca', format='Recopie'),
    P('out', 'Sortie', 'out', 'audioAnalog', 'xlr3', level='mic', format='XLR symétrique 150 ohms, passif'),
], weightKg=0.73)

# JPC : interface stéréo active pour ordinateur ; la répartition des entrées par canal n'est pas détaillée (fiche communauté)
di('radial-jpc', 'JPC', S('jpc'), [
    P('in-jack', 'Entrée jack 6,35', 'in', 'audioAnalog', 'unspecified', level='line-10', channels=2, format='1/4 pouce, 10 kohm ; nombre et câblage des jacks non précisés'),
    P('in-rca', 'Entrée RCA', 'in', 'audioAnalog', 'rca', level='line-10', channels=2),
    P('in-mini', 'Entrée mini-jack', 'in', 'audioAnalog', 'minijack', level='line-10', channels=2, format='3,5 mm TRS'),
    P('out-l', 'Sortie G', 'out', 'audioAnalog', 'xlr3', level='mic', phantom='required', format='XLR 600 ohms, fantôme 48 V exigé sur chaque canal'),
    P('out-r', 'Sortie D', 'out', 'audioAnalog', 'xlr3', level='mic', phantom='required', format='XLR 600 ohms, fantôme 48 V exigé sur chaque canal'),
], status='community', weightKg=0.72)

# Twin-Iso : isolateur de ligne 2 canaux (transformateurs Jensen)
ports = []
for c in (1, 2):
    ports += [P(f'in{c}', f'Entrée {c}', 'in', 'audioAnalog', 'xlr3', level='line+4', format='XLR femelle, 600 ohms symétrique'),
              P(f'out{c}', f'Sortie {c}', 'out', 'audioAnalog', 'xlr3', level='line+4', format='XLR mâle, 600 ohms symétrique, ground lift')]
sheet('radial-twin-iso', 'processing', 'Radial Engineering', 'Twin-Iso', 'processor', S('twin-iso', '2018/04/smartsheet-twiniso.pdf', 'Twin-Iso'), ports)

# HotShot DM1 : commutateur au pied pour micro dynamique, passif
sheet('radial-hotshot-dm1', 'processing', 'Radial Engineering', 'HotShot DM1', 'processor',
      S('hotshot-dm1', '2018/04/Radial-SmartSheet-Hotshot-DM1_01-2022.pdf', 'HotShot DM1'), [
    P('in', 'Entrée micro', 'in', 'audioAnalog', 'xlr3', level='mic', format='XLR, micro dynamique'),
    P('out-a', 'Output A', 'out', 'audioAnalog', 'xlr3', level='mic', format='Sortie directe vers la façade'),
    P('out-b', 'Output B', 'out', 'audioAnalog', 'xlr3', level='mic', format='Sortie commutée par la pédale (talkback vers les retours ou l\'intercom)'),
], weightKg=0.56)

print(len(written), 'fiches :', ', '.join(written))
