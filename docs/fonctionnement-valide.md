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

Depuis **Session Collaborative**, l’hôte ouvre une salle d’attente avec son schéma. Les invités choisissent l’hôte dans la recherche automatique sur le réseau local et saisissent son code. La saisie d’adresse reste disponible dans les options avancées si la découverte est bloquée.

Depuis la version **0.2.3**, un hôte unique est présélectionné. S'il y a plusieurs sessions, l'invité choisit celle à rejoindre. Le nom de l'invité reste à renseigner en haut de la fenêtre ; le nom affiché sous le projet est celui de l'hôte. À côté du bouton Rejoindre, un message précise s'il manque le nom, la sélection d'une session ou les six chiffres du code. Une saisie d'adresse manuelle reste prioritaire et la disparition d'un hôte explicitement sélectionné ne choisit pas un autre hôte à sa place.

Les invités connectés apparaissent chez l’hôte. Il leur attribue les calques, puis clique sur **Commencer la session**, en bas de la fenêtre. Jusque-là, les invités sont en lecture seule, même si un calque leur a déjà été attribué. Un invité peut recevoir plusieurs calques ; un même calque est réservé à un invité à la fois. L’hôte peut réattribuer ou retirer les droits pendant la session, y compris pour un invité déconnecté.

Le bouton **Terminer la session** reste visible dans le bandeau du logiciel chez l’hôte, même si la fenêtre de gestion est fermée. Les invités disposent de **Quitter la session**. Le schéma reste ouvert sur chaque poste.

L'annonce de fin précède la fermeture des connexions, y compris lorsque les canaux internes ont déjà été fermés par le relais. Une fermeture voulue doit rester distincte d'une interruption qui déclenche la reprise.

Les invités voient le schéma complet. Ils doivent sélectionner un calque attribué pour l’éditer. Leur vue générale reste en lecture seule. Les réglages communs du projet restent réservés à l’hôte. Sur un appareil partagé, un invité peut modifier les ports de son domaine, sans changer les éléments protégés des autres domaines.

Deux invités peuvent modifier ou ajouter simultanément des ports audio et vidéo du même appareil. Annuler une modification conserve celles de l’autre invité. Les fichiers `.avd` existants restent compatibles.

L’hôte garde l’accès à tous les calques, y compris depuis la vue générale. Retirer une attribution empêche les nouvelles modifications de l’invité concerné. Les droits sont conservés lors d’une reconnexion normale du même poste.

Pour ouvrir un autre schéma, quitter ou terminer d’abord la session. Une ouverture locale ne doit pas remplacer le document partagé.

Pour tester le parcours de connexion, installer la version **0.2.3** sur les postes. La découverte utilise le réseau local IPv4 et UDP 4456 ; sur un VPN ou un réseau filtré, les options avancées permettent de rejoindre par adresse. La version 0.2.2 continue la recherche et les annonces après une erreur UDP ponctuelle liée à un port fermé ou à un paquet trop grand.

Un premier essai sur deux postes Windows 11 en Ethernet, IP fixes sur le même switch d'un établissement scolaire, confirme le fonctionnement de la session après saisie manuelle de l'adresse. Un nouvel essai en 0.2.2 confirme la découverte de l'hôte. L'utilisateur a ensuite signalé un bouton Rejoindre inactif ; la 0.2.3 explicite ses conditions d'activation, qui restent à retester sur ces postes.

Si un poste de secours a repris l’hébergement après une panne, il conserve la session à jour. Le poste initial qui reprend rejoint ce secours ; l’hébergement ne revient pas automatiquement chez lui. Cela évite qu’un ancien état remplace les modifications faites pendant son absence.

## Canevas et équipements à nombreux ports

Le format et l'orientation définissent des pages fixes à 100 %. Dépasser un bord ajoute des pages,
sans réduire le dessin ni déplacer les équipements. Les pointillés montrent la zone de dessin de
chaque page, hors marges, légende et cartouche. La touche F recadre sur toutes les pages.

À l'export : **Mettre à l'échelle sur une page** ou **Conserver sur plusieurs pages**. Le choix
ne change pas le canevas. Le total annoncé est une estimation ; le PDF utilise les dimensions
affichées et les tracés du routeur. La vue et la sélection sont restaurées après l'export.

Au-delà de 16 ports, les appareils montrent uniquement les ports reliés. **Ajouter une connexion**
permet de choisir **Entrées**, **Sorties** ou **Bidirectionnels**, puis révèle un port libre de cette
catégorie ; il faut ensuite tirer le câble depuis ou vers ce port. Seuls les ports du calque actif
sont proposés. Si une catégorie n'a plus de port libre, une autre est proposée automatiquement.
**Tous les ports** ouvre la vue complète ; **Ports reliés** la replie. Les renvois vers les autres
feuilles restent visibles. Ces actions d'affichage sont propres au poste et ne modifient pas les droits.

## Vérification avant fusion

Pour compléter les simulations par un essai sur trois ordinateurs :

1. Installer la même version sur les trois postes. Ouvrir une session sur l’hôte et faire rejoindre deux invités ; attribuer Audio au premier, Vidéo au second.
2. Utiliser un appareil comportant des ports audio et vidéo. Modifier puis ajouter un port de chaque domaine simultanément. Vérifier que les trois postes affichent les deux changements.
3. Annuler chez l’invité Audio : seul son changement doit disparaître. Vérifier aussi qu’il ne peut modifier ni le calque Vidéo ni la vue générale ; l’hôte doit pouvoir tout modifier.
4. Couper puis rétablir le réseau d’un invité et vérifier la reconnexion. Sur des copies de test, fermer brutalement l’hôte avec un secours activé, puis reprendre depuis le poste initial : il doit rejoindre le document du secours à jour.
5. Modifier le schéma sans enregistrer, puis rouvrir le fichier principal depuis une autre copie de l’application : il doit contenir la dernière version enregistrée manuellement. Ctrl+S / Cmd+S doit ensuite mettre ce fichier à jour.
6. Régler une rotation courte, attendre une copie de plus que le nombre conservé et vérifier le contenu de « Save Back Up ». Tester aussi un emplacement devenu inaccessible : l’erreur d’écriture doit garder le projet ouvert et non enregistré.

Les 212 tests TypeScript passent ; les types, le lint et la construction de l’interface passent aussi. Les tests comprennent la rotation, les homonymes, les pannes d’écriture, l’indicateur d’enregistrement, la fenêtre Infos, le parcours de session, la découverte dans l'interface, les conditions du bouton Rejoindre et des simulations à deux et trois instances : attribution puis retrait de droits, reconnexion, reprise du poste initial sur un secours actif, modification et ajout simultanés de ports, puis annulation individuelle. Les quatre avertissements de lint existaient déjà.

La CI de la PR vérifie les tests TypeScript et les tests natifs Windows et macOS, dont la découverte sur sockets locales. Deux régressions couvrent une recherche vers un port fermé suivie d'une réponse valide et la poursuite des annonces après un paquet trop grand. Le test de relais manuel reste ignoré, comme prévu. Les essais avec dialogues natifs, disques réels et trois ordinateurs restent à faire, notamment les pannes et reprises. Deux hôtes isolés par une coupure ne fusionnent pas automatiquement leurs documents : il faut conserver leurs fichiers avant une fusion manuelle.
