# Audit de bibliothèque et retours de test — 0.5.12

25 octobre 2026. Base : version 0.5.11.

Les 2 156 fiches constructeur ont été recensées et relues pour leur nature, leur famille, leurs sources et la cohérence des données déclarées. Le catalogue actif conserve 1 792 de ces références et les 30 blocs génériques. Les écrans de projection, les optiques de vidéoprojecteurs et les machines à effets sont conservés selon le choix de l’utilisateur.

364 références sont écartées de la bibliothèque et des recherches IA : supports et fixations mécaniques, câbles seuls, habillages, consommables, licences seules, prestations et équipements de confort hors périmètre audiovisuel. Le retrait est explicite par identifiant dans src/library/excluded.json. Les fiches sources restent archivées dans le dépôt et les équipements déjà placés restent enregistrés dans les anciens .avd.

127 références sont reclassées : contrôleurs MIDI, processeurs DJ, amplificateurs, consoles et interfaces lumière, contrôleurs vidéo, CCU, matrices SDI, boîtiers de scène, interfaces et cartes. Les décisions avant/après de toutes les références figurent dans les fichiers détaillés référencés par [l’index de l’audit](catalogue-audit-2026-10-25.json). Le rapport est réparti en lots de 100 références pour faciliter sa lecture et sa vérification.

Les cartes d’extension utilisent leur famille Module et leur type mécanique. Les emplacements internes de 25 châssis deviennent des slots et ne sont plus proposés comme prises à câbler. Les cartes AxC utilisent les sept slots documentés du châssis AVBx7. Les sorties ligne des consoles ne sont pas déduites de la forme XLR.

Les puissances de sortie audio ne sont plus utilisées comme consommation électrique sur les enceintes concernées. Les valeurs non établies restent absentes. Les textes HTML mal décodés et l’alias erroné MY16AE de MY16-ES64 sont corrigés. Le doublon non vérifié ETC Source Four LED Series 2 Lustr est écarté au profit de la fiche constructeur. Les embases AT8601 (support mécanique) et AT8615 (entrée/sortie XLR documentées) sont distinguées.

Ce contrôle ne constitue pas une nouvelle certification constructeur de toutes les caractéristiques. Les fiches à documenter gardent leur statut Communauté et leur signalement de connectique incomplète. Aucun modèle n’est promu Vérifié automatiquement.

## Template concert

La liaison d’erreur volontaire micro vers entrée ligne est retirée. Deux sorties ligne distinctes de la console alimentent les entrées gauche et droite de l’enregistreur. Les fixtures de tests des alertes conservent leurs erreurs volontairement créées, séparées du projet livré.

## Retours de la campagne C01

- INS-02/03 : retour à l’accueil après fermeture de la configuration IA déclenchée par l’installeur.
- PRO-02 : message informatif avec le chemin du dossier numéroté réellement créé.
- PRO-03 : cadrage et zoom mémorisés localement par projet et feuille. Ajout de Fichier > Fermer le projet avec protection des modifications.
- PRO-04 : Reprendre le dernier projet fonctionne aussi quand la copie de récupération a été abandonnée. Une récupération non enregistrée déjà chargée n’est pas remplacée par le fichier du disque.

Les statuts du classeur rempli par l’utilisateur restent inchangés. Ces parcours doivent être rejoués sur l’installeur de test 0.5.12.
