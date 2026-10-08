# L-Acoustics : modèles arrêtés (archives de documentation L-Acoustics) et racks LA-RAK II / III AVB.
from common import P, src, sheet
M = 'L-Acoustics'
U = 'unspecified'
A = 'https://prdstglaxxwe001.blob.core.windows.net/webapp-lacoustics/documentation/ARCHIVES'
def AR(path, doc): return [src(f'{A}/{path}', f'L-Acoustics, archive de documentation : {doc}')]
def W(slug, name): return [src(f'https://www.l-acoustics.com/products/{slug}/', f'L-Acoustics, page produit {name}')]

def spk_in(id, name, conn, fmt): return P(id, name, 'in', 'audioAnalog', conn, level='speaker', format=fmt)

# Amplificateur LA8 et racks
sheet('l-acoustics-la8', 'amplification', M, 'LA8', 'amp', AR('LA8/documents.zip', 'LA8 Owner\'s manual, spécifications LA4-LA8'), [
    P('inA', 'Analog In A', 'in', 'audioAnalog', 'xlr3', level='line+4'), P('inB', 'Analog In B', 'in', 'audioAnalog', 'xlr3', level='line+4'),
    P('linkA', 'Analog Link A', 'out', 'audioAnalog', 'xlr3', level='line+4', format='Recopie passive'), P('linkB', 'Analog Link B', 'out', 'audioAnalog', 'xlr3', level='line+4', format='Recopie passive'),
    P('aesIn', 'AES/EBU In A&B', 'in', 'audioDigital', 'xlr3', channels=2, format='Carte LA-AES3'), P('aesLink', 'AES/EBU Link', 'out', 'audioDigital', 'xlr3', channels=2, format='Recopie active'),
    P('net1', 'L-NET 1', 'bidir', 'network', 'ethercon'), P('net2', 'L-NET 2', 'bidir', 'network', 'ethercon'),
    *[P(f'spk{i}', f'speakON {i}', 'out', 'audioAnalog', 'speakon-nl4', level='speaker') for i in range(1, 3)],
    P('cacom', 'Sortie 8 points', 'out', 'audioAnalog', 'ca-com', level='speaker', format='4 canaux sur un connecteur'),
    P('ac', 'Secteur', 'in', 'power', U, format='230 V')], weightKg=None)
sheet('l-acoustics-la-rak', 'amplification', M, 'LA-RAK', 'amp', AR('LA-RAK/documents.zip', 'LA-RAK User manual'), [
    P('sigIn', 'Signal Input', 'in', 'audioAnalog', 'pa-com', channels=6, format='PA-COM 19 points (6 voies analogiques)'),
    P('sigOut', 'Signal Output', 'out', 'audioAnalog', 'pa-com', channels=6, format='PA-COM 19 points (recopie)'),
    *[P(f'xlr{i}', f'Out XLR {i}', 'out', 'audioAnalog', 'xlr3', level='line+4', format='Distribution vers les LA8') for i in range(1, 7)],
    *[P(f'cacom{i}', f'LA8 {i} CA-COM', 'out', 'audioAnalog', 'ca-com', level='speaker', format='Sorties HP des 3 LA8 (CA-COM et speakON)') for i in range(1, 4)],
    P('acIn', 'AC In', 'in', 'power', U, format='32 A triphasé (LA-POWER)'), P('acLink', 'AC Link Out', 'out', 'power', U, format='Alimente un second rack')])
for model, slug, amp, w, n in (('LA-RAK II AVB', 'la-rak-ii-avb', 'LA12X', 101.5, 6), ('LA-RAK III', 'la-rak-iii', 'LA7.16', 117.5, 3)):
    ports = [P('acIn', 'AC In', 'in', 'power', 'p17-32-tri', format='32 A IEC 60309 triphasé (EU)'),
             P('acLink', 'AC Link', 'out', 'power', 'p17-32-tri', format='32 A IEC 60309 femelle')]
    if n == 6:
        ports += [P(f'cacomIn{i}', f'Analog CA-COM {i}', 'bidir', 'audioAnalog', 'ca-com', channels=8, format='CA-COM 19 points, entrée / recopie') for i in (1, 2)]
    ports += [P(f'in{i}', f'Analog/AES In {i}', 'in', 'audioAnalog', 'xlr3', level='line+4', format='XLR femelle, analogique ou AES/EBU') for i in range(1, 4)]
    ports += [P(f'link{i}', f'Analog/AES Link {i}', 'out', 'audioAnalog', 'xlr3', level='line+4', format='XLR mâle') for i in range(1, 4)]
    ports += [P('avb', 'Milan-AVB', 'bidir', 'audioIp', U, format='Deux commutateurs LS10, redondance ; connecteur non précisé'),
              P('spk', 'Sorties HP', 'out', 'audioAnalog', U, level='speaker', channels=12, format=f'Sorties des 3 {amp} ; connecteurs non précisés sur la page')]
    sheet('l-acoustics-' + slug, 'amplification', M, model, 'amp', W(slug, model), ports, weightKg=w, rackU=9)

# Enceintes
sheet('l-acoustics-sb28', 'speaker', M, 'SB28', 'speaker', AR('SB28/documents.zip', 'SB28 User manual'), [
    spk_in('in', 'Input', 'speakon-nl4', 'speakON 4 points (1+/1-), 4 Ω')])
sheet('l-acoustics-arcs', 'speaker', M, 'ARCS', 'speaker', AR('ARCS/documents.zip', 'ARCS User manual 3.0'), [
    spk_in('in', 'speakON 1', 'speakon-nl4', 'NL4'), P('link', 'speakON 2', 'out', 'audioAnalog', 'speakon-nl4', level='speaker', format='En parallèle (chaînage)')])
sheet('l-acoustics-mtd115b', 'speaker', M, 'MTD115b', 'speaker', AR('MTD115/documents.zip', 'MTD 108a-115b User manual 1.2'), [
    spk_in('in', 'speakON 1', 'speakon-nl4', 'NL4'), P('link', 'speakON 2', 'out', 'audioAnalog', 'speakon-nl4', level='speaker', format='En parallèle (chaînage)')])
for model, path, w, amp in (('108P', '108P/108P%20Archive.zip', 13, 'Bi-amplifiée, 500 W BF'), ('112P', '112P/112P%20Archive.zip', 32, '1000 W')):
    sheet('l-acoustics-' + model.lower(), 'speaker', M, model, 'speaker', AR(path, f'{model} fiche technique 5.0'), [
        P('in', 'Input', 'in', 'audioAnalog', 'xlr3', level='line+4', format='Symétrique, +12 dBu max'),
        P('link', 'Link', 'out', 'audioAnalog', 'xlr3', level='line+4', format='En parallèle'),
        P('acIn', 'Secteur', 'in', 'power', 'powercon', format=f'120 ou 230 V ; {amp}'),
        P('acOut', 'Recopie secteur', 'out', 'power', 'powercon')], weightKg=w)
sheet('l-acoustics-dv-dosc', 'speaker', M, 'dV-DOSC', 'speaker', AR('dV-DOSC/documents.zip', 'dV-DOSC User manual 3.0'), [
    spk_in('in', 'Input', U, 'Raccordement par câbles et adaptateurs CA-COM / speakON selon le manuel'),
    P('link', 'Link', 'out', 'audioAnalog', U, level='speaker')], status='community')
sheet('l-acoustics-v-dosc', 'speaker', M, 'V-DOSC', 'speaker', AR('V-DOSC/documents.zip', 'V-DOSC déclaration de conformité (manuel absent de l\'archive)'), [
    spk_in('in', 'Input', U, 'Enceinte 3 voies ; connecteurs non précisés dans l\'archive'),
    P('link', 'Link', 'out', 'audioAnalog', U, level='speaker')], status='community')
