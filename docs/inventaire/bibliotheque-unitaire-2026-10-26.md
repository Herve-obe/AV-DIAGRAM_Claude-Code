# Bibliothèque unitaire et documentation — 26 octobre 2026

## Ensembles

La consigne du 26 octobre exclut les ensembles de plusieurs appareils, y compris les ensembles fabricant. 78 ensembles et deux accessoires résiduels sont écartés. Cela comprend les régies Novelty, les ensembles HF Sennheiser/Shure, les racks LA-RAK et les couples vidéo TX/RX représentés par une seule fiche.

30 fiches sont explicitement normalisées vers un appareil seul, notamment les enceintes vendues par paire et les projecteurs loués par lots. Leur identifiant technique est conservé pour la traçabilité. Les libellés et alias de lots sont retirés. Les poids et consommations de lot non établis pour une unité sont omis ; les valeurs unitaires déjà documentées de QuikPunch sont conservées. Une normalisation de libellé ne vérifie pas la connectique.

Les fiches des ensembles exclus restent archivées. Les anciens fichiers .avd embarquent les modèles et les ports de leurs équipements : leur lecture ne supprime donc pas les ensembles déjà placés. Aucun remplacement automatique n’est effectué dans ces projets. Les composants absents du catalogue ne sont pas inventés : ils devront avoir leurs propres fiches et sources avant câblage.

Après ce correctif : **1712 références constructeur actives et 30 blocs génériques**, dont 475 fiches constructeur Vérifié. Le dépôt conserve les 2 156 fiches sources ; 444 sont exclues. Le relevé des 110 décisions modifiées se trouve dans [le registre des ensembles](ensembles-audit-2026-10-26.json). Le précédent audit du 25 octobre reste historique. Les écrans de projection, optiques et machines à effets restent conservés.

Cette passe porte sur l’identification des ensembles et leurs données agrégées, pas sur une nouvelle lecture de tous les manuels techniques.

## Recherche de manuels : travail en cours

La campagne débutée le 25 octobre a repéré des documents pour 197 références initiales. Après exclusion des ensembles, 177 de ces références restent dans la bibliothèque active. « Document retrouvé » peut désigner un lien identifié sur l’index officiel ou un document effectivement consulté : le niveau d’accès est enregistré pour chaque source dans [le journal détaillé](recherche-manuels-2026-10-26.json). Il ne signifie pas que tous les ports et toutes les valeurs ont été transcrits et vérifiés.

Quatre fiches ont été complétées à partir des documents consultés et deviennent Vérifié : Shure UA870WB, Beta 87C, Beta 98H/C et SM58SE. Des documents attribués à la mauvaise variante ont été retirés des fiches Beta 98AD/C et UA874E.

1056 références actives de la liste initiale restent à examiner. Ce nombre n’est pas une liste d’introuvables. Les sept accès documentaires suivants doivent encore être confirmés, et une référence nécessite une clarification :

| Référence | État |
| --- | --- |
| DL351 | document identifié, accès à confirmer |
| Heritage-D HD96-24 | document identifié, accès à confirmer |
| Heritage 3000 | document identifié, accès à confirmer |
| M32 LIVE | document identifié, accès à confirmer |
| PRO1 | document identifié, accès à confirmer |
| PRO2C | document identifié, accès à confirmer |
| PRO6 | document identifié, accès à confirmer |
| UA400A | référence ou variante à préciser |

Aucun de ces huit cas n’est promu Vérifié. Les recherches fabricant puis loueur doivent continuer avant d’établir une liste finale de documents introuvables.

## Assistant IA

Le [cahier des charges de reprise](../cahier-des-charges-ia.md) et ses [25 cas initiaux de recette](../recette-ia-reprise.json) décrivent les corrections à développer. Le défaut « adapter le schéma existant à une page » n’est pas corrigé par le présent tri de bibliothèque. Le moteur d’édition de l’existant et son aperçu restent l’étape P0.

## Vérifications locales

457 tests réussis, dont les trois nouveaux contrôles des ensembles et des projets anciens. Cinq essais avec le vrai modèle IA ne sont pas exécutés dans cette campagne locale. Contrôle des types et compilation réussis. Lint sans erreur, avec quatre avertissements préexistants. Les installateurs natifs et les vrais modèles seront vérifiés par la CI ; aucun succès natif n’est supposé ici.
