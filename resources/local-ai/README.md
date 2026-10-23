# Ressources de l'assistant local

Les modèles ne sont pas inclus dans l'installeur. `models.json` fixe leurs versions, tailles,
licences et SHA-256 officiels, vérifiés le 21 octobre 2026 auprès des dépôts Qwen sur Hugging Face.
Les minima de mémoire sont des repères conservateurs pour AV Diagram, pas des garanties de vitesse.

`python scripts/prepare-local-ai.py` prépare le moteur llama.cpp pour la plateforme courante
(les deux architectures pour macOS). Les archives officielles sont vérifiées avec les SHA-256
de `engines.json` avant extraction. Aucun script provenant de ces archives n'est exécuté.
Les contrôles natifs et les builds de CI appellent ce script ; les répertoires générés ne sont pas suivis.

Le moteur est MIT ; sa licence et les notices fournies sont conservées dans l'application.

Sous Windows, la préparation copie les DLL x64 du répertoire Redist de Visual Studio Build Tools dans le dossier du moteur et conserve une notice Microsoft. Ces fichiers restent ignorés dans Git. Les moteurs macOS officiels b11747 exigent macOS 13.3 ; cette limite est vérifiée avant le téléchargement du modèle.
