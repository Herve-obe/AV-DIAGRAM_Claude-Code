# Blackmagic Design (suite) : Video Assist 7" 12G HDR, URSA Broadcast G2, ATEM Television Studio Pro 4K / HD, ATEM Constellation 8K,
# Micro Converters BiDirectional 3G et SDI to HDMI 12G, Smart Videohub CleanSwitch 12x12, Videohub 40x40 12G, Web Presenter (HD), UltraScope.
from common import P, src, sheet
M = 'Blackmagic Design'
U = 'unspecified'
def S(fam, code, name): return [src(f'https://www.blackmagicdesign.com/products/{fam}/techspecs/{code}', f'Blackmagic Design, fiche technique {name} ({code})')]
def R(*pairs): return [src(u, d) for u, d in pairs]
def sdi(id, name, d, fmt='SDI (BNC)'): return P(id, name, d, 'video', 'bnc', format=fmt)
def eth(fmt='Ethernet 1 Gb/s'): return P('eth', 'Ethernet', 'bidir', 'network', 'rj45', format=fmt)

sheet('blackmagic-video-assist-7-12g-hdr', 'display', M, 'Video Assist 7" 12G HDR', 'display', S('blackmagicvideoassist', 'W-VASS-04', 'Video Assist 7" 12G HDR'),
      [sdi('sdiIn', 'SDI In', 'in', '12G-SDI'), sdi('sdiOut', 'SDI Out', 'out', '12G-SDI'),
       P('hdmiIn', 'HDMI In', 'in', 'video', 'hdmi', format='HDMI 2.0a'), P('hdmiOut', 'HDMI Out', 'out', 'video', 'hdmi', format='HDMI 2.0a'),
       P('mic1', 'Audio In 1', 'in', 'audioAnalog', 'ta3', level='mic', phantom='supplied', format='Mini XLR symétrique, fantôme'),
       P('mic2', 'Audio In 2', 'in', 'audioAnalog', 'ta3', level='mic', phantom='supplied', format='Mini XLR symétrique, fantôme'),
       P('phones', 'Casque', 'out', 'audioAnalog', 'minijack', channels=2),
       P('lanc', 'LANC', 'in', 'control', U, format='Mini-jack 2,5 mm'),
       P('usb', 'USB-C', 'bidir', 'control', 'usb-c', format='Enregistrement sur disque, webcam, mise à jour'),
       P('dc', 'Alimentation 12 V', 'in', 'power', 'dc-barrel', format='Bloc externe 12 V')])

sheet('blackmagic-ursa-broadcast-g2', 'camera', M, 'URSA Broadcast G2', 'camera', S('blackmagicursabroadcast', 'W-URSA-38', 'URSA Broadcast G2'),
      [sdi('sdiIn', 'SDI In', 'in', '12G-SDI (retour programme)'), sdi('sdiOut', 'SDI Out', 'out', '12G-SDI'), sdi('sdiMon', 'SDI Monitor Out', 'out', '12G-SDI'),
       P('audio1', 'Audio In 1', 'in', 'audioAnalog', 'xlr3', level='mic', phantom='supplied', format='Micro, ligne ou AES ; fantôme'),
       P('audio2', 'Audio In 2', 'in', 'audioAnalog', 'xlr3', level='mic', phantom='supplied', format='Micro, ligne ou AES ; fantôme'),
       P('phones', 'Casque', 'out', 'audioAnalog', 'minijack', channels=2, format='Mini-jack 3,5, micro-casque pour ordres'),
       P('ref', 'Reference In', 'in', 'sync', 'bnc', format='Tri-level, black burst ou timecode'),
       P('lens', 'Objectif', 'bidir', 'control', U, format='Hirose 12 points broadcast'),
       P('lanc', 'LANC', 'in', 'control', U, format='Mini-jack 2,5 mm'),
       P('usb1', 'USB-C 1', 'bidir', 'control', 'usb-c', format='Enregistrement sur disque, Zoom / Focus Demand'), P('usb2', 'USB-C 2', 'bidir', 'control', 'usb-c', format='Mise à jour'),
       P('dcOut', '12 V Out', 'out', 'power', 'xlr4', format='XLR 4 points 12 V'),
       P('dc', 'Alimentation', 'in', 'power', 'xlr4', format='12 V DC 100 W ; batterie V-mount ou Gold mount')])

sheet('blackmagic-atem-television-studio-pro-4k', 'videoSwitcher', M, 'ATEM Television Studio Pro 4K', 'switcher',
      R(('https://www.leni.fr/wp-content/uploads/2022/09/peripherique-video-ATEM-TV-PRO-4K.pdf', 'Blackmagic Design, caractéristiques ATEM TV Studio Pro 4K (via Leni)')),
      [*[sdi(f'in{i}', f'SDI In {i}', 'in', '12G-SDI, resynchro et convertisseur de format') for i in range(1, 9)],
       sdi('pgm', 'SDI Program Out', 'out', '12G-SDI'), sdi('aux', 'SDI Aux Out', 'out', '12G-SDI'),
       sdi('mv', 'SDI Multiview', 'out'), P('mvHdmi', 'HDMI Multiview', 'out', 'video', 'hdmi'),
       P('xlr1', 'Audio In 1', 'in', 'audioAnalog', 'xlr3', level='line+4'), P('xlr2', 'Audio In 2', 'in', 'audioAnalog', 'xlr3', level='line+4'),
       P('tb', 'Talkback', 'bidir', 'intercom', U, format='Micro-casque type aviation'),
       P('ref', 'Reference In', 'in', 'sync', 'bnc'), eth(), P('usb', 'USB', 'bidir', 'control', U, format='Configuration'),
       P('ac', 'Secteur', 'in', 'power', U)], status='community')
sheet('blackmagic-atem-television-studio-hd', 'videoSwitcher', M, 'ATEM Television Studio HD', 'switcher',
      R(('https://www.fullcompass.com/common/files/37402-ATEMTelevisionStudioHDTechnicalSpecifications.pdf', 'Blackmagic Design, caractéristiques ATEM Television Studio HD (via Full Compass)')),
      [*[sdi(f'sdiIn{i}', f'SDI In {i}', 'in', 'SD / HD-SDI, resynchro') for i in range(1, 5)],
       *[P(f'hdmiIn{i}', f'HDMI In {i}', 'in', 'video', 'hdmi', format='SD / HD') for i in range(5, 9)],
       sdi('pgm', 'SDI Program Out', 'out', 'SD / HD-SDI (plusieurs sorties)'), sdi('aux', 'SDI Aux Out', 'out'),
       sdi('mv', 'SDI Multiview', 'out'), P('mvHdmi', 'HDMI Multiview', 'out', 'video', 'hdmi'),
       P('xlr1', 'Audio In 1', 'in', 'audioAnalog', 'xlr3', level='line+4'), P('xlr2', 'Audio In 2', 'in', 'audioAnalog', 'xlr3', level='line+4'),
       P('tb', 'Talkback', 'bidir', 'intercom', U, format='Micro-casque type aviation'),
       P('ref', 'Reference In', 'in', 'sync', 'bnc', format='Tri-level ou black burst'), eth(), P('usb', 'USB', 'bidir', 'control', U, format='Configuration'),
       P('ac', 'Secteur', 'in', 'power', U)])
sheet('blackmagic-atem-constellation-8k', 'videoSwitcher', M, 'ATEM Constellation 8K', 'switcher', S('atemconstellation8k', 'W-APS-12', 'ATEM Constellation 8K'),
      [*[sdi(f'in{i}', f'SDI In {i}', 'in', '12G-SDI ; resynchro et convertisseur de format') for i in range(1, 41)],
       *[sdi(f'out{i}', f'SDI Out {i}', 'out', '12G-SDI ; programme, preview ou auxiliaire') for i in range(1, 25)],
       *[sdi(f'mv{i}', f'SDI Multiview {i}', 'out') for i in range(1, 5)],
       P('audioIn', 'Audio In', 'in', 'audioAnalog', 'jack-trs', level='line+4', channels=2, format='2 jacks 6,35 symétriques'),
       P('audioOut', 'Audio Out', 'out', 'audioAnalog', 'jack-trs', level='line+4', channels=2, format='2 jacks 6,35 symétriques'),
       P('madiIn', 'MADI In', 'in', 'audioDigital', 'bnc', channels=64), P('madiOut1', 'MADI Out 1', 'out', 'audioDigital', 'bnc', channels=64),
       P('madiOut2', 'MADI Out 2', 'out', 'audioDigital', 'bnc', channels=64),
       P('tb', 'Talkback', 'bidir', 'intercom', 'xlr5', format='XLR 5 points'), P('tbRj', 'Talkback RJ45', 'bidir', 'intercom', 'rj45', format='Systèmes d\'ordres tiers'),
       P('ref', 'Reference In', 'in', 'sync', 'bnc', format='Tri-level ou black burst'),
       P('remote', 'Remote', 'bidir', 'control', 'rj12', format='RS-422'), eth('Ethernet 1 Gb/s, panneau de commande'),
       P('usb', 'USB 2.0', 'bidir', 'control', 'usb-a'), P('ac1', 'Secteur 1', 'in', 'power', 'iec-c13', format='100-240 V'),
       P('ac2', 'Secteur 2', 'in', 'power', 'iec-c13', format='Alimentation redondante')], powerW=300)

sheet('blackmagic-micro-converter-bidirectional-3g', 'videoRouting', M, 'Micro Converter BiDirectional SDI/HDMI 3G', 'router',
      S('microconverters', 'W-CONU-09', 'Micro Converter BiDirectional SDI/HDMI 3G'),
      [sdi('sdiIn', 'SDI In', 'in', 'SD / HD / 3G-SDI'), sdi('sdiOut', 'SDI Out', 'out', 'Depuis l\'entrée HDMI'),
       P('hdmiIn', 'HDMI In', 'in', 'video', 'hdmi'), P('hdmiOut', 'HDMI Out', 'out', 'video', 'hdmi', format='Depuis l\'entrée SDI'),
       P('usb', 'USB-C', 'in', 'power', 'usb-c', format='Alimentation et configuration ; 2,5 W')], powerW=2.5)
sheet('blackmagic-micro-converter-sdi-to-hdmi-12g', 'videoRouting', M, 'Micro Converter SDI to HDMI 12G', 'router',
      S('microconverters', 'W-CONU-18', 'Micro Converter SDI to HDMI 12G'),
      [sdi('sdiIn', 'SDI In', 'in', 'Jusqu\'à 12G-SDI'), sdi('sdiLoop', 'SDI Loop Out', 'out', 'Recopie'),
       P('hdmiOut', 'HDMI Out', 'out', 'video', 'hdmi', format='HDMI 2.0, LUT 3D'),
       P('usb', 'USB-C', 'in', 'power', 'usb-c', format='Alimentation et configuration ; 4 W max')], powerW=4)

sheet('blackmagic-smart-videohub-cleanswitch-12x12', 'videoRouting', M, 'Smart Videohub CleanSwitch 12x12', 'router',
      S('blackmagicvideohub', 'W-VHS-05', 'Smart Videohub CleanSwitch 12x12'),
      [*[sdi(f'in{i}', f'SDI In {i}', 'in', 'SD / HD / 6G-SDI, resynchro (commutation propre)') for i in range(1, 13)],
       *[sdi(f'out{i}', f'SDI Out {i}', 'out', 'SD / HD / 6G-SDI') for i in range(1, 13)],
       P('ref', 'Reference In', 'in', 'sync', 'bnc', format='Tri-level ou black burst'), eth('Panneaux de commande'),
       P('usb', 'USB', 'bidir', 'control', U), P('ac', 'Secteur', 'in', 'power', U)], rackU=1)
sheet('blackmagic-videohub-40x40-12g', 'videoRouting', M, 'Videohub 40x40 12G', 'router', S('blackmagicvideohub', 'W-VHS-08', 'Videohub 40x40 12G'),
      [*[sdi(f'in{i}', f'SDI In {i}', 'in', 'Jusqu\'à 12G-SDI, DVB-ASI') for i in range(1, 41)],
       *[sdi(f'out{i}', f'SDI Out {i}', 'out', 'Jusqu\'à 12G-SDI, reclocking') for i in range(1, 41)],
       P('refIn', 'Reference In', 'in', 'sync', 'bnc', format='Tri-level ou black burst'), P('refOut', 'Reference Loop', 'out', 'sync', 'bnc'),
       eth('Ethernet 1 Gb/s'), P('usb', 'USB-C', 'bidir', 'control', 'usb-c'),
       P('ac1', 'Secteur 1', 'in', 'power', 'iec-c13', format='100-240 V'), P('ac2', 'Secteur 2', 'in', 'power', 'iec-c13', format='Alimentation redondante')],
      powerW=46.5, rackU=2)

sheet('blackmagic-web-presenter-hd', 'videoSwitcher', M, 'Web Presenter HD', 'switcher',
      R(('https://www.soundseasy.com.au/products/blackmagic-web-presenter-hd', 'Sounds Easy, fiche Web Presenter HD (revendeur)'), ('https://shop.pssl.com/products/blackmagic-blackmagic-web-presenter-hd', 'PSSL, fiche Web Presenter HD (revendeur)')),
      [sdi('sdiIn', 'SDI In', 'in', '12G-SDI, audio intégré'), sdi('sdiLoop', 'SDI Loop Out', 'out'), sdi('sdiMon', 'SDI Monitor Out', 'out'),
       P('hdmiMon', 'HDMI Monitor Out', 'out', 'video', 'hdmi'), P('usb', 'USB-C (webcam)', 'out', 'video', 'usb-c', format='Webcam jusqu\'à 1080p60'),
       eth('Streaming RTMP / SRT, contrôle'), P('ac', 'Secteur', 'in', 'power', U)], status='community')
sheet('blackmagic-web-presenter', 'videoSwitcher', M, 'Web Presenter', 'switcher',
      R(('https://globalproductions.ee/toode/blackmagic-web-presenter/', 'Global Productions, fiche Web Presenter (loueur)')),
      [sdi('sdiIn', 'SDI In', 'in'), P('hdmiIn', 'HDMI In', 'in', 'video', 'hdmi'),
       P('xlr', 'Audio In', 'in', 'audioAnalog', 'xlr3', level='mic', format='Micro / ligne'),
       P('rca', 'Audio In L/R', 'in', 'audioAnalog', 'rca', level='line-10', channels=2),
       P('usb', 'USB (webcam)', 'out', 'video', U, format='Sortie webcam 720p'), P('ac', 'Alimentation', 'in', 'power', U)], status='community')
sheet('blackmagic-ultrascope', 'display', M, 'UltraScope', 'display',
      R(('https://expandore.com/blackmagic/UltraScope.htm', 'Expandore, fiche UltraScope'), ('https://www.adorama.com/bmus.html', 'Adorama, fiche UltraScope (revendeur)')),
      [sdi('sdiIn', 'SDI In', 'in', 'SD / HD / 3G-SDI'), sdi('sdiLoop', 'SDI Loop Out', 'out'),
       P('optIn', 'Optical In', 'in', 'video', 'lc', format='SDI optique LC'), P('optOut', 'Optical Out', 'out', 'video', 'lc', format='SDI optique LC'),
       P('pcie', 'PCI Express', 'bidir', 'control', U, format='Carte PCIe pour ordinateur Windows')], status='community')
