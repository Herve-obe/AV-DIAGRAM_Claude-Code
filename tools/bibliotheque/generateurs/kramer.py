# Kramer (catalogue Novelty), d'après les manuels et fiches Kramer.
from common import P, src, sheet, written

K = lambda url, doc: [src(url, f'Kramer, {doc}')]
def ctl(): return [P('rs232', 'RS-232', 'bidir', 'control', 'dsub9', format='D-Sub 9 points, Protocol 2000'),
                   P('lan', 'Ethernet', 'bidir', 'network', 'rj45', format='Contrôle')]

ports = [*[P(f'hdmi-in{i}', f'HDMI In {i}', 'in', 'video', 'hdmi', format='HDMI, HDCP') for i in (1, 2, 3)],
         *[P(f'spdif-in{i}', f'S/PDIF In {i}', 'in', 'audioDigital', 'rca') for i in (1, 2, 3)],
         *[P(f'ain{i}', f'Audio In {i}', 'in', 'audioAnalog', 'minijack', format='Stéréo asymétrique') for i in (1, 2, 3)],
         P('hdmi-out', 'HDMI Out', 'out', 'video', 'hdmi'),
         P('spdif-out', 'S/PDIF Out', 'out', 'audioDigital', 'rca'),
         P('aout', 'Audio Out', 'out', 'audioAnalog', 'minijack', format='Stéréo asymétrique'),
         P('aout-bal', 'Audio Out symétrique', 'out', 'audioAnalog', 'terminal', level='line+4', format='Stéréo symétrique, bornier 5 points'),
         P('remote', 'Remote', 'in', 'control', 'terminal', format='Contact sec'),
         *ctl(),
         P('dc', 'Alimentation', 'in', 'power', 'unspecified', format='12 V CC, 380 mA, bloc fourni')]
sheet('kramer-vs-311h', 'videoRouting', 'Kramer', 'VS-311H (commutateur automatique HDMI 3x1)', 'router',
      K('https://k.kramerav.com/downloads/manuals/vs-311h.pdf', 'User Manual VS-311H'), ports, weightKg=1.2)

sheet('kramer-vs-41h', 'videoRouting', 'Kramer', 'VS-41H (commutateur HDMI 4x1)', 'router',
      K('https://cdn.kramerav.com/web/downloads/manuals/kramer_vs-41h.pdf', 'User Manual VS-41H'),
      [*[P(f'hdmi-in{i}', f'HDMI In {i}', 'in', 'video', 'hdmi', format='HDMI, HDCP') for i in range(1, 5)],
       P('hdmi-out', 'HDMI Out', 'out', 'video', 'hdmi'), *ctl(),
       P('ac', 'Secteur', 'in', 'power', 'unspecified', format='100-240 V, 10 VA')], weightKg=2.5)

sheet('kramer-vm-4hdcpxl', 'videoRouting', 'Kramer', 'VM-4HDCPxl (distributeur DVI 1:4)', 'router',
      K('https://k.kramerav.com/downloads/pdf/product/1/VM-4HDCPXL.pdf', 'fiche produit VM-4HDCPxl'),
      [P('dvi-in', 'DVI In', 'in', 'video', 'dvi', format='DVI 24 points, HDCP'),
       *[P(f'dvi-out{i}', f'DVI Out {i}', 'out', 'video', 'dvi', format='DVI 24 points') for i in range(1, 5)],
       P('ac', 'Secteur', 'in', 'power', 'unspecified', format='100-240 V, 17 VA')], rackU=1)

print(len(written), 'fiches :', ', '.join(written))
