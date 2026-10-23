# Assistant IA — 0.5.11

Reprise demandée le 21 octobre 2026. Fonction expérimentale, facultative et désactivée par défaut.
L'application fonctionne entièrement sans assistant. La lecture automatique de riders, le cloud
des projets et l'affinage d'un modèle ne sont pas inclus. Une API IA externe est maintenant configurable.

## Installation utilisateur

**Windows, pendant l'installation** : cocher « Installer l'IA locale », choisir le dossier des modèles,
puis terminer. AV Diagram s'ouvre sur la configuration locale et télécharge Qwen3 4B avec progression
et annulation. Le test des outils puis l'activation restent explicites. La case est décochée par défaut ;
une installation silencieuse ne télécharge rien.

**Plus tard, sur Windows ou Mac** : Paramètres → Assistant IA → Installer / configurer l'IA → IA locale.
Choisir le dossier et le modèle, télécharger, charger et tester, activer. Changer de dossier ne déplace
ni ne supprime les anciens modèles ; sélectionner à nouveau l'ancien dossier permet de les retrouver.
Le bouton « Assistant IA » reste grisé avant activation et ouvre le chat une fois l'IA configurée.
Le test appelle réellement `check_project` sur un document fictif avant d'autoriser l'activation.
Windows x64 utilise le processeur et embarque ses DLL Visual C++ dans le dossier du moteur (aucune installation système supplémentaire). macOS embarque les moteurs Intel et Apple Silicon, qui nécessitent macOS 13.3 ou plus. La version minimale du moteur est vérifiée avant tout téléchargement ; le reste d’AV Diagram conserve sa compatibilité macOS 12.3.
Le modèle est partagé entre les projets de ce poste, dans le dossier choisi (par défaut les données locales de l'application),
sans être copié dans les `.avd` ni dans `Save Back Up`.

| Modèle | Taille exacte | Repère de RAM installée |
|---|---:|---:|
| Qwen3 4B Q4_K_M | 2 497 280 256 octets | 8 Go minimum conseillés |
| Qwen3 8B Q4_K_M | 5 027 783 488 octets | 16 Go minimum conseillés |

Ces repères ne sont pas des mesures de performance ni une garantie avec d'autres applications ouvertes.
Les réponses sur CPU peuvent demander plusieurs minutes. L'interface affiche la mémoire détectée.
Les machines disposant de moins de mémoire reçoivent un avertissement ; la mémoire inconnue ne bloque pas
le mode avancé. Les serveurs existants Ollama, LM Studio et llama.cpp restent disponibles.

## Installation Windows personnelle ou partagée

L’installeur propose une installation pour le compte courant ou pour tous les utilisateurs. Le second mode utilise Programmes et nécessite les droits administrateur. Les mises à jour retrouvent le dossier et la portée existants ; les déploiements silencieux acceptent `/CurrentUser` ou `/AllUsers`, avec `/D=CHEMIN` en dernier argument pour imposer le dossier du logiciel.

Le logiciel et son moteur sont partagés en mode tous les utilisateurs ; les modèles, conversations et réglages restent propres au compte. Le dossier des modèles est indépendant du dossier du logiciel et doit être accessible en écriture par le compte qui utilisera l’assistant. Si un administrateur installe pour une autre personne, configurer l’IA depuis le compte de cette personne dans Paramètres après installation.

## Données, téléchargements et arrêt

Le moteur llama.cpp b11747 est embarqué depuis les archives officielles dont les SHA-256 sont figés
dans `resources/local-ai/engines.json`. Aucun modèle n'est dans l'installeur. Le téléchargement d'un
modèle utilise exclusivement une URL Qwen à révision figée et les domaines HTTPS de Hugging Face.
Il ne contient aucune donnée du projet. Les fichiers reçus sont limités à la taille attendue et
vérifiés par SHA-256 ; une empreinte incorrecte empêche leur utilisation. Un fichier partiel peut
être repris avec une requête Range ; la réponse et le fichier complet sont contrôlés.

Le moteur embarqué démarre avec `--offline`, sans interface web, agent, outil système ou MCP.
Il écoute uniquement sur 127.0.0.1, sur un port choisi par le système. Une clé éphémère reste dans
la partie native ; les requêtes locales contournent les proxies pour garder les données sur le poste.
Les conversations ne sont pas enregistrées dans le projet. Changer de projet efface le dialogue ;
les réponses tardives sont ignorées. Arrêter interrompt le moteur géré et la réponse ; désactiver
l'assistant ou quitter l'application arrête également le moteur.

La configuration et les tests n'envoient pas de projet à un fournisseur en ligne. La lecture d'une
licence ouvre seulement sa page à la demande. Les options de compte du prototype sont conservées
dans le code, sans nouvelles fonctionnalités ni essais de fournisseur en ligne dans cette reprise.

## Propositions et connaissances

Les seuls outils d'action ajoutent un équipement connu de la bibliothèque ou une liaison entre des
ports existants. Le moteur de règles refuse les erreurs de liaison ; les avertissements restent
visibles. Les droits de collaboration sont contrôlés pendant la préparation puis à l'application.
Un projet modifié rend le brouillon caduc. Appliquer est une seule étape d'annulation.
Une proposition est limitée à 50 équipements et 100 liaisons.

Le manuel est recherché localement par mots-clés et chapitres, avec des extraits bornés et leur source.
Ce premier index ne contient ni fiches constructeur PDF personnelles ni corpus externe. Les champs
documentaires des fiches de la bibliothèque restent consultables. Une donnée manquante ou une fiche
Communauté reste incertaine ; l'assistant peut malgré ces consignes produire une réponse erronée.
Il faut vérifier toute conception proposée. Les gros schémas sont lus par pages ; l'historique ancien
et les gros résultats sont limités pour ne pas saturer le modèle.

## Sources et licences

- [Moteur officiel llama.cpp b11747](https://github.com/ggml-org/llama.cpp/releases/tag/b11747), MIT.
- [Qwen3 4B officiel](https://huggingface.co/Qwen/Qwen3-4B-GGUF/tree/bc640142c66e1fdd12af0bd68f40445458f3869b), Apache-2.0.
- [Qwen3 8B officiel](https://huggingface.co/Qwen/Qwen3-8B-GGUF/tree/7c41481f57cb95916b40956ab2f0b139b296d974), Apache-2.0.

Métadonnées et licences consultées le 21 octobre 2026, copies des licences dans `docs/third-party/`.
Le build conserve les notices des archives, notamment LLVM OpenMP sous Windows.

## Vérification développeur

Avant un build : installer ReportLab 4.4.9 et lancer `python scripts/build-manual.py` ; pour le natif, lancer aussi `python scripts/prepare-local-ai.py`. Le PDF est généré en CI depuis le Markdown, sans binaire PDF suivi dans Git. Sur Mac, `python3` convient aussi.
Les moteurs sont vérifiés avant extraction ; les liens d'archive sont lus en mémoire et matérialisés
comme fichiers, jamais extraits avec leur chemin. Aucun téléchargement de programme au lancement.

`python scripts/test-local-ai.py --directory DOSSIER_DE_TEST` vérifie le vrai Qwen3 4B, le démarre
sur une adresse locale éphémère, lance les appels d'outils de l'application sur un projet fictif,
puis arrête son processus. Ce contrôle requiert environ 2,5 Go de téléchargement et de disque.
Il ne lance ni AV Diagram ni l'installeur et n'utilise aucun fichier de l'utilisateur.

Restent à éprouver : qualité sur des projets métier variés, vitesse selon les postes, modèle 8B
en usage réel, téléchargement sur les réseaux filtrés et essais collaboratifs sur plusieurs machines.

Les DLL Microsoft proviennent exclusivement du répertoire Redist de Visual Studio, sans modification ; leur notice accompagne le moteur. Le test réel vérifie qu’elles sont chargées depuis ce dossier. Le contrôle NSIS vérifie aussi le moteur installé. Voir [déploiement local Microsoft](https://learn.microsoft.com/en-us/cpp/windows/determining-which-dlls-to-redistribute).

## API externe et entraînement

Paramètres → Assistant IA → Installer / configurer l'IA → IA externe via API : choisir Claude/Anthropic,
OpenAI, Gemini, Mistral ou un serveur compatible OpenAI. La clé reste dans le trousseau système ;
pour un serveur personnalisé elle est liée à son adresse. Une adresse distante doit être en HTTPS.
Le choix du modèle, l'accord d'envoi des données et un test des outils sur un schéma fictif précèdent
l'activation. Aucun modèle local n'est nécessaire. Une clé API et sa facturation sont indépendantes
d'un abonnement à une interface de discussion. Aucun compte payant n'a été utilisé pour nos tests :
les parcours API sont vérifiés avec un transport simulé ; la configuration vérifie le service réel choisi.

Qwen3 est déjà entraîné. AV Diagram lui fournit le manuel, la bibliothèque et des outils pour consulter
le schéma : il n'apprend pas les conversations et ne modifie pas ses poids. Un affinage futur demanderait
des exemples anonymisés de demandes et de réponses validées, un jeu d'essais séparé et un entraînement
sur du matériel adapté ; il ne remplacerait jamais les fiches constructeur ou les règles de validation.

## Cahier des charges interview et live — 0.5.7

Le scénario de référence est conservé dans `src/ai/fixtures/interview-live.txt`. Qwen3 identifie les consoles et les quantités ; `propose_audio_production` délègue le câblage à `src/model/audioProduction.ts`. Les choix facultatifs ne sont exposés au petit modèle que pour des références réellement citées, avec une liste d’identifiants autorisés. Le chemin réussi nécessite un appel modèle, puis une vérification locale. Le parcours est borné à trois étapes en cas d’échec.

Ce premier parcours traite M7CL-48ES / 01V96, 1 à 10 micros interview, une voix live statique, une guitare sur ampli reprise au micro, 1 à 8 sorties machines chacune via DI, deux casques stéréo indépendants via HA8000, un lecteur PC/interface, deux enceintes actives, une fonction vidéo et un enregistreur stéréo. Il accepte 0, 1 ou 2 SB168-ES, sous réserve du nombre de prises documentées. Les trois micros interview, deux sorties machines et une stagebox sont des hypothèses par défaut visibles, pas des informations déduites avec certitude. Les autres architectures ne sont pas annoncées comme couvertes.

Les six mixages logiques sont vérifiés contre les boucles et les exclusions transitives. Le patch des entrées, des sorties, les réglages AUX, les exclusions, le choix des modes d’entrée et les consignes restent dans les notes éditables des consoles et des trois zones, ainsi que dans les notes de liaison. Ce sont des consignes de conception, pas une commande des appareils ; les modifications ultérieures de ces textes ne sont pas revérifiées automatiquement comme une matrice de console. Le format `.avd` reste à 1 ; les anciens identifiants de prises sont conservés. Les modes optionnels de prise sont contrôlés à l’import.

Le test réel vérifie ce cahier des charges en plus du plateau SDI et des questions de clarification. Les fichiers de test sont fictifs et les équipements génériques sont explicitement signalés. Le matériel physique, le son, les API payantes et le modèle 8B restent à tester.

## Besoins généraux, mise en page et parc — 0.5.11

`plan_diagram` reçoit but, rôles, quantités, contraintes, hypothèses et au maximum trois questions. La recherche groupée fournit des candidats autorisés. `propose_system` choisit ensuite des prises libres documentées pour les flux entre rôles ; une erreur refuse atomiquement cet appel. Les quantités du plan et les références exactes reconnues sont contrôlées. Les exemples vagues doivent préciser participants, destinations et matériel imposé ; un choix libre devient une hypothèse visible. La qualité s’évalue aussi sur des demandes hors parcours spécialisés ; aucune garantie pour tout cahier des charges.

La mise en page calcule des variantes locales, de la taille courante aux formats supérieurs. Les notes sont réparties après les équipements ; le sélecteur indique les pages à 100 %. Changer l’aperçu ne modifie pas le projet et ne rappelle pas le modèle. Appliquer et annuler concernent ensemble les ajouts et le format.

Le catalogue IA peut être limité à Mon entreprise. En mode tous les modèles, une fiche de l’entreprise est prioritaire sur son doublon commun. Les mêmes contrôles de parc alimentent Alertes, l’aperçu IA et check_project : origine externe, quantité totale dépassée et disponibilité inconnue. Les quantités possédées ne sont pas des disponibilités et ne réservent rien. Pas encore de connecteur ERP/Booqable ou de réservation datée.
