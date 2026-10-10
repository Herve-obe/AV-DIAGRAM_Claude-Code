# Electro-Voice : EVOLVE 50, DeltaMax DML-1122, TX2181, SX300E ; Behringer : MS16, X AIR XR12 / XR18.
from common import P, src, sheet, spk
U = 'unspecified'
def R(*pairs): return [src(u, d) for u, d in pairs]
EV = 'Electro-Voice'
B = 'Behringer'

sheet('electro-voice-evolve-50', 'speaker', EV, 'EVOLVE 50', 'speaker',
      R(('https://www.huss-licht-ton.de/print_product_info.php/en/products_id/24792', 'Huss, fiche EVOLVE 50 (revendeur)'), ('https://www.bananamusic.it/stampa/prodotto/159814', 'Banana Music, fiche EVOLVE 50 (revendeur)')),
      [P('in1', 'Input 1', 'in', 'audioAnalog', 'combo', level='mic', phantom='supplied', format='Combo XLR / jack ; fantôme 15 V'),
       P('in2', 'Input 2', 'in', 'audioAnalog', 'combo', level='mic', phantom='supplied', format='Combo XLR / jack ; fantôme 15 V'),
       P('rca', 'Stereo In', 'in', 'audioAnalog', 'rca', level='line-10', channels=2),
       P('mini', 'Aux In', 'in', 'audioAnalog', 'minijack', level='line-10', channels=2),
       P('bt', 'Bluetooth', 'in', 'rf', 'rf', format='Lecture audio Bluetooth'),
       P('thru', 'Thru', 'out', 'audioAnalog', 'xlr3', level='line+4', format='Recopie de l\'entrée'),
       P('mix', 'Mix Out', 'out', 'audioAnalog', 'xlr3', level='line+4'),
       P('ac', 'Secteur', 'in', 'power', U, format='Amplification 2 × 500 W')], status='community', weightKg=26.5)

sheet('electro-voice-dml-1122', 'speaker', EV, 'DeltaMax DML-1122', 'speaker',
      R(('https://cuesale.com/product/electro-voice-dml-1122-set-2x/', 'Cuesale, annonce DML-1122 (occasion)')),
      [P('in', 'Input', 'in', 'audioAnalog', U, level='speaker', format='Bi-amplifiée (grave 12" / aigu DH1A) avec contrôleur DMC-1122 ; connecteur non précisé')],
      status='community')
sheet('electro-voice-tx2181', 'speaker', EV, 'TX2181', 'speaker',
      R(('https://products.electrovoice.com/download/970184', 'Electro-Voice, fiche technique TX2181'),
        ('https://www.proacousticsusa.com/electro-voice-tx2181-dual-18-inch-subwoofer.html', 'Pro Acoustics, fiche TX2181 (revendeur)')),
      spk('spk', 2, 'Speakon', 'speakon-nl4', '2 × 18", 4 Ω, 1 000 W continu / 4 000 W crête'), weightKg=56.1)
sheet('electro-voice-sx300', 'speaker', EV, 'SX300E', 'speaker',
      R(('https://www.boullard.ch/en/product/sono-studio/speakers/passive-speakers/100458-ev-electro-voice-sx300e/', 'Boullard, fiche SX300E (revendeur)')),
      spk('spk', 2, 'Speakon', 'speakon-nl4', '12" + 1,25", 8 Ω, 300 W continu / 1 200 W crête'), status='community', weightKg=17.7)

sheet('behringer-ms16', 'speaker', B, 'MS16', 'speaker',
      R(('https://thomann.ae/behringer_ms16.htm', 'Thomann, fiche MS16 (revendeur)'), ('https://galaxus.fr/en/s1/product/behringer-ms16-active-pair-1x-16-w-monitor-speakers-287539', 'Galaxus, fiche MS16 (revendeur)')),
      [P('line1', 'Line In 1', 'in', 'audioAnalog', 'rca', level='line-10', channels=2),
       P('line2', 'Line In 2', 'in', 'audioAnalog', 'rca', level='line-10', channels=2),
       P('aux', 'Aux In', 'in', 'audioAnalog', 'minijack', level='line-10', channels=2),
       P('mic', 'Mic / Guitar', 'in', 'audioAnalog', 'jack-ts', level='mic', format='Jack 6,35 face avant (micro dynamique ou guitare)'),
       P('phones', 'Phones', 'out', 'audioAnalog', 'minijack', channels=2),
       P('ac', 'Secteur', 'in', 'power', U)], status='community', weightKg=3.5)

def xair(id, model, srcs, mics, lines, auxes, aux_conn, extra, w=None):
    ports = [P(f'in{i}', f'Input {i}', 'in', 'audioAnalog', 'combo', level='mic', phantom='supplied', format='Combo XLR / jack, préampli Midas') for i in range(1, mics + 1)]
    ports += [P(f'line{i}', f'Line In {i}', 'in', 'audioAnalog', 'jack-trs', level='line+4') for i in range(mics + 1, mics + lines + 1)]
    ports += [P('mainL', 'Main Out L', 'out', 'audioAnalog', 'xlr3', level='line+4'), P('mainR', 'Main Out R', 'out', 'audioAnalog', 'xlr3', level='line+4')]
    ports += [P(f'aux{i}', f'Aux Out {i}', 'out', 'audioAnalog', aux_conn, level='line+4') for i in range(1, auxes + 1)]
    ports += [P('phones', 'Phones', 'out', 'audioAnalog', 'jack-trs', channels=2),
              P('ultranet', 'Ultranet', 'out', 'audioDigital', 'rj45', channels=16, format='Vers mélangeurs personnels P16'),
              P('eth', 'Ethernet', 'bidir', 'network', 'rj45', format='Commande ; routeur Wi-Fi intégré'),
              P('midiIn', 'MIDI In', 'in', 'control', 'din5'), P('midiOut', 'MIDI Out', 'out', 'control', 'din5'), *extra,
              P('ac', 'Secteur', 'in', 'power', U)]
    sheet(id, 'console', B, model, 'console', srcs, ports, status='community', weightKg=w)
xair('behringer-xr12', 'X AIR XR12', R(('https://drewbrashler.com/2017/behringer-xair-xr18-series-introduction-xr18/', 'Drew Brashler, présentation de la gamme X AIR')),
     4, 8, 2, 'jack-trs', [P('usb', 'USB', 'bidir', 'audioDigital', 'usb-a', channels=2, format='Enregistrement / lecture stéréo sur clé')])
xair('behringer-xr18', 'X AIR XR18', R(('https://www.thomann.fr/behringer_x_air_xr18_bag_bundle.htm', 'Thomann, fiche XR18 (revendeur)')),
     16, 2, 6, 'xlr3', [P('usb', 'USB', 'bidir', 'audioDigital', 'usb-b', channels=18, format='Interface audio multicanal 18 × 18')], w=3.2)
