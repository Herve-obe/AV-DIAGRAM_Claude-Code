# BSS Audio : dynamiques DPR (402, 404, 504, 901ii), égaliseur FCS-966 Opal, Soundweb 9088ii.
# Fiches et modes d'emploi BSS (bssaudio.com/en-US/product_documents/...).
from common import P, src, sheet
M = 'BSS Audio'
U = 'unspecified'
B = 'https://bssaudio.com/en-US/product_documents/'
def R(key, doc): return [src(B + key, doc)]
def xin(id, name, fmt='XLR femelle, symétrie électronique'): return P(id, name, 'in', 'audioAnalog', 'xlr3', level='line+4', format=fmt)
def xout(id, name, fmt='XLR mâle, symétrique'): return P(id, name, 'out', 'audioAnalog', 'xlr3', level='line+4', format=fmt)
def ac(): return P('ac', 'Secteur', 'in', 'power', U)
def dyn(id, model, key, doc, n, extra, **kw):
    ports = []
    for i in range(1, n + 1):
        ports += [xin(f'in{i}', f'Input {i}'), xout(f'out{i}', f'Output {i}')]
    sheet(id, 'processing', M, model, 'processor', R(key, doc), ports + extra + [ac()], rackU=1, **kw)

dyn('bss-dpr-402', 'DPR-402', 'dpr402umpdf', 'BSS, mode d\'emploi DPR-402', 2,
    [P('barrier', 'Barrier Strip', 'bidir', 'audioAnalog', 'terminal', format='Bornier arrière : entrées / sorties et inserts de side-chain'),
     P('link', 'Stereo Link', 'bidir', 'control', U, format='Couplage stéréo')])
dyn('bss-dpr-404', 'DPR-404', 'dpr404dspdf', 'BSS, fiche DPR-404', 4,
    [P(f'sc{i}', f'Sidechain Insert {i}', 'bidir', 'audioAnalog', 'jack-trs', level='line+4', format='Jack TRS : départ (ring) / retour (tip)') for i in range(1, 5)])
dyn('bss-dpr-504', 'DPR-504', 'dpr504dspdf', 'BSS, fiche DPR-504', 4,
    [P(f'key{i}', f'Ext Key {i}', 'in', 'audioAnalog', 'jack-trs', level='line+4', format='Jack TRS 6,35, clé externe') for i in range(1, 5)])
dyn('bss-dpr-901ii', 'DPR-901ii', 'dpr901dspdf', 'BSS, fiche DPR-901ii', 2, [])

sheet('bss-fcs-966', 'processing', M, 'FCS-966 Opal', 'processor', R('fcs966dspdf', 'BSS, fiche FCS-966'),
      [xin('inA', 'Input A', 'XLR, jack TRS ou bornier Phoenix, symétrique'), xin('inB', 'Input B', 'XLR, jack TRS ou bornier Phoenix, symétrique'),
       xout('outA', 'Output A', 'XLR, jack TRS ou bornier Phoenix, symétrique'), xout('outB', 'Output B', 'XLR, jack TRS ou bornier Phoenix, symétrique'), ac()],
      weightKg=3.0, rackU=3)

sheet('bss-soundweb-9088ii', 'processing', M, 'Soundweb 9088ii', 'processor',
      [src('https://images.thomann.de/pics/atg/atgdata/document/specs/145126_bss_soundweb_9088.pdf', 'BSS, description Soundweb 9088 (via Thomann)'),
       src(B + 'swmasterdoc_library_150pdf', 'BSS, Soundweb Master Document Library (2005)')],
      [*[P(f'in{i}', f'Input {i}', 'in', 'audioAnalog', 'terminal', level='mic', phantom='supplied', format='Phoenix, micro / ligne symétrique') for i in range(1, 9)],
       *[P(f'out{i}', f'Output {i}', 'out', 'audioAnalog', 'terminal', level='line+4', format='Phoenix, symétrique') for i in range(1, 9)],
       P('netIn', 'Network In', 'in', 'network', 'rj45', format='Réseau Soundweb (anneau)'), P('netOut', 'Network Out', 'out', 'network', 'rj45', format='Réseau Soundweb (anneau)'),
       P('rs232', 'RS-232', 'bidir', 'control', 'dsub9', format='Commande externe (AMX, Crestron)'),
       P('watchdog', 'Watchdog', 'out', 'control', U), ac()], status='community')
