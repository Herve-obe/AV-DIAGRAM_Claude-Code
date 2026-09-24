# AV Diagram : cahier des charges

| Champ | Valeur |
|---|---|
| Projet | AV Diagram |
| Version du document | 0.1 (brouillon à valider) |
| Date | 2026-09-24 |
| Porteur | Hervé Obejero |
| Statut | En attente des réponses aux questions ouvertes (section 18) |

---

## 1. Contexte et objectifs

Les professionnels de l'audiovisuel dessinent aujourd'hui leurs synoptiques avec des outils généralistes (draw.io, Visio) ou des logiciels de CAO lourds. Ces outils ne connaissent ni les signaux, ni les connecteurs, ni les équipements du métier. Le technicien doit donc tout ressaisir à la main : liste de câblage, patch, nomenclature, bilan électrique.

**AV Diagram** est une application web libre et gratuite qui sert à concevoir des synoptiques d'installations audiovisuelles professionnelles (concert, plateau TV, installation fixe) à partir d'un modèle de données métier. Le schéma est la source unique. Toutes les listes et tous les calculs en sont déduits automatiquement.

Objectifs mesurables :

1. Produire le synoptique d'un concert type (environ 40 équipements, 150 liaisons) en moins de 30 minutes pour un utilisateur expert.
2. Générer la liste de câblage, le patch et la nomenclature sans aucune ressaisie.
3. Signaler 100 % des incompatibilités couvertes par les règles de la section 5.4.
4. Fonctionner entièrement hors ligne une fois l'application installée (PWA).
5. Rester gratuit pour l'utilisateur et à 0 € de coût d'exploitation tant que le cloud (lot 4) n'est pas ouvert.

## 2. Utilisateurs

### 2.1 Profils

| Profil | Besoin principal |
|---|---|
| Étudiant, stagiaire | Apprendre la logique d'un flux de signal, être guidé, recevoir une correction |
| Formateur | Créer des exercices, comparer une copie au corrigé, suivre un groupe |
| Technicien son, vidéo, lumière, réseau | Produire vite un synoptique fiable et les listes associées |
| Régisseur, directeur technique | Vue globale multi-métiers, nomenclature, bilan électrique, export client |
| Intégrateur, bureau d'études | Installations fixes, élévations de racks, export DXF, cartouche normalisé |
| Client, production | Consulter en lecture seule, commenter |

### 2.2 Deux modes d'interface

- **Mode Débutant** : bibliothèque réduite aux familles courantes, assistants pas à pas (« Relier une sortie à une entrée »), infobulles pédagogiques, options avancées masquées, vérifications de compatibilité expliquées en langage simple.
- **Mode Expert** : toutes les options, panneaux denses, raccourcis clavier personnalisables, palette de commandes (Ctrl+K), édition en lot, tableaux éditables.

Le mode se change à tout moment, sans perte de données. Il ne modifie que l'affichage.

### 2.3 Rôles (à partir du lot 4, avec comptes)

| Rôle | Droits |
|---|---|
| Propriétaire | Tous les droits, gestion des membres, suppression |
| Éditeur | Modifier le projet |
| Commentateur | Lire et commenter |
| Lecteur | Lire, exporter si autorisé |
| Formateur / Stagiaire | Rôles spécifiques au mode formation (section 11) |

## 3. Périmètre fonctionnel : les vues

Un projet contient des **pages** (scène, régie façade, régie retours, car régie, plateau, local technique...). Chaque page peut afficher les vues suivantes :

| Code | Vue | Contenu |
|---|---|---|
| V1 | Synoptique de signal | Blocs équipements avec ports, reliés par des liaisons typées |
| V2 | Listes générées | Câblage, patch, nomenclature, adressage IP (section 7) |
| V3 | Plan d'implantation | Vue de dessus à l'échelle (stage plot, plan de salle), fond de plan importable |
| V4 | Élévation de rack | Baies 19", positions en U, faces avant et arrière |
| V5 | Schéma réseau | Switchs, VLAN, adresses IP, flux Dante / AES67 / NDI / ST 2110 |
| V6 | Intercom et ordres | Postes, matrices, canaux, liaisons 2 fils / 4 fils / IP |
| V7 | Synchro | Maître d'horloge, word clock, référence vidéo (black burst, tri-level), PTP, LTC |
| V8 | Distribution électrique | Armoires, départs, circuits, phases, bilan de puissance |

### 3.1 Vues liées

Un équipement est une instance unique dans le projet. Il peut apparaître dans plusieurs vues : le synoptique, le rack et le plan. Si on le modifie à un endroit, le changement est répercuté partout.

- Une option **« Dissocier »** par vue ou par instance permet de rompre ce lien, par exemple pour un schéma de principe sans rack.
- Une instance présente dans une vue mais absente d'une autre est signalée dans le panneau Alertes. Cette alerte peut être désactivée.

### 3.2 Sous-schémas

Un **groupe** (par exemple « Régie FOH ») s'affiche replié sous forme d'un bloc avec ses ports d'interface. Un double-clic ouvre son détail interne. Les groupes s'imbriquent sans limite de profondeur.

### 3.3 Mode présentation

Ce mode affiche le projet sans les outils d'édition, avec une navigation par page et par zone. Il sert à montrer le projet à un client ou à le projeter en formation.

## 4. Bibliothèque d'équipements

### 4.1 Modèle de données d'un équipement

```
Equipement
  id, fabricant, modele, famille, sous_famille
  pictogramme (SVG interne), couleur de famille
  dimensions (L x H x P en mm), poids (kg), hauteur rack (U), montage
  alimentation : tension, puissance nominale (W), puissance max (W), connecteur
  ports[] :
    id, nom affiché, sens (entrée / sortie / bidirectionnel)
    signal (voir 5.1), connecteur (voir 5.2), niveau nominal (ex. +4 dBu, micro)
    nombre de canaux transportés, groupe (ex. « Entrées analogiques 1-32 »)
  slots[] : emplacements pour cartes et modules (type accepté)
  reseau : nombre de ports, protocoles, PoE (consommé / fourni)
  sources[] : URL de la documentation constructeur, date de consultation
  statut : verifie | communautaire | utilisateur
  fiche pedagogique (optionnelle, section 11)
```

Les **cartes et modules** (cartes Dante, MADI, SFP, cartes de slot de console) sont des équipements de famille `module`. Quand on les insère dans un slot, leurs ports s'ajoutent à ceux de l'hôte.

### 4.2 Alimentation de la base

Règle absolue : **aucune caractéristique n'est inventée.** Chaque fiche porte au moins une source constructeur (URL et date).

| Statut | Origine | Affichage |
|---|---|---|
| Vérifié | Fiche créée à partir de la documentation constructeur puis relue | Badge « Vérifié » |
| Communautaire | Proposée par un utilisateur via une contribution publique | Badge « Communauté » |
| Utilisateur | Créée localement dans l'éditeur de blocs | Visible dans le projet seulement, exportable |

Circuit de contribution :

1. La base est stockée en fichiers JSON dans le dépôt, un fichier par modèle.
2. Les contributions arrivent par pull request, ou par un formulaire intégré qui la génère (lot 4).
3. Un schéma JSON valide automatiquement chaque fiche : champs obligatoires, source présente, cohérence des ports.
4. Des familles **génériques** (« Console numérique », « Caméra ») restent disponibles quand le modèle réel n'existe pas encore.

### 4.3 Familles

La liste est extensible : captation (micros, DI, capteurs), consoles audio, stageboxes, processeurs et DSP, amplificateurs, enceintes, retours et ear-monitors, systèmes HF, enregistreurs et lecteurs, interfaces audio et convertisseurs, horloges maîtres, caméras, CCU, mélangeurs vidéo, routeurs et grilles, convertisseurs et embedders, multiviewers, serveurs média et playout, enregistreurs vidéo, vidéoprojecteurs, écrans et murs LED, processeurs d'image, intercom, switchs réseau, routeurs réseau, points d'accès, générateurs de synchro et de timecode, contrôleurs (show control, GPIO), lumière (consoles, nodes DMX, splitters), distribution électrique (armoires, distributeurs, onduleurs), passifs (boîtiers de raccordement, patchs, multipaires, splitters).

### 4.4 Visuels

- **Pictogrammes SVG homogènes**, dessinés pour le projet sous la même licence que le code. Il n'y a aucun problème de droits.
- Pour les icônes d'interface, on utilise des jeux sous licence permissive : Lucide (licence ISC) et Tabler Icons (licence MIT).
- Les **photos constructeurs** ne sont pas intégrées par défaut : elles sont en général protégées par le droit d'auteur. La fiche contient seulement un lien vers la page du fabricant. Une photo n'est intégrée que si le fabricant a donné une autorisation écrite ou a publié une licence explicite.
- L'utilisateur peut associer une image locale à ses propres blocs, sous sa responsabilité.

## 5. Signaux, connecteurs, liaisons

### 5.1 Types de signaux et code couleur par défaut

Le code couleur est une convention du projet, pas une norme. Il est personnalisable par l'utilisateur ou par l'organisation. Chaque type a aussi un **style de trait**, pour rester lisible en impression noir et blanc et pour les personnes daltoniennes.

| Catégorie | Signaux | Couleur | Trait |
|---|---|---|---|
| Audio analogique | Micro, ligne (+4 dBu pro, -10 dBV grand public), HP, casque | Bleu | Plein |
| Audio numérique | AES3 (AES/EBU), S/PDIF, ADAT, MADI coax et fibre | Violet | Plein épais |
| Audio sur IP | Dante, AVB / Milan, AES67, Ravenna | Vert | Tirets longs |
| Vidéo bande de base | SDI (HD, 3G, 6G, 12G), HDMI, DVI, DisplayPort, composite, HDBaseT | Jaune | Plein |
| Vidéo sur IP | NDI, SMPTE ST 2110, SRT | Jaune | Tirets longs |
| Synchro et temps | Word clock, black burst, tri-level, PTP, LTC, VITC | Rose | Pointillés |
| Intercom | Partyline 2 fils, 4 fils, intercom IP | Orange | Tiret-point |
| Contrôle | MIDI, GPIO, RS-232, RS-422, RS-485, DMX512, Art-Net, sACN, OSC | Gris | Tirets courts |
| Réseau | Ethernet cuivre et fibre, liens trunk | Cyan | Plein |
| Électrique | Monophasé, triphasé, PoE | Rouge | Plein épais |

### 5.2 Connecteurs

XLR 3 / 4 / 5 broches, jack 6,35 mm TS/TRS, mini-jack 3,5 mm, RCA, Speakon NL2/NL4/NL8, BNC 75 ohms, DIN 5 broches (MIDI), D-Sub 9 / 25 (dont multipaires Tascam), RJ45, etherCON, opticalCON, LC, SC, ST, MPO, SFP / SFP+ / QSFP, HDMI (standard, mini, micro), DisplayPort, USB-A / B / C, multipaires (Harting, Socapex, CPC, EDAC), PowerCON, PowerCON TRUE1, IEC C13 / C14 / C19 / C20, Schuko (CEE 7/4), P17 (CEE 16 A et 32 A mono et tri, 63 A, 125 A), Powerlock, bornier Phoenix, borniers à vis.

La liste est extensible via l'éditeur de blocs.

### 5.3 Câble physique et flux logique

Le modèle distingue deux niveaux :

- **Câble** : l'objet physique. Il a un numéro, une étiquette, un type, deux connecteurs (un à chaque extrémité), une longueur, une couleur de gaine, une référence, un stock et un état.
- **Flux** : un canal logique transporté par un câble ou par un réseau. Par exemple : « Entrée 1 Kick » dans la paire 1 d'un multipaire, ou 64 canaux Dante dans un lien RJ45.

Un multipaire contient N paires. Un lien réseau transporte M flux. La vue synoptique peut afficher les câbles, les flux, ou les deux.

**Numérotation automatique** : le format est configurable, par exemple `{ZONE}-{TYPE}-{NUM:000}` qui donne `FOH-AUD-012`. La renumérotation se fait par zone ou globalement.

### 5.4 Vérifications de compatibilité

Les vérifications **signalent sans bloquer**, avec trois niveaux de gravité : info, avertissement, erreur.

| Règle | Exemple | Gravité |
|---|---|---|
| Famille de signal différente | Sortie SDI vers entrée XLR | Erreur |
| Niveau incompatible | Sortie niveau micro vers entrée ligne, sortie HP vers entrée ligne | Avertissement |
| Connecteur différent sans adaptateur | XLR mâle vers jack TRS | Avertissement, propose un adaptateur |
| Sens incohérent | Sortie vers sortie | Erreur |
| Port déjà occupé | Deux sources sur une entrée | Erreur |
| Débit insuffisant | Signal 12G-SDI sur un lien déclaré 3G | Avertissement |
| Horloge | Plusieurs maîtres word clock ou PTP dans le même domaine | Avertissement |
| Canaux réseau | Nombre de flux Dante supérieur à la capacité déclarée de l'équipement | Avertissement |
| Alimentation | Puissance d'un circuit supérieure au calibre déclaré | Erreur |
| Orphelins | Entrée ou sortie déclarée utilisée mais non reliée | Info |

Chaque alerte explique le problème, propose une correction et peut être ignorée avec un commentaire.

## 6. Éditeur graphique

### 6.1 Deux styles dans le même canevas

- **Schéma d'ingénierie** : blocs avec ports nommés, liaisons orthogonales routées automatiquement, aimantation sur les ports.
- **Dessin libre** : formes, flèches, texte, zones, main levée. Ce sont des annotations sans valeur métier.

### 6.2 Fonctions

- Grille magnétique, alignement et répartition, groupes, verrouillage, calques.
- **Filtres d'affichage par type de signal** : on peut afficher ou masquer l'audio, la vidéo, le réseau, l'électrique, etc. Un filtre combiné (par exemple « réseau et synchro ») est enregistrable comme sous-calque.
- Routage orthogonal automatique avec évitement des blocs, disposition automatique des blocs sur demande.
- Zones colorées nommées (Régie, Plateau), légende générée automatiquement.
- Annotations, commentaires épinglés, étiquettes personnalisées.
- Duplication intelligente : dupliquer 8 caméras incrémente les noms et les numéros.
- Annuler et rétablir sans limite pendant la session, historique des versions (section 10).
- Recherche globale d'un équipement, d'un câble ou d'un flux.
- Palette de commandes Ctrl+K, raccourcis personnalisables.

### 6.3 Modèles de projets

Modèles fournis :

1. Concert : diffusion façade et retours, stagebox en Dante.
2. Plateau TV 3 caméras : mélangeur, intercom, synchro.
3. Salle de conférence en installation fixe.
4. Festival multi-scènes.
5. Captation et streaming.

L'utilisateur peut enregistrer n'importe quel projet ou groupe comme modèle personnel.

### 6.4 Impression et cartouche

- Formats A4 à A0, portrait et paysage, échelle et découpage en planches.
- **Cartouche personnalisable** : champs inspirés de la norme ISO 7200 (données des cartouches de documentation technique), logo, projet, client, lieu, date, indice de révision, auteur, vérificateur, numéro de planche. Plusieurs cartouches enregistrables, branding client.
- Tableau des révisions, légende des signaux, nomenclature sur la planche.

## 7. Données générées et calculs

### 7.1 Tableaux générés

Tous ces tableaux sont triables, filtrables et exportables en CSV et en XLSX :

- Liste de câblage : numéro, type, de (équipement / port / connecteur), vers, longueur, étiquette, flux transportés.
- Patch d'entrées et de sorties console, patch de stagebox.
- Nomenclature (BOM) : équipements, modules, câbles par type et par longueur, adaptateurs.
- Liste de câbles par longueur, pour la préparation du matériel.
- Plan d'adressage IP et de VLAN.
- Abonnements Dante (sources vers destinations).
- Liste des fréquences HF (saisie manuelle, pas de calcul d'intermodulation dans un premier temps).
- Liste des étiquettes à imprimer.

### 7.2 Calculs

| Calcul | Formule ou méthode |
|---|---|
| Puissance par circuit | Somme des puissances nominales et maximales des équipements branchés (W) |
| Courant | I = P / U, avec U = 230 V en monophasé. En triphasé 400 V : I = P / (U x racine de 3 x cos phi), avec cos phi saisi (1 par défaut) |
| Équilibrage des phases | Répartition des charges L1 / L2 / L3 et écart en % |
| Dissipation thermique | 1 W = 3,412 BTU/h |
| Poids | Somme en kg par rack, par zone et totale |
| Rack | Unités occupées et libres (1 U = 44,45 mm), profondeur maximale |
| Bilan de canaux | Flux Dante / MADI / AES67 utilisés par rapport à la capacité déclarée de chaque équipement |
| Longueurs de câble | Somme par type, avec un surplus configurable en % |

### 7.3 Matrice de routage

La matrice de routage est un tableau croisé sources x destinations, éditable et **synchronisé dans les deux sens** avec le synoptique : cocher une case crée le flux, et supprimer le flux décoche la case.

## 8. Import et export

La colonne « Faisabilité » est une estimation technique. Les licences des bibliothèques citées seront vérifiées une par une avant intégration, pour rester compatibles avec la licence du projet.

| Format | Export | Import | Faisabilité / bibliothèque envisagée |
|---|---|---|---|
| JSON natif AV Diagram | Oui | Oui | Format ouvert et documenté, versionné |
| PDF vectoriel | Oui | Non | jsPDF + svg2pdf.js |
| SVG, PNG | Oui | SVG en fond de plan | Natif navigateur |
| CSV, XLSX | Oui | Oui (patch, liste de câblage) | ExcelJS |
| DXF | Oui | Oui (fond de plan, blocs) | Format texte documenté, écriture maison ou bibliothèque JS |
| DWG | Non prévu en natif | À étudier | Format propriétaire. Piste : LibreDWG (GPL) compilé en WebAssembly, à valider |
| draw.io (.drawio, XML) | Oui | Oui | Format XML lisible, conversion des formes en annotations et des blocs reconnus en équipements |
| Visio (.vsdx) | À étudier | Oui, partiel | Archive ZIP de XML, import des formes et des connecteurs |
| Dante Controller (presets) | Non | À vérifier | Dépend de la documentation disponible du format de preset |
| Q-SYS Designer, Vectorworks, SketchUp | Non | À étudier | Formats propriétaires : faisabilité non garantie |

## 9. Plateforme, hors ligne, langues

- **Priorité à l'ordinateur** (Chrome, Edge, Firefox, Safari récents). La tablette est d'abord en consultation, le portage complet vient plus tard.
- **PWA installable**, fonctionnement 100 % hors ligne. Les données restent dans le navigateur (IndexedDB) et peuvent être sauvegardées dans un fichier `.avd`.
- **Local d'abord** : l'application est complète sans compte. Le cloud (lot 4) ajoute la synchronisation, la collaboration et le partage. Au retour du réseau, les modifications faites hors ligne sont fusionnées automatiquement, grâce à des structures de données CRDT.
- **Langues** : français et anglais dès le départ, avec des fichiers de traduction séparés pour accueillir d'autres langues.
- **Thèmes** : sombre, clair ou automatique (celui de l'appareil). Palette professionnelle par défaut, couleur d'accent et couleurs de signaux personnalisables.

## 10. Collaboration, comptes, données (lot 4)

- Comptes par e-mail et mot de passe, lien magique, puis SSO Google et Microsoft.
- Organisation en projets et dossiers, rôles (section 2.3).
- **Édition simultanée** en temps réel : curseurs des participants, présence, commentaires.
- Partage par lien en lecture seule, avec expiration optionnelle.
- **Historique des versions** : instantanés automatiques et nommés, comparaison et restauration.
- **RGPD** : hébergement de toutes les données personnelles et de tous les projets **dans l'Union européenne**. Il faut aussi un registre des traitements, une politique de confidentialité, l'export et la suppression du compte, et aucun traceur publicitaire. Le niveau de souveraineté exigé est à préciser (question Q1).

## 11. Mode formation

- **Exercice** : le formateur publie un projet avec des éléments masqués ou verrouillés et une consigne. Le stagiaire complète le schéma.
- **Corrigé et comparaison** : un différentiel automatique entre la copie et le corrigé (liaisons manquantes, en trop ou erronées), avec un score configurable.
- **Suivi** : un groupe, la liste des rendus, l'état de chaque exercice (lot 4, car il faut des comptes).
- **Fiches pédagogiques** liées aux équipements et aux signaux : rôle, niveaux nominaux, connectique, pièges courants, liens vers des ressources. Le contenu des fiches cite ses sources.
- **Vidéos IA** : hors périmètre pour l'instant. Les fiches prévoient un champ pour lier des médias externes.

## 12. Assistance IA (lot 6)

Fonctions envisagées :

1. Suggestion de câblage : proposer les liaisons probables entre les équipements posés.
2. Détection d'erreurs avancée, en complément des règles de la section 5.4.
3. Génération d'un premier synoptique à partir d'une description ou d'une fiche technique (rider) importée.
4. Explication pédagogique d'un schéma.

Contrainte : 0 € de budget. Les appels à un modèle de langage ont un coût. L'option retenue par défaut est que **l'utilisateur fournit sa propre clé API**, stockée localement. Sans clé, seules les règles déterministes de la section 5.4 fonctionnent. À confirmer (question Q5).

## 13. Interface et design

- **Références** : DaVinci Resolve et Pro Tools. L'interface doit être professionnelle, moderne et épurée, dense mais lisible, optimisée pour le travail dans une régie sombre.
- **Structure de l'écran** : barre supérieure (projet, pages, mode, thème, recherche), outils à gauche, bibliothèque, canevas central, inspecteur à droite, dock inférieur (listes, patch, alertes), barre d'état.
- **Typographie** : Barlow et Barlow Condensed pour l'interface et les étiquettes, JetBrains Mono pour les données (numéros de câbles, ports, adresses IP). Ces polices sont sous licence SIL Open Font License.
- **Accessibilité** : contraste conforme au niveau AA des WCAG 2.2, navigation au clavier, signaux distingués par la couleur et par le style de trait.
- **Maquette** : `docs/maquette/index.html` (démonstrateur cliquable, données d'exemple génériques).

## 14. Architecture technique proposée

Critères de choix : 0 € de coût, outils libres, code lisible et maintenable en « vibe coding », hors ligne, collaboration future, hébergement européen.

| Couche | Choix | Raison |
|---|---|---|
| Langage | TypeScript | Le typage détecte les erreurs, ce qui aide beaucoup quand on code avec une IA |
| Interface | React 19 + Vite | Écosystème le plus large, très bien maîtrisé par les assistants IA |
| Canevas nœuds et ports | React Flow (@xyflow/react, licence MIT) | Ports, liaisons, zoom, mini-carte, sous-flux |
| Dessin libre | perfect-freehand (MIT) sur une couche SVG | Léger. tldraw est écarté car sa licence n'est pas une licence open source (à revérifier au moment du choix) |
| Routage et disposition | ELK.js (licence EPL-2.0) pour la disposition, routage orthogonal maison ou libavoid-js | Compatibilité des licences à valider |
| État et données | Yjs (CRDT, MIT) + Zustand | Un seul modèle de données pour l'annulation, le hors-ligne et la collaboration future |
| Stockage local | IndexedDB via y-indexeddb | Hors ligne natif |
| UI | Radix UI + Tailwind CSS | Composants accessibles, thèmes par variables CSS |
| i18n | i18next | Français et anglais |
| PWA | vite-plugin-pwa | Installation et cache hors ligne |
| Tests | Vitest + Playwright | Tests unitaires du modèle et des règles, tests de bout en bout de l'éditeur |
| Hébergement de l'application | Pages statiques gratuites (GitHub Pages, ou Codeberg Pages hébergé en Allemagne) | Aucune donnée personnelle ne transite par un hébergement statique |
| Backend (lot 4) | Option A : PocketBase + serveur Hocuspocus (Yjs) auto-hébergés sur un VPS d'un hébergeur européen (OVHcloud, Scaleway, Hetzner). Option B : Supabase, région UE | L'option A est souveraine mais coûte quelques euros par mois. L'option B a une offre gratuite, mais l'éditeur est américain (question Q1) |

Organisation du code, pour faciliter la reprise en vibe coding :

```
src/
  model/        types métier (Equipement, Port, Cable, Flux) + règles de compatibilité (sans React)
  library/      base d'équipements JSON + schéma de validation
  editor/       canevas, nœuds, liaisons, outils
  views/        synoptique, rack, plan, réseau, listes
  io/           imports / exports (un fichier par format)
  ui/           composants d'interface, thèmes
  i18n/         fr.json, en.json
docs/           cahier des charges, conventions, guide de contribution
```

Le modèle métier et les règles sont indépendants de l'interface. Ils sont donc testables seuls et réutilisables par la future version tablette.

## 15. Licence et modèle économique

- **Recommandation : GNU AGPL v3.** C'est une licence copyleft : quiconque modifie le logiciel et le propose en service en ligne doit publier son code source sous la même licence. Une entreprise ne peut donc pas en faire un produit fermé.
- **Limite importante** : aucune licence reconnue comme open source ne peut interdire l'usage commercial. La définition de l'Open Source Initiative, critère 6, interdit toute discrimination selon le domaine d'usage. Si l'objectif est d'interdire toute vente, il faut une licence « source disponible » comme PolyForm Noncommercial, qui n'est pas open source au sens de l'OSI.
- **Alternative européenne** : l'EUPL 1.2, licence copyleft de la Commission européenne, qui couvre aussi l'usage en ligne.
- **Freemium** : la licence AGPL reste compatible si le code est entièrement libre et que seul le **service hébergé** a des options payantes (stockage, collaboration). Pour pouvoir proposer plus tard une double licence, il faut faire signer un accord de contribution (CLA) aux contributeurs extérieurs.
- **Bibliothèque d'équipements** : licence de données distincte, CC BY-SA 4.0, recommandée pour que les ajouts restent libres.

## 16. Normes et conventions de référence

| Domaine | Référence | Usage dans AV Diagram |
|---|---|---|
| Cartouche | ISO 7200 | Champs du cartouche |
| Symboles électriques | Série IEC 60617 | Pictogrammes de la vue électrique |
| Vidéo SDI, synchro, vidéo sur IP | Normes SMPTE (ST 292, ST 424, ST 2082, ST 2110, ST 2059 pour le PTP) | Types de signaux, débits, règles de compatibilité |
| Audio numérique | Normes AES (AES3, AES10 MADI, AES67) | Types de signaux |
| Niveaux | +4 dBu (1,228 V eff.) ligne pro, -10 dBV (0,316 V eff.) grand public | Règles de niveau |

Je n'ai pas trouvé de norme SMPTE ou AES qui définisse la **représentation graphique** d'un synoptique AV. Le code couleur et les symboles restent donc des conventions du projet (question Q3).

## 17. Découpage et ordre de réalisation

Le produit complet est l'objectif. Il est réalisé dans cet ordre, et chaque lot livre une application utilisable :

| Lot | Contenu |
|---|---|
| 0 | Socle : projet Vite/React/TS, design system (thèmes sombre et clair, tokens), i18n, PWA, CI de tests, déploiement automatique |
| 1 | Synoptique (V1) : bibliothèque générique, blocs et ports, liaisons typées, filtres par signal, règles de compatibilité, inspecteur, modes Débutant et Expert, Ctrl+K, sauvegarde locale et fichier, liste de câblage (V2), export PNG / SVG / PDF / CSV |
| 2 | Câble et flux, multipaires, numérotation automatique, groupes et sous-schémas, pages, modèles, cartouche et impression multi-planches, dessin libre, mode présentation |
| 3 | Vues liées : rack (V4), plan (V3), réseau (V5), intercom (V6), synchro (V7), électrique (V8), calculs, matrice de routage, nomenclature complète |
| 4 | Cloud européen : comptes, projets et dossiers, rôles, collaboration temps réel, partage, versions, formulaire de contribution à la bibliothèque |
| 5 | Mode formation : exercices, corrigés, comparaison, suivi, fiches pédagogiques |
| 6 | Import et export avancés : DXF, draw.io, Visio, XLSX, puis assistance IA |
| 7 | Bibliothèque de modèles réels vérifiés (alimentée en continu à partir du lot 1), portage tablette |

## 18. Questions ouvertes

Voir le message de synthèse associé à cette version.

- **Q1** : niveau de souveraineté des données exigé, et budget d'hébergement pour le lot 4.
- **Q2** : validation de la licence AGPL v3 (ou EUPL 1.2), et CLA pour les contributeurs.
- **Q3** : normes ou conventions graphiques spécifiques visées.
- **Q4** : liste prioritaire des équipements réels à intégrer.
- **Q5** : modèle retenu pour l'IA (clé personnelle de l'utilisateur).
- **Q6** : périmètre gratuit et périmètre payant du freemium.
- **Q7** : validation du design de la maquette.
- **Q8** : passage du dépôt en public, et nom de domaine.
