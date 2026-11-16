# Switches réseau (catalogue Novelty, menu Réseau), d'après les fiches et manuels constructeur.
from common import P, src, sheet, written

def eth(prefix, name, n, connector, fmt, start=1):
    return [P(f'{prefix}{i}', f'{name} {i}', 'bidir', 'network', connector, format=fmt) for i in range(start, start + n)]

# Swisson XES-8G
sheet('swisson-xes-8g', 'network', 'Swisson', 'XES-8G', 'switch',
      [src('https://www.swisson.com/site/assets/files/1244/um_xes-8g-d0-len-v01-02.pdf', 'Swisson, XES-8G User Manual v01-02')],
      eth('p', 'Port', 8, 'ethercon', '1000BASE-T, etherCON Cat 5e') + [
          P('ac1', 'Secteur principal', 'in', 'power', 'powercon', format='powerCON bleu (NAC3FCA), 100-240 V'),
          P('ac1-out', 'Recopie secteur principal', 'out', 'power', 'powercon', format='powerCON de recopie'),
          P('ac2', 'Secteur secours', 'in', 'power', 'powercon', format='Seconde alimentation (redondance)'),
          P('ac2-out', 'Recopie secteur secours', 'out', 'power', 'powercon', format='powerCON de recopie'),
      ], powerW=6.5)

# Luminex GigaCore 20t : deux versions (avec ou sans PoE++)
GC = [src('https://www.luminex.be/wp-content/uploads/doccenter/Product-specification-sheet-GigaCore-20t-v1.0.1.pdf', 'Luminex, Product specification sheet GigaCore 20t v1.0.1')]
def gc20t(poe):
    f = '10/100/1000BASE-T' + (', PoE++ (90 W par port, budget total jusqu\'à 500 W)' if poe else '')
    return (eth('front', 'Avant', 4, 'ethercon', f) + eth('rear', 'Arrière etherCON', 4, 'ethercon', f) +
            eth('rj', 'Arrière RJ45', 8, 'rj45', f) +
            [P(f'sfp{i}', f'SFP+ {i}', 'bidir', 'network', 'sfp', format='Cage SFP+ 10 Gbit/s ou 1 Gbit/s, indépendante') for i in range(1, 5)] +
            [P('ac', 'Secteur', 'in', 'power', 'powercon-true1', format='powerCON TRUE1 entrée'),
             P('ac-out', 'Recopie secteur', 'out', 'power', 'powercon-true1', format='powerCON TRUE1 sortie')])
sheet('luminex-gigacore-20t', 'network', 'Luminex', 'GigaCore 20t (LU 01 00080-10G)', 'switch', GC, gc20t(False), rackU=1)
sheet('luminex-gigacore-20t-poe', 'network', 'Luminex', 'GigaCore 20t PoE++ (LU 01 00080-10G-P500)', 'switch', GC, gc20t(True), rackU=1)

# Netgear GS516UP
sheet('netgear-gs516up', 'network', 'Netgear', 'GS516UP', 'switch',
      [src('https://www.downloads.netgear.com/files/GDC/GS516UP/GS516UP_PP_GS524UP_PP_DS.pdf', 'Netgear, Data Sheet GS516PP, GS516UP, GS524PP, GS524UP')],
      eth('p', 'Port', 8, 'rj45', '10/100/1000 Mbit/s, PoE++ 802.3bt type 3 (60 W)') +
      eth('p', 'Port', 8, 'rj45', '10/100/1000 Mbit/s, PoE+ 802.3at (30 W)', start=9) +
      [P('ac', 'Secteur', 'in', 'power', 'unspecified', format='Alimentation interne 100-240 V ; budget PoE total 380 W')],
      powerW=456.8, weightKg=2.6)

# Netgear GS108 (v4)
sheet('netgear-gs108', 'network', 'Netgear', 'GS108', 'switch',
      [src('https://www.downloads.netgear.com/files/GDC/datasheet/en/GS105v5-GS108v4.pdf', 'Netgear, Data Sheet ProSAFE GS105 et GS108')],
      eth('p', 'Port', 8, 'rj45', '10/100/1000 Mbit/s') +
      [P('dc', 'Alimentation', 'in', 'power', 'dc-barrel', format='Bloc secteur externe 12 V / 0,5 A')],
      weightKg=0.47)

print(len(written), 'fiches :', ', '.join(written))
