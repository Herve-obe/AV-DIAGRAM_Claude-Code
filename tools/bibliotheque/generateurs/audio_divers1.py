# Audio divers : Innovason SY48 / SY80 et stagebox, Bose S1 Pro / L1 Compact / 802 III, Fohhn FP-22 et A-1 live,
# Clear-Com IF4W4 / FL-7 / AC-10K, Turbosound iQ10 / iQ15B, Green-GO Dante Interface X.
from common import P, src, sheet, spk
U = 'unspecified'
def R(*pairs): return [src(u, d) for u, d in pairs]
def ac(fmt=None): return P('ac', 'Secteur', 'in', 'power', U, format=fmt)
NOV = 'https://www.novelty.fr/produits/sonorisation/'

INN = 'Innovason'
sheet('innovason-sy48', 'console', INN, 'SY48', 'console',
      R(('https://fohonline.com/articles/road-tests/innovason-sy48-digital-console', 'FOH, test SY48'), ('https://en.audiofanzine.com/digital-mixer/innovason/Sy48/', 'Audiofanzine, SY48')),
      [P('localIn', 'Entrées locales', 'in', 'audioAnalog', U, level='mic', channels=48, format='Cartes 8 E/S en face arrière (6 emplacements) ; configuration variable'),
       P('localOut', 'Sorties locales', 'out', 'audioAnalog', U, level='line+4', channels=24, format='Cartes 8 E/S ; configuration variable'),
       P('stage', 'Liaison stagebox', 'bidir', 'audioDigital', U, channels=64, format='Coaxial ou fibre (500 / 2 000 m), stagebox en option'),
       ac()], status='community')
sheet('innovason-sy80', 'console', INN, 'SY80', 'console',
      R(('https://en.audiofanzine.com/digital-mixer/innovason/Sy80/user_reviews/r.32907.html', 'Audiofanzine, avis SY80'), ('https://www.10kused.com/used/innovason-sy80/', '10kused, annonce SY80')),
      [P('mixbox', 'Mix-Box', 'bidir', 'audioDigital', U, channels=104, format='Rack audio local, 8 emplacements de cartes (sorties UM-8PO : 8 XLR analogiques ou AES)'),
       P('stage', 'Liaison stagebox', 'bidir', 'audioDigital', U, channels=64, format='Stagebox / DIO, EtherSound 100 Mb/s en option'),
       ac('Alimentation redondante')], status='community')
sheet('innovason-stagebox', 'stagebox', INN, 'Stagebox 64 entrées', 'stagebox',
      R(('https://en.audiofanzine.com/digital-mixer/innovason/Sy48/', 'Audiofanzine, SY48 (stagebox optionnelle)')),
      [P('in', 'Entrées micro', 'in', 'audioAnalog', U, level='mic', channels=64, format='Connecteurs non précisés'),
       P('link', 'Liaison console', 'bidir', 'audioDigital', U, channels=64, format='Coaxial ou fibre'), ac()], status='community')

BO = 'Bose'
sheet('bose-s1-pro', 'speaker', BO, 'S1 Pro', 'speaker',
      R(('https://thomann.ae/bose_s1_pro_441087.htm', 'Thomann, fiche S1 Pro (revendeur)'), (NOV + 'diffusion-sonorisation/enceinte-amplifiee/s1-2/', 'Novelty, fiche S1 (loueur)')),
      [P('in1', 'Ch 1', 'in', 'audioAnalog', 'combo', level='mic', format='Combo XLR / jack 6,35'),
       P('in2', 'Ch 2', 'in', 'audioAnalog', 'combo', level='mic', format='Combo XLR / jack 6,35'),
       P('aux', 'Aux In', 'in', 'audioAnalog', 'minijack', level='line-10', channels=2),
       P('bt', 'Bluetooth', 'in', 'rf', 'rf'), P('lineOut', 'Line Out', 'out', 'audioAnalog', 'jack-trs', level='line+4'),
       ac('Batterie ou secteur')], status='community')
sheet('bose-l1-compact', 'speaker', BO, 'L1 Compact', 'speaker',
      R(('https://www.fullcompass.com/common/files/13903-SpecSheet.pdf', 'Bose, fiche technique L1 Compact (via Full Compass)')),
      [P('mic', 'Ch 1 Mic', 'in', 'audioAnalog', 'xlr3', level='mic'),
       P('inst', 'Ch 2 Instrument', 'in', 'audioAnalog', 'jack-trs', level='instrument', format='Jack 6,35'),
       P('rca', 'Ch 2 Stereo In', 'in', 'audioAnalog', 'rca', level='line-10', channels=2),
       P('mini', 'Aux In', 'in', 'audioAnalog', 'minijack', level='line-10', channels=2),
       P('out', 'Line Out', 'out', 'audioAnalog', 'rca', level='line-10'), ac()], status='community')
sheet('bose-802-iii', 'speaker', BO, '802 Series III', 'speaker',
      R(('https://www.fullcompass.com/common/files/13901-SpecSheet.pdf', 'Bose, fiche technique 802 Series III (via Full Compass)')),
      spk('spk', 2, 'Speakon', 'speakon-nl4', '8 × 4,5", 8 Ω, 240 W ; égaliseur actif 802-C requis'), status='community')

FO = 'Fohhn'
for id, model in (('fohhn-fp-22-rx', 'FP-22 RX'), ('fohhn-fp-22-rxtx', 'FP-22 RXTX')):
    sheet(id, 'speaker', FO, model, 'speaker',
          R(('https://fohhn.com/en/products/fp-22-modular', 'Fohhn, page FP-22 modular'), (NOV + 'diffusion-sonorisation/enceinte-amplifiee/fp22-cd-rx-2/', 'Novelty, fiche FP22 CD-RX (loueur)')),
          [P('mix', 'Entrées mélangeur', 'in', 'audioAnalog', U, level='mic', channels=4, format='Mélangeur 4 voies intégré ; connecteurs non précisés'),
           P('rx', 'Récepteur HF', 'in', 'rf', 'rf', format='Récepteur micro HF intégré' + (' + émetteur (in-ear / pocket)' if 'TX' in model else '')),
           P('ac', 'Secteur / charge', 'in', 'power', U, format='Batterie, autonomie 20 h')], status='community')
sheet('fohhn-a-1-live', 'processing', FO, 'A-1 live', 'processor',
      R(('https://lsionline.co.uk/news/fohhn-releases-a-1-live-audio-interface-wfx7l9', 'LSi, annonce A-1 live'), ('https://azur.novelty.fr/download/materiel_manuels/fohhn_a1_manuel.pdf', 'Fohhn, manuel A-1 (via Novelty)')),
      [P('usb', 'USB', 'in', 'audioDigital', 'usb-b', channels=2, format='USB 1.1, isolé galvaniquement ; alimente l\'appareil'),
       P('outL', 'Out L', 'out', 'audioAnalog', 'xlr3', level='line+4'), P('outR', 'Out R', 'out', 'audioAnalog', 'xlr3', level='line+4')], status='community')

CC = 'Clear-Com'
def ccline(id, name): return P(id, name, 'bidir', 'intercom', 'xlr3', format='Partyline Clear-Com')
sheet('clear-com-if4w4', 'intercom', CC, 'IF4W4', 'intercom',
      R(('https://expandore.com/Clear-Com/Party-Line/IF4W4_Interfaces.htm', 'Expandore, fiche IF4W4'), ('https://clear-com.atlassian.net/wiki/spaces/SF/pages/158715614', 'Clear-Com, base de connaissances : IF4W4')),
      [*[ccline(f'line{i}', f'Ligne {i}') for i in range(1, 5)],
       *[P(f'fw{i}', f'4 fils {i}', 'bidir', 'audioAnalog', 'terminal', level='line+4', format='Bornier, entrée + sortie 4 fils') for i in range(1, 5)]],
      status='community', rackU=1)
sheet('clear-com-fl-7', 'intercom', CC, 'FL-7', 'intercom',
      R(('https://www.musson.com/fl-7-call-signal-flasher.html', 'Musson, fiche FL-7 (revendeur)'), (NOV + 'interphonie/intercom/fl7/', 'Novelty, fiche FL7 (loueur)')),
      [ccline('in', 'Ligne (XLR F)'), ccline('out', 'Ligne (XLR M)')], status='community', weightKg=0.415)
sheet('clear-com-ac-10k', 'intercom', CC, 'AC-10K', 'intercom',
      R(('https://auvergne-rhone-alpes.novelty-group.com/download/materiel_manuels/1186142771.pdf', 'Clear-Com, notice AC-10 (via Novelty)')),
      [ccline('line', 'Ligne'), P('ext', 'Système externe', 'bidir', 'audioAnalog', 'binding-post', format='2, 3 ou 4 fils, bornes à vis')], status='community')

TS = 'Turbosound'
sheet('turbosound-iq10', 'speaker', TS, 'iQ10', 'speaker', R(('https://thomann.ae/turbosound_iq10.htm', 'Thomann, fiche iQ10 (revendeur)')),
      [P('in1', 'Input 1', 'in', 'audioAnalog', 'combo', level='mic'), P('in2', 'Input 2', 'in', 'audioAnalog', 'combo', level='mic'),
       P('linkA', 'Link A', 'out', 'audioAnalog', 'xlr3', level='line+4'), P('linkB', 'Link B', 'out', 'audioAnalog', 'xlr3', level='line+4'),
       P('mix', 'Mix Out', 'out', 'audioAnalog', 'xlr3', level='line+4'),
       P('unIn', 'Ultranet In', 'in', 'audioDigital', 'rj45'), P('unOut', 'Ultranet Link', 'out', 'audioDigital', 'rj45'), ac('2 500 W')],
      status='community', weightKg=17.2)
sheet('turbosound-iq15b', 'speaker', TS, 'iQ15B', 'speaker', R(('https://thomann.fr/turbosound_iq15b.htm', 'Thomann, fiche iQ15B (revendeur)')),
      [P('in', 'Inputs', 'in', 'audioAnalog', U, level='line+4', channels=2, format='Nombre et type non confirmés'),
       P('linkA', 'Out A', 'out', 'audioAnalog', 'xlr3', level='line+4'), P('linkB', 'Out B', 'out', 'audioAnalog', 'xlr3', level='line+4'),
       P('unIn', 'Ultranet In', 'in', 'audioDigital', 'rj45'), P('unOut', 'Ultranet Link', 'out', 'audioDigital', 'rj45'), ac('3 000 W')],
      status='community', weightKg=30.6)

sheet('green-go-dante-interface-x', 'intercom', 'Green-GO', 'Dante Interface X', 'intercom',
      R(('https://www.audinate.com/products/dante-enabled/green-go/green-go-dante-interface-x', 'Audinate, fiche Green-GO Dante Interface X'),
        ('https://www.adorama.com/green-go-dante-interface-x-digital-audio-converter/p/grodnti', 'Adorama, fiche Dante Interface X (revendeur)')),
      [P('dante', 'Dante / AES67', 'bidir', 'audioIp', U, channels=4, format='4 entrées / 4 sorties'),
       P('ggo', 'Réseau Green-GO', 'bidir', 'intercom', U, format='PoE 802.3af'),
       P('dc', 'DC 12 V', 'in', 'power', 'dc-barrel', format='Bloc externe en option')], status='community', weightKg=2.38, rackU=1)
