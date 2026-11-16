# Lumière et réseau (fin des catalogues). Fiches constructeur quand elles existent ; sinon fiches minimales (community)
# d'après la désignation du catalogue, connecteurs non précisés.
from common import P, src, sheet, fixture
U = 'unspecified'
def R(*pairs): return [src(u, d) for u, d in pairs]
CAT = [src(document='Catalogues Novelty / Audio Pro 2025 (docs/inventaire), désignation et description')]
C = 'community'
def mini(id, mfr, model, fmt, dmx=True, family='luminaire', pic='light', extra=()):
    ports = [P('dmxIn', 'DMX In', 'in', 'dmx', U), P('dmxOut', 'DMX Thru', 'out', 'dmx', U)] if dmx else []
    sheet(id, family, mfr, model, pic, CAT, ports + [P('acIn', 'Secteur', 'in', 'power', U, format=fmt), *extra], status=C)
def conv(id, mfr, model, fmt, srcs=None, **kw):
    sheet(id, 'luminaire', mfr, model, 'light', srcs or CAT, [P('acIn', 'Alimentation', 'in', 'power', U, format=fmt)], status=C if not srcs else kw.pop('status', C), **kw)
def dmxbox(id, mfr, model, srcs, ports, status=C, **kw): sheet(id, 'dmxDistribution', mfr, model, 'control', srcs, ports, status=status, **kw)

# ETC
S4 = R(('https://www.panavision.com/lighting/lighting-products/heads/product-detail/ia4iqau-575-750w-source-4-ellipsoidal-spotlight', 'Panavision, fiche Source 4 575/750 W (loueur)'))
conv('etc-source-4', 'ETC', 'Source Four (optique fixe)', 'Halogène HPL 575 / 750 W, sur gradateur ; fiche selon version', S4, weightKg=6.3)
conv('etc-source-4-zoom', 'ETC', 'Source Four Zoom 15-30°', 'Halogène HPL 575 W, sur gradateur')
conv('etc-source-4-parnel', 'ETC', 'Source Four PARNel', 'Halogène HPL 575 W, sur gradateur')
conv('etc-source-4-par', 'ETC', 'Source Four PAR', 'Halogène HPL 575 W, sur gradateur')
LUSTR = R(('https://www.panavision.com/lighting/lighting-products/heads/product-detail/halheau-source-four-series-2-lustr', 'Panavision, fiche Source Four Series 2 Lustr (loueur)'),
          ('https://www.bhphotovideo.com/c/product/1054545-REG/etc_7461a1051_source_four_led_series.html', 'B&H, fiche Source Four LED Series 2 (revendeur)'))
fixture('etc-source-four-led-lustr2', 'ETC', 'Source Four LED Series 2 Lustr', LUSTR, dmx='xlr5', power='powercon', power_thru=True, status=C, weightKg=6.5)
mini('etc-source-four-led-lustr-plus', 'ETC', 'Source Four LED Lustr+', 'Découpe LED 170 W')
mini('etc-source-four-led-zoom', 'ETC', 'Source Four LED Zoom', 'Découpe LED 170 W, zoom 15-30°')

# OXO
dmxbox('oxo-solano2', 'OXO', 'Solano 2', R(('https://azur.novelty-group.com/download/materiel_fiches_techniques/oxo_solano2_ft2.pdf', 'OXO, fiche Solano 2 (via Novelty)')),
       [P('dmxIn', 'DMX In', 'in', 'dmx', U), P('dmxOut', 'DMX Out', 'out', 'dmx', U, format='Restitution de séquences enregistrées'),
        P('smpte', 'SMPTE', 'in', 'sync', U), P('contacts', 'Contacts', 'in', 'control', U), P('ac', 'Secteur', 'in', 'power', U)], rackU=1)
dmxbox('oxo-bbox6', 'OXO', 'BBox6', CAT, [P('dmxIn', 'DMX In', 'in', 'dmx', U), *[P(f'out{i}', f'DMX Out {i}', 'out', 'dmx', U, format='Isolée, RDM') for i in range(1, 7)], P('ac', 'Secteur', 'in', 'power', U)])
dmxbox('oxo-tw512', 'OXO', 'TW512', CAT, [P('dmx', 'DMX', 'bidir', 'dmx', U), P('wifi', 'Wi-Fi', 'bidir', 'rf', 'rf', format='DMX Wi-Fi (ColorBatt)'), P('dc', 'Alimentation', 'in', 'power', U)])
mini('oxo-uv-beam', 'OXO', 'UV Beam', 'LED UV 90 W, IP65')
mini('oxo-pixyline', 'OXO', 'Pixyline 150', 'Barre LED 14 × 10 W RGBW, IP65')
mini('oxo-sunflood-500', 'OXO', 'Sunflood 500', '24 × 20 W LED blanc 6 000 K')
mini('oxo-funstrip', 'OXO', 'Funstrip', '10 dichroïques 75 W, 240 V')
dmxbox('oxo-simoun2', 'OXO', 'Simoun 2', CAT, [P('dmxIn', 'DMX In', 'in', 'dmx', U), P('dmxOut', 'DMX Thru', 'out', 'dmx', U),
       P('acIn', 'Arrivée', 'in', 'power', U, format='PC16A'), P('acOut', 'Départs gradués', 'out', 'power', U, format='PC16A')])

# MA Lighting
MA = 'MA Lighting'
sheet('ma-onpc-command-wing', 'lightingControl', MA, 'grandMA2 onPC command wing', 'control',
      R(('https://help.malighting.com/grandMA2/en/help/grandma2_quick_manual_onpc_solutions/key_grandma2_wing_technical_data.html', 'MA Lighting, caractéristiques onPC command wing')),
      [P('dmxOut1', 'DMX Out 1', 'out', 'dmx', 'xlr5'), P('dmxOut2', 'DMX Out 2', 'out', 'dmx', 'xlr5'), P('dmxIn', 'DMX In', 'in', 'dmx', 'xlr5'),
       P('midiIn', 'MIDI In', 'in', 'control', 'din5'), P('midiOut', 'MIDI Out', 'out', 'control', 'din5'), P('ltc', 'LTC In', 'in', 'sync', 'xlr3'),
       P('usb', 'USB', 'bidir', 'control', 'usb-b', format='Vers ordinateur onPC'), P('remote', 'DC Remote', 'in', 'control', U),
       P('ac', 'Secteur', 'in', 'power', 'iec-c13')])
for id, model in (('ma-grandma3-pu-m', 'grandMA3 processing unit M'), ('ma-grandma3-pu-xl', 'grandMA3 processing unit XL')):
    sheet(id, 'lightingControl', MA, model, 'control', R(('https://help.malighting.com/grandMA3/2.3/HTML/key_pu_technical_data.html', 'MA Lighting, caractéristiques processing units')),
          [*[P(f'dmx{i}', f'DMX Out {i}', 'out', 'dmx', 'xlr5') for i in range(1, 9)],
           P('eth1', 'Ethernet 1', 'bidir', 'network', 'ethercon'), P('eth2', 'Ethernet 2', 'bidir', 'network', 'ethercon'),
           P('usb', 'USB', 'bidir', 'control', 'usb-a', format='3 ports USB 2.0'), P('ac', 'Secteur', 'in', 'power', 'powercon-true1', format='100-240 V, 200 VA')],
          weightKg=5, rackU=2)
sheet('ma-vpu-basic-mk2', 'videoSwitcher', MA, 'VPU basic MK2', 'switcher', R(('https://www.novelty.fr/produits/video/gestion-d-images/regie-complete/vpu-basic-mk2/', 'Novelty, fiche VPU basic MK2 (loueur)')),
      [P('dvi1', 'DVI Out 1', 'out', 'video', 'dvi'), P('dvi2', 'DVI Out 2', 'out', 'video', 'dvi'), P('vga', 'VGA Out', 'out', 'video', 'vga'),
       P('eth', 'Réseau MA', 'bidir', 'network', U), P('ac', 'Secteur', 'in', 'power', U, format='300 W')], status=C, weightKg=15)
sheet('ma-lightcommander-ii-12-24', 'lightingControl', MA, 'Lightcommander II 12/24', 'control', CAT,
      [P('dmx', 'DMX Out', 'out', 'dmx', U), P('ac', 'Alimentation', 'in', 'power', U)], status=C)

# DeSisti, Portman, Scenilux, Mole, ADB, DTS, ARRI (traditionnels)
for id, model, fmt in (('desisti-magis-500', 'Magis 500 W', '500 W / 230 V, 3 200 K'), ('desisti-leonardo-1kw', 'Leonardo 1 kW', '1 000 W / 230 V, 3 200 K'),
                       ('desisti-leonardo-2kw', 'Leonardo 2 kW', '2 000 W / 230 V, 3 200 K'), ('desisti-leonardo-5kw', 'Leonardo 5 kW', '5 000 W / 230 V, 3 200 K')):
    conv(id, 'DeSisti', model, fmt)
mini('desisti-piccoletto-led', 'DeSisti', 'Piccoletto LED', 'Fresnel LED 30 W 4 000 K')
for id, model, fmt in (('portman-s-tribe', 'S-Tribe', 'Projecteur décoratif'), ('portman-p3-pix-3l', 'P3 Pix 3L', '3 × 230 W'),
                       ('portman-p2-hexaline', 'P2 Hexaline', '6 × 250 W'), ('portman-p1-retro', 'P1 Retro', '7 × 230 W')):
    mini(id, 'Portman', model, fmt)
for w in (250, 500, 1000):
    conv(f'scenilux-bt{w}', 'Scenilux', f'BT{w}', f'{w} W / 230 V, transformateur intégré')
conv('mole-richardson-expoled', 'Mole-Richardson', 'ExpoLED', 'LED 50 W / 230 V')
conv('mole-richardson-vm70', 'Mole-Richardson', 'VM70', 'Mini-découpe dichroïque 70 W')
conv('mole-richardson-mickey', 'Mole-Richardson', 'Mickey', 'Dichroïque 50 W')
conv('adb-acp1001', 'ADB', 'ACP1001', 'Cycliode asymétrique 1 000-1 250 W')
sheet('adb-mikado', 'lightingControl', 'ADB', 'Mikado', 'control', CAT, [P('dmx', 'DMX Out', 'out', 'dmx', U), P('ac', 'Alimentation', 'in', 'power', U)], status=C)
conv('dts-fl2600', 'DTS', 'FL2600', '4 × PAR36 650 W = 2 600 W / 230 V')
conv('dts-molefay', 'DTS', 'Molefay', '8 × PAR36 650 W = 5 200 W / 230 V')
conv('arri-studio-t12', 'ARRI', 'Studio T12', 'Fresnel tungstène 12 kW ; sorties de câble nues, gradateur externe',
     R(('https://www.visuals.co.uk/l0.82120.b.html', 'Visuals, fiche Studio T12 (revendeur)')))
for kw in (4000, 2500):
    sheet(f'arri-compact-se{kw}', 'luminaire', 'ARRI', f'Compact SE{kw}', 'light',
          R(('https://www.abelcine.com/buy/lighting/power-accessories/arri-2500-4000w-120-240v-electronic-ballast-alf-and-dmx', 'AbelCine, ballast électronique 2 500 / 4 000 W DMX (revendeur)')),
          [P('dmx', 'DMX (ballast)', 'in', 'dmx', U), P('head', 'Câble projecteur', 'out', 'power', U, format='Vers tête HMI'),
           P('ac', 'Secteur (ballast)', 'in', 'power', U, format=f'HMI {kw} W, ballast électronique')], status=C)

# SGM, Robe, Elation
fixture('sgm-p-3-vision', 'SGM', 'P-3 Vision', R(('https://www.livedesignonline.com/news/sgm-light-introduces-p-3-visionr-cutting-edge-hybrid-solution-lighting-and-video-design', 'Live Design, annonce P-3 Vision')),
        dmx='xlr5', power='unspecified', power_fmt='100-277 V, 360 W', status=C, weightKg=8.3)
mini('sgm-i-2-wash', 'SGM', 'i-2 Wash', '69 LED RGBW, IP65')
fixture('sgm-q-7', 'SGM', 'Q-7', R(('https://sgmlight.com/products/q·7', 'SGM, page Q-7')), dmx='xlr5', dmx_fmt='Neutrik HD IP65 sur queue de câble', power='unspecified', power_fmt='Câble 0,5 m extrémités nues', weightKg=8.1)
mini('sgm-q-8', 'SGM', 'Q-8', 'Flood / strobe 1 812 LED RGBW, IP65')
sheet('robe-robospot-basestation', 'lightingControl', 'Robe', 'RoboSpot BaseStation', 'control', R(('https://www.robe.cz/res/downloads/user_manuals/User_manual_RoboSpot.pdf', 'Robe, mode d\'emploi RoboSpot')),
      [P('dmxIn', 'DMX In', 'in', 'dmx', 'xlr5', format='XLR 3 et 5 points'), P('dmxOut', 'DMX Out', 'out', 'dmx', 'xlr5', format='XLR 3 et 5 points'),
       P('eth', 'Ethernet', 'bidir', 'network', 'rj45'), P('cam', 'Camera In', 'in', 'videoIp', 'rj45', format='Caméra du projecteur'),
       P('hdmi', 'HDMI Out', 'out', 'video', 'hdmi'), P('usb', 'USB', 'bidir', 'control', 'usb-a'), P('ac', 'Secteur', 'in', 'power', 'powercon-true1')])
dmxbox('robe-rdm-communicator', 'Robe', 'RDM Communicator', R(('https://robe.cz/rdm-communicator', 'Robe, page RDM Communicator')),
       [P('dmx', 'DMX / RDM', 'bidir', 'dmx', 'xlr5', format='XLR 3 et 5 points'), P('dc', 'Charge', 'in', 'power', U, format='Batterie')], status='verified', weightKg=0.4)
conv('robe-picklepatt', 'Robe', 'PicklePATT', 'Tungstène 575 W, 120 / 240 V', R(('https://www.robe.cz/api/robe/pdfs/en/product/685', 'Robe, fiche PicklePATT')), status='verified')
fixture('elation-artiste-picasso', 'Elation', 'Artiste Picasso', R(('https://fullcompass.com/prod/564065-elation-artiste-picasso-fc-620w-led-cmy-moving-head-fixture-with-zoom-framing-shutters-case', 'Full Compass, fiche Artiste Picasso (revendeur)')),
        dmx='xlr5', power='powercon-true1', ethernet='ethercon', status=C, weightKg=38.1)
mini('elation-dtw-blinder-350-ip', 'Elation', 'DTW Blinder 350 IP', 'Blinder LED IP65, 1 800-3 200 K')
mini('elation-dtw-blinder-700-ip', 'Elation', 'DTW Blinder 700 IP', 'Blinder LED IP65, 4 × 175 W COB')
fixture('elation-kl-fresnel-6-cw', 'Elation', 'KL Fresnel 6 CW', R(('https://goknight.com/content/documentation/KL Fresnel 6 CW Spec Sheet.pdf', 'Elation, fiche KL Fresnel 6 CW (via Goknight)')),
        dmx='xlr3+5', power='unspecified', power_fmt='Câble verrouillable IP65 entrée / recopie', power_thru=True, weightKg=8.4)

# W-DMX, MDG, Clay Paky, Ayrton, GLP, Cameo, Prolights, Innled
WS = 'Wireless Solution'
def wdmx(id, model, srcs, ports, status=C): dmxbox(id, WS, model, srcs, ports, status=status)
wdmx('wireless-solution-blackbox-f-1-g4', 'BlackBox F-1 G4', CAT, [P('dmx', 'DMX', 'bidir', 'dmx', U), P('rf', 'W-DMX', 'bidir', 'rf', 'rf'), P('ac', 'Secteur', 'in', 'power', U)])
wdmx('wireless-solution-blackbox-f-2-g5', 'BlackBox F-2 G5', R(('https://www.procom-me.com/wp-content/uploads/2018/12/BLACKBOX-F-2-G5.pdf', 'Wireless Solution, fiche BlackBox G5 (via Procom)')),
     [P('dmx1', 'DMX 1', 'bidir', 'dmx', 'xlr5'), P('dmx2', 'DMX 2', 'bidir', 'dmx', 'xlr5'), P('eth', 'Ethernet', 'bidir', 'network', 'ethercon'),
      P('rf', 'W-DMX', 'bidir', 'rf', 'rf'), P('ac', 'Secteur', 'in', 'power', 'powercon', format='90-250 V ; 12 V Phoenix en secours')])
wdmx('wireless-solution-blackbox-f-1-g6', 'BlackBox F-1 G6', R(('https://lumenradio.com/support-materials/blackbox-g6-datasheet/', 'LumenRadio, fiche BlackBox G6')),
     [P('dmx', 'DMX', 'bidir', 'dmx', 'xlr5', format='XLR 3 et 5 points'), P('rf', 'W-DMX', 'bidir', 'rf', 'rf'),
      P('ac', 'Secteur', 'in', 'power', 'powercon-true1', format='88-264 V ; entrée 12 V de secours')], status='verified')
wdmx('wireless-solution-microbox-f-1-g5', 'MicroBox F-1 G5', CAT, [P('dmx', 'DMX', 'bidir', 'dmx', U), P('rf', 'W-DMX', 'bidir', 'rf', 'rf'), P('dc', 'Batterie', 'in', 'power', U)])
for id, model, w, pw in (('mdg-me1', 'Me1', 15.62, 715), ('mdg-me2', 'Me2', 16.62, 1415)):
    fixture(id, 'MDG', model, R((f'https://www.mdgfog.com/en/{model.lower()}', f'MDG, page {model}')), dmx='xlr5', power='unspecified', power_fmt=f'100-250 V, {pw} W', weightKg=w, powerW=pw)
mini('mdg-atme', 'MDG', 'ATMe', 'Générateur de brouillard')
fixture('claypaky-sharpy', 'Claypaky', 'Sharpy', R(('https://www.panavision.com/lighting/lighting-products/heads/product-detail/daf2wan-190w-sharpy-', 'Panavision, fiche Sharpy (loueur)')),
        dmx='xlr5', power='powercon', power_fmt='200 W', status=C, weightKg=19)
mini('claypaky-k15', 'Claypaky', 'A.leda B-EYE K15', 'Lyre wash LED')
mini('claypaky-k25', 'Claypaky', 'A.leda B-EYE K25', 'Lyre wash LED')
mini('ayrton-magicdot-sx', 'Ayrton', 'MagicDot-SX', 'Lyre beam LED 60 W ; CRMX intégré')
fixture('ayrton-magicdot-r', 'Ayrton', 'MagicDot-R', R(('https://azur.novelty-group.com/location-materiel/eclairage/projecteurs-a-led//ayrton/magicdot-r-3413', 'Novelty, fiche MagicDot-R (loueur)')),
        dmx='xlr5', power='powercon', status=C, weightKg=5.3)
mini('ayrton-arcaline-2', 'Ayrton', 'Arcaline 2', 'Barre 10 LED RGBW, 1 020 mm')
GLPF = R(('https://glp.de/files/products/impression-x4-bar-10-product-data/impression_X4_Bar_Flyer_EN.pdf', 'GLP, plaquette impression X4 Bar'))
fixture('glp-x4-bar-10', 'GLP', 'impression X4 Bar 10', GLPF, dmx='xlr5', power='powercon', power_thru=True, weightKg=8)
fixture('glp-x4-bar-20', 'GLP', 'impression X4 Bar 20', GLPF, dmx='xlr5', power='powercon', power_thru=True, weightKg=14.5)
CAM = R(('https://www.cameolight.com/en/solutions/dj-musicians/static-lighting/blacklights/20074/thunderwash-600-uv', 'Cameo, page Thunder Wash 600 UV'))
fixture('cameo-thunder-wash-600-uv', 'Cameo', 'Thunder Wash 600 UV', CAM, dmx='xlr3', power='iec-c13', power_fmt='130 W')
fixture('cameo-uv-bar-200-ir', 'Cameo', 'UV Bar 200 IR', R(('https://www.adamhall.com/shop/us-en/lighting/led-bars/2407/uv-bar-200-ir', 'Adam Hall, page UV Bar 200 IR')),
        dmx='xlr3', power='iec-c13', power_thru=True)
mini('prolights-eclipse-zoom', 'Prolights', 'Eclipse Zoom', 'Mini-découpe LED 35 W, PC16')
mini('prolights-gallery-eclipse', 'Prolights', 'Gallery Eclipse', 'Mini-découpe LED 35 W sur rail, 4 000 K')
for id, model in (('innled-t4x', 'T4X'),):
    sheet(id, 'luminaire', 'Innled', model, 'light', CAT, [P('rf', 'Commande sans fil', 'in', 'dmx', U), P('dc', 'Batterie', 'in', 'power', U, format='Mât LED autonome')], status=C)

# RVE (gradateurs)
for id, model, inc, infmt in (('rve-stager-6x2-3', 'Stager 6x2,3', 'p17-32-tri', 'P17 32 A tri'), ('rve-live-12x3', 'LIVE 12x3', 'p17-63-tri', 'P17 63 A tri'),
                              ('rve-24x3-hdl', '24x3 HDL', U, 'P17 125 A tri'), ('rve-36x2', '36x2', U, 'P17 125 A tri')):
    dmxbox(id, 'RVE', model, CAT, [P('dmxIn', 'DMX In', 'in', 'dmx', U), P('dmxOut', 'DMX Thru', 'out', 'dmx', U),
           P('acIn', 'Arrivée', 'in', 'power', inc, format=infmt), P('acOut', 'Départs gradués', 'out', 'power', U, format='PC16A')])

# Consoles ChamSys
CH = 'ChamSys'
sheet('chamsys-mq500-stadium', 'lightingControl', CH, 'MagicQ MQ500 Stadium', 'control', R(('https://secure.chamsys.co.uk/mq500', 'ChamSys, page MQ500')),
      [*[P(f'dmx{i}', f'DMX {i}', 'out', 'dmx', 'xlr5') for i in range(1, 5)], *[P(f'eth{i}', f'Ethernet {i}', 'bidir', 'network', 'ethercon') for i in range(1, 5)],
       P('dvi', 'Moniteur', 'out', 'video', 'dvi'), P('usb', 'USB', 'bidir', 'control', 'usb-a'),
       P('midi', 'MIDI', 'bidir', 'control', 'din5'), P('ltc', 'LTC', 'in', 'sync', U), P('ac', 'Secteur', 'in', 'power', 'powercon-true1')])
sheet('chamsys-mq80', 'lightingControl', CH, 'MagicQ MQ80', 'control', R(('https://www.pssl.com/ChamSys-MagicQ-MQ80-24-Universe-Compact-Console-1', 'PSSL, fiche MQ80 (revendeur)')),
      [*[P(f'dmx{i}', f'DMX {i}', 'out', 'dmx', 'xlr5') for i in range(1, 5)], *[P(f'eth{i}', f'Ethernet {i}', 'bidir', 'network', 'ethercon') for i in range(1, 5)],
       P('ac', 'Secteur', 'in', 'power', 'powercon')], status=C)
sheet('chamsys-quickq-20', 'lightingControl', CH, 'QuickQ 20', 'control', R(('https://www.thomann.co.uk/chamsys_quickq_20.htm', 'Thomann, fiche QuickQ 20 (revendeur)')),
      [P('dmx1', 'DMX 1', 'out', 'dmx', 'xlr5'), P('dmx2', 'DMX 2', 'out', 'dmx', 'xlr5'), P('dmxIn', 'DMX In', 'in', 'dmx', 'xlr5'),
       P('eth', 'Ethernet', 'bidir', 'network', U), P('midiIn', 'MIDI In', 'in', 'control', 'din5'), P('midiOut', 'MIDI Out', 'out', 'control', 'din5'),
       P('hdmi', 'HDMI', 'out', 'video', 'hdmi'), P('usb', 'USB', 'bidir', 'control', 'usb-a'), P('ac', 'Alimentation', 'in', 'power', U)], status=C)

# Interfaces DMX et réseau
dmxbox('enttec-e-streamer-mk2', 'ENTTEC', 'E-Streamer MK2', R(('https://www.enttec.com/wp-content/uploads/2016/12/E-streamer-MK2-brochure.pdf', 'ENTTEC, brochure E-Streamer MK2')),
       [*[P(f'dmx{i}', f'DMX {i}', 'bidir', 'dmx', U, format='Version 70711') for i in range(1, 5)], P('eth', 'Ethernet', 'bidir', 'network', 'rj45', format='Art-Net / sACN, 48 univers'),
        P('usb', 'USB', 'bidir', 'control', 'usb-a'), P('rs232', 'RS-232', 'bidir', 'control', U), P('dc', 'Alimentation', 'in', 'power', U)])
dmxbox('enttec-pixelator', 'ENTTEC', 'Pixelator', R(('https://cdn.enttec.com/pdf/assets/70060/70060_PIXELATOR_REV_C_DATASHEET.pdf', 'ENTTEC, fiche Pixelator')),
       [P('eth', 'LAN', 'in', 'network', 'rj45', format='Art-Net / sACN / KiNet'), *[P(f'plink{i}', f'PLink {i}', 'out', 'dmx', 'rj45', format='Sortie pixels PLink') for i in range(1, 25)],
        P('ac', 'Alimentation', 'in', 'power', U)], status='verified')
dmxbox('enttec-plink-injector', 'ENTTEC', 'PLink Injector', R(('https://www.enttec.com/product/led-pixel-control/plink-injector/', 'ENTTEC, page PLink Injector')),
       [P('plink', 'PLink In', 'in', 'dmx', 'rj45'), P('spi', 'Sortie pixels', 'out', 'dmx', 'terminal', format='SPI vers rubans LED'),
        P('dcIn', 'Alimentation', 'in', 'power', 'terminal'), P('dcOut', 'Alimentation pixels', 'out', 'power', 'terminal')], status='verified')
dmxbox('luminex-luminode-4', 'Luminex', 'LumiNode 4', R(('https://luminex.be/products/luminode/luminode-4', 'Luminex, page LumiNode 4')),
       [*[P(f'dmx{i}', f'DMX {i}', 'bidir', 'dmx', 'xlr5', format='DMX / RDM isolé') for i in range(1, 5)],
        P('eth1', 'Ethernet 1', 'bidir', 'network', 'ethercon'), P('eth2', 'Ethernet 2', 'bidir', 'network', 'ethercon'), P('ac', 'Secteur', 'in', 'power', 'powercon-true1')], status='verified')
dmxbox('luminex-luminode-2', 'Luminex', 'LumiNode 2', R(('https://www.fullcompass.com/prod/571139-luminex-luminode-2-ethernet-to-2-port-dmx-node', 'Full Compass, fiche LumiNode 2 (revendeur)')),
       [P('dmx1', 'DMX 1', 'bidir', 'dmx', 'xlr5'), P('dmx2', 'DMX 2', 'bidir', 'dmx', 'xlr5'),
        P('eth1', 'Ethernet 1', 'bidir', 'network', 'ethercon', format='PoE'), P('eth2', 'Ethernet 2', 'bidir', 'network', 'ethercon')])
dmxbox('lumenradio-crmx-stardust', 'LumenRadio', 'CRMX Stardust', R(('https://www.huss-licht-ton.de/print_product_info.php/products_id/43857', 'Huss, fiche CRMX Stardust (revendeur)')),
       [P('eth', 'Ethernet', 'bidir', 'network', 'rj45', format='sACN / Art-Net'), P('rf', 'CRMX', 'bidir', 'rf', 'rf', format='Antennes RP-TNC'),
        P('ac', 'Secteur', 'in', 'power', 'powercon-true1'), P('dc', 'DC', 'in', 'power', 'dc-barrel')])
dmxbox('lumenradio-inrfx1', 'LumenRadio', 'CRMX inRFX1', CAT, [P('dmx', 'DMX', 'bidir', 'dmx', U), P('rf', 'CRMX', 'bidir', 'rf', 'rf'), P('dc', 'Alimentation', 'in', 'power', U)])
dmxbox('swisson-xsr-r5-5r', 'Swisson', 'XSR-R5-5R', CAT, [P('dmxIn', 'DMX In', 'in', 'dmx', U), *[P(f'out{i}', f'DMX Out {i}', 'out', 'dmx', U, format='DMX / RDM') for i in range(1, 6)], P('ac', 'Secteur', 'in', 'power', U)])
dmxbox('astera-art7-bluebox', 'Astera', 'ART7 BlueBox', CAT, [P('dmx', 'DMX', 'bidir', 'dmx', U), P('rf', 'Bluetooth / CRMX / W-DMX', 'bidir', 'rf', 'rf'), P('dc', 'Alimentation', 'in', 'power', U)])

# Réseau
def switch(id, mfr, model, ports, srcs=None, status=C): sheet(id, 'network', mfr, model, 'switch', srcs or CAT, ports, status=status)
switch('cisco-sg300-10p', 'Cisco', 'SG300-10P', [*[P(f'ge{i}', f'GE {i}', 'bidir', 'network', 'rj45', format='Gigabit PoE') for i in range(1, 9)],
       P('combo1', 'Combo 1', 'bidir', 'network', 'sfp', format='Gigabit RJ45 / SFP'), P('combo2', 'Combo 2', 'bidir', 'network', 'sfp', format='Gigabit RJ45 / SFP'), P('ac', 'Secteur', 'in', 'power', U)])
switch('cisco-sg300-20', 'Cisco', 'SG300-20', [*[P(f'ge{i}', f'GE {i}', 'bidir', 'network', 'rj45', format='Gigabit') for i in range(1, 19)],
       P('combo1', 'Combo 1', 'bidir', 'network', 'sfp', format='Gigabit RJ45 / SFP'), P('combo2', 'Combo 2', 'bidir', 'network', 'sfp', format='Gigabit RJ45 / SFP'), P('ac', 'Secteur', 'in', 'power', U)])
switch('oxo-core8pro', 'OXO', 'CORE8PRO', [*[P(f'p{i}', f'Port {i}', 'bidir', 'network', U, format='10/100 PoE+') for i in range(1, 9)],
       P('trunk1', 'Trunk 1', 'bidir', 'network', 'rj45', format='1 Gb/s'), P('trunk2', 'Trunk 2', 'bidir', 'network', 'rj45', format='1 Gb/s'), P('ac', 'Secteur', 'in', 'power', U)])
switch('netgear-r6220', 'Netgear', 'R6220 (AC1200)', [*[P(f'lan{i}', f'LAN {i}', 'bidir', 'network', 'rj45', format='Gigabit') for i in range(1, 5)],
       P('wan', 'WAN', 'bidir', 'network', 'rj45'), P('wifi', 'Wi-Fi', 'bidir', 'rf', 'rf', format='AC1200'), P('dc', 'Alimentation', 'in', 'power', 'dc-barrel')])
