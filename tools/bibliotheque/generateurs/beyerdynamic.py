# beyerdynamic : micros M 88 TG, M 201 TG, Opus 87, serre-tête TG H56c ; système DECT Unite (AP4, TP, TH, RP).
from common import P, src, sheet, mic
M = 'beyerdynamic'
U = 'unspecified'
def R(*pairs): return [src(u, d) for u, d in pairs]

mic('beyerdynamic-m-88-tg', M, 'M 88 TG', R(('https://recordinghacks.com/microphones/beyerdynamic/m-88', 'Recordinghacks, M 88 TG'), ('https://micpedia.com/?p=6138', 'Micpedia, M 88 TG')),
    'none', fmt='Dynamique hypercardioïde', status='community', weightKg=0.32)
mic('beyerdynamic-m-201-tg', M, 'M 201 TG', R(('https://www.bax-shop.co.uk/dynamic-vocal-microphones/beyerdynamic-m-201-tg-dynamic-microphone', 'Bax Music, fiche M 201 TG (revendeur)')),
    'none', fmt='Dynamique hypercardioïde', status='community', weightKg=0.22)
mic('beyerdynamic-opus-87', M, 'Opus 87', R(('https://micpedia.com/?p=6305', 'Micpedia, Opus 87')),
    'required', fmt='Électret, fantôme 12-48 V, 6 mA', status='community', weightKg=0.145)
mic('beyerdynamic-tg-h56c-tg', M, 'TG H56c (TG)', R(('https://images.static-thomann.de/pics/atg/atgdata/document/specs/383820_dat_tgh56_de_a2.pdf', 'beyerdynamic, fiche TG H56 (via Thomann)'),
    ('https://www.huss-licht-ton.de/product_info.php/en/Beyerdynamic-TG-H56-TAN-TG-Headset-beige/info/33077.html', 'Huss, fiche TG H56 TG (revendeur)')),
    'none', connector='ta4', fmt='Serre-tête électret omni ; mini-XLR 4 points femelle, câblage TG (émetteurs TG et Unite) ; MA PVA pour usage filaire',
    status='community', weightKg=0.018)

sheet('beyerdynamic-unite-ap4', 'wireless', M, 'Unite AP4', 'wireless',
      R(('https://cdn.accentuate.io/5019967029292/12567395860524/BD710482_datasheet-v1590020381901.pdf', 'beyerdynamic, fiche Unite AP4 (BD710482)')),
      [P('anaIn', 'Analog In 1-4', 'in', 'audioAnalog', 'terminal', level='line+4', channels=4, format='Phoenix 6 points 3,5 mm, symétrique'),
       P('anaOut', 'Analog Out 1-4', 'out', 'audioAnalog', 'terminal', level='line+4', channels=4, format='Phoenix 6 points 3,5 mm, symétrique'),
       P('dante', 'Dante / PoE', 'bidir', 'audioIp', 'rj45', channels=4, format='Dante, PoE 802.3af 12 W'),
       P('eth', 'Ethernet', 'bidir', 'network', 'rj45', format='Commande (Unite Manager)'),
       P('syncIn', 'Sync In', 'in', 'sync', 'rj45', format='Synchronisation jusqu\'à 8 AP4'), P('syncOut', 'Sync Out', 'out', 'sync', 'rj45'),
       P('rf', 'DECT', 'bidir', 'rf', 'rf', format='DECT 1 880-1 900 MHz (UE), antennes intégrées'),
       P('dc', 'DC In', 'in', 'power', 'dc-barrel', format='12 V (bloc 36 W) ou PoE')], weightKg=0.86)

UNITE_TP = src('https://www.fullcompass.com/common/files/47267-UniteTPSpecSheet.pdf', 'beyerdynamic, fiche Unite TP (via Full Compass)')
UNITE_RP = src('https://www.fullcompass.com/common/files/47261-UniteRPSpecSheet.pdf', 'beyerdynamic, fiche Unite RP (via Full Compass)')
sheet('beyerdynamic-unite-tp', 'wireless', M, 'Unite TP', 'wireless', [UNITE_TP],
      [P('mic', 'Micro', 'in', 'audioAnalog', 'ta4', level='mic', format='Mini-XLR 4 points (câblage TG) ; micro intégré'),
       P('headset', 'Casque-micro', 'bidir', 'audioAnalog', 'minijack', format='Mini-jack 3,5'),
       P('lineIn', 'Line In', 'in', 'audioAnalog', 'minijack', level='line-10', channels=2, format='Mini-jack 3,5'),
       P('rf', 'DECT', 'bidir', 'rf', 'rf'), P('usb', 'USB-C', 'in', 'power', 'usb-c', format='Charge')], status='community')
sheet('beyerdynamic-unite-th', 'wireless', M, 'Unite TH', 'wireless',
      R(('https://www.bhphotovideo.com/c/product/1925097-REG/televic_71_98_4014_unite_th_transmitter_handheld.html', 'B&H, fiche Unite TH (revendeur)')),
      [P('rf', 'DECT', 'bidir', 'rf', 'rf', format='Émetteur main, batterie Li-Ion')], status='community')
sheet('beyerdynamic-unite-rp', 'wireless', M, 'Unite RP', 'wireless', [UNITE_RP],
      [P('rf', 'DECT', 'in', 'rf', 'rf', format='Antenne : câble du casque'),
       P('phones', 'Casque', 'out', 'audioAnalog', 'minijack', channels=2, format='Mini-jack 3,5 (casque ou boucle d\'induction)'),
       P('usb', 'USB-C', 'in', 'power', 'usb-c', format='Charge')], status='community', weightKg=0.105)
