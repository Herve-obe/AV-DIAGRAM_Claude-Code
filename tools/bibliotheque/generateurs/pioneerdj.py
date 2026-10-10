# Pioneer DJ (AlphaTheta) : lecteurs CDJ, mélangeurs DJM, RMX-1000, platine PLX-1000.
# Sources : modes d'emploi AlphaTheta (downloads.support.alphatheta.com), section Specifications.
from common import P, src, sheet
M = 'Pioneer DJ'
B = 'https://downloads.support.alphatheta.com/manuals/'
def R(path, doc): return [src(B + path, doc)]
def rca(id, name, d='in', level='line-10', fmt=None, ch=2): return P(id, name, d, 'audioAnalog', 'rca', level=level, channels=ch, format=fmt)
def coax(id, name, d='in'): return P(id, name, d, 'audioDigital', 'rca', channels=2, format='S/PDIF coaxial')
def link(id='link', name='LINK', fmt='PRO DJ LINK'): return P(id, name, 'bidir', 'network', 'rj45', format=fmt)
def ac(fmt=None): return P('ac', 'Secteur', 'in', 'power', 'unspecified', format=fmt)

def cdj(id, model, path, doc, w, link_fmt, extra=()):
    sheet(id, 'recording', M, model, 'recorder', R(path, doc),
          [rca('outL', 'Audio Out L/R', 'out', fmt='RCA (paire L/R)'),
           coax('dig', 'Digital Out', 'out'),
           P('usbA', 'USB (clé, disque)', 'in', 'control', 'usb-a', format='Support de musique'),
           P('usbB', 'USB (ordinateur)', 'bidir', 'control', 'usb-b', format='Contrôleur / interface audio pour logiciel DJ'),
           link(fmt=link_fmt), *extra, ac()], weightKg=w)
cdj('pioneerdj-cdj-3000', 'CDJ-3000', 'dj-players/CDJ-3000/CDJ-3000_DRI1586A_manual.pdf', 'Pioneer DJ, mode d\'emploi CDJ-3000 (DRI1586A)', 5.5,
    'PRO DJ LINK, 1000BASE-T')
cdj('pioneerdj-cdj-2000nxs2', 'CDJ-2000NXS2', 'dj-players/CDJ-2000NXS2/CDJ-2000NXS2_DRH1322B_quickstart-manual.pdf',
    'Pioneer DJ, guide de démarrage CDJ-2000NXS2 (DRH1322B)', 5.7, 'PRO DJ LINK, 100BASE-TX')
cdj('pioneerdj-cdj-2000nxs', 'CDJ-2000NXS', 'dj-players/CDJ-2000NXS/CDJ-2000NXS_DRI1052_manual.pdf', 'Pioneer DJ, mode d\'emploi CDJ-2000NXS (DRI1052)', 4.7,
    'PRO DJ LINK, 100BASE-TX', [P('ctrl', 'Control', 'bidir', 'control', 'minijack', format='Fader start avec mélangeur Pioneer')])

def mixer(id, model, path, doc, w, phono, line, returns, digin, extra):
    ports = [rca(f'phono{i}', f'Phono {i}', level='phono', fmt='RCA, niveau phono') for i in range(1, phono + 1)]
    ports += [rca(f'line{i}', f'Line {i}', fmt='RCA') for i in range(1, line + 1)]
    ports += [coax(f'digIn{i}', f'Digital In {i}') for i in range(1, digin + 1)]
    ports += [P('mic1', 'Mic 1', 'in', 'audioAnalog', 'combo', level='mic', format='XLR / jack 6,35 TRS'),
              P('masterL', 'Master Out L', 'out', 'audioAnalog', 'xlr3', level='line+4', format='XLR symétrique'),
              P('masterR', 'Master Out R', 'out', 'audioAnalog', 'xlr3', level='line+4', format='XLR symétrique'),
              rca('masterRca', 'Master Out (RCA)', 'out', fmt='Asymétrique'),
              P('booth', 'Booth Out', 'out', 'audioAnalog', 'jack-trs', level='line+4', channels=2, format='Jack 6,35 TRS (L/R)'),
              rca('rec', 'Rec Out', 'out')]
    for i in range(1, returns + 1):
        s = '' if returns == 1 else f' {i}'
        ports += [P(f'send{i}', f'Send{s}', 'out', 'audioAnalog', 'jack-ts', channels=2, format='Jack 6,35 TS (L/R)'),
                  P(f'return{i}', f'Return{s}', 'in', 'audioAnalog', 'jack-ts', channels=2, format='Jack 6,35 TS (L/R)')]
    ports += extra + [link(), ac()]
    sheet(id, 'console', M, model, 'console', R(path, doc), ports, weightKg=w)

phones2 = [P('phones1', 'Phones 1', 'out', 'audioAnalog', 'jack-trs', channels=2, format='Jack 6,35 et mini-jack 3,5'),
           P('phones2', 'Phones 2', 'out', 'audioAnalog', 'jack-trs', channels=2, format='Jack 6,35 et mini-jack 3,5')]
mixer('pioneerdj-djm-a9', 'DJM-A9', 'mixers/DJM-A9/DJM-A9_DRI1785B_manual.pdf', 'Pioneer DJ, mode d\'emploi DJM-A9 (DRI1785B)', 10.2, 4, 4, 1, 4,
      [P('mic2', 'Mic 2', 'in', 'audioAnalog', 'jack-trs', level='mic'), coax('digOut', 'Digital Master Out', 'out'), *phones2,
       P('usbA', 'USB A', 'in', 'control', 'usb-a'),
       P('usbB1', 'USB 1', 'bidir', 'audioDigital', 'usb-c', format='Interface audio ordinateur'),
       P('usbB2', 'USB 2', 'bidir', 'audioDigital', 'usb-c', format='Interface audio ordinateur')])
mixer('pioneerdj-djm-v10', 'DJM-V10', 'mixers/DJM-V10/DJM-V10_DRI1643C_manual.pdf', 'Pioneer DJ, mode d\'emploi DJM-V10 (DRI1643C)', 11.9, 4, 6, 3, 6,
      [P('mic2', 'Mic 2', 'in', 'audioAnalog', 'jack-trs', level='mic'),
       P('digOut', 'Digital Master Out', 'out', 'audioDigital', 'xlr3', channels=2, format='AES/EBU'),
       P('midi', 'MIDI Out', 'out', 'control', 'din5', format='MIDI'), *phones2,
       P('usbA', 'USB A', 'in', 'control', 'usb-a'),
       P('usbB1', 'USB 1', 'bidir', 'audioDigital', 'usb-b', format='Interface audio ordinateur'),
       P('usbB2', 'USB 2', 'bidir', 'audioDigital', 'usb-b', format='Interface audio ordinateur')])
mixer('pioneerdj-djm-900nxs2', 'DJM-900NXS2', 'mixers/DJM-900NXS2/DJM-900NXS2_DRH1330C_quickstart-manual.pdf',
      'Pioneer DJ, guide de démarrage DJM-900NXS2 (DRH1330C)', 8.0, 4, 4, 1, 4,
      [P('mic2', 'Mic 2', 'in', 'audioAnalog', 'jack-trs', level='mic'), coax('digOut', 'Digital Master Out', 'out'),
       P('phones', 'Phones', 'out', 'audioAnalog', 'jack-trs', channels=2),
       P('usbB', 'USB', 'bidir', 'audioDigital', 'usb-b', format='Interface audio ordinateur')])
mixer('pioneerdj-djm-2000nxs', 'DJM-2000NXS', 'mixers/DJM-2000NXS/DJM-2000NXS_DRB1635A_manual.pdf', 'Pioneer DJ, mode d\'emploi DJM-2000NXS (DRB1635A)', 8.6, 2, 2, 1, 4,
      [*[rca(f'cd{i}', f'CD {i}', fmt='RCA') for i in range(1, 5)], coax('digOut', 'Digital Out', 'out'),
       P('midi', 'MIDI Out', 'out', 'control', 'din5', format='MIDI'),
       P('phones', 'Phones', 'out', 'audioAnalog', 'jack-trs', channels=2),
       P('usbB', 'USB', 'bidir', 'audioDigital', 'usb-b', format='Interface audio ordinateur'),
       P('ctrl', 'Control', 'bidir', 'control', 'minijack', format='2 mini-jacks 3,5 (fader start)')])

sheet('pioneerdj-rmx-1000', 'processing', M, 'RMX-1000', 'processor', R('effectors/RMX-1000/RMX-1000_DRB1587D_manual.pdf', 'Pioneer DJ, mode d\'emploi RMX-1000 (DRB1587D)'),
      [rca('in', 'Input L (Mono) / R', fmt='RCA ou jack 6,35 (n\'en brancher qu\'un) ; niveau -10 dB / +4 dB commutable', level=None),
       rca('out', 'Output L / R', 'out', fmt='RCA ou jack 6,35 ; niveau -10 dB / +4 dB commutable', level=None),
       P('usb', 'USB', 'bidir', 'control', 'usb-b', format='Ordinateur (logiciel RMX-1000)'),
       P('dc', 'DC In', 'in', 'power', 'dc-barrel', format='Adaptateur secteur 5 V')], weightKg=1.3)

sheet('pioneerdj-plx-1000', 'recording', M, 'PLX-1000', 'recorder',
      [src('https://www.pioneermalaysia.com/turntable/plx-1000-professional-direct-drive-turntable.html', 'Pioneer Malaysia, fiche PLX-1000 (distributeur)'),
       src('https://www.pioneerdj.com/en-us/news/2014/plx-1000/', 'Pioneer DJ, annonce PLX-1000 (2014)')],
      [rca('out', 'Phono Out L/R', 'out', level='phono', fmt='RCA plaqué or, niveau phono (cellule)'),
       ac('Câble secteur ; AC 110-120 / 220-240 V, 9 W')], status='community', powerW=9, weightKg=14.6)
