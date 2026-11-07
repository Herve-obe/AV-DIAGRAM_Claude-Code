# Projecteurs sur batterie Astera (catalogue Novelty), d'après les fiches techniques du constructeur (astera-led.com).
from common import P, src, sheet, written

U = 'https://astera-led.com/wp-content/uploads/'
def S(f, name): return [src(U + f, f'Astera, {name}')]
def crmx(protocols='CRMX, UHF, Bluetooth, WiFi'):
    return P('radio', 'DMX sans fil', 'in', 'dmx', 'rf', format=f'Récepteur CRMX intégré ; protocoles sans fil : {protocols} ; portée CRMX/UHF jusqu\'à 300 m')
def xlr_dmx():
    return [P('dmx-in', 'DMX In', 'in', 'dmx', 'xlr5', format='DMX filaire, XLR 5 points'),
            P('dmx-out', 'DMX Out', 'out', 'dmx', 'xlr5', format='Recopie DMX')]
def ac(): return [P('ac-in', 'Secteur', 'in', 'power', 'powercon-true1', format='powerCON TRUE1'),
                  P('ac-out', 'Recopie secteur', 'out', 'power', 'powercon-true1', format='powerCON TRUE1')]
def dc(v, conn, data=None):
    f = f'{v}, jack {conn}' + (f' ; transporte aussi le DMX filaire depuis {data}' if data else '')
    return P('dc', 'Entrée DC', 'in', 'power', 'dc-barrel', format=f)
def lum(id, model, f, name, ports, **kw):
    sheet(id, 'luminaire', 'Astera', model, 'light', S(f, name), ports, **kw)

lum('astera-ax1', 'AX1 PixelTube', 'Datasheet_AX1_Pixel_Tube_V3.pdf', 'Datasheet AX1 PixelTube V3',
    [crmx('CRMX, UHF, Bluetooth, WiFi'), dc('48 V CC 0,5 A', '5,5 x 2,1 mm')], powerW=16, weightKg=1.0)
AX2 = ('Datasheet_AX2_PixelBar_V2.pdf', 'Datasheet AX2 PixelBar V2')
lum('astera-ax2-50', 'AX2 PixelBar 50 cm (AX2-50)', *AX2, [crmx('CRMX, UHF'), *xlr_dmx(), *ac()], powerW=49, weightKg=4.5)
lum('astera-ax2-100', 'AX2 PixelBar 100 cm (AX2-100)', *AX2, [crmx('CRMX, UHF'), *xlr_dmx(), *ac()], powerW=104, weightKg=7.4)
lum('astera-ax3', 'AX3 LightDrop', 'Datasheet_AX3_LightDrop_V4.pdf', 'Datasheet AX3 LightDrop V4',
    [crmx(), dc('5 V CC 2,5 A', '5,5 x 2,5 mm')], powerW=15, weightKg=0.68)
lum('astera-ax5', 'AX5 TriplePAR', 'Datasheet_AX5_TriplePar_V4.pdf', 'Datasheet AX5 TriplePAR V4',
    [crmx(), *xlr_dmx(), *ac()], powerW=45, weightKg=3.4)
lum('astera-ax9', 'AX9 PowerPAR', 'Datasheet_AX9-PowerPar_V4.pdf', 'Datasheet AX9 PowerPAR V4',
    [crmx('CRMX, UHF, Bluetooth, WiFi'), *xlr_dmx(), *ac()], powerW=70, weightKg=5.66)
lum('astera-hyperion-tube', 'Hyperion Tube', 'Datasheet_Hyperion_Tube_V4-1.pdf', 'Datasheet Hyperion Tube V4',
    [crmx(), dc('24 V CC 4 A', '5,5 x 2,1 mm', 'un PowerBox Astera')], powerW=96, weightKg=2.9)
lum('astera-titan-tube', 'Titan Tube', 'FP1_TitanTube_Technical_Reference_Manual_V1.pdf', 'Titan Tube Technical Reference Manual V1',
    [crmx('CRMX'), dc('24 V CC 2 A', 'DC', 'le Titan PowerBox (le tube n\'a pas de prise XLR)')], powerW=72, weightKg=1.35)
lum('astera-nyx-bulb', 'NYX Bulb', 'Datasheet_NYX-Bulb_V3.pdf', 'Datasheet NYX Bulb V3',
    [crmx(), P('socket', 'Culot', 'in', 'power', 'unspecified', format='Culot E27 (UE) ou E26 (US)'),
     dc('5 à 18 V CC 2,1 A (batterie externe)', '3,5 x 1,35 mm')], powerW=10, weightKg=0.24)
lum('astera-pixelbrick', 'PixelBrick', 'Datasheet_PixelBrick_V3.pdf', 'Datasheet PixelBrick V3',
    [crmx(), dc('24 V CC 0,8 A', '5,5 x 2,1 mm', 'un PowerBox Astera')], powerW=20, weightKg=1.12)

# Boîtiers d'alimentation et de conversion DMX
def powerbox(id, model, f, name, n, out, kg):
    ports = ac() + xlr_dmx() + [P('net', 'Art-Net / sACN', 'in', 'network', 'rj45', format='1 univers Art-Net ou sACN')]
    ports += [P(f'dc{i}', f'Sortie DC {i}', 'out', 'power', 'dc-barrel', format=f'{out} ; transporte aussi le DMX') for i in range(1, n + 1)]
    sheet(id, 'dmxDistribution', 'Astera', model, 'power', S(f, name), ports, weightKg=kg)
powerbox('astera-powerbox-2x86w', 'PowerBox 2x86 W', 'Datasheet_PowerBox_2x86W_V4.pdf', 'Datasheet PowerBox 2x86W V4', 2, '24 V, 86 W, jack 5,5 x 2,1 mm', 1.5)
powerbox('astera-titan-powerbox', 'Titan PowerBox', 'Datasheet_Titan_PowerBox_V2.pdf', 'Datasheet Titan PowerBox V2', 10, '24 V CC, 2 A, jack 5,5 x 2,1 mm', 3.8)

print(len(written), 'fiches :', ', '.join(written))
