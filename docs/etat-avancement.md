# État d'avancement (mise à jour du 2026-10-09)

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

**Bibliothèque, ajouts du 2026-09-26** :
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
- Lumière (suite) : ARRI SkyPanel S30-C / S60-C / S360-C, L5-C / L7-C / L10-C ; GLP JDC Line 1000 / 500, JDC1 ;
  Astera AX1, AX2 (50 et 100), AX3, AX5, AX9, Hyperion, Titan Tube, NYX Bulb, PixelBrick, PowerBox 2x86 W, Titan PowerBox ;
  Elation Proteus Maximus / Hybrid, KL Panel / XL, TVL2000 II, DTW Blinder 700 IP, KL Fresnel 6 CW ;
  SGM P-2, P-5, P-6, P-10, Q-7 POI, Q-10 POI, G-Spot POI ; Chauvet COLORado 2-Quad Zoom, Ovation Rêve E-3 / F-3 IP,
  WELL Fit ; ETC Source Four LED Series 2 Lustr.
- Image : Kiloview N50 / N60 ; AJA Ki Pro Ultra 12G, Ki Pro Rack, 3G-AMA, HD10AMA ; Roland V-160HD ;
  NovaStar MCTRL660, MCTRL4K, VX6s, VX1000.
- Connecteurs ajoutés : MicroDot, MicroLock (DPA), Mini-USB, Seetronic Powerkon IP65.

**Synoptique, 2026-10-08** :
- Rotation des équipements par quart de tour (R / Maj+R), tracé des liaisons adapté (ports en haut et en bas).
- Calques par domaine (Audio, Image, Lumière, Réseau, Électrique), propres à chaque poste ; rappels de
  connexions entre domaines (ex. entrées audio d'une caméra), à prendre en compte ou à ignorer.
- Collaboration en temps réel : proposition dans `collaboration.md` (session sur le réseau local), en attente de validation.

**Bibliothèque, ajouts du 2026-10-08** (352 fiches au total) :
- Écrans Samsung sous les références du catalogue Novelty (décision du 2026-10-08) : DB55, DB48, DB40, DB32, DB22, DB10,
  DM75, DM32, ME95, ME75, ME32, ED75E, UE55, UE46, QB75H (Communauté, génération Samsung indiquée sur la fiche), QM98F (Vérifié).
- Écrans LG : 75UH5F-H, 55UH5F-H, 43UH5F-H, 55SM5KE, 43SM5KE (Vérifié) ; 98UH5E, 32SM5J, 75UM3DG-H (Communauté).
- Panasonic : AW-UE150, AW-UE100, AW-HE130, AV-HS6000 (AV-HS60U2 + AV-HS60C2), AV-HS410, TH-43/55/65/75/86EQ2W.
- Datapath Fx4 (sorties HDMI), Epson EB-PU2220B, SWIT M-1073H, Kramer VS-311H / VS-41H / VM-4HDCPxl, NovaStar MCTRL R5.
- Allen & Heath SQ-5 (Vérifié), Xone:92 (Communauté, d'après le manuel Mk2).
- Outils : l'empreinte de l'autorité du proxy est recalculée à chaque lancement (`tools/bibliotheque/proxyca.mjs`).

**Synoptique, retours des essais Windows** (2026-10-09) :
- Démarrage : fenêtre d'accueil (nouveau projet, reprendre le dernier, ouvrir un .avd, rejoindre une session,
  8 projets récents gardés sur l'appareil). Paramètres > Enregistrement (ce poste) : dossier par défaut pour
  Enregistrer et Ouvrir, copie automatique du projet en .avd (plugin persisted-scope).
- Écran noir à la connexion corrigé (boucle de sélection) ; tracé figé après déplacement corrigé.
- Sélection : cadre au glisser dans le vide (blocs entièrement dedans, liaisons touchées) ; Maj ou Ctrl + cadre
  et Maj ou Ctrl + clic ajoutent ou retirent ; Ctrl+A ; vue déplacée à la molette, clic milieu ou Espace + glisser.
- Menu clic droit : multipaire, relier en série, tracé automatique, dupliquer, pivoter, grouper, supprimer.
- Zones : bouton « Zone » (cadre lié à une zone du projet, saisi par son titre ou ses bords, renommage à Entrée) ;
  les blocs posés dedans en prennent le code (préfixe des numéros de câble).
- Multipaire : vue Câbles en tronc commun (peigne au départ, câble épais, peigne avant les entrées), toutes
  sources confondues ; regroupement depuis la sélection.
- Relier en série : sorties des équipements sélectionnés (ordre du schéma) vers les entrées libres d'une
  destination, à partir d'une entrée choisie, multipaire proposé.
- Tracé : voies ordonnées sans croisement dans les couloirs (liaisons gauche-droite) ; poignée pour déplacer le
  segment vertical à la main.
- Liaison douteuse : fenêtre à la connexion (annuler, garder, ne plus signaler dans ce schéma) ; contrôles
  désactivés listés dans Alertes, réactivables au clic droit.
- Bibliothèque filtrée sur le calque actif (« Tout afficher » possible).
- Aligner et répartir (gauche, centres, droite, haut, bas, écarts égaux, colonne, ligne) ; croix de recherche ;
  Échap pour désélectionner ; panneaux redimensionnables (bibliothèque, inspecteur, panneau du bas).
- Mode débutant : « Pas à pas » (étapes cochées au fil du travail), « Et ensuite ? » (relier les sorties
  libres, ajouter N exemplaires), aide sur le schéma vide ; ports compatibles allumés pendant une liaison.
- Double écran : bouton de la barre du haut ; fenêtre « Infos » (inspecteur et listes), ouverte sur le
  deuxième écran s'il existe, synchronisée avec le schéma (projet, sélection, annulation, alignement).
- Limites : voies ordonnées et poignée pour les ports à gauche ou à droite seulement (blocs pivotés : tracé
  automatique classique) ; emplacement de l'enregistrement interne sous Windows à confirmer.

**Lot 3, vues liées : vue Baies (V4)** (2026-10-09) : bouton « Baies » de la barre du bas.
- Baies 19" (hauteur 4 à 47 U, renommables), faces avant et arrière, montage par glisser-déposer depuis la liste
  « À monter » (équipements dont la hauteur en U est renseignée) ou d'une position à l'autre ; refus des
  chevauchements et des dépassements, avec message.
- Même instance que le synoptique : sélectionner un équipement dans une baie l'ouvre dans l'inspecteur ; l'inspecteur
  affiche « Hauteur (U) » et la baie de l'équipement (lien vers la vue, bouton « Retirer de la baie »).
- Bilan par baie : U occupés / libres, poids, puissance et dissipation (1 W = 3,412 BTU/h), hauteur utile en mm,
  nombre d'équipements sans poids ou puissance renseignés.
- Alertes (cahier des charges 3.1) : rackable absent des baies (désactivable par équipement), montage à revoir
  (baie raccourcie, hauteur modifiée). Baies partagées en collaboration et prises en compte par la fusion.
- Reste pour V4 : export PDF des élévations, poids et profondeur maximale de la baie, cartes et modules en slot.

**Catalogues Novelty et Audio Pro couverts à 100 %** (2026-10-08) : 813 fiches au total (458 Vérifié, 355 Communauté).
- 753 équipements distincts ; tous couverts par une fiche, sauf 26 hors périmètre (câbles, optiques, consommables)
  et 36 désignations imprécises (modèle non identifiable), listés dans `tools/bibliotheque/inventaire-traitement.csv`.
- Contrôle : `python3 tools/bibliotheque/couverture.py --reste` (doit afficher « reste : 0 »).
- Ajouts du jour : Pioneer DJ, Technics, Rane, Denon, Numark, Xone ; Taiden ; Altair ; Klark Teknik, BSS, beyerdynamic ;
  micros DPA, Schoeps, AKG, Electro-Voice, Neumann, Audio-Technica ; Lexicon, TC Electronic, Avalon ; Innovason, Bose,
  Fohhn, Clear-Com, Turbosound, Avid, Soundcraft, Bosch, QSC, RME, Tascam ; Blackmagic, Panasonic, NovaStar, Sony,
  Decimator, écrans, Ross, Barco, Folsom, Datapath, Analog Way, Kiloview, Lumantek, Teradek ; lumière (Chauvet, ETC, MA,
  SGM, Robe, Elation, W-DMX, MDG, ChamSys, GLP, Cameo, ARRI, Enttec, Luminex, LumenRadio...) ; réseau ; armoires électriques.
- Modèle : niveau de signal « Phono » (règles phono vers ligne et inverse) ; connecteurs DIN 6 et DIN 8.

**Travail à plusieurs sur le réseau local** (2026-10-08) : session hébergée par l'application de bureau, rejointe
par adresse et code à 6 chiffres ; document partagé Yjs (fusion champ par champ), annulation propre à chacun,
présence (nom, couleur, calque, contour des blocs sélectionnés), reconnexion automatique, tchat, calques réservés
(protection contre les modifications croisées), reprise après perte de l'hôte (poste de secours, « Reprendre la
session »). Mode d'essai et limites :
`collaboration.md`. Reste : découverte automatique (mDNS), essais à 3 postes sur un réseau réel.

**Import d'un synoptique PDF d'un autre logiciel** (2026-10-08) : PDF vectoriel lu sur le poste, cadres -> équipements,
traits -> liaisons, textes au bord -> ports, repères et longueurs lus, fiches de la bibliothèque proposées, déductions
signalées, vérification avant import sur une nouvelle feuille. Détail et limites : `import-pdf.md`.

**Export PDF** (2026-10-08) : format A4 à A0, paysage ou portrait (le schéma prend la forme de la zone de la planche,
légende placée au-dessus du cartouche si la largeur manque), filigrane en diagonale ({client}, {project}, {date},
{revision}) incrusté dans l'image du schéma et répété sur la planche, aussi appliqué aux exports PNG et SVG ; protection
optionnelle (impression permise, modification et copie interdites). Réglages gardés dans le projet.

**Export professionnel** (2026-10-08) : cartouche aux champs inspirés de l'ISO 7200 (logo, propriétaire légal,
numéro, statut, établi / approuvé par, date d'émission automatique, historique des indices), rempli à l'export et
pré-rempli par un modèle propre au poste ; format avec choix mise à l'échelle ou taille fixe (pages A1, B1...,
découpage affiché sur le canevas) ; filigrane paramétrable ; chiffrement AES-256 par l'application de bureau.
Détail : `export-pdf.md`. Version navigateur abandonnée : application de bureau seule, Windows et macOS (Intel et Apple Silicon, macOS 12.3 minimum, voir `compatibilite.md`). Les essais de collaboration sont reportés à la fin de la version complète.

**Inventaire des prestataires** : `inventaire-prestataires.md` et `inventaire/*.csv`
(Novelty : 627 références ; Audio Pro : 226).

## Sources bloquées ou incomplètes

- Blackmagic : 1 M/E Constellation HD et Micro Converter bidirectionnel 3G refusés (limitation de débit), à retenter.
- Midas (mediadl.musictribe.com, cdn.mediavalet.com) : erreurs 500 / 502.
- Electro-Voice : products.electrovoice.com présente un certificat incomplet ; seules les pages www.electrovoice.com sont
  lisibles (ND868, ND308, ND408, RE200 non trouvés).
- Cisco SG300 : fiche technique refusée (403). Decimator : certificat du site incomplet. Ross : page de
  caractéristiques servie dans une autre langue, manuel introuvable (404).
- Neumann KM 184 / KMS 105 : page sans alimentation ni connecteur.
- Sony, Canon, LG (pages produit), Kramer (pages produit) : accès refusé (Akamai) ; les PDF restent souvent accessibles.
- Midas, Behringer, Klark Teknik : documentation Music Tribe (mediadl.musictribe.com) toujours en erreur 502.
- Barco : vérification anti-robot. LG 75UM3E : aucune fiche trouvée.
- beyerdynamic M 88 / M 201 / Opus 87 : caractéristiques non affichées sur le site du constructeur.
- Martin, Sony Pro : refus d'accès → déposer leurs manuels sur le Drive (Panasonic accessible depuis le 2026-10-08).

## Reste à faire

1. **Bibliothèque, compléments** (catalogues couverts à 100 % le 2026-10-08, voir ci-dessus) :
   - Passer en Vérifié les fiches Communauté dès qu'une fiche constructeur est disponible (surtout lumière et image).
   - Préciser les 36 désignations imprécises (`tools/bibliotheque/inventaire-traitement.csv`, colonne remarque).
   - Fiches minimales à compléter (connecteurs non précisés) : OXO, Portman, DeSisti, Scenilux, RVE, armoires de distribution.
2. **Import PDF** : essais sur de vrais synoptiques (Visio, AutoCAD, Vectorworks, draw.io) ; pages en image via l'assistant IA.
   **Collaboration** : essais réels à plusieurs postes (voir `collaboration.md`, section Tester), découverte mDNS.
3. **Lot 3** : vues liées. Fait : baies (V4, premier jet). Reste : export des élévations, plan d'implantation (V3), réseau (V5), intercom (V6), synchro (V7), électrique (V8).
4. **Synoptique** : voies ordonnées et poignée pour les blocs pivotés ; essais sur un schéma chargé
   (plusieurs consoles, retours) ; confirmer la copie automatique dans le dossier choisi après redémarrage.
5. **Lot 5** : mode formation. **Lot 6** : imports / exports avancés ; assistant IA en attente.
6. Points de bibliothèque à confirmer : section « Points en suspens » de `bibliotheque-a-documenter.md`.

## Pour reprendre

Les scripts de création des fiches sont dans `tools/bibliotheque/` (voir son README). Chaque fiche « Vérifié » cite sa
source (page ou document constructeur, date) ; ne rien inventer, marquer « non précisé » ce que la documentation ne dit pas.
