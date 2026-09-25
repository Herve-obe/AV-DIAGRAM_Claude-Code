from common import P, src, sheet, written
M = 'Shure'
def S(guide, name): return [src(f'https://pubs.shure.com/guide/{guide}/en-US', f'Shure, guide d\'utilisation {name} (pubs.shure.com)')]
RX = lambda: P('rf', 'Réception HF', 'in', 'audioAnalog', 'rf', format='Liaison radio avec les émetteurs compatibles')
TX = lambda: P('rf', 'Émission HF', 'out', 'audioAnalog', 'rf', format='Liaison radio vers le récepteur')

def ad4(model, n):
    ports = [RX(),
             P('antA', 'Antenne A', 'in', 'rf', 'bnc', format='Entrée coaxiale 50 Ω ; alimentation d\'antenne 12 V commutable'),
             P('antB', 'Antenne B', 'in', 'rf', 'bnc', format='Entrée coaxiale 50 Ω ; alimentation d\'antenne 12 V commutable'),
             P('casC', 'Cascade RF C', 'out', 'rf', 'bnc', format='Recopie de l\'antenne A vers un récepteur supplémentaire' + (' ; entrée d\'antenne en mode Quadversity' if n == 4 else '')),
             P('casD', 'Cascade RF D', 'out', 'rf', 'bnc', format='Recopie de l\'antenne B vers un récepteur supplémentaire' + (' ; entrée d\'antenne en mode Quadversity' if n == 4 else ''))]
    for i in range(1, n + 1):
        extra = ' ; porte l\'AES3 quand il est activé' if (n == 4 and i >= 3) else ''
        ports.append(P(f'xlr{i}', f'Sortie XLR {i}', 'out', 'audioAnalog', 'xlr3', level='line+4', format='Symétrique à transformateur ; commutateur Mic/Line (-30 dB)' + extra))
        ports.append(P(f'jack{i}', f'Sortie jack {i}', 'out', 'audioAnalog', 'jack-trs', format='Jack 6,35, symétrique à transformateur'))
    if n == 2:
        ports.append(P('aes', 'Sortie AES3', 'out', 'audioDigital', 'unspecified', channels=2, format='Connecteur AES3 dédié (type non précisé dans le guide)'))
    ports += [P('ctrl1', 'Ethernet ctrl 1', 'bidir', 'network', 'rj45', format='Contrôle réseau (PoE selon le guide)'),
              P('ctrl2', 'Ethernet ctrl 2', 'bidir', 'network', 'rj45', format='Contrôle réseau'),
              P('dante1', 'Dante Primary', 'bidir', 'audioIp', 'rj45', format='Dante'),
              P('dante2', 'Dante Secondary', 'bidir', 'audioIp', 'rj45', format='Dante (redondant ou commuté)'),
              P('wcin', 'Word Clock In', 'in', 'sync', 'bnc', format='Horloge externe pour la sortie AES3'),
              P('wcthru', 'Word Clock Thru', 'out', 'sync', 'bnc', format='Recopie ; terminaison 75 Ω commutable'),
              P('phones', 'Casque', 'out', 'audioAnalog', 'jack-trs', channels=2, format='Face avant, 6,35 mm'),
              P('ac', 'Secteur', 'in', 'power', 'iec-c13', format='IEC verrouillable, 100-240 V'),
              P('acout', 'Recopie secteur', 'out', 'power', 'iec-c13', format='Cascade d\'alimentation IEC verrouillable')]
    sheet(f'shure-{model.lower()}', 'wireless', M, model, 'wireless', S(model, model), ports, rackU=1)
ad4('AD4D', 2)
ad4('AD4Q', 4)

sheet('shure-ad1', 'wireless', M, 'AD1', 'wireless', S('AD1', 'AD1'), [
    P('in', 'Entrée TA4', 'in', 'audioAnalog', 'ta4', level='mic', format='Mini XLR 4 (TA4) ; variante LEMO 3 existante'),
    TX(), P('ant', 'Antenne', 'out', 'rf', 'sma', format='Antenne quart d\'onde sur SMA')])
sheet('shure-ad2', 'wireless', M, 'AD2', 'wireless', S('AD2', 'AD2'), [TX()], weightKg=0.34)
sheet('shure-ad3', 'wireless', M, 'AD3', 'wireless', S('AD3', 'AD3'), [
    P('in', 'Entrée XLR', 'in', 'audioAnalog', 'xlr3', level='mic', phantom='supplied', format='XLR verrouillable, se fixe sur le micro ; alimentation fantôme disponible'),
    TX(), P('usb', 'USB-C', 'bidir', 'control', 'usb-c')], weightKg=0.24)
sheet('shure-adx1m', 'wireless', M, 'ADX1M', 'wireless', S('ADX1M', 'ADX1M'), [
    P('in', 'Entrée LEMO', 'in', 'audioAnalog', 'lemo3', level='mic', format='LEMO 3 points'),
    TX()], weightKg=0.1)
sheet('shure-ua845uwb', 'wireless', M, 'UA845UWB', 'wireless', S('UA845UWB', 'UA845UWB'), [
    P('inA', 'Antenna In A', 'in', 'rf', 'bnc'), P('inB', 'Antenna In B', 'in', 'rf', 'bnc'),
    *[P(f'out{c}{i}', f'RF Out {c} {i}', 'out', 'rf', 'bnc', format='Vers un récepteur (jusqu\'à 4)') for c in 'AB' for i in range(1, 5)],
    P('casA', 'RF Cascade A', 'out', 'rf', 'bnc', format='Vers un 5e récepteur ou un autre UA845UWB'),
    P('casB', 'RF Cascade B', 'out', 'rf', 'bnc', format='Vers un 5e récepteur ou un autre UA845UWB'),
    *[P(f'dc{i}', f'15 V DC {i}', 'out', 'power', 'dc-barrel', format='Alimente un récepteur') for i in range(1, 5)],
    P('ac', 'AC Power In', 'in', 'power', 'unspecified'),
    P('acout', 'AC Power Out', 'out', 'power', 'unspecified', format='Chaînage de 5 récepteurs maximum')], rackU=1)
# Remarque : la page indique « quatre récepteurs » par sortie ; les ports RF Out sont modélisés par canal A et B.
def psm_tx(model, guide, eth):
    ports = [P('inL', 'Audio Input L', 'in', 'audioAnalog', 'combo', level='line+4', format='XLR mâle ou jack TRS 6,35 ; symétrique ou non'),
             P('inR', 'Audio Input R', 'in', 'audioAnalog', 'combo', level='line+4', format='XLR mâle ou jack TRS 6,35 ; une seule prise pour le mono'),
             P('loopL', 'Loop Out L', 'out', 'audioAnalog', 'unspecified', format='Recopie de l\'entrée ; connecteur non précisé dans le guide'),
             P('loopR', 'Loop Out R', 'out', 'audioAnalog', 'unspecified', format='Recopie de l\'entrée ; connecteur non précisé dans le guide'),
             P('ant', 'Antenne', 'out', 'rf', 'bnc'), TX(),
             P('phones', 'Casque', 'out', 'audioAnalog', 'jack-trs', channels=2, format='Écoute en façade')]
    if eth:
        ports += [P('eth', 'Ethernet', 'bidir', 'network', 'rj45', format='Double port RJ45'),
                  P('ac', 'Secteur', 'in', 'power', 'iec-c13', format='IEC 100-240 V'),
                  P('acout', 'Recopie secteur', 'out', 'power', 'iec-c13', format='Non commutée')]
    else:
        ports += [P('dc', 'Power', 'in', 'power', 'dc-barrel', format='Adaptateur secteur fourni')]
    sheet(f'shure-{model.lower()}', 'wireless', M, model, 'wireless', S(guide, guide), ports, rackU=1)
psm_tx('P10T', 'PSM1000', True)
psm_tx('P9T', 'PSM900', False)
for model, guide in (('P10R+', 'PSM1000'), ('P9RA+', 'PSM900')):
    sheet(f'shure-{model.lower().replace("+", "-plus")}', 'wireless', M, model, 'wireless', S(guide, guide), [
        P('rf', 'Réception HF', 'in', 'audioAnalog', 'rf', format='Liaison radio avec l\'émetteur'),
        P('ear', 'Écouteurs', 'out', 'audioAnalog', 'minijack', channels=2, format='Jack 3,5 mm'),
        P('ant', 'Antenne', 'in', 'rf', 'sma')])
sheet('shure-slxd4d', 'wireless', M, 'SLXD4D', 'wireless', S('SLXD', 'SLX-D'), [
    RX(), P('antA', 'Antenne A', 'in', 'rf', 'bnc'), P('antB', 'Antenne B', 'in', 'rf', 'bnc'),
    *[P(f'xlr{i}', f'Sortie XLR {i}', 'out', 'audioAnalog', 'xlr3', format='Symétrique ; une par canal par analogie avec le SLXD4, à vérifier') for i in (1, 2)],
    *[P(f'jack{i}', f'Sortie jack {i}', 'out', 'audioAnalog', 'jack-trs', format='Instrument/auxiliaire, symétrie d\'impédance ; une par canal, à vérifier') for i in (1, 2)],
    P('eth', 'Ethernet', 'bidir', 'network', 'rj45'), P('dc', 'Alimentation', 'in', 'power', 'dc-barrel')], status='community', rackU=1)
sheet('shure-slxd1', 'wireless', M, 'SLXD1', 'wireless', S('SLXD', 'SLX-D'), [P('in', 'Entrée TA4M', 'in', 'audioAnalog', 'ta4', level='mic'), TX(), P('usb', 'USB-C', 'bidir', 'control', 'usb-c')])
sheet('shure-slxd2', 'wireless', M, 'SLXD2', 'wireless', S('SLXD', 'SLX-D'), [TX(), P('usb', 'USB-C', 'bidir', 'control', 'usb-c')])
print(len(written), 'fiches Shure')
