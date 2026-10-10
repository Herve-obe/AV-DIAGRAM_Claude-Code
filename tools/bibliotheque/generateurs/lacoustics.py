from common import P, src, sheet, written
M = 'L-Acoustics'
def page(slug): return f'https://www.l-acoustics.com/products/{slug}/'
def S(slug, name): return [src(page(slug), f'L-Acoustics, page produit {name}, spécifications')]
TWO = "Deux embases en parallèle d'usage (entrée ou recopie) ; la page produit ne précise pas leur câblage"

def passive(slug, id, model, family, weight, imp, conns, extra=''):
    ports = []
    for k, (cid, name, direction, connector, fmt) in enumerate(conns):
        ports.append(P(cid, name, direction, 'audioAnalog', connector, level='speaker', format=fmt))
    sheet(id, family, M, model, 'speaker', S(slug, model), ports, weightKg=weight)

def io_link(slug, id, model, weight, imp, desc):
    passive(slug, id, model, 'speaker', weight, imp, [
        ('in', 'Entrée speakON', 'in', 'speakon-nl4', f'{desc}, {imp}'),
        ('link', 'Link speakON', 'out', 'speakon-nl4', "Recopie de l'entrée (chaînage)")])

def two_bidir(slug, id, model, weight, imp, desc, connector='speakon-nl4', label='speakON'):
    passive(slug, id, model, 'speaker', weight, imp, [
        ('a', f'{label} A', 'bidir', connector, f'{desc}, {imp} ; {TWO}'),
        ('b', f'{label} B', 'bidir', connector, TWO)])

# Enceintes avec IN / LINK explicites
io_link('x8', 'l-acoustics-x8', 'X8', 12, '8 Ω', 'Coaxiale 2 voies passive')
io_link('x12', 'l-acoustics-x12', 'X12', 20, '8 Ω', 'Coaxiale 2 voies passive')
io_link('x15-hiq', 'l-acoustics-x15-hiq', 'X15 HiQ', 21, 'LF 8 Ω / HF 8 Ω', 'Coaxiale 2 voies active (LF et HF séparés)')
io_link('a15-focus', 'l-acoustics-a15-focus', 'A15 Focus', 35, '8 Ω', 'Enceinte 2 voies passive')
io_link('a15-wide', 'l-acoustics-a15-wide', 'A15 Wide', 33, '8 Ω', 'Enceinte 2 voies passive')
passive('5xt', 'l-acoustics-5xt', '5XT', 'speaker', 3.5, '16 Ω', [
    ('in', 'Entrée speakON', 'in', 'speakon-nl4', 'Coaxiale 2 voies passive, 16 Ω'),
    ('link', 'Link speakON', 'out', 'speakon-nl4', "Recopie de l'entrée (chaînage)"),
    ('term', 'Borniers à vis (IN/LINK)', 'bidir', 'terminal', '2 borniers 2 points, alternative aux speakON')])

# Deux embases sans rôle précisé
two_bidir('k3', 'l-acoustics-k3', 'K3', 43, 'LF 8 Ω / HF 8 Ω', 'Ligne source 2 voies active')
two_bidir('kara-ii', 'l-acoustics-kara-ii', 'Kara II', 26, 'LF 8 Ω / HF 8 Ω', 'Ligne source 2 voies active')
two_bidir('kiva-ii', 'l-acoustics-kiva-ii', 'Kiva II', 14, '16 Ω', 'Ligne source 2 voies passive')
two_bidir('a10-focus', 'l-acoustics-a10-focus', 'A10 Focus', 22, '8 Ω', 'Enceinte 2 voies passive')
two_bidir('a10-wide', 'l-acoustics-a10-wide', 'A10 Wide', 20, '8 Ω', 'Enceinte 2 voies passive')
two_bidir('sb18', 'l-acoustics-sb18', 'SB18', 52, '8 Ω', 'Caisson de grave 18"')
two_bidir('sb15m', 'l-acoustics-sb15m', 'SB15m', 36, '8 Ω', 'Caisson de grave 15"')
two_bidir('ks21', 'l-acoustics-ks21', 'KS21', 49, '8 Ω', 'Caisson de grave 21"', connector='terminal', label='Bornier 4 points')
two_bidir('k2', 'l-acoustics-k2', 'K2', 56, 'LF 2 x 8 Ω / MF 8 Ω / HF 16 Ω', 'Ligne source 3 voies active', connector='pa-com', label='PA-COM 8 points')

# Une seule embase
passive('ks28', 'l-acoustics-ks28', 'KS28', 'speaker', 79, '4 Ω', [('in', 'Entrée speakON', 'in', 'speakon-nl4', 'Caisson de grave 2 x 18", 4 Ω')])
passive('l2', 'l-acoustics-l2', 'L2', 'speaker', 158, 'LC/LF/HF 8 Ω', [('in', 'Entrée 37 points', 'in', 'multipin-37', 'Ligne source ; connecteur mâle 37 points (32 utilisés), LC/LF/HF 8 Ω')])
passive('soka', 'l-acoustics-soka', 'Soka', 'speaker', 9.4, '8 Ω', [('in', 'Bornier 4 points', 'in', 'terminal', 'Enceinte colonne passive, 8 Ω ; bornier à vis 4 points')])
passive('sb10i', 'l-acoustics-sb10i', 'SB10i', 'speaker', 15, '8 Ω', [('in', 'Bornier 4 points', 'in', 'terminal', 'Caisson de grave, 8 Ω ; bornier push-in 4 points')])
AC = 'Liaison AutoConnect entre éléments Syva (voir la documentation)'
passive('syva', 'l-acoustics-syva', 'Syva', 'speaker', 21, '8 Ω', [
    ('in', 'Entrée speakON', 'in', 'speakon-nl4', 'Enceinte colinéaire, 8 Ω'),
    ('term', 'Bornier à vis 2 points', 'in', 'terminal', 'Alternative au speakON'),
    ('ac', 'AutoConnect', 'bidir', 'unspecified', AC)])
passive('syva-low', 'l-acoustics-syva-low', 'Syva Low', 'speaker', 29, '4 Ω', [
    ('in', 'Entrée speakON', 'in', 'speakon-nl4', 'Renfort de grave de Syva, 4 Ω'),
    ('ac', 'AutoConnect', 'bidir', 'unspecified', AC)])
passive('syva-sub', 'l-acoustics-syva-sub', 'Syva Sub', 'speaker', 27, '8 Ω', [
    ('in', 'Entrée speakON', 'in', 'speakon-nl4', 'Caisson de grave de Syva, 8 Ω'),
    ('ac', 'AutoConnect', 'bidir', 'unspecified', AC)])

# Contrôleurs amplifiés
def amp_io(analog_first_aes=True):
    ps = [P('avb1', 'etherCON 1 (Milan-AVB)', 'bidir', 'audioIp', 'ethercon', channels=4, format='Milan-AVB 1 Gb/s, audio et contrôle ; 4 canaux d\'un flux'),
          P('avb2', 'etherCON 2 (Milan-AVB)', 'bidir', 'audioIp', 'ethercon', channels=4, format='Redondance ou chaînage réseau')]
    for i in range(1, 5):
        fmt = 'Analogique ; commutable en AES3 (2 canaux)' if i <= 2 else 'Analogique'
        ps.append(P(f'in{i}', f'Entrée {i}', 'in', 'audioAnalog', 'xlr3', level='line+4', format=f'XLR 3 femelle, {fmt}'))
    for i in range(1, 5):
        ps.append(P(f'link{i}', f'Link {i}', 'out', 'audioAnalog', 'xlr3', level='line+4', format=f"XLR 3 mâle, recopie de l'entrée {i}"))
    return ps

sheet('l-acoustics-la4x', 'amplification', M, 'LA4X', 'amp', S('la4x', 'LA4X'),
      amp_io() + [P(f'out{i}', f'Sortie HP {i}', 'out', 'audioAnalog', 'speakon-nl4', level='speaker', format='4 x 1000 W à 4 et 8 Ω ; la page indique « 4 x SpeakON »') for i in range(1, 5)]
      + [P('ac', 'Secteur', 'in', 'power', 'unspecified', format='100-240 V ±10 %, 50-60 Hz ; connecteur non précisé sur la page')],
      weightKg=11.3, rackU=2)
sheet('l-acoustics-la12x', 'amplification', M, 'LA12X', 'amp', S('la12x', 'LA12X'),
      amp_io() + [P('out12', 'Sortie HP 1-2', 'out', 'audioAnalog', 'speakon-nl4', level='speaker', channels=2, format='speakON 4 points, canaux 1 et 2'),
                  P('out34', 'Sortie HP 3-4', 'out', 'audioAnalog', 'speakon-nl4', level='speaker', channels=2, format='speakON 4 points, canaux 3 et 4'),
                  P('cacom', 'Sortie CA-COM', 'out', 'audioAnalog', 'ca-com', level='speaker', channels=4, format='CA-COM 8 points, 4 canaux ; 4 x 2600 W à 4 Ω'),
                  P('ac', 'Secteur', 'in', 'power', 'unspecified', format='100-240 V ±10 %, 50-60 Hz ; connecteur non précisé sur la page')],
      weightKg=14.5, rackU=2)
sheet('l-acoustics-la7-16', 'amplification', M, 'LA7.16', 'amp', S('la7-16', 'LA7.16'),
      [P('avb1', 'etherCON 1 (Milan-AVB)', 'bidir', 'audioIp', 'ethercon', format='Milan-AVB 1 Gb/s, audio et contrôle'),
       P('avb2', 'etherCON 2 (Milan-AVB)', 'bidir', 'audioIp', 'ethercon', format='Redondance réseau'),
       P('tb', 'Bornier 12 points', 'bidir', 'audioAnalog', 'terminal', format='Entrées et link AES3 ou analogiques, et 3 GPIO'),
       P('sc32', 'Sortie SC32', 'out', 'audioAnalog', 'sc32', level='speaker', channels=16, format='16 canaux ; 16 x 1100 W à 4 Ω'),
       P('ac', 'Secteur', 'in', 'power', 'powercon', format='powerCON 32 A ; 16 A sous 200-240 V, 30 A sous 100-120 V')],
      weightKg=15.8, rackU=2)
sheet('l-acoustics-la2xi', 'amplification', M, 'LA2Xi', 'amp', S('la2xi', 'LA2Xi'),
      [P('avb1', 'etherCON 1 (Milan-AVB)', 'bidir', 'audioIp', 'ethercon', format='Milan-AVB 1 Gb/s, audio et contrôle'),
       P('avb2', 'etherCON 2 (Milan-AVB)', 'bidir', 'audioIp', 'ethercon', format='Redondance réseau'),
       *[P(f'in{i}', f'Entrée {i}', 'in', 'audioAnalog', 'terminal', level='line+4', format='Bornier 3 points' + (' ; commutable AES3' if i <= 2 else '')) for i in range(1, 5)],
       P('aeslink', 'Link AES3', 'out', 'audioDigital', 'terminal', format='2 borniers 3 points, recopie AES3 active'),
       P('out12', 'Sortie HP A', 'out', 'audioAnalog', 'terminal', level='speaker', channels=2, format='Bornier femelle 4 points'),
       P('out34', 'Sortie HP B', 'out', 'audioAnalog', 'terminal', level='speaker', channels=2, format='Bornier femelle 4 points'),
       P('gpio', 'GPIO', 'bidir', 'control', 'terminal', format='4 entrées/sorties sur bornier 10 points'),
       P('ac', 'Secteur', 'in', 'power', 'unspecified', format='100-240 V ±10 %, 50-60 Hz')],
      weightKg=4.4, rackU=1)
sheet('l-acoustics-p1', 'processing', M, 'P1', 'processor', S('p1', 'P1'),
      [P('avb1', 'etherCON 1 (Milan-AVB)', 'bidir', 'audioIp', 'ethercon', channels=8, format='8 canaux (2 flux) en entrée et en sortie, 48 ou 96 kHz'),
       P('avb2', 'etherCON 2 (Milan-AVB)', 'bidir', 'audioIp', 'ethercon', channels=8, format='Redondance réseau Milan'),
       *[P(f'mic{i}', f'Entrée micro/ligne {i} (façade)', 'in', 'audioAnalog', 'xlr3', level='mic', phantom='supplied', format='XLR 3 femelle, 48 V, gain 0 à 60 dB') for i in range(1, 5)],
       *[P(f'lin{i}', f'Entrée ligne {i}', 'in', 'audioAnalog', 'xlr3', level='line+4', format='XLR 3 femelle (face arrière)') for i in range(1, 5)],
       P('aesin12', 'Entrée AES 1-2', 'in', 'audioDigital', 'xlr3', channels=2, format='AES3, XLR 3 femelle'),
       P('aesin34', 'Entrée AES 3-4', 'in', 'audioDigital', 'xlr3', channels=2, format='AES3, XLR 3 femelle'),
       *[P(f'lout{i}', f'Sortie ligne {i}', 'out', 'audioAnalog', 'xlr3', level='line+4', format='XLR 3 mâle') for i in range(1, 5)],
       P('aesout12', 'Sortie AES 1-2', 'out', 'audioDigital', 'xlr3', channels=2, format='AES3, XLR 3 mâle, 96 kHz 24 bits'),
       P('aesout34', 'Sortie AES 3-4', 'out', 'audioDigital', 'xlr3', channels=2, format='AES3, XLR 3 mâle, 96 kHz 24 bits'),
       P('gpio', 'GPIO', 'bidir', 'control', 'dsub9', format='2 GPI + 2 GPO sur DB9 femelle'),
       P('ac', 'Secteur', 'in', 'power', 'iec-c13', format='IEC C13 verrouillable, 100-240 V')],
      weightKg=3.7, rackU=1)
sheet('l-acoustics-ls10', 'network', M, 'LS10', 'switch', S('ls10', 'LS10'),
      [*[P(f'eth{i}', f'etherCON {i}', 'bidir', 'network', 'ethercon', format=('Face avant' if i <= 5 else 'Face arrière') + ', AVB 1 Gb/s') for i in range(1, 9)],
       P('sfp1', 'SFP 1', 'bidir', 'network', 'sfp', format='Cage SFP 1 Gb/s (arrière)'),
       P('sfp2', 'SFP 2', 'bidir', 'network', 'sfp', format='Cage SFP 1 Gb/s (arrière)'),
       P('ac', 'Secteur', 'in', 'power', 'iec-c13', format='IEC C13 verrouillable, 100-240 V ; 10 W à 20 W'),
       P('dcin', 'Secours 24 V DC (entrée)', 'in', 'power', 'unspecified', format='Alimentation redondante 24 V DC'),
       P('dcout', 'Secours 24 V DC (sortie)', 'out', 'power', 'unspecified', format='Alimente un autre LS10')],
      weightKg=1.5, rackU=1)
print(len(written), 'fiches L-Acoustics')
