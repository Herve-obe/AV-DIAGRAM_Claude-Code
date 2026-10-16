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

## État (2026-10-16, version 0.2.1)

Les calques sont attribués par l'hôte et les propositions invitées sont validées avant diffusion.
Les identités de poste sont dérivées d'un secret persistant par le relais ; les noms affichés ne
servent pas de preuve d'identité. Le poste hôte s'authentifie auprès du relais avec un secret local.
Le nouveau parcours nécessite la version 0.2.1 sur tous les postes. L’hôte ouvre une salle d’attente,
accueille les invités, attribue les calques puis commence la session. Avant ce départ, le document
est en lecture seule pour les invités ; cette règle et le départ sont contrôlés par l’hôte avant
diffusion des modifications. Terminer ou quitter la session reste accessible dans le bandeau du logiciel.
La découverte IPv4 automatique est implémentée. Restent les essais à trois postes réels, notamment
les règles du pare-feu, les réseaux Wi-Fi isolant leurs clients et la continuité après panne.

| Élément | Fichier |
|---|---|
| Relais WebSocket (code, blocage après 5 codes faux pendant 60 s, 16 participants max, exclusion, fin annoncée) | `src-tauri/src/collab.rs` |
| Découverte réseau bornée, avec nonce par recherche et limitation des réponses ; arrêt avec le relais | `src-tauri/src/discovery.rs` |
| Correspondance projet <-> document Yjs, annulation par personne | `src/collab/ydoc.ts` |
| Session : connexion, synchronisation, présence, tchat, réservations, reprise, relais de secours | `src/collab/session.ts` |
| Règles des calques réservés | `src/collab/protection.ts` |
| Droits des invités et validation des propositions reçues chez l'hôte | `src/collab/access.ts`, `src/collab/hostValidation.ts` |
| Fenêtre Héberger / Rejoindre / Reprendre, participants, calques réservés | `src/ui/CollabDialog.tsx` |
| Tchat, bandeau d'alerte | `src/ui/ChatPanel.tsx`, `src/ui/CollabBanner.tsx` |

### Tchat

Bouton bulle dans la barre du haut pendant une session (compteur de messages non lus). Les messages
passent par le document partagé : un participant qui arrive voit l'historique (500 derniers messages).
Ils ne sont pas enregistrés dans le fichier `.avd`.

### Calques réservés

Seul l'hôte attribue ou libère les calques dans la fenêtre Collaboration. Un invité peut recevoir
plusieurs calques ; un même calque est réservé à un invité à la fois. Sans attribution, il reste
réservé à l'hôte. Les invités voient tout mais éditent uniquement depuis un calque attribué ; leur
vue générale reste en lecture seule. L'hôte peut tout modifier, y compris depuis la vue générale.

Sur un équipement partagé, les ports de chaque domaine sont protégés séparément. Le nom et la
disposition appartiennent au domaine principal. Chaque port est synchronisé séparément : deux
invités peuvent modifier ou ajouter des ports audio et vidéo du même appareil en parallèle.
L'annulation de l'un conserve les modifications de l'autre et la date de modification du projet.
Les anciens fichiers `.avd` restent compatibles. Les réglages communs, feuilles, zones, cadres,
baies et multipaires restent réservés à l'hôte. Les commandes clavier, l'assistant, l'annulation
et la fenêtre Infos respectent aussi les droits. Les propositions réseau sont contrôlées chez
l'hôte avant de modifier le document accepté. Un client envoyant une proposition invalide est
déconnecté ; son document local reste ouvert pour être conservé ou pour rejoindre de nouveau.

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
- Windows : à la première ouverture de session, le pare-feu Windows Defender demande d'autoriser
  AV Diagram sur les réseaux privés ; cocher « Réseaux privés ».

## Tester

1. Poste hôte (application de bureau) : bouton « Travail à plusieurs » (icône personnes, barre du
   haut), saisir son nom, onglet Héberger, port 4455 par défaut, « Ouvrir la session ». Le code à
   6 chiffres et les adresses du poste s'affichent.
2. Pare-feu : autoriser le port 4455 en TCP entrant sur l'hôte, et sur les postes de secours.
3. Autres postes (application de bureau ou navigateur sur le même réseau) : onglet Rejoindre,
   adresse affichée chez l'hôte (ex. `192.168.1.20:4455`), code, « Rejoindre ». Le projet de la
   session remplace le projet ouvert sur ce poste.
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
