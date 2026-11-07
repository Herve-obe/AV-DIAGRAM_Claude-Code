# Audio divers : dB Technologies K 162, Martin Audio LE1200, Dynaudio BM5A, Fischer Amps Shaker Amp 400, AMEK DMCL, Lafont LP-22,
# dbx 160A, Empirical Labs Distressor EL8-X, Focusrite OctoPre Platinum, Roland UA-1610, DiGiGrid MGB, Audix SCX1,
# Green-GO WPX, radios Motorola GP340 / DP1400 et Icom IC-F22.
from common import P, src, sheet, mic, spk
U = 'unspecified'
def R(*pairs): return [src(u, d) for u, d in pairs]
def ac(fmt=None): return P('ac', 'Secteur', 'in', 'power', U, format=fmt)
def xin(id, name, fmt=None, conn='xlr3'): return P(id, name, 'in', 'audioAnalog', conn, level='line+4', format=fmt)
def xout(id, name, fmt=None, conn='xlr3'): return P(id, name, 'out', 'audioAnalog', conn, level='line+4', format=fmt)

sheet('db-technologies-k-162', 'speaker', 'dB Technologies', 'K 162', 'speaker',
      R(('https://www.boullard.ch/en/product/sono-studio/speakers/active-speakers/115483-db-technologies-k-162/', 'Boullard, fiche K 162 (revendeur)'),
        ('https://www.adorama.com/db-technologies-k-162-2-x-6-5-inch-160w-active-speaker/p/dbtk162', 'Adorama, fiche K 162 (revendeur)')),
      [P('mic', 'Mic / Line', 'in', 'audioAnalog', 'combo', level='mic', format='XLR et jack, sélecteur micro / ligne'),
       P('aux', 'Aux In', 'in', 'audioAnalog', 'rca', level='line-10', channels=2),
       P('out', 'Link Out', 'out', 'audioAnalog', U, level='line+4', format='Sortie non confirmée (sources divergentes)'), ac('65 W RMS')],
      status='community', weightKg=5.5)
sheet('martin-audio-le1200', 'speaker', 'Martin Audio', 'LE1200', 'speaker',
      R(('https://www.pssl.com/products/martin-audio-le1200-2-way-reflex-stage-monitor', 'PSSL, fiche LE1200 (revendeur)'), ('https://www.manualsdir.com/manuals/117694/martin-audio-le1200.html', 'Martin Audio, mode d\'emploi LE1200 (archive)')),
      spk('spk', 2, 'Speakon', 'speakon-nl4', '12" + 1,4" ; actif (contrôleur DX1) ou passif'), status='community', weightKg=20.5)
sheet('dynaudio-bm5a', 'speaker', 'Dynaudio', 'BM5A', 'speaker', R(('https://zzounds.com/item--DYNBM5A', 'zZounds, fiche BM5A (revendeur)')),
      [xin('xlr', 'Input (XLR)', 'Symétrique'), P('rca', 'Input (RCA)', 'in', 'audioAnalog', 'rca', level='line-10'), ac('2 × 50 W')], status='community')
sheet('fischer-amps-shaker-amp-400', 'amplification', 'Fischer Amps', 'Shaker Amp 400', 'amp',
      R(('https://www.bax-shop.co.uk/downloads/products/9000-0011-6213/shakeramp-d.pdf', 'Fischer Amps, notice Shaker Amp (via Bax Music)'), ('https://www.thomann.pl/fischer_amps_shaker_amp_400.htm', 'Thomann, fiche Shaker Amp 400 (revendeur)')),
      [P('in', 'Input', 'in', 'audioAnalog', 'combo', level='mic', phantom='supplied', format='Combo XLR / jack ; préampli micro, fantôme 48 V, pad -16 dB'),
       xout('link', 'Link Out'), P('jack', 'Jack In / Out', 'bidir', 'audioAnalog', 'jack-trs', level='line+4'),
       P('spk', 'Shaker Out', 'out', 'audioAnalog', 'speakon-nl4', level='speaker', format='Speakon et bornier ; 400 W / 4 Ω (2 ButtKicker LFE)'),
       ac()], status='community', rackU=1, weightKg=2.8)
sheet('amek-dmcl', 'processing', 'AMEK', 'DMCL', 'processor', R(('https://www.soundonsound.com/reviews/amek-dmcl', 'Sound On Sound, test DMCL')),
      [P('mic1', 'Mic In 1', 'in', 'audioAnalog', 'xlr3', level='mic', phantom='supplied'), P('mic2', 'Mic In 2', 'in', 'audioAnalog', 'xlr3', level='mic', phantom='supplied'),
       xin('line1', 'Line In 1', conn=U), xin('line2', 'Line In 2', conn=U),
       P('di1', 'DI 1', 'in', 'audioAnalog', 'jack-ts', level='instrument', format='Face avant'), P('di2', 'DI 2', 'in', 'audioAnalog', 'jack-ts', level='instrument', format='Face avant'),
       xout('out1', 'Out 1', conn=U), xout('out2', 'Out 2', conn=U),
       P('aes', 'AES/EBU Out', 'out', 'audioDigital', U, channels=2), P('spdif', 'S/PDIF Out', 'out', 'audioDigital', U, channels=2),
       P('opt', 'Optical Out', 'out', 'audioDigital', 'toslink', channels=2), P('wc', 'Word Clock', 'in', 'sync', 'bnc', format='Word clock ou Superclock'), ac()],
      status='community', rackU=1)
sheet('lafont-lp-22', 'processing', 'Lafont Audio Labs', 'LP-22', 'processor',
      R(('https://fr.audiofanzine.com/tranche-de-console/lafont-audio-labs/LP-22-ADR-foley-Processor/', 'Audiofanzine, LP-22 ADR/Foley Processor')),
      [P('in', 'Mic In', 'in', 'audioAnalog', U, level='mic', format='Préampli 20 à 65 dB, pad -20 dB ; connecteur non précisé'),
       xout('out', 'Out', 'Connecteur non précisé', U), ac()], status='community')
sheet('dbx-160a', 'processing', 'dbx', '160A', 'processor', R(('https://en.audiofanzine.com/studio-compressor/dbx/user_reviews/p.4.html', 'Audiofanzine, avis dbx 160A')),
      [xin('in', 'Input', 'XLR ou jack 6,35 symétrique'), xout('out', 'Output', 'XLR symétrique (et jack)'), ac()], status='community', rackU=1)
sheet('empirical-labs-distressor-el8x', 'processing', 'Empirical Labs', 'Distressor EL8-X', 'processor',
      R(('https://wrdtunes.com/products/empirical-labs-el8x-distressor', 'WRD Tunes, fiche EL8-X (revendeur)')),
      [xin('in', 'Input', 'XLR et jack TRS en parallèle'), xout('out', 'Output', 'XLR et jack TRS en parallèle'), ac()], status='community', weightKg=3.6, rackU=1)

sheet('focusrite-octopre-platinum', 'processing', 'Focusrite', 'OctoPre Platinum', 'processor',
      R(('https://www.novelty.fr/produits/sonorisation/peripheriques/preampli/octo-pre-platinum/', 'Novelty, fiche OctoPre Platinum (loueur)')),
      [*[P(f'mic{i}', f'Mic In {i}', 'in', 'audioAnalog', 'xlr3', level='mic', phantom='supplied') for i in range(1, 9)],
       P('inst1', 'Instrument 1', 'in', 'audioAnalog', 'jack-ts', level='instrument'), P('inst2', 'Instrument 2', 'in', 'audioAnalog', 'jack-ts', level='instrument'),
       P('lineIn', 'Line In 1-8', 'in', 'audioAnalog', 'dsub25', level='line+4', channels=8), P('lineOut', 'Line Out 1-8', 'out', 'audioAnalog', 'dsub25', level='line+4', channels=8),
       P('adat', 'ADAT Out', 'out', 'audioDigital', 'toslink', channels=8, format='Carte ADAT en option'), ac()], status='community', weightKg=3.2, rackU=1)
sheet('roland-ua-1610', 'processing', 'Roland', 'UA-1610 Studio-Capture', 'processor',
      R(('https://www.soundhouse.co.jp/en/products/detail/item/181877/', 'Sound House, fiche UA-1610 (revendeur)')),
      [*[P(f'in{i}', f'Input {i}', 'in', 'audioAnalog', 'combo', level='mic', phantom='supplied', format='Combo XLR / jack') for i in range(1, 13)],
       *[xin(f'line{i}', f'Line In {i}', 'Jack TRS', 'jack-trs') for i in range(13, 17)],
       *[xout(f'out{i}', f'Line Out {i}', 'Jack TRS', 'jack-trs') for i in range(1, 9)],
       xout('monL', 'Monitor L'), xout('monR', 'Monitor R'),
       P('digIn', 'Digital In', 'in', 'audioDigital', 'rca', channels=2), P('digOut', 'Digital Out', 'out', 'audioDigital', 'rca', channels=2),
       P('midiIn', 'MIDI In', 'in', 'control', 'din5'), P('midiOut', 'MIDI Out', 'out', 'control', 'din5'),
       P('usb', 'USB 2.0', 'bidir', 'audioDigital', 'usb-b', format='16 × 10, 24 bits / 192 kHz'), P('dc', 'Alimentation', 'in', 'power', U)], status='community')
sheet('digigrid-mgb', 'processing', 'DiGiGrid', 'MGB', 'processor',
      R(('https://www.fullcompass.com/prod/254086-digigrid-mgb-coaxial-madi-interface-for-soundgrid', 'Full Compass, fiche MGB (revendeur)'), ('https://thomann.ae/digigrid_mgb_madi_bnc.htm', 'Thomann, fiche MGB (revendeur)')),
      [P('madi1', 'MADI 1', 'bidir', 'audioDigital', 'bnc', channels=64, format='MADI coaxial'), P('madi2', 'MADI 2', 'bidir', 'audioDigital', 'bnc', channels=64, format='MADI coaxial'),
       P('sg', 'SoundGrid', 'bidir', 'audioIp', 'rj45', channels=128, format='Réseau Waves SoundGrid'),
       P('wc', 'Word Clock In', 'in', 'sync', 'bnc'), P('dc', 'Alimentation', 'in', 'power', U)], status='community', weightKg=0.4)
mic('audix-scx1', 'Audix', 'SCX1', R(('https://www.barryrudolph.com/recall/manuals/scx1c.pdf', 'Audix, notice SCX1-C (archive)'), ('https://soundpro.com/audix-scx1-studio-condenser-microphone', 'SoundPro, fiche SCX1 (revendeur)')),
    'required', fmt='Statique cardioïde, fantôme 48-52 V', status='community', weightKg=0.114)

sheet('green-go-wpx', 'intercom', 'Green-GO', 'WPX (Wall Panel X)', 'intercom',
      R(('https://www.canford.de/ProductResources/resources/G/Green-GO/WPX-Quick-Start-Guide.pdf', 'Green-GO, guide de démarrage WPX (via Canford)')),
      [P('lan', 'Réseau', 'bidir', 'intercom', 'rj45', format='Réseau Green-GO, PoE 802.3af'),
       P('headset', 'Casque', 'bidir', 'audioAnalog', 'xlr4', format='XLR 4 points'),
       P('spk', 'Haut-parleur externe', 'out', 'audioAnalog', U, level='speaker', format='Jusqu\'à 10 W')], status='community')

def radio(id, mfr, model, srcs, acc_conn, acc_fmt):
    sheet(id, 'wireless', mfr, model, 'wireless', srcs,
          [P('rf', 'Antenne', 'bidir', 'rf', U, format='Radio professionnelle (PMR)'),
           P('acc', 'Accessoires audio', 'bidir', 'audioAnalog', acc_conn, format=acc_fmt)], status='community')
radio('motorola-gp340', 'Motorola', 'GP340', R(('https://clear-com.atlassian.net/wiki/spaces/SF/pages/158779494', 'Clear-Com, interfaçage d\'un GP340')),
      U, 'Connecteur accessoires rectangulaire Motorola (adaptateur vers mini-jacks)')
radio('motorola-dp1400', 'Motorola', 'DP1400', R(('https://radio-shop.uk/collections/motorola-dp1400-accessories-buy-from-radio-shop-uk', 'Radio Shop, accessoires DP1400 (revendeur)')),
      U, 'Connecteur accessoires (micro déporté, oreillettes) non précisé')
radio('icom-ic-f22', 'Icom', 'IC-F22', R(('https://earhugger.com/?p=4543', 'Earhugger, connecteur 2 broches Icom')),
      'minijack', 'Prise 2 broches Icom (jack 3,5 + 2,5), à confirmer pour ce modèle')
