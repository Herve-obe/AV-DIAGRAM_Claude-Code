# AV Diagram

Éditeur de synoptiques pour installations audiovisuelles professionnelles (concert, plateau TV, installation fixe). Chaque liaison est typée par signal et vérifiée automatiquement. La liste de câblage, la nomenclature et les alertes sont générées à partir du schéma.

Logiciel gratuit, sous licence [PolyForm Shield 1.0.0](LICENSE.md) : l'usage est libre, y compris dans un cadre professionnel, mais il est interdit de redistribuer ou de vendre un produit concurrent sans l'accord de l'auteur.

## Fonctions disponibles

- Bibliothèque de blocs génériques, par glisser-déposer ou double-clic
- Liaisons typées : 10 familles de signaux, chacune avec sa couleur et son style de trait, et des filtres d'affichage
- Contrôle de compatibilité : signal, niveau (micro, ligne +4 dBu, HP), connecteurs, sens, ports occupés
- Numérotation automatique des câbles (`ZONE-TYPE-NUM`), renumérotation
- Listes générées : câblage, nomenclature (puissance, courant à 230 V, poids), alertes
- Modes Débutant et Expert, palette de commandes (Ctrl+K), thèmes sombre, clair ou système, français et anglais
- Sauvegarde automatique sur l'appareil, fichiers `.avd`, export PNG / SVG / CSV
- Application installable qui fonctionne hors ligne (PWA)

## Démarrer

Il faut Node.js 22.

```bash
npm install
npm run dev        # serveur de développement : http://localhost:5173
npm test           # tests unitaires du modèle et des règles
npm run build      # version de production dans dist/
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
