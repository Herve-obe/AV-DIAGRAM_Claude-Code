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

- Catalogue, ordre du 31 octobre : suivre docs/inventaire/campagne-catalogue-pro-2026-10-31.json et le rapport tri-av-professionnel-2026-10-31.md. Les 32 retraits certains sont autorisés/appliqués ; les 21 cas mixtes sont tranchés par la révision 21 en 0.5.26 (16 retraits / 5 conservations). Ne pas rejouer cette révision. Les lots techniques audio 03 / vidéo / lumière restent en attente. Le nouvel ordre exclut les mixettes DJ, dont Xone:92, malgré une conservation antérieure. Ne jamais déduire un statut amateur du seul prix, de la marque ou de l’absence de DMX.
