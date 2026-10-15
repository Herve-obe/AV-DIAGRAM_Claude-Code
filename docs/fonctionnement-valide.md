# Enregistrement et collaboration d’AV Diagram

Fonctionnement demandé, proposé dans la [PR n° 2, encore en brouillon](https://github.com/Herve-obe/AV-DIAGRAM_Claude-Code/pull/2).

## Fichiers et sauvegardes

- Sur ordinateur, créer un projet demande son nom et son dossier. Le fichier `.avd` est créé avant de remplacer le projet ouvert.
- **Ctrl+S / Cmd+S** remplace le fichier principal. Le bouton Enregistrer fait la même chose. **Ctrl+Maj+S / Cmd+Maj+S** permet de choisir un autre emplacement.
- Les modifications courantes ne remplacent plus automatiquement le fichier principal.
- Les copies de sécurité restent automatiques. Dans Paramètres > Enregistrement, choisir l’intervalle et le nombre de copies.
- Les copies vont dans **Save Back Up**, avec un sous-dossier stable propre au projet. Avec dix copies conservées, la onzième supprime la plus ancienne de ce projet. Deux projets de même nom restent indépendants ; renommer un projet ne crée pas une seconde rotation.
- Les anciennes copies du dossier « Sauvegardes » restent en place. Elles ne sont pas supprimées lors du changement de fonctionnement.
- L’indicateur « Fichier principal enregistré » correspond à la version effectivement écrite. Une copie de sécurité ne change pas cet indicateur.
- Fermer ou changer de projet propose **Enregistrer / Ne pas enregistrer / Annuler**. Une erreur d’écriture garde le document ouvert.
- Les projets récents sont des raccourcis. Les retirer ne supprime ni les fichiers ni les anciens contenus locaux.

Une copie interne aide à reprendre le travail après un plantage. Elle reste distincte du fichier principal et des copies du dossier Save Back Up. Si le fichier principal est absent, la dernière copie interne récupérable est ouverte comme travail non enregistré.

## Collaboration sur le réseau local

L’hôte ouvre le schéma et la session. Dans la fenêtre Collaboration, il attribue chaque calque à un invité. Un invité peut recevoir plusieurs calques ; un même calque est réservé à un invité à la fois.

Les invités voient le schéma complet. Ils doivent sélectionner un calque attribué pour l’éditer. Leur vue générale reste en lecture seule. Les réglages communs du projet restent réservés à l’hôte. Sur un appareil partagé, un invité peut modifier les ports de son domaine, sans changer les éléments protégés des autres domaines.

Deux invités peuvent modifier ou ajouter simultanément des ports audio et vidéo du même appareil. Annuler une modification conserve celles de l’autre invité. Les fichiers `.avd` existants restent compatibles.

L’hôte garde l’accès à tous les calques, y compris depuis la vue générale. Retirer une attribution empêche les nouvelles modifications de l’invité concerné. Les droits sont conservés lors d’une reconnexion normale du même poste.

Pour ouvrir un autre schéma, quitter ou terminer d’abord la session. Une ouverture locale ne doit pas remplacer le document partagé.

Si un poste de secours a repris l’hébergement après une panne, il conserve la session à jour. Le poste initial qui reprend rejoint ce secours ; l’hébergement ne revient pas automatiquement chez lui. Cela évite qu’un ancien état remplace les modifications faites pendant son absence.

## Vérification avant fusion

Pour compléter les simulations par un essai sur trois ordinateurs :

1. Installer la même version sur les trois postes. Ouvrir une session sur l’hôte et faire rejoindre deux invités ; attribuer Audio au premier, Vidéo au second.
2. Utiliser un appareil comportant des ports audio et vidéo. Modifier puis ajouter un port de chaque domaine simultanément. Vérifier que les trois postes affichent les deux changements.
3. Annuler chez l’invité Audio : seul son changement doit disparaître. Vérifier aussi qu’il ne peut modifier ni le calque Vidéo ni la vue générale ; l’hôte doit pouvoir tout modifier.
4. Couper puis rétablir le réseau d’un invité et vérifier la reconnexion. Sur des copies de test, fermer brutalement l’hôte avec un secours activé, puis reprendre depuis le poste initial : il doit rejoindre le document du secours à jour.
5. Modifier le schéma sans enregistrer, puis rouvrir le fichier principal depuis une autre copie de l’application : il doit contenir la dernière version enregistrée manuellement. Ctrl+S / Cmd+S doit ensuite mettre ce fichier à jour.
6. Régler une rotation courte, attendre une copie de plus que le nombre conservé et vérifier le contenu de « Save Back Up ». Tester aussi un emplacement devenu inaccessible : l’erreur d’écriture doit garder le projet ouvert et non enregistré.

Les 184 tests TypeScript passent localement ; les types, le lint et la construction de l’interface passent aussi. Les tests comprennent la rotation, les homonymes, les pannes d’écriture, l’indicateur d’enregistrement, la fenêtre Infos et des simulations à deux et trois instances : attribution puis retrait de droits, reconnexion, reprise du poste initial sur un secours actif, modification et ajout simultanés de ports, puis annulation individuelle. Les quatre avertissements de lint existaient déjà.

La CI de la PR au commit `a98f794` réussit sur GitHub, avec les 184 tests TypeScript, la compilation Windows et dix tests natifs. Le test de relais manuel reste ignoré, comme prévu. Les essais avec dialogues natifs, disques réels et trois ordinateurs restent à faire, notamment les pannes et reprises. Deux hôtes isolés par une coupure ne fusionnent pas automatiquement leurs documents : il faut conserver leurs fichiers avant une fusion manuelle.
