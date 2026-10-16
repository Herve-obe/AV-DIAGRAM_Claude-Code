# Audio divers : Avid VENUE SC48 / Profile, Soundcraft EPM6 / EFX8, Bosch DICENTIS sans fil, QSC PLX1802 / TouchMix-16,
# RME MADI Router / MADIface XT, Tascam CD-200 / SS-CDR200 / DR-40.
from common import P, src, sheet
U = 'unspecified'
def R(*pairs): return [src(u, d) for u, d in pairs]
def ac(fmt=None): return P('ac', 'Secteur', 'in', 'power', U, format=fmt)
def mics(n, conn='xlr3', fmt='Micro / ligne', start=1): return [P(f'in{i}', f'Input {i}', 'in', 'audioAnalog', conn, level='mic', phantom='supplied', format=fmt) for i in range(start, start + n)]
def outs(prefix, name, n, conn='xlr3', fmt=None, start=1): return [P(f'{prefix}{i}', f'{name} {i}', 'out', 'audioAnalog', conn, level='line+4', format=fmt) for i in range(start, start + n)]

AV = 'Avid'
sheet('avid-venue-sc48', 'console', AV, 'VENUE SC48', 'console',
      R(('https://www.fullcompass.com/common/files/11319-AVIDVenueSC48Datasheet.pdf', 'Avid, fiche technique VENUE SC48 (via Full Compass)')),
      [*mics(48, fmt='XLR micro / ligne'), *outs('out', 'Line Out', 16, fmt='Extensible à 32 (carte AO16 / XO16)'),
       P('slot', 'Carte d\'extension', 'out', 'audioDigital', U, format='AO16 analogique, XO16 (8 AES + 8 analogiques) ou AT16 A-Net'),
       P('tb', 'Talkback', 'in', 'audioAnalog', 'xlr3', level='mic'),
       P('2trIn', '2-Track In', 'in', 'audioAnalog', 'jack-trs', level='line+4', channels=2), P('2trOut', '2-Track Out', 'out', 'audioAnalog', 'jack-trs', level='line+4', channels=2),
       P('aesIn', 'AES In', 'in', 'audioDigital', 'xlr3', channels=2), P('aesOut', 'AES Out', 'out', 'audioDigital', 'xlr3', channels=2),
       P('wcIn', 'Word Clock In', 'in', 'sync', 'bnc'), P('wcOut', 'Word Clock Out', 'out', 'sync', 'bnc'),
       P('midiIn', 'MIDI In', 'in', 'control', 'din5'), P('midiOut', 'MIDI Out', 'out', 'control', 'din5'),
       P('gpi', 'GPI', 'bidir', 'control', U), P('ecx', 'ECx Ethernet', 'bidir', 'network', 'rj45', format='Télécommande'),
       P('vga', 'VGA', 'out', 'video', 'vga'), P('dvi', 'DVI', 'out', 'video', 'dvi'), P('usb', 'USB', 'bidir', 'control', 'usb-a'),
       ac('100-240 V, 200 W')], powerW=200)
sheet('avid-venue-profile', 'console', AV, 'VENUE Profile', 'console',
      R(('https://cuesale.com/product/digidesign-venue-profile-set/', 'Cuesale, système VENUE Profile (occasion)'),
        ('https://www.pssl.com/products/digidesign-stage-rack-48-16-digital-avid-profile', 'PSSL, Stage Rack VENUE (revendeur)')),
      [P('snakeA', 'Snake A', 'bidir', 'audioDigital', 'bnc', format='Multipaire numérique 75 Ω vers Stage Rack (via FOH Rack)'),
       P('snakeB', 'Snake B (redondant)', 'bidir', 'audioDigital', 'bnc', format='Liaison redondante'),
       P('wc', 'Word Clock', 'bidir', 'sync', 'bnc'), P('midiIn', 'MIDI In', 'in', 'control', 'din5'), P('midiOut', 'MIDI Out', 'out', 'control', 'din5'),
       P('stage', 'Stage Rack', 'bidir', 'audioAnalog', U, channels=48, format='48 entrées micro / ligne XLR, 8 à 48 sorties selon cartes'),
       ac()], status='community')

SC = 'Soundcraft'
sheet('soundcraft-epm6', 'console', SC, 'EPM6', 'console', R(('https://www.musik-produktiv.com/dk/soundcraft-epm6.html', 'Musik Produktiv, fiche EPM6 (revendeur)')),
      [*mics(6, fmt='XLR micro (ligne sur jack)'), P('st1', 'Stereo In 1', 'in', 'audioAnalog', 'jack-trs', level='line+4', channels=2),
       P('st2', 'Stereo In 2', 'in', 'audioAnalog', 'jack-trs', level='line+4', channels=2),
       P('mainL', 'Mix Out L', 'out', 'audioAnalog', 'xlr3', level='line+4'), P('mainR', 'Mix Out R', 'out', 'audioAnalog', 'xlr3', level='line+4'),
       *outs('aux', 'Aux', 2, 'jack-trs'), P('phones', 'Phones', 'out', 'audioAnalog', 'jack-trs', channels=2), ac()], status='community', weightKg=5.0)
sheet('soundcraft-efx8', 'console', SC, 'EFX8', 'console', R(('https://www.hhb.co.uk/prod/soundcraft/efx8/', 'HHB, fiche EFX8 (distributeur)'), ('https://thomannmusic.com/soundcraft_efx8_mkii.htm', 'Thomann, fiche EFX8 (revendeur)')),
      [*mics(8, fmt='XLR micro, préampli GB30'), P('st1', 'Stereo In 1', 'in', 'audioAnalog', 'jack-trs', level='line+4', channels=2),
       P('st2', 'Stereo In 2', 'in', 'audioAnalog', 'jack-trs', level='line+4', channels=2),
       P('2trIn', '2-Track In', 'in', 'audioAnalog', 'rca', level='line-10', channels=2), P('rec', 'Rec Out', 'out', 'audioAnalog', 'rca', level='line-10', channels=2),
       P('mainL', 'Mix Out L', 'out', 'audioAnalog', 'xlr3', level='line+4'), P('mainR', 'Mix Out R', 'out', 'audioAnalog', 'xlr3', level='line+4'),
       P('aux', 'Aux', 'out', 'audioAnalog', 'jack-trs', level='line+4'), P('phones', 'Phones', 'out', 'audioAnalog', 'jack-trs', channels=2), ac()],
      status='community', weightKg=4.6)

BOS = 'Bosch'
sheet('bosch-dcnm-wap', 'wireless', BOS, 'DICENTIS DCNM-WAP', 'wireless',
      R(('https://www.proacousticsusa.com/bosch-dicentis-dcnm-wap-wireless-access-point.html', 'Pro Acoustics, fiche DCNM-WAP (revendeur)'), ('https://automa.net/bosch/dcnm-wap', 'Automa, fiche DCNM-WAP')),
      [P('eth', 'Ethernet', 'bidir', 'network', 'rj45', format='1000BASE-T, PoE 802.3af / at'),
       P('lineIn', 'Line In', 'in', 'audioAnalog', 'jack-trs', level='line+4'), P('lineOut', 'Line Out', 'out', 'audioAnalog', 'jack-trs', level='line+4'),
       P('rf', 'Wi-Fi', 'bidir', 'rf', 'rf', format='802.11n 2,4 / 5 GHz, jusqu\'à 120 postes'),
       P('dc', 'Alimentation', 'in', 'power', 'dc-barrel', format='Bloc 48 V, PoE ou câble système DCN')], status='community')
sheet('bosch-dcnm-wde', 'capture', BOS, 'DICENTIS DCNM-WDE', 'mic',
      R(('https://automa.net/bosch/dcnm-wde/', 'Automa, fiche DCNM-WDE'), ('https://store.digital-origin.co.uk/bosch-dcnm-wde-teleconferencing-equipment-1-person-s-f-01u-298-744.html', 'Digital Origin, fiche DCNM-WDE (revendeur)')),
      [P('mic', 'Micro', 'in', 'audioAnalog', U, level='mic', format='Embase pour micro enfichable DCNM-HDMIC / MICS / MICL'),
       P('rf', 'Wi-Fi', 'bidir', 'rf', 'rf', format='Vers point d\'accès DCNM-WAP'),
       P('phones', 'Casque', 'out', 'audioAnalog', 'minijack', channels=2), P('dc', 'Batterie', 'in', 'power', U, format='Batterie 7,5 V')],
      status='community', weightKg=0.67)

QS = 'QSC'
sheet('qsc-plx1802', 'amplification', QS, 'PLX1802', 'amp', R(('https://www.zzounds.com/item--QSCPLX1802', 'zZounds, fiche PLX1802 (revendeur)'), ('https://www.greentoe.com/product/QSC_PLX1802', 'Greentoe, fiche PLX1802 (revendeur)')),
      [P('inA', 'Input A', 'in', 'audioAnalog', 'xlr3', level='line+4', format='XLR et jack TRS en parallèle (recopie)'),
       P('inB', 'Input B', 'in', 'audioAnalog', 'xlr3', level='line+4', format='XLR et jack TRS en parallèle (recopie)'),
       P('outA', 'Output A', 'out', 'audioAnalog', 'speakon-nl4', level='speaker', format='NL4 (1+/1- canal A, 2+/2- canal B) et bornes'),
       P('outB', 'Output B', 'out', 'audioAnalog', 'speakon-nl4', level='speaker', format='NL4 et bornes ; 2 × 325 W / 8 Ω'),
       ac()], status='community', weightKg=9.5, rackU=2)
sheet('qsc-touchmix-16', 'console', QS, 'TouchMix-16', 'console', R(('https://www.gearank.com/gear/qsc-touchmix-16-digital-audio-mixer/', 'Gearank, fiche TouchMix-16'), ('https://thomannmusic.no/qsc_touchmix_16.htm', 'Thomann, fiche TouchMix-16 (revendeur)')),
      [*mics(4, 'combo', 'Combo XLR / jack'), *mics(12, 'xlr3', 'XLR micro / ligne', start=5),
       P('st1', 'Stereo In 17/18', 'in', 'audioAnalog', 'jack-trs', level='line+4', channels=2), P('st2', 'Stereo In 19/20', 'in', 'audioAnalog', 'jack-trs', level='line+4', channels=2),
       P('tb', 'Talkback', 'in', 'audioAnalog', 'xlr3', level='mic'),
       P('mainL', 'Main L', 'out', 'audioAnalog', 'xlr3', level='line+4'), P('mainR', 'Main R', 'out', 'audioAnalog', 'xlr3', level='line+4'),
       *outs('aux', 'Aux', 6), P('auxSt1', 'Stereo Aux 7/8', 'out', 'audioAnalog', 'jack-trs', level='line+4', channels=2, format='Ligne ou ear monitor'),
       P('auxSt2', 'Stereo Aux 9/10', 'out', 'audioAnalog', 'jack-trs', level='line+4', channels=2, format='Ligne ou ear monitor'),
       P('mon', 'Monitor Out', 'out', 'audioAnalog', 'jack-trs', channels=2), P('cue', 'Cue Out', 'out', 'audioAnalog', 'jack-trs', channels=2),
       P('usb', 'USB', 'bidir', 'audioDigital', 'usb-a', format='Enregistrement multipiste sur disque ; adaptateur Wi-Fi'), ac()],
      status='community', weightKg=2.7)

RM = 'RME'
sheet('rme-madi-router', 'processing', RM, 'MADI Router', 'router', R(('https://www.archiv.rme-audio.de/en/products/madi_router.php', 'RME, page MADI Router (archive)')),
      [*[P(f'opt{g}', f'Optical {g}', 'bidir', 'audioDigital', 'sc', channels=64, format='MADI optique SC duplex multimode') for g in 'ABCD'],
       *[P(f'coax{g}', f'Coax {g}', 'bidir', 'audioDigital', 'bnc', channels=64, format='MADI coaxial 75 Ω (AES10)') for g in 'ABCD'],
       *[P(f'tp{g}', f'Twisted Pair {g}', 'bidir', 'audioDigital', 'rj45', channels=64, format='MADI sur paire torsadée, alimente les convertisseurs RME') for g in 'ABCD'],
       P('wc', 'Word Clock', 'bidir', 'sync', 'bnc'), P('usb', 'USB', 'bidir', 'control', U, format='Mise à jour, préréglages'),
       ac('Alimentation redondante'), P('ac2', 'Secteur 2', 'in', 'power', U)], rackU=1)
sheet('rme-madiface-xt', 'processing', RM, 'MADIface XT', 'processor', R(('https://rme-audio.de/madiface-xt.html', 'RME, page MADIface XT')),
      [*mics(2, 'combo', 'Combo XLR / jack, préampli numérique, fantôme par voie'),
       *outs('out', 'Line Out', 2, fmt='XLR symétrique'), P('phones', 'Phones', 'out', 'audioAnalog', 'jack-trs', channels=2),
       P('madiCoax', 'MADI Coax', 'bidir', 'audioDigital', 'bnc', channels=64),
       P('madiOpt1', 'MADI Optical 1', 'bidir', 'audioDigital', 'sc', channels=64), P('madiOpt2', 'MADI Optical 2', 'bidir', 'audioDigital', 'sc', channels=64),
       P('usb', 'USB 3.0', 'bidir', 'audioDigital', U, channels=196, format='USB 3 (USB 2 : 70 canaux)'),
       P('pcie', 'PCI Express', 'bidir', 'audioDigital', U, format='Câble E-PCIe (Molex) ou adaptateur Thunderbolt'),
       P('wc', 'Word Clock', 'bidir', 'sync', 'bnc'), P('breakout', 'AES / MIDI', 'bidir', 'audioDigital', U, format='D-Sub vers AES/EBU XLR et MIDI DIN 5'),
       P('remote', 'Remote', 'bidir', 'control', 'minidin8'), P('dc', 'Alimentation', 'in', 'power', U)])

TA = 'Tascam'
sheet('tascam-cd-200', 'recording', TA, 'CD-200', 'recorder', R(('https://ldlc.com/en/product/PB00519231.html', 'LDLC, fiche CD-200 (revendeur)')),
      [P('out', 'Line Out', 'out', 'audioAnalog', 'rca', level='line-10', channels=2),
       P('coax', 'Digital Out (coax)', 'out', 'audioDigital', 'rca', channels=2, format='S/PDIF'),
       P('opt', 'Digital Out (optique)', 'out', 'audioDigital', 'toslink', channels=2, format='S/PDIF'),
       P('phones', 'Phones', 'out', 'audioAnalog', 'jack-trs', channels=2), ac()], status='community', rackU=2)
sheet('tascam-ss-cdr200', 'recording', TA, 'SS-CDR200', 'recorder', R(('https://www.adorama.com/tssscdr200.html', 'Adorama, fiche SS-CDR200 (revendeur)'), ('https://zzounds.com/item--TASSSCDR200', 'zZounds, fiche SS-CDR200 (revendeur)')),
      [P('inL', 'Balanced In L', 'in', 'audioAnalog', 'xlr3', level='line+4'), P('inR', 'Balanced In R', 'in', 'audioAnalog', 'xlr3', level='line+4'),
       P('outL', 'Balanced Out L', 'out', 'audioAnalog', 'xlr3', level='line+4'), P('outR', 'Balanced Out R', 'out', 'audioAnalog', 'xlr3', level='line+4'),
       P('rcaIn', 'Unbalanced In', 'in', 'audioAnalog', 'rca', level='line-10', channels=2), P('rcaOut', 'Unbalanced Out', 'out', 'audioAnalog', 'rca', level='line-10', channels=2),
       P('digIn', 'Digital In', 'in', 'audioDigital', 'rca', channels=2, format='S/PDIF ou AES/EBU (détection auto)'),
       P('digOut', 'Digital Out', 'out', 'audioDigital', 'rca', channels=2, format='S/PDIF ou AES/EBU'),
       P('usb', 'USB', 'bidir', 'control', 'usb-a'), P('phones', 'Phones', 'out', 'audioAnalog', 'jack-trs', channels=2), ac()], status='community', rackU=2)
sheet('tascam-dr-40', 'recording', TA, 'DR-40', 'recorder', R(('https://kitsplit.com/rent-product/tascam-dr-40/all', 'KitSplit, fiche DR-40 (loueur)')),
      [*mics(2, 'combo', 'Combo XLR / jack verrouillable, fantôme'), P('mic', 'Micros intégrés', 'in', 'audioAnalog', U, level='mic', channels=2, format='Paire stéréo intégrée'),
       P('phones', 'Phones / Line Out', 'out', 'audioAnalog', 'minijack', channels=2), P('usb', 'USB', 'bidir', 'control', 'usb-mini')], status='community')
