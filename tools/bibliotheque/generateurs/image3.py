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

print(len(written), 'fiches :', ', '.join(written))
