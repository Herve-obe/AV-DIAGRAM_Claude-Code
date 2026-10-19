# Installeur Windows

`installer.nsi` reprend le modèle de Tauri CLI **2.11.5**, sous licence MIT
(voir `LICENSE-TAURI.txt`) :
https://github.com/tauri-apps/tauri/blob/tauri-cli-v2.11.5/crates/tauri-bundler/src/bundle/windows/nsis/installer.nsi

La seule modification fonctionnelle est dans `PageLeaveReinstall`, après le
contrôle du résultat de la désinstallation : quitter l'installeur si l'utilisateur
a choisi **Uninstall** pour la même version. Une annulation ou une erreur revient
au choix de maintenance ; une mise à jour, une migration WiX ou le mode passif
conservent leur parcours d'installation.

Le CLI est figé dans `package.json` et le verrou npm pour garder le modèle et ses
fichiers d'aide cohérents. Lors d'une mise à jour du CLI, comparer le modèle avec
la nouvelle version amont et conserver ce correctif tant qu'il y est nécessaire.

La CI exécute `scripts/test-windows-installer.py` sur une machine Windows jetable :
installation neuve, choix Réinstaller, annulation de la désinstallation, puis
désinstallation complète sans réouverture de l'installation. Elle vérifie aussi
que désinstaller avant une mise à jour mène toujours au choix du dossier.
Ce test refuse de s'exécuter hors GitHub Actions ou si AV Diagram est déjà installé.
