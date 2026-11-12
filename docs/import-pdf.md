# Import d'un synoptique PDF venu d'un autre logiciel (2026-10-08)

Bouton PDF de la barre du haut : « Importer un synoptique PDF (autre logiciel) ». Le fichier est lu
sur le poste (pdf.js, aucune donnée envoyée), interprété, puis montré dans une fenêtre de
vérification avant d'être ajouté au projet sur une **nouvelle feuille** (Ctrl+Z annule l'import).

## Ce qui est reconnu

| Dans le PDF | Dans AV Diagram |
|---|---|
| Cadre (rectangle, coins arrondis compris) contenant du texte | Équipement ; 1re ligne = nom, 2e = modèle, autres = notes |
| Cadre qui en contient plusieurs autres (zone, cartouche de page) | Ignoré |
| Trait (ou suite de traits) qui relie deux cadres | Liaison |
| Texte au bord d'un cadre, à l'arrivée d'un trait | Port (nommé comme dans le document) |
| Texte en petit au bord d'un cadre, sans trait | Port non relié |
| Texte posé sur un trait | Repère d'origine (ex. A001), longueur (« 20 m »), type de câble, gardés dans les notes de la liaison |
| Fabricant + modèle d'une fiche de la bibliothèque écrits dans le cadre | Fiche proposée (ports du constructeur, ceux du dessin rattachés par leur nom : « IN 1 » = « Input 1 ») |

## Ce qui est déduit, et signalé comme tel

- Sens d'un port : mot du nom (IN, OUT, PGM, Entrée...) ; sinon côté du cadre (gauche = entrée,
  droite = sortie), indiqué « d'après le côté ».
- Signal d'une liaison : mot-clé sur la liaison ou sur ses ports (SDI, HDMI, Dante, AES, MADI, DMX,
  Word clock, RJ45...) ; sinon couleur du trait (même couleur qu'une liaison identifiée) ; sinon
  domaine des deux équipements ; sinon « à vérifier ». Modifiable dans la fenêtre.
- Famille d'un équipement : fiche reconnue, sinon mots du cadre (console, ampli, caméra, mélangeur...).
- Connecteur : seulement s'il est écrit (XLR, BNC, RJ45, speakON...) ou impliqué par le signal
  (SDI : BNC) ; sinon « non précisé ».
- Un cadre sans aucune liaison (cartouche, légende) est décoché par défaut.

## Limites

- PDF vectoriel seulement (export direct depuis Visio, AutoCAD, Vectorworks, draw.io, Illustrator,
  Excel...). Une page scannée ou exportée en image est signalée : rien n'est inventé. Une lecture par
  l'assistant IA (modèle capable de lire les images) est une piste pour plus tard.
- Tracés reliés à un seul cadre (renvoi vers une autre page) ou à plus de deux (bus, répartiteur
  dessiné en trait) : comptés et non importés.
- Équipements dessinés sans cadre (symbole seul, pictogramme) : non reconnus.
- Disposition : position du document mise à l'échelle, blocs décalés vers le bas s'ils se
  chevauchent.

## Code et essais

- `src/io/pdfImport/extract.ts` : lecture pdf.js (textes, rectangles, traits, couleurs).
- `src/io/pdfImport/interpret.ts` : interprétation, sans dépendance à pdf.js.
- `src/io/pdfImport/build.ts` : création de la feuille, des équipements et des liaisons.
- `src/ui/PdfImportDialog.tsx` : aperçu de la page avec ce qui a été reconnu, listes modifiables.
- Essai : `src/io/pdfImport/fixtures/synoptique-externe.pdf` (produit par Chromium depuis le SVG
  `synoptique-externe.html`) : 8 équipements, 7 liaisons, repères et longueurs lus.
