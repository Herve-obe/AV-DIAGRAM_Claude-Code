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

print(len(written), 'fiches :', ', '.join(written))
