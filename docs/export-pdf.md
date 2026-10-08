# Export PDF professionnel (2026-10-08)

Menu Exporter, « Planche PDF ». La fenêtre s'ouvre sur le **cartouche** à remplir, puis Mise en
page, Filigrane, Protection. Les champs et réglages sont gardés dans le projet ; les mots de passe
ne sont jamais enregistrés.

## Cartouche

Champs inspirés de l'ISO 7200:2004 (Documentation technique de produits, champs de données des
cartouches et en-têtes). Je n'ai pas pu consulter le texte de la norme (document payant) : la liste
des champs obligatoires est à vérifier sur la norme si une conformité stricte est exigée.

| Zone | Champs |
|---|---|
| Colonne gauche | Logo, propriétaire légal (société) et mention (adresse, site) |
| Titre | Nom du projet, titre complémentaire (événement, nom de la feuille) |
| Ligne 2 | Client, lieu, date de la prestation |
| Ligne 3 | Établi par, approuvé par, type de document, statut (en cours, pour approbation, approuvé, tel que réalisé, annulé) |
| Ligne 4 | N° d'identification, indice, date d'émission (date du poste, automatique), langue, feuille (n / total, repère de page) |
| Ligne 5 | Classification (diffusion), référence technique |
| Au-dessus | Historique des indices (4 derniers : indice, date, modification, par) |

Cartouche de 180 x 48 mm : il tient sur la largeur d'un A4. **Modèle du poste** (Paramètres, onglet
« Modèle de cartouche ») : société, mention, logo (PNG, JPEG ou SVG, réduit à 600 px), établi par,
approuvé par, type de document, classification, langue, préfixe des numéros (ex. SYN-). Il remplit
les champs vides de chaque projet.

## Mise en page

- Formats ISO 216 : A4, A3, A2, A1, A0, paysage ou portrait.
- **Mise à l'échelle** : chaque feuille du projet tient sur une page.
- **Taille fixe** : le schéma est imprimé à l'échelle choisie (100 % : 1 unité du schéma = 0,25 mm)
  et découpé en pages repérées A1, B1, A2... ; le découpage est dessiné en pointillés sur le
  canevas.
- Changer de format (Paramètres ou fenêtre d'export) ouvre un choix : mettre à l'échelle (avec la
  réduction obtenue) ou garder la taille (avec le nombre de pages).

## Filigrane

Présent ou non ; texte avec champs ({client}, {project}, {date}, {revision}, {number}) ; position
(mosaïque en diagonale, grande diagonale, bandeau haut ou bas, coin) ; zone (schéma : incrusté dans
l'image ; planche entière : texte par-dessus tout, cartouche compris) ; taille ; couleur ; opacité ;
application aux exports PNG et SVG.

## Protection

Chiffrement **AES-256** (PDF 2.0, ISO 32000-2, gestionnaire standard V5 / R6), fait par
l'application de bureau (`src-tauri/src/pdfsec.rs`, bibliothèque lopdf), à la place du RC4 de la
bibliothèque PDF de l'interface.

- Droits : impression, copie, modification.
- Sans mot de passe d'ouverture : le PDF s'ouvre partout, les droits sont appliqués par les lecteurs ;
  c'est une dissuasion quel que soit l'algorithme (la clé se déduit du mot de passe vide).
- Avec mot de passe d'ouverture : contenu illisible sans lui.
- Mot de passe propriétaire vide : aléatoire, personne ne peut lever les restrictions.

Vérifié : lecture par pdf.js (navigateurs, Firefox), Ghostscript, qpdf et Poppler (pdftotext) ;
droits relevés par Poppler : `print:yes copy:no change:no algorithm:AES-256`. À vérifier sur poste :
Acrobat Reader, Aperçu (macOS).
