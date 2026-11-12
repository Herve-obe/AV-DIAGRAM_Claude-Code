# Inventaire des catalogues de prestataires

Objectif : lister le matériel des grands prestataires pour l'ajouter à la bibliothèque d'AV Diagram.
Les catalogues donnent des noms de modèles et des descriptions commerciales, rarement la connectique.
**Une fiche n'est créée « Vérifié » qu'à partir de la documentation du constructeur** (manuel ou fiche
technique officielle, source citée). Le catalogue d'un prestataire sert à choisir quoi documenter, pas de source technique.

## Catalogue Novelty en ligne — 19 octobre 2026

À partir de la **0.3.5**, les **1 534 fiches françaises hors catégorie Structure**
du [catalogue public Novelty](https://www.novelty.fr/tout-le-materiel/) sont représentées
dans la bibliothèque. Les **417 fiches classées Structure sont exclues**, y compris une
fiche classée à la fois Structure et Vidéo. Les accessoires classés dans les autres menus
(pieds de micro, optiques, supports d'écran, consommables…) restent inclus, comme demandé.

Après regroupement des désignations équivalentes et doublons, **1 230 modèles sont ajoutés**
et **281 fiches existantes** reçoivent des désignations de recherche et des liens documentaires.
Les identifiants, ports, statuts et caractéristiques techniques des fiches déjà présentes
sont conservés. Les variantes et ensembles non équivalents à un appareil seul restent séparés.
La bibliothèque comporte **2 043 fiches constructeur/catalogue**, plus **24 modèles génériques**.

Les nouveaux modèles restent au statut **Communauté**. Parmi eux, **136 accessoires sans
connectique** sont identifiés comme tels, **1 093 fiches** ont des connexions à compléter,
et le QuikPunch dispose des quatre connexions filaires relevées dans sa fiche Astera.
Les entrées et sorties explicitement décrites sont renseignées pour 32 équipements de distribution,
avec la mention de connectique à compléter pour les éléments qui restent non précisés.
Aucun port fictif n'est ajouté pour rendre une fiche valide. Une connectique inconnue
ne signifie pas que l'équipement ne possède aucun port.

Les poids unitaires et consommations ne sont relevés que lorsque l'unité est explicite.
Les valeurs de transport, puissances LED seules, courants nominaux, valeurs nulles et dimensions
dont les axes ne sont pas précisés ne sont pas convertis en caractéristiques d'appareil.
Les pages AP63COMPT et AD32T/6XPC16 présentent des informations incohérentes : leurs
caractéristiques restent non renseignées et le problème est indiqué dans leur description.

Le [relevé de couverture](inventaire/novelty-2026-couverture.json) associe chaque identifiant
et URL Novelty retenus à la fiche utilisée dans AV Diagram. Les documents du fournisseur
restent en ligne ; leurs photos et PDF ne sont pas copiés dans le dépôt.

La bibliothèque et la palette de commandes acceptent les autres désignations et codes du
catalogue. L'inspecteur affiche la description et les documents ouvrables dans le navigateur.
Pour une connectique manquante, **Compléter les connexions** ouvre le mode Expert et son
éditeur de ports. Les modèles restent utilisables pour le placement, les listes et les baies
lorsque les caractéristiques nécessaires sont connues. Les ports absents doivent être
complétés avant de les câbler. La présence au catalogue ne vaut pas vérification technique.

## Sources (consultées le 2026-09-25)

- Novelty, *Références 2025-2026*, catalogue PDF de 274 pages (fichier `Novelty_catalogue_2025_FR.pdf`
  du dossier Drive des catalogues, identique à la version publiée sur
  https://www.novelty.fr/wp-content/uploads/2025/03/Novelty_catalogue_2025_FR.pdf).
- Audio Pro, catalogues 2025 *Son* et *Vidéo*, catalogues *Distribution* et *Backline* (tarifs 2022),
  fichiers PDF du dossier Drive des catalogues.

Les catalogues ne sont pas copiés dans le dépôt ; seuls les noms de modèles et une description courte sont relevés.

## Fichiers

- `inventaire/novelty-2025.csv` : relevé automatique (marque, modèle, description, page), puis nettoyé
  (renvois de page, doublons, accessoires sans connectique comme pieds, structures et consommables retirés).
  Il reste du bruit : certaines lignes mêlent deux produits d'une même page ; à relire au moment de créer la fiche.
- `inventaire/audiopro-2025.csv` : relevé manuel. Le catalogue Audio Pro nomme souvent le modèle sans la marque :
  la marque n'est indiquée que lorsqu'elle est certaine, sinon la colonne remarque dit « à confirmer ».
  Le backline (batteries, claviers, amplis d'instrument) n'est pas relevé : il n'a pas sa place dans un synoptique,
  sauf demande contraire.

## Volumes relevés

| Menu | Novelty | Audio Pro |
|---|---|---|
| Audio | 257 | 183 |
| Image | 120 | 37 |
| Lumière | 227 | 0 |
| Réseau | 8 | 0 |
| Distribution | 12 | 6 |
| Divers | 3 | 0 |

## Priorités proposées

Critères : présent chez les deux prestataires, très courant en prestation, connectique riche (donc utile sur un schéma).

**Priorité 1, Audio**
- L-Acoustics : LA4X, LA8, LA12X, P1, KS28, SB15m, X8, X12, X15 HiQ, 112P, Syva, Kara II, K2
- Yamaha : CL5, QL1, DM7, DM3, TF1, Rio1608-D2, Rio3224-D2
- Midas : DL251 ; Shure : AD4D, AD1, AD2, ADX1M, UR4D, UR1, UR2, UA845, PSM1000
- DPA : 4099, 4088, 4060 (micros cravate et serre-tête : une sortie microdot ou TA4F selon l'adaptateur)
- Intercom : Green-GO MCX, BPX, WBPX (Green-GO nommé chez Novelty ; chez Audio Pro, marque déduite)

**Priorité 1, Image** : Blackmagic ATEM Mini Pro, HyperDeck Studio, Web Presenter ; Panasonic AW-UE150 ;
Decimator MD-HX ; Folsom ImagePRO-II ; Novastar VX4S.

**Priorité 2** : le reste de l'audio (DiGiCo SD10, consoles Midas Pro, Yamaha M7CL, périphériques),
réseau (Luminex GigaCore, Netgear, Cisco, Swisson, Oxo : Novelty seulement), vidéo (projecteurs, écrans, caméras).

**Priorité 3, Lumière** (227 références Novelty) : demande d'abord d'ajouter au modèle les signaux et connecteurs
d'éclairage (DMX512 sur XLR 5 broches, Art-Net, sACN, RDM) et une famille « Lumière ». Les fiches suivront.

**Distribution** : les armoires des prestataires sont des fabrications maison (Novelty RS32 V3, RS63 V3,
RS125 V3, etc. ; Audio Pro A32 à A400). Elles se décrivent à partir du catalogue lui-même (entrées, sorties,
protections), avec le statut « Communauté » : c'est la seule documentation qui existe.

## Accès aux sites des constructeurs (vérifié le 2026-09-25)

Accessibles : L-Acoustics, Yamaha, Shure, Midas, DiGiCo, Robe, Blackmagic Design.
Refusés (erreur 403) : Martin, Sony Pro, Panasonic. Pour ces marques, déposer les manuels sur le Drive.
