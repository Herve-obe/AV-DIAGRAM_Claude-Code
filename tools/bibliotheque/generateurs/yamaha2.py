from common import P, src, sheet, written
M = 'Yamaha'
Y = 'https://usa.yamaha.com/products/proaudio/mixers'
def S(path, name): return [src(f'{Y}/{path}/specs.html', f'Yamaha USA, page Specs {name}')]
U = 'unspecified'

def ins(n, connector, fmt, prefix='in', label='INPUT', phantom='supplied'):
    return [P(f'{prefix}{i}', f'{label} {i}', 'in', 'audioAnalog', connector, level='mic', phantom=phantom, format=fmt) for i in range(1, n + 1)]
def outs(n, connector, fmt, prefix='out', label='OMNI OUT'):
    return [P(f'{prefix}{i}', f'{label} {i}', 'out', 'audioAnalog', connector, level='line+4', format=fmt) for i in range(1, n + 1)]

# DM3
for model, dante in (('DM3-D', True), ('DM3 Standard', False)):
    ports = ins(12, 'xlr3', 'XLR, micro/ligne') + [P(f'in{i}', f'INPUT {i}', 'in', 'audioAnalog', 'combo', level='mic', phantom='supplied', format='Combo XLR/jack TRS') for i in range(13, 17)]
    ports += outs(8, 'xlr3', 'XLR', label='OUTPUT')
    if dante:
        ports += [P('d1', 'Dante Primary', 'bidir', 'audioIp', 'ethercon'), P('d2', 'Dante Secondary', 'bidir', 'audioIp', 'ethercon')]
    ports += [P('phones', 'Casque', 'out', 'audioAnalog', 'jack-trs', channels=2),
              P('dc', 'DC IN', 'in', 'power', 'xlr4', format='XLR 4 points ; 43 W')]
    sheet('yamaha-' + model.lower().replace(' ', '-'), 'console', M, model, 'console', S('dm3', model), ports, weightKg=6.5)

# TF
for model, n, w, pw in (('TF5', 32, 20.0, '120 W'), ('TF3', 24, 17.0, '110 W'), ('TF1', 16, 13.5, '100 W')):
    ports = ins(n, 'combo', 'Combo XLR-3-31 / jack TRS, symétrique, gain jusqu\'à +66 dB')
    ports += [P('st1', 'ST IN 1', 'in', 'audioAnalog', 'rca', level='line-10', channels=2, format='RCA stéréo'),
              P('st2', 'ST IN 2', 'in', 'audioAnalog', 'rca', level='line-10', channels=2, format='RCA stéréo')]
    ports += outs(16, 'xlr3', 'XLR-3-32, +4 dBu nominal, +24 dBu max')
    ports += [P('phones', 'PHONES', 'out', 'audioAnalog', 'jack-trs', channels=2),
              P('usb', 'USB TO HOST', 'bidir', 'audioDigital', 'usb-b', channels=34, format='34 in / 34 out'),
              P('fs', 'FOOT SW', 'in', 'control', 'jack-ts'),
              P('slot', 'Slot d\'extension', 'bidir', 'audioDigital', U, format='Carte d\'extension (connectique selon la carte)'),
              P('ac', 'Secteur', 'in', 'power', U, format=pw)]
    sheet('yamaha-' + model.lower(), 'console', M, model, 'console', S('tf', model), ports, weightKg=w)

# M7CL
for model, n, es, pw in (('M7CL-48', 48, False, '300 W'), ('M7CL-32', 32, False, '250 W'), ('M7CL-48ES', 0, True, '150 W')):
    ports = ins(n, 'xlr3', 'XLR3-31')
    if es:
        ports += ins(8, 'xlr3', 'XLR3-31', prefix='omni', label='OMNI IN')
        ports += outs(8, 'xlr3', 'XLR-3-32, +24 dBu max')
        ports += [P('es', 'EtherSound', 'bidir', 'audioIp', 'ethercon', channels=48, format='EtherSound 100Base-TX, 48 in / 24 out')]
    else:
        ports += [P(f'st{i}{c}', f'ST IN {i} {c}', 'in', 'audioAnalog', 'xlr3', level='mic', phantom='supplied', format='XLR3-31') for i in range(1, 5) for c in 'LR']
        ports += outs(16, 'xlr3', 'XLR-3-32, +24 dBu max')
        ports += [P('remote', 'REMOTE', 'bidir', 'control', 'dsub9', format='RS422, D-sub 9 mâle')]
    ports += [P('tb', 'TALKBACK', 'in', 'audioAnalog', 'xlr3', level='mic'),
              P('aes', '2TR OUT DIGITAL', 'out', 'audioDigital', 'xlr3', channels=2, format='AES/EBU'),
              P('wcin', 'WORD CLOCK IN', 'in', 'sync', 'bnc'), P('wcout', 'WORD CLOCK OUT', 'out', 'sync', 'bnc'),
              P('phones', 'PHONES', 'out', 'audioAnalog', 'jack-trs', channels=2),
              P('usb', 'USB HOST', 'bidir', 'control', 'usb-a'),
              *[P(f'my{s}', f'Slot MY {s}', 'bidir', 'audioDigital', U, format='Carte Mini-YGDAI') for s in (1, 2, 3)],
              P('ac', 'Secteur', 'in', 'power', U, format=pw)]
    sheet('yamaha-' + model.lower(), 'console', M, model, 'console', S('m7cl', model), ports)

# DM7 (la page ne donne que les nombres de ports)
for model, n_in, aes_in, aes_out, w in (('DM7', 32, 2, 2, 23.5), ('DM7 Compact', 16, 0, 1, 16.5)):
    ports = ins(n_in, U, 'Connecteur non précisé sur la page Specs')
    ports += outs(16, U, 'Connecteur non précisé sur la page Specs', label='OUTPUT')
    ports += [P(f'aesin{i}', f'AES/EBU IN {i}', 'in', 'audioDigital', U, channels=2, format='Avec SRC') for i in range(1, aes_in + 1)]
    ports += [P(f'aesout{i}', f'AES/EBU OUT {i}', 'out', 'audioDigital', U, channels=2) for i in range(1, aes_out + 1)]
    ports += [P('d1', 'Dante Primary', 'bidir', 'audioIp', U), P('d2', 'Dante Secondary', 'bidir', 'audioIp', U),
              P('wcin', 'Word Clock In', 'in', 'sync', U), P('wcout', 'Word Clock Out', 'out', 'sync', U),
              P('tc', 'TC In', 'in', 'sync', U), P('gpi', 'GPI (5 in / 5 out)', 'bidir', 'control', U),
              P('usb', 'USB TO HOST', 'bidir', 'control', 'usb-c'), P('phones', 'Casque', 'out', 'audioAnalog', U, channels=2),
              P('py', 'Slot PY', 'bidir', 'audioDigital', U, format='Carte d\'extension PY'),
              P('ac1', 'AC 1', 'in', 'power', 'iec-c13', format='V-Lock ; double alimentation'), P('ac2', 'AC 2', 'in', 'power', 'iec-c13', format='V-Lock ; double alimentation')]
    sheet('yamaha-' + model.lower().replace(' ', '-'), 'console', M, model, 'console', S('dm7', model), ports, weightKg=w)

# 01V96i (nombres seulement)
ports = ins(12, U, 'Entrée micro ; connecteur non précisé sur la page Specs')
ports += [P('st1', 'Stereo In 1', 'in', 'audioAnalog', U, channels=2), P('st2', 'Stereo In 2', 'in', 'audioAnalog', U, channels=2),
          P('2tr1', '2TR In 1', 'in', 'audioAnalog', U, channels=2), P('2tr2', '2TR In 2', 'in', 'audioAnalog', U, channels=2),
          P('stout', 'Stereo Out', 'out', 'audioAnalog', U, channels=2), P('monout', 'Monitor Out', 'out', 'audioAnalog', U, channels=2),
          *outs(4, U, 'Connecteur non précisé', label='OMNI OUT'),
          P('slot', 'Slot Mini-YGDAI', 'bidir', 'audioDigital', U, channels=16, format='16 in / 16 out'),
          P('ac', 'Secteur', 'in', 'power', U, format='90 W')]
sheet('yamaha-01v96i', 'console', M, '01V96i', 'console', S('01v96i', '01V96i'), ports, weightKg=14)
print(len(written), 'fiches Yamaha (2)')
