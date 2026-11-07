# Projecteurs SGM (catalogue Novelty), d'après les pages produit du constructeur (sgmlighting.com).
# Les versions POI sont livrées avec câbles fixes : la fiche montée par le prestataire n'est pas connue.
from common import P, src, sheet, written

U = 'https://www.sgmlighting.com/products/'
WL = ' ; DMX sans fil LumenRadio avec RDM'
def lum(id, model, slug, ports, **kw):
    sheet(id, 'luminaire', 'SGM', model, 'light', [src(U + slug)], ports, **kw)
def pigtail(wireless=True):
    return [P('dmx-in', 'DMX In', 'in', 'dmx', 'xlr5', format='Câble IP65 de 0,5 m à XLR 5 points (fixe)' + (WL if wireless else '')),
            P('dmx-out', 'DMX Out', 'out', 'dmx', 'xlr5', format='Câble IP65 de 0,5 m à XLR 5 points (fixe)'),
            P('ac-in', 'Secteur', 'in', 'power', 'unspecified', format='Câble d\'alimentation fixe de 1 m, fils nus')]
def socket(ip):
    return [P('dmx-in', 'DMX In', 'in', 'dmx', 'xlr5', format=f'Embase {ip} XLR 5 points mâle' + WL),
            P('dmx-out', 'DMX Out', 'out', 'dmx', 'xlr5', format=f'Embase {ip} XLR 5 points femelle'),
            P('ac-in', 'Secteur', 'in', 'power', 'unspecified', format='Embase d\'entrée secteur (modèle non précisé)'),
            P('ac-out', 'Recopie secteur', 'out', 'power', 'unspecified', format='Embase de recopie secteur (modèle non précisé)')]
def poi(length, wireless):
    return [P('dmx-in', 'DMX In', 'in', 'dmx', 'unspecified', format=f'Câble fixe de {length} (entrée DMX)' + (WL if wireless else '')),
            P('dmx-out', 'DMX Thru', 'out', 'dmx', 'unspecified', format=f'Câble fixe de {length} (recopie DMX)'),
            P('ac-in', 'Secteur', 'in', 'power', 'unspecified', format=f'Câble d\'alimentation fixe de {length}, fils nus')]

lum('sgm-p5', 'P-5', 'p%C2%B75', pigtail(), powerW=450, weightKg=8.9)
lum('sgm-p2', 'P-2', 'p%C2%B72', pigtail(False), powerW=236, weightKg=6.1)
lum('sgm-p6', 'P-6', 'p%C2%B76', socket('IP66'), powerW=630, weightKg=14.5)
lum('sgm-p10', 'P-10', 'p%C2%B710', socket('IP65'), powerW=1400, weightKg=20.9)
lum('sgm-q7-poi', 'Q-7 POI', 'q%C2%B77-poi', poi('5 m', False), powerW=465, weightKg=8.1)
lum('sgm-q10-poi', 'Q-10 POI', 'q%C2%B710-poi', poi('1,5 m', True), powerW=1250, weightKg=19.8)
lum('sgm-g-spot-poi', 'G-Spot POI', 'g%C2%B7spot-poi', poi('5 m', False), powerW=1150, weightKg=52)

print(len(written), 'fiches :', ', '.join(written))
