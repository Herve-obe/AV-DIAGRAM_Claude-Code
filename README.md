# AV Diagram

Logiciel de bureau (Windows, macOS, Linux) pour concevoir les synoptiques d'installations audiovisuelles professionnelles (concert, plateau TV, installation fixe). Chaque liaison est typée par signal et vérifiée automatiquement. La liste de câblage, la nomenclature et les alertes sont générées à partir du schéma.

Logiciel gratuit, sous licence [PolyForm Shield 1.0.0](LICENSE.md) : l'usage est libre, y compris dans un cadre professionnel, mais il est interdit de redistribuer ou de vendre un produit concurrent sans l'accord de l'auteur.

## État d'avancement

[Manuel utilisateur illustré](docs/manuel-utilisateur.md) · [Version PDF](public/manuel.pdf) · Captures annotées et légendes, disponibles aussi hors ligne dans l'application.

Version 0.5.0 : assistant IA local facultatif, moteur embarqué et téléchargement guidé de modèles Qwen3. Voir [installation, confidentialité et limites](docs/ia-locale.md). Le manuel illustré et la disposition mémorisée des fenêtres sont conservés. Échanges draw.io, import Visio partiel et conversion DWG facultative via ODA File Converter installé séparément : voir [fonctions et limites](docs/echanges-0.4.2.md). Formation, distribution officielle et tablette en attente pour la première version ; cloud et activation des comptes IA en ligne toujours en attente.

Ce qui est fait, ce qui est en cours et ce qu'il reste à faire : voir [docs/etat-avancement.md](docs/etat-avancement.md).

## Fonctions disponibles

- Bibliothèque de blocs génériques, par glisser-déposer ou double-clic
- Équipements volumineux repliés sur leurs ports reliés, avec accès aux ports libres et vue complète
- Canevas à pages fixes selon le format choisi ; à l'export PDF, mise à l'échelle sur une page ou conservation sur plusieurs pages
- Liaisons typées : 10 familles de signaux, chacune avec sa couleur et son style de trait, et des filtres d'affichage
- Contrôle de compatibilité : signal, niveau (micro, ligne +4 dBu, HP), connecteurs, sens, ports occupés
- Numérotation automatique des câbles (`ZONE-TYPE-NUM`), renumérotation
- Listes générées : câblage, nomenclature (puissance, courant à 230 V, poids), alertes
- [Vue Baies](docs/baies.md) : montage en U avant/arrière, limites de profondeur et de poids, cartes en slot, bilans et export PDF vectoriel
- Modes Débutant et Expert, palette de commandes (Ctrl+K), thèmes sombre, clair ou système, français et anglais
- Enregistrement du fichier principal par Ctrl+S / Cmd+S, sauvegardes de sécurité automatiques, fichiers `.avd`, export PNG / SVG / CSV
- Application de bureau 100 % hors ligne, avec les fenêtres natives d'ouverture et d'enregistrement

## Installer

Les installateurs Windows (`.msi`, `.exe`), macOS (`.dmg`) et Linux (`.deb`, `.AppImage`) sont construits automatiquement par GitHub Actions pour chaque version étiquetée `v*`. On les trouve dans l'onglet **Releases** du dépôt.

Ils ne sont pas signés pour l'instant. Au premier lancement :
- sous Windows, SmartScreen affiche un avertissement : cliquer sur « Informations complémentaires » puis « Exécuter quand même » ;
- sous macOS, faire un clic droit sur l'application, puis choisir « Ouvrir ».

## Développer

Il faut Python 3.12 (manuel et préparation du moteur), Node.js 22 et Rust (https://rustup.rs). Sous Linux, il faut aussi les bibliothèques WebKitGTK (voir `.github/workflows/desktop.yml`).

```bash
npm install
python -m pip install reportlab==4.4.9
python scripts/build-manual.py
python scripts/prepare-local-ai.py
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
- [Utiliser la vue Baies](docs/baies.md)
- [Plan, DXF, Excel et vues techniques (0.4.0)](docs/vues-et-echanges-0.4.0.md)
- [Équipements à documenter](docs/bibliotheque-a-documenter.md)
- [Maquette d'origine](docs/maquette/index.html)
- [Écrire une fiche constructeur](src/library/devices/README.md)

Le PDF du manuel est généré depuis sa source pendant les builds et fourni comme artefact de CI ; il n’est plus suivi en binaire dans Git.
