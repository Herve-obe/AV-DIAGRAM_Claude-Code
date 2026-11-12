# Écrans LG (catalogue Novelty). Fiches techniques PDF LG lues directement (statut Vérifié) ; pour les modèles sans fiche
# accessible (pages lg.com refusées, erreur Akamai), connectique relevée sur les pages LG via l'index de recherche (Communauté).
from common import P, src, sheet, written

def ports(hdmi=3, hdmi_note='HDMI', dp_in=True, dvi=True, dp_out=True, ain=True, aout=True, usb=1, usb_note='USB 2.0 type A', rj45=True, ir=True):
    p = [P(f'hdmi{i}', f'HDMI In {i}', 'in', 'video', 'hdmi', format=hdmi_note(i) if callable(hdmi_note) else hdmi_note) for i in range(1, hdmi + 1)]
    if dp_in: p.append(P('dp-in', 'DP In', 'in', 'video', 'displayport', format='DisplayPort'))
    if dvi: p.append(P('dvi', 'DVI-D In', 'in', 'video', 'dvi', format='DVI-D, HDCP 1.4'))
    if dp_out: p.append(P('dp-out', 'DP Out', 'out', 'video', 'displayport', format='Recopie de l\'entrée choisie (chaînage)'))
    if ain: p.append(P('ain', 'Audio In', 'in', 'audioAnalog', 'minijack', format='Mini-jack'))
    if aout: p.append(P('aout', 'Audio Out', 'out', 'audioAnalog', 'minijack', format='Mini-jack'))
    p += [P(f'usb{i}', f'USB {i}' if usb > 1 else 'USB', 'bidir', 'control', 'usb-a', format=usb_note) for i in range(1, usb + 1)]
    p += [P('rs232-in', 'RS-232C In', 'in', 'control', 'minijack', format='Jack 3,5 mm 4 points'),
          P('rs232-out', 'RS-232C Out', 'out', 'control', 'minijack', format='Jack 3,5 mm 4 points')]
    if rj45: p.append(P('lan', 'LAN', 'bidir', 'network', 'rj45'))
    if ir: p.append(P('ir', 'IR / capteur', 'in', 'control', 'unspecified', format='Récepteur IR et capteur de lumière (fourni)'))
    p.append(P('ac', 'Secteur', 'in', 'power', 'unspecified', format='Alimentation intégrée 100-240 V ; connecteur non précisé'))
    return p
def lg(id, model, sources, p, status='verified', **kw):
    sheet(id, 'display', 'LG', model, 'display', sources, p, status=status, **kw)

UH5F_HDMI = lambda i: 'HDMI, HDCP 2.2 / 1.4' if i < 3 else 'HDMI, HDCP 1.4'
SMALL = [src('https://media.us.lg.com/m/282db330798d0252/original/UH5F-H-Series-Spec-Sheet.pdf', 'LG, spec sheet UHD Signage 65/55/49/43" UH5F-H')]
BIG = [src('https://www.lg.com/us/business/download/resources/CT00001837/LG_SPEC-SHEET_UH5F-H_Series_092059_LR%5B20201024_070213%5D.pdf', 'LG, spec sheet UHD Signage 98/86/75" UH5F-H')]
lg('lg-75uh5f-h', '75UH5F-H (75")', BIG, ports(hdmi_note=UH5F_HDMI, usb=2), powerW=260, weightKg=41.5)
lg('lg-55uh5f-h', '55UH5F-H (55")', SMALL, ports(hdmi_note=UH5F_HDMI), powerW=145, weightKg=19.0)
lg('lg-43uh5f-h', '43UH5F-H (43")', SMALL, ports(hdmi_note=UH5F_HDMI), powerW=110, weightKg=11.2)

SM5KE = [src('https://www.lg.com/us/business/download/resources/BT00001837/LG_SPEC-SHEET_SM5KE_061823_PR.pdf', 'LG, spec sheet SM5KE')]
lg('lg-55sm5ke', '55SM5KE (55")', SM5KE, ports(usb_note='USB 3.0'), powerW=115, weightKg=17.5)
lg('lg-43sm5ke', '43SM5KE (43")', SM5KE, ports(usb_note='USB 3.0'), powerW=95, weightKg=10.0)

# Sans fiche lisible : statut Communauté
lg('lg-98uh5e', '98UH5E (98")', [src('https://www.lg.com/uk/business/digital-signage/standard/98uh5e-b/', 'LG, page 98UH5E-B (lue via l\'index de recherche)')],
   ports(usb=2), status='community', powerW=560, weightKg=88)
lg('lg-32sm5j', '32SM5J (32")', [src('https://www.lg.com/global/business/commercial-display/digital-signage/standard/32sm5j/', 'LG, page 32SM5J (lue via l\'index de recherche)')],
   ports(dp_in=False, dvi=False, dp_out=False, ain=False), status='community', powerW=75)
lg('lg-75um3dg-h', '75UM3DG-H (75")', [src('https://www.lg.com/hk_en/business/information-display/digital-signage/standard-digital-signage/75um3dg-h/', 'LG, page 75UM3DG-H (lue via l\'index de recherche)')],
   ports(hdmi_note='HDMI, HDCP 2.2 / 1.4', dp_in=False, dvi=False, dp_out=False, ain=False), status='community')

print(len(written), 'fiches :', ', '.join(written))
