# Micros filaires Shure, AKG, Audix, Audio-Technica et Electro-Voice (catalogues Novelty et Audio Pro).
from common import P, src, sheet, mic, written

def S(guide, name): return [src(f'https://pubs.shure.com/guide/{guide}/en-US', f'Shure, guide d\'utilisation {name} (pubs.shure.com)')]

# Shure
mic('shure-beta-56a', 'Shure', 'Beta 56A', S('BETA56A', 'Beta 56A'), 'none', fmt='Dynamique supercardioïde, XLR 3 points mâle', weightKg=0.468)
mic('shure-beta-98a', 'Shure', 'Beta 98A', S('BETA98A', 'Beta 98A'), 'required',
    fmt='Statique électret cardioïde, fantôme 11 à 52 V. Sortie XLR sur le préamplificateur fourni (câble micro vers préampli jusqu\'à 23 m)', weightKg=0.012)
mic('shure-beta-98amp', 'Shure', 'Beta 98AMP', S('BETA98AMP', 'Beta 98AMP'), 'required',
    fmt='Statique électret cardioïde sur col de cygne, préampli intégré à sortie XLR, fantôme 11 à 52 V, 5,5 mA', weightKg=0.13)
mic('shure-ksm137', 'Shure', 'KSM137', S('KSM137', 'KSM137'), 'required',
    fmt='Statique électret cardioïde, fantôme 11 à 52 V (48 V recommandé), XLR 3 points mâle', weightKg=0.1)

# AKG : fiches produit (cut sheets) et guide rapide sur akg.com
AKG = 'https://www.akg.com/on/demandware.static/-/Sites-masterCatalog_Harman/default/'
mic('akg-c214', 'AKG', 'C214', [src(AKG + 'dw1bda9c1d/pdfs/AKG_CutSheet_C214_072116.pdf', 'AKG, fiche produit C214')], 'required',
    fmt='Statique grande membrane cardioïde, fantôme 12 à 52 V (IEC 61938), sortie XLR', weightKg=0.28)
mic('akg-c451-b', 'AKG', 'C451 B', [src(AKG + 'dwccf0487a/pdfs/AKG_CutSheet_C451B_Condencer_Mic.pdf', 'AKG, fiche produit C451 B')], 'required',
    fmt='Statique petite membrane, alimentation 9 à 52 V, 2 mA, XLR symétrique mâle', weightKg=0.125)
C414 = [src(AKG + 'dw02043c47/pdfs/AKG_CutSheet_C414&C414XLII_072516.pdf', 'AKG, fiche produit C414 XLS et C414 XLII')]
for id, model in (('akg-c414-xls', 'C414 XLS'), ('akg-c414-xlii', 'C414 XLII')):
    mic(id, 'AKG', model, C414, 'required', fmt='Statique grande membrane multidirectivité, fantôme 48 V (IEC 61938), XLR 3 points (point 2 chaud)', weightKg=0.3)
# C1000 S : fantôme ou 2 piles AA, donc fantôme non obligatoire
sheet('akg-c1000-s', 'capture', 'AKG', 'C1000 S', 'mic', [src(AKG + 'dw2a317c20/pdfs/AKG_C1000S_Cutsheet.pdf', 'AKG, fiche produit C1000 S')],
      [P('out', 'Sortie', 'out', 'audioAnalog', 'xlr3', level='mic', format='Statique petite membrane, fantôme 9 à 52 V (3 mA) ou deux piles AA, XLR symétrique mâle')])
# C430 : le guide ne précise pas l'alimentation
sheet('akg-c430', 'capture', 'AKG', 'C430', 'mic', [src(AKG + 'dw859e1b73/pdfs/AKG_C430_Quickstart_Guide.pdf', 'AKG, guide rapide C430 (08/15)')],
      [P('out', 'Sortie', 'out', 'audioAnalog', 'xlr3', level='mic', format='Statique prépolarisé cardioïde, 7 mV/Pa, XLR 3 points (point 2 chaud). Alimentation non précisée dans le guide')],
      weightKg=0.072)

# Audix : fiches techniques liées depuis audixusa.com
AUDIX = 'https://audixusa.com/cdn/shop/files/'
for id, model, f, pattern in (
    ('audix-i5', 'i5', 'i5_v3_0516.pdf', 'cardioïde'),
    ('audix-d2', 'D2', 'D2_v3_1015.pdf', 'hypercardioïde'),
    ('audix-d4', 'D4', 'D4_v3_0516.pdf', 'hypercardioïde'),
    ('audix-d6', 'D6', 'D6_V3_1221.pdf', 'cardioïde'),
    ('audix-om7', 'OM7', 'OM7_v3_0516.pdf', 'hypercardioïde'),
):
    mic(id, 'Audix', model, [src(AUDIX + f, f'Audix, fiche technique {model}')], 'none', fmt=f'Dynamique {pattern}, XLR')

# Audio-Technica : fantôme 11 à 52 V ou pile AA
AT = [('audio-technica-at8035', 'AT8035', 'https://docs.audio-technica.com/all/p51963_01_at8035_spec_lores.pdf', 'fiche technique AT8035'),
      ('audio-technica-at8015', 'AT8015', 'https://docs.audio-technica.com/all/0001_0193_03_AT8015_Submittal.pdf', 'fiche de prescription AT8015')]
for id, model, url, doc in AT:
    sheet(id, 'capture', 'Audio-Technica', model, 'mic', [src(url, f'Audio-Technica, {doc}')],
          [P('out', 'Sortie', 'out', 'audioAnalog', 'xlr3', level='mic', format='Statique canon (line + gradient), fantôme 11 à 52 V ou pile AA 1,5 V, XLRM 3 points intégré')])

# Electro-Voice : la page produit ne précise pas le connecteur
EV = 'https://www.electrovoice.com/product/'
mic('electro-voice-re20', 'Electro-Voice', 'RE20', [src(EV + 're20')], 'none', connector='unspecified',
    fmt='Dynamique cardioïde (Variable-D), sans alimentation, 1,5 mV/Pa', weightKg=0.737)
mic('electro-voice-re27n-d', 'Electro-Voice', 'RE27N/D', [src(EV + 're27n-d')], 'none', connector='unspecified',
    fmt='Dynamique cardioïde néodyme (Variable-D)', weightKg=0.709)

print(len(written), 'fiches :', ', '.join(written))
