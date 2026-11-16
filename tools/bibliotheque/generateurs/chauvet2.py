# Chauvet (suite) : COLORstrike M, Vesuvio II, COLORado 2-Quad Zoom, SlimPAR Pro H USB, COLORdash Accent Quad, WELL STX 360,
# Swarm 4 FX, Double DerbyX, DJ Bank, EZBAR, Festoon 2 RGB.
from common import P, src, sheet, fixture
U = 'unspecified'
def R(*pairs): return [src(u, d) for u, d in pairs]
CP = 'Chauvet Professional'
DJ = 'Chauvet DJ'
CPP = 'https://chauvetprofessional.com/wp-content/uploads/pdf/en/'
CDJ = 'https://www.chauvetdj.com/wp-content/uploads/pdf/en/'

fixture('chauvet-colorstrike-m', CP, 'COLORstrike M', R(('https://www.adorama.com/chcstrikem.html', 'Adorama, fiche COLORstrike M (revendeur)')),
        dmx='xlr5', dmx_fmt='XLR 5 points IP65', power='powerkon-ip65', power_thru=True, ethernet='ethercon', status='community', weightKg=12.1)
fixture('chauvet-vesuvio-ii', CP, 'Vesuvio II', R(('https://chauvetprofessional.com/product/vesuvio-ii/', 'Chauvet Professional, page Vesuvio II')),
        dmx='xlr3+5', power='powerkon-ip65', power_thru=True, family='luminaire', pictogram='light', weightKg=12.9)
fixture('chauvet-colorado-2-quad-zoom', CP, 'COLORado 2-Quad Zoom', R((CPP + 'COLORADO2QUADZOOM.pdf', 'Chauvet Professional, fiche COLORado 2-Quad Zoom')),
        dmx='xlr3+5', power='powerkon-ip65', power_thru=True, weightKg=8.6)
fixture('chauvet-slimpar-pro-h-usb', DJ, 'SlimPAR Pro H USB', R(('https://djcity.com.au/product/chauvet-dj-slimpar-pro-h-usb-white-led-parcan/', 'DJ City, fiche SlimPAR Pro H USB (revendeur)')),
        dmx='xlr3', power='powercon', power_thru=True, status='community',
        extra=[P('usb', 'D-Fi USB', 'in', 'dmx', 'usb-a', format='Récepteur DMX sans fil D-Fi (en option)')])
fixture('chauvet-colordash-accent-quad', CP, 'COLORdash Accent Quad', R((CPP + 'COLORDASHACCENTQUAD.pdf', 'Chauvet Professional, fiche COLORdash Accent Quad')),
        dmx='xlr5', dmx_fmt='Queues de câble XLR 5 points', power='unspecified', power_fmt='Câble secteur fixe')
sheet('chauvet-well-stx-360', 'luminaire', CP, 'WELL STX 360', 'light', R((CPP + 'WELLSTX360.pdf', 'Chauvet Professional, fiche WELL STX 360')),
      [P('wdmx', 'W-DMX', 'in', 'dmx', 'rf', format='Récepteur W-DMX intégré'),
       P('charge', 'Charge', 'in', 'power', U, format='Batterie 3 à 12 h ; recharge dans la valise (Powerkon IP65)')])
fixture('chauvet-swarm-4-fx', DJ, 'Swarm 4 FX', R((CDJ + 'swarm-4-fx.pdf', 'Chauvet DJ, fiche Swarm 4 FX')),
        dmx='xlr3', power='iec-c13', power_thru=True, power_fmt='100-240 V, 47 W', powerW=47)
fixture('chauvet-double-derbyx', DJ, 'Double DerbyX', R((CDJ + 'double-derbyx.pdf', 'Chauvet DJ, fiche Double DerbyX')),
        dmx='xlr3', power='iec-c13', power_thru=True, power_fmt='100-240 V, 24 W', powerW=24)
sheet('chauvet-dj-bank', 'luminaire', DJ, 'DJ Bank', 'light', R(('https://www.bax-shop.co.uk/led-light-effect/chauvet-dj-dj-bank-led-spotlights', 'Bax Music, fiche DJ Bank (revendeur)')),
      [P('acIn', 'Secteur', 'in', 'power', U, format='Sans DMX (déclenchement sonore)'), P('acOut', 'Recopie secteur', 'out', 'power', U)], status='community')
sheet('chauvet-ezbar', 'luminaire', DJ, 'EZBAR', 'light', R(('https://www.fullcompass.com/common/files/34445-CHAUVETDJEZBarDatasheet.pdf', 'Chauvet DJ, fiche EZBAR (via Full Compass)')),
      [P('ir', 'Télécommande IRC-6', 'in', 'control', 'rf', format='Sans DMX'), P('dc', 'Charge', 'in', 'power', 'dc-barrel', format='Bloc 15 V 1,6 A ; batterie')])
fixture('chauvet-festoon-2-rgb', DJ, 'Festoon 2 RGB', R(('https://www.fullcompass.com/common/files/61482-FESTOON2RGBQuickReferenceGuide.pdf', 'Chauvet DJ, guide Festoon 2 RGB (via Full Compass)')),
        dmx='xlr3', power='unspecified', power_fmt='100-240 V ; contrôleur alimentant la guirlande (data over power)',
        extra=[P('string', 'Guirlande', 'out', 'power', U, format='Sortie vers ampoules (puissance et données)')])
