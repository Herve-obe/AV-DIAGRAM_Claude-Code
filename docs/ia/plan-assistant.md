# Plan de l'assistant IA

Objectif : un assistant capable de générer, vérifier et modifier un schéma audiovisuel à partir d'une demande simple ou d'un cahier des charges, et d'aider à utiliser le logiciel. Plan établi le 11 novembre 2026 avec Hervé Obejero.

## Principes retenus

- **Aucune IA en ligne imposée.** L'utilisateur choisit :
  - une IA locale gratuite, installée par la case de l'installeur ou depuis Paramètres > Assistant IA ;
  - ou son IA personnelle (Claude, Gemini, ChatGPT, Mistral), avec sa propre clé API.
- **Avertissements.**
  - IA locale : ses limites sont rappelées dans la configuration, dans un bandeau du chat et dans le manuel (chapitre 21).
  - IA personnelle : le surcoût éventuel est rappelé aux mêmes endroits.
  - Une demande de plus de 1 500 caractères ou de plus de 5 contraintes déclenche, avec l'IA locale, l'avertissement : « Cette demande est complexe pour l'IA locale ; le résultat sera à vérifier de près. »
- **Le logiciel construit, l'IA planifie.** L'IA comprend la demande et remplit un plan structuré : rôles, quantités, flux, contraintes, hypothèses. Le logiciel choisit les prises, pose les liaisons et vérifie avec le moteur de règles. Un petit modèle local reste ainsi utile.
- **« Entraîner » ne veut pas dire réentraîner les poids du modèle.** Cela consiste à lui fournir une connaissance métier, des outils complets et une batterie de tests qui mesure ses résultats. La bibliothèque change trop souvent pour être apprise par le modèle.
- **Aucune modification sans accord.** Les propositions restent dans un brouillon. L'utilisateur les applique en une étape annulable.

## Étapes

| # | Étape | État |
|---|---|---|
| 1 | Compatibilité Claude Opus 5.5 et Sonnet 5.5 : plus d'outil forcé (erreur 400), limite de sortie relevée, modèle recommandé le plus récent | Fait le 11 novembre 2026 |
| 2 | Avertissements : configuration, bandeau du chat, chapitre 21 du manuel, avertissement de demande complexe | Fait le 11 novembre 2026 |
| 3 | Installeur Windows : case « IA locale » décochée par défaut, choix entre Qwen3 4B, 8B et 14B, téléchargement au premier lancement ; même choix dans les paramètres sous macOS | Fait le 11 novembre 2026 (essai sur Windows à faire) |
| 4 | **Aide à l'utilisation du logiciel** (voir ci-dessous) | À faire |
| 5 | Base de connaissance métier (`docs/ia/metier.md`), relue par Hervé : niveaux, signaux, fantôme, liaisons point à point, Dante, horloge, DMX, intercom, règles de la bibliothèque | À faire |
| 6 | Batterie d'évaluation : 30 à 50 cahiers des charges, notés automatiquement pour l'IA locale et pour l'IA personnelle | À faire, avec des cahiers des charges réels anonymisés |
| 7 | Nettoyage de l'agent : suppression de l'analyse par mots-clés et des scénarios codés en dur (`propose_audio_production`, `propose_video_studio`), boucle simple | À faire |
| 8 | Outils de modification : supprimer, débrancher, remplacer en reprenant les liaisons, renommer, déplacer de feuille, créer un multipaire, choix automatique des prises compatibles | À faire |
| 9 | Interface : plan affiché avant construction, aperçu des différences, import d'un cahier des charges en PDF (texte extrait sur l'ordinateur) | À faire |
| 10 | Passes de réglage sur la batterie de tests, puis publication des limites mesurées dans le manuel | À faire |
| 11 | **Lien avec le logiciel de gestion de matériel de l'entreprise** (voir ci-dessous) | Version future |

## Étape 4 : aide à l'utilisation du logiciel

Exemple : « Comment je fais pour ajouter une zone ? » L'assistant décrit la marche à suivre, étape par étape, avec les noms exacts des menus et des boutons, et cite le chapitre du manuel.

Cette tâche convient aussi à l'IA locale : elle consiste à retrouver la bonne procédure et à la reformuler, sans raisonnement technique complexe.

1. **Fiches de procédure.** Créer `docs/ia/procedures.md`, avec une fiche par tâche : but, chemin exact (menu, bouton, raccourci), étapes numérotées, pièges fréquents et chapitre du manuel.
   - Le manuel actuel explique les notions, mais pas toujours les gestes. Par exemple, il définit une zone sans dire où cliquer pour en créer une.
   - Première liste de fiches : créer une zone, ajouter une feuille, poser un équipement, relier deux prises, créer un multipaire, changer de calque, exporter en PDF, importer un patch, créer un équipement générique, retrouver une sauvegarde, travailler à plusieurs en LAN, préparer un bilan électrique.
2. **Recherche locale.** La recherche locale du manuel (`search_documentation`) cherche d'abord dans ces fiches, puis dans le manuel. Aucun envoi en ligne avec l'IA locale.
3. **Réponse guidée.** Étapes numérotées et noms exacts tirés de l'interface. Si aucune fiche ne correspond, l'assistant le dit au lieu d'inventer un menu.
4. **Cohérence avec le logiciel.** Un test automatique vérifie que chaque libellé cité dans une fiche existe dans `src/i18n/fr.json`. Une fiche devenue fausse après une évolution de l'interface est ainsi détectée.
5. **Évaluation.** Une série de 40 questions « comment faire », notée pour Qwen3 4B, 8B et 14B.

## Étape 11 (version future) : lien avec le logiciel de gestion de matériel

But : importer le parc de l'entreprise et son stock, puis ne proposer, à la date d'une prestation, que le matériel disponible.

1. **Connexion.** Lire le parc depuis le logiciel de gestion de l'entreprise, par son API ou par un export automatique (CSV, Excel). Les solutions à étudier, selon ce qu'elles proposent réellement (à vérifier) : Loxya, Rentman, Current RMS, Flex Rental Solutions, easyjob.
2. **Correspondance des références.** Associer chaque article du parc à une fiche de la bibliothèque, comme le fait déjà l'import de catalogue de l'onglet « Mon entreprise ». Les quantités alimentent le champ existant `companyQuantity`.
3. **Disponibilité à une date.**
   - Le projet porte une date ou une période de prestation.
   - Le logiciel interroge la disponibilité sur cette période (stock moins réservations).
   - Il met à jour les quantités de l'onglet « Mon entreprise ».
   - L'assistant, limité à « Mon entreprise uniquement », ne propose que le matériel disponible.
   - Les alertes de pénurie existantes (`CompanyAlerts`) signalent tout dépassement.
4. **Sens des échanges.** Lecture seule au départ. Une réservation créée depuis AV Diagram (liste de matériel envoyée au logiciel de gestion) sera une étape ultérieure, avec confirmation.
5. **Données et confidentialité.**
   - La règle « rien ne quitte l'ordinateur » doit être complétée par une exception explicite, comparable à celle de l'IA personnelle.
   - Connexion seulement vers le serveur de gestion de l'entreprise, sur liste d'adresses autorisées.
   - Identifiants rangés dans le trousseau du système, accord de l'utilisateur requis.
6. **Mode hors ligne.** Sans connexion, la dernière synchronisation reste utilisée, avec sa date affichée.
