# Sennheiser : système de visite 2020-D, HF evolution G3 / G4 (300), antennes et répartiteur, micros.
from common import P, src, sheet, mic
M = 'Sennheiser'
U = 'unspecified'
def R(*pairs): return [src(u, d) for u, d in pairs]
RFOUT = P('rf', 'Émission HF', 'out', 'audioAnalog', 'rf', format='Liaison radio vers le récepteur')
RFIN = P('rf', 'Réception HF', 'in', 'audioAnalog', 'rf', format='Liaison radio avec l\'émetteur')

# Visite guidée 2020-D
TG = R(('https://www.manualowl.com/m/Sennheiser/SR-2020-D/Manual/718822', 'Sennheiser, brochure systèmes de visite 2020-D (archive de manuels)'),
       ('https://duvall.be/product/sennheiser-tourguide-transmitter-sr-2020-d/', 'Duvall, fiche SR 2020-D (revendeur)'))
sheet('sennheiser-sr-2020-d', 'wireless', M, 'SR 2020-D', 'wireless', TG, [
    P('in', 'Audio In', 'in', 'audioAnalog', 'xlr3', level='mic', phantom='supplied', format='XLR-3F symétrique, micro/ligne, fantôme 48 V commutable'),
    P('phones', 'Casque', 'out', 'audioAnalog', 'jack-trs', channels=2, format='Jack 6,35 mm (écoute)'),
    RFOUT, P('ac', 'Alimentation', 'in', 'power', U)], status='community')
sheet('sennheiser-ek-2020-d-ii', 'wireless', M, 'EK 2020-D-II', 'wireless', TG, [
    RFIN, P('ear', 'Sortie casque', 'out', 'audioAnalog', 'minijack', format='Jack 3,5 mm (casque ou boucle d\'induction)')], status='community')
sheet('sennheiser-skm-2020-d', 'wireless', M, 'SKM 2020-D', 'wireless', TG, [RFOUT], status='community')
sheet('sennheiser-hde-2020-d-ii', 'wireless', M, 'HDE 2020-D-II', 'wireless', TG, [RFIN], status='community')

# evolution G3 / G4 série 300
G3 = R(('https://www.sonovente.com/sennheiser-ew-335-g3-g-p27507.html', 'Sonovente, contenu du kit ew 335 G3 (revendeur)'))
sheet('sennheiser-em-300-g3', 'wireless', M, 'EM 300 G3', 'wireless', G3, [
    RFIN, P('antA', 'Antenne A', 'in', 'rf', 'bnc'), P('antB', 'Antenne B', 'in', 'rf', 'bnc'),
    P('out', 'Sortie audio', 'out', 'audioAnalog', U, format='Sorties XLR et jack d\'après la gamme ; non confirmé'),
    P('eth', 'Ethernet', 'bidir', 'network', 'rj45', format='Wireless Systems Manager'),
    P('dc', 'Alimentation', 'in', 'power', 'dc-barrel', format='Bloc secteur fourni')], status='community', rackU=1)
sheet('sennheiser-skm-300-835-g3', 'wireless', M, 'SKM 300-835 G3', 'wireless', G3, [RFOUT], status='community')
sheet('sennheiser-sk-300-g3', 'wireless', M, 'SK 300 G3', 'wireless', R(('https://www.huss-licht-ton.de/print_product_info.php/en/products_id/51060', 'Huss Licht & Ton, embase jack 3,5 mm des SK G2/G3/G4 (pièce détachée)')), [
    P('in', 'Entrée micro / ligne', 'in', 'audioAnalog', 'minijack', level='mic', format='Jack 3,5 mm verrouillable'), RFOUT], status='community')
sheet('sennheiser-em-300-500-g4', 'wireless', M, 'EM 300-500 G4', 'wireless', R(('https://soniccircus.com/product/sennheiser-em-300-500-g4-wireless-half-rack-receiver/', 'Sonic Circus, fiche EM 300-500 G4 (revendeur)')), [
    RFIN, P('antA', 'Antenne A', 'in', 'rf', U), P('antB', 'Antenne B', 'in', 'rf', U),
    P('out', 'Sortie audio', 'out', 'audioAnalog', U, format='Connecteurs non confirmés'),
    P('eth', 'Ethernet', 'bidir', 'network', 'rj45', format='WSM, Control Cockpit'),
    P('dc', 'Alimentation', 'in', 'power', 'dc-barrel', format='Bloc secteur fourni')], status='community')

# Antennes et répartiteur (BNC)
sheet('sennheiser-asa-3000', 'wireless', M, 'ASA 3000', 'wireless', R(('https://www.sennheiser.com/globalassets/digizuite/40549-en-asa_3000_quick_guide_12_2020.pdf', 'Sennheiser, guide rapide ASA 3000 (12/2020)')),
      [P('antA', 'ANT A', 'in', 'rf', 'bnc', format='Alimentation des boosters d\'antenne 12 V'), P('antB', 'ANT B', 'in', 'rf', 'bnc')]
      + [P(f'outA{i}', f'RF Out A{i}', 'out', 'rf', 'bnc') for i in range(1, 9)] + [P(f'outB{i}', f'RF Out B{i}', 'out', 'rf', 'bnc') for i in range(1, 9)]
      + [P('ac', 'Secteur', 'in', 'power', U)], status='community', rackU=1)
sheet('sennheiser-a-1031-u', 'wireless', M, 'A 1031-U', 'wireless', R(('https://www.manualowl.com/m/Sennheiser/A-1031-U/Manual/357840', 'Sennheiser, notice A 1031-U (archive de manuels)')),
      [P('out', 'Sortie antenne', 'out', 'rf', 'bnc', format='Omnidirectionnelle passive, 450-960 MHz, 50 Ω')], status='community')
sheet('sennheiser-a-2003-uhf', 'wireless', M, 'A 2003-UHF', 'wireless', R(('https://www.markertek.com/product/a2003-uhf/sennheiser-a2003-uhf-passive-directional-transmitting-and-receiving-antenna-450-960-mhz-for-wireless-mic-systems', 'Markertek, fiche A 2003-UHF (revendeur)')),
      [P('out', 'Sortie antenne', 'out', 'rf', 'bnc', format='Directive passive, 450-960 MHz, 50 Ω')], status='community')

# Micros
mic('sennheiser-e606', M, 'e 606', R(('https://micpedia.com/?p=6777', 'Micpedia, fiche e 606 (base de données tierce)')), 'none', fmt='Dynamique supercardioïde (ampli guitare)', status='community', weightKg=0.18)
mic('sennheiser-me3-ew', M, 'ME 3-ew', [src(None, 'Catalogue Novelty 2025 (serre-tête pour émetteurs SK)')], 'none', connector='minijack', fmt='Serre-tête statique cardioïde ; jack 3,5 mm pour SK, alimenté par l\'émetteur', status='community')
mic('sennheiser-me80', M, 'ME 80', [src(None, 'Catalogue Novelty 2025')], 'required', connector=U, fmt='Tête statique (module d\'alimentation de la série K3) ; connecteur non précisé', status='community')
