# NovaStar MX30 / MX40 Pro / VX4S / NovaPro UHD Jr / CVT10 Pro-S ; Sony PMW-400 / PMW-350 / PMW-EX3 / PMW-EX1 / PXW-X160 / LMD-A170 / RM-B170 / RCP-750.
from common import P, src, sheet
U = 'unspecified'
def R(*pairs): return [src(u, d) for u, d in pairs]
def sdi(id, name, d, fmt=None): return P(id, name, d, 'video', 'bnc', format=fmt)
def eths(n, conn='ethercon', fmt='Sortie vers cartes de réception LED'): return [P(f'led{i}', f'LED Out {i}', 'out', 'network', conn, format=fmt) for i in range(1, n + 1)]
def fib(n, fmt='Sortie optique 10G (module SFP)'): return [P(f'opt{i}', f'Optical {i}', 'out', 'network', 'sfp', format=fmt) for i in range(1, n + 1)]
NS = 'NovaStar'
ac = lambda fmt=None: P('ac', 'Secteur', 'in', 'power', U, format=fmt)

sheet('novastar-mx40-pro', 'videoRouting', NS, 'MX40 Pro', 'processor',
      R(('https://www.bhphotovideo.com/c/product/1865472-REG/novastar_mx40_pro_controller.html', 'B&H, fiche MX40 Pro (revendeur)'), ('https://globalproductions.ee/toode/novastar-mx40-pro/', 'Global Productions, fiche MX40 Pro (loueur)')),
      [*[P(f'hdmi{i}', f'HDMI 2.0 In {i}', 'in', 'video', 'hdmi', format='4K60') for i in range(1, 4)],
       P('dp', 'DP 1.2 In', 'in', 'video', 'displayport'), sdi('sdi', '12G-SDI In', 'in'),
       *[P(f'hdmiLoop{i}', f'HDMI Loop {i}', 'out', 'video', 'hdmi') for i in range(1, 4)], sdi('sdiLoop', '12G-SDI Loop', 'out'),
       *eths(20, 'rj45'), *fib(4), P('eth', 'Contrôle', 'bidir', 'network', 'rj45'), ac()], status='community', weightKg=7.5)
sheet('novastar-mx30', 'videoRouting', NS, 'MX30', 'processor',
      R(('https://www.bhphotovideo.com/c/product/1865470-REG/novastar_mx30_controller.html', 'B&H, fiche MX30 (revendeur)')),
      [P('hdmi', 'HDMI In', 'in', 'video', 'hdmi', format='HDMI 1.4 / 2.0 (nombre non précisé)'), P('dp', 'DP In', 'in', 'video', 'displayport'),
       sdi('sdi', '3G-SDI In', 'in'), *eths(10, 'rj45'), *fib(2), ac()], status='community')
sheet('novastar-vx4s', 'videoRouting', NS, 'VX4S', 'processor',
      R(('https://www.elationlighting.com/novastar-vx4s', 'Elation, fiche NovaStar VX4S (distributeur)')),
      [P('dp', 'DP In', 'in', 'video', 'displayport'), P('hdmi', 'HDMI In', 'in', 'video', 'hdmi'),
       P('vga1', 'VGA In 1', 'in', 'video', 'vga'), P('vga2', 'VGA In 2', 'in', 'video', 'vga'), P('dvi', 'DVI In', 'in', 'video', 'dvi'),
       P('cvbs1', 'CVBS In 1', 'in', 'video', 'bnc'), P('cvbs2', 'CVBS In 2', 'in', 'video', 'bnc'), sdi('sdi', 'SDI In', 'in'),
       P('audio', 'Audio In', 'in', 'audioAnalog', 'minijack', level='line-10', channels=2),
       P('dviLoop', 'DVI Loop', 'out', 'video', 'dvi'), P('dviOut', 'DVI Out', 'out', 'video', 'dvi'), P('vgaOut', 'VGA Out', 'out', 'video', 'vga'),
       sdi('sdiLoop', 'SDI Loop', 'out'), *eths(4, 'rj45', 'Sortie LED, 2,3 Mpx au total'),
       P('lan', 'LAN', 'bidir', 'network', 'rj45', format='Contrôle IP'), P('usb', 'USB', 'bidir', 'control', 'usb-b'), ac('16 W')],
      status='community', rackU=2)
sheet('novastar-novapro-uhd-jr', 'videoRouting', NS, 'NovaPro UHD Jr', 'processor',
      R(('https://www.huss-licht-ton.de/print_product_info.php/en/products_id/52773', 'Huss, fiche NovaPro UHD Jr (revendeur)'), ('https://www.adj.com/novapro-uhd-jr', 'ADJ, fiche NovaPro UHD Jr (distributeur)')),
      [P('dp', 'DP 1.1 In', 'in', 'video', 'displayport'), P('hdmi', 'HDMI 2.0 In', 'in', 'video', 'hdmi'),
       *[P(f'dvi{i}', f'DVI In {i}', 'in', 'video', 'dvi') for i in range(1, 5)],
       sdi('sdi1', '12G-SDI In 1', 'in'), sdi('sdi2', '12G-SDI In 2', 'in'),
       P('hdmiLoop', 'HDMI Loop', 'out', 'video', 'hdmi'), sdi('sdiLoop1', '12G-SDI Loop 1', 'out'), sdi('sdiLoop2', '12G-SDI Loop 2', 'out'),
       *eths(16), *fib(4, 'Sortie optique'), ac('70 W')], status='community', rackU=3, powerW=70)
sheet('novastar-cvt10-pro-s', 'videoRouting', NS, 'CVT10 Pro-S', 'router',
      R(('https://www.bhphotovideo.com/c/product/1941746-REG/novastar_cvt10pro_s_cvt10_pro_s_cat6_fiber_converter.html', 'B&H, fiche CVT10 Pro-S (revendeur)'), ('https://midwich.us/p/cvt10pro-s-fiber-converter', 'Midwich, fiche CVT10 Pro-S')),
      [P('opt1', 'Optical 1', 'bidir', 'network', 'lc', format='10G monomode LC (principal)'), P('opt2', 'Optical 2', 'bidir', 'network', 'lc', format='10G monomode LC (secours)'),
       *eths(10, 'ethercon', 'Gigabit vers cartes de réception'), ac()], status='community')

SO = 'Sony'
def xlr2(): return [P('in1', 'Audio In 1', 'in', 'audioAnalog', 'xlr3', level='mic', phantom='supplied', format='Ligne / micro / micro +48 V'),
                    P('in2', 'Audio In 2', 'in', 'audioAnalog', 'xlr3', level='mic', phantom='supplied', format='Ligne / micro / micro +48 V')]
sheet('sony-pmw-400', 'camera', SO, 'PMW-400', 'camera',
      R(('https://pro.sony/en_DJ/pdf/pmw-400l', 'Sony, fiche PMW-400L'), ('https://www.expandore.com/product/sony/Proav/model/XDCAM_HD/PMW-400L.htm', 'Expandore, fiche PMW-400L')),
      [sdi('sdi1', 'SDI Out 1', 'out', 'SD / HD-SDI'), sdi('sdi2', 'SDI Out 2', 'out', 'SD / HD-SDI'), P('hdmi', 'HDMI Out', 'out', 'video', 'hdmi'),
       P('tcIn', 'TC In', 'in', 'sync', 'bnc'), P('tcOut', 'TC Out', 'out', 'sync', 'bnc'), P('gl', 'Genlock In', 'in', 'sync', 'bnc'),
       *xlr2(), P('mic', 'Mic In', 'in', 'audioAnalog', 'xlr5', level='mic'), P('aOut', 'Audio Out', 'out', 'audioAnalog', 'xlr5'),
       P('remote', 'Remote', 'bidir', 'control', U, format='8 points'), P('lens', 'Objectif', 'bidir', 'control', U, format='12 points'),
       P('ilink', 'i.LINK', 'bidir', 'video', 'ieee1394'), P('cbk', 'Interface 50 points', 'bidir', 'control', U, format='Adaptateur CBK-CE01 (triax / fibre, intercom, tally)'),
       P('dc', 'DC In', 'in', 'power', 'xlr4')], weightKg=3.4)
sheet('sony-pmw-350', 'camera', SO, 'PMW-350', 'camera', R(('https://www.vahire.com/wp-content/uploads/Sony-PMW-350-Specifications.pdf', 'Sony, caractéristiques PMW-350 (via VA Hire)')),
      [sdi('sdi', 'SDI Out', 'out', 'SD / HD-SDI'), sdi('comp', 'Composite Out', 'out'), P('hdmi', 'HDMI Out', 'out', 'video', 'hdmi'),
       P('tcIn', 'TC In', 'in', 'sync', 'bnc'), P('tcOut', 'TC Out', 'out', 'sync', 'bnc'), P('gl', 'Genlock In', 'in', 'sync', 'bnc'),
       *xlr2(), P('mic', 'Mic In', 'in', 'audioAnalog', 'xlr5', level='mic'), P('aOut', 'Audio Out', 'out', 'audioAnalog', 'xlr5'),
       P('phones', 'Casque', 'out', 'audioAnalog', 'minijack', channels=2), P('remote', 'Remote', 'bidir', 'control', U, format='8 points'),
       P('ilink', 'i.LINK', 'bidir', 'video', 'ieee1394'), P('usb', 'USB', 'bidir', 'control', 'usb-mini'),
       P('dc', 'DC In', 'in', 'power', 'xlr4'), P('dcOut', 'DC Out', 'out', 'power', 'hirose4')], status='community', weightKg=3.2)
sheet('sony-pmw-ex3', 'camera', SO, 'PMW-EX3', 'camera', R(('https://mediamaking.com/en/rental-camcorder-sony-pmw-ex3/', 'Mediamaking, fiche PMW-EX3 (loueur)')),
      [sdi('sdi', 'SDI Out', 'out', 'HD / SD-SDI'), P('gl', 'Genlock In', 'in', 'sync', 'bnc'),
       P('tcIn', 'TC In', 'in', 'sync', 'bnc'), P('tcOut', 'TC Out', 'out', 'sync', 'bnc'), *xlr2(),
       P('aOut', 'Audio Out', 'out', 'audioAnalog', 'rca', level='line-10', channels=2), P('phones', 'Casque', 'out', 'audioAnalog', 'minijack', channels=2),
       P('ilink', 'i.LINK', 'bidir', 'video', 'ieee1394'), P('remote', 'Remote', 'bidir', 'control', U, format='8 points'),
       P('dc', 'DC In', 'in', 'power', U)], status='community', weightKg=1.9)
sheet('sony-pmw-ex1', 'camera', SO, 'PMW-EX1', 'camera', R(('https://www.vahire.com/wp-content/uploads/Sony-PMW-EX1-Specifications.pdf', 'Sony, caractéristiques PMW-EX1 (via VA Hire)')),
      [sdi('sdi', 'SDI Out', 'out', 'HD ou SD (conversion), audio et timecode intégrés'), *xlr2(),
       P('ilink', 'i.LINK', 'bidir', 'video', 'ieee1394'), P('dc', 'DC In', 'in', 'power', U)], status='community', weightKg=2.4)
sheet('sony-pxw-x160', 'camera', SO, 'PXW-X160', 'camera', R(('https://monaco.novelty.fr/download/materiel_fiches_techniques/sony_pxw-x160_ft-uk.pdf', 'Sony, fiche PXW-X160 (via Novelty)')),
      [sdi('sdi', '3G HD-SDI Out', 'out'), P('hdmi', 'HDMI Out', 'out', 'video', 'hdmi'), P('comp', 'Composite Out', 'out', 'video', U),
       P('tcIn', 'TC In', 'in', 'sync', 'bnc'), P('tcOut', 'TC Out', 'out', 'sync', 'bnc'), P('gl', 'Genlock In', 'in', 'sync', 'bnc'),
       P('audio', 'Audio In', 'in', 'audioAnalog', U, level='mic', channels=2, format='Entrées audio (type non confirmé) ; MI Shoe pour HF'),
       P('lanc', 'LANC', 'in', 'control', U), P('usb', 'USB', 'bidir', 'control', U), P('dc', 'DC In', 'in', 'power', U)], status='community', weightKg=2.7)
sheet('sony-lmd-a170', 'display', SO, 'LMD-A170', 'display', R(('https://pro.sony/en_AU/pdf/lmd-a170', 'Sony, fiche LMD-A170')),
      [sdi('sdi1', 'SDI In 1', 'in', '3G / HD / SD-SDI, recopie active'), sdi('sdi2', 'SDI In 2', 'in', '3G / HD / SD-SDI, recopie active'),
       P('hdmi', 'HDMI In', 'in', 'video', 'hdmi', format='HDCP'), P('comp', 'Composite In', 'in', 'video', 'bnc', format='Avec recopie'),
       P('audio', 'Audio In', 'in', 'audioAnalog', 'minijack', level='line-10', channels=2), P('ac', 'Alimentation', 'in', 'power', U)])
sheet('sony-rm-b170', 'control', SO, 'RM-B170', 'control', R(('https://pro.sony/en_SE/products/camera-control-panels/rm-b170', 'Sony, page RM-B170')),
      [P('cam', 'Caméra', 'bidir', 'control', U, format='Câble 8 points 10 m (transporte aussi une sortie composite moniteur)'),
       P('gpi', 'EXT I/O', 'bidir', 'control', 'dsub9', format='Tally rouge / vert, entrée 12 V')])
sheet('sony-rcp-750', 'control', SO, 'RCP-750', 'control', R(('https://www.avbroadcast.fr/media/productfile/s/o/sony-rcp-750-brochure.pdf', 'Sony, brochure RCP-750 (via AV Broadcast)')),
      [P('ccu', 'CCU / CNU', 'bidir', 'control', U, format='Multiconnecteur 8 points (câble CCA-5) ; alimentation 10,5-35 V par la CCU'),
       P('aux', 'AUX', 'bidir', 'control', U, format='Multiconnecteur 8 points'), P('ext', 'EXT I/O', 'bidir', 'control', 'dsub9')], weightKg=1.5)
