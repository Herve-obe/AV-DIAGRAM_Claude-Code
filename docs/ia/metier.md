# Connaissance métier de l'assistant AV Diagram

Document de référence transmis à l'assistant IA. Il décrit ce qu'est un bon synoptique audiovisuel et les règles techniques à respecter. Rédigé le 11 novembre 2026, **à relire et valider par Hervé Obejero** avant usage en production.

La section « Essentiel » est envoyée à l'IA locale, dont la mémoire de contexte est limitée. Le document complet est envoyé à l'IA personnelle.

## Essentiel

- Un synoptique montre les flux : chaque liaison est un câble physique, d'une sortie vers une entrée. Il ne montre pas les réglages internes (routage de console, abonnements réseau) : les signaler comme réglages à faire.
- Méthode : lister les sources, les traitements et les destinations ; compter les entrées et sorties ; choisir le matériel ; relier ; vérifier niveaux, connecteurs, retours, enregistrement, synchronisation.
- Niveaux : micro (environ -60 à -20 dBu), ligne professionnelle +4 dBu (1,228 V eff.), ligne grand public -10 dBV (0,316 V eff.), sortie haut-parleur (puissance). Une sortie HP ne va jamais vers une entrée ligne ou micro. Un instrument ou une source asymétrique va vers une entrée micro par une DI.
- XLR désigne un connecteur, pas un niveau. Un micro statique demande le fantôme 48 V.
- AES3, SDI et MADI sont point à point : un distributeur est nécessaire pour alimenter deux entrées.
- Numérique : une seule horloge maître par système, même fréquence d'échantillonnage partout.
- Dante : réseau primaire et secondaire séparés, jamais reliés entre eux.
- DMX : chaîne d'appareil en appareil, bouchon de 120 Ω en fin de ligne, 512 canaux par univers, pas de dérivation en Y.
- Duplex : le correspondant reçoit le programme sans sa propre voix (mix-minus, ou N-1).
- Ne jamais inventer un équipement ni une caractéristique ; une fiche « communauté » ou générique est annoncée comme telle.

## 1. Ce qu'est un bon synoptique

- **Sens de lecture** : les sources à gauche, les traitements au centre, les destinations à droite. Les retours vont dans le sens inverse et doivent rester lisibles.
- **Une liaison, un câble** : chaque trait représente un câble réel, avec ses deux connecteurs. Un multipaire regroupe plusieurs liaisons dans un seul câble ; il se représente comme tel.
- **Repérage** : chaque câble porte un repère unique (numérotation par zone dans AV Diagram). Les équipements portent un nom de fonction (« Console FOH », « Retour batteur ») en plus de leur modèle.
- **Organisation** : une feuille par zone ou par fonction (plateau, régie, façade), des calques par domaine (son, vidéo, lumière, réseau, intercom). Un schéma trop chargé se découpe.
- **Ce que le synoptique ne montre pas** : affectations internes d'une console, abonnements Dante, réglages d'un mélangeur vidéo. Ils se documentent en note et se signalent comme « réglages à faire sur place ».
- **Complétude** : aucun appareil isolé sans raison, aucune entrée attendue sans source, aucune sortie demandée (enregistrement, diffusion, retour) sans liaison.

## 2. Méthode de conception à partir d'un cahier des charges

1. **Comprendre l'événement** : type (concert, conférence, plateau TV, radio, théâtre, captation), lieu, public, durée, diffusion en direct ou enregistrement.
2. **Lister les sources** : voix (micros filaires ou HF), instruments (micros, DI), lecteurs, ordinateurs, liaisons extérieures (duplex), caméras.
3. **Lister les destinations** : façade, retours (bains de pieds, ear-monitors), enregistrement, diffusion (stream, antenne), régie vidéo, salle de presse, traduction.
4. **Compter** : entrées et sorties nécessaires à chaque étape, en gardant une marge. Une capacité s'entend par appareil, jamais par lot.
5. **Choisir le matériel** : d'abord le matériel imposé, puis le parc de l'entreprise, puis la bibliothèque. Toute substitution s'explique.
6. **Relier** : signal compatible, niveau compatible, connecteur compatible ou adaptateur explicite.
7. **Vérifier** : niveaux, fantôme, horloge, retours et mix-minus, redondance, alimentation, longueurs.
8. **Poser les hypothèses** : tout choix laissé libre s'annonce comme hypothèse modifiable. Au plus trois questions groupées, seulement sur ce qui change le système.

## 3. Niveaux audio

| Niveau | Ordre de grandeur | Remarques |
|---|---|---|
| Micro | -60 à -20 dBu | Préamplification nécessaire ; entrée micro de console ou de stagebox |
| Instrument (haute impédance) | Variable, source à forte impédance | Guitare, basse : DI ou entrée Hi-Z |
| Ligne grand public | -10 dBV = 0,316 V eff. | RCA, mini-jack, matériel grand public |
| Ligne professionnelle | +4 dBu = 1,228 V eff. | XLR ou jack TRS symétrique |
| Haut-parleur | Puissance (dizaines à milliers de watts) | Sortie d'amplificateur vers enceinte passive uniquement |

- Repères : 0 dBu = 0,775 V eff. ; l'écart entre +4 dBu et -10 dBV est d'environ 11,8 dB.
- Règle de la bibliothèque : une prise ligne sans niveau publié vaut +4 dBu sur le matériel professionnel et -10 dBV sur le matériel grand public.
- Une sortie ligne vers une entrée micro sature : atténuateur ou entrée ligne. Une sortie micro vers une entrée ligne manque de niveau : préampli.
- Une sortie haut-parleur ne se branche jamais sur une entrée ligne ou micro.

## 4. Symétrie, connecteurs et alimentation fantôme

- **Symétrique** : XLR 3 broches (broche 2 point chaud, 3 point froid, 1 masse), jack 6,35 TRS. Rejette les parasites sur les grandes longueurs.
- **Asymétrique** : RCA, jack TS, mini-jack. Liaisons courtes ; risque de bourdonnement, d'où la DI pour entrer dans une console.
- **Alimentation fantôme 48 V** (P48) : indispensable aux micros statiques et aux DI actives qui l'utilisent. Inutile pour un micro dynamique. Elle se commande sur l'entrée de la console ou du préampli.
- **Adaptateurs** : un adaptateur change un connecteur, pas un niveau ni une impédance. Le signaler sur le schéma.

## 5. Audio numérique et synchronisation

| Format | Support | Canaux | Remarques |
|---|---|---|---|
| AES3 (AES/EBU) | XLR, câble 110 Ω | 2 | Point à point |
| AES3id | BNC 75 Ω | 2 | Point à point |
| S/PDIF | RCA coaxial ou optique | 2 | Grand public |
| ADAT | Optique | 8 à 48 kHz | Moins de canaux à 96 kHz |
| MADI (AES10) | BNC 75 Ω ou fibre | jusqu'à 64 | Point à point |

- Un flux point à point ne se dédouble pas avec un câble en Y : il faut un distributeur ou un routeur.
- **Horloge** : une seule horloge maître par système numérique, les autres appareils esclaves (word clock sur BNC 75 Ω, ou horloge transportée par le flux ou le réseau). Tous les appareils d'un même flux à la même fréquence d'échantillonnage (48 kHz en général en audiovisuel).

## 6. Audio sur IP

- **Dante** : réseau primaire et secondaire physiquement séparés (deux commutateurs, ou deux réseaux distincts), jamais reliés entre eux. Commutateurs gigabit recommandés. Les abonnements (qui reçoit quoi) se font dans le logiciel Dante Controller : les câbles ne les montrent pas.
- **AES67** : interopérabilité entre réseaux audio IP ; à configurer explicitement.
- **AVB / Milan** : demande des commutateurs compatibles AVB.
- **Ethernet cuivre** : 100 m au plus par segment ; au-delà, fibre ou commutateur intermédiaire.

## 7. Vidéo

- **SDI** (BNC 75 Ω) : HD-SDI, 3G-SDI, 12G-SDI selon la résolution. Point à point, un distributeur (DA) pour alimenter plusieurs entrées. La longueur possible baisse quand le débit augmente.
- **HDMI** : courtes distances ; au-delà, prolongateur (HDBaseT sur câble réseau, fibre) ou conversion SDI.
- **Synchronisation** : un mélangeur vidéo et ses sources se synchronisent sur une référence commune (genlock : black burst ou tri-level), sauf si le mélangeur resynchronise ses entrées.
- **Caméras de plateau** : en plus de la sortie vidéo, prévoir selon le cas le retour programme, le tally et l'intercom (souvent par la voie CCU ou fibre).
- **Vidéo sur IP** : NDI, SMPTE ST 2110 ; demandent un réseau dimensionné et configuré.
- **Audio et vidéo** : préciser où l'audio rejoint la vidéo (embedding SDI, entrées audio du mélangeur, enregistreur) et le décalage éventuel à compenser.

## 8. Retours, duplex et diffusion

- **Retours de scène** : chaque mix de retour est une sortie distincte (auxiliaire). Le nombre de mix de retour dépend des musiciens qui veulent un retour différent.
- **Ear-monitors (IEM)** : émetteurs HF stéréo ou mono, une fréquence par mix.
- **Duplex et mix-minus (N-1)** : le correspondant distant reçoit le programme sans sa propre voix, sinon il s'entend avec retard. Prévoir une sortie dédiée par correspondant.
- **Ordre (talkback)** : micro d'ordre de la régie vers les retours ou l'intercom, sans passer en façade ni à l'antenne.
- **Enregistrement et diffusion** : préciser le mix envoyé (programme, multipiste, mix dédié au stream) et sa sortie.
- **Exclusions** : « pas de micros d'interview dans les enceintes du plateau », « pas de retour du mix live vers lui-même » : à respecter dans les mix, et à documenter en note puisque les câbles ne le montrent pas.

## 9. Diffusion sonore

- **Enceintes passives** : amplificateur entre la console (ou le processeur) et l'enceinte ; câble HP (speakON NL2, NL4, NL8 ou bornes). Respecter l'impédance de charge minimale de l'amplificateur.
- **Enceintes actives** : signal ligne et alimentation secteur séparés.
- **Système** : façade, rappels (delays), subs, lipfills selon la salle ; un processeur gère filtrage, délais et égalisation.

## 10. Liaisons HF

- Micros sans fil, ear-monitors et intercom sans fil occupent des fréquences : un plan de fréquences sans intermodulation est nécessaire, et les fréquences autorisées dépendent du pays.
- Plusieurs récepteurs se partagent les antennes par un distributeur d'antennes ; plusieurs émetteurs IEM par un combineur.

## 11. Intercom

- **Partyline 2 fils** : postes en série sur un câble XLR 3 (Clear-Com) ou système RTS TW ; les deux ne sont pas compatibles sans interface.
- **4 fils et matrices** : liaisons point à point, interfaces vers les caméras, les postes et les codecs.
- **Casques de régie** : souvent XLR 4 (casque micro) ; ne pas confondre avec une entrée audio.
- **Sans fil** : bases et postes portatifs à gérer comme les autres liaisons HF.

## 12. Lumière (DMX et réseau)

- **DMX512** : XLR 5 broches en standard (XLR 3 fréquent), 512 canaux par univers.
- Câblage en chaîne d'appareil en appareil ; bouchon de terminaison de 120 Ω au bout de la ligne ; pas de dérivation en Y : utiliser un splitter (répartiteur) DMX.
- Au plus 32 récepteurs par ligne sans répéteur, selon la norme RS-485.
- **Réseau lumière** : Art-Net, sACN ; nœuds réseau vers DMX.

## 13. Électricité

- Prises courantes : PC16 (2P+T, 16 A, 230 V), P17 16, 32, 63 et 125 A, mono ou triphasé (400 V entre phases).
- Faire un bilan de puissance par départ ; répartir la charge entre les phases en triphasé.
- Séparer les départs son, vidéo et lumière (gradateurs) pour limiter les perturbations ; une terre commune pour tout le système audio.

## 14. Règles propres à AV Diagram

- La bibliothèque est la seule source des caractéristiques. Une fiche « vérifiée » cite un document constructeur ; une fiche « communauté » est incomplète ; une fiche générique n'a pas de source constructeur. L'assistant le dit quand il en propose une.
- Une option (tête de micro, carte, module) s'installe dans un emplacement de l'appareil principal, et seulement si le constructeur la valide.
- L'assistant propose, l'utilisateur valide : rien n'est appliqué sans accord, et l'application est annulable.
- En cas de doute sur une caractéristique : « je ne sais pas », jamais une supposition.
