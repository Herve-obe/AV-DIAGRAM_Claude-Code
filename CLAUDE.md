# AV Diagram : conventions pour le développement assisté par IA

- Langue : interface, commentaires et documentation en français. Tout texte visible passe par `src/i18n/fr.json` et `src/i18n/en.json`, avec les mêmes clés dans les deux fichiers.
- Architecture :
  - `src/model/` contient le métier pur, sans React. Toute règle ou opération se code là, puis se teste dans `model.test.ts`.
  - `src/store/` contient l'état. Toute modification du projet passe par `useProject` pour être annulable.
  - `src/editor/` contient le canevas React Flow, et `src/ui/` les panneaux.
- Couleurs : uniquement des variables de `src/styles/tokens.css`. Jamais de couleur en dur dans un composant.
- Bibliothèque : ne jamais inventer une caractéristique constructeur. Une fiche « verified » exige une source (URL et date).
- Plateforme : application de bureau Tauri 2 (`src-tauri/`). Pas de version web. Les accès fichiers passent par `src/io/files.ts`, qui utilise les plugins dialog et fs.
- Données : rien ne quitte l'ordinateur de l'utilisateur. Aucun service en ligne, aucun CDN. Seule exception : l'assistant IA en option « mon compte IA », après accord explicite. Ses requêtes passent uniquement par `src-tauri/src/ai.rs` (liste stricte d'adresses, clé dans le trousseau).
- Avant chaque commit : `npm run lint && npm run typecheck && npm test && npm run build`.
