# Droits collaboratifs simplifiés — 0.5.30

Carte COLLAB-SIMPLE-001. Demande utilisateur : tous les métiers incluent Réseau ; Réseau seul reste limité à Réseau ; un invité peut recevoir des droits complets. Base publiée : 0.5.29, commit `1fad01634173d731af6d09bd7af57997d2afe6af`.

## Comportement

- Les attributions explicites existantes sont conservées. Les droits effectifs ajoutent Réseau dès qu'un autre métier est attribué. Cela autorise aussi l'ajout, le déplacement et la configuration des équipements réseau. Sans attribution, aucun accès n'est accordé.
- Réseau seul ne donne pas accès aux propriétés et ports Audio/IP d'une console ni aux propriétés et ports Vidéo/IP d'une caméra. Les interfaces techniques Réseau gardent leurs règles de domaine.
- L'hôte peut cocher Droits complets : édition de tout le projet valide, y compris Général et les paramètres communs, sans remplacement de l'identité du projet. Ce droit est séparé des métiers ; son retrait restaure les attributions précédentes.
- Le dialogue montre Réseau implicite coché et non décochable tant qu'un métier l'inclut. Droits complets désactive les cases métiers sans les effacer. Un invité déconnecté ayant uniquement ce droit reste visible et révocable.
- Seul l'hôte administre la session, attribue les droits, démarre et exclut. Avant démarrage, tous les invités restent en lecture seule. Les protections de session, d'identité, de claims, de types partagés et de chat restent applicables aux invités complets.
- L'interface, les baies, le garde du projet, les contrôles de l'hôte et undo/redo utilisent les droits actuels. La fenêtre Infos détachée reçoit les claims complets et leur retrait. Une révocation bloque l'action devenue interdite avant émission réseau, sans exclusion.

## Vérifications

Trois attentes sont reproduites en échec avant correction : Réseau implicite, édition complète d'un switch par Audio, puis plein droit dans Général. Après correction, 73 tests ciblés passent sur neuf fichiers ; les dernières assertions de sécurité ajoutées passent aussi dans les 23 tests d'accès. Le contrôle général final réussit : **523 tests**, six essais IA réelle ignorés, types et compilation. Lint : aucune erreur, quatre avertissements historiques React dans Canvas et SeriesDialog. Le manuel est régénéré avec 22 chapitres et 10 captures.

Les tests couvrent notamment le refus de déplacer/renommer les appareils Audio/Image avec Réseau seul, le remplacement d'identité du projet interdit même en plein droit, les claims forgés refusés même par un invité complet, l'attente avant démarrage, la révocation puis la réattribution, undo/redo sans envoi interdit ni kick, le dialogue réel, les baies et la fenêtre Infos.

L'agent de développement gpt-6.1-sol moyen a livré 16 fichiers de code/tests modifiés, sans nouveau fichier produit ni dépendance. Le réviseur gpt-6-luna moyen a relu le delta exact et vérifié les 16 empreintes du manifeste ; aucun défaut du delta ne reste signalé. Le principal relit, exécute les contrôles globaux et publie uniquement la liste contrôlée sur `codex/ia-locale`, PR4 en brouillon. Une seule passe d'implémentation ; aucun lot catalogue en attente n'est appliqué.

## Compatibilité et limites

Le client et le relais utilisent le protocole 6. Mettre à jour tous les postes en 0.5.30 ; les protocoles antérieurs sont refusés avant synchronisation. Les anciennes réservations uniques des reprises restent lisibles. Ni le format .avd ni les équipements du catalogue ne sont modifiés.

Pas de test Rust/Tauri local ni de séance sur le réseau physique de l'établissement. Les contrôles natifs et installateurs doivent être confirmés par la CI du commit exact. Les six essais IA réelle ignorés ne sont pas des succès. Sur un même champ modifié simultanément, la dernière modification acceptée l'emporte comme auparavant.
