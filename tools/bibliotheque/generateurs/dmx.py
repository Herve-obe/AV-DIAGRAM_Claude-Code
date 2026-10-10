# Distribution DMX : Luminex LumiNode et Swisson XPD-28, d'après les manuels constructeur.
from common import P, src, sheet, written

LX = 'https://www.luminex.be/wp-content/uploads/doccenter/'
def luminode(id, n, manual, power, **kw):
    ports = [P(f'dmx{i}', f'DMX {i}', 'bidir', 'dmx', 'xlr5', format='XLR5 femelle blindée, DMX/RDM, sens configurable (entrée ou sortie), isolation optique et galvanique')
             for i in range(1, n + 1)]
    ports += [P('eth1', 'ETH1', 'bidir', 'network', 'ethercon', format='Gigabit ; Art-Net, sACN, KiNET'),
              P('eth2', 'ETH2', 'bidir', 'network', 'ethercon', format='Gigabit ; seul port acceptant l\'alimentation PoE 802.3af (classe 0)')]
    ports += power
    sheet(id, 'dmxDistribution', 'Luminex', f'LumiNode {n}', 'router', [src(LX + manual, f'Luminex, User Manual LumiNode {n} rev 2.4.1')], ports, **kw)

TRUE1 = lambda out: [P('ac-in', 'Secteur', 'in', 'power', 'powercon-true1', format='powerCON TRUE1 ; le PoE sur ETH2 prend le relais si le secteur est coupé')] + \
    ([P('ac-out', 'Recopie secteur', 'out', 'power', 'powercon-true1', format='powerCON TRUE1 sortie')] if out else [])
luminode('luminex-luminode-12', 12, 'User-Manual_LumiNode-12_rev-2.4.1.pdf', TRUE1(True), powerW=13, rackU=1)
luminode('luminex-luminode-4', 4, 'User-Manual_LumiNode-4_rev-2.4.1.pdf', TRUE1(False), powerW=13, weightKg=1.42)
luminode('luminex-luminode-2', 2, 'User-Manual_LumiNode-2_rev-2.4.1-1.pdf', [], powerW=8.5, weightKg=0.9)

# Swisson XPD-28 : 2 entrées, 8 sorties ; connecteurs selon la version (XLR5, XLR3 ou etherCON)
V = 'Selon la version : XLR 5 points, XLR 3 points ou etherCON RJ45'
sheet('swisson-xpd-28', 'dmxDistribution', 'Swisson', 'XPD-28', 'router',
      [src('https://www.swisson.com/site/assets/files/1261/um_xpd-28-d0-len-v01-05.pdf', 'Swisson, XPD-28 User Manual v01-05')],
      [P('in-a', 'Entrée A', 'in', 'dmx', 'unspecified', format=f'DMX/RDM, isolée, terminaison intégrée. {V}'),
       P('in-b', 'Entrée B', 'in', 'dmx', 'unspecified', format=f'DMX/RDM, isolée, terminaison intégrée. {V}')] +
      [P(f'out{i}', f'Sortie {i}', 'out', 'dmx', 'unspecified', format=f'Affectable à l\'univers A ou B, isolation optique. {V}') for i in range(1, 9)] +
      [P('ac-in', 'Secteur', 'in', 'power', 'powercon', format='powerCON bleu (NAC3FCA)'),
       P('ac-out', 'Recopie secteur', 'out', 'power', 'powercon', format='powerCON gris (NAC3FCB)')])

print(len(written), 'fiches :', ', '.join(written))
