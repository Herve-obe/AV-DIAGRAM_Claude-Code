# Micros : DPA 4011A, Schoeps CMC 6 + MK 4 / MK 21 / MK 41, AKG C411 PP / C3000 B / C535 EB, Electro-Voice N/D868 / N/D308 / N/D408.
from common import src, mic
def R(*pairs): return [src(u, d) for u, d in pairs]

mic('dpa-4011a', 'DPA', '4011A', R(('https://www.hhb.co.uk/?p=4073', 'HHB, fiche 4011A (revendeur)'), ('https://audiosense.be/en/dpa-4011a.html', 'Audiosense, fiche 4011A (revendeur)')),
    'required', fmt='Statique cardioïde, P48 ± 4 V, 2,8 mA ; pad 20 dB', status='community', weightKg=0.158)

for cap, pattern in (('MK 4', 'cardioïde'), ('MK 21', 'infracardioïde (large cardioïde)'), ('MK 41', 'supercardioïde')):
    mic('schoeps-cmc6-' + cap.lower().replace(' ', ''), 'Schoeps', 'CMC 6 + ' + cap,
        R(('https://www.dcaudiovisuel.com/product_info.php/language/en/products_id/228', 'DC Audiovisuel, fiche CMC 6 + MK 4 (distributeur)'),
          ('https://www.adorama.com/schoeps-cmc-6u-phantom-power-microphone-amplifier-matte-gray/p/sccmc6ug', 'Adorama, fiche CMC 6 U (revendeur)')),
        'required', fmt=f'Statique {pattern} ; préampli CMC 6 : fantôme 12 V (8 mA) ou 48 V (4 mA)', status='community')

mic('akg-c411-pp', 'AKG', 'C411 PP', R(('https://musicstore.de/en_DE/EUR/AKG-C411PP-Vibration-Pickup-Microphone-Condenser/art-PAH0000037-000', 'Music Store, fiche C411 PP (revendeur)')),
    'required', fmt='Capteur de vibrations statique, fantôme 9-52 V ; XLR via adaptateur MPA V L (version PP)', status='community', weightKg=0.018)
mic('akg-c3000-b', 'AKG', 'C3000 B', R(('https://recordinghacks.com/microphones/AKG-Acoustics/C3000', 'Recordinghacks, C3000 / C3000 B')),
    'required', fmt='Statique large membrane cardioïde, fantôme 9-52 V', status='community', weightKg=0.32)
mic('akg-c535-eb', 'AKG', 'C535 EB', R(('https://images.static-thomann.de/pics/atg/atgdata/document/specs/124675_c535eb4055c242598ef.pdf', 'AKG, fiche C535 EB (via Thomann)')),
    'required', fmt='Statique cardioïde, fantôme 9-52 V', status='community', weightKg=0.3)

mic('electro-voice-nd868', 'Electro-Voice', 'N/D868', R(('https://recordinghacks.com/microphones/Electro-Voice/N-D868', 'Recordinghacks, N/D868')),
    'none', fmt='Dynamique cardioïde grosse caisse, 150 Ω', status='community', weightKg=0.295)
mic('electro-voice-nd408', 'Electro-Voice', 'N/D408B', R(('https://products.electrovoice.com/binary/ND408B%20Engineering%20Data%20Sheet.pdf', 'Electro-Voice, fiche technique N/D408B')),
    'none', fmt='Dynamique supercardioïde, 150 Ω', weightKg=0.19)
mic('electro-voice-nd308', 'Electro-Voice', 'N/D308', R(('https://www.proacousticsusa.com/brands/electro-voice.html?page=10', 'Pro Acoustics, gamme Electro-Voice (revendeur)')),
    'none', fmt='Dynamique (caractéristiques non retrouvées)', status='community')
