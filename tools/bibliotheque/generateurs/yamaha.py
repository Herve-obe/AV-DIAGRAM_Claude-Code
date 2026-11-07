from common import P, src, sheet, written
M = 'Yamaha'
Y = 'https://usa.yamaha.com/products/proaudio'
def S(path, name): return [src(f'{Y}/{path}', f'Yamaha USA, page Specs {name}')]

def console(id, model, path, n_in, n_out, weight, power, my_slots, extra=()):
    ports = [P(f'in{i}', f'{"OMNI IN" if n_in == 8 else "INPUT"} {i}', 'in', 'audioAnalog', 'xlr3', level='mic', phantom='supplied', format='XLR-3-31, symétrique ; gain jusqu\'à +66 dB') for i in range(1, n_in + 1)]
    ports += [P(f'out{i}', f'OMNI OUT {i}', 'out', 'audioAnalog', 'xlr3', level='line+4', format='XLR-3-32, symétrique, +4 dBu nominal, +24 dBu max') for i in range(1, n_out + 1)]
    ports += [
        P('tb', 'TALKBACK', 'in', 'audioAnalog', 'xlr3', level='mic', format='XLR-3-31, micro d\'ordre') if n_in == 8 else None,
        P('dante1', 'Dante Primary', 'bidir', 'audioIp', 'ethercon', channels=64 if model != 'QL1' else 32, format='Dante 1000Base-T, etherCON Cat5e'),
        P('dante2', 'Dante Secondary', 'bidir', 'audioIp', 'ethercon', channels=64 if model != 'QL1' else 32, format='Redondance Dante'),
        P('aes', 'DIGITAL OUT', 'out', 'audioDigital', 'xlr3', channels=2, format='AES/EBU, XLR-3-32'),
        P('wcin', 'WORD CLOCK IN', 'in', 'sync', 'bnc', format='TTL, 75 Ω terminé'),
        P('wcout', 'WORD CLOCK OUT', 'out', 'sync', 'bnc', format='TTL, 75 Ω'),
        P('midiin', 'MIDI IN', 'in', 'control', 'din5'),
        P('midiout', 'MIDI OUT', 'out', 'control', 'din5'),
        P('gpi', 'GPI (5 in / 5 out)', 'bidir', 'control', 'dsub15', format='D-Sub 15 femelle'),
        P('eth', 'NETWORK', 'bidir', 'network', 'rj45', format='Ethernet (contrôle)'),
        P('phones', 'PHONES', 'out', 'audioAnalog', 'jack-trs', channels=2, format='Jack stéréo'),
        P('ac', 'AC IN', 'in', 'power', 'iec-c13', format='Embase IEC à verrouillage V-Lock ; ' + power),
    ]
    ports = [p for p in ports if p]
    for s in range(1, my_slots + 1):
        ports.append(P(f'my{s}', f'Slot MY {s}', 'bidir', 'audioDigital', 'unspecified', format='Emplacement pour carte Mini-YGDAI (connectique selon la carte)'))
    ports += list(extra)
    sheet(id, 'console', M, model, 'console', S(path, model), ports, weightKg=weight)

CL = 'mixers/cl_series/specs.html'
QL = 'mixers/ql_series/specs.html'
console('yamaha-cl5', 'CL5', CL, 8, 8, 36, '170 W (200 W avec PW800W)', 3)
console('yamaha-cl3', 'CL3', CL, 8, 8, 29, '170 W (200 W avec PW800W)', 3)
console('yamaha-cl1', 'CL1', CL, 8, 8, 24, '170 W (200 W avec PW800W)', 3)
console('yamaha-ql5', 'QL5', QL, 32, 16, 21.8, '200 W', 2)
console('yamaha-ql1', 'QL1', QL, 16, 8, 14.7, '135 W', 2)

R = 'interfaces/r_series_adda_2/specs.html'
def rio(id, model, n_in, n_out, weight, power, aes):
    ports = [P(f'in{i}', f'INPUT {i}', 'in', 'audioAnalog', 'xlr3', level='mic', phantom='supplied', format='XLR-3-31, symétrique ; gain jusqu\'à +66 dB') for i in range(1, n_in + 1)]
    ports += [P(f'out{i}', f'OUTPUT {i}', 'out', 'audioAnalog', 'xlr3', level='line+4', format='XLR-3-32, symétrique, +24 dBu max') for i in range(1, n_out + 1)]
    if aes:
        ports.append(P('aes', 'AES/EBU OUT 1-8', 'out', 'audioDigital', 'xlr3', channels=8, format='AES/EBU, XLR-3-32 ; répartition des canaux par connecteur : voir le manuel'))
    ports += [P('dante1', 'Dante Primary', 'bidir', 'audioIp', 'ethercon', channels=n_in, format=f'Dante 1000Base-T, {n_in} canaux émis'),
              P('dante2', 'Dante Secondary', 'bidir', 'audioIp', 'ethercon', channels=n_in, format='Redondance ou chaînage'),
              P('ac', 'AC IN', 'in', 'power', 'unspecified', format=f'{power} ; double alimentation intégrée d\'après Yamaha')]
    sheet(id, 'stagebox', M, model, 'stagebox', S(R, model), ports, weightKg=weight, rackU=None)

rio('yamaha-rio3224-d2', 'Rio3224-D2', 32, 16, 13.5, '120 W', True)
rio('yamaha-rio1608-d2', 'Rio1608-D2', 16, 8, 9.6, '72 W', False)

X = 'power_amps/xmv/specs.html'
def xmv(model, ch, dante, weight, power):
    id = 'yamaha-' + model.lower()
    ports = [P('in1', 'Entrées 1-4 (Euroblock 6P)', 'in', 'audioAnalog', 'terminal', level='line+4', channels=4, format='Euroblock 6 points, symétrique')]
    if ch == 8:
        ports.append(P('in2', 'Entrées 5-8 (Euroblock 6P)', 'in', 'audioAnalog', 'terminal', level='line+4', channels=4, format='Euroblock 6 points, symétrique'))
    else:
        ports[0]['name'] = 'Entrées (Euroblock 6P, x 2)'
    if dante:
        ports += [P('d1', 'Dante Primary', 'bidir', 'audioIp', 'rj45', format='RJ45 ; réseau de contrôle partagé'),
                  P('d2', 'Dante Secondary', 'bidir', 'audioIp', 'rj45', format='Redondance Dante')]
    else:
        ports += [P('ydin', 'YDIF IN', 'in', 'audioDigital', 'rj45', format='YDIF'),
                  P('ydout', 'YDIF OUT', 'out', 'audioDigital', 'rj45', format='YDIF'),
                  P('net', 'NETWORK', 'bidir', 'network', 'rj45', format='Ethernet (contrôle)')]
    ports += [P('rem', 'Remote / Fault Output', 'bidir', 'control', 'terminal', format='Euroblock 3 points'),
              P('spk', f'Sorties HP 1-{ch}', 'out', 'audioAnalog', 'unspecified', level='speaker', channels=ch, format='Connecteur de sortie non précisé sur la page Specs'),
              P('ac', 'AC IN', 'in', 'power', 'unspecified', format=power)]
    sheet(id, 'amplification', M, model, 'amp', S(X, model), ports, weightKg=weight)
xmv('XMV4280-D', 4, True, 8.1, '250 W au 1/8 de puissance (4 Ω)')
xmv('XMV4280', 4, False, 8.1, '250 W au 1/8 de puissance (4 Ω)')
xmv('XMV4140-D', 4, True, 8.1, '150 W au 1/8 de puissance (4 Ω)')
xmv('XMV4140', 4, False, 8.1, '150 W au 1/8 de puissance (4 Ω)')
xmv('XMV8280-D', 8, True, 10.1, '450 W au 1/8 de puissance (4 Ω)')
xmv('XMV8280', 8, False, 10.1, '450 W au 1/8 de puissance (4 Ω)')
xmv('XMV8140-D', 8, True, 10.1, '250 W au 1/8 de puissance (4 Ω)')
xmv('XMV8140', 8, False, 10.1, '250 W au 1/8 de puissance (4 Ω)')

PC = 'power_amps/pc-d_di/specs.html'
def pcd(model, di, weight, power):
    id = 'yamaha-' + model.lower()
    if di:
        ins = [P('in', 'Entrées 1-4 (Euroblock 6P, x 2)', 'in', 'audioAnalog', 'terminal', level='line+4', channels=4, format='2 Euroblock 6 points, 4 canaux symétriques')]
        net = 'rj45'
        outs = [P('spk', 'Sorties HP (Euroblock 8P)', 'out', 'audioAnalog', 'terminal', level='speaker', channels=4, format='Euroblock 7,62 mm 8 points ; basse ou haute impédance')]
    else:
        ins = [P(f'in{i}', f'Entrée {i}', 'in', 'audioAnalog', 'xlr3', level='line+4', format='XLR-3-31') for i in range(1, 5)]
        net = 'ethercon'
        outs = [P(f'spk{i}', f'Sortie HP {i}', 'out', 'audioAnalog', 'speakon-nl4', level='speaker', format='Neutrik speakON NL4') for i in range(1, 5)]
    ports = ins + [P('d1', 'Dante Primary', 'bidir', 'audioIp', net, channels=16, format='Dante 16 in / 16 out'),
                   P('d2', 'Dante Secondary', 'bidir', 'audioIp', net, channels=16, format='Redondance ou chaînage'),
                   P('ctl', 'Contrôle', 'bidir', 'network', 'rj45', format='RJ45'),
                   P('gpio', 'GPIO', 'bidir', 'control', 'terminal', format='Mini-Euroblock 3,5 mm 8 points x 2')] + outs + [
                   P('ac', 'AC IN', 'in', 'power', 'unspecified', format=power)]
    sheet(id, 'amplification', M, model, 'amp', S(PC, model), ports, weightKg=weight)
pcd('PC412-D', False, 16.0, '1850 W au 1/8 de puissance max (2 Ω)')
pcd('PC406-D', False, 15.6, '1050 W au 1/8 de puissance max (2 Ω)')
pcd('PC412-DI', True, 16.0, '1850 W au 1/8 de puissance max (2 Ω)')
pcd('PC406-DI', True, 15.9, '1100 W au 1/8 de puissance max (2 Ω)')
print(len(written), 'fiches Yamaha')
