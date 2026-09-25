# État d'avancement (arrêt du 2026-09-25)

## Fait

**Application**
- Synoptique complet (lots 1 et 2) : bibliothèque, liaisons typées, règles, multipaires, groupes, pages, PDF multi-planches, fusion.
- Bibliothèque en menus dépliables : Audio, Image, Lumière, Réseau, Distribution, Divers, puis sous-menus par famille.
- Tracé automatique des liaisons (contournement des blocs, voies écartées, étiquettes sans chevauchement), bouton « Tracé auto ».
- Nouveaux signaux : Radiofréquence (câbles d'antenne, code ANT) et DMX (code DMX).
- Assistant IA (lot 6) : 1re partie faite puis **mise en attente** (décision du 2026-09-25) ; voir `cahier-des-charges.md` § 12.7.
- Installateur Windows de test : un commit dont le message contient `[build]` le construit (onglet Actions, artefact
  « AV-Diagram-windows »). Les étiquettes `v*` ne peuvent pas être poussées depuis la session cloud.

**Bibliothèque** : 133 fiches au total, dont, ajoutées le 2026-09-25 à partir des documents constructeurs :
- L-Acoustics (28) : K2, K3, Kara II, Kiva II, L2, A10/A15 Focus et Wide, X8, X12, X15 HiQ, 5XT, Syva (+ Low, Sub), Soka,
  KS28, KS21, SB18, SB15m, SB10i, LA4X, LA12X, LA7.16, LA2Xi, P1, LS10.
- Yamaha (19) : CL5, CL3, CL1, QL5, QL1, Rio3224-D2, Rio1608-D2, XMV (8 versions), PC412-D/DI, PC406-D/DI.
- Shure (21) : AD4D, AD4Q, AD1, AD2, AD3, ADX1M, UA845UWB, P10T, P10R+, P9T, P9RA+, SLXD1, SLXD2, SLXD4D (Communauté),
  AXT600, AD600, AD610, Beta 57A, Beta 58A, Beta 87A, KSM9.
- Avid C|24 complétée (poids et consommation : communauté Avid), MTRX Studio corrigée (pédale sur jack 6,35).

**Inventaire des prestataires** : `inventaire-prestataires.md` et `inventaire/*.csv`
(Novelty : 627 références ; Audio Pro : 226).

## En cours au moment de l'arrêt

- **Blackmagic Design** : fiches techniques téléchargées et lues, fiches pas encore écrites pour ATEM Mini Pro, ATEM Mini
  Extreme, ATEM Television Studio HD8, ATEM 2 M/E Constellation HD, ATEM 4 M/E Constellation 4K, ATEM Micro Panel,
  HyperDeck Studio HD Mini / HD Plus / HD Pro / 4K Pro, Mini Converters (Analog to SDI, SDI to Analog, Audio to SDI,
  SDI Distribution, SDI to HDMI 6G, HDMI to SDI 6G), Micro Converters (HDMI to SDI 3G, SDI to HDMI 3G).
  Refusés par limitation de débit, à retélécharger : ATEM Mini Pro ISO, 1 M/E Constellation HD, UpDownCross HD,
  Micro Converter bidirectionnel 3G.

## Reste à faire

1. **Bibliothèque, catalogues Novelty et Audio Pro** (environ 850 références ; ordre proposé) :
   - Audio : Yamaha DM7, DM3, TF, 01V96i, M7CL, MG, SPX ; Midas (Pro, M32, DL, Heritage) ; DiGiCo SD ; Allen & Heath ;
     Sennheiser, DPA, Neumann, AKG, Audio-Technica… ; périphériques (BSS, TC, Lexicon) ; intercom Green-GO, Altair, Riedel ;
     Shure UHF-R (UR4D+, UR1, UR2) et PSM encore sans guide trouvé ; modèles L-Acoustics arrêtés (Kara, SB28, LA8,
     108P, 112P, 115XT HiQ, V-DOSC, dV-DOSC, ARCS) : manuels d'archive nécessaires.
   - Image : Blackmagic (voir ci-dessus), projecteurs, écrans, caméras, convertisseurs, grilles.
   - Réseau : Luminex, Netgear, Cisco, Swisson, Oxo.
   - Lumière (227 références Novelty) : signaux DMX prêts ; fiches à créer (DMX, Art-Net/sACN, alimentation).
   - Distribution : armoires des prestataires, statut Communauté (source : catalogues).
   - Sites refusant l'accès automatique (erreur 403) : Martin, Sony Pro, Panasonic → déposer leurs manuels sur le Drive.
2. **Lot 3** : vues liées (baie / rack, plan, réseau, intercom, synchro, électrique).
3. **Lot 5** : mode formation. **Lot 6** : imports / exports avancés ; assistant IA en attente.
4. Points de bibliothèque à confirmer : section « Points en suspens » de `bibliotheque-a-documenter.md`.

## Pour reprendre

Les scripts de création des fiches sont dans `tools/bibliotheque/` (voir son README). Chaque fiche « Vérifié » cite sa
source (page ou document constructeur, date) ; ne rien inventer, marquer « non précisé » ce que la documentation ne dit pas.
