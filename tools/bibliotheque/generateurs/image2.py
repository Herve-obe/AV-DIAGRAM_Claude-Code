# Image : mélangeurs (catalogue Novelty), d'après les pages de caractéristiques constructeur.
from common import P, src, sheet, written

# Roland V-160HD
p = [*[P(f'hdmi-in{i}', f'HDMI In {i}', 'in', 'video', 'hdmi', format='HDMI type A, HDCP' + (', multiformat' if i > 4 else '')) for i in range(1, 9)],
     *[P(f'sdi-in{i}', f'SDI In {i}', 'in', 'video', 'bnc', format='3G/HD-SDI (SMPTE 424M, 292M)') for i in range(1, 9)],
     *[P(f'hdmi-out{i}', f'HDMI Out {i}', 'out', 'video', 'hdmi', format='HDMI type A, HDCP') for i in range(1, 4)],
     *[P(f'sdi-out{i}', f'SDI Out {i}', 'out', 'video', 'bnc', format='3G/HD-SDI') for i in range(1, 4)],
     P('usb-stream', 'USB Stream', 'bidir', 'video', 'usb-c', format='Webcam UVC / audio USB ; télécommande depuis PC ou iPad'),
     *[P(f'ain{i}', f'Audio In {i}', 'in', 'audioAnalog', 'combo', level='mic', phantom='supplied', format='Combo XLR / jack TRS, -60 à +4 dBu, fantôme 48 V') for i in (1, 2)],
     P('ain-rca', 'Audio In 3/L, 4/R', 'in', 'audioAnalog', 'rca', level='line-10', channels=2, format='RCA, -10 dBu'),
     P('aout-xlr', 'Audio Out XLR', 'out', 'audioAnalog', 'xlr3', channels=2, format='XLR (nombre de prises non précisé, stéréo)'),
     P('aout-rca', 'Audio Out RCA', 'out', 'audioAnalog', 'rca', channels=2),
     P('phones', 'Casque', 'out', 'audioAnalog', 'jack-trs', format='Jack 6,35 stéréo'),
     P('usb-mem', 'USB Memory', 'bidir', 'control', 'usb-a', format='Clé USB, pavé numérique'),
     P('ctl', 'CTL/EXP', 'in', 'control', 'jack-trs', format='Pédale ou interrupteur au pied'),
     P('tally', 'Tally/GPIO', 'bidir', 'control', 'dsub25', format='DB-25 femelle : 16 tally/GPO, 8 GPI'),
     P('rs232', 'RS-232', 'bidir', 'control', 'dsub9', format='DB-9 mâle'),
     P('lan', 'LAN Control', 'bidir', 'network', 'rj45', format='100BASE-TX, télécommande'),
     P('ref-in', 'Reference In', 'in', 'sync', 'bnc', format='Black burst, bi-level ou tri-level'),
     P('ref-thru', 'Reference Thru', 'out', 'sync', 'bnc'),
     P('dc', 'Alimentation', 'in', 'power', 'unspecified', format='Adaptateur secteur fourni, 2,5 A')]
sheet('roland-v-160hd', 'videoSwitcher', 'Roland', 'V-160HD', 'switcher',
      [src('https://proav.roland.com/global/products/v-160hd/specifications/', 'Roland, V-160HD Specifications')], p, powerW=55, weightKg=3.9)

print(len(written), 'fiches :', ', '.join(written))
