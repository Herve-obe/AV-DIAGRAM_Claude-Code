from common import P, src, sheet, written
M = 'Blackmagic Design'
def S(fam, code, name):
    return [src(f'https://www.blackmagicdesign.com/products/{fam}/techspecs/{code}', f'Blackmagic Design, fiche technique {name} ({code})')]
SDI = lambda id, name, d, fmt='SDI (BNC)': P(id, name, d, 'video', 'bnc', format=fmt)
def sdis(prefix, label, n, d, fmt):
    return [SDI(f'{prefix}{i}', f'{label} {i}', d, fmt) for i in range(1, n + 1)]

# Mélangeurs ATEM Mini
def atem_mini(code, model, n_in, n_hdmi_out, audio_out, usb):
    ports = [P(f'hdmi{i}', f'HDMI In {i}', 'in', 'video', 'hdmi', format='HDMI type A, HD 10 bits, audio 2 canaux intégré') for i in range(1, n_in + 1)]
    ports += [P(f'hdmiout{i}', f'HDMI Out {i}', 'out', 'video', 'hdmi', format='Programme ou auxiliaire') for i in range(1, n_hdmi_out + 1)]
    ports += [P('mic1', 'Mic 1', 'in', 'audioAnalog', 'minijack', channels=2, format='Mini-jack 3,5 stéréo, alimentation plug-in'),
              P('mic2', 'Mic 2', 'in', 'audioAnalog', 'minijack', channels=2, format='Mini-jack 3,5 stéréo, alimentation plug-in')]
    if audio_out:
        ports.append(P('phones', 'Sortie audio', 'out', 'audioAnalog', 'minijack', channels=2, format='Mini-jack 3,5 stéréo'))
    ports.append(P('eth', 'Ethernet', 'bidir', 'network', 'rj45', format='1 Gb/s : streaming, contrôle, panneau'))
    ports += [P(f'usb{i}', f'USB-C {i}' if usb > 1 else 'USB-C', 'bidir', 'control', 'usb-c', format='Enregistrement, webcam, contrôle') for i in range(1, usb + 1)]
    ports.append(P('dc', 'Alimentation 12 V', 'in', 'power', 'dc-barrel', format='Bloc externe 12 V fourni'))
    sheet(f'blackmagic-{model.lower().replace(" ", "-")}', 'videoSwitcher', M, model, 'switcher', S('atemmini', code, model), ports)
atem_mini('W-APS-14', 'ATEM Mini Pro', 4, 1, False, 1)
atem_mini('W-APS-15', 'ATEM Mini Pro ISO', 4, 1, False, 1)
atem_mini('W-APS-17', 'ATEM Mini Extreme', 8, 2, True, 2)

# ATEM Television Studio HD8
ports = sdis('in', 'SDI In', 8, 'in', '3G-SDI, audio 4 canaux intégré')
ports += sdis('out', 'SDI Out', 12, 'out', '3G-SDI ; programme, auxiliaires et multiview')
ports += [P('hdmiout', 'HDMI Out', 'out', 'video', 'hdmi', format='Multiview'),
          P('refin', 'Reference In', 'in', 'sync', 'bnc', format='Tri-level ou black burst'),
          P('refout', 'Reference Out', 'out', 'sync', 'bnc'),
          P('tcin', 'Timecode In', 'in', 'sync', 'bnc'), P('tcout', 'Timecode Out', 'out', 'sync', 'bnc'),
          P('xlr1', 'Audio In 1', 'in', 'audioAnalog', 'xlr3', level='line+4', format='XLR symétrique'),
          P('xlr2', 'Audio In 2', 'in', 'audioAnalog', 'xlr3', level='line+4', format='XLR symétrique'),
          P('rca', 'Audio In RCA', 'in', 'audioAnalog', 'rca', level='line-10', channels=4, format='2 paires RCA stéréo'),
          P('madiin', 'MADI In', 'in', 'audioDigital', 'bnc', channels=32, format='MADI 32 canaux sur BNC'),
          P('madiout', 'MADI Out', 'out', 'audioDigital', 'bnc', channels=64, format='MADI 64 canaux sur BNC (50 actifs)'),
          *[P(f'jack{i}', f'Audio Out {i}', 'out', 'audioAnalog', 'jack-trs', level='line+4', format='Jack 6,35') for i in range(1, 5)],
          P('tbin', 'Talkback In', 'in', 'intercom', 'xlr5', format='XLR 5 points'),
          P('tbout', 'Talkback Out', 'out', 'intercom', 'xlr5', format='XLR 5 points'),
          P('tbrj', 'Talkback RJ45', 'bidir', 'intercom', 'rj45', format='Systèmes d\'ordres tiers'),
          P('rs422', 'Remote RS-422', 'bidir', 'control', 'rj12'),
          *[P(f'eth{i}', f'Ethernet {i}', 'bidir', 'network', 'rj45', format='Switch 4 ports intégré, 1 Gb/s') for i in range(1, 5)],
          P('usb1', 'USB-C 1', 'bidir', 'control', 'usb-c'), P('usb2', 'USB-C 2', 'bidir', 'control', 'usb-c'),
          P('ac', 'Secteur', 'in', 'power', 'unspecified', format='Alimentation interne 100-240 V')]
sheet('blackmagic-atem-television-studio-hd8', 'videoSwitcher', M, 'ATEM Television Studio HD8', 'switcher', S('atemtelevisionstudio', 'W-APS-20', 'ATEM Television Studio HD8'), ports)

# Constellation
def constellation(code, model, n_in, n_out, mv, rate, power, madi, rs422, n_psu):
    ports = sdis('in', 'SDI In', n_in, 'in', f'SDI {rate}')
    ports += sdis('out', 'SDI Out', n_out, 'out', f'SDI {rate} ; affectable (programme, preview, auxiliaire)')
    ports += sdis('mv', 'Multiview', mv, 'out', 'SDI')
    ports += [P('ref', 'Reference In', 'in', 'sync', 'unspecified', format='Tri-level ou black burst ; connecteur non précisé'),
              P('jin1', 'Audio In 1', 'in', 'audioAnalog', 'jack-trs', level='line+4', format='Jack 6,35 symétrique'),
              P('jin2', 'Audio In 2', 'in', 'audioAnalog', 'jack-trs', level='line+4', format='Jack 6,35 symétrique'),
              P('tbin', 'Talkback In', 'in', 'intercom', 'xlr5'), P('tbout', 'Talkback Out', 'out', 'intercom', 'xlr5'),
              P('tbrj', 'Talkback RJ45', 'bidir', 'intercom', 'rj45'),
              P('eth', 'Ethernet', 'bidir', 'network', 'rj45', format='Panneau de contrôle et réseau'),
              P('usb', 'USB-C', 'bidir', 'control', 'usb-c', format='Webcam et contrôle')]
    if madi:
        ports += [P('jout1', 'Audio Out 1', 'out', 'audioAnalog', 'jack-trs', level='line+4'),
                  P('jout2', 'Audio Out 2', 'out', 'audioAnalog', 'jack-trs', level='line+4'),
                  P('madiin', 'MADI In', 'in', 'audioDigital', 'bnc', channels=64, format='32 canaux stéréo'),
                  P('madiout1', 'MADI Out 1', 'out', 'audioDigital', 'bnc', channels=64, format='32 canaux stéréo'),
                  P('madiout2', 'MADI Out 2', 'out', 'audioDigital', 'bnc', channels=64, format='32 canaux stéréo')]
    if rs422:
        ports.append(P('rs422', 'Remote RS-422', 'bidir', 'control', 'rj12'))
    ports += [P(f'ac{i}', f'Secteur {i}' if n_psu > 1 else 'Secteur', 'in', 'power', 'unspecified', format=f'Alimentation interne 100-240 V ; {power}') for i in range(1, n_psu + 1)]
    sheet(f'blackmagic-{model.lower().replace(" ", "-").replace("/", "")}', 'videoSwitcher', M, model, 'switcher', S('atemconstellation', code, model), ports)
constellation('W-APS-26', 'ATEM 2 M/E Constellation HD', 20, 12, 2, '1,5G / 3G', '52 W', False, False, 1)
constellation('W-APS-42', 'ATEM 4 M/E Constellation 4K', 40, 28, 4, 'jusqu\'à 12G', '255 W', True, True, 2)

sheet('blackmagic-atem-micro-panel', 'control', M, 'ATEM Micro Panel', 'control', S('atemmini', 'W-ABP-11', 'ATEM Micro Panel'), [
    P('usb', 'USB-C', 'bidir', 'control', 'usb-c', format='Liaison avec l\'ordinateur et recharge'),
    P('bt', 'Bluetooth', 'bidir', 'control', 'rf', format='Bluetooth 5.1 LE')], domain='image')

# HyperDeck Studio
def hyperdeck(code, model, sdi_out, hdmi_in, rate, tc, ref, rs_out, phones, eth, usb, dc):
    ports = [SDI('in', 'SDI In', 'in', f'SDI {rate}, 16 canaux audio intégrés')]
    ports += [SDI(f'out{i}', f'SDI Out {i}', 'out', f'SDI {rate}') for i in range(1, sdi_out + 1)]
    if sdi_out > 1:
        ports.append(SDI('mon', 'SDI Monitor Out', 'out', 'SDI monitoring'))
    if hdmi_in:
        ports.append(P('hdmiin', 'HDMI In', 'in', 'video', 'hdmi', format='HDMI 2.0, 8 canaux audio'))
    ports += [P('hdmiout', 'HDMI Out', 'out', 'video', 'hdmi', format='8 canaux audio intégrés'),
              P('tcin', 'Timecode In', 'in', 'sync', tc), P('tcout', 'Timecode Out', 'out', 'sync', tc),
              P('refin', 'Reference In', 'in', 'sync', 'bnc', format='Tri-level ou black burst'), P('refout', 'Reference Out', 'out', 'sync', 'bnc'),
              P('rsin', 'RS-422 In', 'in', 'control', 'unspecified', format='Télécommande')]
    if rs_out:
        ports.append(P('rsout', 'RS-422 Out', 'out', 'control', 'unspecified'))
    if phones:
        ports.append(P('phones', 'Casque', 'out', 'audioAnalog', 'jack-trs', channels=2, format='6,35 mm'))
    ports += [P('eth', 'Ethernet', 'bidir', 'network', 'rj45', format=eth), P('usb', 'USB-C', 'bidir', 'control', 'usb-c', format=usb),
              P('ac', 'Secteur', 'in', 'power', 'unspecified', format='Alimentation interne 100-240 V')]
    if dc:
        ports.append(P('dc', 'Entrée 12 V DC', 'in', 'power', dc[0], format=dc[1]))
    sheet(f'blackmagic-{model.lower().replace(" ", "-")}', 'recording', M, model, 'recorder', S('hyperdeckstudio', code, model), ports, domain='image')
hyperdeck('W-HYD-11', 'HyperDeck Studio HD Mini', 1, False, '270M / 1,5G / 3G', 'bnc', True, False, False, '1 Gb/s', 'USB 3.0', ('dc-barrel', 'Jack 5,5 mm verrouillable'))
hyperdeck('W-HYD-12', 'HyperDeck Studio HD Plus', 2, True, 'jusqu\'à 6G', 'bnc', True, True, True, '1 Gb/s', 'USB 3.0', None)
hyperdeck('W-HYD-13', 'HyperDeck Studio HD Pro', 2, True, 'jusqu\'à 6G', 'xlr3', True, True, True, '1 Gb/s', 'USB 3.0', ('xlr4', 'XLR 4 points, alimentation externe ou batterie'))
hyperdeck('W-HYD-14', 'HyperDeck Studio 4K Pro', 2, True, 'jusqu\'à 12G', 'xlr3', True, True, True, '10 Gb/s', 'USB 3.1 Gen 2', None)

# Convertisseurs
def conv(fam, code, model, ports, dc='12 V universel fourni'):
    if dc:
        ports = ports + [P('usb', 'USB', 'bidir', 'control', 'unspecified', format='Mise à jour et configuration')]
    if dc:
        ports.append(P('dc', 'Alimentation', 'in', 'power', 'dc-barrel', format=dc))
    sheet(f'blackmagic-{model.lower().replace(" ", "-")}', 'videoRouting', M, model, 'router', S(fam, code, model), ports)
U = 'unspecified'
conv('miniconverters', 'W-CONM-00', 'Mini Converter Analog to SDI', [
    P('vin', 'Vidéo analogique In', 'in', 'video', U, format='NTSC, PAL, S-Vidéo ou composantes ; connecteurs non précisés'),
    P('ain', 'Audio analogique In', 'in', 'audioAnalog', U, channels=2, format='Symétrique ; connecteurs non précisés'),
    P('aes', 'AES/EBU In', 'in', 'audioDigital', U, channels=2),
    SDI('out1', 'SDI Out 1', 'out'), SDI('out2', 'SDI Out 2', 'out')])
conv('miniconverters', 'W-CONM-01', 'Mini Converter SDI to Analog', [
    SDI('in', 'SDI In', 'in'), SDI('alt', 'SDI In ALT', 'in', 'Secours automatique'), SDI('loop', 'SDI Loop Out', 'out'),
    P('vout', 'Vidéo analogique Out', 'out', 'video', U, format='NTSC, PAL, S-Vidéo ou composantes'),
    P('aout', 'Audio analogique Out', 'out', 'audioAnalog', 'jack-trs', channels=2, format='Jack 6,35 symétrique'),
    P('aes', 'AES/EBU Out', 'out', 'audioDigital', U, channels=2)])
conv('miniconverters', 'W-CONM-04', 'Mini Converter Audio to SDI', [
    SDI('in', 'SDI In', 'in'), SDI('alt', 'SDI In ALT', 'in', 'Secours automatique'), SDI('out', 'SDI Out', 'out', 'Audio intégré'),
    P('ain', 'Audio analogique In', 'in', 'audioAnalog', U, channels=4, format='4 canaux symétriques'),
    P('aes', 'AES/EBU In', 'in', 'audioDigital', U, channels=8)])
conv('miniconverters', 'W-CONM-13', 'Mini Converter SDI Distribution', [SDI('in', 'SDI In', 'in')] + sdis('out', 'SDI Out', 8, 'out', 'SDI (BNC), recopie de l\'entrée'))
conv('miniconverters', 'W-CONM-26', 'Mini Converter SDI to HDMI 6G', [
    SDI('in', 'SDI In', 'in', 'Jusqu\'à 6G'), SDI('alt', 'SDI In ALT', 'in', 'Secours automatique'), SDI('loop', 'SDI Loop Out', 'out'),
    P('hdmi', 'HDMI Out', 'out', 'video', 'hdmi'),
    P('aout', 'Audio analogique Out', 'out', 'audioAnalog', U, channels=2, format='Symétrique'),
    P('aes', 'AES/EBU Out', 'out', 'audioDigital', U, channels=2)])
conv('miniconverters', 'W-CONM-27', 'Mini Converter HDMI to SDI 6G', [
    P('hdmi', 'HDMI In', 'in', 'video', 'hdmi'), SDI('out1', 'SDI Out 1', 'out', 'Jusqu\'à 6G'), SDI('out2', 'SDI Out 2', 'out', 'Jusqu\'à 6G'),
    P('ain', 'Audio analogique In', 'in', 'audioAnalog', 'jack-trs', channels=2, format='Jack 6,35 symétrique'),
    P('aes', 'AES/EBU In', 'in', 'audioDigital', U, channels=2)])
conv('miniconverters', 'W-CONM-28', 'Mini Converter UpDownCross HD', [
    SDI('in', 'SDI In', 'in', 'Jusqu\'à 3G'), P('hdmiin', 'HDMI In', 'in', 'video', 'hdmi'),
    P('ref', 'Reference In', 'in', 'sync', U, format='Black burst ou tri-level'),
    SDI('loop', 'SDI Loop Out', 'out'), SDI('out1', 'SDI Out 1', 'out'), SDI('out2', 'SDI Out 2', 'out'),
    P('hdmiout', 'HDMI Out', 'out', 'video', 'hdmi')])
conv('microconverters', 'W-CONU-11', 'Micro Converter HDMI to SDI 3G', [
    P('hdmi', 'HDMI In', 'in', 'video', 'hdmi'), SDI('out1', 'SDI Out 1', 'out', 'Jusqu\'à 3G'), SDI('out2', 'SDI Out 2', 'out', 'Jusqu\'à 3G'),
    P('usbc', 'USB-C (alimentation)', 'in', 'power', 'usb-c', format='Alimentation, mise à jour et configuration')], dc=None)
conv('microconverters', 'W-CONU-12', 'Micro Converter SDI to HDMI 3G', [
    SDI('in', 'SDI In', 'in', 'Jusqu\'à 3G'), SDI('loop', 'SDI Loop Out', 'out'), P('hdmi', 'HDMI Out', 'out', 'video', 'hdmi'),
    P('usbc', 'USB-C (alimentation)', 'in', 'power', 'usb-c', format='Alimentation, mise à jour et configuration')], dc=None)
print(len(written), 'fiches Blackmagic')
