# Pupitres MA Lighting grandMA3, d'après l'aide en ligne du constructeur (Quick Manual consoles, Technical Data, v2.3).
from common import P, src, sheet, written

DOC = [src('https://help.malighting.com/grandMA3/2.3/HTML/key_consoles_technical_data.html', 'MA Lighting, grandMA3 Quick Manual consoles, Technical Data (v2.3)')]

def ma3(id, model, dp, usb3, desklights, weight, va):
    ports = [P('ac', 'Secteur', 'in', 'power', 'powercon-true1', format=f'100-240 V, max. {va} VA ; onduleur intégré sur full-size et light')]
    ports += [P(f'eth{i}', f'Ethernet {i}', 'bidir', 'network', 'ethercon', format='etherCON / RJ45') for i in (1, 2, 3)]
    ports += [P(f'dmx{c}', f'DMX {c} Out', 'out', 'dmx', 'xlr5', format='DMX512-A, XLR5 femelle') for c in 'ABCDEF']
    ports += [P('dmx-in', 'DMX In', 'in', 'dmx', 'xlr5', format='DMX512-A, XLR5 mâle'),
              P('midi-in', 'MIDI In', 'in', 'control', 'din5'),
              P('midi-out', 'MIDI Out', 'out', 'control', 'din5'),
              P('ltc', 'LTC', 'in', 'sync', 'xlr3', format='Timecode linéaire, XLR3 femelle'),
              P('audio', 'Audio In', 'in', 'audioAnalog', 'xlr3', format='XLR3 femelle'),
              P('gpi', 'GPI', 'in', 'control', 'dsub9', format='Entrées de télécommande, D-Sub DE9 femelle'),
              P('spdif-in', 'S/PDIF In', 'in', 'audioDigital', 'unspecified', format='Connecteur non précisé'),
              P('spdif-out', 'S/PDIF Out', 'out', 'audioDigital', 'unspecified', format='Connecteur non précisé')]
    ports += [P(f'dp{i}', f'DisplayPort {i}', 'out', 'video', 'displayport', format='DisplayPort 1.2, écran externe (sans adaptateur)') for i in range(1, dp + 1)]
    ports += [P(f'usb2-{i}', f'USB 2.0 {i}', 'bidir', 'control', 'usb-a', format='Max. 500 mA') for i in (1, 2, 3)]
    ports += [P(f'usb3-{i}', f'USB 3.0 {i}', 'bidir', 'control', 'usb-a', format='Max. 900 mA') for i in range(1, usb3 + 1)]
    ports += [P(f'lamp{i}', f'Lampe de pupitre {i}', 'out', 'power', 'xlr4', format='XLR4 femelle') for i in range(1, desklights + 1)]
    sheet(id, 'lightingControl', 'MA Lighting', model, 'console', DOC, ports, weightKg=weight, powerW=None)

ma3('ma-grandma3-full-size', 'grandMA3 full-size', 2, 3, 2, 44, 300)
ma3('ma-grandma3-light', 'grandMA3 light', 2, 3, 2, 33, 300)
ma3('ma-grandma3-compact-xt', 'grandMA3 compact XT', 1, 2, 1, 20, 250)

# Processing units M, L, XL : même boîtier, nombre de paramètres différent
PU = [src('https://help.malighting.com/grandMA3/2.3/HTML/key_pu_technical_data.html', 'MA Lighting, grandMA3 Quick Manual processing units, Technical Data (v2.3)')]
for size, params in (('M', '4 096'), ('L', '8 192'), ('XL', '16 384')):
    ports = [P('ac', 'Secteur', 'in', 'power', 'powercon-true1', format='100-240 V, max. 200 VA')]
    ports += [P(f'eth{i}', f'Ethernet {i}', 'bidir', 'network', 'ethercon', format='etherCON / RJ45') for i in (1, 2)]
    ports += [P(f'dmx{i}', f'DMX {i} Out', 'out', 'dmx', 'xlr5', format='DMX512-A, XLR5 femelle') for i in range(1, 9)]
    ports += [P(f'usb{i}', f'USB {i}', 'bidir', 'control', 'usb-a', format='USB 2.0') for i in (1, 2, 3)]
    sheet(f'ma-grandma3-processing-unit-{size.lower()}', 'lightingControl', 'MA Lighting', f'grandMA3 processing unit {size} ({params} paramètres)', 'processor', PU, ports, weightKg=5, rackU=2)

# Produits de l'archive MA (grandMA2, NPU, onPC command wing, dot2) : pages « product-archive » du constructeur
ARCH = 'https://www.malighting.com/product-archive/product/'
def arch(id, model, slug, pictogram, ports, weight, va, **kw):
    sheet(id, 'lightingControl', 'MA Lighting', model, pictogram, [src(ARCH + slug + '/', f'MA Lighting, page archive {model}')],
          ports, weightKg=weight, **kw)
def dmx_out(n): return [P(f'dmx{i}', f'DMX {i} Out', 'out', 'dmx', 'xlr5', format='XLR 5 points') for i in range(1, n + 1)]
def usb(n): return [P(f'usb{i}', f'USB {i}', 'bidir', 'control', 'usb-a', format='USB, type non précisé sur la page') for i in range(1, n + 1)]
def common_in(remote):
    return [P('dmx-in', 'DMX In', 'in', 'dmx', 'xlr5', format='XLR 5 points'),
            P('smpte', 'SMPTE', 'in', 'sync', 'xlr3', format='Timecode, XLR 3 points'),
            P('midi-in', 'MIDI In', 'in', 'control', 'din5'),
            P('midi-out', 'MIDI Out', 'out', 'control', 'din5'),
            P('remote', 'Analogue Remote', 'in', 'control', remote, format='Télécommande analogique')]

for id, model, slug, nusb, kg in (('ma-grandma2-full-size', 'grandMA2 full-size', 'grandma2-full-size-120111', 5, 46),
                                  ('ma-grandma2-light', 'grandMA2 light', 'grandma2-light-120112', 5, 37),
                                  ('ma-grandma2-ultra-light', 'grandMA2 ultra-light', 'grandma2-ultra-light-120113', 4, 30)):
    ports = [P('ac', 'Secteur', 'in', 'power', 'powercon', format='powerCON, 350 VA')]
    ports += [P(f'eth{i}', f'Ethernet {i}', 'bidir', 'network', 'ethercon', format='etherCON') for i in (1, 2)]
    ports += dmx_out(6) + common_in('dsub25')
    ports += [P('sound', 'Sound In', 'in', 'audioAnalog', 'xlr3', format='Entrée son, XLR 3 points'),
              P('malink', 'MA Link', 'out', 'control', 'unspecified', format='Liaison vers grandMA2 fader wing ; connecteur non précisé')]
    ports += [P(f'dvi{i}', f'DVI {i}', 'out', 'video', 'dvi', format='Écran externe') for i in (1, 2)]
    ports += usb(nusb) + [P(f'lamp{i}', f'Lampe de pupitre {i}', 'out', 'power', 'xlr4', format='XLR 4 points') for i in (1, 2)]
    arch(id, model, slug, 'console', ports, kg, 350)

arch('ma-npu', 'MA NPU (Network Processing Unit)', 'ma-npu-network-processing-unit-130032', 'processor',
     [P('ac', 'Secteur', 'in', 'power', 'powercon', format='powerCON, 150 VA'),
      P('eth', 'Ethernet', 'bidir', 'network', 'ethercon', format='etherCON')] + dmx_out(8) + usb(3), 8.4, 150)

arch('ma-onpc-command-wing', 'MA onPC command wing', 'ma-onpc-command-wing-120120', 'console',
     [P('ac', 'Secteur', 'in', 'power', 'iec-c13', format='IEC C13/C14, 40 VA')] + dmx_out(2) + common_in('dsub15') +
     [P('usb', 'USB', 'bidir', 'control', 'unspecified', format='Liaison vers l\'ordinateur ; type de prise non précisé')], 6, 40)

arch('ma-dot2-xl-f', 'dot2 XL-F', 'dot2-xl-f-120212', 'console',
     [P('ac', 'Secteur', 'in', 'power', 'iec-c13', format='IEC C13/C14, 100 VA'),
      P('eth', 'Ethernet', 'bidir', 'network', 'ethercon', format='dot2-Net, sACN, Art-Net')] + dmx_out(4) + common_in('dsub15') +
     [P('dvi', 'DVI-D', 'out', 'video', 'dvi', format='Écran externe')] + usb(3) +
     [P('lamp', 'Lampe de pupitre', 'out', 'power', 'xlr4', format='XLR 4 points')], 9.1, 100)

print(len(written), 'fiches :', ', '.join(written))
