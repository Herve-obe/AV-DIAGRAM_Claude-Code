# Matériel DJ : platines Technics, Rane TTM57SL / SL4, Denon DN-C620, Numark MP103USB, Allen & Heath Xone:22 / Xone:DB4.
# Modèles arrêtés pour la plupart : sources revendeurs, wiki ou guides tiers, statut community.
from common import P, src, sheet
U = 'unspecified'
def R(*pairs): return [src(u, d) for u, d in pairs]
def rca(id, name, d='in', level='line-10', fmt=None, ch=2): return P(id, name, d, 'audioAnalog', 'rca', level=level, channels=ch, format=fmt)
def ac(fmt=None): return P('ac', 'Secteur', 'in', 'power', U, format=fmt)

def turntable(id, model, srcs, w, fmt):
    sheet(id, 'recording', 'Technics', model, 'recorder', srcs,
          [rca('out', 'Phono Out L/R', 'out', level='phono', fmt=fmt), ac()], status='community', weightKg=w)
mk7 = R(('https://www.soundhouse.co.jp/en/products/detail/item/300120/', 'Sound House, fiche SL-1200MK7 (revendeur)'),
        ('https://www.sonovente.com/en-gb/technics-technics-sl-1210-mk7-p67682.html', 'Sonovente, fiche SL-1210 MK7 (revendeur)'))
turntable('technics-sl-1210mk7', 'SL-1210MK7', mk7, 9.6, 'RCA plaqué or (câble amovible) + borne de masse')
turntable('technics-sl-1210mk2', 'SL-1210MK2', R(('https://hifi-wiki.com/index.php/Technics_SL-1210_MK_2', 'Hi-Fi Wiki, SL-1210MK2')), 12.5,
          'Câble RCA solidaire + fil de masse')
turntable('technics-sl-1200mk2', 'SL-1200MK2', R(('https://hifi-wiki.com/index.php/Technics_SL-1200MK2', 'Hi-Fi Wiki, SL-1200MK2')), 12.5,
          'Câble RCA solidaire ; fil de masse à vérifier sur l\'unité')

sheet('rane-ttm57sl', 'console', 'Rane', 'TTM 57SL', 'console',
      R(('https://www.bonedo.de/artikel/rane-ttm57sl/3', 'Bonedo, test TTM57SL'), ('https://manuals.plus/ps/asin/B000I2OIDA', 'Manuals+, fiche TTM57SL (tiers)')),
      [*[rca(f'in{i}', f'Input {i}', fmt='RCA, phono ou ligne commutable') for i in range(1, 5)],
       rca('aux', 'Aux In'), P('mic', 'Mic', 'in', 'audioAnalog', 'jack-trs', level='mic', format='Jack 6,35 TRS symétrique'),
       P('fxSend', 'FX Send', 'out', 'audioAnalog', 'jack-ts', channels=2), P('fxRet', 'FX Return', 'in', 'audioAnalog', 'jack-ts', channels=2),
       P('masterL', 'Master Out L', 'out', 'audioAnalog', 'xlr3', level='line+4'), P('masterR', 'Master Out R', 'out', 'audioAnalog', 'xlr3', level='line+4'),
       P('booth', 'Booth Out', 'out', 'audioAnalog', 'jack-trs', level='line+4', channels=2, format='Jack 6,35 TRS symétrique'),
       rca('outRca', 'Output RCA', 'out'),
       P('phones', 'Phones', 'out', 'audioAnalog', 'jack-trs', channels=2, format='Jack 6,35 et mini-jack 3,5'),
       P('usb', 'USB', 'bidir', 'audioDigital', 'usb-b', channels=8, format='USB 1.1, 8 canaux 16 bits 44,1 kHz (Serato Scratch Live)'),
       P('fs', 'Footswitch', 'in', 'control', 'jack-trs'), ac('Alimentation interne 100-240 V')], status='community')

sheet('rane-sl4', 'processing', 'Rane', 'SL 4', 'processor',
      R(('https://www.fullcompass.com/prod/184339-rane-sl-4-sl4', 'Full Compass, fiche SL 4 (revendeur)'),
        ('https://www.markertek.com/product/rne-sl4/rane-sl4-4-deck-interface-for-serato-scratch-live', 'Markertek, fiche SL 4 (revendeur)')),
      [*[rca(f'in{i}', f'Input {i}', fmt='Phono / ligne commutable') for i in range(1, 5)],
       *[rca(f'thru{i}', f'Thru {i}', 'out', fmt='Recopie analogique commutée par logiciel') for i in range(1, 5)],
       rca('auxIn', 'Aux In'), rca('auxOut', 'Aux Out', 'out'),
       P('usb1', 'USB 1', 'bidir', 'audioDigital', 'usb-b', channels=10, format='USB 2.0, 10 entrées / 10 sorties, 24 bits'),
       P('usb2', 'USB 2', 'bidir', 'audioDigital', 'usb-b', channels=10, format='Second ordinateur (enchaînement de DJ)'),
       P('dc', 'Alimentation', 'in', 'power', 'dc-barrel', format='Bloc externe 7,5 V (ou alimentation USB)')], status='community')

sheet('denon-dn-c620', 'recording', 'Denon Professional', 'DN-C620', 'recorder',
      R(('https://www.denonpro.com/products/dn-c620', 'Denon Professional, page DN-C620 (produit arrêté)'),
        ('https://www.prosoundweb.com/denon-professional-now-shipping-new-dn-c620-1u-cd-player/', 'ProSoundWeb, annonce DN-C620')),
      [P('outL', 'Balanced Out L', 'out', 'audioAnalog', 'xlr3', level='line+4', format='Niveau ajustable'),
       P('outR', 'Balanced Out R', 'out', 'audioAnalog', 'xlr3', level='line+4', format='Niveau ajustable'),
       rca('outFix', 'Unbalanced Out (fixe)', 'out'), rca('outVar', 'Unbalanced Out (variable)', 'out'),
       P('aes', 'Digital Out AES/EBU', 'out', 'audioDigital', 'xlr3', channels=2, format='AES/EBU'),
       P('spdif', 'Digital Out S/PDIF', 'out', 'audioDigital', 'rca', channels=2, format='S/PDIF coaxial'),
       P('rs232', 'RS-232C', 'bidir', 'control', 'dsub9'), P('gpio', 'GPIO', 'bidir', 'control', 'dsub25'),
       P('phones', 'Phones', 'out', 'audioAnalog', 'jack-trs', channels=2), ac()], status='community', rackU=1)

sheet('numark-mp103usb', 'recording', 'Numark', 'MP103USB', 'recorder',
      R(('https://im.static-thomann.de/pics/atg/atgdata/document/specs/267417_datenblatt.pdf', 'Thomann, fiche technique MP103USB (revendeur)'),
        ('https://www.gak.co.uk/en/numark-mp103usb/52723', 'GAK, fiche MP103USB (revendeur)')),
      [P('outL', 'Out L (XLR)', 'out', 'audioAnalog', 'xlr3', level='line+4', format='Symétrique'),
       P('outR', 'Out R (XLR)', 'out', 'audioAnalog', 'xlr3', level='line+4', format='Symétrique'),
       rca('outRca', 'Out (RCA)', 'out', fmt='1,9 V'), P('usb', 'USB', 'in', 'control', 'usb-a', format='Clé ou disque USB'),
       ac('115-230 V, 20 W')], status='community', powerW=20, weightKg=4.6, rackU=2)

sheet('allenheath-xone-22', 'console', 'Allen & Heath', 'Xone:22', 'console',
      R(('https://www.wwbw.com/Allen-Heath-Xone22-485158.wwbw', 'WWBW, fiche Xone:22 (revendeur)'), ('https://manualsnet.com/allen-heath/xone-22', 'Allen & Heath, guide utilisateur Xone:22 (archive)')),
      [rca('phono1', 'Phono 1', level='phono', fmt='Configurable en ligne'), rca('phono2', 'Phono 2', level='phono', fmt='Configurable en ligne'),
       rca('line1', 'Line 1'), rca('line2', 'Line 2'),
       P('mic', 'Mic', 'in', 'audioAnalog', 'xlr3', level='mic', format='XLR, face avant'),
       rca('fxRet', 'FX Return'), P('fxSend', 'FX Send', 'out', 'audioAnalog', U, channels=2, format='Connecteur non précisé'),
       P('mainL', 'Main Out L', 'out', 'audioAnalog', 'xlr3', level='line+4'), P('mainR', 'Main Out R', 'out', 'audioAnalog', 'xlr3', level='line+4'),
       rca('booth', 'Booth Out', 'out'), P('rec', 'Record Out', 'out', 'audioAnalog', U, channels=2, format='Connecteur non précisé'),
       P('phones', 'Phones', 'out', 'audioAnalog', 'jack-trs', channels=2), ac()], status='community')

sheet('allenheath-xone-db4', 'console', 'Allen & Heath', 'Xone:DB4', 'console',
      R(('https://r2.gear4music.com/media/29/292503/download_292503.pdf', 'Allen & Heath, fonctions des commandes Xone:DB4 (via Gear4music)'),
        ('https://en.audiofanzine.com/4-channel/allen-heath/xone-db4/', 'Audiofanzine, fiche Xone:DB4')),
      [*[rca(f'in{i}', f'Analogue In {i}', fmt='RCA ; phono / ligne commutable selon voie') for i in range(1, 5)],
       *[P(f'digIn{i}', f'Digital In {i}', 'in', 'audioDigital', 'rca', channels=2, format='S/PDIF') for i in range(1, 5)],
       P('mic', 'Mic / Line', 'in', 'audioAnalog', 'xlr3', level='mic'),
       P('mainL', 'Main Mix Out L', 'out', 'audioAnalog', 'xlr3', level='line+4'), P('mainR', 'Main Mix Out R', 'out', 'audioAnalog', 'xlr3', level='line+4'),
       P('booth', 'Booth Out', 'out', 'audioAnalog', 'jack-trs', level='line+4', channels=2, format='Jack 6,35 TRS symétrique'),
       rca('rec', 'Record Out', 'out'), P('recDig', 'Record Digital Out', 'out', 'audioDigital', 'rca', channels=2, format='S/PDIF'),
       P('phones', 'Phones', 'out', 'audioAnalog', 'jack-trs', channels=2, format='Jack 6,35 et mini-jack 3,5'),
       P('usb', 'USB', 'bidir', 'audioDigital', 'usb-b', format='USB 2.0, carte son 24 bits 96 kHz'),
       P('xlink', 'X:LINK', 'bidir', 'control', 'rj45', format='Contrôleurs Allen & Heath Xone:K'),
       ac()], status='community')
