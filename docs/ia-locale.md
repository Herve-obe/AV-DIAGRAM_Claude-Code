# Assistant IA local — 0.5.0

Reprise demandée le 21 octobre 2026. Fonction expérimentale, facultative et désactivée par défaut.
L'application fonctionne entièrement sans assistant. Les comptes en ligne, le cloud, la lecture
automatique de riders et l'affinage d'un modèle ne sont pas inclus dans cette reprise.

## Installation utilisateur

Assistant → Configurer → IA locale : choisir le modèle, télécharger, charger et tester, activer.
Le test appelle réellement `check_project` sur un document fictif avant d'autoriser l'activation.
Windows x64 utilise le processeur ; macOS embarque les moteurs Intel et Apple Silicon.
Le modèle est partagé entre les projets de ce poste, dans les données locales de l'application,
sans être copié dans les `.avd` ni dans `Save Back Up`.

| Modèle | Taille exacte | Repère de RAM installée |
|---|---:|---:|
| Qwen3 4B Q4_K_M | 2 497 280 256 octets | 8 Go minimum conseillés |
| Qwen3 8B Q4_K_M | 5 027 783 488 octets | 16 Go minimum conseillés |

Ces repères ne sont pas des mesures de performance ni une garantie avec d'autres applications ouvertes.
Les réponses sur CPU peuvent demander plusieurs minutes. L'interface affiche la mémoire détectée.
Les machines disposant de moins de mémoire reçoivent un avertissement ; la mémoire inconnue ne bloque pas
le mode avancé. Les serveurs existants Ollama, LM Studio et llama.cpp restent disponibles.

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
