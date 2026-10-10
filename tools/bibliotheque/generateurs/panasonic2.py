# Panasonic (suite) : caméras AW-HE145 / AW-HE42 / AK-UC4000, CCU AK-UCU600, ROP AK-HRP1010, pupitre AW-RP150,
# vidéoprojecteurs PT-MZ20K / PT-MZ770 / PT-VW360, boîtier ET-YFB100G, carte TY-SB01QS, moniteur BT-LH80W.
from common import P, src, sheet
M = 'Panasonic'
U = 'unspecified'
PA = 'https://pro-av.panasonic.net/en/products/'
def R(*pairs): return [src(u, d) for u, d in pairs]
def sdi(id, name, d, fmt=None): return P(id, name, d, 'video', 'bnc', format=fmt)

sheet('panasonic-aw-he145', 'camera', M, 'AW-HE145', 'camera', R((PA + 'aw-he145/spec.html', 'Panasonic, AW-HE145 Specifications')),
      [P('hdmi', 'HDMI Out', 'out', 'video', 'hdmi', format='HDMI 2.0, 4:2:2 10 bits'), sdi('sdi', '3G-SDI Out', 'out', 'SMPTE 292M / 424M, niveau A ou B'),
       P('gl', 'G/L In', 'in', 'sync', 'bnc', format='Black burst ou tri-level'),
       P('lan', 'LAN', 'bidir', 'videoIp', 'rj45', format='100BASE-TX / 1000BASE-T ; contrôle IP, flux ; PoE++'),
       P('rs422', 'RS-422', 'in', 'control', 'rj45', format='CONTROL IN RS-422A'),
       P('mic', 'MIC/LINE In', 'in', 'audioAnalog', 'minijack', format='Mini-jack stéréo 3,5 ; flux IP uniquement'),
       P('dc', 'DC 12 V In', 'in', 'power', 'xlr4', format='12 V CC, 4,0 A (ou PoE++)')], weightKg=4.1)
sheet('panasonic-aw-he42', 'camera', M, 'AW-HE42', 'camera',
      R(('https://nationwidevideo.com/gear/panasonic-aw-he42-full-hd-professional-ptz-camera/', 'Nationwide Video, fiche AW-HE42 (revendeur)'),
        ('https://na.panasonic.com/us/news/panasonic-announces-pricingavailability-new-aw-he42-1080p-pantiltzoom-camera-advances', 'Panasonic, annonce AW-HE42')),
      [P('hdmi', 'HDMI Out', 'out', 'video', 'hdmi'), sdi('sdi', '3G-SDI Out', 'out'),
       P('gl', 'G/L In', 'in', 'sync', 'bnc', format='Black burst ou tri-level'),
       P('lan', 'LAN', 'bidir', 'videoIp', 'rj45', format='Contrôle IP et flux ; PoE+'), P('usb', 'USB', 'out', 'video', U, format='Sortie USB'),
       P('dc', 'DC 12 V In', 'in', 'power', 'xlr4', format='12 V CC')], status='community')
sheet('panasonic-ak-uc4000', 'camera', M, 'AK-UC4000', 'camera', R((PA + 'ak-uc4000/spec.html', 'Panasonic, AK-UC4000 Specifications')),
      [sdi('sdi1', 'HD-SDI 1', 'out', '3G / 1,5G-SDI'), sdi('sdi2', 'HD-SDI 2', 'out', '3G / 1,5G-SDI'),
       sdi('aux', 'AUX', 'bidir', 'HD trunk (1,5G-SDI) ou prompteur 2 (VBS)'),
       P('gl', 'G/L In / Prompter Out', 'bidir', 'sync', 'bnc', format='G/L en autonome, sortie prompteur avec CCU'),
       P('mic1', 'Mic 1', 'in', 'audioAnalog', 'xlr3', level='mic', phantom='supplied', format='Ligne / micro / +48 V'),
       P('mic2', 'Mic 2', 'in', 'audioAnalog', 'xlr3', level='mic', phantom='supplied', format='Ligne / micro / +48 V'),
       P('ic1', 'Intercom 1', 'bidir', 'intercom', 'xlr5'), P('ic2', 'Intercom 2', 'bidir', 'intercom', 'xlr5'),
       P('ear', 'Earphone', 'out', 'audioAnalog', 'minijack'),
       P('fiber', 'Fibre optique', 'bidir', 'video', 'smpte-fiber', format='Connecteur composite optique (Tajimi / LEMO) vers CCU AK-UCU600'),
       P('lens', 'Objectif', 'bidir', 'control', U, format='12 points'), P('remote', 'Remote', 'bidir', 'control', U, format='10 points (ROP)'),
       P('lan', 'LAN', 'bidir', 'network', 'rj45'), P('usb', 'USB 2.0', 'bidir', 'control', 'usb-a'),
       P('dc', 'DC In', 'in', 'power', 'xlr4', format='12 V (ou alimentation par la CCU)')], weightKg=4.5)
sheet('panasonic-ak-ucu600', 'camera', M, 'AK-UCU600', 'camera',
      R(('https://www.fullcompass.com/prod/649871-panasonic-ak-ucu600psj-camera-control-unit', 'Full Compass, fiche AK-UCU600PSJ (revendeur)')),
      [P('fiber', 'Fibre optique', 'bidir', 'video', 'smpte-fiber', format='Vers caméra, environ 2 000 m'),
       P('sdiOut', 'Sorties SDI', 'out', 'video', 'bnc', format='12G / 6G / 3G / HD-SDI (double système UHD 12G-SDI, quad link 3G)'),
       P('ret', 'Retours SDI', 'in', 'video', 'bnc', format='Retours HD / SD-SDI, prompteur'),
       P('hdTrunk', 'HD-TRUNK / TICO', 'bidir', 'video', 'bnc'), P('lanTrunk', 'LAN-TRUNK', 'bidir', 'network', 'rj45'),
       P('trunk', 'TRUNK', 'bidir', 'control', U), P('ac', 'Secteur', 'in', 'power', U)], status='community', rackU=2)
sheet('panasonic-ak-hrp1010', 'control', M, 'AK-HRP1010', 'control',
      R(('https://na.panasonic.com/audio-video-solutions/broadcast-cinema-pro-video/camera-controllers/ak-hrp1010-remote-operation-panel-14-rack', 'Panasonic, page AK-HRP1010')),
      [P('lan', 'LAN', 'bidir', 'network', 'rj45', format='Contrôle IP ; PoE 42-57 V'),
       P('ccu', 'CCU / Caméra', 'bidir', 'control', U, format='10 points mâle (alimentation par la CCU)'),
       P('preview', 'Preview', 'out', 'control', 'dsub9', format='9 points femelle')])
sheet('panasonic-aw-rp150', 'control', M, 'AW-RP150', 'control',
      R(('https://www.rentex.com/wp-content/uploads/2019/05/Panasonic-AW-RP150-Spec-Sheet-from-Rentex.pdf', 'Panasonic, fiche AW-RP150 (via Rentex)')),
      [*[P(f'rs422_{i}', f'RS-422 {i}', 'bidir', 'control', 'rj45', format='Caméra en série (protocole AW)') for i in range(1, 6)],
       P('lan', 'LAN', 'bidir', 'network', 'rj45', format='Jusqu\'à 200 caméras IP ; PoE+'),
       sdi('sdiIn', '3G-SDI In', 'in'), sdi('sdiThru', 'Active Thru Out', 'out', 'SMPTE 292'),
       P('gpio1', 'GPIO 1', 'bidir', 'control', U), P('gpio2', 'GPIO 2', 'bidir', 'control', U),
       P('dc', 'DC 12 V In', 'in', 'power', 'xlr4')], status='community')

PJ = 'display'
sheet('panasonic-pt-mz20k', PJ, M, 'PT-MZ20K', 'projector',
      R(('https://eu.connect.panasonic.com/sites/default/files/media/document/2022-07/pt-mz20kl_spec_en.pdf', 'Panasonic, spécifications PT-MZ20KL')),
      [P('hdmi1', 'HDMI 1', 'in', 'video', 'hdmi', format='HDCP 2.3, 4K/60p'), P('hdmi2', 'HDMI 2', 'in', 'video', 'hdmi', format='HDCP 2.3, 4K/60p, entrée de secours'),
       sdi('sdi', 'SDI In', 'in', '3G / HD-SDI'),
       P('dl', 'DIGITAL LINK', 'bidir', 'video', 'rj45', format='HDBaseT : vidéo, réseau, commande série'),
       P('ac', 'Secteur', 'in', 'power', U, format='100-240 V')], weightKg=22.3)
sheet('panasonic-pt-mz770', PJ, M, 'PT-MZ770', 'projector',
      R(('https://na.panasonic.com/us/pt-mz770u-3lcd-solid-shine-laser-projector', 'Panasonic, page PT-MZ770U (produit arrêté)')),
      [P('hdmi1', 'HDMI 1', 'in', 'video', 'hdmi', format='HDCP, Deep Color'), P('hdmi2', 'HDMI 2', 'in', 'video', 'hdmi', format='HDCP, Deep Color'),
       P('rgb1', 'RGB 1 In', 'in', 'video', 'bnc', format='5 BNC'), P('rgb2', 'RGB 2 In', 'in', 'video', 'dsub15'),
       P('video', 'Video In', 'in', 'video', 'rca'),
       P('dl', 'DIGITAL LINK / LAN', 'bidir', 'video', 'rj45', format='HDBaseT : vidéo, réseau, commande'),
       P('ac', 'Secteur', 'in', 'power', U)], weightKg=16.2)
sheet('panasonic-pt-vw360', PJ, M, 'PT-VW360', 'projector', R(('https://na.panasonic.com/ns/300841_PT_VW360_S_4P_ctlg_PC.pdf', 'Panasonic, catalogue PT-VW360')),
      [P('hdmi1', 'HDMI 1', 'in', 'video', 'hdmi'), P('hdmi2', 'HDMI 2', 'in', 'video', 'hdmi'),
       P('pc1', 'Computer 1 In', 'in', 'video', 'dsub15'), P('pc2', 'Computer 2 In', 'in', 'video', 'dsub15'),
       P('video', 'Video In', 'in', 'video', 'rca'), P('audio', 'Audio In', 'in', 'audioAnalog', U, level='line-10'),
       P('lan', 'LAN', 'bidir', 'network', 'rj45'), P('rs232', 'RS-232C', 'bidir', 'control', 'dsub9'), P('usb', 'USB', 'bidir', 'control', 'usb-a'),
       P('ac', 'Secteur', 'in', 'power', U)], weightKg=3.3)
sheet('panasonic-et-yfb100g', 'videoRouting', M, 'ET-YFB100G', 'router',
      R(('https://docs.connect.panasonic.com/prodisplays/products/et-yfb100g/', 'Panasonic, page ET-YFB100G Digital Interface Box')),
      [P('hdmi1', 'HDMI In 1', 'in', 'video', 'hdmi', format='HDCP, Deep Color'), P('hdmi2', 'HDMI In 2', 'in', 'video', 'hdmi', format='HDCP, Deep Color'),
       P('pc1', 'Computer 1 In', 'in', 'video', 'dsub15'), P('pc2', 'Computer 2 In / 1 Out', 'bidir', 'video', 'dsub15', format='Entrée ou recopie'),
       P('ypbpr', 'YPbPr In', 'in', 'video', U), P('video', 'Video In', 'in', 'video', 'rca'),
       P('dl', 'DIGITAL LINK Out', 'out', 'video', 'rj45', format='HDBaseT jusqu\'à 100 m : vidéo, audio, Ethernet, RS-232C'),
       P('audioOut', 'Audio Out', 'out', 'audioAnalog', U, level='line-10'), P('ac', 'Secteur', 'in', 'power', U)])
sheet('panasonic-ty-sb01qs', 'display', M, 'TY-SB01QS', 'display',
      R(('https://www.fullcompass.com/prod/625175-panasonic-ty-sb01qs-12g-sdi-sdm-terminal-board', 'Full Compass, fiche TY-SB01QS (revendeur)'),
        ('https://latam.connect.panasonic.com/pa/en/download-specifications/71', 'Panasonic, spécifications TY-SB01QS')),
      [sdi('sdi1', 'SDI 1 In', 'in', '12G / 3G-SDI'), sdi('sdi2', 'SDI 2 In', 'in', '3G-SDI (quad link)'),
       sdi('sdi3', 'SDI 3 In', 'in', '3G-SDI (quad link)'), sdi('sdi4', 'SDI 4 In', 'in', '3G-SDI (quad link)'),
       sdi('thru', 'Active Thru Out', 'out'), P('slot', 'Emplacement SDM', 'in', 'control', U, format='Carte pour écran Panasonic à slot Intel SDM')], weightKg=0.3)
sheet('panasonic-bt-lh80w', 'display', M, 'BT-LH80W', 'display',
      R(('https://www.novelty.fr/produits/video/ecran-lcd-et-led/moniteur-video/bt-lh80w/', 'Novelty, fiche BT-LH80W (loueur)'),
        ('https://www.adorama.com/us1526669.html', 'Adorama, fiche BT-LH80W (occasion)')),
      [sdi('sdi', 'SDI In', 'in', 'Avec carte optionnelle BT-YA80G'), P('video', 'Video In', 'in', 'video', 'bnc', format='Composite'),
       P('ypbpr', 'Y/Pb/Pr', 'in', 'video', 'bnc', format='3 BNC'), P('vf', 'VF', 'bidir', 'video', 'dsub15'),
       P('gpi', 'GPI', 'in', 'control', 'dsub9'), P('rs232', 'RS-232C', 'bidir', 'control', 'dsub9'),
       P('dc', 'DC 12 V', 'in', 'power', 'xlr4', format='11 à 17 V, 1,5 A')], status='community', weightKg=1.5)
