# Projecteurs Chauvet Professional (catalogue Novelty), d'après les pages produit du constructeur.
from common import P, src, sheet, written

C = 'https://chauvetprofessional.com/product/'
PK = 'powerkon-ip65'
def dmx(conns):
    if conns is None:
        return [P('dmx-in', 'DMX In', 'in', 'dmx', 'unspecified', format='DMX / RDM ; connecteur non précisé sur la page'),
                P('dmx-out', 'DMX Out', 'out', 'dmx', 'unspecified', format='Recopie DMX')]
    out = []
    for p in conns:
        out += [P(f'dmx-in{p}', f'DMX In (XLR{p})', 'in', 'dmx', f'xlr{p}', format='DMX / RDM'),
                P(f'dmx-out{p}', f'DMX Out (XLR{p})', 'out', 'dmx', f'xlr{p}', format='Recopie DMX')]
    return out
def pk(out=True):
    p = [P('ac-in', 'Secteur', 'in', 'power', PK, format='Seetronic Powerkon IP65, 100-240 V')]
    if out: p.append(P('ac-out', 'Recopie secteur', 'out', 'power', PK, format='Seetronic Powerkon IP65'))
    return p
def lum(id, model, slug, ports, **kw):
    sheet(id, 'luminaire', 'Chauvet Professional', model, 'light', [src(C + slug + '/')], ports, **kw)

lum('chauvet-colorado-2-quad-zoom', 'COLORado 2-Quad Zoom', 'colorado-2-quad-zoom', dmx(('3', '5')) + pk(), powerW=208, weightKg=8.6)
lum('chauvet-ovation-reve-e-3', 'Ovation Rêve E-3', 'ovation-reve-e-3', dmx(('3', '5')) + pk() + [
    P('usb', 'USB', 'bidir', 'control', 'unspecified', format='Connexion logicielle (mise à jour)')], powerW=367)
lum('chauvet-ovation-reve-f-3-ip', 'Ovation Rêve F-3 IP', 'ovation-reve-f-3-ip', dmx(None) + pk(False), powerW=532)
lum('chauvet-well-fit', 'WELL Fit', 'well-fit', [
    P('radio', 'DMX sans fil', 'in', 'dmx', 'rf', format='W-DMX ; télécommande infrarouge (IRC)'),
    P('ac-in', 'Charge', 'in', 'power', 'powercon', format='Neutrik powerCON ; fonctionnement sur batterie')])

print(len(written), 'fiches :', ', '.join(written))
