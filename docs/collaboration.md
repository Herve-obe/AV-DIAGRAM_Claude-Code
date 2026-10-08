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

Fait : étapes 1 et 2, présence de l'étape 3, reconnexion de l'étape 4. Reste : découverte
automatique (mDNS) et essais à 3 postes sur un réseau réel.

| Élément | Fichier |
|---|---|
| Relais WebSocket (code, blocage après 5 codes faux pendant 60 s, 16 participants max, exclusion) | `src-tauri/src/collab.rs` |
| Correspondance projet <-> document Yjs, annulation par personne | `src/collab/ydoc.ts` |
| Session : connexion, synchronisation, présence, reconnexion toutes les 2 s | `src/collab/session.ts` |
| Fenêtre Héberger / Rejoindre, participants, code | `src/ui/CollabDialog.tsx` |
| Contour de présence sur les blocs sélectionnés par les autres | `src/editor/EquipmentNode.tsx` |

Vérifié : tests Rust du relais, tests Vitest du document partagé, essai de bout en bout avec le relais
réel et deux navigateurs (synchronisation initiale, modifications simultanées, annulation propre à
chacun, présence).

## Tester

1. Poste hôte (application de bureau) : bouton « Travail à plusieurs » (icône personnes, barre du
   haut), saisir son nom, onglet Héberger, port 4455 par défaut, « Ouvrir la session ». Le code à
   6 chiffres et les adresses du poste s'affichent.
2. Pare-feu de l'hôte : autoriser le port choisi en TCP entrant (Windows le demande à la première
   ouverture).
3. Autres postes (application de bureau ou navigateur sur le même réseau) : onglet Rejoindre,
   adresse affichée chez l'hôte (ex. `192.168.1.20:4455`), code, « Rejoindre ». Le projet de la
   session remplace le projet ouvert sur ce poste.
4. Points à vérifier : ajout et déplacement de blocs des deux côtés, liaisons, calques différents sur
   chaque poste, Ctrl+Z (ne défait que ses propres modifications), coupure du Wi-Fi d'un invité
   pendant qu'il modifie puis retour (fusion), exclusion d'un participant, « Terminer la session ».
5. Essai sans réseau, sur un seul poste : `cargo test --lib collab::tests::relais_manuel -- --ignored`
   dans `src-tauri` ouvre un relais sur 4455 avec le code 123456 pendant 120 s
   (`AVD_RELAY_SECS` pour changer la durée).

Limites connues : l'hôte enregistre le fichier `.avd` ; quand l'hôte termine la session, les invités
gardent le projet et tentent de se reconnecter jusqu'à ce qu'ils quittent. Pas de chiffrement sur
le réseau local (même niveau que les protocoles de régie usuels) : utiliser un VPN hors du lieu.

## Étapes proposées

| Étape | Contenu |
|---|---|
| 1 | Passage du projet sur un document Yjs (sans réseau), annulation par utilisateur, tests |
| 2 | Serveur WebSocket dans l'application de bureau, code de session, rejoindre par adresse |
| 3 | Présence (participants, calque affiché, sélection), découverte automatique sur le réseau |
| 4 | Gestion des pertes de réseau, reprise, essais à 3 postes sur un réseau réel |
