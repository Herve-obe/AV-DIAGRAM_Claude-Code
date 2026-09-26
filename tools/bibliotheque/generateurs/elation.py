# Projecteurs Elation (catalogue Novelty), d'après les pages produit du constructeur (elationlighting.com).
from common import P, src, sheet, written

E = 'https://www.elationlighting.com/'
def dmx(pins=('5',), ip=False, efly=False):
    f = 'DMX / RDM' + (' ; émetteur-récepteur sans fil E-FLY intégré' if efly else '') + (' ; IP65' if ip else '')
    out = []
    for p in pins:
        out += [P(f'dmx-in{p}', f'DMX In (XLR{p})', 'in', 'dmx', f'xlr{p}', format=f),
                P(f'dmx-out{p}', f'DMX Out (XLR{p})', 'out', 'dmx', f'xlr{p}', format='Recopie DMX')]
    return out
def eth(): return [P('eth-in', 'Ethernet In', 'bidir', 'network', 'rj45', format='RJ45 IP65 ; Art-Net, sACN'),
                   P('eth-out', 'Ethernet Out', 'bidir', 'network', 'rj45', format='RJ45 IP65')]
def power(out, v='100-240 V'):
    p = [P('ac-in', 'Secteur', 'in', 'power', 'unspecified', format=f'Connecteur non précisé, {v}')]
    if out: p.append(P('ac-out', 'Recopie secteur', 'out', 'power', 'unspecified', format='Chaînage secteur'))
    return p
def lum(id, model, slug, ports, **kw):
    sheet(id, 'luminaire', 'Elation', model, 'light', [src(E + slug)], ports, **kw)

lum('elation-proteus-maximus', 'Proteus Maximus', 'products/proteus-maximus', dmx() + eth() + power(False, '120-240 V'), powerW=1400, weightKg=53)
lum('elation-proteus-hybrid', 'Proteus Hybrid', 'proteus-hybrid', dmx(ip=True, efly=True) + eth() + power(False), powerW=700, weightKg=38)
lum('elation-kl-panel-xl', 'KL Panel XL', 'products/kl-panel-xl', dmx(('5', '3'), efly=True) + power(True) + [
    P('usb', 'USB', 'bidir', 'control', 'unspecified', format='Mise à jour, alimentation 5 V d\'accessoires'),
    P('batt', 'Batterie', 'in', 'power', 'xlr4', format='XLR 4 points, 24-36 V CC (batterie non fournie)')], powerW=544, weightKg=17.2)
lum('elation-kl-panel', 'KL Panel', 'products/kl-panel', dmx(efly=True) + power(True) + [
    P('batt', 'Batterie', 'in', 'power', 'xlr4', format='XLR 4 points, 24-36 V CC (batterie non fournie)')], powerW=295, weightKg=13)
lum('elation-tvl2000-ii', 'TVL2000 II', 'products/tvl2000-ii', dmx(('5', '3')) + power(True), powerW=90, weightKg=6.8)
lum('elation-dtw-blinder-700-ip', 'DTW Blinder 700 IP', 'dtw-blinder-700-ip', dmx(ip=True) + power(True), powerW=680, weightKg=12.7)
lum('elation-kl-fresnel-6-cw', 'KL Fresnel 6 CW', 'products/kl-fresnel-6-cw', dmx(('5', '3')) + power(True), powerW=180, weightKg=8.4)

print(len(written), 'fiches :', ', '.join(written))
