# Fiches de procédure AV Diagram

Une fiche par tâche courante. Les libellés entre guillemets sont ceux de l'interface française (`src/i18n/fr.json`) ; la ligne « Libellés » donne leurs clés. Le logiciel découpe ce fichier sur les titres de niveau 2.

## Créer un projet
Mots-clés : nouveau projet, nouveau fichier, démarrer, commencer un schéma, modèle de départ, projet vide, concert, plateau TV, conférence, format de feuille
But : créer un projet .avd dans son propre dossier, vide ou à partir d'un modèle.
Étapes :
1. Ouvre le menu « Fichier » et choisis « Nouveau ». À l'accueil, clique sur « Nouveau projet ».
2. Saisis le « Nom du projet ».
3. Sous « Créer le dossier du projet dans », clique sur « Choisir… » et sélectionne le dossier parent.
4. Choisis le « Format de la feuille » et l'orientation, « Paysage » ou « Portrait ».
5. Sous « Point de départ », choisis « Projet vide » ou un modèle : « Concert », « Plateau TV 3 caméras » ou « Salle de conférence ».
6. Clique sur « Créer le projet ».
Pièges : si le dossier existe déjà, un numéro est ajouté et un message indique le dossier réellement créé ; un modèle est un exemple à adapter au matériel réel.
Manuel : chapitre 2, « Créer et organiser un projet ».
Libellés : toolbar.menus.file, menu.new, start.new, newProject.name, newProject.location, storage.choose, newProject.format, exportPdf.landscape, exportPdf.portrait, newProject.start, newProject.blank.name, newProject.concert.name, newProject.tvStudio.name, newProject.conference.name, newProject.create

## Enregistrer un projet
Mots-clés : enregistrer, sauvegarder, sauver, save, enregistrer sous, copie du projet, fichier avd, Ctrl+S, Cmd+S
But : écrire le fichier principal .avd, ou en faire une copie ailleurs.
Étapes :
1. Appuie sur Ctrl+S (Cmd+S sur Mac), ou ouvre « Fichier » puis « Enregistrer ». Le bouton « Enregistrer » figure aussi parmi les raccourcis de la barre supérieure.
2. Pour une copie sous un autre nom ou dans un autre dossier : « Fichier » puis « Enregistrer sous… » (Ctrl+Maj+S, Cmd+Maj+S sur Mac).
3. Vérifie la barre du bas : « Fichier principal enregistré » remplace « Modifications non enregistrées ».
Pièges : les sauvegardes de sécurité automatiques ne remplacent pas le .avd ; si l'enregistrement échoue, essaie « Enregistrer sous… » vers un dossier local accessible.
Manuel : chapitre 3, « Enregistrer, sauvegarder et récupérer ».
Libellés : toolbar.menus.file, menu.save, menu.saveAs, status.saved, status.unsaved

## Ouvrir un projet
Mots-clés : ouvrir, charger, ouvrir un fichier, fichier avd, projet récent, reprendre, dernier projet, projet reçu d'un collègue, Ctrl+O
But : rouvrir un projet .avd existant.
Étapes :
1. Ouvre « Fichier » puis « Ouvrir… » (Ctrl+O, Cmd+O sur Mac), ou clique sur le raccourci « Ouvrir… » de la barre supérieure.
2. Sélectionne le fichier .avd et valide.
3. S'il reste des modifications non enregistrées dans le projet courant, choisis « Enregistrer », « Ne pas enregistrer » ou « Annuler ».
4. À l'accueil, tu peux aussi choisir « Reprendre le dernier projet », « Ouvrir un fichier » ou un projet de la liste « Projets récents sur cet appareil ».
Pièges : « Retirer de la liste » enlève seulement le raccourci, pas le fichier ; un fichier invalide affiche « Ce fichier n'est pas un projet AV Diagram valide (.avd). »
Manuel : chapitre 1, « Démarrer et se repérer ».
Libellés : toolbar.menus.file, menu.open, menu.save, storage.discard, series.cancel, start.last, start.file, start.recent, start.forget, menu.openError

## Retrouver une sauvegarde automatique
Mots-clés : sauvegarde automatique, copie de sécurité, backup, Save Back Up, récupérer, restaurer, ancienne version, plantage, crash, fichier perdu, intervalle de sauvegarde
But : rouvrir une copie de sécurité du projet sans écraser le fichier d'origine.
Étapes :
1. Ouvre « Outils » puis « Paramètres », onglet « Enregistrement (ce poste) ».
2. Dans « Sauvegardes de sécurité », lis le chemin de la dernière sauvegarde : c'est le dossier Save Back Up réellement utilisé, avec un sous-dossier par projet.
3. Ouvre « Fichier » puis « Ouvrir… » et choisis la copie voulue dans ce dossier.
4. Contrôle le contenu, puis « Fichier » et « Enregistrer sous… » pour la garder sous un nouveau nom.
5. Après un arrêt inattendu, l'accueil propose aussi « Reprendre le dernier projet ».
Pièges : aucune commande ne restaure directement une copie ni n'ouvre le dossier Save Back Up, il faut passer par « Ouvrir… » ; l'intervalle et le nombre de copies se règlent dans le même onglet (« Activer les sauvegardes de sécurité », « Toutes les », « Nombre gardé », « Sauvegarder maintenant »).
Manuel : chapitre 3, « Enregistrer, sauvegarder et récupérer ».
Libellés : toolbar.menus.tools, settings.title, settings.tabs.storage, storage.backupsTitle, toolbar.menus.file, menu.open, menu.saveAs, start.last, storage.backupsOn, storage.backupEvery, storage.backupCount, storage.backupNow

## Ajouter une feuille
Mots-clés : feuille, nouvelle feuille, onglet, page, planche, ajouter une page, séparer plateau et régie
But : ajouter une feuille logique au synoptique.
Étapes :
1. Dans la vue « Synoptique », repère les onglets de feuilles au-dessus du schéma.
2. Clique sur le petit bouton plus à droite des onglets (infobulle « Ajouter une feuille »).
3. La nouvelle feuille s'ouvre avec son nom en cours de saisie : tape le nom puis Entrée.
4. Clique sur un onglet pour passer d'une feuille à l'autre.
Pièges : la croix de l'onglet actif, « Supprimer cette feuille et son contenu », efface aussi son contenu (Ctrl+Z annule) ; une feuille peut s'étendre sur plusieurs pages papier.
Manuel : chapitre 2, « Créer et organiser un projet ».
Libellés : pages.synoptic, sheets.add, sheets.remove

## Renommer une feuille
Mots-clés : renommer, nom de feuille, changer le nom, onglet, titre de la feuille
But : changer le nom d'une feuille du synoptique.
Étapes :
1. Double-clique sur l'onglet de la feuille, au-dessus du schéma (infobulle « Double-clic pour renommer »).
2. Tape le nouveau nom, puis Entrée pour valider ou Échap pour annuler.
Pièges : impossible en mode présentation ; pour un sous-schéma, le nom se change aussi dans l'inspecteur, champ « Nom du groupe ».
Manuel : chapitre 2, « Créer et organiser un projet ».
Libellés : sheets.renameHint, groups.name

## Poser un équipement de la bibliothèque
Mots-clés : poser, placer, insérer, glisser, déposer, double-clic, ajouter un appareil, ajouter un micro, ajouter une console, bibliothèque, instance
But : placer un modèle de la bibliothèque sur le schéma.
Étapes :
1. Dans la « Bibliothèque » à gauche, choisis l'onglet « Bibliothèque générale » ou « Mon entreprise ».
2. Déplie un menu (« Audio », « Image », « Lumière », « Réseau », « Distribution », « Divers ») puis une famille, ou utilise la recherche.
3. Glisse le modèle sur le schéma, ou double-clique dessus (Entrée au clavier) : il est posé au centre de la vue, à côté des blocs existants.
4. Vérifie le « Nom », la « Zone » et les caractéristiques dans l'« Inspecteur ».
Pièges : avec un « Calque » actif, la bibliothèque générale masque les autres domaines, clique sur « Tout afficher » ; dans la vue « Plan », le double-clic pose l'appareil au centre du plan.
Manuel : chapitre 4, « Utiliser la bibliothèque ».
Libellés : library.title, company.general, company.company, library.domain.sound, library.domain.image, library.domain.light, library.domain.network, library.domain.distribution, library.domain.misc, inspector.name, inspector.zone, inspector.title, layers.label, library.layerShowAll, pages.plan

## Rechercher un modèle
Mots-clés : rechercher, chercher, trouver, recherche, référence, fabricant, marque, modèle, filtrer la bibliothèque
But : retrouver un modèle dans la bibliothèque par son nom, son fabricant ou sa référence.
Étapes :
1. Clique dans le champ de recherche en haut de la « Bibliothèque » (texte d'exemple « Console, stagebox, SDI… »).
2. Tape un nom, un fabricant, une référence ou une famille : les menus correspondants se déplient.
3. Glisse le modèle trouvé sur le schéma ou double-clique dessus.
4. Échap, ou la croix « Effacer la recherche (Échap) », vide le champ.
Pièges : « Aucun équipement ne correspond. » : vérifie l'onglet (« Mon entreprise » ne contient que tes modèles) et le calque actif (« Tout afficher ») ; Ctrl+K trouve aussi les équipements.
Manuel : chapitre 4, « Utiliser la bibliothèque ».
Libellés : library.title, library.search, library.clearSearch, library.empty, company.company, library.layerShowAll

## Créer un équipement générique
Mots-clés : nouveau bloc, équipement générique, bloc personnalisé, bloc vide, appareil absent de la bibliothèque, n'existe pas, modèle introuvable, matériel maison, DI maison, créer un appareil
But : créer un appareil absent de la bibliothèque en décrivant ses prises.
Étapes :
1. Sous la « Bibliothèque », clique sur « Nouveau bloc ».
2. Dans « Nouvel équipement générique », saisis le « Nom », puis choisis le « Menu » et la « Famille ».
3. Pour chaque groupe de prises, règle « Sens », « Signal », « Connecteur », « Niveau », « Nombre » et si besoin « Libellé ». « Ajouter un groupe de prises » ajoute une ligne.
4. Renseigne « Poids (kg) » et « Consommation (W) » seulement si tu les connais.
5. Clique sur « Créer et poser » : le bloc est posé et rangé dans l'onglet « Mon entreprise ».
6. Variante : « Bloc vide (mode Expert) » pose un bloc sans prise ; ajoute ensuite les ports avec « Ajouter un port » dans l'inspecteur.
Pièges : il faut au moins une prise et au plus 256 ; ne saisis aucune caractéristique supposée.
Manuel : chapitre 4, « Utiliser la bibliothèque ».
Libellés : library.title, library.newBlock, generic.title, generic.name, generic.domain, generic.family, generic.direction, generic.signal, generic.connector, generic.level, generic.count, generic.label, generic.addGroup, generic.weight, generic.power, generic.create, company.company, generic.blank, ports.add

## Enregistrer un modèle dans Mon entreprise
Mots-clés : modèle perso, mes modèles, mon entreprise, réutiliser un appareil, sauvegarder un bloc, gabarit, template, parc, quantité possédée
But : réutiliser un équipement personnalisé dans d'autres projets.
Étapes :
1. Passe en mode « Expert ».
2. Sélectionne l'équipement et ajuste ses ports dans l'« Inspecteur ».
3. Clique sur « Enregistrer comme modèle » : le bouton affiche « Modèle enregistré ».
4. Retrouve-le dans l'onglet « Mon entreprise » de la bibliothèque ; renseigne si besoin « Quantité totale du parc ».
5. L'icône corbeille « Retirer de mes modèles » l'enlève de la liste.
Pièges : le bouton reste grisé si l'appareil n'a ni port ni slot ; à la réutilisation, vérifie adresses IP et cartes.
Manuel : chapitre 4, « Utiliser la bibliothèque ».
Libellés : mode.expert, inspector.title, inspector.saveTemplate, inspector.templateSaved, company.company, catalogue.quantity, library.removeMine

## Créer une zone
Mots-clés : zone, secteur, cadre de zone, salle, scène, régie, plateau, emplacement, code de zone, préfixe des câbles
But : délimiter une partie du projet (scène, régie...) dont le code préfixe les numéros de câbles.
Étapes :
1. Dans la vue « Synoptique », clique sur « Zone » au-dessus du schéma, à droite des onglets de feuilles. Un cadre lié à une nouvelle zone apparaît au centre de la vue.
2. Double-clique sur le titre du cadre pour le renommer (Entrée valide, Échap annule).
3. Sélectionne le cadre : dans l'« Inspecteur », le champ « Code » règle le code de zone.
4. Redimensionne ou déplace le cadre, puis glisse les blocs dedans : ils prennent la zone.
5. Autre chemin : « Outils », « Paramètres », onglet « Projet », section « Zones » : saisis le nom (« Nouvelle zone ») et le code, puis « Ajouter ».
Pièges : le code compte 2 à 6 lettres ou chiffres ; « Zone délimitée » réglé sur « Aucune (simple cadre) » transforme le cadre en simple décor ; vérifie les numéros de câbles après un changement de zone.
Manuel : chapitre 2, « Créer et organiser un projet ».
Libellés : pages.synoptic, annotations.zoneTool, inspector.title, settings.zoneCode, toolbar.menus.tools, settings.title, settings.tabs.project, settings.zones, settings.newZoneName, settings.addZone, annotations.zone, annotations.zoneNone

## Affecter un équipement à une zone
Mots-clés : affecter, attribuer, associer, rattacher, mettre dans une zone, changer de zone, zone d'un appareil, zone d'une console, retirer d'une zone
But : rattacher un équipement à une zone du projet.
Étapes :
1. Sélectionne l'équipement sur le schéma.
2. Dans l'« Inspecteur », choisis la zone dans le menu « Zone » ; « Aucune zone » la retire.
3. Autre geste : déplace le bloc à l'intérieur du cadre de la zone ; le sortir du cadre le retire de la zone.
Pièges : menu vide, crée d'abord une zone (fiche Créer une zone) ; les numéros de câbles suivent le code de zone, en mode « Expert » le bouton « Renuméroter » de l'onglet « Câblage » les recalcule.
Manuel : chapitre 2, « Créer et organiser un projet ».
Libellés : inspector.title, inspector.zone, inspector.noZone, mode.expert, dock.renumber, dock.cables

## Déplacer un équipement vers une autre feuille
Mots-clés : déplacer, changer de feuille, transférer, mettre sur une autre feuille, renvoi, autre page
But : faire passer un équipement d'une feuille à une autre sans perdre ses liaisons.
Étapes :
1. Sélectionne l'équipement.
2. Dans l'« Inspecteur », choisis la feuille de destination dans le menu « Feuille » (présent dès que le projet a plusieurs feuilles).
3. La vue bascule sur cette feuille, l'équipement sélectionné.
Pièges : l'identité et les connexions sont conservées ; les câbles qui changent de feuille sont dessinés comme des renvois.
Manuel : chapitre 2, « Créer et organiser un projet ».
Libellés : inspector.title, sheets.sheet

## Dupliquer, pivoter ou supprimer un équipement
Mots-clés : dupliquer, copier, copier-coller, cloner, exemplaire, pivoter, tourner, rotation, retourner, supprimer, effacer, enlever un appareil
But : copier, faire tourner ou retirer les équipements sélectionnés.
Étapes :
1. Sélectionne un ou plusieurs équipements (Maj ou Ctrl avec un clic, ou cadre de sélection dans le vide).
2. Dupliquer : Ctrl+D (Cmd+D), clic droit puis « Dupliquer », ou bouton « Dupliquer » de l'« Inspecteur ».
3. Pivoter : R pour un quart de tour horaire, Maj+R dans l'autre sens, clic droit puis « Pivoter d'un quart de tour », ou les flèches de « Orientation » dans l'inspecteur.
4. Supprimer : touche Suppr (ou Retour arrière), clic droit puis « Supprimer », ou bouton « Supprimer » de l'inspecteur.
Pièges : supprimer un appareil supprime aussi ses liaisons (Ctrl+Z annule) ; une copie ne reprend pas l'adresse IP.
Manuel : chapitre 5, « Dessiner et manipuler les équipements ».
Libellés : canvasMenu.duplicate, inspector.duplicate, inspector.title, canvasMenu.rotate, inspector.orientation, canvasMenu.delete, inspector.delete

## Grouper des équipements en sous-schéma
Mots-clés : grouper, regrouper, groupe, sous-schéma, sous-feuille, dégrouper, dissoudre, Ctrl+G
But : rassembler plusieurs équipements dans un bloc qui s'ouvre comme une feuille.
Étapes :
1. Sélectionne plusieurs équipements.
2. Ctrl+G (Cmd+G), ou « Édition » puis « Grouper la sélection », ou le même choix au clic droit ou dans l'inspecteur.
3. Double-clique sur le bloc du groupe, ou « Ouvrir » dans l'inspecteur, pour travailler à l'intérieur ; la flèche à gauche des onglets, « Remonter à la feuille parente », te ramène au niveau supérieur.
4. Pour défaire : sélectionne le groupe, puis Ctrl+Maj+G ou « Édition » et « Dissoudre le groupe ».
Pièges : grouper fonctionne seulement dans la vue « Synoptique ».
Manuel : chapitre 5, « Dessiner et manipuler les équipements ».
Libellés : toolbar.menus.edit, groups.group, groups.open, groups.parent, groups.ungroup, pages.synoptic

## Relier deux prises
Mots-clés : relier, connecter, brancher, câbler, raccorder, liaison, câble, tirer un fil, connexion, patcher, relier une sortie à une entrée, micro vers console
But : créer une liaison entre une sortie et une entrée.
Étapes :
1. Repère les points de port sur les blocs : sorties à droite, entrées à gauche (selon l'orientation). Survole un port pour voir son signal, son niveau et son connecteur.
2. Clique sur le point d'une sortie, tire jusqu'au point d'une entrée de l'autre bloc et relâche. Les ports compatibles sont mis en évidence pendant le geste.
3. Si la fenêtre « Liaison à vérifier » s'ouvre, choisis « Annuler la liaison », « Garder » ou « Garder et ne plus signaler dans ce schéma ».
4. Clique ensuite sur la liaison pour la renseigner dans l'inspecteur (câble, longueur).
Pièges : port invisible, l'appareil est peut-être replié, utilise « Tous les ports » ou le bouton « Ajouter une connexion » (fiche Replier les prises) ; vérifie aussi le « Calque » ; l'absence d'alerte ne prouve pas la compatibilité réelle.
Manuel : chapitre 7, « Relier et contrôler le câblage ».
Libellés : linkCheck.title, linkCheck.cancel, linkCheck.keep, linkCheck.keepIgnore, portDisplay.all, portDisplay.add_other, layers.label

## Supprimer une liaison
Mots-clés : supprimer une liaison, débrancher, déconnecter, enlever un câble, effacer un câble, retirer une connexion
But : retirer une liaison du schéma.
Étapes :
1. Clique sur la liaison pour la sélectionner (ou sur sa ligne dans l'onglet « Câblage » du panneau du bas).
2. Appuie sur Suppr (ou Retour arrière), ou clic droit puis « Supprimer », ou bouton « Supprimer » en bas de l'inspecteur.
3. Ctrl+Z (Cmd+Z) annule la suppression.
Pièges : en session collaborative, une liaison protégée par les droits d'un autre métier ne peut pas être supprimée ; dans les vues « Intercom » et « Synchronisation », cliquer sur une case active de la matrice retire aussi la liaison.
Manuel : chapitre 7, « Relier et contrôler le câblage ».
Libellés : dock.cables, canvasMenu.delete, inspector.delete, pages.intercom, pages.sync

## Choisir un câble
Mots-clés : câble, type de câble, choisir le câble, référence câble, longueur, cordon, XLR, RJ45, BNC, catalogue de câbles, métrage
But : associer un câble du catalogue et une longueur à une liaison.
Étapes :
1. Clique sur la liaison.
2. Dans l'« Inspecteur », ouvre le menu « Câble » : en tête « Compatibles avec ces connecteurs », puis « Autres câbles du catalogue » ; « Aucun (connecteurs directs) » s'il n'y a pas de câble.
3. Saisis la « Longueur (m) » ou clique sur une longueur proposée sous le champ.
4. En mode « Expert », complète « Référence câble » et « Notes ».
5. Le récapitulatif « Câbles à préparer » se trouve dans l'onglet « Nomenclature » du panneau du bas.
Pièges : le menu « Câble » disparaît quand la liaison passe dans un multipaire, le modèle se règle alors dans l'onglet « Multipaires » ; aucune longueur n'est déduite automatiquement.
Manuel : chapitre 7, « Relier et contrôler le câblage ».
Libellés : inspector.title, inspector.cable, inspector.cableFitting, inspector.cableOthers, inspector.cableNone, inspector.length, mode.expert, inspector.cableRef, inspector.notes, dock.cableType, dock.bom, dock.multicores

## Créer un multipaire
Mots-clés : multipaire, multi, snake, câble multipaire, multicore, regrouper des liaisons, paires, fibre tactique, liaison scène régie
But : faire passer plusieurs liaisons dans un même câble physique.
Étapes :
1. Sélectionne les liaisons concernées sur le schéma (Maj + clic sur chacune, ou cadre de sélection).
2. Dans l'« Inspecteur », ouvre le menu proposant de faire passer les liaisons dans un multipaire et choisis « Nouveau multipaire » ou un multipaire existant. Même choix au clic droit sur la sélection.
3. Les liaisons prennent les premières paires libres et l'affichage passe sur « Multi » (un seul trait).
4. Dans le panneau du bas, onglet « Multipaires », règle « Modèle », « Paires », « Connecteurs » et « Longueur ». Le bouton « Nouveau multipaire » y crée aussi un multipaire vide.
5. Pour une seule liaison : menus « Multipaire » puis « Paire » de l'inspecteur.
Pièges : un multipaire est un câble, pas un bloc (les stageboxes sont dans la bibliothèque) ; « Câbles » et « Multi » changent seulement l'affichage ; clic droit, « Sortir la liaison du multipaire ».
Manuel : chapitre 7, « Relier et contrôler le câblage ».
Libellés : inspector.title, inspector.multicoreNew, linkView.cables, dock.multicores, dock.multicoreType, dock.pairs, dock.multicoreConnectors, dock.length, dock.multicoreNew, inspector.multicore, inspector.pair, linkView.flows, canvasMenu.leaveMulticore_one

## Relier en série
Mots-clés : relier en série, câbler plusieurs appareils, relier tous les micros, brancher à la suite, connexion en masse, patch automatique
But : relier d'un coup les sorties de plusieurs équipements aux entrées libres d'une destination.
Étapes :
1. Sélectionne les équipements sources (Maj + clic ou cadre), par exemple tous les micros.
2. Clic droit sur la sélection puis « Relier en série… », ou bouton « Relier en série… » de l'inspecteur.
3. Dans la fenêtre « Relier en série », choisis la « Destination » (menu « Choisir… »), le « Signal » et « À partir de l'entrée » (« Première entrée libre » par défaut).
4. Contrôle le tableau « Sortie » vers « Entrée » : les sources sont prises de haut en bas sur le schéma.
5. Coche si besoin la case du multipaire, puis clique sur le bouton de création en bas, qui indique le nombre de liaisons.
Pièges : une sortie sans entrée libre n'est pas reliée (un message le signale) ; contrôle l'ordre avant de valider ; Ctrl+Z annule.
Manuel : chapitre 7, « Relier et contrôler le câblage ».
Libellés : series.menu, series.title, series.dest, series.choose, series.family, series.start, series.firstFree, series.from, series.to

## Changer de calque
Mots-clés : calque, filtrer par calque, filtre, layer, domaine, métier, afficher seulement l'audio, masquer la vidéo, filtre de signaux
But : n'afficher qu'un domaine ou qu'une famille de signaux.
Étapes :
1. Au-dessus du schéma, ouvre le menu « Calque » et choisis « Audio », « Image », « Lumière », « Réseau », « Distribution » ou « Tous ».
2. Le schéma et la bibliothèque générale se limitent à ce domaine ; « Tout afficher » élargit la bibliothèque, « Afficher tous les calques » revient à tout voir.
3. Pour filtrer par signal, utilise les boutons de famille à droite du menu (groupe « Signaux affichés ») ; raccourcis Alt+1 audio, Alt+2 vidéo, Alt+3 réseau et synchro, Alt+0 tout.
4. Le menu « Calque » existe aussi en haut des vues techniques (« Réseau », « Électricité »...).
Pièges : le calque est propre à ce poste et ne copie pas les appareils ; en collaboration, la vue « Tous » peut rester en lecture seule.
Manuel : chapitre 8, « Calques et travail collaboratif en LAN ».
Libellés : layers.label, library.domain.sound, library.domain.image, library.domain.light, library.domain.network, library.domain.distribution, layers.all, library.layerShowAll, layers.showAll, filters.label, pages.network, pages.power

## Ajouter une note
Mots-clés : note, texte, commentaire, annotation, étiquette, mémo, écrire sur le schéma, cadre
But : poser un texte libre sur le schéma.
Étapes :
1. Dans la vue « Synoptique », clique sur « Note » au-dessus du schéma : une note apparaît au centre de la vue.
2. Double-clique dessus pour écrire ; Ctrl+Entrée valide.
3. Note sélectionnée, choisis sa « Couleur » dans l'inspecteur ; « Supprimer » l'efface.
4. Pour un simple cadre, clique sur « Zone » puis règle « Zone délimitée » sur « Aucune (simple cadre) ».
Pièges : le champ « Notes » d'un équipement (visible en mode « Expert ») est différent d'une note du schéma.
Manuel : chapitre 5, « Dessiner et manipuler les équipements ».
Libellés : pages.synoptic, annotations.note, annotations.color, inspector.delete, annotations.zoneTool, annotations.zone, annotations.zoneNone, inspector.notes, mode.expert

## Replier les prises
Mots-clés : replier, déplier, masquer les ports, cacher les ports, ports inutilisés, prises libres, prises visibles, ports reliés, tous les ports, compacter, bloc trop grand, bloc énorme, stagebox, port caché, port introuvable
But : n'afficher que les prises reliées d'un appareil, ou toutes ses prises.
Étapes :
1. Sélectionne l'appareil : sur le bloc apparaît « Tous les ports » ou « Ports reliés » ; clique pour basculer.
2. Pour mémoriser le choix, dans l'inspecteur, menu « Prises visibles sur le schéma » : « Automatique : replier au-delà de 16 prises », « Tous les ports » ou « Ports reliés ».
3. Sur un appareil replié, clique sur le bouton « Ajouter une connexion » (suivi du nombre de prises libres), choisis « Entrées », « Sorties » ou « Bidirectionnels », puis le port dans « Choisir un port libre ».
4. Tire le câble depuis ce port ; « Masquer ce port » annule l'affichage temporaire.
Pièges : replier ne supprime ni port ni câble ; les listes gardent toutes les prises.
Manuel : chapitre 6, « Replier les prises d'un appareil ».
Libellés : portDisplay.all, portDisplay.fold, portDisplay.title, portDisplay.auto, portDisplay.add_other, portDisplay.inputs, portDisplay.outputs, portDisplay.bidir, portDisplay.choose, portDisplay.cancel

## Annuler ou rétablir
Mots-clés : annuler, défaire, revenir en arrière, undo, rétablir, refaire, redo, Ctrl+Z, erreur
But : défaire ou refaire la dernière modification.
Étapes :
1. Annuler : Ctrl+Z (Cmd+Z), ou « Édition » puis « Annuler », ou le raccourci « Annuler » de la barre supérieure.
2. Rétablir : Ctrl+Maj+Z ou Ctrl+Y (Cmd+Maj+Z), ou « Édition » puis « Rétablir ».
Pièges : en session collaborative, « Annuler (Ctrl+Z) ne défait que tes propres modifications. » ; un import ou un « Appliquer » de l'assistant s'annule en une seule étape.
Manuel : chapitre 19, « Raccourcis essentiels ».
Libellés : toolbar.menus.edit, menu.undo, menu.redo, collab.undoHint, ai.apply

## Exporter en PDF
Mots-clés : PDF, exporter, planche, export PDF, cartouche, filigrane, protéger, mot de passe, A3, A4, format papier, pages
But : produire une planche PDF du synoptique.
Étapes :
1. Ouvre « Fichier » puis « Planche PDF (A4 à A0, filigrane)... » (entrée précédée de « Exporter »), ou le raccourci PDF de la barre supérieure.
2. Dans « Exporter la planche PDF », parcours les onglets « Cartouche », « Mise en page », « Filigrane » et « Protection ».
3. Dans « Mise en page », choisis « Format », « Orientation », puis « Conserver sur plusieurs pages » ou « Mettre à l’échelle sur une page ».
4. Coche si besoin « Filigrane présent » ou « Protéger le PDF (chiffrement AES-256) ».
5. Clique sur « Exporter » et choisis l'emplacement.
Pièges : ouvre le PDF dans un lecteur avant diffusion ; trop de pages, cherche un bloc ou une note éloignés ; les vues « Baies » et « Plan » ont leurs boutons « Exporter les baies en PDF » et « Exporter le plan en PDF ».
Manuel : chapitre 17, « Papier, PDF, images et DXF ».
Libellés : toolbar.menus.file, menu.exportPdf, menu.export, exportPdf.title, exportPdf.tabs.titleBlock, exportPdf.tabs.layout, exportPdf.tabs.watermark, exportPdf.tabs.protection, exportPdf.format, exportPdf.orientation, exportPdf.mode.tile, exportPdf.mode.fit, exportPdf.watermarkEnable, exportPdf.protect, exportPdf.export, pages.rack, pages.plan, racks.export, plan.export

## Exporter la liste de câblage en Excel
Mots-clés : Excel, xlsx, tableur, liste de câblage, liste de câbles, patch, nomenclature, CSV, exporter les listes, tableau
But : obtenir les listes du projet dans un classeur.
Étapes :
1. Ouvre « Fichier » puis « Exporter les listes Excel » (entrée précédée de « Exporter »).
2. Choisis l'emplacement : le .xlsx contient plusieurs feuilles, dont « Câblage », « Patch » et « Nomenclature ».
3. Pour un simple fichier texte, choisis plutôt « Liste de câblage (CSV) » dans le même menu.
4. Les vues techniques, dont « Listes », ont aussi des boutons d'export en haut à droite.
Pièges : une case vide signifie une information inconnue ; pour réimporter un patch, garde les colonnes d'identifiants masquées.
Manuel : chapitre 14, « Listes, Excel et import de patch ».
Libellés : toolbar.menus.file, xlsx.export, menu.export, xlsx.cables, xlsx.patch, xlsx.bom, menu.exportCsv, pages.lists

## Importer un patch Excel
Mots-clés : importer un patch, patch Excel, import xlsx, liste de patch, câbler depuis Excel, tableur, réimporter
But : créer ou modifier des liaisons à partir d'un classeur.
Étapes :
1. Exporte d'abord avec « Exporter les listes Excel », puis remplis la feuille « Patch » : « Équipement source », « Port source », « Équipement destination », « Port destination ».
2. Ouvre « Fichier » puis « Importer un patch Excel » (même bouton dans la vue « Listes ») et choisis le fichier.
3. Choisis la « Feuille à lire » et lis l'aperçu : chaque erreur indique sa ligne.
4. Si des avertissements apparaissent, coche « J’ai vérifié les avertissements de compatibilité. », puis clique sur « Appliquer le patch ».
Pièges : une seule erreur bloque tout le lot ; remplace les formules par des valeurs ; en collaboration, il faut le rôle Hôte ou « Droits complets ».
Manuel : chapitre 14, « Listes, Excel et import de patch ».
Libellés : xlsx.export, xlsx.patch, xlsx.columns.sourceEquipment, xlsx.columns.sourcePort, xlsx.columns.targetEquipment, xlsx.columns.targetPort, toolbar.menus.file, xlsx.importMenu, pages.lists, xlsx.sheet, xlsx.acceptWarnings, xlsx.apply, collab.layers.full

## Importer un catalogue d'équipements
Mots-clés : catalogue, importer un catalogue, Mon entreprise, parc, inventaire, stock, liste de matériel, CSV, Excel, Booqable, loueur
But : ajouter le parc de l'entreprise à l'onglet « Mon entreprise ».
Étapes :
1. Ouvre « Fichier » puis « Importer un catalogue d’équipements… », ou le même bouton sous la « Bibliothèque ».
2. Choisis un fichier CSV ou .xlsx dont la première ligne contient les en-têtes.
3. Choisis la « Feuille à lire », puis les colonnes « Fabricant », « Modèle / désignation » et éventuellement « Quantité totale du parc ».
4. Règle la « Famille des nouveaux modèles », corrige une « Famille » ligne par ligne, décoche « Inclure » pour exclure ; « Précédent » et « Suivant » parcourent l'aperçu.
5. Pour les fiches sans connectique, coche « Ajouter aussi les fiches sans prises documentées. Je compléterai leur connectique avant de les relier. »
6. Clique sur « Ajouter à Mon entreprise ».
Pièges : l'import reste sur ce poste ; une ligne par modèle quand il y a une quantité.
Manuel : chapitre 4, « Utiliser la bibliothèque ».
Libellés : toolbar.menus.file, catalogue.title, library.title, xlsx.sheet, catalogue.manufacturer, catalogue.model, catalogue.quantity, catalogue.defaultFamily, catalogue.family, catalogue.include, catalogue.previous, catalogue.next, catalogue.acceptPending, catalogue.apply, company.company

## Préparer une baie
Mots-clés : baie, rack, 19 pouces, monter, unité, U, face avant, face arrière, élévation, armoire
But : monter les équipements du projet dans une baie 19 pouces.
Étapes :
1. Clique sur « Baies » dans la barre des vues, puis sur « Ajouter une baie ».
2. Dans la carte de la baie, renomme-la, choisis la « Hauteur de la baie », puis renseigne dans « Contraintes de la baie » la « Profondeur utile (mm) » et la « Charge maximale (kg) ».
3. Pour chaque appareil, renseigne « Hauteur (U) » et « Profondeur de l’appareil (mm) » dans l'inspecteur : il apparaît dans « À monter ».
4. Glisse-le vers la baie, ou remplis « Équipement », « Nom de la baie », « Face de montage » (« Avant » ou « Arrière ») et « Unité basse (U) », puis clique sur « Monter / déplacer ».
5. Clique sur « Exporter les baies en PDF » pour les élévations.
Pièges : les U se comptent depuis le bas ; « Retirer de la baie » ne supprime pas l'appareil ; les cartes se gèrent dans « Cartes et emplacements ».
Manuel : chapitre 9, « Organiser les baies ».
Libellés : pages.rack, racks.add, racks.height, racks.limits, racks.depth, racks.maxWeight, inspector.rackU, racks.equipmentDepth, racks.pending, racks.equipment, racks.name, racks.faceLabel, racks.face.front, racks.face.rear, racks.unit, racks.mount, racks.export, racks.unmount, modules.title

## Préparer le plan d'implantation
Mots-clés : plan, plan d'implantation, implantation, plan de salle, position, mètres, échelle, fond DXF, mesurer, distance
But : placer les équipements du projet sur un plan métrique.
Étapes :
1. Clique sur « Plan », puis règle « Largeur du plan (m) », « Hauteur du plan (m) », « Aimantation (m) » et « Échelle PDF 1: ».
2. Facultatif : « Importer un fond DXF ».
3. Choisis un appareil dans « Équipement à placer » (« Choisir un équipement… »), puis clique dans le plan ou sur « Placer au centre ».
4. Ajuste dans l'inspecteur « Position X (m) », « Position Y (m) », « Orientation (°) », « Largeur réelle (m) » et « Profondeur réelle (m) ».
5. « Mesurer » puis deux clics donnent une distance droite.
6. Clique sur « Exporter le plan en PDF ».
Pièges : glisser un modèle depuis la bibliothèque crée un nouvel appareil ; « Retirer du plan » garde l'appareil ; une mesure n'est pas une longueur de câble.
Manuel : chapitre 10, « Préparer le plan d'implantation ».
Libellés : pages.plan, plan.width, plan.height, plan.grid, plan.scale, plan.background, plan.pending, plan.choose, plan.placeCenter, plan.x, plan.y, plan.angle, plan.footprintWidth, plan.footprintDepth, plan.measure, plan.export, plan.unplace

## Faire le bilan électrique
Mots-clés : bilan électrique, électricité, puissance, consommation, circuit, phase, triphasé, monophasé, ampères, courant, calibre, alimentation
But : répartir les charges sur des circuits et lire les courants connus.
Étapes :
1. Clique sur « Électricité » dans la barre des vues.
2. Saisis le « Nom du circuit », choisis « Monophasé » ou « Triphasé », puis « Ajouter un circuit ».
3. Dans la carte du circuit, renseigne « Tension phase-neutre (V) » et « Calibre par phase (A) ».
4. Dans le tableau, pour chaque appareil : « Puissance absorbée du châssis (W) », « Facteur de puissance (0,001–1) », « Circuit » et « Phase » (L1, L2, L3 ou « L1 + L2 + L3 équilibrées »).
5. Lis les courants par phase ; « Données incomplètes » ou « Calibre dépassé » signalent un problème.
Pièges : aucun foisonnement automatique et pas de dimensionnement des protections ; en collaboration, les circuits demandent « Droits complets » ou le rôle Hôte.
Manuel : chapitre 12, « Préparer les bilans électriques ».
Libellés : pages.power, engineering.circuitName, engineering.single, engineering.three, engineering.addCircuit, engineering.voltage, engineering.rated, engineering.powerW, engineering.factor, engineering.circuit, engineering.phase, engineering.balanced, engineering.incomplete, engineering.overload, collab.layers.full

## Travailler à plusieurs en LAN
Mots-clés : collaboration, session collaborative, travail à plusieurs, réseau local, LAN, héberger, rejoindre, invité, hôte, code de session, partager le projet
But : modifier le même projet depuis plusieurs postes du réseau local.
Étapes :
1. Hôte : ouvre le projet, puis « Outils » et « Session Collaborative » (aussi sur l'accueil).
2. Renseigne « Ton nom (vu par les autres) », onglet « Héberger », puis « Ouvrir la salle d’attente » ; communique le « Code de session ».
3. Dans « Droits par métier », coche les métiers de chaque invité ou « Droits complets », puis « Commencer la session ».
4. Invité : « Session Collaborative », ton nom, onglet « Rejoindre », choisis l'hôte dans « Hôtes disponibles », saisis le code, puis « Rejoindre ». Sinon « Options avancées » et « Adresse de l'hôte ».
5. Fin : « Terminer la session » (hôte) ou « Quitter la session » (invité).
Pièges : même version sur tous les postes ; autoriser le pare-feu du réseau privé ; le projet de la session remplace celui ouvert chez l'invité.
Manuel : chapitre 8, « Calques et travail collaboratif en LAN ».
Libellés : toolbar.menus.tools, collab.title, collab.name, collab.host, collab.start, collab.code, collab.layers.title, collab.layers.full, collab.lobby.begin, collab.join, collab.discovery.title, collab.joinAction, collab.advanced, collab.address, collab.stop, collab.leave

## Configurer l'assistant IA
Mots-clés : assistant IA, configurer l'IA, installer l'IA, IA locale, Qwen, clé API, Claude, ChatGPT, Gemini, Mistral, activer l'assistant, bouton grisé
But : activer l'assistant avec une IA locale ou une IA externe.
Étapes :
1. Ouvre « Outils » puis « Installer / configurer l’IA » (ou « Paramètres », onglet « Assistant IA »).
2. Choisis « IA locale » ou « IA externe via API ».
3. IA locale : choisis le modèle et le « Dossier d’installation des modèles », puis « Télécharger le modèle », « Charger et tester » et « Activer l’IA locale ».
4. IA externe : suis les étapes « Fournisseur », « Créer la clé » (« Ouvrir la console »), « Coller la clé » (« Clé API », « Enregistrer dans le trousseau »), « Tester la connexion », « Modèle » et « Test » (« Lancer le test ») ; coche l'accord d'envoi des données, puis « Terminer ».
Pièges : le bouton « Assistant IA » reste grisé tant que l'assistant n'est pas activé ; un abonnement de discussion ne donne pas de clé API ; « Désactiver l'assistant » le coupe.
Manuel : chapitre 21, « Installer et utiliser l’assistant IA ».
Libellés : toolbar.menus.tools, ai.configure, settings.title, settings.tabs.ai, ai.setup.local, ai.setup.account, ai.local.directory, ai.local.download, ai.local.test, ai.local.enable, ai.setup.step.provider, ai.setup.step.create, ai.setup.openConsole, ai.setup.step.key, ai.setup.key, ai.setup.saveKey, ai.setup.step.connect, ai.setup.step.model, ai.setup.step.test, ai.setup.runTest, ai.setup.finish, ai.title, ai.setup.disable

## Utiliser l'assistant IA
Mots-clés : assistant, IA, chat, poser une question, proposition, appliquer, refuser, générer un schéma, demander à l'IA
But : demander une proposition à l'assistant et l'appliquer.
Étapes :
1. Clique sur « Assistant IA » à droite de la barre supérieure : le chat remplace l'inspecteur.
2. Au-dessus du chat, « Matériel autorisé pour l’IA » : « Mon entreprise uniquement » ou « Tous les modèles, priorité à mon entreprise ».
3. Tape ta demande, puis Entrée ou « Envoyer » (Maj+Entrée pour aller à la ligne).
4. Les ajouts proposés s'affichent en pointillés : vérifie-les, puis « Appliquer » ou « Refuser ».
5. « Arrêter » interrompt une réponse ; « Nouvelle conversation » repart de zéro.
Pièges : « Appliquer » s'annule par Ctrl+Z ; changer le matériel autorisé efface la conversation ; si le schéma a changé, redemande une proposition.
Manuel : chapitre 21, « Installer et utiliser l’assistant IA ».
Libellés : ai.title, company.aiScope, company.onlyAi, company.allAi, ai.send, ai.apply, ai.discard, ai.stop, ai.clear

## Passer en mode débutant ou expert
Mots-clés : mode débutant, mode expert, changer de mode, options avancées, plus de propriétés, éditeur de ports, interface simplifiée
But : choisir le niveau de détail de l'interface.
Étapes :
1. Ouvre « Affichage » puis « Changer de mode (débutant / expert) » : l'entrée affiche le mode actuel, « Débutant » ou « Expert », et bascule à chaque clic.
2. Autre chemin : « Outils », « Paramètres », onglet « Interface (ce poste) », menu « Mode d’utilisation ».
3. Le mode « Expert » ajoute l'éditeur de ports, « Notes », « Puissance (W) », « Poids (kg) » et « Enregistrer comme modèle » ; le mode « Débutant » affiche le panneau « Pas à pas ».
Pièges : les deux modes ouvrent le même projet ; « Bloc vide (mode Expert) » et « Compléter les connexions » passent seuls en mode « Expert ».
Manuel : chapitre 1, « Démarrer et se repérer ».
Libellés : toolbar.menus.view, palette.toggleMode, mode.beginner, mode.expert, toolbar.menus.tools, settings.title, settings.tabs.interface, toolbar.mode, inspector.notes, inspector.power, inspector.weight, inspector.saveTemplate, guide.title, generic.blank, inspector.completePorts

## Rechercher une commande
Mots-clés : commande, recherche de commande, palette, Ctrl+K, trouver un menu, raccourci, je ne trouve pas
But : lancer une commande ou poser un équipement en tapant son nom.
Étapes :
1. Appuie sur Ctrl+K (Cmd+K), ou clique sur « Rechercher, commande » dans la barre supérieure.
2. Tape quelques lettres dans « Tape une commande ou un équipement ».
3. Choisis avec les flèches puis Entrée, ou clique. Exemples : « Ajuster la vue », « Renuméroter les câbles », « Aller aux alertes », « Réglages du projet ».
Pièges : si rien ne correspond, « Aucun résultat » s'affiche ; Échap ferme la recherche.
Manuel : chapitre 19, « Raccourcis essentiels ».
Libellés : menu.search, palette.placeholder, palette.fit, palette.renumber, palette.issues, palette.settings, palette.none

## Ouvrir le manuel
Mots-clés : manuel, aide, documentation, mode d'emploi, notice, guide, PDF du manuel
But : consulter le manuel utilisateur hors connexion.
Étapes :
1. Ouvre le menu « Aide » puis « Manuel utilisateur ».
2. Pour en garder une copie, clique sur « Enregistrer le manuel PDF ».
3. « Fermer » ou Échap referme la fenêtre.
Pièges : le manuel est embarqué et ne demande pas Internet.
Manuel : chapitre 1, « Démarrer et se repérer ».
Libellés : toolbar.menus.help, manual.title, manual.download, settings.close

## Imprimer le schéma
Mots-clés : imprimer, impression, imprimante, tirage papier, print, sortir sur papier
But : obtenir un tirage papier du schéma.
Étapes :
1. Procédure non trouvée dans le code : AV Diagram n'a pas de commande d'impression directe.
2. Exporte un PDF (fiche Exporter en PDF), puis imprime-le depuis ton lecteur PDF.
Pièges : pour respecter une échelle, désactive dans le lecteur l'option qui ajuste au papier, puis contrôle une mesure sur le tirage.
Manuel : chapitre 17, « Papier, PDF, images et DXF ».
Libellés :
