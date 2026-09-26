# Intercom Green-GO, d'après la documentation en ligne du constructeur (manual.greengoconnect.com).
from common import P, src, sheet, written

def S(slug, name): return [src(f'https://manual.greengoconnect.com/en/devices/{slug}/', f'Green-GO, documentation {name}')]
M = 'Green-GO'
def headset(): return P('hs', 'Casque', 'bidir', 'audioAnalog', 'xlr4', format='XLR4 mâle pour casque micro, 32 à 600 ohms')
def lan(n=None, poe=True):
    pid, name = ('lan', 'LAN') if n is None else (f'lan{n}', f'LAN {n}')
    f = 'etherCON 10/100 Mbit/s, réseau Green-GO' + (', alimentation PoE IEEE 802.3af' if poe else '')
    return P(pid, name, 'bidir', 'network', 'ethercon', format=f)
def dc(): return P('dc', 'Alim 12 V', 'in', 'power', 'dc-barrel', format='12 V CC, alimentation secondaire (bloc en option)')
def gpio(n=''): return P(f'gpio{n}', f'GPIO {n}'.strip(), 'bidir', 'control', 'dsub9', format='2 entrées et 2 sorties de commande')
def line(n=''):
    s = f' {n}' if n else ''
    return [P(f'linein{n}', f'Entrée ligne{s}', 'in', 'audioAnalog', 'xlr3', format='XLR3 femelle symétrique (4 fils)'),
            P(f'lineout{n}', f'Sortie ligne{s}', 'out', 'audioAnalog', 'xlr3', format='XLR3 mâle symétrique (4 fils)')]

station = lambda: [P('mic', 'Micro col de cygne', 'in', 'audioAnalog', 'xlr3', level='mic', format='XLR3 femelle, alimentation micro jusqu\'à 10 V en option'),
                   headset(), *line(), gpio(), dc(), lan(1), lan(2, poe=False)]
sheet('green-go-mcx', 'intercom', M, 'MCX Rack Station', 'intercom', S('mcx', 'MCX Rack Station'), station())
sheet('green-go-mcxd', 'intercom', M, 'MCXD Desktop Station', 'intercom', S('mcxd', 'MCXD Desktop Station'), station())

sheet('green-go-bpx', 'intercom', M, 'BPX Beltpack X', 'intercom', S('bpx', 'BPX Beltpack X'),
      [headset(), lan()], weightKg=0.261)

sheet('green-go-wbpx', 'intercom', M, 'WBPX Beltpack X (sans fil)', 'intercom', S('wbpx', 'WBPX Beltpack X'),
      [headset(),
       P('radio', 'Liaison HF', 'bidir', 'intercom', 'rf', format='Liaison sans fil vers antenne WAA'),
       P('usb', 'Mini-USB', 'in', 'power', 'usb-mini', format='Charge de la batterie NRGP 1800 mAh, programmation et mise à jour')])

sheet('green-go-waa', 'intercom', M, 'WAA Antenna X', 'wireless', S('waa', 'WAA Antenna X'),
      [P('radio', 'Liaison HF', 'bidir', 'intercom', 'rf', format='1870 à 1930 MHz, jusqu\'à 4 boîtiers WBPX simultanés'),
       lan(),
       P('usb', 'Mini-USB', 'in', 'power', 'usb-mini', format='Alimentation alternative sans switch PoE')], weightKg=0.218)

sheet('green-go-interface-x', 'intercom', M, 'Interface X (INTX)', 'intercom', S('interfacex', 'INTX Audio Interface X'),
      [*line(1), *line(2), gpio(1), gpio(2),
       P('2w', '2 fils', 'bidir', 'intercom', 'xlr3', format='XLR3 femelle, party-line analogique 2 fils, terminaison commutable'),
       dc(), lan(1), lan(2, poe=False)], weightKg=2.41)

sheet('green-go-rdx', 'intercom', M, 'RDX Radio Interface', 'intercom', S('rdx', 'RDX Radio Interface'),
      [P('radio', 'Radio', 'bidir', 'intercom', 'dsub9', format='Émission, réception et alternat (PTT) vers talkie-walkie ; câble à réaliser selon brochage'),
       lan()], weightKg=0.246)

print(len(written), 'fiches :', ', '.join(written))
