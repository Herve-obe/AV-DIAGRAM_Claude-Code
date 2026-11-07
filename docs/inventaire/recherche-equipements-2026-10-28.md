# Recherche des équipements — lot contrôlé du 28 octobre 2026

Version 0.5.17. Base : `0a2c2cec5a83b25e458003404322f5734cc6eefa` (0.5.16).

## Périmètre

458 fiches existantes sont enrichies ou corrigées sur les 1 220 fiches Communauté du point de départ. La recherche des 762 autres références reste en pause. Le journal distingue chaque fiche examinée des références non examinées ; un document téléchargé ne suffit pas à attribuer le statut Vérifié.

| Domaine | Examinées | Vérifié après contrôle | Communauté après contrôle | Non examinées |
|---|---:|---:|---:|---:|
| Audio | 116 | 81 | 35 | 232 |
| Image / vidéo | 142 | 60 | 82 | 206 |
| Lumière | 139 | 59 | 80 | 206 |
| Interphonie, réseau, distribution et autres | 61 | 48 | 13 | 118 |

Bibliothèque active : **740 Vérifié, 972 Communauté**, plus 30 modèles génériques ; 248 fiches Communauté passent Vérifié dans ce lot. Les références exclues restent archivées.

## Corrections livrées

- Prises physiques distinguées des canaux, des reprises parallèles et des connecteurs optionnels ; ports et niveaux analogiques documentés sur les consoles, interfaces et cartes.
- Consommation électrique distinguée de la puissance audio, du calibre d’une armoire et de la puissance de lampe. Masses unitaires distinguées des lots et flight-cases.
- Variantes de modèles conservées lorsque les notices divergent. Les sources fabricant restent identifiées même lorsque leur PDF est hébergé par un loueur.
- Connecteurs ajoutés pour les prises documentées : XLR7, micro-USB, RP-TNC, Mini-DIN4, Mini DisplayPort, Mini HDMI, Camlock, Socapex19, prise française type E, AutoConnect Syva et Martin BBD6. Les familles incompatibles restent distinctes.
- Identifiants d’équipements conservés. Les appareils des projets déjà enregistrés ne sont ni remplacés ni recâblés automatiquement.

## Réserves du contrôle avant publication

Quarante fiches provisoirement marquées Vérifié pendant la recherche sont conservées en Communauté : fabricant absent du catalogue d’origine ou au moins une prise, fiche de câble captif ou prise propriétaire encore non identifiée. Les informations établies restent dans ces fiches. Les cases sans donnée ne sont pas complétées par supposition.

- `yamaha-mg124c` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `yamaha-mg102c` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `panasonic-moniteur-eq2-43` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `panasonic-moniteur-eq2-55` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `panasonic-moniteur-eq2-65` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `panasonic-moniteur-eq2-75` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `panasonic-moniteur-eq2-86` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `adb-acp1001` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `arri-studio-t12` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `chauvet-professional-well-fit-b` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `chauvet-professional-well-fit-c` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `chauvet-professional-well-fit-n` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `de-sisti-leonardo-310` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `desisti-leonardo-1kw` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `desisti-leonardo-2kw` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `desisti-leonardo-5kw` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `desisti-monet-150mm-1kw` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `etc-s405` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `etc-s410` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `etc-s414` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `etc-s419` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `etc-s426` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `etc-s436` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `etc-s450` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `etc-s470` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `etc-source-4` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `sgm-p5-wash-light-43` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `swisson-xsr-5r-5r` : type d’au moins une prise ou de la fiche du cordon non confirmé.
- `armoire-125tri` : fabricant non identifié.
- `armoire-250tri` : fabricant non identifié.
- `armoire-32tri` : fabricant non identifié.
- `armoire-630tri-v2` : fabricant non identifié.
- `armoire-630tri` : fabricant non identifié.
- `armoire-63tri` : fabricant non identifié.
- `armoire-ar125evo` : fabricant non identifié.
- `armoire-rc250tri` : fabricant non identifié.
- `armoire-rc630tri` : fabricant non identifié.
- `armoire-rs125-v3` : fabricant non identifié.
- `armoire-rs32-v3` : fabricant non identifié.
- `armoire-rs63-v3` : fabricant non identifié.

Certaines valeurs dépendent toujours de la version ou d’options : elles sont détaillées dans le champ `remaining` du journal par équipement. La vérification matérielle sur les appareils réels reste à réaliser.

## Journal détaillé

Le [manifeste JSON](recherche-equipements-2026-10-28.json) référence quatre fichiers par domaine ; chaque fiche examinée y conserve ses sources, les champs changés, son statut final et les réserves connues. Les 762 références non examinées sont explicitement identifiées. Les PDF de travail et les chemins locaux ne sont pas publiés.

## Validation

479 tests locaux réussis, dont les contrôles du catalogue et des connecteurs. Six essais utilisant le vrai modèle local restent réservés au banc d’intégration distinct. Le contrôle des types TypeScript et la compilation de production réussissent. Le lint termine sans erreur, avec quatre avertissements préexistants dans Canvas et SeriesDialog. La compilation conserve ses avertissements de taille de bundle et d’imports dynamiques.

Le périmètre publié est comparé au commit de base par empreintes de fichiers : aucun changement extérieur à ce lot n’est incorporé. Les essais natifs des nouveaux installateurs et les tests du modèle réel seront exécutés séparément par GitHub Actions après publication.
