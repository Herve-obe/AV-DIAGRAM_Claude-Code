# Image (fin) : Canon XF605, Kiloview E3 / N6, Lumantek ez-Pro VS10 / VS4, SWIT FLOW500, Absen PL3.9 Pro V2 / PL2.5,
# Ross Carbonite Black Solo / Ultrix FR2, Barco E2 / EC-50, Folsom ImagePRO-HD / ImagePRO-II / MatrixPRO 8x8 HD-SDI,
# Datapath X4, Analog Way NeXtage 16 4K, NewTek 3Play 4800, Teradek Bolt 500 XT / Beam.
from common import P, src, sheet
U = 'unspecified'
def R(*pairs): return [src(u, d) for u, d in pairs]
def sdi(id, name, d, fmt=None): return P(id, name, d, 'video', 'bnc', format=fmt)
def many(prefix, label, n, d, conn, fmt=None, sig='video'): return [P(f'{prefix}{i}', f'{label} {i}', d, sig, conn, format=fmt) for i in range(1, n + 1)]
def ac(fmt=None): return P('ac', 'Secteur', 'in', 'power', U, format=fmt)
def dc(fmt=None): return P('dc', 'DC In', 'in', 'power', U, format=fmt)
def eth(fmt=None): return P('eth', 'Ethernet', 'bidir', 'network', 'rj45', format=fmt)
C = 'community'

sheet('canon-xf605', 'camera', 'Canon', 'XF605', 'camera', R(('https://asia.canon/en/pro-imaging/xf605/main/product', 'Canon, page XF605'),
      ('https://www.lensrentals.com/product-assets/23270b5c-771c-4e83-8060-abd29aec7b88/XF605_Data_Sheet_081321_trim.pdf', 'Canon, fiche XF605 (via Lensrentals)')),
      [sdi('sdi', '12G-SDI Out', 'out'), P('hdmi', 'HDMI Out', 'out', 'video', 'hdmi'),
       P('in1', 'Audio In 1', 'in', 'audioAnalog', 'xlr3', level='mic', phantom='supplied'), P('in2', 'Audio In 2', 'in', 'audioAnalog', 'xlr3', level='mic', phantom='supplied'),
       P('tc', 'Timecode', 'bidir', 'sync', 'bnc'), P('gl', 'Genlock', 'in', 'sync', 'bnc'),
       P('remote', 'Remote B', 'bidir', 'control', U, format='8 points RS-422'), eth('1000BASE-T, SRT'),
       P('usb', 'USB-C', 'out', 'video', 'usb-c', format='Streaming UVC'), dc()], weightKg=2.01)

KV = 'Kiloview'
sheet('kiloview-e3', 'videoRouting', KV, 'E3', 'router', R(('https://www.kiloview.com/en/kiloview-e3', 'Kiloview, page E3'), ('https://www.kiloview.com/en/wp-content/uploads/2025/01/E3_Datesheet_En_LG.pdf', 'Kiloview, fiche E3')),
      [P('hdmiIn', 'HDMI In', 'in', 'video', 'hdmi', format='Jusqu\'à 4K30'), sdi('sdiIn', '3G-SDI In', 'in'),
       P('hdmiLoop', 'HDMI Loop', 'out', 'video', 'hdmi'), sdi('sdiLoop', '3G-SDI Loop', 'out'),
       P('lan', 'LAN', 'out', 'videoIp', 'rj45', format='NDI HX2 / HX3, SRT, RTMP'), dc()])
sheet('kiloview-n6', 'videoRouting', KV, 'N6', 'router', R(('https://videoguys.com/products/kiloview-n6-1080p60-hdmi-full-ndi-and-ndi-hx-encoder-decoder', 'Videoguys, fiche N6 (revendeur)')),
      [P('hdmiIn', 'HDMI In', 'in', 'video', 'hdmi', format='Jusqu\'à 1080p60'),
       P('hdmiOut', 'HDMI Out', 'out', 'video', 'hdmi', format='Recopie (codage) ou sortie décodée'),
       P('lan', 'LAN', 'bidir', 'videoIp', 'rj45', format='NDI Full / HX ; PoE'), dc()], status=C)

LU = 'Lumantek'
sheet('lumantek-ez-pro-vs10', 'videoSwitcher', LU, 'ez-Pro VS10', 'switcher', R(('https://www.markertek.com/Attachments/Manuals/Lumantek/vs10-manual.pdf', 'Lumantek, mode d\'emploi VS10 (via Markertek)')),
      [*many('sdiIn', 'SDI In', 8, 'in', 'bnc', '3G / HD / SD-SDI'), *many('hdmiIn', 'HDMI In', 2, 'in', 'hdmi'),
       P('outs', 'Sorties SDI / HDMI', 'out', 'video', U, format='Programme, clean, preview, AUX et multiview (nombre selon les sources)'),
       P('audioIn', 'Audio In', 'in', 'audioAnalog', 'xlr3', level='line+4', channels=2), P('audioOut', 'Audio Out', 'out', 'audioAnalog', 'xlr3', level='line+4', channels=2),
       P('ref', 'Reference In', 'in', 'sync', 'bnc'), P('rs', 'Remote', 'bidir', 'control', 'dsub9'), eth(), P('usb', 'USB', 'bidir', 'control', U),
       P('dc', 'DC 12 V', 'in', 'power', 'xlr4')], status=C)
sheet('lumantek-ez-pro-vs4', 'videoSwitcher', LU, 'ez-Pro VS4', 'switcher', R(('https://www.adorama.com/lumantek-ez-pro-vs4-4-channel-full-hd-seamless-switcher/p/lumezprovs4', 'Adorama, fiche ez-Pro VS4 (revendeur)')),
      [sdi('sdiIn1', 'SDI In 1', 'in'), P('hdmiIn2', 'HDMI In 2', 'in', 'video', 'hdmi'), P('hdmiIn3', 'HDMI In 3', 'in', 'video', 'hdmi'),
       P('in4', 'In 4 (SDI ou HDMI)', 'in', 'video', U), P('pgmHdmi', 'PGM HDMI', 'out', 'video', 'hdmi'), sdi('pgmSdi', 'PGM SDI', 'out'),
       P('mv', 'Multiview HDMI', 'out', 'video', 'hdmi'),
       P('audioIn', 'Audio In', 'in', 'audioAnalog', 'jack-trs', level='line+4', channels=2), P('audioOut', 'Audio Out', 'out', 'audioAnalog', 'minijack', channels=2),
       dc('7 à 14 V, 20 W')], status=C, powerW=20)

sheet('swit-flow500', 'wireless', 'SWIT', 'FLOW500 (TX / RX)', 'wireless', R(('https://www.bhphotovideo.com/c/product/1523147-REG/swit_flow500_500_hdmi_wireless_video.html', 'B&H, fiche FLOW500 (revendeur)')),
      [sdi('txSdi', 'TX SDI In', 'in', '3G / HD-SDI'), P('txHdmi', 'TX HDMI In', 'in', 'video', 'hdmi'), sdi('txLoop', 'TX SDI Loop', 'out'),
       sdi('rxSdi', 'RX SDI Out', 'out'), P('rxHdmi', 'RX HDMI Out', 'out', 'video', 'hdmi'),
       P('rf', 'Liaison HF', 'bidir', 'rf', 'rf', format='5,1 à 5,9 GHz, 150 m'), dc('8 W')], status=C, powerW=8)

for id, model, fmt in (('absen-pl3-9-pro-v2', 'Polaris PL3.9 Pro V2', 'Pas 3,9 mm, intérieur / extérieur'), ('absen-pl2-5', 'PL2.5', 'Pas 2,5 mm, intérieur')):
    sheet(id, 'display', 'Absen', model, 'display', R(('https://lang-iberia.com/product/absen-polaris-3-9pro-in-outdoor-led-cabinet/', 'Lang Iberia, fiche Polaris 3.9 Pro (loueur)')),
          [P('dataIn', 'Data In', 'in', 'network', U, format=f'Dalle LED {fmt} ; connecteur non précisé'), P('dataOut', 'Data Out', 'out', 'network', U),
           P('acIn', 'Power In', 'in', 'power', U), P('acOut', 'Power Out', 'out', 'power', U)], status=C)

RO = 'Ross Video'
sheet('ross-carbonite-black-solo', 'videoSwitcher', RO, 'Carbonite Black Solo', 'switcher',
      R(('https://rossvideo.com/live-production/production-switchers/carbonite-black-solo/specifications', 'Ross Video, caractéristiques Carbonite Black Solo')),
      [*many('sdiIn', 'SDI In', 6, 'in', 'bnc', '3G / HD-SDI'), *many('hdmiIn', 'HDMI In', 3, 'in', 'hdmi'),
       *many('sdiOut', 'SDI Out', 5, 'out', 'bnc', '3G / HD-SDI'), P('hdmiOut', 'HDMI Out', 'out', 'video', 'hdmi'),
       P('aes', 'AES Out', 'out', 'audioDigital', U), P('ref', 'Reference In', 'in', 'sync', 'bnc'), eth(), ac()], rackU=1)
sheet('ross-ultrix-fr2', 'videoRouting', RO, 'Ultrix FR2', 'router', R(('https://www.rossvideo.com/infrastructure/routing-systems/ultrix/specifications/', 'Ross Video, caractéristiques Ultrix')),
      [*many('in', 'SDI In', 16, 'in', 'bnc', 'HD-BNC, jusqu\'à 12G (licence Ultrispeed)'), *many('out', 'SDI Out', 16, 'out', 'bnc', 'HD-BNC'),
       P('aux1', 'AUX SFP 1', 'bidir', 'video', 'sfp', format='SDI ou MADI'), P('aux2', 'AUX SFP 2', 'bidir', 'video', 'sfp', format='SDI ou MADI'),
       P('slots', 'Emplacements cartes', 'bidir', 'video', U, format='3 emplacements E/S ou traitement'), eth(),
       P('dc1', 'Alimentation 1', 'in', 'power', U, format='Bloc externe'), P('dc2', 'Alimentation 2', 'in', 'power', U, format='Bloc externe redondant')],
      weightKg=5.44, rackU=2)

BA = 'Barco'
sheet('barco-e2', 'videoSwitcher', BA, 'E2 (Event Master)', 'switcher', R(('https://assets.barco.com/m/3b64ca7d2e0027e/original/E2-Gen-2-BTO-en-Spec-sheet.pdf', 'Barco, fiche E2 Gen 2')),
      [P('inputs', 'Entrées (cartes)', 'in', 'video', U, format='8 cartes : HDMI 2.0, DP 1.2, 12G-SDI (jusqu\'à 40 entrées)'),
       P('outputs', 'Sorties (cartes)', 'out', 'video', U, format='4 cartes : SDI, HDMI, DP (jusqu\'à 18 sorties), multiview'),
       P('gl', 'Genlock', 'in', 'sync', 'bnc', format='Avec recopie'), eth('Event Master Toolset'), ac()], status=C)
sheet('barco-ec-50', 'control', BA, 'EC-50', 'control', R(('https://www.barco.com/manuals/R5905948/xph06bofy7mh.html', 'Barco, manuel Event Master : connexion EC-50'), ('https://azur.novelty.fr/download/materiel_fiches_techniques/barco_ec50_ft-uk.pdf', 'Barco, fiche EC-50 (via Novelty)')),
      [P('usb', 'USB', 'bidir', 'control', 'usb-b', format='Vers ordinateur Event Master Toolset'),
       P('dvi', 'DVI In', 'in', 'video', 'dvi', format='Image de l\'écran tactile 15,6"'), ac('90-250 V')])

FO = 'Folsom (Barco)'
sheet('folsom-imagepro-hd', 'videoSwitcher', FO, 'ImagePRO-HD', 'switcher', R(('https://ret.de/media/uploads/2018/02/Barco-ImagePRO-HD-Datenblatt.pdf', 'Barco, fiche ImagePRO-HD')),
      [P('in1', 'Input 1', 'in', 'video', 'dvi', format='DVI-I (DVI ou analogique), recopie'), P('in2', 'Input 2', 'in', 'video', 'dsub15', format='HD-15, recopie'),
       P('in3', 'Input 3', 'in', 'video', 'bnc', format='5 BNC, recopie'), sdi('sdiIn', 'SDI In', 'in', 'SD / HD-SDI'),
       P('outVga', 'Out HD-15', 'out', 'video', 'dsub15', format='RVB ou composante'), P('outBnc', 'Out 5 BNC', 'out', 'video', 'bnc'),
       P('outComp', 'Out composite', 'out', 'video', 'bnc'), P('outYc', 'Out S-vidéo', 'out', 'video', U, format='Mini-DIN 4'),
       sdi('outSdi', 'SDI Out', 'out'), P('outDvi', 'DVI Out', 'out', 'video', 'dvi'), P('gl', 'Genlock', 'in', 'sync', 'bnc'), ac()])
sheet('folsom-imagepro-ii', 'videoSwitcher', FO, 'ImagePRO-II', 'switcher', R(('https://www.fullcompass.com/common/files/44510-ImagePROIISeriesDatasheet.pdf', 'Barco, fiche ImagePRO-II (via Full Compass)')),
      [P('analog', 'Analog In', 'in', 'video', U, format='Universelle, recopie'), P('dvi', 'DVI In', 'in', 'video', 'dvi', format='Dual link, HDCP, recopie'),
       P('hdmi', 'HDMI In', 'in', 'video', 'hdmi'), P('dp', 'DP In', 'in', 'video', 'displayport'), sdi('sdi', '3G-SDI In', 'in', 'Recopie'),
       P('out', 'Sorties', 'out', 'video', U, format='DVI, SDI, composite ; nombre selon carte de sortie'), P('gl', 'Genlock', 'in', 'sync', 'bnc', format='Avec recopie'), ac()], status=C)
sheet('folsom-matrixpro-8x8-hdsdi', 'videoRouting', FO, 'MatrixPRO 8x8 HD-SDI', 'router', R(('https://www.usedlighting.com/46753/barco-matrixpro-8x8-hd-sdi-router', 'UsedLighting, MatrixPRO 8x8 HD-SDI (occasion)')),
      [*many('in', 'SDI In', 8, 'in', 'bnc', 'HD / SD-SDI'), *many('out', 'SDI Out', 8, 'out', 'bnc', 'HD / SD-SDI'),
       P('rs232', 'RS-232', 'bidir', 'control', U), eth(), ac()], status=C, weightKg=7.7)

sheet('datapath-x4', 'videoRouting', 'Datapath', 'x4', 'router', R(('https://www.rentex.com/wp-content/uploads/2016/07/DataPath-X4-Datasheet.pdf', 'Datapath, fiche x4 (via Rentex)')),
      [P('in', 'DVI In', 'in', 'video', 'dvi', format='Single ou dual link (HDMI par adaptateur)'),
       *many('out', 'Out', 4, 'out', 'dvi', 'DVI single link ou RVB analogique'), ac()])
sheet('analog-way-nextage-16-4k', 'videoSwitcher', 'Analog Way', 'NeXtage 16 - 4K', 'switcher', R(('https://expandore.com/Analog-way/nextage-16-4k-switcher.htm', 'Expandore, fiche NeXtage 16 - 4K')),
      [*many('hdmi', 'HDMI In', 4, 'in', 'hdmi'), *many('dp', 'DP In', 2, 'in', 'displayport'), *many('dvi', 'DVI-I In', 6, 'in', 'dvi'),
       *many('sdi', 'SDI In', 8, 'in', 'bnc', '3G / HD / SD-SDI'), *many('ana', 'Analog In', 8, 'in', U, 'HD15 ou DVI-A'),
       *[p for o in (1, 2) for p in (sdi(f'o{o}sdi1', f'Out {o} SDI 1', 'out'), sdi(f'o{o}sdi2', f'Out {o} SDI 2', 'out'),
                                     P(f'o{o}dvi', f'Out {o} DVI-I', 'out', 'video', 'dvi'), P(f'o{o}hdmi', f'Out {o} DVI/HDMI 4K', 'out', 'video', 'hdmi'),
                                     P(f'o{o}ana', f'Out {o} Analog', 'out', 'video', U, format='HD15 et DVI-A'),
                                     P(f'o{o}sfp', f'Out {o} SFP', 'out', 'video', 'sfp', format='SDI optique'))],
       eth(), ac()], status=C)
sheet('newtek-3play-4800', 'recording', 'NewTek', '3Play 4800', 'recorder', R(('https://expandore.com/Newtek/3Play-4800.htm', 'Expandore, fiche 3Play 4800')),
      [*many('in', 'Video In', 8, 'in', 'bnc', 'HD / SD-SDI, composante ou composite'), *many('out', 'Playout', 2, 'out', 'bnc', 'SDI ou analogique'),
       P('hdmi', 'HDMI Out', 'out', 'video', 'hdmi'), sdi('aux', 'AUX Out', 'out'), P('cs', 'Pupitre', 'bidir', 'control', U), ac()], status=C, rackU=4)
sheet('teradek-bolt-500-xt', 'wireless', 'Teradek', 'Bolt 500 XT (TX / RX)', 'wireless', R(('https://www.adorama.com/tebolt500xtt.html', 'Adorama, fiche Bolt 500 XT (revendeur)')),
      [sdi('txSdi', 'TX SDI In', 'in', '3G-SDI'), P('txHdmi', 'TX HDMI In', 'in', 'video', 'hdmi'), sdi('txLoop', 'TX SDI Loop', 'out'),
       sdi('rxSdi', 'RX SDI Out', 'out'), P('rxHdmi', 'RX HDMI Out', 'out', 'video', 'hdmi'),
       P('rf', 'Liaison HF', 'bidir', 'rf', 'rf', format='150 m'), dc()], status=C)
sheet('teradek-beam', 'wireless', 'Teradek', 'Beam (TX / RX)', 'wireless', R(('https://www.markertek.com/Attachments/Specifications/TERADEK/10-0571-Specifications.pdf', 'Teradek, caractéristiques Beam (via Markertek)')),
      [sdi('txSdi', 'TX SDI In', 'in', '3G-SDI'), sdi('txLoop', 'TX SDI Loop', 'out'), sdi('rxSdi', 'RX SDI Out', 'out'),
       eth('LAN sans fil'), P('serial', 'Série', 'bidir', 'control', U), P('rf', 'Liaison HF', 'bidir', 'rf', 'rf'),
       dc('7 à 17 V, 12 W')], status=C, powerW=12)
