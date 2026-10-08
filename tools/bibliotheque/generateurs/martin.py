# Martin (Harman) : pages produit martin.com (rubrique Connections / Electrical / Physical).
from common import P, src, sheet, fixture
M = 'Martin'
def S(slug, name): return [src(f'https://www.martin.com/en/products/{slug}', f'Martin, page produit {name}')]
U = 'unspecified'

fixture('martin-mac-axiom-hybrid', M, 'MAC Axiom Hybrid', S('mac-axiom-hybrid', 'MAC Axiom Hybrid'), power='powercon-true1', weightKg=24.8, powerW=600)
fixture('martin-mac-viper-performance', M, 'MAC Viper Performance', S('mac-viper-performance', 'MAC Viper Performance'), weightKg=37.9, powerW=1225)
fixture('martin-mac-viper-profile', M, 'MAC Viper Profile', S('mac-viper-profile', 'MAC Viper Profile'), weightKg=37.2, powerW=1225)
fixture('martin-mac-viper-wash-dx', M, 'MAC Viper Wash DX', S('mac-viper-wash-dx', 'MAC Viper Wash DX'), weightKg=34.1, powerW=1225)
fixture('martin-mac-quantum-profile', M, 'MAC Quantum Profile', S('mac-quantum-profile', 'MAC Quantum Profile'), weightKg=23.2, powerW=750)
fixture('martin-mac-quantum-wash', M, 'MAC Quantum Wash', S('mac-quantum-wash', 'MAC Quantum Wash'), weightKg=21, powerW=1020)
fixture('martin-mac-aura-xip', M, 'MAC Aura XIP', S('mac-aura-xip', 'MAC Aura XIP'), power='powercon-true1', power_thru=True, ethernet='ethercon', weightKg=8.95, powerW=340)
fixture('martin-mac-aura-pxl', M, 'MAC Aura PXL', S('mac-aura-pxl', 'MAC Aura PXL'), power='powercon-true1', power_thru=True, ethernet='ethercon', weightKg=15.6, powerW=560)
fixture('martin-mac-aura', M, 'MAC Aura', S('mac-aura', 'MAC Aura'), power_thru=True, weightKg=5.6, powerW=260)
fixture('martin-mac-101', M, 'MAC 101', S('mac-101', 'MAC 101'), power_thru=True, weightKg=3.7, powerW=123)
fixture('martin-rush-mh3-beam', M, 'RUSH MH 3 Beam', S('rush-mh-3-beam', 'RUSH MH 3 Beam'), dmx='xlr3+5', weightKg=20.5, powerW=350)
fixture('martin-rush-mh10-beam-fx', M, 'RUSH MH 10 Beam FX', S('rush-mh-10-beam-fx', 'RUSH MH 10 Beam FX'), dmx='xlr3+5', power='powercon-true1', power_thru=True, weightKg=7.5, powerW=108)
fixture('martin-rush-mh5-profile', M, 'RUSH MH 5 Profile', S('rush-mh-5-profile', 'RUSH MH 5 Profile'), dmx='xlr3+5', power_thru=True, weightKg=9, powerW=165)
fixture('martin-rush-mh6-wash', M, 'RUSH MH 6 Wash', S('rush-mh-6-wash', 'RUSH MH 6 Wash'), dmx='xlr3+5', power_thru=True, weightKg=7.1, powerW=150)
fixture('martin-atomic-3000-dmx', M, 'Atomic 3000 DMX', S('atomic-3000-dmx', 'Atomic 3000 DMX'), dmx='xlr3+5', power=U,
        power_fmt='Câble 1,5 m sans fiche ; 8 A typique, 33 A en crête', weightKg=7.5)

# VDO Sceptron 10 : alimentation et données sur un même connecteur (BBD), depuis un P3 PowerPort
for model, length, w, pw in (('VDO Sceptron 10 1000 mm', '1000', 1.4, 30), ('VDO Sceptron 10 320 mm', '320', 0.5, 10)):
    sheet(f'martin-vdo-sceptron-10-{length}', 'luminaire', M, model, 'light', S('vdo-sceptron-10', 'VDO Sceptron 10'), [
        P('in', 'Power & Data In', 'in', 'power', U, format='Connecteur 6 points propriétaire (BBD), IP66 ; alimentation et données P3'),
        P('out', 'Power & Data Thru', 'out', 'power', U, format='Connecteur 6 points propriétaire (BBD), IP66')], weightKg=w, powerW=pw)

sheet('martin-p3-powerport-1500', 'lightingControl', M, 'P3 PowerPort 1500', 'switch', S('p3-powerport-1500', 'P3 PowerPort 1500'), [
    P('p3In', 'P3 In', 'bidir', 'network', 'ethercon', format='Données P3'),
    P('p3Thru', 'P3 Thru', 'bidir', 'network', 'ethercon', format='Chaînage'),
    *[P(f'out{i}', f'Power/Data Out {i}', 'out', 'power', 'xlr4', format='XLR 4 points femelle, alimentation et données (câble hybride)') for i in range(1, 5)],
    P('ac', 'Secteur', 'in', 'power', 'powercon', format='100-240 V ; 1540 W avec charge complète')], weightKg=10, powerW=1540)

def p3(model, slug, extra, w):
    sheet('martin-' + model.lower(), 'lightingControl', M, model, 'control', S(slug, model), [
        P('p3', 'P3 Data', 'bidir', 'network', 'ethercon', format='1 Gbit/s'),
        P('net', 'EtherDMX / Management', 'bidir', 'network', 'ethercon', format='Art-Net, sACN, gestion'),
        *extra,
        P('gui', 'Moniteur', 'out', 'video', 'displayport', format='DisplayPort++ (interface utilisateur)'),
        P('ac', 'Secteur', 'in', 'power', 'iec-c13', format='Embase IEC avec interrupteur')], rackU=1, weightKg=w)
p3('P3-050', 'p3-050-system-controller', [
    P('dmxIn', 'DMX In', 'in', 'dmx', 'xlr5'), P('dmxThru', 'DMX Thru', 'out', 'dmx', 'xlr5'),
    P('dviIn', 'DVI In', 'in', 'video', 'dvi', format='DVI-D'), P('dviThru', 'DVI Thru', 'out', 'video', 'dvi', format='DVI-D')], 3.0)
p3('P3-175', 'p3-175-system-controller', [
    P('ndi', 'NDI In', 'in', 'videoIp', 'ethercon'), P('hdmi', 'HDMI In', 'in', 'video', 'hdmi', format='HDMI 1.4a')], 3.5)

sheet('martin-maxedia-compact', 'lightingControl', M, 'Maxedia Compact', 'control', S('maxedia-compact', 'Maxedia Compact'), [
    P('out1', 'Video Out 1', 'out', 'video', U, format='Connecteur non précisé (sortie 1 + interface, ou 2 sorties)'),
    P('out2', 'Video Out 2 / GUI', 'out', 'video', 'dvi', format='DVI'),
    P('fw', 'Entrée caméra', 'in', 'video', 'ieee1394', format='FireWire'),
    P('eth', 'Ethernet Remote', 'bidir', 'network', 'rj45'),
    P('usb', 'USB', 'bidir', 'control', 'usb-a', format='2 ports ; DMX par interface USB/DMX vendue à part'),
    P('ac', 'Secteur', 'in', 'power', U, format='100-240 V')], rackU=2, status='community')
