# Midas : le site et la documentation Midas ne répondent pas depuis cet environnement (erreurs 502 / 404) ;
# fiches établies d'après les descriptions concordantes de revendeurs (statut Communauté).
from common import P, src, sheet
M = 'Midas'
U = 'unspecified'
def R(*pairs): return [src(u, d) for u, d in pairs]
def ins(n, conn='xlr3', fmt='Préampli Midas, fantôme 48 V commutable', prefix='in', label='Input'):
    return [P(f'{prefix}{i}', f'{label} {i}', 'in', 'audioAnalog', conn, level='mic', phantom='supplied', format=fmt) for i in range(1, n + 1)]
def outs(n, conn='xlr3', fmt='Sortie ligne symétrique', prefix='out', label='Output'):
    return [P(f'{prefix}{i}', f'{label} {i}', 'out', 'audioAnalog', conn, level='line+4', format=fmt) for i in range(1, n + 1)]
def aes50(n, labels='ABCDEFGH'):
    return [P(f'aes50{labels[i]}', f'AES50 {labels[i]}', 'bidir', 'audioDigital', 'ethercon', channels=48, format='AES50 (SuperMAC)') for i in range(n)]
AC = P('ac', 'Secteur', 'in', 'power', U)
AC2 = [P('ac1', 'Secteur 1', 'in', 'power', U, format='Alimentation redondante'), P('ac2', 'Secteur 2', 'in', 'power', U, format='Alimentation redondante')]

# Consoles numériques série M32
sheet('midas-m32-live', 'console', M, 'M32 LIVE', 'console', R(('https://thomann.ae/midas_m_32_live.htm', 'Thomann, fiche M32 LIVE (revendeur)')),
      ins(32) + [P(f'auxin{i}', f'Aux In {i}', 'in', 'audioAnalog', 'jack-trs', level='line+4') for i in range(1, 7)] + outs(16)
      + [P(f'auxout{i}', f'Aux Out {i}', 'out', 'audioAnalog', 'jack-trs', level='line+4') for i in range(1, 7)]
      + [P('monL', 'Monitor L', 'out', 'audioAnalog', U, level='line+4', format='Sortie écoute (TRS et XLR selon le revendeur)'),
         P('monR', 'Monitor R', 'out', 'audioAnalog', U, level='line+4', format='Sortie écoute'),
         *aes50(2), P('ultranet', 'ULTRANET', 'out', 'audioDigital', 'rj45', channels=16, format='Vers système P16'),
         P('slot', 'Carte d\'extension', 'bidir', 'audioDigital', 'usb-b', channels=32, format='USB 32 x 32 installée (ADAT, MADI, Dante en option)'),
         P('eth', 'Ethernet', 'bidir', 'network', 'rj45', format='Commande à distance'), AC], status='community')
sheet('midas-m32r-live', 'console', M, 'M32R LIVE', 'console', R(('https://www.thomannmusic.com/midas_m32r_live.htm', 'Thomann, fiche M32R LIVE (revendeur)'),
      ('https://www.huss-licht-ton.de/product_info.php/en/Midas-M32R-LIVE-Digital-Mixer/info/32584.html', 'Huss Licht & Ton, fiche M32R LIVE (revendeur)')),
      ins(16) + [P(f'auxin{i}', f'Aux In {i}', 'in', 'audioAnalog', 'jack-trs', level='line+4') for i in range(1, 7)] + outs(8)
      + [P(f'auxout{i}', f'Aux Out {i}', 'out', 'audioAnalog', 'jack-trs', level='line+4') for i in range(1, 7)]
      + [P('monL', 'Monitor L', 'out', 'audioAnalog', 'jack-trs', level='line+4'), P('monR', 'Monitor R', 'out', 'audioAnalog', 'jack-trs', level='line+4'),
         *aes50(2), P('ultranet', 'ULTRANET', 'out', 'audioDigital', 'rj45', channels=16, format='Vers système P16'),
         P('slot', 'Carte d\'extension', 'bidir', 'audioDigital', 'usb-b', channels=32, format='USB 32 x 32 installée'),
         P('midiIn', 'MIDI In', 'in', 'control', 'din5'), P('midiOut', 'MIDI Out', 'out', 'control', 'din5'),
         P('eth', 'Ethernet', 'bidir', 'network', 'rj45'), P('ac', 'Secteur', 'in', 'power', U, format='100-240 V, 70 W')],
      status='community', weightKg=14.3)

# Consoles PRO et Heritage-D
sheet('midas-pro1', 'console', M, 'PRO1', 'console', R(('https://www.proacousticsusa.com/midas-pro1-digital-mixing-console.html', 'Pro Acoustics, fiche PRO1 (revendeur)'),
      ('https://ravepubs.com/?p=19199', 'rAVe, annonce PRO1')),
      ins(24) + outs(24, fmt='Dont 2 sorties écoute stéréo') + [P('tb', 'Talkback', 'in', 'audioAnalog', 'xlr3', level='mic'),
      *aes50(6), P('aes3in', 'AES3 In', 'in', 'audioDigital', 'xlr3', channels=2), P('aes3out', 'AES3 Out', 'out', 'audioDigital', 'xlr3', channels=2, format='3 sorties AES3'),
      P('wcin', 'Word Clock In', 'in', 'sync', 'bnc'), P('wcout', 'Word Clock Out', 'out', 'sync', 'bnc'), P('video', 'Video Sync In', 'in', 'sync', 'bnc'),
      P('phones', 'Casque', 'out', 'audioAnalog', 'jack-trs', channels=2), P('midiIn', 'MIDI In', 'in', 'control', 'din5'), P('midiOut', 'MIDI Out', 'out', 'control', 'din5'),
      P('dvi', 'Moniteur externe', 'out', 'video', 'dvi', format='DVI / DP'), AC], status='community')
sheet('midas-pro2c', 'console', M, 'PRO2C', 'console', R(('https://audiomediainternational.com/midas-pro2c/', 'Audio Media International, test PRO2C'),
      ('https://www.bhphotovideo.com/c/product/1032031-REG/midas_pro2c_cc_tp_digital_live_sound.html', 'B&H, fiche PRO2C (revendeur)')),
      ins(8) + outs(8) + [P(f'mon{i}', f'Master / Talkback / Monitor {i}', 'out', 'audioAnalog', 'xlr3', level='line+4') for i in range(1, 9)]
      + [*aes50(6), P('aes3in', 'AES3 In', 'in', 'audioDigital', U, channels=2, format='2 entrées AES3'), P('aes3out', 'AES3 Out', 'out', 'audioDigital', U, channels=2, format='3 sorties AES3'),
         P('wc', 'Word Clock', 'bidir', 'sync', U), P('midi', 'MIDI', 'bidir', 'control', U), AC],
      status='community')
sheet('midas-pro6', 'console', M, 'PRO6', 'console', R(('https://www.avlfx.com/category/product/1845-midas-pro-series-pro-6-cc-ip-live-digital-console-control-centre-with-64-input-channels-35-mix-buses-and-96-khz-sample-rate/category_pathway-52', 'AVL FX, fiche PRO6-CC-IP (revendeur)')), [
    P('snakeA', 'Snake A (vers DL371)', 'bidir', 'audioDigital', U, format='Liaison redondante HyperMAC vers le moteur DL371 ; cuivre 100 m ou fibre 500 m'),
    P('snakeB', 'Snake B (vers DL371)', 'bidir', 'audioDigital', U, format='Liaison redondante'),
    AC], status='community')
sheet('midas-hd96-24', 'console', M, 'Heritage-D HD96-24', 'console', R(('https://www.fullcompass.com/prod/602302-midas-hd96-24-cc-ip-ul-live-digital-console-144-input-ch-21-touch-screen', 'Full Compass, fiche HD96-24 (revendeur)')), [
    P('aes50', 'AES50', 'bidir', 'audioDigital', 'ethercon', format='Liaison vers stageboxes DL ; nombre de ports non précisé'),
    P('madi', 'MADI', 'bidir', 'audioDigital', U, format='Nombre et type de ports non précisés'),
    P('dante', 'Dante', 'bidir', 'audioIp', U, format='Nombre de ports non précisé'),
    P('wc', 'Word Clock', 'bidir', 'sync', U),
    P('hdmi', 'HDMI', 'out', 'video', 'hdmi', format='Écran externe'),
    *AC2], status='community')

# Consoles analogiques
def analog(id, model, desc, n_in, n_out, sources, extra=()):
    sheet(id, 'console', M, model, 'console', sources,
          ins(n_in, U, fmt='Connecteur non précisé') + outs(n_out, U, fmt='Groupes / sorties ; connecteur non précisé', label='Output')
          + list(extra) + [P('psu', 'Alimentation', 'in', 'power', U, format='Alimentation externe dédiée')], status='community')
analog('midas-heritage-3000', 'Heritage 3000', '', 56, 24, R(('https://www.pssl.com/products/midas-heritage-3000-56-channel-live-mixing-analog-console-with-power-supply', 'PSSL, Heritage 3000 56 voies (revendeur)')),
       [P(f'mtx{i}', f'Matrix {i}', 'out', 'audioAnalog', U, level='line+4') for i in range(1, 9)]
       + [P(c, f'Master {c.upper()}', 'out', 'audioAnalog', U, level='line+4') for c in ('l', 'c', 'r')])
analog('midas-heritage-1000', 'Heritage 1000', '', 32, 10, R(('https://www.evansstaging.co.uk/midas-h1000-32ch-psu-5000vat/', 'Evans Staging, H1000 32 voies (revendeur)')),
       [P(f'aux{i}', f'Aux {i}', 'out', 'audioAnalog', U, level='line+4') for i in range(1, 11)]
       + [P(f'mtx{i}', f'Matrix {i}', 'out', 'audioAnalog', U, level='line+4') for i in range(1, 9)]
       + [P('stL', 'Master L', 'out', 'audioAnalog', U, level='line+4'), P('stR', 'Master R', 'out', 'audioAnalog', U, level='line+4'), P('mono', 'Master Mono', 'out', 'audioAnalog', U, level='line+4')])
analog('midas-xl3', 'XL3', '', 40, 16, R(('https://www.10kused.com/?p=680', '10kUsed, fiche XL3 (occasion)'), ('https://en.audiofanzine.com/midas/XL3/', 'Audiofanzine, XL3')),
       [P(f'aux{i}', f'Aux {i}', 'out', 'audioAnalog', U, level='line+4') for i in range(1, 11)])
NOV = [src(None, 'Catalogue Novelty 2025 (désignation et nombre de voies)')]
analog('midas-dm12', 'DM12', '', 12, 2, NOV)
for model, n, st in (('Venice 160', 8, 4), ('Venice 240', 16, 4), ('Venice 320', 24, 4)):
    sheet('midas-' + model.lower().replace(' ', '-'), 'console', M, model, 'console', NOV,
          ins(n, U, fmt='Entrée micro/ligne ; connecteur non précisé')
          + [P(f'st{i}', f'Stereo In {i}', 'in', 'audioAnalog', U, level='line+4', channels=2) for i in range(1, st + 1)]
          + [P('stL', 'Master L', 'out', 'audioAnalog', U, level='line+4'), P('stR', 'Master R', 'out', 'audioAnalog', U, level='line+4'),
             P('psu', 'Alimentation', 'in', 'power', U)], status='community')

# Stageboxes DL
sheet('midas-dl32', 'stagebox', M, 'DL32', 'stagebox', R(('https://www.thomannmusic.com/midas_dl32.htm', 'Thomann, fiche DL32 (revendeur)')),
      ins(32) + outs(16) + [*aes50(2), P('adat1', 'ADAT Out 1', 'out', 'audioDigital', 'toslink', channels=8, format='Voies 17-24'),
      P('adat2', 'ADAT Out 2', 'out', 'audioDigital', 'toslink', channels=8, format='Voies 25-32'),
      P('aes1', 'AES/EBU Out 13-14', 'out', 'audioDigital', U, channels=2), P('aes2', 'AES/EBU Out 15-16', 'out', 'audioDigital', U, channels=2),
      P('ultranet', 'ULTRANET', 'out', 'audioDigital', 'rj45', channels=16), P('midiIn', 'MIDI In', 'in', 'control', 'din5'), P('midiOut', 'MIDI Out', 'out', 'control', 'din5'),
      P('usb', 'USB', 'bidir', 'control', U, format='Mise à jour'), AC], status='community', rackU=3, weightKg=4.9)
sheet('midas-dl251', 'stagebox', M, 'DL251', 'stagebox', R(('https://www.proaudiodesign.com/products/midas-dl251-midas-fixed-format-i-o-unit', 'Pro Audio Design, fiche DL251 (revendeur)')),
      ins(48) + outs(16) + aes50(3) + [P('midiIn', 'MIDI In', 'in', 'control', 'din5'), P('midiOut', 'MIDI Out', 'out', 'control', 'din5'), P('midiThru', 'MIDI Thru', 'out', 'control', 'din5'),
      P('eth', 'Ethernet (commande)', 'bidir', 'network', U)] + AC2, status='community', rackU=5)
sheet('midas-dl153', 'stagebox', M, 'DL153', 'stagebox', R(('https://www.soundseasy.com.au/products/midas-dl153-16-input-8-output-stage-box-with-16-midas-microphone-preamplifiers', 'Sounds Easy, fiche DL153 (revendeur)')),
      ins(16) + outs(8) + aes50(2) + [AC], status='community', rackU=2)
sheet('midas-dl155', 'stagebox', M, 'DL155', 'stagebox', R(('https://www.fullcompass.com/common/files/20011-DL155UserGuide.pdf', 'Midas, guide DL155 (hébergé par Full Compass)')),
      ins(8) + outs(8) + [P(f'aesin{i}', f'AES3 In {i}', 'in', 'audioDigital', 'xlr3', channels=2) for i in range(1, 5)]
      + [P(f'aesout{i}', f'AES3 Out {i}', 'out', 'audioDigital', 'xlr3', channels=2, format='Conversion de fréquence') for i in range(1, 5)] + aes50(2) + [AC],
      status='community', rackU=2)
sheet('midas-dl231', 'stagebox', M, 'DL231', 'stagebox', R(('https://www.bhphotovideo.com/c/product/1105518-REG/midas_dl231_active_microphone_splitter.html', 'B&H, fiche DL231 (revendeur)')),
      ins(24, fmt='Deux préamplis Midas par entrée, fantôme commutable') + outs(24, U, fmt='Sortie symétrique (préamplis ou AES50) ; connecteur non précisé')
      + aes50(4) + [P('midiIn', 'MIDI In', 'in', 'control', 'din5'), P('midiOut', 'MIDI Out', 'out', 'control', 'din5'), P('midiThru', 'MIDI Thru', 'out', 'control', 'din5'),
      P('eth', 'Ethernet (commande)', 'bidir', 'network', U)] + AC2, status='community', rackU=5)
sheet('midas-dl351', 'stagebox', M, 'DL351', 'stagebox', R(('https://www.fullcompass.com/common/files/38476-DL351datasheet.pdf', 'Midas, fiche technique DL351 (hébergée par Full Compass)')),
      [P(f'slot{i}', f'Carte DL4 {i}', 'bidir', 'audioAnalog', U, channels=8, format='8 cartes au choix : entrées micro/ligne, sorties ligne, AES3 ; jusqu\'à 64 x 64') for i in range(1, 9)]
      + aes50(4) + [P('gpio', 'GPIO', 'bidir', 'control', U), P('midi', 'MIDI In/Out/Thru', 'bidir', 'control', 'din5'), P('eth', 'Ethernet (commande)', 'bidir', 'network', U)] + AC2,
      status='community', rackU=7, weightKg=16.9)
