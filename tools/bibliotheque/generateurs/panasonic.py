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

print(len(written), 'fiches :', ', '.join(written))
