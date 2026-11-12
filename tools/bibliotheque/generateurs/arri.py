# Projecteurs LED ARRI SkyPanel C et L-Series C (catalogue Novelty), d'après les fiches techniques ARRI.
from common import P, src, sheet, written

B = 'https://www.arri.com/resource/blob/'
def dmx():
    return [P('dmx-in', 'DMX In', 'in', 'dmx', 'xlr5', format='DMX / RDM, XLR 5 points verrouillable'),
            P('dmx-thru', 'DMX Thru', 'out', 'dmx', 'xlr5', format='Recopie DMX')]

def skypanel(id, model, url, doc, w, kg, psu_in, battery):
    ports = dmx() + [
        P('lan', 'LAN', 'bidir', 'network', 'ethercon', format='Art-Net' + (', sACN' if 'S360' not in model else '')),
        P('usb', 'USB-A', 'bidir', 'control', 'usb-a', format='Mise à jour par clé USB ; alimente de petits appareils (500 mA / 5 V)'),
        P('ac', 'Secteur (bloc d\'alimentation)', 'in', 'power', psu_in[0], format=psu_in[1]),
    ]
    if battery:
        ports.append(P('batt', 'Batterie', 'in', 'power', 'xlr4', format='XLR 4 points mâle, 10 A, broche 1 négatif / broche 4 positif'))
    sheet(id, 'luminaire', 'ARRI', model, 'light', [src(B + url, doc)], ports, powerW=w, weightKg=kg)

T1 = ('powercon-true1', 'Sur le bloc d\'alimentation externe : powerCON TRUE1 TOP, 100-240 V ; tête alimentée en 48 V CC par XLR 3 points')
skypanel('arri-skypanel-s30-c', 'SkyPanel S30-C', '31084/be9998b5f03b4ffd1fd6a6fc9d95e5bc/arri-skypanel-s30-c-data-sheet-en-sep2018-data.pdf',
         'ARRI, SkyPanel S30-C Data Sheet (sept. 2018)', 200, 7.7, T1, True)
skypanel('arri-skypanel-s60-c', 'SkyPanel S60-C', '31124/a3ef8cd7d9f50f5dcd314e9e1b2299de/arri-skypanel-s60-c-data-sheet-en-data.pdf',
         'ARRI, SkyPanel S60-C Data Sheet', 400, 12.6, T1, True)
skypanel('arri-skypanel-s360-c', 'SkyPanel S360-C', '31148/f71c3385f38ee881c1e523b4b6047ef3/arri-skypanel-s360-c-data-sheet-en-sep2018-data.pdf',
         'ARRI, SkyPanel S360-C Data Sheet (sept. 2018)', 1500, 45,
         ('unspecified', 'Sur le bloc d\'alimentation externe : powerCON 32 A, 100-240 V ; tête alimentée en 54 V CC (connecteur 4 points métallique 30 A)'), False)

LS = [src(B + '83474/885c4ff07e12bd13800ef83c7269aeb9/80-0024376-arri-l-series-technical-specifications-poster-en-data.pdf',
          'ARRI, L-Series technical specifications (poster)')]
for id, model, w, kg in (('arri-l5-c', 'L5-C', 115, 5.0), ('arri-l7-c', 'L7-C', 220, 8.2), ('arri-l10-c', 'L10-C', 510, 19.0)):
    sheet(id, 'luminaire', 'ARRI', model, 'light', LS,
          dmx() + [P('usb', 'Mini-USB', 'bidir', 'control', 'usb-mini', format='Réglages DMX, état et mise à jour depuis un ordinateur'),
                   P('ac', 'Secteur', 'in', 'power', 'powercon-true1', format='powerCON TRUE1 TOP, 100-240 V')],
          powerW=w, weightKg=kg)

print(len(written), 'fiches :', ', '.join(written))
