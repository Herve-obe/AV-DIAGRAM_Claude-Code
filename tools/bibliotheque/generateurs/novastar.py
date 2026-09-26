# Contrôleurs d'écran LED NovaStar (catalogue Novelty), d'après les fiches de spécifications NovaStar.
from common import P, src, sheet, written

O = 'https://oss.novastar.tech/uploads/'
def S(path, name): return [src(O + path, f'NovaStar, {name}')]
def eth(n, conn='rj45', note='Gigabit, vers les cartes de réception LED'):
    return [P(f'out{i}', f'Ethernet {i}', 'out', 'videoIp', conn, format=note) for i in range(1, n + 1)]
def ac(): return P('ac', 'Secteur', 'in', 'power', 'unspecified', format='100-240 V, 50/60 Hz ; connecteur non précisé')
def ctl(id, model, sources, ports, **kw):
    sheet(id, 'display', 'NovaStar', model, 'processor', sources, ports, domain='image', **kw)

ctl('novastar-mctrl660', 'MCTRL660', S('2021/12/MCTRL660-LED-Display-Controller-Specifications-V1.4.3.pdf', 'MCTRL660 Specifications V1.4.3'), [
    P('dvi-in', 'DVI In', 'in', 'video', 'dvi', format='Single-link DVI, jusqu\'à 1920 x 1200 à 60 Hz'),
    P('hdmi-in', 'HDMI In', 'in', 'video', 'hdmi', format='HDMI 1.3, HDCP 1.4'),
    P('audio', 'Audio In', 'in', 'audioAnalog', 'unspecified', format='Entrée audio (connecteur non précisé)'),
    *eth(4, note='Gigabit, 650 000 pixels par port, redondance possible'),
    P('hdmi-out', 'HDMI Out', 'out', 'video', 'hdmi', format='Cascade'),
    P('dvi-out', 'DVI Out', 'out', 'video', 'dvi', format='Cascade'),
    P('usb', 'USB', 'bidir', 'control', 'usb-b', format='USB 2.0 type B vers PC'),
    P('uart-in', 'UART In', 'in', 'control', 'unspecified', format='Cascade (jusqu\'à 20 appareils)'),
    P('uart-out', 'UART Out', 'out', 'control', 'unspecified', format='Cascade'),
    ac()], powerW=16, weightKg=3.6)

ctl('novastar-mctrl4k', 'MCTRL4K', S('2024/11/MCTRL4K-LED-Display-Controller-Specifications-V1.2.1.pdf', 'MCTRL4K Specifications V1.2.1'), [
    P('dp-in', 'DP In', 'in', 'video', 'displayport', format='DisplayPort 1.2, jusqu\'à 4096 x 2160 à 60 Hz'),
    P('hdmi-in', 'HDMI In', 'in', 'video', 'hdmi', format='HDMI 2.0, HDCP 1.4 et 2.2'),
    P('dvi-in1', 'Dual DVI-D1', 'in', 'video', 'dvi', format='Dual-link DVI'),
    P('dvi-in2', 'Dual DVI-D2', 'in', 'video', 'dvi', format='Dual-link DVI'),
    *eth(16, 'ethercon', 'Gigabit, Neutrik NE8FBH'),
    *[P(f'opt{i}', f'OPT {i}', 'out', 'videoIp', 'unspecified', format='Port fibre optique (OPT2 transporte les ports 9 à 16)') for i in range(1, 5)],
    P('lan', 'Ethernet (contrôle)', 'bidir', 'network', 'rj45', format='Ordinateur de contrôle'),
    P('usb-in', 'USB In', 'in', 'control', 'unspecified', format='Cascade'),
    P('usb-out', 'USB Out', 'out', 'control', 'usb-a', format='USB 2.0 type A ; cascade jusqu\'à 10 appareils'),
    P('genlock', 'Genlock In-Loop', 'in', 'sync', 'unspecified', format='Signal de synchronisation'),
    ac()], weightKg=4.6)

ctl('novastar-vx6s', 'VX6s', S('2019/11/VX6s-All-in-One-Controller-Specifications-V1.3.0.pdf', 'VX6s Specifications V1.3.0'), [
    *[P(f'sdi-in{i}', f'3G-SDI In {i}', 'in', 'video', 'bnc', format='Jusqu\'à 1920 x 1080 à 60 Hz, progressif et entrelacé') for i in (1, 2)],
    *[P(f'dvi-in{i}', f'DVI In {i}', 'in', 'video', 'dvi', format='Jusqu\'à 1920 x 1200 à 60 Hz, HDCP') for i in (1, 2)],
    P('dvi-loop', 'DVI Loop', 'out', 'video', 'dvi', format='Bouclage DVI'),
    *[P(f'hdmi-in{i}', f'HDMI In {i}', 'in', 'video', 'hdmi', format='HDMI 1.3, HDCP') for i in (1, 2)],
    *[P(f'usb-play{i}', f'USB {i}', 'bidir', 'control', 'usb-a', format='Lecture sur clé USB, souris ou clavier') for i in (1, 2)],
    *eth(6),
    P('dvi-mon', 'DVI Monitor', 'out', 'video', 'dvi', format='Sortie de contrôle (prévisualisation)'),
    P('lan', 'Ethernet (contrôle)', 'bidir', 'network', 'rj45', format='PC ou réseau'),
    P('usb-pc', 'USB (PC)', 'bidir', 'control', 'unspecified', format='Contrôle depuis un PC'),
    P('usb-cascade', 'USB (cascade)', 'out', 'control', 'unspecified', format='Cascade'),
    ac()], powerW=65, weightKg=2.71)

ctl('novastar-vx1000', 'VX1000', S('2024/07/VX1000-All-in-One-Controller-Specifications-V1.6.0.pdf', 'VX1000 Specifications V1.6.0'), [
    P('sdi-in', '3G-SDI In', 'in', 'video', 'bnc', format='3G/HD/SD-SDI, désentrelacement ; bouclage 3G-SDI'),
    *[P(f'hdmi-in{i}', f'HDMI In {i}', 'in', 'video', 'hdmi', format='HDMI 1.4, HDCP 1.4') for i in (1, 2)],
    *[P(f'dvi-in{i}', f'DVI In {i}', 'in', 'video', 'dvi', format='DVI (HDMI 1.4)') for i in (1, 2)],
    *eth(10, note='Gigabit ; ports 1 et 2 avec sortie audio'),
    P('hdmi-mon', 'HDMI Out', 'out', 'video', 'hdmi', format='HDMI 1.3'),
    *[P(f'opt{i}', f'OPT {i}', 'out', 'videoIp', 'unspecified', format='Fibre 10G (OPT2 copie ou secourt les 10 ports Ethernet)') for i in (1, 2)],
    P('lan', 'Ethernet (contrôle)', 'bidir', 'network', 'rj45', format='PC ou routeur'),
    *[P(f'usb{i}', f'USB {i}', 'bidir', 'control', 'unspecified') for i in (1, 2)],
    P('genlock', 'Genlock In-Loop', 'in', 'sync', 'unspecified', format='Synchro externe'),
    P('sensor', 'Capteur de lumière', 'in', 'control', 'unspecified', format='Capteur de luminosité ambiante'),
    ac()], powerW=35, weightKg=4)

print(len(written), 'fiches :', ', '.join(written))
