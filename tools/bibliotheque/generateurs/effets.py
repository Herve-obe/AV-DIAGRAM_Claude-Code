# Effets et traitement : Lexicon PCM70 / 80 / 90 / 91 / 96, TC Electronic System 6000 / M2000 / D-Two / 2290, Avalon U5 / VT-737sp / VT-747SP.
from common import P, src, sheet
U = 'unspecified'
def R(*pairs): return [src(u, d) for u, d in pairs]
def ain(id, name, conn, fmt=None, level='line+4'): return P(id, name, 'in', 'audioAnalog', conn, level=level, format=fmt)
def aout(id, name, conn, fmt=None, level='line+4'): return P(id, name, 'out', 'audioAnalog', conn, level=level, format=fmt)
def midi(thru=True):
    m = [P('midiIn', 'MIDI In', 'in', 'control', 'din5'), P('midiOut', 'MIDI Out', 'out', 'control', 'din5')]
    return m + ([P('midiThru', 'MIDI Thru', 'out', 'control', 'din5')] if thru else [])
def ac(fmt=None): return P('ac', 'Secteur', 'in', 'power', U, format=fmt)
def fx(id, mfr, model, srcs, ports, **kw): sheet(id, 'processing', mfr, model, 'processor', srcs, ports, status='community', **kw)
L = 'Lexicon'

fx('lexicon-pcm70', L, 'PCM70', R(('https://vintagedigital.com.au/?p=143825', 'Vintage Digital, fiche PCM70'), ('https://www.soundpure.com/p/lexicon-pcm-70-vintage-reverb-and-effects-processor-used/39294', 'Soundpure, fiche PCM70 (revendeur)')),
   [ain('in', 'Input', 'jack-trs', 'Mono, jack 6,35 ; -20 dB asymétrique ou +4 dB symétrique'),
    aout('outL', 'Output L', 'jack-trs', 'Jack 6,35 (sources divergentes : TS ou TRS)'), aout('outR', 'Output R', 'jack-trs', 'Jack 6,35 (sources divergentes : TS ou TRS)'),
    P('midi', 'MIDI', 'bidir', 'control', U, format='MIDI (connecteurs non précisés)'), ac()], weightKg=4.9, rackU=2)

def pcm(id, model, srcs, aes):
    ports = [ain('inL', 'Input L', 'combo', 'XLR / jack 6,35 symétrique'), ain('inR', 'Input R', 'combo', 'XLR / jack 6,35 symétrique'),
             aout('outL', 'Output L', 'xlr3', 'XLR symétrique (et jack 6,35)'), aout('outR', 'Output R', 'xlr3', 'XLR symétrique (et jack 6,35)'),
             P('spdifIn', 'S/PDIF In', 'in', 'audioDigital', 'rca', channels=2), P('spdifOut', 'S/PDIF Out', 'out', 'audioDigital', 'rca', channels=2)]
    if aes:
        ports += [P('aesIn', 'AES/EBU In', 'in', 'audioDigital', 'xlr3', channels=2), P('aesOut', 'AES/EBU Out', 'out', 'audioDigital', 'xlr3', channels=2)]
    ports += midi() + [P('fs', 'Footswitch', 'in', 'control', 'jack-trs', format='2 interrupteurs momentanés'), ac()]
    fx(id, L, model, srcs, ports, rackU=1)
pcm('lexicon-pcm80', 'PCM80', R(('https://middle-east.novelty.fr/products/sound/peripheriques//lexicon/pcm80-441', 'Novelty, fiche PCM80 (loueur)')), False)
pcm('lexicon-pcm90', 'PCM90', R(('https://www.zzounds.com/item--LEXPCM91', 'zZounds, fiche PCM91 (le PCM91 reprend le PCM90 avec l\'AES/EBU en plus)')), False)
pcm('lexicon-pcm91', 'PCM91', R(('https://www.zzounds.com/item--LEXPCM91', 'zZounds, fiche PCM91 (revendeur)'), ('https://www.pssl.com/products/lexicon-pcm91-digital-reverb-processor', 'PSSL, fiche PCM91 (revendeur)')), True)

fx('lexicon-pcm96', L, 'PCM96', R(('https://www.hhb.co.uk/prod/lexicon/pcm-96/', 'HHB, fiche PCM96 (distributeur)'), ('https://www.prosoundweb.com/lexicon-pcm96-processor/', 'ProSoundWeb, annonce PCM96')),
   [ain('inL', 'Analog In L', 'xlr3'), ain('inR', 'Analog In R', 'xlr3'), aout('outL', 'Analog Out L', 'xlr3'), aout('outR', 'Analog Out R', 'xlr3'),
    P('aesIn', 'AES/EBU In', 'in', 'audioDigital', 'xlr3', channels=2), P('aesOut', 'AES/EBU Out', 'out', 'audioDigital', 'xlr3', channels=2),
    P('wc', 'Word Clock', 'bidir', 'sync', 'bnc'), *midi(),
    P('fw1', 'FireWire 1', 'bidir', 'audioDigital', 'ieee1394'), P('fw2', 'FireWire 2', 'bidir', 'audioDigital', 'ieee1394'),
    P('eth1', 'Ethernet 1', 'bidir', 'network', 'rj45'), P('eth2', 'Ethernet 2', 'bidir', 'network', 'rj45'), ac()], rackU=1)

TC = 'TC Electronic'
fx('tc-electronic-system-6000', TC, 'System 6000 MKII', R(('https://cdn.mediavalet.com/aunsw/musictribe/atsr2rqJk0CQQEHdz8zBWg/8n1djIW4iUOrITp-O61HUQ/Original/tc_electronic_system_6000_mkii_operation_manual_english.pdf', 'TC Electronic, mode d\'emploi System 6000 MKII')),
   [P('aes', 'AES/EBU I/O', 'bidir', 'audioDigital', 'dsub25', channels=8, format='4 AES/EBU stéréo par D-Sub (épanoui en XLR)'),
    P('ada', 'Analog I/O (carte ADA)', 'bidir', 'audioAnalog', U, level='line+4', format='Option : cartes ADA 24/96, 2 canaux symétriques chacune'),
    P('wc', 'Word Clock In', 'in', 'sync', 'bnc'), *midi(False),
    P('smpte', 'SMPTE', 'in', 'sync', 'jack-trs', format='Timecode'), P('gpi', 'GPI', 'in', 'control', 'jack-trs'),
    P('eth', 'Ethernet', 'bidir', 'network', 'rj45', format='Vers télécommande TC Icon / CPU'), ac()])
fx('tc-electronic-m2000', TC, 'M2000', R(('https://www.manualslib.com/manual/532621/Tc-Electronic-M2000.html', 'TC Electronic, mode d\'emploi M2000 (archive)'), ('https://www.soundonsound.com/reviews/tc-electronic-m2000', 'Sound On Sound, test M2000')),
   [ain('inL', 'Input L', 'xlr3'), ain('inR', 'Input R', 'xlr3'), aout('outL', 'Output L', 'xlr3'), aout('outR', 'Output R', 'xlr3'),
    P('aesIn', 'AES/EBU In', 'in', 'audioDigital', 'xlr3', channels=2), P('aesOut', 'AES/EBU Out', 'out', 'audioDigital', 'xlr3', channels=2),
    P('spdifIn', 'S/PDIF In', 'in', 'audioDigital', 'rca', channels=2), P('spdifOut', 'S/PDIF Out', 'out', 'audioDigital', 'rca', channels=2),
    *midi(), P('pedal', 'Pédale', 'in', 'control', 'jack-trs'), ac()], rackU=1)
fx('tc-electronic-d-two', TC, 'D-Two', R(('https://toneprints.com/media/216395/tc_electronic_d-two_manual_english.pdf', 'TC Electronic, mode d\'emploi D-Two')),
   [ain('inL', 'Input L', 'jack-trs', 'Jack 6,35 symétrique'), ain('inR', 'Input R', 'jack-trs', 'Jack 6,35 symétrique'),
    aout('outL', 'Output L', 'jack-trs', 'Jack 6,35 symétrique'), aout('outR', 'Output R', 'jack-trs', 'Jack 6,35 symétrique'),
    P('spdifIn', 'S/PDIF In', 'in', 'audioDigital', 'rca', channels=2), P('spdifOut', 'S/PDIF Out', 'out', 'audioDigital', 'rca', channels=2),
    *midi(), P('pedal', 'Pédale', 'in', 'control', 'jack-trs'), ac()], rackU=1)
fx('tc-electronic-2290', TC, '2290', R(('https://www.novelty.fr/produits/sonorisation/peripheriques/delai/tc2290/', 'Novelty, fiche TC2290 (loueur)')),
   [ain('in', 'Input', 'xlr3', 'XLR symétrique (ou jack 6,35 asymétrique)'),
    aout('outL', 'Output L', 'xlr3', 'XLR symétrique (ou jack 6,35)'), aout('outR', 'Output R', 'xlr3', 'XLR symétrique (ou jack 6,35)'),
    *midi(), P('tclink', 'TC Link', 'bidir', 'control', U, format='Télécommande TC 0144'), ac('100-240 V, 30 W')], weightKg=5.7, rackU=2, powerW=30)

A = 'Avalon'
sheet('avalon-u5', 'capture', A, 'U5', 'di', R(('https://thomann.ae/avalon_u5_mono_dipreamp.htm', 'Thomann, fiche U5 (revendeur)')),
      [P('inst', 'Instrument In', 'in', 'audioAnalog', 'jack-ts', level='instrument', format='Haute impédance'),
       P('thru', 'Thru', 'out', 'audioAnalog', 'jack-ts', level='instrument'),
       P('spkIn', 'Speaker In', 'in', 'audioAnalog', 'jack-ts', level='speaker', format='Entrée HP jusqu\'à 400 W'),
       P('outMic', 'Output (mic)', 'out', 'audioAnalog', 'xlr3', level='mic', format='XLR symétrique'),
       P('outLine', 'Output (ligne)', 'out', 'audioAnalog', 'xlr3', level='line+4', format='XLR symétrique'),
       P('phones', 'Casque', 'out', 'audioAnalog', 'jack-trs', channels=2), ac()], status='community')
sheet('avalon-vt-737sp', 'processing', A, 'VT-737sp', 'processor', R(('https://thomann.pl/avalon_vt_737sp_black.htm', 'Thomann, fiche VT-737sp (revendeur)')),
      [P('mic', 'Mic In', 'in', 'audioAnalog', 'xlr3', level='mic', phantom='supplied'),
       ain('line', 'Line In', 'combo', 'Combo XLR / jack symétrique'), P('di', 'DI In', 'in', 'audioAnalog', 'jack-ts', level='instrument'),
       aout('out', 'Line Out', 'jack-trs', 'Jack 6,35 symétrique'), P('link', 'Link', 'bidir', 'control', 'jack-trs', format='Couplage de deux unités'), ac()],
      status='community', weightKg=10, rackU=2)
sheet('avalon-vt-747sp', 'processing', A, 'VT-747SP', 'processor', R(('https://fr.audiofanzine.com/effet-studio/avalon/avis/', 'Audiofanzine, avis Avalon')),
      [ain('inL', 'Input L', U, 'Stéréo ; connecteur non retrouvé'), ain('inR', 'Input R', U, 'Stéréo ; connecteur non retrouvé'),
       aout('outL', 'Output L', U), aout('outR', 'Output R', U), ac()], status='community', rackU=2)
