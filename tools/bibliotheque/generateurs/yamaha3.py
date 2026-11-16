# Yamaha : mélangeurs MG, EMX, enceintes VXS, STAGEPAS 1K, multi-effets SPX, cartes MY / PY.
# Pages Yamaha des modèles arrêtés retirées : fiches techniques Yamaha quand elles sont en ligne, sinon revendeurs.
from common import P, src, sheet
M = 'Yamaha'
U = 'unspecified'
def R(*pairs): return [src(u, d) for u, d in pairs]
def mic(i, conn, fmt='Micro/ligne, fantôme 48 V'): return P(f'in{i}', f'Input {i}', 'in', 'audioAnalog', conn, level='mic', phantom='supplied', format=fmt)
def line(id, name, conn, d='in', ch=None, fmt=None): return P(id, name, d, 'audioAnalog', conn, level='line+4', channels=ch, format=fmt)

sheet('yamaha-mg06x', 'console', M, 'MG06X', 'console', R(('https://www.manualowl.com/m/Yamaha/MG06X/Manual/406046', 'Yamaha, caractéristiques MG06X (archive de manuels)')),
      [mic(1, 'combo', 'Combo XLR/jack, D-PRE, fantôme 48 V'), mic(2, 'combo', 'Combo XLR/jack, D-PRE, fantôme 48 V'),
       line('st1', 'Stereo In 3/4', U, ch=2), line('st2', 'Stereo In 5/6', U, ch=2),
       line('outL', 'Stereo Out L', 'xlr3', 'out'), line('outR', 'Stereo Out R', 'xlr3', 'out'),
       P('phones', 'Phones', 'out', 'audioAnalog', U, channels=2), P('dc', 'Alimentation', 'in', 'power', 'dc-barrel', format='Adaptateur secteur')],
      status='community', weightKg=0.9)
sheet('yamaha-mg12xu', 'console', M, 'MG12XU', 'console', R(('https://www.musicorp.com.au/pro-audio/2-yamaha-mg12xu/2489-3441/', 'Musicorp, fiche MG12XU (revendeur)')),
      [mic(i, 'combo') for i in range(1, 5)] + [mic(i, 'xlr3', 'Voie stéréo utilisable en micro (XLR)') for i in (5, 7)]
      + [line('st5', 'Stereo In 5/6', 'jack-trs', ch=2), line('st7', 'Stereo In 7/8', 'jack-trs', ch=2),
         line('st9', 'Stereo In 9/10', 'jack-trs', ch=2, fmt='Jack ou RCA'), line('st11', 'Stereo In 11/12', 'jack-trs', ch=2, fmt='Jack ou RCA'),
         line('outL', 'Stereo Out L', 'xlr3', 'out'), line('outR', 'Stereo Out R', 'xlr3', 'out'),
         line('aux1', 'Aux Send 1', 'jack-trs', 'out'), line('aux2', 'Aux Send 2', 'jack-trs', 'out'),
         line('grp1', 'Group Out 1', 'jack-trs', 'out'), line('grp2', 'Group Out 2', 'jack-trs', 'out'),
         line('mon', 'Monitor Out', 'jack-trs', 'out'), P('phones', 'Phones', 'out', 'audioAnalog', 'jack-trs', channels=2),
         P('usb', 'USB', 'bidir', 'audioDigital', 'usb-b', channels=2, format='2 entrées / 2 sorties, 24 bits 192 kHz'),
         P('ac', 'Alimentation', 'in', 'power', U)], status='community')
sheet('yamaha-mg16xu', 'console', M, 'MG16XU', 'console', R(('https://www.musik-produktiv.com/se/yamaha-mg-16xu.html', 'Musik Produktiv, fiche MG16XU (revendeur)')),
      [mic(i, 'combo') for i in range(1, 9)] + [mic(9, 'xlr3', 'Voie stéréo 9/10 en micro (XLR)'), mic(11, 'xlr3', 'Voie stéréo 11/12 en micro (XLR)')]
      + [line('st9', 'Stereo In 9/10', 'jack-trs', ch=2), line('st11', 'Stereo In 11/12', 'jack-trs', ch=2),
         line('st13', 'Stereo In 13/14', 'jack-trs', ch=2, fmt='Jack ou RCA'), line('st15', 'Stereo In 15/16', 'jack-trs', ch=2, fmt='Jack ou RCA'),
         line('outL', 'Stereo Out L', 'combo', 'out', fmt='XLR et jack'), line('outR', 'Stereo Out R', 'combo', 'out', fmt='XLR et jack'),
         *[line(f'grp{i}', f'Group Out {i}', 'jack-trs', 'out') for i in range(1, 5)],
         *[line(f'aux{i}', f'Aux Send {i}', 'jack-trs', 'out') for i in range(1, 5)],
         line('monL', 'Monitor Out L', 'jack-trs', 'out'), line('monR', 'Monitor Out R', 'jack-trs', 'out'),
         P('phones', 'Phones', 'out', 'audioAnalog', 'jack-trs', channels=2),
         P('usb', 'USB', 'bidir', 'audioDigital', 'usb-b', channels=2, format='2 entrées / 2 sorties'),
         P('fs', 'Foot Switch', 'in', 'control', 'jack-ts'), P('ac', 'Alimentation', 'in', 'power', U)], status='community')

def emx(id, model, n_mono, srcs, w=None):
    sheet(id, 'console', M, model, 'console', srcs,
          [mic(i, U, 'Micro/ligne ; connecteur non précisé') for i in range(1, n_mono + 1)]
          + [P('spk1', 'Power Amp 1', 'out', 'audioAnalog', U, level='speaker', format='300 W ; connecteur non précisé'),
             P('spk2', 'Power Amp 2', 'out', 'audioAnalog', U, level='speaker', format='300 W ; principal ou retour'),
             P('ac', 'Secteur', 'in', 'power', U)], status='community', weightKg=w)
emx('yamaha-emx312sc', 'EMX312SC', 8, R(('https://www.expandore.com/yamaha/powered_mixer/EMX312SC.htm', 'Expandore, fiche EMX312SC'),
    ('https://www.andertons.co.uk/p/EMX312SC/powered-mixers/yamaha-emx312sc-600w-stereo-powered-mixer', 'Andertons, fiche EMX312SC (revendeur)')))
emx('yamaha-emx660', 'EMX660', 6, R(('https://www.manualsbase.com/manual/224069/musical_instrument/yamaha/emx660/', 'Yamaha, mode d\'emploi EMX660 (archive de manuels)')))

sheet('yamaha-vxs3f', 'speaker', M, 'VXS3F', 'speaker', R(('https://www.fullcompass.com/prod/590617-yamaha-vxs3f-3-5-low-impedance-surface-mount-speaker-8-ohm', 'Full Compass, fiche VXS3F (revendeur)')),
      [P('in', 'Input', 'in', 'audioAnalog', 'terminal', level='speaker', format='Euroblock 4 points (entrée + recopie), 8 Ω'),
       P('thru', 'Thru', 'out', 'audioAnalog', 'terminal', level='speaker', format='Recopie (même bornier)')], status='community', powerW=40)
for model, w, fmt in (('VXS5', None, 'Basse ou haute impédance (70 / 100 V)'), ('VXS8', None, 'Basse ou haute impédance (70 / 100 V)')):
    sheet('yamaha-' + model.lower(), 'speaker', M, model, 'speaker', R(('https://hu.yamaha.com/products/proaudio/speakers/vxs/guide.html', 'Yamaha, guide de la gamme VXS')),
          [P('in', 'Input', 'in', 'audioAnalog', U, level='speaker', format=fmt + ' ; borne non précisée')], status='community')
sheet('yamaha-vxs10s', 'speaker', M, 'VXS10S', 'speaker', R(('https://muzeekworld.com/collections/passive-speakers/products/yamaha-vxs10s-10-surface-mount-subwoofer-low-impedance-for-studio-or-live-use', 'Muzeek World, fiche VXS10S (revendeur)')),
      [P('in', 'Input', 'in', 'audioAnalog', U, level='speaker', format='Sub passif, transformateur basse / haute impédance'),
       P('satL', 'Sortie satellites', 'out', 'audioAnalog', U, level='speaker', format='Vers enceintes satellites, 4 Ω minimum par sortie')], status='community')

sheet('yamaha-stagepas-1k', 'speaker', M, 'STAGEPAS 1K', 'speaker', R(('https://www.alamomusic.com/products/yamaha-stagepas-1k-1000-watt-5-channel-portable-column-pa-system', 'Alamo Music, fiche STAGEPAS 1K (revendeur)'),
      ('https://usa.yamaha.com/products/proaudio/pa_systems/stagepas_1k/training.html', 'Yamaha, formation STAGEPAS 1K')),
      [mic(1, U, 'Micro/ligne, Hi-Z'), mic(2, U, 'Micro/ligne, Hi-Z'), mic(3, U, 'Micro/ligne'),
       line('st', 'Stereo In', U, ch=2, fmt='Jack 6,35 ou mini-jack 3,5 mm'),
       P('bt', 'Bluetooth', 'in', 'audioDigital', 'rf', channels=2, format='Bluetooth 5.0, A2DP'),
       P('link', 'Link Out', 'out', 'audioAnalog', 'xlr3', format='Vers un second STAGEPAS 1K'),
       line('mon', 'Monitor Out', U, 'out'), P('fs', 'Foot Switch', 'in', 'control', U, format='Réverbération'),
       P('ac', 'Secteur', 'in', 'power', U, format='1000 W (HF 190 W + LF 810 W)')], status='community', powerW=1000)

def spx(id, model, srcs, digital=False, status='community'):
    ports = [line('inL', 'Input L', 'combo', fmt='XLR et jack TRS, symétrique'), line('inR', 'Input R', 'combo', fmt='XLR et jack TRS, symétrique'),
             line('outL', 'Output L', 'combo', 'out', fmt='XLR et jack TRS'), line('outR', 'Output R', 'combo', 'out', fmt='XLR et jack TRS'),
             P('midiIn', 'MIDI In', 'in', 'control', 'din5'), P('midiOut', 'MIDI Out/Thru', 'out', 'control', 'din5')]
    if digital:
        ports += [P('aesIn', 'AES/EBU In', 'in', 'audioDigital', 'xlr3', channels=2), P('aesOut', 'AES/EBU Out', 'out', 'audioDigital', 'xlr3', channels=2),
                  P('wc', 'Word Clock In', 'in', 'sync', 'bnc'), P('usb', 'USB', 'bidir', 'control', U)]
    else:
        ports += [P('fs', 'Foot Switch', 'in', 'control', U)]
    ports.append(P('ac', 'Secteur', 'in', 'power', U))
    sheet(id, 'processing', M, model, 'processor', srcs, ports, status=status, rackU=1)
spx('yamaha-spx2000', 'SPX2000', R(('https://my.yamaha.com/files/download/other_assets/3/322303/SPX2000_datasheet.pdf', 'Yamaha, fiche technique SPX2000'),
    ('https://barryrudolph.com/mix/yamahaspx2000.html', 'Mix, test SPX2000')), digital=True)
spx('yamaha-spx990', 'SPX990', R(('https://www.pssl.com/products/yamaha-spx990-20-bit-digital-multi-effect-processo', 'PSSL, fiche SPX990 (revendeur)'),
    ('https://rapmag.com/a/93/jun93/yamaha-spx-990-effects-processor-review', 'Recording, test SPX990 (1993)')))
sheet('yamaha-spx900', 'processing', M, 'SPX900', 'processor', [src(None, 'Catalogue Novelty 2025 ; documentation Yamaha non trouvée')], [
    line('in', 'Input', U, fmt='Connecteur non précisé'), line('outL', 'Output L', U, 'out'), line('outR', 'Output R', U, 'out'),
    P('ac', 'Secteur', 'in', 'power', U)], status='community', rackU=1)

# Cartes d'extension
def card(id, model, srcs, ports, fmt='Mini-YGDAI'):
    sheet(id, 'processing', M, model, 'processor', srcs, ports + [P('slot', 'Slot carte', 'bidir', 'audioDigital', U, format=f'Se loge dans un slot {fmt} de la console')], status='community')
card('yamaha-my8-adda96', 'MY8-ADDA96', R(('https://de.yamaha.com/files/download/other_assets/4/1098684/MY8-ADDA96_datasheet.pdf', 'Yamaha, fiche technique MY8-ADDA96')),
     [line(f'in{i}', f'Analog In {i}', 'terminal', fmt='Euroblock symétrique, +24 dBu max') for i in range(1, 9)]
     + [line(f'out{i}', f'Analog Out {i}', 'terminal', 'out', fmt='Euroblock symétrique') for i in range(1, 9)])
card('yamaha-my16-at', 'MY16-AT', R(('https://es.yamaha.com/files/download/other_assets/0/1098700/MY16-AT_datasheet.pdf', 'Yamaha, fiche technique MY16-AT')),
     [P('in1', 'ADAT In 1-8', 'in', 'audioDigital', 'toslink', channels=8), P('in2', 'ADAT In 9-16', 'in', 'audioDigital', 'toslink', channels=8),
      P('out1', 'ADAT Out 1-8', 'out', 'audioDigital', 'toslink', channels=8), P('out2', 'ADAT Out 9-16', 'out', 'audioDigital', 'toslink', channels=8)])
card('yamaha-py8-ae', 'PY8-AE', R(('https://www.fullcompass.com/prod/621888-yamaha-py8-ae-8x8-aes-ebu-format-with-input-src', 'Full Compass, fiche PY8-AE (revendeur)')),
     [P('aes', 'AES/EBU', 'bidir', 'audioDigital', 'dsub25', channels=8, format='D-sub 25 : 8 entrées / 8 sorties (4 paires AES3 chacune), SRC en entrée')], fmt='PY (DM7)')
NOV = [src(None, 'Catalogue Novelty 2025 ; fiche technique Yamaha non trouvée')]
card('yamaha-my4-da', 'MY4-DA', NOV, [line(f'out{i}', f'Analog Out {i}', U, 'out', fmt='Connecteur non précisé') for i in range(1, 5)])
card('yamaha-my16-es64', 'MY16-ES64', NOV, [P('es', 'EtherSound', 'bidir', 'audioIp', U, channels=16, format='EtherSound ; connecteurs non précisés')])
