# Shure : HF UHF-R, antennes et combineurs, ear monitors filaires, écouteurs, micros (guides pubs.shure.com).
from common import P, src, sheet, mic
M = 'Shure'
def G(code, title): return [src(f'https://pubs.shure.com/view/guide/{code}/en-US.pdf', f'Shure, guide utilisateur {title}')]
U = 'unspecified'
RFOUT = P('rf', 'Émission HF', 'out', 'audioAnalog', 'rf', format='Liaison radio vers le récepteur')

# Émetteurs UHF-R
sheet('shure-ur1m', 'wireless', M, 'UR1M', 'wireless', G('UR1M', 'UR1M'), [
    P('in', 'Entrée audio', 'in', 'audioAnalog', 'ta4', level='mic', format='TA4M (version UR1MLEMO3 : Lemo 3 points) ; asymétrique, +5 dBu max'),
    P('ant', 'Antenne', 'out', 'rf', 'sma', format='Antenne fouet'), RFOUT], weightKg=0.064)
sheet('shure-ur3', 'wireless', M, 'UR3', 'wireless', G('UR3', 'UR3'), [
    P('in', 'Entrée XLR', 'in', 'audioAnalog', 'xlr3', level='mic', phantom='supplied', format='XLR femelle (se monte sur le micro) ; micro ou ligne ; fantôme 12 / 48 V commutable'),
    RFOUT])
# UR1, UR2, UR4D : pas de guide Shure en ligne trouvé ; descriptions de revendeurs
REV = [src('https://www.rentex.com/rental-products/shure-ur4d-dual-receiver-h4/', 'Rentex, fiche UR4D (revendeur)'),
       src('https://www.bhphotovideo.com/c/product/549621-REG/Shure_UR4D_X1_UR4D_Dual_Diversity.html', 'B&H, fiche UR4D (revendeur)')]
sheet('shure-ur4d', 'wireless', M, 'UR4D', 'wireless', REV, [
    P('rf', 'Réception HF', 'in', 'audioAnalog', 'rf', format='2 canaux, liaisons radio avec émetteurs UHF-R'),
    P('antA', 'Antenne A', 'in', 'rf', 'bnc', format='D\'après un revendeur, à vérifier'),
    P('antB', 'Antenne B', 'in', 'rf', 'bnc', format='D\'après un revendeur, à vérifier'),
    P('xlr1', 'Sortie XLR 1', 'out', 'audioAnalog', 'xlr3', level='mic', format='Symétrique, micro/ligne commutable'),
    P('xlr2', 'Sortie XLR 2', 'out', 'audioAnalog', 'xlr3', level='mic', format='Symétrique, micro/ligne commutable'),
    P('jack1', 'Sortie jack 1', 'out', 'audioAnalog', 'jack-trs', format='Symétrique 6,35 mm'),
    P('jack2', 'Sortie jack 2', 'out', 'audioAnalog', 'jack-trs', format='Symétrique 6,35 mm'),
    P('eth', 'Ethernet', 'bidir', 'network', 'rj45', format='Wireless Workbench'),
    P('ac', 'Secteur', 'in', 'power', U)], status='community')
sheet('shure-ur1', 'wireless', M, 'UR1', 'wireless', [src('https://www.lost-manuals.com/en/manufacturer/shure/ur4d', 'Archive de manuels (tiers), gamme UHF-R')], [
    P('in', 'Entrée audio', 'in', 'audioAnalog', 'ta4', level='mic', format='TA4M comme l\'UR1M (même gamme), à vérifier'),
    P('ant', 'Antenne', 'out', 'rf', U, format='Antenne fouet'), RFOUT], status='community')
sheet('shure-ur2', 'wireless', M, 'UR2', 'wireless', [src('https://www.lost-manuals.com/en/manufacturer/shure/ur4d', 'Archive de manuels (tiers), gamme UHF-R')], [
    RFOUT], status='community')

# Antennes et combineurs
def antenna(id, model, code, desc, active):
    fmt = desc + (' ; alimentation (bias) fournie par le récepteur ou le répartiteur' if active else ' ; passive')
    sheet(id, 'wireless', M, model, 'wireless', G(code, model), [P('out', 'Sortie antenne', 'out', 'rf', 'bnc', format=fmt)])
antenna('shure-ua870', 'UA870', 'UA870', 'Directive active, gain 3 ou 10 dB', True)
antenna('shure-ua874', 'UA874', 'UA874', 'Directive active, 4 réglages de gain, alimentation 10-15 V DC requise', True)
antenna('shure-ua864', 'UA864', 'UA864', 'Murale active, 4 réglages de gain', True)
antenna('shure-ua860swb', 'UA860SWB', 'UA860SWB', 'Omnidirectionnelle', False)
antenna('shure-pa805swb', 'PA805SWB', 'PA805SWB', 'Directive, 50 W max (émission ear monitor)', False)
antenna('shure-pa805', 'PA805', 'PA805', 'Directive, 50 Ω', False)
sheet('shure-pa821', 'wireless', M, 'PA821', 'wireless', G('PA821', 'PA821'),
      [P(f'in{i}', f'Antenna Input {i}', 'in', 'rf', 'bnc', format='Sortie antenne d\'un émetteur PSM') for i in range(1, 9)] + [
       P('out', 'Antenna Output', 'out', 'rf', 'bnc', format='Vers l\'antenne'),
       P('expA', 'Expansion A IN', 'in', 'rf', 'bnc', format='Port d\'extension (2 entrées, 1 sortie)'),
       P('expB', 'Expansion B IN', 'in', 'rf', 'bnc', format='Port d\'extension'),
       P('expOut', 'Expansion Output', 'out', 'rf', 'bnc', format='Port d\'extension'),
       P('ac', 'AC Power', 'in', 'power', U, format='Alimentation universelle intégrée')], rackU=1)
sheet('shure-ha8089', 'wireless', M, 'HA8089', 'wireless', [src(None, 'Catalogue Novelty 2025 (antenne hélicoïdale) : pas de documentation Shure trouvée')], [
    P('out', 'Sortie antenne', 'out', 'rf', U, format='Antenne hélicoïdale ; connecteur non précisé')], status='community')

# Ear monitors filaires
sheet('shure-p9hw', 'wireless', M, 'P9HW', 'wireless', G('P9HW', 'P9HW'), [
    P('in', 'Audio Input', 'in', 'audioAnalog', 'lemo5', level='line+4', channels=2, format='Lemo 5 points ; câble en Y vers 2 XLR fourni'),
    P('ear', 'Sortie écouteurs', 'out', 'audioAnalog', 'minijack', channels=2, format='Jack 3,5 mm')])
sheet('shure-p6hw', 'wireless', M, 'P6HW', 'wireless', G('P6HW', 'P6HW'), [
    P('in', 'Audio Input', 'in', 'audioAnalog', 'lemo5', level='line+4', channels=2, format='Connecteur 5 points ; câble en Y vers 2 XLR fourni'),
    P('ear', 'Sortie écouteurs', 'out', 'audioAnalog', 'minijack', channels=2, format='Jack 3,5 mm ; pile 9 V')])

# Écouteurs (une entrée jack 3,5 mm)
sheet('shure-se112', 'speaker', M, 'SE112', 'speaker', G('SE112', 'SE112'), [
    P('in', 'Écouteurs', 'in', 'audioAnalog', 'minijack', level='speaker', channels=2, format='Jack 3,5 mm stéréo')], status='community')
for model, desc in (('SE315-CL', '1 voie'), ('SE425-CL', '2 voies'), ('SE535-CL', '3 voies')):
    sheet('shure-' + model.lower(), 'speaker', M, model, 'speaker', [src('https://pubs.shure.com/view/guide/SE215/en-US.pdf', 'Shure, guide SE215 (même gamme ; guide du modèle non trouvé)')], [
        P('in', 'Écouteurs', 'in', 'audioAnalog', U, level='speaker', channels=2, format=f'Écouteurs intra-auriculaires {desc} ; câble détachable, fiche non précisée')], status='community')

# Micros
mic('shure-wl183', M, 'WL183', G('WL18x', 'WL183 WL184 WL185'), 'required', connector='ta4', fmt='Cravate statique omni ; TA4F, alimentée par l\'émetteur (5 V)')
mic('shure-wl184', M, 'WL184', G('WL18x', 'WL183 WL184 WL185'), 'required', connector='ta4', fmt='Cravate statique supercardioïde ; TA4F, alimentée par l\'émetteur')
mic('shure-wl185', M, 'WL185', G('WL18x', 'WL183 WL184 WL185'), 'required', connector='ta4', fmt='Cravate statique cardioïde ; TA4F, alimentée par l\'émetteur')
mic('shure-pg185', M, 'PG185', G('PG185', 'PG185'), 'required', connector='ta4', fmt='Cravate statique cardioïde ; TA4F', weightKg=0.023)
mic('shure-mx153', M, 'MX153', G('MX153', 'MX153'), 'required', connector='ta4', fmt='Tour d\'oreille statique ; TA4F (XLR avec le préampli RK100PK, fantôme)')
mic('shure-wh20xlr', M, 'WH20 XLR', G('WH20', 'WH20'), 'none', fmt='Serre-tête dynamique ; XLR mâle sur clip de ceinture')
mic('shure-super-55', M, 'Super 55', G('Super-55', 'Super 55'), 'none', fmt='Dynamique supercardioïde', weightKg=0.656)
mic('shure-sm91', M, 'SM91', G('SM91', 'SM91'), 'required', fmt='Statique semi-cardioïde de surface ; préampli avec sortie XLR, fantôme 11 à 52 V ou pile')
mic('shure-mx412', M, 'MX412', G('MX400', 'MX412, MX418, MX424'), 'required', fmt='Col de cygne statique 30 cm ; préampli, sortie XLR symétrique active')
mic('shure-mx418', M, 'MX418', G('MX400', 'MX412, MX418, MX424'), 'required', fmt='Col de cygne statique 45 cm ; préampli, sortie XLR symétrique active')

# Sans guide Shure trouvé en ligne : désignation du catalogue, connectique à vérifier
NOV = [src(None, 'Catalogue Novelty 2025 ; documentation Shure non trouvée en ligne (à compléter)')]
mic('shure-beta-98h-c', M, 'Beta 98H/C', NOV, 'required', connector=U, fmt='Statique cardioïde pour instrument, pince ; préampli vers XLR (à vérifier)', status='community')
sheet('shure-brh441m', 'intercom', M, 'BRH441M', 'intercom', NOV, [
    P('mic', 'Micro', 'out', 'audioAnalog', U, level='mic', format='Micro dynamique du casque ; câble non précisé'),
    P('hp', 'Écouteur', 'in', 'audioAnalog', U, level='speaker', format='Casque une oreille')], status='community')
sheet('shure-brh440m', 'intercom', M, 'BRH440M', 'intercom', NOV, [
    P('mic', 'Micro', 'out', 'audioAnalog', U, level='mic', format='Micro dynamique du casque ; câble non précisé'),
    P('hp', 'Écouteurs', 'in', 'audioAnalog', U, level='speaker', channels=2, format='Casque deux oreilles')], status='community')
