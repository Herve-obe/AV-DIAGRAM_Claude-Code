# Installeur Windows

`installer.nsi` reprend le modèle de Tauri CLI **2.11.5**, sous licence MIT (voir `LICENSE-TAURI.txt`) :
https://github.com/tauri-apps/tauri/blob/tauri-cli-v2.11.5/crates/tauri-bundler/src/bundle/windows/nsis/installer.nsi

Personnalisations à conserver lors d’une mise à jour du modèle :

- Installation personnelle ou pour tous les utilisateurs, via le mode NSIS `both`. Le choix initial reste personnel ; le registre mémorise le mode et le dossier de chaque portée. Le paramètre `/D` est conservé malgré la réinitialisation de `MULTIUSER_INIT`.
- Désinstallation dans la bonne portée, depuis Windows, l’installeur ou directement `uninstall.exe`, y compris si deux copies coexistent. Un choix explicite de désinstallation de la même version quitte ensuite l’installeur. Annulation et mise à jour gardent leur parcours.
- IA facultative, dossier des modèles séparé du logiciel et lancement avec `RunAsUser`. Le téléchargement se fait dans l’application ; aucun modèle n’est inclus dans l’installeur.

Le CLI est figé dans `package.json` et le verrou npm pour garder le modèle et ses fichiers d’aide cohérents.

La CI exécute `scripts/test-windows-installer.py` sur une machine Windows jetable : choix des deux modes, dossier Programmes, dossier IA utilisateur, installation et désinstallation partagée sans toucher à la copie personnelle, installation personnelle à un emplacement imposé, réinstallation, annulation et mise à jour. Le test refuse de s’exécuter hors GitHub Actions, si un profil AV Diagram existe, ou si une installation personnelle/partagée est déjà présente.
