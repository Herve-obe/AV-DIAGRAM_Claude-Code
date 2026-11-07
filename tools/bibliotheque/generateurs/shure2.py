from common import P, src, sheet, mic, written
M = 'Shure'
def S(guide, name): return [src(f'https://pubs.shure.com/guide/{guide}/en-US', f'Shure, guide d\'utilisation {name} (pubs.shure.com)')]
mic('shure-beta-57a', M, 'Beta 57A', S('BETA57A', 'Beta 57A'), 'none', fmt='Dynamique supercardioïde ; XLR 3 mâle symétrique')
mic('shure-beta-58a', M, 'Beta 58A', S('BETA58A', 'Beta 58A'), 'none', fmt='Dynamique supercardioïde ; XLR 3 mâle symétrique')
mic('shure-beta-87a', M, 'Beta 87A', S('BETA87A', 'Beta 87A'), 'required', fmt='Statique électret supercardioïde ; 48 V conseillé, fonctionne dès 11 V')
mic('shure-ksm9', M, 'KSM9', S('KSM9', 'KSM9'), 'required', fmt='Statique double membrane, directivité variable ; 48 V conseillé, dès 11 V')
sheet('shure-axt600', 'wireless', M, 'AXT600', 'wireless', S('AXT600', 'AXT600'), [
    P('antA', 'Antenne A', 'in', 'rf', 'unspecified', format='Entrée d\'antenne ; connecteur non précisé dans l\'extrait du guide'),
    P('antB', 'Antenne B', 'in', 'rf', 'unspecified', format='Entrée d\'antenne'),
    P('casA', 'Cascade RF A', 'out', 'rf', 'unspecified', format='Recopie vers d\'autres appareils'),
    P('casB', 'Cascade RF B', 'out', 'rf', 'unspecified', format='Recopie vers d\'autres appareils'),
    P('eth1', 'Ethernet 1', 'bidir', 'network', 'rj45', format='PoE classe 1'),
    P('eth2', 'Ethernet 2', 'bidir', 'network', 'rj45', format='PoE classe 1'),
    P('mon', 'Monitor', 'out', 'audioAnalog', 'jack-trs', channels=2, format='Écoute en façade'),
    P('ac', 'Secteur', 'in', 'power', 'iec-c13', format='Embase IEC (type non précisé)'),
    P('acout', 'Cascade secteur', 'out', 'power', 'iec-c13')], rackU=1)
sheet('shure-ad600', 'wireless', M, 'AD600', 'wireless', S('AD600', 'AD600'), [
    *[P(f'ant{c}', f'Antenne {c}', 'in', 'rf', 'bnc' if False else 'unspecified', format='Entrée coaxiale ; alimentation d\'antenne commutable') for c in 'ABCDEF'],
    P('ctrl1', 'Ethernet ctrl 1', 'bidir', 'network', 'rj45', format='Contrôle, PoE'),
    P('ctrl2', 'Ethernet ctrl 2', 'bidir', 'network', 'rj45', format='Contrôle, PoE'),
    P('dante1', 'Dante Primary', 'bidir', 'audioIp', 'rj45'),
    P('dante2', 'Dante Secondary', 'bidir', 'audioIp', 'rj45'),
    P('usb', 'USB', 'bidir', 'control', 'usb-a', format='Export des balayages (type de prise non précisé)'),
    P('mon', 'Casque', 'out', 'audioAnalog', 'jack-trs', channels=2, format='6,35 mm'),
    P('ac', 'Secteur', 'in', 'power', 'unspecified'),
    P('acout', 'Cascade secteur', 'out', 'power', 'unspecified', format='Verrouillable')], rackU=1)
sheet('shure-ad610', 'wireless', M, 'AD610', 'wireless', S('AD610', 'AD610'), [
    P('eth', 'Ethernet', 'bidir', 'network', 'rj45', format='Alimenté en PoE classe 1'),
    P('dc', 'Alimentation externe', 'in', 'power', 'unspecified'),
    P('showlink', 'ShowLink 2,4 GHz', 'bidir', 'control', 'rf', format='Liaison radio de télécommande avec les émetteurs')])
print(len(written), 'fiches Shure (2)')
