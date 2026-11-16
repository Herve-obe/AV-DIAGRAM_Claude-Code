# Outils de création des fiches de bibliothèque

Scripts utilisés pour créer les fiches `src/library/devices/*.json` à partir de la documentation des constructeurs.
Ils ne font pas partie de l'application.

- `specs.py URL` : extrait les tableaux de caractéristiques d'une page web (L-Acoustics, Yamaha…).
- `nextdata.py URL` : extrait le texte des sites Next.js.
- `render.mjs URL` : affiche la page dans Chromium (Playwright) et renvoie son texte (guides Shure, Blackmagic).
  Il fait confiance à la seule clé de l'autorité du proxy de l'environnement cloud (`--ignore-certificate-errors-spki-list`) :
  à adapter ou retirer hors de cet environnement.
- `links.mjs URL` : liste les liens « techspecs » d'une page (codes produit Blackmagic).
- `generateurs/` : un script par marque ; `common.py` fournit `P()` (port), `src()` (source), `sheet()` (écrit la fiche),
  `mic()`. Lancer depuis ce dossier : `python3 lacoustics.py`. Le chemin de sortie est fixé dans `common.py` (`DEV`).

Blackmagic : chaque fiche technique existe en PDF à l'adresse
`https://www.blackmagicdesign.com/api/print/to-pdf/products/<gamme>/techspecs/<code>?filename=x.pdf`
(le site limite le nombre de requêtes : espacer les téléchargements).
