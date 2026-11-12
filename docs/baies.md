# Vue Baies - version 0.3.0

La vue Baies complète le synoptique : chaque appareil reste la même instance. Son nom, ses ports,
ses cartes et ses caractéristiques sont donc partagés entre les vues et enregistrés dans le `.avd`.

## Préparer et monter une baie

1. Ouvrir **Baies**, puis **Ajouter une baie**. Choisir sa hauteur en U, sa profondeur utile en mm
   et sa charge maximale en kg. Laisser un champ vide quand la limite n'est pas connue.
2. Renseigner la hauteur en U et la profondeur d'un appareil dans l'inspecteur. En mode Expert,
   renseigner aussi son poids et sa puissance.
3. Glisser l'appareil depuis **À monter** vers une face de la baie. Le formulaire permet également
   de choisir un appareil, une baie, la face de montage et l'unité basse, entièrement au clavier.
4. Cliquer sur un appareil monté pour retrouver ses propriétés. Le bouton **Retirer de la baie**
   le démonte sans supprimer l'appareil ni ses connexions. Annuler / Rétablir fonctionne aussi ici.

Une unité occupée en face avant et en face arrière ne compte qu'une fois dans le bilan des U.
La face est le côté de montage : la représentation reste symbolique et ne comporte pas de photos
constructeur des façades.

## Contrôles et bilans

- Un nouveau montage est refusé s'il dépasse en hauteur, chevauche un appareil de la même face,
  dépasse la profondeur utile, dépasse la charge maximale connue, ou si les profondeurs de deux
  appareils face à face ne tiennent pas dans la baie.
- Déplacer un appareil ne compte pas son poids deux fois.
- Modifier une caractéristique ou une limite après le montage conserve le travail et signale les
  montages à revoir. Réduire une baie ne supprime et ne déplace jamais ses appareils.
- Un poids, une puissance ou une profondeur inconnus sont signalés. Les totaux restent alors des
  valeurs partielles ; une limite n'est contrôlée qu'avec les caractéristiques renseignées.
- Le poids et la puissance déclarés de l'hôte s'entendent **hors cartes**. Les cartes installées
  s'ajoutent au poids, à la puissance, à la dissipation et à la nomenclature, sans occuper de U.
- La profondeur utile doit inclure la place nécessaire au câblage et à la ventilation : ces marges
  ne sont pas déduites automatiquement des dimensions constructeur.

## Cartes et slots

La bibliothèque contient un **Châssis modulaire (exemple)** à quatre slots et deux cartes génériques
audio et vidéo. Ce sont des exemples modifiables, sans caractéristiques constructeur inventées.

- Sélectionner un châssis puis ouvrir **Cartes et emplacements** dans l'inspecteur. Choisir une carte
  dans un slot libre : ses ports apparaissent sur le châssis, préfixés par le nom du slot.
- En mode Expert, ajouter un slot en renseignant son nom et son type. Pour une carte personnalisée,
  créer un bloc de famille **Cartes et modules**, renseigner le type, ses ports et ses caractéristiques,
  puis l'enregistrer dans **Mes modèles**. Le type doit correspondre exactement à celui du slot.
- Le type est une compatibilité déclarée par l'utilisateur ; vérifier la documentation constructeur
  pour les véritables formats de carte. Les exemples génériques n'attestent aucune compatibilité réelle.
- Un slot occupé ne peut pas recevoir une seconde carte ni être supprimé. Retirer une carte câblée
  demande une confirmation indiquant le nombre de liaisons supprimées. Annuler restaure ensemble
  la carte, ses ports et ses câbles. Les autres cartes et liaisons restent présentes.
- Les ports d'une carte se modifient comme ceux du châssis. Pour les supprimer, retirer la carte.
- Enregistrer un châssis dans **Mes modèles** conserve ses slots et ses ports propres ; les cartes
  installées restent des instances du projet et ne deviennent pas des ports fixes du modèle.

## Export PDF

Dans Baies, cliquer sur **Exporter les baies en PDF**. Le menu d'export PDF de la barre du haut
exporte également la vue active.

- Faces avant et arrière côte à côte, numérotation des U du haut vers le bas et bilans par baie.
- Tracé vectoriel, texte sélectionnable et proportions 19 pouces / U conservées.
- Choix A4 à A0, portrait ou paysage, cartouche, révisions, filigrane et protection existants.
- Les baies trop hautes sont réparties sur des pages portant des plages de U contiguës ; un appareil
  à cheval sur deux pages apparaît sur chacune avec une indication de continuation.
- Les cartes installées sont listées sur des pages supplémentaires par baie.
- La sélection, la vue et les positions des appareils ne changent pas pendant l'export.
- Le filigrane des baies est vectoriel, y compris dans la zone des élévations. Il est modifiable avec
  un éditeur PDF ; l'interface ne le présente pas comme incrusté dans les pixels.

## Collaboration et anciens projets

Les anciens `.avd` sans cartes ni contraintes restent lisibles. Les nouveaux champs sont facultatifs.
Les fichiers contenant des structures de cartes incohérentes sont refusés au chargement.

En LAN, installer la version **0.3.0 sur tous les postes** : le nouveau format partagé des slots et
cartes est annoncé avant toute synchronisation. Une connexion avec une version incompatible est
refusée sans remplacer le projet local. Le code d'accès et les droits par calque restent contrôlés.
Les réglages communs des baies restent réservés à l'hôte ; le montage et les ports respectent les
droits du calque. Deux ajouts simultanés dans des slots différents sont conservés ; l'annulation
retire seulement les modifications de son poste.

## Vérification

Tests automatisés : contraintes et données manquantes, insertion / retrait de cartes et câbles,
annulation, nomenclature, sauvegarde `.avd`, partage, ajouts simultanés, anciens protocoles refusés,
formulaire de montage, export de la vue active, pagination et texte des PDF, filigrane vectoriel.

Les PDF d'exemple A3 portrait et A4 paysage sont rendus et contrôlés visuellement. Les essais de
l'installateur sur postes réels, les manipulations en LAN et l'impression papier restent à effectuer.
