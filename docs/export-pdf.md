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
- Le canevas garde ses pages à 100 %, ancrées à l'origine. Dépasser une limite ajoute des pages,
  sans déplacer les appareils ni réduire le dessin. La touche F recadre sur toutes les pages.
- Les pointillés délimitent la **zone de dessin** disponible sur chaque page, hors marges,
  légende et cartouche. Sur A3 paysage sans historique de révisions : 400 × 225 mm utiles.
- À l'export, **Mettre à l'échelle sur une page** fait tenir chaque feuille du projet sur une page.
- **Conserver sur plusieurs pages** garde l'échelle choisie (100 % : 1 unité = 0,25 mm) et les
  pages repérées A1, B1, A2... Les textes ne sont pas réduits automatiquement. Une échelle
  d'export personnalisée peut donner un découpage différent du canevas à 100 %.
- Le choix une page / plusieurs pages ne modifie pas le canevas. Changer le format ou
  l'orientation modifie ses dimensions, sans déplacer les équipements.
- Le total annoncé dans les réglages est une **estimation** ; l'export mesure le contenu réellement
  affiché, groupes repliés, calque visible, tracés et étiquettes du routeur compris.
- La sélection et la vue sont restaurées après l'export. Les boutons d'édition, pointillés et
  points de la grille ne sont pas imprimés.

## Équipements à nombreux ports

Au-delà de 16 ports, un équipement affiche par défaut uniquement les ports reliés, sans
renumérotation. Les liaisons vers une autre feuille gardent leur port et leur renvoi visibles.
« Ajouter une connexion » permet de choisir un port libre puis de tirer un câble depuis ou vers
ce port. Après branchement, il reste visible ; après annulation, il est de nouveau masqué.
« Tous les ports » déplie le bloc, « Ports reliés » le replie.

Le dépliage est propre au poste et conservé pendant le passage entre feuilles. Il ne modifie
ni le projet, ni les réservations des calques. L'export reprend cette représentation et enlève
ses outils de branchement. Les petits appareils restent affichés en entier.

## Filigrane

Présent ou non ; texte avec champs ({client}, {project}, {date}, {revision}, {number}) ; position
(mosaïque en diagonale, grande diagonale, bandeau haut ou bas, coin) ; zone (schéma : incrusté dans
l'image ; planche entière : texte par-dessus tout, cartouche compris) ; taille ; couleur ; opacité ;
application aux exports PNG et SVG.

**Filigrane nominatif** : liste de destinataires (un par ligne). Un PDF par destinataire, enregistrés
dans un dossier choisi une fois ; son nom remplace {recipient} (ajouté à la fin du texte sinon) et
figure dans les mots-clés du fichier. En cas de fuite, le filigrane désigne l'exemplaire.

## Protection

Chiffrement **AES-256** (PDF 2.0, ISO 32000-2, gestionnaire standard V5 / R6), fait par
l'application de bureau (`src-tauri/src/pdfsec.rs`, bibliothèque lopdf), à la place du RC4 de la
bibliothèque PDF de l'interface.

- Droits : impression, copie, modification.
- Sans mot de passe d'ouverture : le PDF s'ouvre partout, les droits sont appliqués par les lecteurs ;
  c'est une dissuasion quel que soit l'algorithme (la clé se déduit du mot de passe vide).
- Avec mot de passe d'ouverture : contenu illisible sans lui.
- Mot de passe propriétaire vide : aléatoire, personne ne peut lever les restrictions.
- La fenêtre d'export affiche le niveau réel : **aucune** (rien n'est protégé, sauf le filigrane),
  **dissuasive** (droits sans mot de passe d'ouverture), **forte** (mot de passe d'ouverture).

Vérifié : lecture par pdf.js (navigateurs, Firefox), Ghostscript, qpdf et Poppler (pdftotext) ;
droits relevés par Poppler : `print:yes copy:no change:no algorithm:AES-256`. À vérifier sur poste :
Acrobat Reader, Aperçu (macOS).
