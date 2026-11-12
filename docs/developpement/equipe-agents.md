# Développement en équipe — AV Diagram

Organisation demandée le 31 octobre 2026. Les agents ci-dessous développent AV Diagram ; ils sont distincts de l'assistant IA local intégré au logiciel.

## Mission et périmètre

Le principal conduit les travaux déjà acceptés pour la première version : fiabilité, compréhension des demandes IA, mise en page, interface, fichiers et collaboration. Il part des défauts reproduits et des critères du cahier des charges, après vérification des fonctions déjà présentes. Une ancienne liste « à développer » ne prouve pas qu'une fonction manque encore.

La première campagne est bornée : établir les contrôles de départ, corriger les deux erreurs d'intention démontrées, diagnostiquer l'échec du banc IA macOS, vérifier l'ensemble et publier le résultat dans la PR en brouillon. D'autres corrections ne rejoignent la file que si les contrôles de cette campagne démontrent leur nécessité. Ne pas inventer du travail pour garder des agents occupés.

Formation, tablette, distribution officielle, cloud et intégrations de stock daté restent en attente. Les validations des catalogues restent séparées : le lot audio 03 attend ses réponses, les lots 01/02 et le D5000 ne doivent pas être rejoués. Le principal rassemble au bilan final les décisions réellement nécessaires ; il poursuit les autres cartes autonomes sans interrompre l'utilisateur.

## Rôles et choix des modèles

| Rôle | Choix de départ | Travail et sortie attendue |
| --- | --- | --- |
| Principal | Agent de ce chat | Qualifie les cartes, attribue les fichiers, relit les preuves, intègre, contrôle et publie. |
| Documentation et vérification courante | `gpt-6-luna`, effort faible ou moyen | Lecture ciblée, exécution des contrôles existants, comptes rendus ; aucun changement métier implicite. |
| Développement IA et corrections métier | `gpt-6.1-sol`, effort moyen | Reproduction, correction minimale, tests ciblés et passage de relais. |
| Diagnostic précis de CI | `gpt-6.1-sol`, effort faible | Lire le journal utile, séparer cause démontrée et hypothèse, proposer l'action minimale. |
| Révision difficile après échec | `gpt-6.1-sol`, effort élevé | Une seconde analyse avec la reproduction et le diff, sans recommencer l'exploration générale. |

Ces choix utilisent les modèles disponibles dans la session, pas une promesse de tarif. Réévaluer leur disponibilité à la reprise. Ne pas utiliser systématiquement le modèle le plus lourd. Si une tâche simple exige une décision métier nouvelle, le principal la requalifie avant de changer de modèle.

Les agents sont temporaires : réutiliser un agent encore disponible ou en recréer un à partir de sa carte. Leur présence dans une ancienne conversation ne signifie pas qu'ils tournent encore. Aucun processus externe ni abonnement supplémentaire n'est installé pour les maintenir actifs.

## Répartition sans conflits

Chaque carte du fichier voisin indique propriétaire, modèle, état, critères, fichiers autorisés, dépendances et preuves. Les états sont `ready`, `running`, `review`, `complete` et `blocked`. `complete` signifie intégré et contrôlé sur la branche de travail ; cela ne signifie pas fusionné dans la branche principale ni distribué officiellement.

Le principal seul modifie versions, dépendances, traductions partagées, workflows, tableau de travail et description de PR. Deux agents n'écrivent jamais le même fichier en parallèle. L'agent QA écrit ses rapports hors du produit et attend la fin des écritures pour le contrôle final. Si deux travaux dépendent d'un même fichier, les exécuter en séquence. Réutiliser le checkout approprié ; ne pas créer une nouvelle copie du dépôt par agent.

Un passage de relais tient dans un court fichier : problème reproduit, fichiers changés, test qui échouait, test réussi, limites et prochaine action. Le principal relit le diff et la logique, pas uniquement la conclusion de l'agent. Toute sortie d'agent reste à vérifier.

## Contrôles et relances

1. Reproduire le défaut et borner la correction. Conserver le contenu initial des fichiers concernés.
2. Faire exécuter la correction avec des tests ciblés, puis demander une révision au principal.
3. Après la dernière écriture, exécuter lint, types, tests et compilation conformément à `CLAUDE.md`. Les avertissements historiques sont distingués des nouveaux échecs. Les essais de modèle réel ignorés ne comptent jamais comme réussis.
4. Regrouper les changements contrôlés dans une seule publication. Contrôler les différences avec le commit distant, l'absence d'autres fichiers et le parent attendu. Ne pas faire de reset ou de commit global du checkout historiquement décalé.
5. Lire les résultats GitHub correspondant au commit publié. Une build disponible et un banc IA réussi sont deux informations distinctes.

Maximum deux tentatives de correction par carte, puis une révision par le principal. Une erreur d'authentification, une donnée constructeur inconnue ou l'absence d'une permission ne se résout pas par des relances. Ne pas augmenter une limite de temps pour transformer une panne en succès. Un échec de CI apparemment transitoire peut être relancé une seule fois, sur le seul job concerné, avec son identifiant enregistré. Un changement de code réclame un nouveau contrôle ; un état inchangé n'en réclame pas.

Le principal ne fusionne pas la PR, ne crée pas de release publique et ne publie pas de stock privé. Il prépare le résultat et les points restant à approuver pour le bilan final. Pas d'API payante ni de téléchargement local massif pour ce fonctionnement d'équipe.

## Suivi automatique et consommation

Un suivi périodique dans ce chat reprend le tableau, lit les derniers passages de relais et traite uniquement la file active. La cadence initiale est d'une heure : elle évite une interrogation permanente tout en permettant de reprendre les tâches et de constater la fin d'une CI longue. Le suivi réemploie les contrôles associés au même contenu et ne lance pas de nouvelle recherche générale.

À chaque réveil : contrôler qu'un travail similaire n'est pas déjà actif ; intégrer les preuves disponibles ; relancer seulement les tâches admissibles ; mettre à jour le tableau. Quand il ne reste que des décisions utilisateur ou que la campagne est terminée, enregistrer le bilan et mettre le suivi en pause. Un dossier bloqué n'autorise pas à lancer d'autres chantiers hors périmètre.

Ce suivi dépend de l'environnement local Codex et de l'accès au dépôt. Ce n'est pas un service hébergé qui continue sur un ordinateur éteint. Si l'automatisation n'est pas disponible, conserver les cartes pour la prochaine reprise et le signaler, sans prétendre qu'un agent tourne en permanence.

Conserver les journaux en local ; publier uniquement le bilan utile. Les appels de ces outils ne fournissent pas nécessairement une facturation détaillée : ne pas inventer des économies chiffrées ou un plafond de crédits garanti. Les limites opérationnelles sont le nombre d'agents, les périmètres courts, les relances bornées et l'arrêt de la campagne finie.

## Point de départ et preuves

- Base publiée : 0.5.23, commit `c222419bd1108cc880b66637abbf73ffe8ef3c84`, branche `codex/ia-locale` ; PR #4 en brouillon.
- Dernière CI de cette base : vérifications courantes, Windows natif, installation Windows et IA réelle Windows réussis. Le job macOS atteint la limite du banc IA réel ; cela ne démontre pas une panne de démarrage de l'application.
- Dossier local de cette campagne : `C:/Users/herve/Documents/Codex/2026-10-12/est/work/equipe-agents-2026-10-31` (baselines et passages de relais).
- Tableau lisible par les agents : [equipe-agents.json](equipe-agents.json).
