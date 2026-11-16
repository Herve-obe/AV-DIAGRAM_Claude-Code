# Armoires de distribution électrique des catalogues (fabricant non indiqué, aucune fiche publique).
# Seule l'arrivée est renseignée, d'après la désignation du catalogue ; les départs ne sont pas détaillés.
from common import P, src, sheet
M = 'Fabricant non indiqué'
U = 'unspecified'
AP = src(document='Catalogue Audio Pro 2025 (docs/inventaire/audiopro-2025.csv), section Distribution électrique')
NV = src(document='Catalogue Novelty 2025 (docs/inventaire/novelty-2025.csv), pages 164 à 169')

def armoire(id, model, conn, fmt, s):
    sheet(id, 'power', M, model, 'power', [s],
          [P('in', 'Arrivée', 'in', 'power', conn, format=fmt),
           P('out', 'Départs', 'out', 'power', U, format='Départs non détaillés dans le catalogue')], status='community')

for model, conn, fmt in (('A400', 'powerlock', 'Powerlock 400 A'), ('A250', 'powerlock', 'Powerlock 250 A'),
                         ('A125', U, 'P17 125 A'), ('A63', 'p17-63-tri', 'P17 63 A'), ('A32', 'p17-32-tri', 'P17 32 A')):
    armoire('armoire-' + model.lower(), 'Armoire ' + model, conn, fmt, AP)
armoire('boite-b32', 'Boîte B32 (B32 / B32M / B32T / B232T)', U, 'Boîtes de distribution 32 A ; variantes mono / tri non détaillées', AP)

for model, amps in (('RS32 V3', 32), ('RS63 V3', 63), ('AR125EVO', 125), ('RS125 V3', 125), ('RC250TRI', 250), ('RC630TRI', 630),
                    ('32TRI', 32), ('63TRI', 63), ('125TRI', 125), ('250TRI', 250), ('630TRI', 630), ('630TRI V2', 630)):
    armoire('armoire-' + model.lower().replace(' ', '-'), 'Armoire ' + model, U,
            f'{amps} A d\'après la désignation (à confirmer) ; connecteur non précisé', NV)
