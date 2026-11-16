# Klark Teknik : réseau AES50 (DN9680, DN9650, DN9630), enregistreur DN9696, DI DN100 / DN200, égaliseurs DN370 / DN360.
from common import P, src, sheet
M = 'Klark Teknik'
U = 'unspecified'
def R(*pairs): return [src(u, d) for u, d in pairs]
def aes50(id, name, conn='ethercon', fmt='AES50'): return P(id, name, 'bidir', 'audioDigital', conn, format=fmt)
def ac(fmt=None): return P('ac', 'Secteur', 'in', 'power', U, format=fmt)

sheet('klarkteknik-dn9680', 'stagebox', M, 'DN9680', 'stagebox',
      R(('https://www.thomann.co.uk/klark_teknik_dn9680.htm', 'Thomann, fiche DN9680 (revendeur)'),
        ('https://www.avlfx.com/category/product/1623-klark-teknik-dn9680-8-port-aes50-extender-and-multiplexer-with-up-to-1000-metre-range/category_pathway-13', 'AVLFX, fiche DN9680 (revendeur)')),
      [*[aes50(f'aes{i}', f'AES50 {i}') for i in range(1, 9)],
       P('snakeCu', 'Snake (cuivre)', 'bidir', 'audioDigital', 'ethercon', format='Multiplex 8 AES50 sur Cat5, 100 m'),
       P('snakeOpt', 'Snake (optique)', 'bidir', 'audioDigital', 'opticalcon', format='opticalCON DUO, multiplex 8 AES50, 1 000 m'),
       P('eth', 'Ethernet', 'bidir', 'network', U, format='Configuration par navigateur'), ac('Alimentation universelle')],
      status='community', weightKg=4.9, rackU=1)

sheet('klarkteknik-dn9650', 'processing', M, 'DN9650', 'processor', R(('https://www.klarkteknik.com/en/products/0606-AAZ', 'Klark Teknik, page DN9650')),
      [aes50('aes1', 'AES50 A', 'rj45'), aes50('aes2', 'AES50 B', 'rj45'), aes50('aes3', 'AES50 C', 'rj45'),
       P('module', 'Module réseau', 'bidir', 'audioDigital', U, channels=64, format='Emplacement CM-1 : KT-MADI, KT-DANTE64, KT-AES50, KT-USB'),
       P('wcIn', 'Word Clock In', 'in', 'sync', 'bnc'), P('wcOut', 'Word Clock Out', 'out', 'sync', 'bnc'),
       P('video', 'Black Burst In', 'in', 'sync', 'bnc', format='PAL / SECAM / NTSC, HD 720p / 1080p / 1080i'),
       P('eth', 'Ethernet', 'bidir', 'network', 'rj45', format='Configuration par navigateur'), ac('Alimentation universelle')], rackU=1)

sheet('klarkteknik-dn9630', 'processing', M, 'DN9630', 'processor',
      R(('https://www.audiotechnology.com/news/klark-teknik-releases-aes50-to-usb-converter', 'AudioTechnology, annonce DN9630'),
        ('https://www.markertek.com/product/kt-dn9630/klark-teknik-dn9630-aes50-to-usb-2-0-converter-with-48-bidirectional-channels', 'Markertek, fiche DN9630 (revendeur)')),
      [aes50('aes', 'AES50', U, 'AES50, 48 canaux à 48 kHz / 24 à 96 kHz'),
       P('usb', 'USB 2.0', 'bidir', 'audioDigital', 'usb-b', channels=48, format='Ordinateur Windows / Mac ; alimente l\'appareil'),
       P('eth', 'Ethernet (données AES50)', 'bidir', 'network', 'rj45', format='Canal auxiliaire AES50 : commande et mesure')], status='community')

sheet('klarkteknik-dn9696', 'recording', M, 'DN9696', 'recorder',
      R(('https://cdn-docs.av-iq.com/brochure/Klark%20Teknik%20-%20DN9696%20Brochure.pdf', 'Klark Teknik, brochure DN9696 (via AV-iQ)')),
      [*[aes50(f'aes{i}', f'AES50 {i}', fmt='AES50 (4 ports, double redondance)') for i in range(1, 9)],
       P('ltc', 'LTC In', 'in', 'sync', 'xlr3', format='Timecode LTC'),
       P('video', 'Moniteur', 'out', 'video', 'dvi', format='DVI-I (VGA par adaptateur)'),
       P('usb', 'USB', 'bidir', 'control', 'usb-a', format='Clavier, souris'),
       ac('100-240 V')], status='community', rackU=5)

sheet('klarkteknik-dn100-v2', 'capture', M, 'DN100 V2', 'di',
      R(('https://www.andertons.co.uk/klark-teknik-dn100-v2-active-di-box', 'Andertons, fiche DN100 V2 (revendeur)'), ('https://prostage.gr/en/klark-teknik-dn-100-v2.html', 'Prostage, fiche DN100 V2 (revendeur)')),
      [P('in', 'Input', 'in', 'audioAnalog', 'combo', level='instrument', format='XLR et 2 jacks TRS 6,35 en parallèle, 1 MΩ, pad 20 dB'),
       P('link', 'Link', 'out', 'audioAnalog', 'jack-trs', level='instrument', format='Recopie de l\'entrée'),
       P('out', 'Output', 'out', 'audioAnalog', 'xlr3', level='mic', phantom='required', format='Symétrique 50 Ω ; fantôme 48 V requis')], status='community')
sheet('klarkteknik-dn200-v2', 'capture', M, 'DN200 V2', 'di',
      R(('https://www.andertons.co.uk/klark-teknik-dn200-v2-active-stereo-di-box/', 'Andertons, fiche DN200 V2 (revendeur)'), ('https://prostage.gr/en/klark-teknik-dn200-v2.html', 'Prostage, fiche DN200 V2 (revendeur)')),
      [P('in1', 'Input 1', 'in', 'audioAnalog', 'combo', level='instrument', format='Combo XLR / jack, 1 MΩ, pad 20 dB'),
       P('in2', 'Input 2', 'in', 'audioAnalog', 'combo', level='instrument', format='Combo XLR / jack, 1 MΩ, pad 20 dB'),
       P('link1', 'Link 1', 'out', 'audioAnalog', 'jack-trs', level='instrument'), P('link2', 'Link 2', 'out', 'audioAnalog', 'jack-trs', level='instrument'),
       P('mini', 'Stereo In', 'in', 'audioAnalog', 'minijack', level='line-10', channels=2, format='Mini-jack 3,5 stéréo, appareils grand public'),
       P('out1', 'Output 1', 'out', 'audioAnalog', 'xlr3', level='mic', phantom='required', format='Fantôme 48 V requis'),
       P('out2', 'Output 2', 'out', 'audioAnalog', 'xlr3', level='mic', phantom='required', format='Fantôme 48 V requis ; modes Sum / Split')], status='community')

def geq(id, model, srcs, fmt, w, extra=()):
    sheet(id, 'processing', M, model, 'processor', srcs,
          [P('inA', 'Input A', 'in', 'audioAnalog', 'xlr3', level='line+4', format=fmt),
           P('inB', 'Input B', 'in', 'audioAnalog', 'xlr3', level='line+4', format=fmt),
           P('outA', 'Output A', 'out', 'audioAnalog', 'xlr3', level='line+4', format=fmt),
           P('outB', 'Output B', 'out', 'audioAnalog', 'xlr3', level='line+4', format=fmt), *extra, ac()],
          status='community', weightKg=w, rackU=3)
geq('klarkteknik-dn370', 'DN370', R(('https://www.fullcompass.com/common/files/17851-DN370Brochure.pdf', 'Klark Teknik, brochure DN370 (via Full Compass)')),
    'Symétrie électronique (transformateur en option) ; doublé sur bornier Phoenix', 5.8)
geq('klarkteknik-dn360', 'DN360', R(('https://pssl.com/products/klark-teknik-dn360-2-ch-31-band-graphic-equalizer', 'PSSL, fiche DN360 (revendeur)'),
    ('https://www.markertek.com/product/kt-dn360/klark-teknik-dn360-two-channel-30-band-1-3-octave-classic-graphic-eq', 'Markertek, fiche DN360 (revendeur)')),
    'Symétrie non confirmée (sources divergentes)', 5.0)
