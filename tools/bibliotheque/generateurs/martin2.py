from common import P, src, sheet
M = 'Martin'
NOV = [src(None, 'Catalogue Novelty 2025 ; fiche constructeur non trouvée sur martin.com')]
U = 'unspecified'
sheet('martin-jem-glaciator-dynamic', 'luminaire', M, 'JEM Glaciator Dynamic', 'light', NOV, [
    P('dmxIn', 'DMX In', 'in', 'dmx', U, format='Commande DMX ; connecteur non précisé'),
    P('ac', 'Secteur', 'in', 'power', U)], status='community')
sheet('martin-air-force-one', 'luminaire', M, 'Air Force One', 'light', NOV, [
    P('dmxIn', 'DMX In', 'in', 'dmx', U, format='Ventilateur à commande DMX ; connecteur non précisé'),
    P('ac', 'Secteur', 'in', 'power', U)], status='community')
