# AV Diagram — consignes des agents de développement

Lire `CLAUDE.md` et `docs/developpement/equipe-agents.md` avant de modifier le produit.
Le tableau de travail courant est `docs/developpement/equipe-agents.json`.

- L'utilisateur a autorisé le travail en équipe et le choix du modèle selon la tâche. Le principal répartit, relit, intègre et teste ; il est seul responsable des fichiers communs et de la publication.
- Ne lancer un agent que pour une carte prête avec un périmètre utile et disjoint. Deux agents de travail suffisent normalement ; trois seulement pour des tâches indépendantes. Aucun agent ne délègue à son tour.
- Utiliser un contexte court (`fork_turns: none`) avec les chemins, critères et limites nécessaires. Choisir parmi les modèles réellement disponibles, selon la grille du guide. Ne pas transmettre tout l'historique.
- Tester un défaut avant sa correction, puis les comportements voisins. Ne pas relancer une suite sur un contenu inchangé sans raison nouvelle.
- Ne jamais réinitialiser le checkout historique ni publier toutes ses modifications. Comparer au dernier commit distant et publier seulement le delta relu, avec contrôle du commit parent. La PR reste en brouillon.
- Les lots documentaires restent soumis à `docs/inventaire/methode-verification-par-lots.md`. Ne pas valider des fiches à la place de l'utilisateur. Le lot audio 03 est préparé, pas approuvé.
- `/graphify` : utiliser la compétence graphify installée avant toute autre action. Ne pas construire de graphe pour une tâche qui ne le demande pas.
