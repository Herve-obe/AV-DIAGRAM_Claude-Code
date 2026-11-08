# AV Diagram : conventions pour le développement assisté par IA

- Langue : interface, commentaires et documentation en français. Tout texte visible passe par `src/i18n/fr.json` et `src/i18n/en.json`, avec les mêmes clés dans les deux fichiers.
- Architecture :
  - `src/model/` contient le métier pur, sans React. Toute règle ou opération se code là, puis se teste dans `model.test.ts`.
  - `src/store/` contient l'état. Toute modification du projet passe par `useProject` pour être annulable.
  - `src/editor/` contient le canevas React Flow, et `src/ui/` les panneaux.
- Couleurs : uniquement des variables de `src/styles/tokens.css`. Jamais de couleur en dur dans un composant.
- Bibliothèque : ne jamais inventer une caractéristique constructeur. Une fiche « verified » exige une source (URL et date).
  - Équipement principal + option : un équipement qui ne fonctionne pas seul (tête de micro, carte, objectif, module) est une fiche « module » installée dans un emplacement (`slots`) de l'équipement principal. Un principal vendu avec son option est ramené au principal seul (ancienne référence en alias). Valable dans tous les menus.
  - Version constructeur uniquement : une fiche décrit l'appareil tel que livré par le constructeur. Pas de fiche de marque « Novelty » (fabrication sur mesure du loueur) ni de connectique ajoutée ou modifiée par un loueur.
  - Un kit ou un ensemble de plusieurs appareils autonomes est scindé en fiches séparées.
  - Options : un montage n'est proposé que s'il est validé par le constructeur. Chaque emplacement déclare la liste des options compatibles (`accepts`) ; le logiciel ne propose que celles qui fonctionnent réellement.
  - Niveau ligne : une prise ligne (entrée ou sortie) sans niveau publié vaut +4 dBu sur le matériel professionnel et -10 dBV sur le matériel grand public, sauf indication explicite du constructeur. Casques, micro, haut-parleur et liaisons HF ne relèvent pas de cette règle.
- Plateforme : application de bureau Tauri 2 (`src-tauri/`). Pas de version web. Les accès fichiers passent par `src/io/files.ts`, qui utilise les plugins dialog et fs.
- Données : rien ne quitte l'ordinateur de l'utilisateur. Aucun service en ligne, aucun CDN. Exceptions : téléchargement explicite d’un modèle local (catalogue figé, aucune donnée du projet, `src-tauri/src/local_models.rs`) ; option « mon compte IA », après accord explicite. Ses requêtes passent uniquement par `src-tauri/src/ai.rs` (liste stricte d'adresses, clé dans le trousseau).
- Avant chaque commit : `npm run lint && npm run typecheck && npm test && npm run build`.
