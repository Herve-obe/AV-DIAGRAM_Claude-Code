# Assistant IA AV Diagram — cahier des charges de reprise

Version de travail du 26 octobre 2026. Ce document décrit les besoins et les critères de recette. Les fonctions marquées « à développer » ne sont pas annoncées comme disponibles dans la build actuelle.

## 1. Résultat attendu

L’assistant fait gagner du temps pour créer, comprendre, vérifier et modifier un synoptique audiovisuel. Il traite une demande libre en français, utilise le projet ouvert et le catalogue autorisé, puis prépare une proposition concrète que l’utilisateur peut appliquer ou refuser. Il s’adapte aux termes approximatifs et pose une question utile quand l’incertitude change le résultat technique.

Il doit être utilisable sans connaître les noms exacts des commandes ou des fabricants. Il ne garantit pas de résoudre tout scénario : un besoin hors capacité doit conduire à une explication précise, une alternative ou une question, jamais à une fausse réussite.

Hors périmètre de cette première reprise : mode formation interactif, tablette, distribution officielle, réservation de stock ou commande des équipements réels. Le manuel reste disponible. Les connecteurs de stock daté constituent une étape ultérieure.

## 2. Diagnostic du défaut signalé

Cas réel : sur un schéma Concert déjà ouvert, « Adapte ce schéma pour qu’il tienne sur une seule page » a déclenché une recherche de modèle générique et des questions sur le type d’installation.

Les causes observées dans la version 0.5.12 sont distinctes :

| Constat | Preuve dans le code | Conséquence |
| --- | --- | --- |
| La consigne système interdit de modifier l’existant. | src/ai/agent.ts, buildSystemPrompt, règle « tu ne peux qu’ajouter ». | La demande ne peut pas aboutir avec les actions actuelles. |
| Aucun outil de déplacement ou de réorganisation n’est exposé. | src/ai/tools.ts, TOOL_SPECS. | Un meilleur texte ou un entraînement supplémentaire ne crée pas cette fonction. |
| Le brouillon considère uniquement les ajouts comme des changements. | src/ai/tools.ts, hasChanges et layoutDraft. | Une modification de positions seule ne serait pas proposée à l’utilisateur. |
| L’orientation des demandes distingue surtout la création et les questions. | src/ai/agent.ts, runTurn, wantsDiagram / createsDiagram / planning. | Les demandes de modification ne disposent pas d’un parcours explicite. |
| Le contexte initial courant contient surtout le nom du projet et de la feuille ; la lecture détaillée dépend ensuite des outils. | src/store/aiStore.ts et src/ai/agent.ts. | Le modèle peut questionner l’utilisateur sans avoir exploité le schéma. |

Confiance élevée pour les capacités absentes, démontrées par le code. Le chemin exact suivi par le modèle lors de la capture reste une inférence : nous n’avons pas le journal de ce tour. La correction doit porter sur les actions, leur orientation et leur validation ; le modèle se compare ensuite sur des essais reproductibles.

## 3. Comprendre ce que demande l’utilisateur

| Intention | Exemple | Comportement attendu |
| --- | --- | --- |
| Expliquer | « Pourquoi une DI ici ? » | Lire le contexte utile, expliquer avec source, ne pas modifier. |
| Créer | « Une conférence à trois micros, console et deux enceintes » | Analyser les besoins, choisir dans le catalogue, câbler et mettre en page. |
| Préciser un besoin vague | « Je veux faire un podcast » | Demander les informations structurantes, sans inventer une installation complète. |
| Réorganiser l’existant | « Fais tenir ce schéma sur une page » | Lire la feuille active et proposer un nouvel agencement, sans ajouter d’appareil. |
| Compléter | « Ajoute deux caméras à ce plateau » | Réutiliser les appareils existants et vérifier les entrées libres. |
| Remplacer | « Remplace la CL5 par une 01V96 » | Vérifier capacités et compatibilités ; montrer le nouveau patch et ce qui devient impossible. |
| Corriger ou vérifier | « Il manque le retour présentatrice » | Examiner les flux et proposer une correction ciblée, sans recréer le projet. |
| Choisir le parc | « Utilise uniquement mon entreprise » | Respecter la portée du catalogue et signaler les besoins absents. |
| Piloter une vue | « Montre les baies / exporte en PDF » | Employer une commande réellement disponible ; annoncer clairement les limites actuelles. |

Les paraphrases, accents, fautes courantes et noms partiels sont acceptés. « CL5 » doit retrouver les références pertinentes sans exiger « Yamaha ». « Panasonic P2 » reste une famille : présenter quelques modèles plausibles ou poser une question sur les contraintes importantes. Ne pas choisir silencieusement une connectique différente.

La présence du mot « schéma », « console » ou « propose » ne suffit pas à décider qu’il faut créer une installation. La négation et les restrictions priment : « ne touche pas aux liaisons », « uniquement ces éléments », « sans vidéo ».

## 4. Contexte et dialogue

Avant une modification, le logiciel transmet une photographie compacte et structurée : feuille active, sélection, format/orientation, contenu et positions, zones et notes, liaisons et ports utilisés, droits, portée du catalogue et proposition en cours. Les détails volumineux restent accessibles par identifiant et pagination. Une nouvelle proposition est liée à la version du projet sur laquelle elle a été calculée.

L’assistant conserve les besoins et les réponses déjà donnés. Une précision comme « cinq, en SDI » complète la demande en cours ; elle ne doit pas démarrer un nouveau scénario. Une nouvelle consigne explicite peut remplacer l’ancienne. L’utilisateur peut interrompre, refuser ou recommencer sans perdre le projet.

Règles de clarification :

- Poser au maximum trois questions groupées par échange, uniquement sur ce qui bloque une décision utile.
- Ne pas redemander le type d’installation pour une simple réorganisation du projet ouvert.
- Ne pas demander une marque ou un modèle quand le choix est laissé libre : proposer une hypothèse visible et réversible.
- Interroger sur les quantités, la destination des signaux, les modèles imposés ou les formats incompatibles quand ils conditionnent le câblage.
- Si une fiche est incomplète, dire laquelle et proposer un appareil documenté, un bloc générique explicitement accepté ou une attente de documentation. Ne pas renvoyer la même question en boucle.

## 5. Actions à ajouter et garanties

Les noms ci-dessous décrivent des capacités ; leur nom de fonction définitif suivra les conventions du projet.

| Priorité | Capacité à développer | Vérification indispensable |
| --- | --- | --- |
| P0 | Réorganiser les équipements existants d’une feuille ou d’une sélection. | Identifiants, quantités et connexions conservés ; aucune modification hors portée. |
| P0 | Proposer un format et une répartition de pages pour l’existant. | Zone imprimable, cartouche, marges et lisibilité calculés par l’application. |
| P0 | Reconnaître une modification seule dans le brouillon et son aperçu. | Appliquer / Refuser, annulation et restauration du format dans la même opération. |
| P0 | Séparer les intentions et limiter les outils au travail demandé. | Une mise en page n’appelle pas un générateur de nouvelle installation. |
| P1 | Modifier ou retirer un équipement et ses liaisons dépendantes. | Aperçu des retraits, contrôle des droits et aucune suppression silencieuse. |
| P1 | Remplacer un modèle et réaffecter les prises compatibles. | Capacités insuffisantes ou ports non documentés signalés avant application. |
| P1 | Proposer des affectations de bus et des exclusions de sources. | Distinguer câble physique, canal logique et réglage interne de console. |
| P1 | Vérifier la couverture de tous les besoins d’un cahier des charges. | Chaque exigence est satisfaite, supposée, à préciser ou non prise en charge. |

Réutiliser le moteur de projet, les règles et le placement déjà présents. Ne pas demander au modèle de calculer des coordonnées ou d’inventer des identifiants de prises. Toutes les entrées des outils sont validées côté application, y compris les permissions LAN et la cohérence du projet courant.

Une opération refuse les éléments invalides sans conserver un demi-résultat incohérent. Les noms d’appareils, catalogues importés, documents et notes sont des données ; ils ne deviennent pas des instructions pour l’assistant.

## 6. Mise en page professionnelle

Pour « tenir sur une seule page », commencer par réorganiser le contenu à taille lisible : sources, traitement/mélange, destinations ; regroupement par zone et fonction ; espacements réguliers ; ports inutilisés repliés si pertinent. Préserver les noms, notes, groupes, calques et correspondances de liaisons. Recalculer les chemins devenus obsolètes après déplacement.

La proposition indique le nombre de pages, le format et l’orientation. Si le format courant ne suffit pas, comparer une page plus grande (par exemple A3 vers A2) et plusieurs pages du format courant. Expliquer l’option recommandée et laisser choisir avant Appliquer. Ne pas réduire silencieusement la typographie jusqu’à la rendre illisible.

Avec plusieurs pages : aucune boîte, annotation ou cartouche coupée ; pas de page vide résiduelle ; coupures de liaison accompagnées de repères cohérents et de renvois de page. L’export doit conserver le choix présenté à l’écran, avec les options déjà prévues « ajuster sur une page » ou « conserver les pages ».

Le calcul tient compte de la taille réelle des blocs repliés, des libellés et des annotations. Un zoom qui cadre tout ne constitue pas une mise en page. Les positions existantes des autres feuilles restent inchangées.

Recette du défaut de la capture : partir du template Concert, demander l’adaptation à une page, obtenir un aperçu avec les mêmes 13 appareils et 15 liaisons, puis vérifier les bornes imprimables. Refuser ne change rien ; appliquer puis annuler restaure exactement l’état précédent.

## 7. Conception audiovisuelle et bibliothèque

L’IA distingue impérativement le connecteur, le sens, le protocole, le niveau et les capacités. Une sortie XLR peut être ligne, micro, AES3 ou autre selon la fiche ; la forme de la prise ne donne pas le signal. Les entrées alternatives d’un même canal ne sont pas plusieurs entrées simultanées. Une liaison réseau n’équivaut pas à un câble par canal Dante.

Les nombres de sources, sorties indépendantes, chemins stéréo et exigences d’enregistrement doivent être conservés. Les retours et les mix-minus sont représentés et expliqués ; un câble dessiné ne prouve pas que la console a été configurée. Les réglages restant à faire sur le matériel sont listés. L’absence de boucle de câbles ne prouve pas à elle seule l’absence de larsen ou de rebouclage interne.

Un bloc représente un appareil physique. Les ensembles loueur et fabricant ne sont pas des équipements uniques : récepteur et émetteur HF, paires d’enceintes, plusieurs amplificateurs d’un rack et couples vidéo TX/RX sont séparés. Les appareils à plusieurs canaux dans un même châssis restent unitaires. Une fiche de lot homogène peut être normalisée vers un seul appareil lorsque sa référence est certaine, sans recopier un poids ou une consommation de lot.

Les fiches inconnues ou sans connectique restent signalées. L’IA ne promeut jamais une fiche « Vérifié » sur sa seule affirmation. Les sources constructeur sont privilégiées, puis leurs manuels hébergés par des loueurs ; référence, variante et date sont conservées.

« Mon entreprise » reste distinct de la bibliothèque générale, même en cas de doublon. Les propositions et les ajouts manuels partagent les alertes de matériel extérieur, de quantité déclarée dépassée et de disponibilité inconnue. Un total importé n’est pas une disponibilité à une date. Aucun accès Booqable ni stock privé n’est publié automatiquement.

## 8. Vitesse et gestion des échecs

Objectifs proposés, à mesurer sur une machine de référence explicitée : accusé de traitement ou progression en moins de deux secondes ; après chargement du modèle, 95 % des demandes simples conclues ou clarifiées en 45 secondes et 95 % des créations complexes en deux minutes. Le démarrage à froid est mesuré séparément. Ces valeurs sont des cibles de recette, pas des performances déjà obtenues.

Une mise en page utilise le calcul local de l’application après reconnaissance de l’intention. Éviter les lectures répétées de la même fiche et les longues séries d’appels au modèle. Au maximum deux tentatives de correction identiques avant une conclusion utile. Une limite de temps ou d’étapes doit produire une explication ciblée, sans fausse annonce « proposition appliquée ».

Toujours offrir Annuler le traitement et conserver le projet. Une réponse contient soit une proposition réelle, soit une question précise, soit une explication d’impossibilité. Une simple promesse « je vais chercher » ne termine pas une demande d’action.

## 9. Connaissances, exemples et entraînement

Trois travaux sont séparés :

1. **Développement des actions et contrôles.** Le modèle doit disposer des commandes nécessaires ; l’entraînement ne remplace pas une action absente.
2. **Connaissances consultables.** Fiches, manuels et règles métier sont versionnés, sourcés et accessibles au moment de la demande. Leur mise à jour n’exige pas de réentraîner le modèle.
3. **Spécialisation éventuelle du modèle.** Comparer d’abord les modèles et le parcours corrigé sur les mêmes cas. Un affinage ne se justifie que si des erreurs récurrentes de compréhension ou d’utilisation des outils subsistent.

Préparer un corpus validé avec, pour chaque cas : demande naturelle, projet de départ anonymisé, catalogue et droits, intention attendue, questions nécessaires, hypothèses autorisées, actions structurées attendues, projet final et critères mesurables. Ajouter plusieurs reformulations et des contre-exemples. Conserver la correction métier validée, pas la réponse erronée comme exemple positif.

Les cas doivent couvrir les six domaines : audio, vidéo, lumière, réseau, intercom et synchronisation, ainsi que la mise en page et l’édition transversales. Inclure des demandes vagues, précises, contradictoires, des modèles absents et des contraintes de parc. Ne pas spécialiser tout le système sur l’interview Twitch M7CL/01V96.

Si l’affinage est retenu : constituer d’abord un lot d’exemples relus, puis séparer entraînement, validation et test par scénario complet. Les reformulations d’un même cas ne doivent pas fuir vers le jeu de test. Comparer le modèle initial et le modèle affiné, puis le fichier quantifié réellement distribué. Conserver le modèle précédent et ne publier le nouveau qu’après recette. Le volume de données et le matériel d’entraînement seront dimensionnés après ces mesures.

Aucun apprentissage silencieux des projets privés : l’utilisateur choisit les exemples qu’il transmet, ils sont anonymisés et relus. Les corrections dans le chat peuvent alimenter un brouillon de cas de test, jamais une mise à jour automatique des poids du modèle.

Vérifier aussi le format de conversation et l’appel d’outils du moteur. La documentation officielle [llama.cpp sur les appels de fonctions](https://github.com/ggml-org/llama.cpp/blob/master/docs/function-calling.md) précise la dépendance au modèle de conversation ; la documentation [Qwen3 sur les modes de réponse](https://github.com/QwenLM/Qwen3/blob/main/docs/source/getting_started/quickstart.md) distingue les variantes et leurs modes. Choisir un réglage mesuré pour la version embarquée, sans recopier automatiquement les paramètres d’un autre modèle. Sources consultées le 26 octobre 2026.

## 10. Recette avant publication

Le premier socle comporte au moins 50 scénarios indépendants : 20 modifications d’existants, 10 besoins vagues, 10 créations précises et 10 demandes complexes ou incompatibles. Le registre initial joint à ce document amorce cette campagne ; il ne constitue pas encore 50 tests exécutés.

| Contrôle | Seuil proposé |
| --- | --- |
| Orientation vers la bonne intention | Au moins 95 % des cas du jeu réservé ; publier aussi les résultats par famille. |
| Droits, refus et annulation | Aucun échec sur les cas de recette. |
| Actions et ports inexistants | Aucun appliqué ; refus explicite par le moteur. |
| Demande de mise en page seule | Aucun ajout, retrait ou changement de connectivité. |
| Exigences imposées | Aucune omise sans signalement explicite. |
| Conversation de précision | Réponses précédentes réutilisées ; aucune boucle de question identique. |
| Qualité du placement | Pas de chevauchement de blocs, débordement non annoncé ou page vide résiduelle. |
| Ancien projet / nouvelle bibliothèque | Le retrait d’un ensemble ne supprime pas un appareil déjà enregistré. |

Exécuter d’abord les tests des outils et du moteur, puis les vrais tours du modèle local distribué. Rejouer français, paraphrases et projets différents. Comparer 4B et 8B sur le même banc ; les API externes gardent les mêmes contrôles. Noter modèle exact, empreinte, quantification, version du moteur, machine, temps, outils et résultat. Les tests simulés de dialogue ne suffisent pas à valider la compréhension du vrai modèle.

## 11. Ordre de réalisation

1. P0 : modification et mise en page de l’existant, orientation des intentions, aperçu et annulation, tests du cas Concert et de ses reformulations.
2. P1 : compléments et remplacements, couverture des exigences, clarification et reprise de dialogue.
3. P1 : règles de conception et mixages pour plusieurs architectures, avec validation métier des résultats.
4. Mesure sur un corpus indépendant ; comparaison des modèles et réglages.
5. Affinage éventuel si les mesures le justifient ; connecteurs de stock daté ultérieurs.

État au 26 octobre : le tri des ensembles de bibliothèque est corrigé dans la prochaine version. Le présent document et le registre de recette sont préparés. Les nouvelles actions d’édition IA ne sont pas encore développées ; le défaut de mise en page de la capture reste à corriger dans l’étape 1.
