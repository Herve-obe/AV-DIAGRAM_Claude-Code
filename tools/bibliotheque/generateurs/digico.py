from common import P, src, sheet, written
M = 'DiGiCo'
U = 'unspecified'
def S(path, name): return [src(f'https://digico.biz/{path}/', f'DiGiCo, page produit {name}')]
ports = [P(f'in{i}', f'Mic/Line In {i}', 'in', 'audioAnalog', U, level='mic', format='Entrée locale micro/ligne ; connecteur non précisé') for i in range(1, 9)]
ports += [P(f'out{i}', f'Line Out {i}', 'out', 'audioAnalog', U, level='line+4', format='Sortie locale ; connecteur non précisé') for i in range(1, 9)]
ports += [P(f'aesin{i}', f'AES In {i}', 'in', 'audioDigital', U, format='AES/EBU mono') for i in range(1, 9)]
ports += [P(f'aesout{i}', f'AES Out {i}', 'out', 'audioDigital', U, format='AES/EBU mono') for i in range(1, 9)]
for i in (1, 2):
    ports += [P(f'madiin{i}', f'MADI {i} In', 'in', 'audioDigital', 'bnc', format='MADI 75 Ω BNC ; interface redondante'),
              P(f'madiout{i}', f'MADI {i} Out', 'out', 'audioDigital', 'bnc', format='MADI 75 Ω BNC ; interface redondante')]
ports += [P('optics', 'Optics (Optocore)', 'bidir', 'audioDigital', U, format='Boucle optique Optocore, standard'),
          P('midiin', 'MIDI In', 'in', 'control', 'din5'), P('midiout', 'MIDI Out', 'out', 'control', 'din5'), P('midithru', 'MIDI Thru', 'out', 'control', 'din5'),
          P('vga', 'VGA', 'out', 'video', 'vga', format='DB-15, 1024 x 768'),
          *[P(f'usb{i}', f'USB {i}', 'bidir', 'control', 'usb-a', format='USB 2') for i in (1, 2, 3)],
          P('lamp1', 'Lampe 1', 'out', 'power', 'xlr3', format='1,2 à 12 V'), P('lamp2', 'Lampe 2', 'out', 'power', 'xlr3', format='1,2 à 12 V'),
          P('sync', 'Ext Sync', 'in', 'sync', U, format='Word clock, AES, MADI ou optique'),
          P('phones', 'Casque', 'out', 'audioAnalog', 'jack-trs', channels=2, format='Jack 6,35 TRS, 8-600 Ω'),
          P('gpio1', 'GPIO 1', 'bidir', 'control', 'multipin', format='D-Sub 37'), P('gpio2', 'GPIO 2', 'bidir', 'control', 'multipin', format='D-Sub 37'),
          P('ac', 'Secteur', 'in', 'power', U, format='90-264 V, 47-63 Hz, 235 W')]
sheet('digico-sd10', 'console', M, 'SD10', 'console', S('consoles/sd10', 'SD10'), ports, weightKg=60, powerW=235)
ports = [P(f'slot{i}', f'Slot {i}', 'bidir', 'audioAnalog', U, channels=4, format='Carte d\'E/S interchangeable (analogique, AES, AES-42…)') for i in range(1, 15)]
ports += [P('madi1', 'MADI 1', 'bidir', 'audioDigital', U, format='MADI, 56 canaux redondants à 48 kHz'),
          P('madi2', 'MADI 2', 'bidir', 'audioDigital', U, format='MADI'),
          P('optics', 'Optocore', 'bidir', 'audioDigital', U, format='Liaison fibre optionnelle'),
          P('ac', 'Secteur', 'in', 'power', U, format='Alimentation remplaçable à chaud')]
sheet('digico-sd-rack', 'stagebox', M, 'SD-Rack', 'stagebox', S('racks/sd-rack', 'SD-Rack'), ports)
print(len(written), 'fiches DiGiCo')
