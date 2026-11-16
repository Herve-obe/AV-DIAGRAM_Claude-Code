# Micros filaires Sennheiser et DPA (catalogues Novelty et Audio Pro), d'après les pages constructeur.
from common import P, src, sheet, mic, written

SEN = 'https://www.sennheiser.com/en-us/catalog/products/microphones/'
# (id, modèle, chemin de la page, directivité relevée sur la page)
sennheiser = [
    ('sennheiser-e835', 'e 835', 'e-835/e-835-004513', 'cardioïde'),
    ('sennheiser-e825-s', 'e 825-S', 'e-825/e-825-s-004511', 'cardioïde'),
    ('sennheiser-e935', 'e 935', 'e-935/e-935-009421', 'cardioïde'),
    ('sennheiser-e904', 'e 904', 'e-904/e-904-500200', 'cardioïde'),
    ('sennheiser-e906', 'e 906', 'e-906/e-906-500202', 'supercardioïde'),
    ('sennheiser-e604', 'e 604', 'e-604/e-604-004519', 'cardioïde'),
    ('sennheiser-md441-u', 'MD 441 U', 'md-441/md-441-u-000762', 'supercardioïde'),
]
for id, model, path, pattern in sennheiser:
    mic(id, 'Sennheiser', model, [src(SEN + path)], 'none', fmt=f'Dynamique {pattern}, XLR 3 points')

# e 845 / e 845-S : fiche produit PDF (poids 330 g, 1,8 mV/Pa)
E845 = src('https://www.sennheiser.com/globalassets/digizuite/41680-en-sp_1210_v1.0_e_845_e_845-s_product_specification_en.pdf',
           'Sennheiser, Product specification evolution wired e 845 | e 845-S')
for id, model in (('sennheiser-e845', 'e 845'), ('sennheiser-e845-s', 'e 845-S')):
    mic(id, 'Sennheiser', model, [E845], 'none', fmt='Dynamique supercardioïde, 1,8 mV/Pa, XLR-3', weightKg=0.33)

# DPA : capsules miniatures à condensateur prépolarisé, alimentées par l'émetteur HF (5 à 10 V via adaptateur DPA)
# ou en P48 via adaptateur XLR. Le connecteur dépend de la version commandée.
DPA = 'https://www.dpamicrophones.com/document-portal/manual/product/'
VERSIONS = 'Selon la version : MicroLock, TA4F mini-XLR, LEMO 3 points ou mini-jack'
dpa = [
    # (id, modèle, page, description, adaptateur P48, poids kg, connecteur imposé)
    ('dpa-4099', '4099 CORE+', '4099/variant/29', 'Micro instrument supercardioïde', 'DAD9001 ou DAD9099', 0.018, 'microlock'),
    ('dpa-4066', '4066', '4066/variant/16', 'Serre-tête omnidirectionnel', 'DAD6001-BC', 0.014, None),
    ('dpa-4466', '4466 CORE', '4466/variant/22', 'Serre-tête omnidirectionnel', 'DAD6001-BC', 0.012, None),
    ('dpa-4088', '4088', '4088/variant/17', 'Serre-tête directionnel', 'DAD9001', 0.014, None),
    ('dpa-4488', '4488 CORE', '4488/variant/23', 'Serre-tête directionnel', 'DAD9001', 0.018, None),
    ('dpa-4060', '4060', '4060/variant/32', 'Cravate omnidirectionnel miniature', 'DAD6001-BC', 0.0075, None),
    ('dpa-4061', '4061', '4060/variant/32', 'Cravate omnidirectionnel miniature', 'DAD6001-BC', 0.0075, None),
    ('dpa-4080', '4080', '4080/variant/33', 'Cravate cardioïde miniature', 'DAD9001', 0.015, 'microlock'),
]
for id, model, page, desc, adapter, kg, conn in dpa:
    fmt = f'{desc}, condensateur prépolarisé. Alimentation : 5 à 10 V par l\'émetteur HF (adaptateur DPA) ou P48 avec {adapter}'
    if not conn:
        fmt += f'. {VERSIONS}'
    sheet(id, 'capture', 'DPA', model, 'mic', [src(DPA + page + '/')],
          [P('out', 'Sortie', 'out', 'audioAnalog', conn or 'unspecified', level='mic', format=fmt)], weightKg=kg)

print(len(written), 'fiches :', ', '.join(written))
