# AV Diagram

Logiciel de bureau (Windows, macOS, Linux) pour concevoir les synoptiques d'installations audiovisuelles professionnelles (concert, plateau TV, installation fixe). Chaque liaison est typée par signal et vérifiée automatiquement. La liste de câblage, la nomenclature et les alertes sont générées à partir du schéma.

Logiciel gratuit, sous licence [PolyForm Shield 1.0.0](LICENSE.md) : l'usage est libre, y compris dans un cadre professionnel, mais il est interdit de redistribuer ou de vendre un produit concurrent sans l'accord de l'auteur.

## État d'avancement

Ce qui est fait, ce qui est en cours et ce qu'il reste à faire : voir [docs/etat-avancement.md](docs/etat-avancement.md).

## Fonctions disponibles

- Bibliothèque de blocs génériques, par glisser-déposer ou double-clic
- Liaisons typées : 10 familles de signaux, chacune avec sa couleur et son style de trait, et des filtres d'affichage
- Contrôle de compatibilité : signal, niveau (micro, ligne +4 dBu, HP), connecteurs, sens, ports occupés
- Numérotation automatique des câbles (`ZONE-TYPE-NUM`), renumérotation
- Listes générées : câblage, nomenclature (puissance, courant à 230 V, poids), alertes
- Modes Débutant et Expert, palette de commandes (Ctrl+K), thèmes sombre, clair ou système, français et anglais
- Sauvegarde automatique sur l'appareil, fichiers `.avd`, export PNG / SVG / CSV
- Application de bureau 100 % hors ligne, avec les fenêtres natives d'ouverture et d'enregistrement

## Installer

Les installateurs Windows (`.msi`, `.exe`), macOS (`.dmg`) et Linux (`.deb`, `.AppImage`) sont construits automatiquement par GitHub Actions pour chaque version étiquetée `v*`. On les trouve dans l'onglet **Releases** du dépôt.

Ils ne sont pas signés pour l'instant. Au premier lancement :
- sous Windows, SmartScreen affiche un avertissement : cliquer sur « Informations complémentaires » puis « Exécuter quand même » ;
- sous macOS, faire un clic droit sur l'application, puis choisir « Ouvrir ».

## Développer

Il faut Node.js 22 et Rust (https://rustup.rs). Sous Linux, il faut aussi les bibliothèques WebKitGTK (voir `.github/workflows/desktop.yml`).

```bash
npm install
npm run desktop         # lance l'application bureau en mode développement
npm run dev             # interface seule dans le navigateur : http://localhost:5173
npm test                # tests unitaires du modèle et des règles
npm run desktop:build   # installateur pour le système courant, dans src-tauri/target/release/bundle/
```

## Raccourcis

| Raccourci | Action |
|---|---|
| Ctrl+K | Palette de commandes |
| Ctrl+Z / Ctrl+Maj+Z | Annuler / rétablir |
| Ctrl+D | Dupliquer la sélection |
| Suppr | Supprimer la sélection |
| Ctrl+S / Ctrl+O | Enregistrer / ouvrir un fichier `.avd` |
| F | Ajuster la vue |
| Alt+0 à Alt+3 | Tous les signaux / audio / vidéo / réseau et synchro |

## Documentation

- [Cahier des charges](docs/cahier-des-charges.md)
- [Équipements à documenter](docs/bibliotheque-a-documenter.md)
- [Maquette d'origine](docs/maquette/index.html)
- [Écrire une fiche constructeur](src/library/devices/README.md)
