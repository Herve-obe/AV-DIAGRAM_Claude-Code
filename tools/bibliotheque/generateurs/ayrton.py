# Projecteurs Ayrton (catalogue Novelty), d'après les pages produit et manuels du constructeur.
from common import P, src, sheet, written

def ports(ip65, eth_conn, power_out, crmx):
    f = 'DMX-512 / RDM' + (' ; récepteur sans fil CRMX LumenRadio intégré' if crmx else '')
    p = [P('dmx-in', 'DMX In', 'in', 'dmx', 'xlr5', format=('XLR5 IP65, ' if ip65 else 'XLR5, ') + f),
         P('dmx-out', 'DMX Out', 'out', 'dmx', 'xlr5', format='Recopie DMX'),
         P('eth-in', 'Ethernet In', 'bidir', 'network', eth_conn, format='Art-Net'),
         P('eth-out', 'Ethernet Out', 'bidir', 'network', eth_conn, format='Recopie Ethernet')]
    p.append(P('ac-in', 'Secteur', 'in', 'power', 'powercon-true1', format='powerCON TRUE1' + (' TOP IP65' if ip65 else '') + ', 100-240 V'))
    if power_out:
        p.append(P('ac-out', 'Recopie secteur', 'out', 'power', 'powercon-true1', format='powerCON TRUE1 TOP IP65, chaînage'))
    return p

A = 'https://www.ayrton.eu/produit/'
sheet('ayrton-rivale-profile', 'luminaire', 'Ayrton', 'Rivale Profile', 'light', [src(A + 'rivale-profile/')],
      ports(True, 'rj45', True, True), powerW=700, weightKg=30.8)
sheet('ayrton-ghibli', 'luminaire', 'Ayrton', 'Ghibli', 'light', [src(A + 'ghibli/')],
      ports(False, 'ethercon', False, True), powerW=800, weightKg=35.6)

# MagicBlade-R : manuel 2015 ; connecteurs secteur non précisés
sheet('ayrton-magicblade-r', 'luminaire', 'Ayrton', 'MagicBlade-R', 'light',
      [src('https://www.ayrton.eu/wp-content/uploads/2014/06/MagicBlade-R-01052015.pdf', 'Ayrton, MagicBlade-R User Manual V.1 (01/05/2015)')],
      [P('dmx-in', 'DMX In', 'in', 'dmx', 'xlr5', format='DMX-512 ; récepteur DMX sans fil (antenne)'),
       P('dmx-out', 'DMX Out', 'out', 'dmx', 'xlr5', format='Recopie DMX'),
       P('eth-in', 'RJ45 In', 'bidir', 'network', 'rj45'),
       P('eth-out', 'RJ45 Out', 'bidir', 'network', 'rj45'),
       P('ac-in', 'Secteur', 'in', 'power', 'unspecified', format='Connecteur d\'entrée non précisé, 110-240 V'),
       P('ac-out', 'Recopie secteur', 'out', 'power', 'unspecified', format='Connecteur de sortie non précisé')], weightKg=12)

print(len(written), 'fiches :', ', '.join(written))
