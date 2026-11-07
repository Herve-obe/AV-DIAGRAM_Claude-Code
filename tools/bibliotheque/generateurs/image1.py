# Image : convertisseurs NDI Kiloview et enregistreur AJA (catalogue Novelty), d'après les documents constructeur.
from common import P, src, sheet, written

# Kiloview N50 / N60
KV_DS = src('https://enstatic.kiloview.com/wp-content/uploads/2025/12/PZeJVNWJ-N50_DataSheet_En_LG_V2.40.pdf', 'Kiloview, N50 Data Sheet V2.40')
KV_BR = src('https://enstatic.kiloview.com/wp-content/uploads/2025/10/N50-N60_Brochure.pdf', 'Kiloview, brochure N60/N50')
def kiloview(id, model, vin, vout, sources, dc, kg):
    ports = [vin, vout,
             P('lan1', 'LAN 1', 'bidir', 'videoIp', 'rj45', format='1 Gbit/s ; NDI (HB, HX2, HX3), SRT, RTMP, RTSP, HLS, UDP, RTP ; PoE IEEE 802.3at'),
             P('lan2', 'LAN 2', 'bidir', 'videoIp', 'rj45', format='1 Gbit/s ; secours ou agrégation'),
             P('ain', 'Audio In', 'in', 'audioAnalog', 'minijack', level='line-10', format='Mini-jack 3,5 mm, 2 canaux'),
             P('aout', 'Audio Out', 'out', 'audioAnalog', 'minijack', level='line-10', format='Mini-jack 3,5 mm, 2 canaux'),
             P('usb-a', 'USB-A', 'bidir', 'control', 'usb-a', format='USB 3.0 : stockage, PTZ, intercom, tally'),
             P('usb-c', 'USB-C', 'bidir', 'control', 'usb-c', format='USB 3.0'),
             dc]
    sheet(id, 'videoRouting', 'Kiloview', model, 'router', sources, ports, powerW=16, weightKg=kg)
kiloview('kiloview-n50', 'N50 (12G-SDI / NDI)',
         P('sdi-in', '12G-SDI In', 'in', 'video', 'bnc', format='12G-SDI, jusqu\'à 4K UHD'),
         P('sdi-out', '12G-SDI Out', 'out', 'video', 'bnc', format='Recopie de l\'entrée (encodage) ou sortie décodée (décodage)'),
         [KV_DS, KV_BR], P('dc', 'Alimentation DC', 'in', 'power', 'unspecified', format='12 à 18 V CC (connecteur non précisé) ou PoE'), 0.52)
kiloview('kiloview-n60', 'N60 (HDMI / NDI)',
         P('hdmi-in', 'HDMI In', 'in', 'video', 'hdmi', format='HDMI 2.0, 4Kp60'),
         P('hdmi-out', 'HDMI Out', 'out', 'video', 'hdmi', format='HDMI 2.0, 4Kp60'),
         [KV_BR], P('dc', 'Alimentation DC', 'in', 'power', 'unspecified', format='Tension et connecteur non précisés dans la brochure ; PoE possible'), 0.48)

# AJA Ki Pro Ultra 12G
AJA = [src('https://www.aja.com/assets/support/files/8952/en/AJA_Ki_Pro_Ultra_12G_Manual_v2.5r3.pdf', 'AJA, Ki Pro Ultra 12G Manual v2.5r3, Appendix A')]
p = [P('sdi12-in', '12G-SDI In', 'in', 'video', 'bnc', format='12G-SDI (SMPTE 2081/2082)'),
     *[P(f'sdi3-in{i}', f'3G-SDI In {i}', 'in', 'video', 'bnc', format='3G-SDI ; quad link possible') for i in (2, 3, 4)],
     P('sdi12-out', '12G-SDI Out', 'out', 'video', 'bnc', format='12G-SDI'),
     *[P(f'sdi3-out{i}', f'3G-SDI Out {i}', 'out', 'video', 'bnc', format='3G-SDI') for i in (2, 3, 4)],
     *[P(f'sfp-in{i}', f'SFP In {i}', 'in', 'video', 'sfp', format='Module SFP optionnel : fibre ou HD-BNC') for i in range(1, 5)],
     *[P(f'sfp-out{i}', f'SFP Out {i}', 'out', 'video', 'sfp', format='Module SFP optionnel : fibre ou HD-BNC') for i in range(1, 5)],
     P('hdmi-in', 'HDMI In', 'in', 'video', 'hdmi', format='HDMI 2.0, type A'),
     P('hdmi-out', 'HDMI Out', 'out', 'video', 'hdmi', format='HDMI 2.0, type A'),
     P('mon', 'Monitor Out', 'out', 'video', 'unspecified', format='Sortie SDI de contrôle 2K / HD (connecteur non détaillé en annexe)'),
     P('ana', 'Audio analogique', 'bidir', 'audioAnalog', 'dsub25', channels=8, format='DB-25 brochage TASCAM, 8 entrées et 8 sorties symétriques'),
     P('aes', 'AES/EBU', 'bidir', 'audioDigital', 'dsub25', channels=8, format='DB-25 brochage TASCAM (demi-connecteur), 110 ohms'),
     P('rca', 'Sortie RCA', 'out', 'audioAnalog', 'rca', level='line-10', channels=2, format='2 RCA asymétriques'),
     P('phones', 'Casque', 'out', 'audioAnalog', 'minijack', format='Jack 3,5 mm stéréo'),
     P('ltc-in', 'LTC In', 'in', 'sync', 'bnc'),
     P('ltc-out', 'LTC Out', 'out', 'sync', 'bnc'),
     P('ref1', 'Reference', 'in', 'sync', 'bnc', format='Tri-level ou black burst, bouclée non terminée'),
     P('ref2', 'Reference Loop', 'out', 'sync', 'bnc', format='Bouclage de la référence'),
     P('rs422', 'RS-422', 'bidir', 'control', 'dsub9', format='Protocole Sony 9 broches'),
     P('lan', 'LAN', 'bidir', 'network', 'rj45', format='10/100/1000, serveur web'),
     P('dc', 'Alimentation', 'in', 'power', 'xlr4', format='12-18 V CC, XLR 4 points (châssis) ; alimentation double redondante ; bloc secteur 100-240 V')]
sheet('aja-ki-pro-ultra-12g', 'recording', 'AJA', 'Ki Pro Ultra 12G', 'recorder', AJA, p, domain='image', powerW=65, weightKg=2.6)

# AJA Ki Pro Rack
KPR = [src('https://www.aja.com/assets/support/files/8949/en/AJA_Ki_Pro_Rack_Manual_v6.8r2.pdf', 'AJA, Ki Pro Rack Manual v6.8r2, Appendix A')]
p = [P('sdi-in1', 'SDI In 1', 'in', 'video', 'bnc', format='SD/HD-SDI ; entrée choisie par logiciel'),
     P('sdi-in2', 'SDI In 2', 'in', 'video', 'bnc', format='SD/HD-SDI'),
     P('sdi-out', 'SDI Out', 'out', 'video', 'bnc', format='SD/HD-SDI'),
     P('hdmi-in', 'HDMI In', 'in', 'video', 'hdmi', format='HDMI 1.3'),
     P('hdmi-out', 'HDMI Out', 'out', 'video', 'hdmi', format='HDMI 1.3'),
     *[P(f'comp-in-{c}', f'Composante In {c}', 'in', 'video', 'bnc', format='Composante SD/HD (composite sur Y)') for c in ('Y', 'Pb', 'Pr')],
     *[P(f'comp-out-{c}', f'Composante Out {c}', 'out', 'video', 'bnc', format='Composante (composite sur Y)') for c in ('Y', 'Pb', 'Pr')],
     *[P(f'aes-in{i}', f'AES In {i}', 'in', 'audioDigital', 'bnc', channels=2, format='AES/EBU') for i in range(1, 5)],
     *[P(f'aes-out{i}', f'AES Out {i}', 'out', 'audioDigital', 'bnc', channels=2, format='AES/EBU') for i in range(1, 5)],
     *[P(f'ain{i}', f'Audio In {i}', 'in', 'audioAnalog', 'xlr3', level='line+4', format='Symétrique, +24 dBu = 0 dBFS') for i in (1, 2)],
     *[P(f'aout{i}', f'Audio Out {i}', 'out', 'audioAnalog', 'xlr3', level='line+4', format='Symétrique, +24 dBu = 0 dBFS') for i in (1, 2)],
     P('ltc-in', 'LTC In', 'in', 'sync', 'bnc'), P('ltc-out', 'LTC Out', 'out', 'sync', 'bnc', format='Actif en lecture'),
     P('ref1', 'Reference', 'in', 'sync', 'bnc'), P('ref2', 'Reference Loop', 'out', 'sync', 'bnc'),
     P('rs422', 'RS-422', 'bidir', 'control', 'dsub9', format='Protocole Sony 9 broches'),
     P('lan', 'LAN', 'bidir', 'network', 'rj45', format='10/100/1000, serveur web'),
     P('ac1', 'Secteur 1', 'in', 'power', 'unspecified', format='100-240 V ; alimentations doubles redondantes'),
     P('ac2', 'Secteur 2', 'in', 'power', 'unspecified', format='100-240 V (redondance)')]
sheet('aja-ki-pro-rack', 'recording', 'AJA', 'Ki Pro Rack', 'recorder', KPR, p, domain='image', powerW=40, weightKg=3.4, rackU=1)

# Embeddeurs / désembeddeurs audio analogiques
def ama(id, model, url, doc, rate, v, **kw):
    nout = kw.pop('nout', 1)
    ports = [P('sdi-in', 'SDI In', 'in', 'video', 'bnc', format=rate)] + [P(f'sdi-out{i}', f'SDI Out {i}' if nout > 1 else 'SDI Out', 'out', 'video', 'bnc', format=rate) for i in range(1, nout + 1)] + [
             *[P(f'ain{i}', f'Audio In {i}', 'in', 'audioAnalog', 'xlr3', format='Symétrique ; XLR femelle' + kw.get('via', '')) for i in range(1, 5)],
             *[P(f'aout{i}', f'Audio Out {i}', 'out', 'audioAnalog', 'xlr3', format='Symétrique ; XLR mâle' + kw.get('via', '')) for i in range(1, 5)],
             P('dc', 'Alimentation', 'in', 'power', 'unspecified', format=f'{v}, bloc secteur fourni ; connecteur non précisé')]
    kw.pop('via', None)
    sheet(id, 'videoRouting', 'AJA', model, 'router', [src(url, doc)], ports, powerW=5, **kw)
ama('aja-3g-ama', '3G-AMA', 'https://www.aja.com/products/3g-ama/spec-sheet.pdf', 'AJA, spec sheet 3G-AMA', '3G-SDI', '+5 à 20 V CC',
    via=', par câble d\'éclatement DB-25')
ama('aja-hd10ama', 'HD10AMA', 'https://www.aja.com/products/hd10ama/spec-sheet.pdf', 'AJA, spec sheet HD10AMA', 'HD/SD-SDI', '+5 à 18 V CC',
    nout=2)

print(len(written), 'fiches :', ', '.join(written))
