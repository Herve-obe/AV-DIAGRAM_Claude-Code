# Réponses audio 04 et lumière 02 — 4 novembre 2026

Les précisions saisies dans le document 76193 sont appliquées malgré la colonne « À décider » laissée inchangée. Elles choisissent les références à conserver ou séparer ; elles ne certifient pas toutes les caractéristiques.

## Résultat — 0.5.27

15 fiches créées, 6 fiches précisées, 11 doublons ou références combinées exclus du catalogue actif, 6 fiches canoniques réutilisées sans modification. Les 2 156 fichiers source antérieurs sont conservés, dont les onze désormais exclus ; 15 fichiers distincts sont ajoutés. Les projets enregistrés gardent leurs appareils et ports.

Bibliothèque active : **1 650 modèles réels**, dont **741 Vérifié et 909 Communauté**, plus 30 génériques. La hausse des fiches Communauté vient de la séparation des variantes ; aucune nouvelle fiche n’a été promue Vérifié.

| Ligne | Précision utilisateur | Fiches actives retenues |
| --- | --- | --- |
| A04-03 | Silver | `sennheiser-e609-silver` |
| A04-09 | MD 421-II | `sennheiser-md421-ii` |
| A04-10 | ME 2 | `sennheiser-me2` |
| A04-12 | Traite uniquement la capsule Me 80 | `sennheiser-me80` |
| A04-13 | les 2 | `sennheiser-mke-40-ew`, `sennheiser-mke40-se-3pin` |
| A04-14 | 2 fiches distinctes | `sennheiser-mkh-406`, `sennheiser-mkh-416` |
| L02-01 | les 2 séparément | `robert-juliat-710sx`, `robert-juliat-710sx2` |
| L02-02 | les 2 séparément | `robert-juliat-713sx`, `robert-juliat-713sx2` |
| L02-03 | oui | `robert-juliat-713sx` |
| L02-04 | séparer | `robert-juliat-714sx`, `robert-juliat-714sx2` |
| L02-05 | 2500w HMI | `robert-juliat-aramis` |
| L02-09 | les 2 séparément | `robert-juliat-korrigan`, `robert-juliat-super-korrigan` |
| L02-11 | les 2 séparément | `robert-juliat-victor-1159`, `robert-juliat-victor-1159b` |
| L02-12 | les 2 séparément | `ayrton-arcaline-2-50`, `ayrton-arcaline-2-100` |
| L02-16 | les 2 séparément | `etc-eos-motorized-fader-wing-10`, `etc-eos-motorized-fader-wing-20` |
| L02-18 | les 2 séparément | `etc-gio-original`, `etc-gio-enhanced` |
| L02-19 | Version portable 6 et 12 canaux à traiter séparément | `etc-smartpack-portable-6`, `etc-smartpack-portable-12` |

## Limites techniques

- Les 17 précisions utilisateur règlent les choix de bibliothèque ; elles ne constituent pas une validation constructeur globale des deux lots de 20 références.
- Les caractéristiques non établies restent absentes ; 20 des 21 fiches créées ou modifiées gardent leur connectique en attente.
- Aramis : HMI 2500 W est la puissance de lampe déclarée ; suffixe, ballast et consommation système restent à établir.
- ME 80 : capsule seule, sans K3 ni prise fantôme P48 supposée.
- MKE 40 SE 3 broches : référence commerciale et brochage à compléter ; aucune association supposée au MKE 40-4.
- Arcaline 2 : liaison combinée secteur/DMX à 7 contacts, sans invention de prises indépendantes.
- Super Korrigan : Harting Han 16 × 16 A + terre documenté, connecteur générique multipin refusé, ports en attente.
- Gio : variantes original/Enhanced séparées ; les appareils transitoires restent à identifier, sans capacité déduite du nom.
- SmartPack Portable 6/12 : région, suffixe et panneau de sorties restent à préciser, sans conversion de calibres A en W.
- Les six fiches canoniques réutilisées restent identiques ; le MKH 416 existant est précisément P48U3, sans confirmation de toutes les variantes historiques.
- Les onze JSON exclus restent présents ; aucun appareil ni port des projets enregistrés n’est migré.
- Les lots audio 03, vidéo pro 01 et lumière pro 01 restent en attente ; les anciens retours audio 01/02, D5000 et tri professionnel ne sont pas rejoués.

## Contrôles

Sept tests échouaient avant les changements. Les huit régressions de variantes passent après intégration ; un contrôle de couverture a détecté une URL Novelty manquante pour Aramis, restaurée. Contrôles finaux réussis : 28 tests ciblés puis 498 tests généraux, types et compilation. Lint : zéro erreur, quatre avertissements historiques. Six essais IA réelle ignorés localement ne sont pas des réussites. Installation native et essais matériels non effectués localement.

Le [JSON des réponses](retours-audio04-lumiere02-2026-11-04.json) conserve les réponses brutes, correspondances et identifiants pour éviter une seconde application.
