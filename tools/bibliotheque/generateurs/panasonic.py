# Caméras tourelles Panasonic (catalogue Novelty), d'après les pages de caractéristiques et manuels Panasonic.
from common import P, src, sheet, written

PA = 'https://pro-av.panasonic.net/en/products/'
def cam(id, model, sources, ports, **kw):
    sheet(id, 'camera', 'Panasonic', model, 'camera', sources, ports, **kw)

cam('panasonic-aw-ue150', 'AW-UE150', [src(PA + 'aw-ue150/spec.html', 'Panasonic, AW-UE150 Specifications')], [
    P('hdmi', 'HDMI Out', 'out', 'video', 'hdmi', format='HDMI 2.0, 4:2:2 10 bits, sans HDCP'),
    P('sdi12', '12G-SDI Out', 'out', 'video', 'bnc', format='SMPTE 2082-1'),
    P('sdi3', '3G-SDI Out', 'out', 'video', 'bnc', format='SMPTE 424M / 292, niveau A ou B'),
    P('moni', 'MONI Out', 'out', 'video', 'bnc', format='HD-SDI (SMPTE 292), retour'),
    P('sfp', 'Fibre optique', 'out', 'video', 'sfp', format='Cage SFP+ (sortie uniquement)'),
    P('gl', 'G/L In', 'in', 'sync', 'bnc', format='Black burst ou tri-level'),
    P('lan', 'LAN', 'bidir', 'videoIp', 'rj45', format='100BASE-TX / 1000BASE-T ; contrôle IP, flux H.264/H.265, NDI HX2, SRT ; alimentation PoE++'),
    P('rs422', 'RS-422', 'in', 'control', 'rj45', format='CONTROL IN RS-422A (RJ45), protocole AW'),
    P('mic', 'MIC/LINE In', 'in', 'audioAnalog', 'minijack', format='Mini-jack stéréo 3,5 mm ; micro (alimentation plug-in) ou ligne -10 dBV ; flux IP uniquement'),
    P('dc', 'DC 12 V In', 'in', 'power', 'unspecified', format='12 V CC (10,8 à 13,2 V), 4,0 A, prise de type XLR (nombre de points non précisé)'),
], weightKg=4.2)

cam('panasonic-aw-ue100', 'AW-UE100', [src(PA + 'aw-ue100/spec.html', 'Panasonic, AW-UE100 Specifications')], [
    P('hdmi', 'HDMI Out', 'out', 'video', 'hdmi', format='HDMI 2.0, 4K'),
    P('sdi12', '12G-SDI Out', 'out', 'video', 'bnc', format='SMPTE 2082-1 / 424M / 292M'),
    P('sdi3', '3G-SDI Out', 'out', 'video', 'bnc', format='SMPTE 424M / 292M'),
    P('gl', 'G/L In', 'in', 'sync', 'bnc', format='Black burst ou tri-level, 75 ohms'),
    P('lan', 'LAN', 'bidir', 'videoIp', 'rj45', format='100BASE-TX / 1000BASE-T ; contrôle IP et vidéo ; alimentation PoE++'),
    P('rs422', 'RS-422', 'in', 'control', 'rj45', format='CONTROL IN RS-422A (RJ45)'),
    P('mic', 'MIC/LINE In', 'in', 'audioAnalog', 'minijack', format='Mini-jack stéréo 3,5 mm (SDI, HDMI, IP)'),
    P('dc', 'DC 12 V In', 'in', 'power', 'unspecified', format='12 V CC, 3,0 A, adaptateur secteur fourni'),
], weightKg=2.2)

cam('panasonic-aw-he130', 'AW-HE130', [src('https://pro-av.panasonic.net/manual/pdf/AW-HE130WPE_KPE_OPERATION(VQT5L27A-2)_E.pdf',
                                           'Panasonic, AW-HE130 Operating Instructions VQT5L27A-2')], [
    P('hdmi', 'HDMI Out', 'out', 'video', 'hdmi'),
    P('sdi', 'SDI Out', 'out', 'video', 'bnc'),
    P('video', 'Video Out', 'out', 'video', 'bnc', format='Composite 1,0 V crête-crête, retour'),
    P('gl', 'G/L In', 'in', 'sync', 'bnc', format='Synchro externe'),
    P('lan', 'LAN', 'bidir', 'videoIp', 'rj45', format='Contrôle IP et vidéo ; alimentation PoE+'),
    P('rs422', 'RS-422', 'in', 'control', 'rj45', format='Contrôle série (RJ45)'),
    P('rs232-in', 'RS-232C In', 'in', 'control', 'minidin8', format='Mini-DIN 8 points'),
    P('rs232-out', 'RS-232C Out', 'out', 'control', 'minidin8', format='Mini-DIN 8 points'),
    P('audio', 'Audio In', 'in', 'audioAnalog', 'minijack', format='MIC/LINE, mini-jack stéréo 3,5 mm'),
    P('dc', 'DC 12 V In', 'in', 'power', 'unspecified', format='12 V CC, 1,8 A, adaptateur secteur fourni'),
])

# AV-HS6000 : unité principale AV-HS60U2 et pupitre AV-HS60C2 (mode Standard)
HS = [src(PA + 'av-hs6000/spec.html', 'Panasonic, AV-HS6000 Specifications')]
u = [*[P(f'sdi-in{i}', f'SDI In {i}', 'in', 'video', 'bnc', format='HD-SDI (3G-SDI selon le mode)') for i in range(1, 33)],
     *[P(f'dvi-in{i}', f'DVI-D In {i}', 'in', 'video', 'dvi', format='DVI-D sans HDCP, câble 5 m max.') for i in (1, 2)],
     *[P(f'sdi-out{i}{c}', f'SDI Out {i}{c}', 'out', 'video', 'bnc', format='16 sorties affectables, 2 BNC distribués par sortie') for i in range(1, 17) for c in 'ab'],
     P('ref-in', 'REF', 'in', 'sync', 'bnc', format='Black burst ou tri-level, bouclé'),
     P('ref-loop', 'REF Loop', 'out', 'sync', 'bnc', format='Bouclage (terminer à 75 ohms si inutilisé)'),
     P('ltc', 'LTC In', 'in', 'sync', 'bnc'),
     P('lan', 'LAN', 'bidir', 'network', 'rj45', format='100BASE-TX, contrôle IP'),
     P('panel', 'PANEL', 'bidir', 'control', 'rj45', format='Liaison vers le pupitre AV-HS60C2 / C4'),
     *[P(f'com{i}', f'COM{i}', 'bidir', 'control', 'dsub9', format='RS-422' + (' maître/esclave' if i == 4 else ' maître')) for i in range(1, 5)],
     P('gpi-in', 'GPI IN', 'in', 'control', 'dsub25', format='18 entrées GPI, 1 sortie alarme'),
     P('gpi-out1', 'GPI OUT 1', 'out', 'control', 'dsub25', format='Sorties GPI / tally (48 au total sur 2 connecteurs)'),
     P('gpi-out2', 'GPI OUT 2', 'out', 'control', 'dsub25', format='Sorties GPI / tally'),
     P('ac', 'Secteur', 'in', 'power', 'unspecified', format='100-240 V ; alimentation redondante possible')]
sheet('panasonic-av-hs60u2', 'videoSwitcher', 'Panasonic', 'AV-HS60U2 (unité principale AV-HS6000)', 'switcher', HS, u, powerW=110, weightKg=13.5)
c = [P('mainframe', 'MAIN FRAME', 'bidir', 'control', 'rj45', format='Liaison vers l\'unité AV-HS60U2'),
     P('menu', 'MENU PANEL', 'out', 'video', 'dvi', format='Panneau de menu AV-HS60CS3 (exclusif avec la sortie DVI-D)'),
     P('dvi', 'DVI-D', 'out', 'video', 'dvi', format='Écran de menu'),
     P('usb', 'USB', 'bidir', 'control', 'usb-a', format='Souris / clavier pour le menu'),
     P('com1', 'COM1', 'bidir', 'control', 'dsub9', format='RS-422'),
     P('gpi', 'GPI I/O', 'bidir', 'control', 'dsub25', format='8 entrées GPI'),
     P('ac', 'Secteur', 'in', 'power', 'unspecified', format='100-240 V ; alimentation redondante possible')]
sheet('panasonic-av-hs60c2', 'videoSwitcher', 'Panasonic', 'AV-HS60C2 (pupitre AV-HS6000)', 'console', HS, c, powerW=40, weightKg=13.9)

# AV-HS410 (configuration de base, sans cartes optionnelles)
h = [*[P(f'sdi-in{i}', f'SDI In {i}', 'in', 'video', 'bnc', format='HD/SD-SDI') for i in range(1, 9)],
     P('dvi-in', 'DVI-D In', 'in', 'video', 'dvi', format='DVI-D avec scaler, sans HDCP'),
     *[P(f'sdi-out{i}', f'SDI Out {i}', 'out', 'video', 'bnc', format='HD/SD-SDI') for i in range(1, 6)],
     P('dvi-out', 'DVI-D Out', 'out', 'video', 'dvi', format='Programme ou multiview haute résolution'),
     P('ref-in', 'REF IN/OUT', 'in', 'sync', 'unspecified', format='Référence (bouclée) ; connecteur non précisé dans la brochure'),
     P('ref-out', 'REF OUT', 'out', 'sync', 'unspecified', format='2 sorties référence'),
     P('tally1', 'TALLY/GPI 1', 'bidir', 'control', 'dsub15'),
     P('tally2', 'TALLY/GPI 2', 'bidir', 'control', 'dsub15'),
     P('lan', 'LAN', 'bidir', 'network', 'rj45'),
     P('com', 'COM', 'bidir', 'control', 'dsub9', format='RS-422A'),
     P('editor', 'EDITOR', 'bidir', 'control', 'dsub9', format='RS-422A, éditeur'),
     P('ac', 'Secteur', 'in', 'power', 'unspecified', format='100-240 V, 50/60 Hz'),
     P('slots', 'Emplacements d\'extension', 'bidir', 'video', 'unspecified', format='2 emplacements : jusqu\'à 13 entrées et 10 sorties avec cartes')]
sheet('panasonic-av-hs410', 'videoSwitcher', 'Panasonic', 'AV-HS410', 'switcher',
      [src('https://na.panasonic.com/ns/22629_AV-HS410_Brochure_PDF.pdf', 'Panasonic, brochure AV-HS410 Live Switcher'),
       src('http://business.panasonic.com/AV-HS410.html', 'Panasonic, page produit AV-HS410 (88 W, 6,2 kg)')], h, powerW=88, weightKg=6.2)

print(len(written), 'fiches :', ', '.join(written))
