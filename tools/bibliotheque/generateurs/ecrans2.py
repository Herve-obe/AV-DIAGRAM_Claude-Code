# Écrans : NEC P484 / P554, Samsung U28E850R / UE48J5000, iiyama XB2481HS / B2280HS, LG 75UM3E, EIZO EV2740X, Lilliput Q23-8K / PVM220S.
from common import P, src, sheet
U = 'unspecified'
def R(*pairs): return [src(u, d) for u, d in pairs]
def ins(*specs):
    out = []
    for conn, n, label, fmt in specs:
        for i in range(1, n + 1):
            out.append(P(f'{conn.replace("-", "")}{i}', f'{label} {i}' if n > 1 else label, 'in', 'video', conn, format=fmt))
    return out
def ac(fmt=None): return P('ac', 'Secteur', 'in', 'power', U, format=fmt)
def screen(id, mfr, model, srcs, ports, **kw): sheet(id, 'display', mfr, model, 'display', srcs, ports, status='community', **kw)

screen('nec-p484', 'NEC', 'MultiSync P484', R(('https://usm.channelonline.com/pcudi/storesite/Products/overview/M020922164', 'Fiche P484-R (revendeur)')),
       ins(('hdmi', 2, 'HDMI In', None), ('displayport', 1, 'DP In', None), ('dvi', 1, 'DVI In', None), ('vga', 1, 'VGA In', None), ('bnc', 1, 'Composite In', 'Composite')) + [ac()])
screen('nec-p554', 'NEC', 'MultiSync P554', R(('https://www.ampronix.com/nec-p554', 'Ampronix, fiche P554 (revendeur)')),
       ins(('hdmi', 1, 'HDMI In', None), ('displayport', 1, 'DP In', None), ('dvi', 1, 'DVI-D In', None), ('vga', 1, 'VGA In', None)) + [ac()], weightKg=26.6)
screen('samsung-u28e850r', 'Samsung', 'U28E850R', R(('https://image-us.samsung.com/SamsungUS/b2b/product/lu/28/e8/lu28e85krsza/MON-U28E850RDSHT-MAR16TFinal3-10-16.pdf', 'Samsung, fiche U28E850R')),
       ins(('hdmi', 2, 'HDMI In', 'HDMI 2.0 (MHL)'), ('displayport', 1, 'DP In', 'DP 1.2'), ('displayport', 1, 'Mini DP In', 'Mini DisplayPort'))[:3]
       + [P('minidp', 'Mini DP In', 'in', 'video', 'displayport', format='Mini DisplayPort'), P('usb', 'Hub USB 3.0', 'bidir', 'control', 'usb-b'), ac()], weightKg=4.94)
screen('samsung-ue48j5000', 'Samsung', 'UE48J5000', R(('https://www.tvsfaq.com/en/specifications/samsung-ue48j5000aw', 'TVsFAQ, UE48J5000')),
       ins(('hdmi', 2, 'HDMI In', None)) + [P('av', 'Composante / composite', 'in', 'video', U), P('rf', 'Antenne', 'in', 'rf', 'rf'),
       P('usb', 'USB', 'in', 'control', 'usb-a'), P('opt', 'Sortie audio optique', 'out', 'audioDigital', 'toslink'), ac()], weightKg=10.2)
screen('iiyama-xb2481hs-b1', 'iiyama', 'ProLite XB2481HS-B1', R(('https://www.expertreviews.co.uk/technology/monitors/iiyama-prolite-xb2481hs-b1-review', 'Expert Reviews, test XB2481HS-B1')),
       ins(('hdmi', 1, 'HDMI In', None), ('dvi', 1, 'DVI In', None), ('vga', 1, 'VGA In', None)) + [P('audio', 'Audio Out', 'out', 'audioAnalog', 'minijack', channels=2), ac()])
screen('iiyama-b2280hs', 'iiyama', 'ProLite B2280HS', R(('https://www.scan.co.uk/products/215-iiyama-prolite-b2280hs-monitor-1920x1080-5ms-250cd-m-brightness-integrated-speakers-hdmi-dvi-vga', 'Scan, fiche B2280HS (revendeur)')),
       ins(('hdmi', 1, 'HDMI In', None), ('dvi', 1, 'DVI In', None), ('vga', 1, 'VGA In', None)) + [ac()])
screen('lg-75um3e', 'LG', '75UM3E', R(('https://www.lg.com/hk_en/business/digital-signage/lg-75UM3E-B', 'LG, page 75UM3E')),
       ins(('hdmi', 3, 'HDMI In', None), ('displayport', 1, 'DP In', None), ('dvi', 1, 'DVI-D In', None))
       + [P('audioIn', 'Audio In', 'in', 'audioAnalog', 'minijack'), P('dpOut', 'DP Out', 'out', 'video', 'displayport'),
          P('audioOut', 'Audio Out', 'out', 'audioAnalog', 'minijack'), P('usb', 'USB 2.0', 'in', 'control', 'usb-a'), ac()], weightKg=41.5)
screen('eizo-ev2740x', 'EIZO', 'FlexScan EV2740X', R(('https://www.adorama.com/eiev2740xbk.html', 'Adorama, fiche EV2740X-BK (revendeur)')),
       [P('usbc', 'USB-C', 'in', 'video', 'usb-c', format='DP Alt Mode, charge 94 W, réseau')]
       + ins(('displayport', 1, 'DP In', None), ('hdmi', 2, 'HDMI In', None)) + [ac()])
screen('lilliput-q23-8k', 'Lilliput', 'Q23-8K', R(('https://www.videocraft.com.au/products/lilliput-q23-8k-23-8-12g-sdi-hdmi-broadcast-studio-monitor', 'Videocraft, fiche Q23-8K (revendeur)')),
       ins(('bnc', 4, 'SDI In', '12G-SDI (quad link 8K)'), ('hdmi', 1, 'HDMI 2.0 In', None))
       + [P('sfp', 'SFP+', 'in', 'video', 'sfp', format='Module fibre 12G en option'), ac('Secteur ou batterie V-mount')])
screen('lilliput-pvm220s', 'Lilliput', 'PVM220S', R(('https://videoguys.com.au/a/p/products/lilliput-pvm220s-21-5-3g-sdi-hdmi-quad-split-broadcast-monitor', 'Videoguys, fiche PVM220S (revendeur)')),
       ins(('bnc', 2, 'SDI In', '3G-SDI'), ('hdmi', 2, 'HDMI In', None))
       + [P('sdiOut1', 'SDI Out 1', 'out', 'video', 'bnc'), P('sdiOut2', 'SDI Out 2', 'out', 'video', 'bnc'),
          P('hdmiOut', 'HDMI PGM Out', 'out', 'video', 'hdmi'), P('usbc', 'USB-C In', 'in', 'video', 'usb-c'), ac()])
