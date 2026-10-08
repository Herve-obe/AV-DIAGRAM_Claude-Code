# Image : contrôleurs de mur d'images et divers (catalogue Novelty).
from common import P, src, sheet, written

# Datapath Fx4 : page produit (entrées, Ethernet, synchro, bouclage) ; sorties HDMI selon la désignation Novelty « FX4-H »
# (le Fx4 existe en version à 4 sorties HDMI 1.3 ou 4 sorties DisplayPort 1.1)
sheet('datapath-fx4-h', 'videoRouting', 'Datapath', 'Fx4 (version sorties HDMI)', 'router',
      [src('https://www.datapath.co.uk/datapath-products/video-wall-controllers/datapath-fx4/', 'Datapath, page produit Fx4')], [
    P('dp-in', 'DisplayPort In', 'in', 'video', 'displayport', format='DisplayPort 1.2, jusqu\'à 4096 x 2160 à 60 i/s'),
    P('hdmi-in1', 'HDMI In 1', 'in', 'video', 'hdmi', format='HDMI 1.4'),
    P('hdmi-in2', 'HDMI In 2', 'in', 'video', 'hdmi', format='HDMI 1.4'),
    *[P(f'out{i}', f'Sortie {i}', 'out', 'video', 'hdmi', format='HDMI 1.3, sorties synchronisées (genlock)') for i in range(1, 5)],
    P('loop', 'DP Loop-through', 'out', 'video', 'displayport', format='DisplayPort 1.2, chaînage de plusieurs Fx4'),
    P('sync', 'Sync', 'in', 'sync', 'bnc', format='Synchronisation avec un matériel tiers'),
    P('eth1', 'Ethernet 1', 'bidir', 'network', 'rj45', format='Réseau ; bouclage Ethernet sur le second port'),
    P('eth2', 'Ethernet 2', 'bidir', 'network', 'rj45', format='Bouclage Ethernet'),
    P('usb', 'USB', 'bidir', 'control', 'usb-b', format='USB 2.0 type B'),
    P('ac', 'Secteur', 'in', 'power', 'iec-c13', format='Embase IEC avec interrupteur et fusible, 100-240 V'),
], powerW=35)

# Epson EB-PU2220B (vidéoprojecteur laser 20 000 lm)
EP = [src('https://files.support.epson.com/pdf/specs/specifications_ebpu2220series_en_r103.pdf', 'Epson, Specifications EB-PU2220 series, Rev.D')]
sheet('epson-eb-pu2220b', 'display', 'Epson', 'EB-PU2220B', 'projector', EP, [
    P('vga', 'Computer', 'in', 'video', 'vga', format='Mini D-Sub 15 points'),
    P('hdmi', 'HDMI', 'in', 'video', 'hdmi', format='HDCP 2.3'),
    P('dvi', 'DVI-D', 'in', 'video', 'dvi', format='DVI-D 24 points single link, HDCP 1.4'),
    P('hdbaset', 'HDBaseT', 'in', 'video', 'rj45', format='HDBaseT, câble réseau jusqu\'à 100 m, HDCP 2.3'),
    P('sdi-in', 'SDI In', 'in', 'video', 'bnc', format='SDI'),
    P('sdi-out', 'SDI Out', 'out', 'video', 'bnc', format='Recopie de l\'entrée SDI'),
    P('aout', 'Audio Out', 'out', 'audioAnalog', 'minijack', format='Mini-jack stéréo'),
    P('rs232', 'RS-232C', 'bidir', 'control', 'dsub9', format='Mini D-Sub 9 points mâle'),
    P('remote', 'Remote', 'in', 'control', 'minijack', format='Télécommande filaire, mini-jack stéréo'),
    P('usb-a', 'USB-A', 'bidir', 'control', 'usb-a', format='Lecture de contenu ; alimentation jusqu\'à 5 V / 2 A'),
    P('service', 'Service', 'bidir', 'control', 'usb-b', format='USB type B, maintenance'),
    P('lan', 'LAN', 'bidir', 'network', 'rj45', format='100BASE-TX / 10BASE-T'),
    P('ac', 'Secteur', 'in', 'power', 'unspecified', format='Cordon 200 V (100 V possible avec luminosité réduite) ; embase non précisée'),
], domain='image', powerW=1301, weightKg=24.4)

print(len(written), 'fiches :', ', '.join(written))
