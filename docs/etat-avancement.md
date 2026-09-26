# État d'avancement (mise à jour du 2026-09-26)

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

**Bibliothèque, ajouts du 2026-09-26** (258 fiches au total) :
- Blackmagic Design (20), Yamaha DM7 / DM3 / TF / M7CL / 01V96i (11), DiGiCo SD10 et SD-Rack (2).
- Micros : Sennheiser e 604, e 825-S, e 835, e 845, e 845-S, e 904, e 906, e 935, MD 441 U ; DPA 4060, 4061, 4066,
  4080, 4088, 4099 CORE+, 4466, 4488 (connecteur selon version : MicroLock, TA4F, LEMO, mini-jack) ;
  Shure Beta 56A, Beta 98A, Beta 98AMP, KSM137 ; AKG C214, C451 B, C414 XLS / XLII, C1000 S, C430 ;
  Audix i5, D2, D4, D6, OM7 ; Audio-Technica AT8035, AT8015 ; Electro-Voice RE20, RE27N/D (connecteur non précisé).
- DI Radial : J48, JDI, ProD2, ProAV1, JPC (Communauté), Twin-Iso, HotShot DM1.
- Intercom Green-GO : MCX, MCXD, BPX, WBPX, WAA, Interface X, RDX.
- Réseau : Swisson XES-8G, Luminex GigaCore 20t (avec et sans PoE++), Netgear GS516UP, GS108.
- Lumière : nouvelles familles Projecteurs, Contrôle lumière, Distribution DMX et pictogramme projecteur.
  Robe (17 : BMFL Blade / FollowSpot LT / WashBeam, MegaPointe, Pointe, iFORTE LTX, iFORTE Fresnel, FORTE, ESPRITE,
  MiniMe, Tarrantula, Spiider, Spikie, iBOLT, LEDBeam 150, PATT 2013, ONEPATT) ; Ayrton Rivale Profile, Ghibli,
  MagicBlade-R ; MA Lighting (12 : grandMA3 full-size / light / compact XT, processing units M / L / XL, grandMA2
  full-size / light / ultra-light, NPU, onPC command wing, dot2 XL-F) ; Luminex LumiNode 12 / 4 / 2 ; Swisson XPD-28.
- Connecteurs ajoutés : MicroDot, MicroLock (DPA), Mini-USB.

**Inventaire des prestataires** : `inventaire-prestataires.md` et `inventaire/*.csv`
(Novelty : 627 références ; Audio Pro : 226).

## Sources bloquées ou incomplètes

- Blackmagic : 1 M/E Constellation HD et Micro Converter bidirectionnel 3G refusés (limitation de débit), à retenter.
- Midas (mediadl.musictribe.com, cdn.mediavalet.com) : erreurs 500 / 502.
- Electro-Voice : products.electrovoice.com présente un certificat incomplet ; seules les pages www.electrovoice.com sont
  lisibles (ND868, ND308, ND408, RE200 non trouvés).
- Cisco SG300 : fiche technique refusée (403). Neumann KM 184 / KMS 105 : page sans alimentation ni connecteur.
- beyerdynamic M 88 / M 201 / Opus 87 : caractéristiques non affichées sur le site du constructeur.
- Martin, Sony Pro, Panasonic : 403 → déposer leurs manuels sur le Drive.

## Reste à faire

1. **Bibliothèque, catalogues Novelty et Audio Pro** (environ 850 références ; ordre proposé) :
   - Audio : Yamaha DM7, DM3, TF, 01V96i, M7CL, MG, SPX ; Midas (Pro, M32, DL, Heritage) ; DiGiCo SD ; Allen & Heath ;
     Neumann, beyerdynamic, Shure MX412, AKG C411 / C3000, Audio-Technica ES925 (version à préciser) ; Klark Teknik DN100 / DN200,
     Avalon U5 ; périphériques (BSS, TC, Lexicon) ; intercom Altair, Clear-Com ;
     Shure UHF-R (UR4D+, UR1, UR2) et PSM encore sans guide trouvé ; modèles L-Acoustics arrêtés (Kara, SB28, LA8,
     108P, 112P, 115XT HiQ, V-DOSC, dV-DOSC, ARCS) : manuels d'archive nécessaires.
   - Image : projecteurs, écrans, caméras, convertisseurs, grilles.
   - Réseau : Cisco SG300-10P / SG300-20, Oxo Core8 Pro, Netgear RG6220 (désignation à vérifier).
   - Lumière, reste à faire : Robe Robospot et RDM Communicator ; Ayrton MagicDot-SX / R, Arcaline 2 (manuels sans texte
     exploitable) ; Chauvet, ETC, Astera, SGM, Elation, ARRI, GLP, Robert Juliat, Enttec, ChamSys et petites marques ;
     Swisson XSR (nombre de ports par modèle seulement sur les schémas) ; Martin (403).
   - Distribution : armoires des prestataires, statut Communauté (source : catalogues).
   - Sites refusant l'accès automatique (erreur 403) : Martin, Sony Pro, Panasonic → déposer leurs manuels sur le Drive.
2. **Lot 3** : vues liées (baie / rack, plan, réseau, intercom, synchro, électrique).
3. **Lot 5** : mode formation. **Lot 6** : imports / exports avancés ; assistant IA en attente.
4. Points de bibliothèque à confirmer : section « Points en suspens » de `bibliotheque-a-documenter.md`.

## Pour reprendre

Les scripts de création des fiches sont dans `tools/bibliotheque/` (voir son README). Chaque fiche « Vérifié » cite sa
source (page ou document constructeur, date) ; ne rien inventer, marquer « non précisé » ce que la documentation ne dit pas.
