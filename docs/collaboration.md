# Collaboration à plusieurs sur un même projet (2026-10-16)

## Besoin

Pendant la préparation d'une prestation, une personne dessine le synoptique audio, une autre le
synoptique vidéo, sur le même projet et en même temps. Chacun voit son calque (fait : calques par
domaine, propres à chaque poste). Les éléments partagés restent liés : une caméra avec des entrées
audio apparaît aussi dans le calque Audio, avec un rappel « connexion à prévoir » (fait).

## Recommandation : session sur le réseau local, fusion de fichiers en secours

Un poste (en général celui de la régie ou du chef de projet) **ouvre une session** ; les autres la
**rejoignent** sur le même réseau (réseau de la presta, Wi-Fi du bureau, VPN de l'entreprise).

Pourquoi ce choix :
- **Philosophie du projet respectée** : aucune donnée ne sort des postes, pas de compte, pas
  d'abonnement, pas de dépendance à un service tiers.
- **Usage professionnel réel** : sur un lieu de prestation, l'accès Internet est souvent absent ou
  instable ; le réseau local, lui, est toujours là.
- **Temps réel** : les modifications acceptées par l'hôte sont diffusées aux autres postes.
- **Travail hors ligne** : un poste qui perd le réseau continue ; ses modifications sont fusionnées
  à la reconnexion.
- **Secours** : la fusion de fichiers `.avd` existe déjà ; elle reste disponible pour travailler à
  distance sans VPN (chacun sa copie, fusion ensuite).

À distance (télétravail), la même session fonctionne au travers d'un VPN d'entreprise. Un serveur en
ligne pourrait être ajouté plus tard sans changer le modèle de données, si le besoin apparaît.

## Principe technique

1. **Document partagé de type CRDT** (bibliothèque Yjs, licence MIT) : chaque équipement, liaison,
   feuille et annotation est un élément du document. Deux personnes peuvent modifier des éléments
   différents en même temps sans conflit ; sur un même élément, la dernière modification d'un champ
   l'emporte, champ par champ (pas de perte du reste de l'élément).
2. **Hôte** : l'application de bureau (Tauri) ouvre un petit serveur WebSocket sur le réseau local,
   seulement pendant la session et sur un port choisi.
3. **Accès** : code de session à 6 chiffres affiché chez l'hôte, demandé pour rejoindre. L'hôte voit
   la liste des participants et peut en exclure un. Pas d'accès sans code.
4. **Découverte** : recherche automatique sur le même sous-réseau IPv4 (UDP 4456), sans service externe ni diffusion du code d’accès. Seuls le nom du projet, le nom de l’hôte et son adresse de session sont annoncés. La saisie d’adresse reste dans les options avancées pour les réseaux filtrés et les VPN.
5. **Présence** : nom et couleur de chaque participant, calque qu'il affiche, sélection en cours
   (contour de couleur sur les blocs qu'il manipule).
6. **Annulation** : propre à chaque personne (on n'annule que ses propres modifications).
7. **Enregistrement** : Ctrl+S / Cmd+S enregistre le fichier principal `.avd` ; chaque participant peut
   garder une copie locale. Les sauvegardes de sécurité automatiques vont dans « Save Back Up ».

## Compatibilité des sessions (0.5.30)

Les droits simplifiés utilisent le protocole 6 : installer la version 0.5.30 ou une version ultérieure compatible sur tous les postes. Les versions au protocole antérieur sont refusées avant la synchronisation. Les réservations uniques des reprises locales sont lues comme un seul membre ; les fichiers .avd ne contiennent pas les droits et restent compatibles. Les données par port suivent les droits du signal ; les fonds de plan, circuits et imports sont accessibles à l'hôte et aux invités avec Droits complets. Voir le [guide des vues et échanges](vues-et-echanges-0.4.0.md). Les sections datées ci-dessous conservent l'historique des essais.

## État historique (2026-10-16, version 0.2.3)

Les calques sont attribués par l'hôte et les propositions invitées sont validées avant diffusion.
Les identités de poste sont dérivées d'un secret persistant par le relais ; les noms affichés ne
servent pas de preuve d'identité. Le poste hôte s'authentifie auprès du relais avec un secret local.
Le nouveau parcours nécessite la version 0.2.1 sur tous les postes. L’hôte ouvre une salle d’attente,
accueille les invités, attribue les calques puis commence la session. Avant ce départ, le document
est en lecture seule pour les invités ; cette règle et le départ sont contrôlés par l’hôte avant
diffusion des modifications. Terminer ou quitter la session reste accessible dans le bandeau du logiciel.
Un premier essai utilisateur confirme le fonctionnement de la session après saisie manuelle de
l'adresse : deux postes Windows 11, Ethernet sur le même switch, IP fixes, réseau scolaire.
La découverte automatique n'y a pas trouvé l'hôte. La version 0.2.2 poursuit les annonces et la
recherche après une erreur UDP liée à un port fermé ou à un paquet trop grand, au lieu de les arrêter.
Le nouvel essai en 0.2.2 confirme que l'invité trouve maintenant la session de l'hôte. Le bouton
Rejoindre est ensuite resté inactif. La 0.2.3 présélectionne un hôte unique et indique la condition
manquante : nom de l'invité, choix de la session ou code à six chiffres. Plusieurs hôtes restent
à départager explicitement ; une saisie manuelle est prioritaire. Ce parcours reste à retester
sur les deux postes. Le code d'accès et les droits ne sont pas modifiés.
La fin de session est aussi annoncée si le relais ferme les canaux internes avant que les connexions
ne traitent l'arrêt. Une régression répète cette fermeture pour un hôte et un invité ; les attentes
des messages de contrôle dans les tests sont bornées pour éviter un blocage silencieux de la CI.
Restent aussi les essais à trois postes réels, les règles du pare-feu et la continuité après panne.

| Élément | Fichier |
|---|---|
| Relais WebSocket (code, blocage après 5 codes faux pendant 60 s, 16 participants max, exclusion, fin annoncée) | `src-tauri/src/collab.rs` |
| Découverte réseau bornée, avec nonce par recherche et limitation des réponses ; arrêt avec le relais | `src-tauri/src/discovery.rs` |
| Correspondance projet <-> document Yjs, annulation par personne | `src/collab/ydoc.ts` |
| Session : lien document <-> projet, tchat, réservations, reprise, actions (héberger, rejoindre, quitter, exclure) | `src/collab/session.ts` |
| État affiché (participants, alertes), préférences du poste, session à reprendre | `src/collab/collabStore.ts` |
| Messages du relais : synchronisation du document et présence | `src/collab/protocol.ts` |
| Connexion, reconnexion, relais de secours | `src/collab/failover.ts` |
| Règles des calques réservés | `src/collab/protection.ts` |
| Droits des invités et validation des propositions reçues chez l'hôte | `src/collab/access.ts`, `src/collab/hostValidation.ts` |
| Fenêtre Héberger / Rejoindre / Reprendre, participants, calques réservés | `src/ui/CollabDialog.tsx` |
| Tchat, bandeau d'alerte | `src/ui/ChatPanel.tsx`, `src/ui/CollabBanner.tsx` |

### Tchat

Bouton bulle dans la barre du haut pendant une session (compteur de messages non lus). Les messages
passent par le document partagé : un participant qui arrive voit l'historique (500 derniers messages).
Ils ne sont pas enregistrés dans le fichier `.avd`.

### Droits partagés par métier

Seul l’hôte gère les droits, avec des cases Audio, Image, Lumière, Réseau et Électrique pour chaque invité. Un invité peut recevoir plusieurs métiers et plusieurs invités peuvent partager le même métier. Chaque métier inclut automatiquement l'édition du calque et du matériel Réseau ; Réseau seul n'accorde pas les autres métiers. La case Réseau est cochée et non décochable tant qu'un autre métier l'inclut, sans effacer une éventuelle attribution Réseau explicite.

L'hôte peut cocher **Droits complets** : cet invité modifie tout le projet, y compris depuis Général, les feuilles, les baies et les paramètres communs. Les métiers préexistants sont conservés et reprennent effet si l'hôte décoche Droits complets. Ce droit est révocable pendant la session, y compris pour un poste déconnecté. La vue générale reste en lecture seule pour les autres invités. L'administration de la session, le démarrage, les attributions et l'exclusion restent réservés à l'hôte ; avant le démarrage, tous les invités restent en lecture seule.

Le filtre d’affichage ne réduit plus les droits au seul signal du calque affiché. Un intervenant Audio gère ses appareils audio, leurs ports audio et leurs interfaces techniques associées, notamment les interfaces réseau de sa console ou de ses stageboxes. Les ports audio d’une caméra restent également accessibles au métier Audio, tandis que ses ports vidéo relèvent du métier Image. Le nom et la disposition d’un appareil relèvent de son métier principal. Les autres métiers suivent les mêmes principes.

Les équipements réseau du projet sont modifiables par tous les métiers : un intervenant Audio peut ajouter un switch, le déplacer, renommer ses ports ou renseigner ses paramètres IP/VLAN, et raccorder sa console. Les ports Audio-IP ou Vidéo-IP d'autres appareils restent dans leur métier respectif ; Réseau seul ne donne pas le droit de modifier une console Audio ou une caméra Image. Une liaison protégée ne peut pas être écrasée ou réaffectée par une opération combinée.

Un appareil non relié peut être supprimé par son métier principal même s’il possède des ports techniques d’autres domaines. Une suppression touchant une liaison protégée reste refusée, avec un motif identifiant l’élément concerné. Les commandes visibles, le garde local et la validation chez l’hôte utilisent la même politique. L’ajout de port Expert initialise une prise autorisée pour l’appareil, au lieu de créer systématiquement un port audio.

Les modifications simultanées restent synchronisées par champ et l’annulation est individuelle. Les anciens fichiers .avd et les réservations uniques des reprises restent lisibles. Les réglages communs du projet, feuilles, zones, baies, multipaires et imports sont réservés à l’hôte et aux invités avec Droits complets. Les propositions réseau sont contrôlées avant de modifier le document accepté ; une proposition invalide ne doit pas devenir un changement diffusé.

Quitter ou terminer la session avant de changer de schéma : une ouverture locale ne remplace pas
le projet partagé. Une reconnexion normale du même poste conserve ses attributions.

### Perte de l'hôte

- Fin voulue (« Terminer la session ») : chacun est prévenu et garde le projet ouvert.
- Perte inopinée (plantage, fermeture de l'application, coupure réseau) : bandeau d'alerte chez les
  invités, qui continuent à travailler ; leur document est complet et enregistré sur leur poste.
- Postes de secours : un invité sur l'application de bureau (case cochée par défaut) annonce ses
  adresses. Si l'hôte reste injoignable 8 s, le premier poste de secours (ordre connu de tous) ouvre
  un relais avec le même code ; les autres s'y reconnectent seuls. Le suivant attend 16 s, etc.
- Retour de l'hôte initial : « Reprendre la session » cherche d'abord un secours actif et rejoint son
  document à jour. **Le secours reste hôte** ; l'hébergement n'est pas retransféré automatiquement.
  Cela conserve aussi les changements réalisés par le secours hors de ses anciennes attributions.
  Un transfert d'hébergement demande un protocole distinct ; aucun ancien instantané ne doit écraser
  le document du secours. Si aucun secours n'est joignable, le poste initial restaure sa session.
- Un invité dont l'application a planté retrouve aussi « Reprendre la session ».

Les anciens essais de retour automatique vers l'hôte initial ne valident pas ce nouveau fonctionnement.
Les tests actuels simulent deux et trois instances : droits, édition autorisée, refus dans la vue
générale, retrait des droits, reconnexion, reprise de l'ancien hôte sur un secours actif, ainsi que
modification et ajout simultanés de ports audio/vidéo avec annulation individuelle. Les tests Rust
vérifient le routage, les codes, l'exclusion et l'annonce de fin. Les essais de panne et reprise sur
trois ordinateurs réels restent à faire avant fusion.

## Postes Windows et Mac

Le travail à plusieurs se fait uniquement avec l'application de bureau, installée sur chaque poste.
Windows et macOS travaillent ensemble dans la même session (même protocole, même format de projet).

- macOS 15 et suivants : à la première connexion, le système demande l'autorisation d'accéder au
  réseau local (texte fourni par `src-tauri/Info.plist`) ; la refuser empêche la session. Réglage :
  Réglages Système, Confidentialité et sécurité, Réseau local.
- macOS : à l'ouverture d'une session (hôte ou poste de secours), le pare-feu peut demander
  d'accepter les connexions entrantes pour AV Diagram.
- Windows : les autorisations dépendent du profil réseau actif et des règles de l'établissement.
  La découverte utilise UDP 4456 entrant sur l'hôte ; la session utilise TCP 4455 par défaut.
  Une connexion manuelle réussie en TCP ne vérifie pas le passage des requêtes UDP diffusées.
  Si la recherche reste vide, faire vérifier ces règles par l'administrateur sans désactiver le pare-feu.

## Tester

1. Installer la version 0.5.30 ou une version compatible avec le protocole 6 sur tous les postes. Hôte : « Session Collaborative », nom, onglet Héberger,
   « Ouvrir la session ». Le code à 6 chiffres et la salle d'attente s'affichent.
2. Invité : renseigner son propre nom en haut, onglet Rejoindre, choisir l'hôte trouvé (présélectionné
   s'il est seul) et saisir les six chiffres du code. Si la recherche reste vide,
   essayer Actualiser puis l'adresse affichée chez l'hôte dans les options avancées
   (ex. `192.168.1.20:4455`). Noter séparément le résultat de la découverte et de la connexion manuelle.
3. Hôte : cocher Audio et Image pour un invité, puis Audio pour un second, et « Commencer la session ».
   Vérifier que les deux modifient Audio ; que le premier peut passer sur Image ; que le second
   ne peut pas modifier Image. Décocher Audio pour le premier : le second doit conserver son accès.
   Avec Audio seul, vérifier aussi console Dante vers port libre de switch, modification de l’IP
   de la console, configuration du switch et suppression d’un appareil mixte non relié. Attribuer
   Réseau seul : les paramètres des appareils Audio/Image doivent rester protégés. Cocher Droits
   complets puis modifier le cartouche et Général ; décocher et vérifier le retour aux métiers précédents.
4. Points à vérifier : ajout et déplacement de blocs des deux côtés, liaisons, calques différents sur
   chaque poste, réservation de calque et refus, tchat, Ctrl+Z (ne défait que ses propres
   modifications), coupure du Wi-Fi d'un invité puis retour (fusion), fermeture brutale de l'hôte
   (prise de relais), redémarrage de l'hôte et « Reprendre la session », exclusion, « Terminer ».
5. Sans réseau : `npm test` exécute les simulations ; `cargo test --lib` dans `src-tauri` vérifie
   le relais natif. Le démonstrateur manuel historique ne remplace pas un hôte natif authentifié.

Limites connues : l'enregistrement local de la session (reprise) est limité par le stockage du poste
(environ 5 Mo) ; au-delà, la reprise se fait depuis les autres participants. Deux postes isolés l'un
de l'autre peuvent chacun faire tourner un relais pendant une coupure : il faut choisir la session
à poursuivre et conserver les fichiers avant une fusion manuelle. La fusion de deux hôtes concurrents
n'est pas automatique. Pas de chiffrement sur le réseau local : utiliser un VPN hors du lieu.

## Étapes proposées

| Étape | Contenu |
|---|---|
| 1 | Passage du projet sur un document Yjs (sans réseau), annulation par utilisateur, tests |
| 2 | Serveur WebSocket dans l'application de bureau, code de session, rejoindre par adresse |
| 3 | Présence (participants, calque affiché, sélection), découverte automatique sur le réseau |
| 4 | Gestion des pertes de réseau, reprise, essais à 3 postes sur un réseau réel |
