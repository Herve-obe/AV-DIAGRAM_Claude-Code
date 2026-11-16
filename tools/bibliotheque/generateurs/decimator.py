# Decimator Design 12G-CROSS / MD-HX / DMON-4S (DD-4S), Extron DA4 HDMI 4K PLUS.
from common import P, src, sheet
M = 'Decimator Design'
U = 'unspecified'
def R(*pairs): return [src(u, d) for u, d in pairs]
def sdi(id, name, d, fmt=None): return P(id, name, d, 'video', 'bnc', format=fmt)
def dc(): return P('dc', 'DC In', 'in', 'power', 'dc-barrel', format='5 à 32 V, prise verrouillable')
USB = P('usb', 'USB', 'bidir', 'control', U, format='Contrôle et mise à jour')

sheet('decimator-12g-cross', 'videoRouting', M, '12G-CROSS (DD-12G-CROSS)', 'router',
      R(('https://www.bhphotovideo.com/c/product/1474644-REG/decimator_12g_cross_4k_hdmi_sdi_cross_converter.html', 'B&H, fiche 12G-CROSS (revendeur)')),
      [sdi('sdiIn', '12G-SDI In', 'in'), P('hdmiIn', 'HDMI 2.0 In', 'in', 'video', 'hdmi'), P('gl', 'Genlock', 'in', 'sync', 'bnc'),
       sdi('out1', 'SDI Out 1', 'out', '12G-SDI'), sdi('out2', 'SDI Out 2', 'out', '12G-SDI'),
       sdi('loop1', 'SDI Out / Loop 3', 'out', '12G-SDI, recopie ou sortie'), sdi('loop2', 'SDI Out / Loop 4', 'out', '12G-SDI, recopie ou sortie'),
       P('hdmiOut', 'HDMI 2.0 Out', 'out', 'video', 'hdmi'), USB, dc()], status='community')
sheet('decimator-md-hx', 'videoRouting', M, 'MD-HX', 'router',
      R(('https://www.markertek.com/product/dec-md-hx/decimator-md-hx-mini-3g-hd-sd-sdi-to-hdmi-cross-converter-with-scaling-and-frame-rate-conversion', 'Markertek, fiche MD-HX (revendeur)')),
      [sdi('sdiIn', 'SDI In', 'in', '3G / HD / SD-SDI'), P('hdmiIn', 'HDMI In', 'in', 'video', 'hdmi'),
       *[sdi(f'out{i}', f'SDI Out {i}', 'out', '3G / HD / SD-SDI' + (' ; recopie active ou sortie' if i <= 2 else '')) for i in range(1, 5)],
       P('hdmiOut', 'HDMI Out', 'out', 'video', 'hdmi'), USB, dc()], status='community')
sheet('decimator-dmon-4s', 'videoRouting', M, 'DMON-4S (DD-4S)', 'router',
      R(('https://www.scan.co.uk/products/decimator-design-dmon-4s-quad-(3g-hd-sd)-sdi-to-hdmi-multi-viewer-and-converter', 'Scan, fiche DMON-4S (revendeur)'), ('https://soundpro.com/products/decimator-dd-4s', 'SoundPro, fiche DD-4S (revendeur)')),
      [*[sdi(f'in{i}', f'SDI In {i}', 'in', '3G / HD / SD-SDI' + (' ; configurable en recopie active' if i in (2, 4) else '')) for i in range(1, 5)],
       *[P(f'hdmi{i}', f'HDMI Out {i}', 'out', 'video', 'hdmi', format='HDMI type C ; entrée ou multiview') for i in range(1, 5)], USB, dc()], status='community')
sheet('extron-da4-hdmi-4k-plus', 'videoRouting', 'Extron', 'DA4 HDMI 4K PLUS', 'router',
      R(('https://www.novelty.fr/produits/video/', 'Catalogue Novelty (désignation « EXTRON DA4HDMI 4K/4K+ 1x4 »)')),
      [P('in', 'HDMI In', 'in', 'video', 'hdmi'), *[P(f'out{i}', f'HDMI Out {i}', 'out', 'video', 'hdmi') for i in range(1, 5)],
       P('dc', 'Alimentation', 'in', 'power', U)], status='community')
