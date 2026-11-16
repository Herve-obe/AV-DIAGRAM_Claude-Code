# Décisions du tri professionnel — 0.5.26

Réponses du tableau `av-diagram-tri-pro-2026-10-31`, révision 21. Les 21 décisions sont traitées une fois : **16 retraits et 5 conservations**, aucune décision de périmètre en attente. Le choix « Valider » du tableau signifie conserver dans le périmètre, sans vérifier de nouvelles caractéristiques.

## Équipements conservés

| Référence | Décision | Statut technique conservé |
| --- | --- | --- |
| GoPro Hero 12 Black | Conserver | community |
| GoPro Hero 3 Black Edition Surf | Conserver | community |
| Panasonic Lumix DC-GH5 | Conserver | verified |
| Panasonic Lumix DMC-GH4 | Conserver | verified |
| Panasonic DMC-GH5 | Conserver | community |

Les deux GoPro et les trois références Panasonic GH4/GH5 restent disponibles. Leurs données de modèle, ports et statuts sont identiques au fichier source initial.

## Équipements retirés

| Référence | Décision |
| --- | --- |
| Fohhn FP22 CD-RX | Retirer |
| Fohhn FP22 CD-RX/TX | Retirer |
| Fohhn FP-22 RX | Retirer |
| Fohhn FP-22 RXTX | Retirer |
| Prozor DAC001 | Retirer |
| Shure SE112 | Retirer |
| DELL G5 15 5590 Noir – RTX 2060, Hexa Core i7 | Retirer |
| STARWAY Jupiter | Retirer |
| DIVERS Starflash | Retirer |
| Sunlitlux TL2001-6 13w 4000°K | Retirer |
| Sunlitlux TL2001-6 13w 6500°K | Retirer |
| Sunlitlux TL2001-6 21w 4000°K | Retirer |
| Sunlitlux TL2001-6 21w 6500°K | Retirer |
| Sunlitlux TL2001-6 28w 4000°K | Retirer |
| Sunlitlux TL2001-6 28w 6500°K | Retirer |
| Chauvet DJ DJ Bank | Retirer |

Les quatre variantes Fohhn, Prozor DAC001, Shure SE112, le Dell G5, Jupiter, Starflash, les six Sunlitlux et DJ Bank sont exclus du catalogue général. Leurs fichiers source sont conservés : les projets déjà enregistrés gardent ces équipements et leurs ports. Aucun catalogue privé importé n’est supprimé.

## Résultat

La bibliothèque active contient **1 646 modèles réels** : **741 Vérifié et 905 Communauté**, plus **30 génériques**. Le tri du 31 octobre totalise maintenant **48 retraits** (32 certains en 0.5.25, puis ces 16 décisions). Les 21 cas mixtes initiaux sont tous tranchés.

L’audit des champs est recalculé pour les références encore actives ; il indique 459 connectiques explicitement à documenter. Un champ optionnel absent ne prouve pas une erreur constructeur.

Les lots techniques audio 03, vidéo pro 01 et lumière pro 01 restent en attente de leurs propres tableaux. Ces décisions ne valident aucune des caractéristiques de ces lots. Les anciennes réponses audio01/02 (révisions533/156/822), dont le D5000, ne sont pas rejouées. Aucun nouveau lot de recherche n’est lancé.

## Contrôles

Avant les exclusions, deux tests échouent et dix-huit réussissent. Après application, le contrôle final réussit : 490 tests, types et compilation ; lint sans erreur, quatre avertissements historiques. Six essais IA réels sont ignorés. Les cinq fichiers de version sont synchronisés à 0.5.26, les dépendances et les 2 156 fichiers de modèles sont identiques au contenu initial. Le contrôle des projets anciens vérifie les modèles et ports des références retirées ; les cinq appareils conservés sont comparés exactement à leurs fiches source. Aucun nouveau test matériel, IA réelle ou validation native n’est supposé.

Voir les [réponses enregistrées](retours-tri-av-professionnel-2026-10-31.json) et le [tri initial](tri-av-professionnel-2026-10-31.md).
