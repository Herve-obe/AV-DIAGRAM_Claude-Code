# Robert Juliat : découpes, lentilles et poursuites. Les pages produit ne détaillent pas les connecteurs
# (fiches PDF par modèle) : alimentation « non précisée » ; DMX seulement quand la page l'indique.
from common import P, src, sheet
M = 'Robert Juliat'
U = 'unspecified'
RJ = 'https://www.robertjuliat.com'
def S(path, name): return [src(f'{RJ}/{path}', f'Robert Juliat, page {name}')]
NOV = [src(None, 'Catalogue Novelty 2025 ; modèle ancien, absent du site Robert Juliat')]

def conventional(id, model, desc, sources, w=None):
    sheet(id, 'luminaire', M, model, 'light', sources, [
        P('ac', 'Alimentation', 'in', 'power', U, format=desc + ' ; pas de commande DMX, gradateur externe')], status='community', powerW=w)

conventional('robert-juliat-613sx', '613SX', 'Découpe courte 1000 W, 58°', NOV, 1000)
conventional('robert-juliat-614sx', '614SX', 'Découpe 1000 W, zoom 16-35°', NOV, 1000)
conventional('robert-juliat-710sx', '710SX', 'Découpe 2 kW, zoom 10-25°', NOV, 2000)
conventional('robert-juliat-713sx', '713SX', 'Découpe 2 kW, zoom 29-50°', NOV, 2000)
conventional('robert-juliat-714sx2', '714SX2', 'Découpe 2 ou 2,5 kW, zoom 15-40°', NOV, 2500)
conventional('robert-juliat-310h', '310H', 'Lentille PC 1000 W', NOV, 1000)
conventional('robert-juliat-329h', '329H', 'Lentille PC 2000 W', NOV, 2000)

def discharge(id, model, desc, sources, w):
    sheet(id, 'luminaire', M, model, 'light', sources, [
        P('ac', 'Alimentation', 'in', 'power', U, format=desc)], status='community', powerW=w)
discharge('robert-juliat-930snx', "d'Artagnan 930 SNX", 'Découpe MSR 2500 W, ballast', S('profilespots/dartagnan.html', "d'Artagnan 930 SNX (produit arrêté)"), 2500)
discharge('robert-juliat-933snx', '933 SNX', 'Découpe MSR 2500 W, ballast déporté, 30-53°', NOV, 2500)
discharge('robert-juliat-934snx', '934 SNX', 'Découpe MSR 2500 W, ballast', NOV, 2500)
discharge('robert-juliat-victor', 'Victor', 'Poursuite 1800 W MSR, 7-14,5°', S('followspots/victor.html', 'Victor (produit arrêté)'), 1800)
discharge('robert-juliat-cyrano', 'Cyrano', 'Poursuite HMI 2500 W, 3-8°, alimentation électronique sans scintillement', S('followspots/cyrano.html', 'Cyrano'), 2500)
discharge('robert-juliat-aramis', 'Aramis', 'Poursuite HMI 2500 W, 4,5-8°', S('followspots/aramis.html', 'Aramis 1013+ (produit arrêté)'), 2500)
discharge('robert-juliat-ivanhoe', 'Ivanhoe', 'Poursuite HMI 2500 W', NOV, 2500)
discharge('robert-juliat-heloise', 'Héloïse', 'Poursuite HMI 2500 W', NOV, 2500)

sheet('robert-juliat-arthur', 'luminaire', M, 'Arthur', 'light', S('followspots/Arthur.html', 'Arthur (1014)'), [
    P('dmxIn', 'Data In', 'in', 'dmx', U, format='DMX, RDM, Art-Net, sACN ; connecteurs non précisés sur la page'),
    P('ac', 'Alimentation', 'in', 'power', U, format='Poursuite LED 800 W, 5,5-15°')], status='community', powerW=800)
