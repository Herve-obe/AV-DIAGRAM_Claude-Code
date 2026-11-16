# Compatibilité des postes (2026-10-08)

AV Diagram est une application de bureau (Tauri). Pas de version navigateur.

| Système | Minimum | Remarque |
|---|---|---|
| Windows | 10 et 11, 64 bits | Moteur d'affichage WebView2 (installé avec Windows 11, ajouté par l'installateur sinon) |
| macOS, processeur Apple (M1 et suivants) | macOS 12.3 Monterey | Application universelle |
| macOS, processeur Intel | macOS 12.3 Monterey | Même application universelle (deux versions du programme dans un seul paquet) |

Pourquoi macOS 12.3 : l'interface utilise des fonctions du moteur WebKit présentes à partir de
Safari 15.4, livré avec macOS 12.3. Un Mac Intel capable d'installer Monterey convient (à vérifier
sur la liste officielle d'Apple pour un modèle donné).

Ce qui assure la compatibilité :
- construction macOS `universal-apple-darwin` (Intel x86_64 + Apple Silicon arm64), voir
  `.github/workflows/desktop.yml` ;
- version minimale déclarée dans le paquet (`bundle.macOS.minimumSystemVersion`, 12.3) ;
- code de l'interface compilé pour Safari 15 (`vite.config.ts`) ;
- lecteur PDF de l'import en version « legacy » (pdf.js), qui fonctionne avec les WebKit plus
  anciens ; la version moderne exige Safari 17.4 ;
- captures d'export limitées à 15 millions de pixels (limite des canevas de WebKit).

Non vérifié à ce jour : démarrage réel sur un Mac Intel (pas de machine de test). À faire avant la
première diffusion : lancer l'application, ouvrir un projet, exporter un PDF, importer un PDF.
