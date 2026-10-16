# Taiden : conférence HCS-4800 / HCS-8600, interprétation simultanée et infrarouge HCS-5100, vidéo TMX.
# Sources : fiches techniques Taiden (www.taiden.com/upload/download/...).
from common import P, src, sheet
M = 'Taiden'
B = 'https://www.taiden.com/upload/download/'
U = 'unspecified'
def R(f, doc): return [src(B + f, doc)]
def trunk(id, name, d='bidir', fmt='Ligne de conférence (câble 8 points en boucle)'): return P(id, name, d, 'control', 'din8', format=fmt)
def ac(fmt='100-240 V'): return P('ac', 'Secteur', 'in', 'power', U, format=fmt)

sheet('taiden-hcs-4800ma-20', 'processing', M, 'HCS-4800MA/20', 'processor',
      R('Wired%20Premium%20System%20Main%20Units%201.pdf', 'Taiden, fiche technique unités centrales HCS-4800MA/20'),
      [P('micIn', 'Mic / Line In', 'in', 'audioAnalog', 'xlr3', level='mic', phantom='supplied', format='XLR femelle, micro (fantôme 48 V) ou ligne'),
       P('lineIn', 'Line In', 'in', 'audioAnalog', 'rca', level='line-10', channels=2),
       P('lineOutXlr', 'Line Out', 'out', 'audioAnalog', 'xlr3', level='line+4', format='XLR mâle symétrique'),
       P('lineOut', 'Line Out (RCA)', 'out', 'audioAnalog', 'rca', level='line-10', channels=2),
       trunk('trunk1', 'Trunk 1', 'out'), trunk('trunk2', 'Trunk 2', 'out'),
       P('ext1', 'Extension 1', 'out', 'control', 'rj45', format='Vers unité d\'extension HCS-8600MEA ou interface audio'),
       P('ext2', 'Extension 2', 'out', 'control', 'rj45', format='Vers unité d\'extension HCS-8600MEA ou interface audio'),
       P('eth', 'Ethernet', 'bidir', 'network', 'rj45', format='Commande PC, TCP/IP'),
       P('fiber', 'Fibre', 'bidir', 'control', 'sc', format='SC duplex monomode, liaison entre deux salles'),
       P('rs232', 'RS-232', 'bidir', 'control', U, format='Contrôle centralisé'),
       P('usb', 'USB', 'bidir', 'audioDigital', 'usb-c', format='Audio numérique'),
       P('emergency', 'Emergency', 'in', 'control', U, format='Signal d\'alarme'), ac()], weightKg=7.8, rackU=2)

sheet('taiden-hcs-8600mea', 'processing', M, 'HCS-8600MEA', 'processor',
      [src('https://euro-trend.pl/wp-content/uploads/HCS-8600MEA_Series_Congress_Extension_Main_Unit_D.1622792155646.pdf', 'Taiden, fiche HCS-8600MEA series (via distributeur Euro-Trend)')],
      [*[trunk(f'trunk{i}', f'Trunk {i}', 'out') for i in range(1, 6)],
       P('in1', 'Extension In 1', 'in', 'control', 'rj45', format='Depuis l\'unité centrale ou l\'extension précédente'),
       P('in2', 'Extension In 2', 'in', 'control', 'rj45'),
       P('out', 'Extension Out', 'out', 'control', 'rj45', format='Vers l\'extension suivante'),
       P('fiber1', 'Fibre 1', 'bidir', 'control', 'sc', format='SC duplex monomode'), P('fiber2', 'Fibre 2', 'bidir', 'control', 'sc', format='SC duplex monomode'),
       ac('100-240 V, 500 W'), P('ac2', 'Secteur secours', 'in', 'power', U, format='Alimentation redondante')], status='community', powerW=500)

def seat(id, model, f, doc, fmt):
    sheet(id, 'capture', M, model, 'mic', R(f, doc),
          [P('mic', 'Micro (col de cygne)', 'in', 'audioAnalog', U, level='mic', format='Embase 5 points pour micro MS amovible'),
           P('phones', 'Casque', 'out', 'audioAnalog', 'minijack', channels=2),
           trunk('trunkIn', 'Câble 8P-DIN (fiche)', 'in', '1,5 m, vers unité centrale ou poste précédent'),
           trunk('trunkOut', 'Câble 8P-DIN (embase)', 'out', '0,6 m, vers poste suivant')], weightKg=0.9)
seat('taiden-hcs-4838cs-80', 'HCS-4838CS/80', 'HCS-4838CS_80%20Datasheet.pdf', 'Taiden, fiche HCS-4838CS/80', 'Poste président')
seat('taiden-hcs-4838ds-80', 'HCS-4838DS/80', 'HCS-4838DS_80%20Datasheet.pdf', 'Taiden, fiche HCS-4838DS/80', 'Poste délégué')

for model, f, n, extra in (('HCS-8600MIO/08A', 'HCS-8600MIO_08A%20Datasheet.pdf', 8, []),
                           ('HCS-8600MIO/16AD', 'HCS-8600MIO_16AD%20Datasheet.pdf', 16, [P('dante', 'Dante', 'bidir', 'audioIp', 'rj45', channels=16, format='Module Dante 16 canaux')])):
    outs = [P(f'out{i}', f'Out {i}', 'out', 'audioAnalog', 'terminal', level='line+4', format='Phoenix 3 points symétrique') for i in range(1, 9)] if n == 8 else []
    sheet('taiden-' + model.lower().replace('/', '-'), 'processing', M, model, 'processor', R(f, 'Taiden, fiche ' + model),
          [*[P(f'in{i}', f'In {i}', 'in', 'audioAnalog', 'terminal', level='line+4', format='Phoenix 3 points symétrique, micro ou ligne') for i in range(1, n + 1)],
           *outs, *extra,
           P('ext', 'Extension', 'bidir', 'control', 'rj45', format='Vers unité centrale (ou fibre, une seule liaison à la fois)'),
           P('fiber', 'Fibre', 'bidir', 'control', 'sc', format='SC duplex monomode'),
           P('extOut', 'Extension (suivante)', 'out', 'control', 'rj45'),
           P('rs232', 'RS-232', 'bidir', 'control', U), P('usb', 'USB', 'bidir', 'control', 'usb-a', format='Mise à jour'),
           ac('100-240 V, 65 W')], powerW=65, weightKg=3.6, rackU=2)

sheet('taiden-hcs-8685st', 'intercom', M, 'HCS-8685ST', 'intercom', R('HCS-8685STDatasheet-0313.pdf', 'Taiden, fiche HCS-8685ST (pupitre interprète 64 canaux)'),
      [P('mic', 'Micro (col de cygne)', 'in', 'audioAnalog', U, level='mic', format='Embase 5 points pour micro MS amovible'),
       P('headset1', 'Casque-micro 1', 'bidir', 'audioAnalog', 'minijack', format='Mini-jack 3,5 TRRS (CTIA)'),
       P('headset2', 'Casque-micro 2', 'bidir', 'audioAnalog', 'minijack', format='Mini-jack 3,5 TRRS (CTIA)'),
       trunk('trunkIn', 'Câble 8P-DIN (fiche)', 'in', '1,4 m, vers unité centrale HCS-4800M / 8600M ou pupitre précédent'),
       trunk('trunkOut', 'Câble 8P-DIN (embase)', 'out', '0,6 m, bouclage')], weightKg=1.5)

for mid, model, w in (('taiden-hcs-5100ma-08n', 'HCS-5100MA/08N', 7.5), ('taiden-hcs-5100ma-16bd', 'HCS-5100MA/16BD', None)):
  sheet(mid, 'wireless', M, model, 'wireless',
      [src('https://occitanie.novelty.fr/produits/sonorisation/traduction-simultanee/recepteur/hcs-5100ma-08n/', 'Novelty, fiche HCS-5100MA/08N (loueur) ; série 4 à 40 canaux, connectique supposée identique')],
      [P('dcs1', 'DCS 1', 'bidir', 'control', 'rj45', format='Vers unité centrale HCS-4800 / 8600'),
       P('dcs2', 'DCS 2', 'bidir', 'control', 'rj45'),
       P('interp', 'Interprète', 'in', 'audioAnalog', 'din6', format='DIN 6 points, pupitre HCS-8385N'),
       P('hf', 'HF Out', 'out', 'rf', 'bnc', format='Vers radiateurs HCS-5100T (nombre de sorties non précisé)'),
       ac('25 W')], status='community', powerW=25, weightKg=w)

sheet('taiden-hcs-5100t-35b', 'wireless', M, 'HCS-5100T/35B', 'wireless', R('HCS-5100T_35B%20Datasheet.pdf', 'Taiden, fiche HCS-5100T/35B (radiateur infrarouge 35 W)'),
      [P('hfIn', 'HF In', 'in', 'rf', 'bnc', format='75 Ω, depuis l\'émetteur'), P('hfOut', 'HF Out', 'out', 'rf', 'bnc', format='75 Ω, recopie vers radiateur suivant'),
       ac('100-240 V, 120 W')], powerW=120, weightKg=4.2)

sheet('taiden-hcs-5100r-b', 'wireless', M, 'HCS-5100R/B (récepteur IR)', 'wireless', R('HCS-5100R_B%20series%20Datasheet.pdf', 'Taiden, fiche série HCS-5100R/B'),
      [P('ir', 'Réception IR', 'in', 'rf', 'rf', format='Infrarouge IEC 61603-7, 2 à 6 MHz'),
       P('phones', 'Écouteur', 'out', 'audioAnalog', 'minijack', channels=2), P('usb', 'USB-C', 'in', 'power', 'usb-c', format='Charge et mise à jour')])

sheet('taiden-tmx-0808sdi2', 'videoRouting', M, 'TMX-0808SDI2', 'router', R('TMX-0808SDI2Datasheet.pdf', 'Taiden, fiche TMX-0808SDI2'),
      [*[P(f'in{i}', f'SDI In {i}', 'in', 'video', 'bnc', format='SD / HD / 3G-SDI') for i in range(1, 9)],
       *[P(f'out{i}', f'SDI Out {i}', 'out', 'video', 'bnc', format='SD / HD / 3G-SDI') for i in range(1, 9)],
       P('rs232', 'RS-232', 'bidir', 'control', 'dsub9'), P('tainet', 'TAINET', 'bidir', 'control', U, format='Liaison système de conférence (suivi caméra)'),
       P('eth', 'TCP/IP', 'bidir', 'network', 'rj45'), ac()], weightKg=3.0)
