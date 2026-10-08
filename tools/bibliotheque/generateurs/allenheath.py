# Allen & Heath (catalogues Novelty et Audio Pro), d'après les documents constructeur.
from common import P, src, sheet, written

AH = 'https://www.allen-heath.com/content/uploads/'
sq5 = [*[P(f'in{i}', f'Mic/Line In {i}', 'in', 'audioAnalog', 'xlr3', level='mic', phantom='supplied', format='XLR symétrique, fantôme 48 V, pad -20 dB') for i in range(1, 17)],
       P('tb', 'Talkback', 'in', 'audioAnalog', 'xlr3', level='mic', phantom='supplied', format='Entrée micro d\'ordre'),
       *[P(f'st{i}', f'Stereo In {i}', 'in', 'audioAnalog', 'jack-trs', level='line+4', channels=2, format='Entrée stéréo jack 6,35 TRS') for i in (1, 2)],
       *[P(f'out{i}', f'Out {i}', 'out', 'audioAnalog', 'xlr3', level='line+4', format='Sortie affectable XLR') for i in range(1, 13)],
       *[P(f'out{i}', f'Out {i}', 'out', 'audioAnalog', 'jack-trs', level='line+4', format='Sortie affectable jack 6,35 TRS symétrique') for i in (13, 14)],
       P('aes', 'AES Out', 'out', 'audioDigital', 'xlr3', channels=2, format='AES/EBU stéréo sur XLR'),
       P('phones', 'Casque', 'out', 'audioAnalog', 'jack-trs', format='Jack 6,35 TRS'),
       P('slink', 'SLink', 'bidir', 'audioIp', 'ethercon', format='dSnake, DX ou GigaACE : stageboxes et retours ME'),
       P('ioport', 'I/O Port', 'bidir', 'audioIp', 'unspecified', channels=64, format='Carte optionnelle 64 x 64 (Dante, Waves, SLink…)'),
       P('lan', 'Network', 'bidir', 'network', 'rj45', format='Contrôle à distance (routeur, applications)'),
       P('usb-b', 'USB-B', 'bidir', 'audioDigital', 'usb-b', channels=32, format='Interface audio 32 x 32, USB 2.0'),
       P('usb-a', 'USB-A', 'bidir', 'control', 'usb-a', format='Enregistrement et lecture, sauvegardes'),
       P('fs', 'Footswitch', 'in', 'control', 'jack-trs', format='Pédale simple ou double'),
       P('ac', 'Secteur', 'in', 'power', 'iec-c13', format='IEC 3 points, 100-240 V')]
sheet('allen-heath-sq-5', 'console', 'Allen & Heath', 'SQ-5', 'console',
      [src(AH + '2023/05/SQ-5-Technical-Datasheet_G.pdf', 'Allen & Heath, SQ-5 Technical Datasheet issue G')], sq5, powerW=75, weightKg=10.5)

# Xone:92 : manuel du Xone:92 Mk2 (2024) ; le catalogue indique « Xone92 » sans préciser la version
x92 = [*[P(f'mic{i}', f'MIC {i}', 'in', 'audioAnalog', 'xlr3', level='mic', format='XLR symétrique') for i in (1, 2)],
       *[P(f'rtn{i}', f'Line Return {i}', 'in', 'audioAnalog', 'jack-trs', level='line-10', channels=2, format='Jack 6,35 TRS (G et D)') for i in (1, 2)],
       *[P(f'phono{i}', f'Phono {i}', 'in', 'audioAnalog', 'rca', level='line-10', channels=2, format='RCA, platine (RIAA)') for i in range(1, 5)],
       *[P(f'line{i}', f'Line {i}', 'in', 'audioAnalog', 'rca', level='line-10', channels=2, format='RCA') for i in range(1, 5)],
       P('mix1', 'Mix 1 Out', 'out', 'audioAnalog', 'xlr3', level='line+4', channels=2, format='XLR symétrique, sortie principale'),
       P('mix2', 'Mix 2 Out', 'out', 'audioAnalog', 'jack-trs', channels=2, format='Jack TRS impédance symétrique'),
       P('booth', 'Booth Out', 'out', 'audioAnalog', 'jack-trs', channels=2, format='Jack TRS, retour cabine'),
       *[P(f'aux{i}', f'Aux {i} Out', 'out', 'audioAnalog', 'jack-trs', channels=2, format='Jack TRS') for i in (1, 2)],
       P('rec', 'Record Out', 'out', 'audioAnalog', 'rca', level='line-10', channels=2, format='RCA, pré-master'),
       P('midi', 'MIDI Out', 'out', 'control', 'din5'),
       P('ac', 'Secteur', 'in', 'power', 'iec-c13', format='IEC, 100-240 V')]
sheet('allen-heath-xone-92', 'console', 'Allen & Heath', 'Xone:92', 'console',
      [src(AH + '2024/10/Xone92-Mk2-User-Guide.pdf', 'Allen & Heath, XONE:92 Mk2 User Guide (2024)')], x92, status='community', powerW=30, weightKg=7)

print(len(written), 'fiches :', ', '.join(written))
