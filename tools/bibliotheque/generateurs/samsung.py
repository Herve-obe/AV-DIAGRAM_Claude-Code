# Écrans Samsung, sous les références du catalogue Novelty (désignations sans génération : décision du 2026-10-08).
# Connectique relevée sur les pages support Samsung US de la génération indiquée ; ces pages n'ont pas pu être
# chargées directement (contenu lu via l'index du moteur de recherche), d'où le statut Communauté.
# QM98F : fiche technique PDF lue directement (statut Vérifié).
from common import P, src, sheet, written

US = 'https://www.samsung.com/us/business/support/owners/product/'
def ports(spec):
    out = []
    add = out.append
    if 'vga' in spec: add(P('vga', 'D-Sub', 'in', 'video', 'vga', format='RGB analogique'))
    for i in range(1, spec.get('dvi', 0) + 1):
        add(P(f'dvi{i}', 'DVI-D' if spec.get('dvi') == 1 else f'DVI-D {i}', 'in', 'video', 'dvi', format=spec.get('dvi_note', 'DVI-D')))
    for i in range(1, spec.get('dp', 0) + 1):
        add(P(f'dp{i}', 'DisplayPort In' if spec.get('dp') == 1 else f'DisplayPort In {i}', 'in', 'video', 'displayport', format='DisplayPort 1.2'))
    for i in range(1, spec.get('hdmi', 0) + 1):
        add(P(f'hdmi{i}', f'HDMI {i}', 'in', 'video', 'hdmi', format=spec.get('hdmi_note', 'HDMI')))
    if spec.get('component'): add(P('component', 'Composante / CVBS', 'in', 'video', 'unspecified', format='Composante (CVBS commun) ; connecteur non précisé'))
    if spec.get('cvbs'): add(P('cvbs', 'CVBS', 'in', 'video', 'unspecified', format='Vidéo composite ; connecteur non précisé'))
    if spec.get('dp_loop'): add(P('dp-out', 'DisplayPort Loop-out', 'out', 'video', 'displayport', format='DisplayPort 1.2, chaînage'))
    if spec.get('dvi_out'): add(P('dvi-out', 'DVI-D Out', 'out', 'video', 'dvi', format='Chaînage'))
    if spec.get('ain', True): add(P('ain', 'Audio In', 'in', 'audioAnalog', 'minijack', format='Mini-jack stéréo'))
    if spec.get('aout'): add(P('aout', 'Audio Out', 'out', 'audioAnalog', 'minijack', format='Mini-jack stéréo'))
    for i in range(1, spec.get('usb', 0) + 1):
        add(P(f'usb{i}', 'USB' if spec.get('usb') == 1 else f'USB {i}', 'bidir', 'control', 'usb-a', format='USB 2.0'))
    rs = spec.get('rs232', 'inout')
    if rs:
        add(P('rs232-in', 'RS232C In', 'in', 'control', 'minijack', format='RS232C par jack stéréo'))
        if rs == 'inout': add(P('rs232-out', 'RS232C Out', 'out', 'control', 'minijack', format='RS232C par jack stéréo'))
    if spec.get('rj45', True): add(P('lan', 'RJ45', 'bidir', 'network', 'rj45', format='Contrôle et réseau'))
    add(P('ac', 'Secteur', 'in', 'power', 'unspecified', format='100-240 V, 50/60 Hz ; connecteur non précisé'))
    return out

def screen(ref, size, gen, page, spec, status='community', sources=None, **kw):
    note = f'Référence catalogue Novelty « {ref} » ; connectique de la génération Samsung {gen}' if gen != ref else None
    pr = ports(spec)
    if note:
        pr[-1] = P('ac', 'Secteur', 'in', 'power', 'unspecified', format='100-240 V, 50/60 Hz ; connecteur non précisé. ' + note)
    sheet(f'samsung-{ref.lower()}', 'display', 'Samsung', f'{ref} ({size})', 'display',
          sources or [src(US + page, f'Samsung, page support {gen}')], pr, status=status, **kw)

DBE = dict(vga=1, dvi=1, dvi_note='DVI-D (commun avec HDMI)', hdmi=1, component=True, usb=1)
screen('DB55', '55"', 'DB55E', 'db-series-digital-signage-db55e/', DBE)
screen('DB48', '48"', 'DB48E', 'db-series-digital-signage-db48e/', DBE, powerW=132)
# DB40E : la page support ne montre pas la connectique ; reprise de la série DB-E (DB32E, DB48E, DB55E), non confirmée
screen('DB40', '40"', 'DB40E (connectique supposée identique aux autres DB-E)', 'db-series-digital-signage-db40e/', DBE, powerW=121)
screen('DB32', '32"', 'DB32E', 'db-series-digital-signage-db32e/', DBE, powerW=77)
screen('DB22', '22"', 'DB22D', 'db-series-digital-signage-db22d/', dict(vga=1, hdmi=1, usb=1, rs232=None, rj45=False))
screen('DB10', '10,1"', 'DB10D', 'db-series-digital-signage-db10d/', dict(hdmi=1, usb=1, ain=False, rs232='in'))
screen('DM75', '75"', 'DM75E', 'dm-series-digital-signage-dm75e/', dict(vga=1, dvi=1, dp=1, hdmi=2, component=True, usb=1, dp_loop=True, aout=True))
screen('DM32', '32"', 'DM32E', 'dm-series-digital-signage-dm32e/', dict(vga=1, dvi=1, hdmi=1, component=True, usb=1, aout=True))
screen('ME95', '95"', 'ME95C', 'me-c-series-digital-signage-me95c/', dict(vga=1, dvi=1, dp=1, hdmi=3, component=True, dp_loop=True, aout=True), powerW=495)
screen('ME75', '75"', 'ME75C', 'me-c-series-digital-signage-me75c/', dict(vga=1, dvi=1, dp=1, hdmi=2, component=True, dp_loop=True, aout=True), powerW=319)
screen('ME32', '32"', 'ME32C', 'me-c-series-digital-signage-me32c/', dict(vga=1, dvi=1, dvi_out=True, dp=1, hdmi=2, component=True, usb=1, dp_loop=True, aout=True), powerW=77)
screen('ED75E', '75"', 'ED75E', 'ed-e-series-digital-signage-ed75e/', dict(vga=1, dvi=1, hdmi=1, cvbs=True, component=True, aout=True, rj45=False), powerW=275)
screen('UE55', '55"', 'UE55D', 'ue-d-series-digital-signage-ue55d/', dict(vga=1, dvi=1, dp=1, hdmi=1, component=True, usb=1, dp_loop=True, aout=True))
screen('UE46', '46"', 'UE46D', 'ue-d-series-digital-signage-ue46d/', dict(vga=1, dvi=1, dp=1, hdmi=1, component=True, dp_loop=True, aout=True))
screen('QB75H', '75"', 'QB75H', 'qb-h-series-digital-signage-qb75h/', dict(dvi=1, dp=1, hdmi=2, hdmi_note='HDMI 2.0, HDCP 2.2', usb=2), powerW=407)

# QM98F : fiche PDF Samsung (mai 2018) ; nombre de DisplayPort donné à 2 en page 1 et 3 dans le tableau :
# 2 retenu, confirmé par la page Samsung Display Solutions
screen('QM98F', '98"', 'QM98F', None, dict(dvi=1, dvi_note='DVI-I (RGB analogique et numérique)', dp=2, hdmi=4, hdmi_note='HDMI 1.4', usb=1, aout=True),
       status='verified',
       sources=[src('https://images.samsung.com/is/content/samsung/p5/de/display/pdf/Datenblatt_SMART_Signage_LH98QMFPBGCEN.pdf', 'Samsung, Datenblatt SMART Signage QM98F (Stand Mai 2018)')])

print(len(written), 'fiches :', ', '.join(written))
