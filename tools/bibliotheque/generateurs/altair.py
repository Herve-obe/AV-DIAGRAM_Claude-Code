# Altair (Espagne) : intercom filaire E-200 et sans fil WB-200.
# Documents Altair (catalogue, modes d'emploi) hébergés par des revendeurs : statut community.
from common import P, src, sheet
M = 'Altair'
U = 'unspecified'
CAT = src('https://theatrelight.co.nz/wp-content/uploads/2022/01/Altair-Catalogue.pdf', 'Altair, catalogue intercom (via Theatrelight)')
def line(id, name, conn='xlr3', fmt='Partyline (XLR-3F + XLR-3M en parallèle)'): return P(id, name, 'bidir', 'intercom', conn, format=fmt)
HEADSET = P('headset', 'Casque', 'bidir', 'audioAnalog', 'xlr4', format='XLR-4M')
def pack(id, model, ports, srcs=None, **kw): sheet(id, 'intercom', M, model, 'intercom', srcs or [CAT], ports, status='community', **kw)

pack('altair-ef-200', 'EF-200', [line('lineA', 'Line A'), line('lineB', 'Line B'),
     P('prg', 'Program In', 'in', 'audioAnalog', 'xlr3', level='line+4', format='XLR-3F symétrique, micro / ligne'),
     P('pa', 'PA Out', 'out', 'audioAnalog', 'xlr3', level='line+4', format='XLR-3M symétrique'),
     P('relay', 'Relais PA', 'out', 'control', 'jack-trs', format='Jack 6,35, contact de relais'),
     P('link', 'Multichannel Link', 'bidir', 'control', 'rj12', format='Liaison maître / esclave (FCC-68)'),
     HEADSET, P('ac', 'Secteur', 'in', 'power', U, format='90-264 V, 50 VA ; alimente la ligne en 24 V')],
     [CAT, src('https://www.manualslib.com/manual/811173/Altair-Ef-200.html', 'Altair, mode d\'emploi EF-200 (archive)')], weightKg=3.0, rackU=1)
pack('altair-em-201', 'EM-201', [line('line', 'Line'), HEADSET], weightKg=0.235)
pack('altair-em-202', 'EM-202', [line('lineA', 'Line A', fmt='XLR-3 (EM-202-3P) ou XLR-5 voies A/B (EM-202-5P)'), line('lineB', 'Line B', fmt='XLR-3 (EM-202-3P)'), HEADSET], weightKg=0.27)
pack('altair-es-200', 'ES-200', [line('lineA', 'Line A'), line('lineB', 'Line B'), HEADSET], weightKg=1.6, rackU=2)
pack('altair-4w2-200', '4W2-200', [line('line', 'Line', fmt='XLR-3M partyline'),
     P('fourWire', '4 fils', 'bidir', 'audioAnalog', 'xlr4', level='line+4', format='XLR-4M symétrique (entrée + sortie)'),
     P('tel', 'Ligne téléphonique', 'bidir', 'audioAnalog', 'rj12', format='RJ11')], weightKg=0.33)
pack('altair-eb-200', 'EB-200', [line('line', 'Line'), P('bt', 'Bluetooth', 'bidir', 'rf', 'rf', format='Bluetooth classe 1, 2,4 GHz'),
     P('usb', 'USB', 'in', 'control', U, format='Mise à jour')], weightKg=0.25)

WBS200 = src('https://enlx.co.uk/wptemp/wp-content/uploads/2024/05/wbs200.pdf', 'Altair, mode d\'emploi WBS-200 (via ENLX)')
WBS202 = src('https://www.rent4event.de/pdf/altair-wbs202.pdf', 'Altair, mode d\'emploi WBS-202 (via Rent4Event)')
ANT = [P('ant1', 'Antenne 1', 'bidir', 'rf', U), P('ant2', 'Antenne 2', 'bidir', 'rf', U)]
pack('altair-wbs-200', 'WBS-200', [*ANT, line('lineA', 'Line A'), line('lineB', 'Line B'),
     P('prg', 'Program In', 'in', 'audioAnalog', 'xlr3', level='line+4', format='XLR-3F symétrique'),
     P('pa', 'PA Out', 'out', 'audioAnalog', 'xlr3', level='line+4', format='XLR-3M symétrique'),
     P('headset', 'Casque', 'bidir', 'audioAnalog', 'xlr4', format='XLR-4 et Tiny QG en parallèle'),
     P('ac', 'Secteur', 'in', 'power', 'iec-c13', format='90-264 V')], [WBS200, CAT], weightKg=3.0, rackU=1)
pack('altair-wbs-202', 'WBS-202', [*ANT, line('lineA', 'Line A'), line('lineB', 'Line B'),
     P('prg', 'Program In', 'in', 'audioAnalog', 'xlr3', level='line+4', format='XLR-3F symétrique'),
     P('pa', 'PA Out', 'out', 'audioAnalog', 'xlr3', level='line+4', format='XLR-3M symétrique'),
     P('sa', 'SA Out', 'out', 'audioAnalog', 'xlr3', level='line+4', format='XLR-3M symétrique'),
     P('headset', 'Casque', 'bidir', 'audioAnalog', 'xlr4'),
     P('sync', 'Synchro', 'bidir', 'control', 'rj12', format='RJ11, liaison entre bases'),
     P('aux', 'Audio Link', 'bidir', 'audioAnalog', 'minijack', format='Liaison audio entre unités'),
     P('relay', 'Relais / GPIO', 'bidir', 'control', U),
     P('ac', 'Secteur', 'in', 'power', 'iec-c13', format='90-264 V')], [WBS202, CAT], rackU=1)
for id, model, fmt, w in (('altair-wbp-210', 'WBP-210', 'Monocanal', None), ('altair-wbp-212', 'WBP-212', 'Bicanal « Manager »', None)):
    pack(id, model, [P('rf', 'Liaison radio', 'bidir', 'rf', 'rf', format=fmt + ', vers base WBS'),
         P('headset', 'Casque', 'bidir', 'audioAnalog', 'xlr4', format='XLR-4' + (' et Tiny QG' if model == 'WBP-210' else '')),
         P('usb', 'Charge', 'in', 'power', U, format='USB, batterie Li-Ion')],
         [CAT, src('https://www.snotechnique.com/image/data/Produit/Sonorisation/Intercom/Altair/Altair-Manuel-WBP210-UK.pdf', 'Altair, mode d\'emploi WBP-210 (via SNO Technique)')])
