# Collaboration à plusieurs sur un même projet (2026-10-08)

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
- **Temps réel** : chaque modification apparaît chez les autres en moins d'une seconde.
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
4. **Découverte** : les sessions ouvertes sur le réseau sont listées automatiquement (mDNS) ; saisie
   manuelle de l'adresse possible.
5. **Présence** : nom et couleur de chaque participant, calque qu'il affiche, sélection en cours
   (contour de couleur sur les blocs qu'il manipule).
6. **Annulation** : propre à chaque personne (on n'annule que ses propres modifications).
7. **Enregistrement** : l'hôte enregistre le fichier `.avd` ; chaque participant peut aussi en
   garder une copie locale.

## État (2026-10-08)

Fait : étapes 1 et 2, présence de l'étape 3, reconnexion de l'étape 4, plus le tchat, les calques
réservés et la continuité en cas de perte de l'hôte. Reste : découverte automatique (mDNS) et essais
à 3 postes sur un réseau réel.

| Élément | Fichier |
|---|---|
| Relais WebSocket (code, blocage après 5 codes faux pendant 60 s, 16 participants max, exclusion, fin annoncée) | `src-tauri/src/collab.rs` |
| Correspondance projet <-> document Yjs, annulation par personne | `src/collab/ydoc.ts` |
| Session : connexion, synchronisation, présence, tchat, réservations, reprise, relais de secours | `src/collab/session.ts` |
| Règles des calques réservés | `src/collab/protection.ts` |
| Fenêtre Héberger / Rejoindre / Reprendre, participants, calques réservés | `src/ui/CollabDialog.tsx` |
| Tchat, bandeau d'alerte | `src/ui/ChatPanel.tsx`, `src/ui/CollabBanner.tsx` |

### Tchat

Bouton bulle dans la barre du haut pendant une session (compteur de messages non lus). Les messages
passent par le document partagé : un participant qui arrive voit l'historique (500 derniers messages).
Ils ne sont pas enregistrés dans le fichier `.avd`.

### Calques réservés

Chacun réserve son calque (fenêtre Travail à plusieurs, section Calques réservés). Pour les autres :
- un équipement dont tous les calques sont réservés par quelqu'un d'autre est verrouillé (cadenas,
  ni déplacement, ni suppression, ni modification) ;
- un équipement partagé (caméra avec entrées audio) reste déplaçable, ses ports du calque libre
  restent modifiables et reliables ; ses réglages et ses ports de l'autre calque sont protégés ;
- les liaisons d'un calque réservé ne peuvent être ni créées, ni modifiées, ni supprimées ;
- toute modification refusée est annulée aussitôt et signalée (« calque Image réservé par … »).

On libère son propre calque ; l'hôte d'origine peut libérer n'importe quel calque, et n'importe qui
peut libérer celui d'une personne qui n'est plus connectée. Sans réservation, tout reste libre.

### Perte de l'hôte

- Fin voulue (« Terminer la session ») : chacun est prévenu et garde le projet ouvert.
- Perte inopinée (plantage, fermeture de l'application, coupure réseau) : bandeau d'alerte chez les
  invités, qui continuent à travailler ; leur document est complet et enregistré sur leur poste.
- Postes de secours : un invité sur l'application de bureau (case cochée par défaut) annonce ses
  adresses. Si l'hôte reste injoignable 8 s, le premier poste de secours (ordre connu de tous) ouvre
  un relais avec le même code ; les autres s'y reconnectent seuls. Le suivant attend 16 s, etc.
- Retour de l'hôte : au redémarrage, la fenêtre propose « Reprendre la session » (même code, même
  port, document restauré). Le relais de secours détecte son retour (toutes les 5 s), se ferme, et tout
  le monde revient chez l'hôte ; les modifications faites entre-temps sont fusionnées.
- Un invité dont l'application a planté retrouve aussi « Reprendre la session ».

Vérifié de bout en bout (3 navigateurs, relais Rust réels lancés et arrêtés par l'essai) : tchat,
refus d'un ajout dans un calque réservé, plantage de l'hôte, prise de relais par le poste de secours
après 8 s, ajouts des deux invités pendant l'absence, reprise par l'hôte, retour de tous chez lui avec
les 4 équipements fusionnés. L'annonce de fin voulue est vérifiée par les tests Rust (le relais de
l'essai était arrêté brutalement).

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
5. Essai sans réseau, sur un seul poste : `cargo test --lib collab::tests::relais_manuel -- --ignored`
   dans `src-tauri` ouvre un relais sur 4455 avec le code 123456 pendant 120 s
   (`AVD_RELAY_PORT`, `AVD_RELAY_CODE`, `AVD_RELAY_SECS` pour les changer).

Limites connues : l'enregistrement local de la session (reprise) est limité par le stockage du poste
(environ 5 Mo) ; au-delà, la reprise se fait depuis les autres participants. Deux postes isolés l'un
de l'autre peuvent chacun faire tourner un relais pendant la coupure ; ils se rejoignent quand le
réseau revient (retour vers l'hôte d'origine). Pas de chiffrement sur le réseau local : utiliser un
VPN hors du lieu.

## Étapes proposées

| Étape | Contenu |
|---|---|
| 1 | Passage du projet sur un document Yjs (sans réseau), annulation par utilisateur, tests |
| 2 | Serveur WebSocket dans l'application de bureau, code de session, rejoindre par adresse |
| 3 | Présence (participants, calque affiché, sélection), découverte automatique sur le réseau |
| 4 | Gestion des pertes de réseau, reprise, essais à 3 postes sur un réseau réel |
