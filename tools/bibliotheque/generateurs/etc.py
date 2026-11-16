# ETC (catalogue Novelty), d'après les fiches techniques du constructeur (etcconnect.com).
from common import P, src, sheet, written

sheet('etc-source-four-led-series-2-lustr', 'luminaire', 'ETC', 'Source Four LED Series 2 Lustr', 'light',
      [src('https://www.etcconnect.com/WorkArea/DownloadAsset.aspx?id=10737460639', 'ETC, Source Four LED Series 2 datasheet, 7461L1000 Rev. B (06/14)')],
      [P('dmx-in', 'DMX In', 'in', 'dmx', 'xlr5', format='DMX512, XLR 5 points'),
       P('dmx-thru', 'DMX Thru', 'out', 'dmx', 'xlr5', format='Recopie DMX'),
       P('ac-in', 'Secteur', 'in', 'power', 'powercon', format='Neutrik powerCON, 100-240 V ; cordon 1,5 m avec fiche au choix'),
       P('ac-out', 'Recopie secteur', 'out', 'power', 'powercon', format='Neutrik powerCON ; jusqu\'à 9 projecteurs chaînés (15 A max.)')],
      weightKg=8.3)

print(len(written), 'fiches :', ', '.join(written))
