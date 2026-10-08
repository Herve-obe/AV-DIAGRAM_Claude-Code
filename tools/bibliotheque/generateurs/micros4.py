# Micros : Neumann KM 184 / KM 185 / KMS 105, Audio-Technica MB3k / AT4033a / AT831b / ES925.
from common import src, mic
def R(*pairs): return [src(u, d) for u, d in pairs]
N = 'Neumann'
AT = 'Audio-Technica'
mic('neumann-km-184', N, 'KM 184', R(('https://www.soundseasy.com.au/products/neumann-km-184-cardioid-miniature-microphone', 'Sounds Easy, fiche KM 184 (revendeur)')),
    'required', fmt='Statique cardioïde, P48 ± 4 V, 3,2 mA', status='community', weightKg=0.08)
mic('neumann-km-185', N, 'KM 185', R(('https://recordinghacks.com/microphones/neumann/km-185', 'Recordinghacks, KM 185'), ('https://thomann.ae/neumann_km185.htm', 'Thomann, fiche KM 185 (revendeur)')),
    'required', fmt='Statique hypercardioïde, P48', status='community', weightKg=0.08)
mic('neumann-kms-105', N, 'KMS 105', R(('https://www.barryrudolph.com/recall/manuals/neumannkms105.pdf', 'Neumann, mode d\'emploi KMS 105 (archive)')),
    'required', fmt='Statique supercardioïde de scène, P48 ± 4 V, 3,5 mA', status='community', weightKg=0.3)
mic('audio-technica-mb3k', AT, 'MB3k', R(('https://audio-technica.com/en-us/mb-3k', 'Audio-Technica, page MB3k (produit arrêté)')),
    'none', fmt='Dynamique hypercardioïde, interrupteur marche / arrêt', weightKg=0.343)
mic('audio-technica-at4033a', AT, 'AT4033a', R(('https://audio-technica.com/es-ar/at4033a', 'Audio-Technica, page AT4033a')),
    'required', fmt='Statique cardioïde large membrane, P48 ± 4 V, 3,2 mA ; pad 10 dB, coupe-bas', weightKg=0.38)
mic('audio-technica-at831b', AT, 'AT831b', R(('https://soundpro.com/products/audio-technica-at8531-power-module', 'SoundPro, module AT8531 compatible AT831b (revendeur)')),
    'required', fmt='Cravate statique cardioïde ; XLR via module AT8531 (pile AA ou fantôme 9-52 V), entrée TA3M', status='community')
mic('audio-technica-es925', AT, 'ES925', R(('https://leisuretec.co.uk/blogs/leisuretec-blog/audio-technica-es925-gooseneck-microphones-system-and-size-guide', 'Leisuretec, guide de la gamme ES925')),
    'required', fmt='Col de cygne modulaire (6 à 24") ; sortie selon module d\'alimentation : XLR 3 ou 5 points, socle ou encastrable', status='community')
