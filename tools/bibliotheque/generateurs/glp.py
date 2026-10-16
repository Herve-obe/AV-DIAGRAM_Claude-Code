# Projecteurs GLP (catalogue Novelty), d'après les manuels du constructeur (glp.de).
from common import P, src, sheet, written

G = 'https://glp.de/files/products/'
def dmx():
    return [P('dmx-in', 'DMX In', 'in', 'dmx', 'xlr5', format='DMX512-A / RDM, XLR 5 points'),
            P('dmx-thru', 'DMX Thru', 'out', 'dmx', 'xlr5', format='Recopie DMX')]
def jdc_line(id, model, doc_url, doc, **kw):
    sheet(id, 'luminaire', 'GLP', model, 'light', [src(G + doc_url, doc)], dmx() + [
        P('net-a', 'Réseau A', 'bidir', 'network', 'ethercon', format='Art-Net / sACN ; recopie maintenue hors tension (fail-safe)'),
        P('net-b', 'Réseau B', 'bidir', 'network', 'ethercon', format='Art-Net / sACN'),
        P('ac-in', 'Secteur', 'in', 'power', 'powercon-true1', format='powerCON TRUE1, 100-240 V'),
        P('ac-out', 'Recopie secteur', 'out', 'power', 'powercon-true1', format='powerCON TRUE1'),
    ], **kw)

jdc_line('glp-jdc-line-1000', 'JDC Line 1000', 'jdc-line-1000-product-data/JDC_Line_1000_User_Manual_EN_Rev_20240618-01.pdf',
         'GLP, JDC Line 1000 User Manual Rev. 20240618-01')
jdc_line('glp-jdc-line-500', 'JDC Line 500', 'jdc-line-500-product-data/GLP_JDC_Line_500_Quick_Start_Safety_Manual_EN_Rev_20211114-01.pdf',
         'GLP, JDC Line 500 Quick Start and Safety Manual Rev. 20211114-01', powerW=700, weightKg=6)

sheet('glp-jdc1', 'luminaire', 'GLP', 'JDC1', 'light',
      [src(G + 'jdc1-product-data/GLP_JDC1_User_Manual_EN_Rev20240830-01.pdf', 'GLP, JDC1 User Manual Rev. 20240830-01')],
      dmx() + [P('ac-in', 'Secteur', 'in', 'power', 'powercon-true1', format='powerCON TRUE1')],
      powerW=1200, weightKg=10.8)

print(len(written), 'fiches :', ', '.join(written))
