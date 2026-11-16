# Bibliothèque sans fiche « Communauté » : passes du 16 novembre 2026

Demande d'Hervé Obejero (16 novembre 2026) : terminer toutes les fiches, sans exception, pour une bibliothèque entièrement au statut « Vérifié ». Point de départ : les 409 fiches restées en communauté après la passe du 15 novembre (`verification-communaute-2026-11-15.md`), plus 17 fiches déjà « Vérifié » qui gardaient un connecteur non précisé. Le détail fiche par fiche est dans `verification-communaute-2026-11-16.json`.

## Bilan

| | Fiches |
|---|---|
| Examinées (409 en communauté et 17 à régulariser) | 426 |
| Vérifiées sur preuve | 272 |
| Fusionnées dans une autre fiche (doublons) | 32 |
| Écartées (fabrication de loueur, référence introuvable, accessoire sans signal) | 46 |
| En attente de preuve (appareil réel, prise principale non documentée) | 76 |

Bibliothèque livrée après l'opération : **1 519 fiches, toutes au statut « Vérifié »**. Les 154 fiches sorties de la bibliothèque restent dans `src/library/devices/` ; elles sont listées dans `src/library/excluded.json` avec leur motif.

Sur les 464 fiches en communauté au 9 novembre : 311 sont vérifiées (55 le 15 novembre, 256 le 16), 32 fusionnées, 46 écartées, 75 en attente de preuve. La 76e fiche en attente, le moniteur Swit M-1073H, était marquée « Vérifié » alors que son alimentation n'a pas de connecteur documenté.

## Ce qui n'a pas été fait, et pourquoi

- **Aucun site refusant l'accès automatisé n'a été contourné** (codes 401 et 403, contrôles anti-robot de ManualsLib, manualshive, manualmachine, pro.sony, absen.com). Ce n'est pas une autorisation que l'auteur d'une bibliothèque peut donner à la place du site. Les agents sont passés par d'autres sources : sites des constructeurs, copies hébergées par des revendeurs ou des loueurs, archives publiques, photos.
- **Aucune caractéristique n'a été écrite sans source.** Quand trois passes n'ont rien trouvé pour une prise principale, la fiche est mise en attente au lieu d'être déclarée vérifiée.

## Décisions de méthode prises pour cette passe

1. **Embase secteur non publiée : connecteur `mains-cord`.** Quand un document du modèle établit l'alimentation sur le secteur et un cordon détachable (cordon fourni, ou embase « AC IN » nommée sans sa forme), la prise secteur est saisie comme « Cordon secteur détachable (embase de l'appareil non publiée) ». La fiche dit ce qui est documenté, sans supposer une IEC C14. 130 fiches l'emploient, surtout des écrans Samsung, LG, Panasonic et les serveurs Modulo Pi. Variante `mains-cord-3ph` pour le triphasé (Barco XLM HD30).
2. **Prise secondaire au connecteur non publié** (port de service, télécommande propriétaire, tally, pédale, recopie secteur) : retirée de la fiche et citée dans son champ `notes`. Une prise principale n'est jamais retirée.
3. **Connecteurs fixés par une norme** : un port Ethernet cuivre sans précision est saisi `rj45` (une embase etherCON accepte aussi une fiche RJ45) ; un port MIDI sans précision est saisi DIN 5. Aucune règle de ce genre pour le DMX, l'USB ou les haut-parleurs.
4. **Lecture sur dessin, plan coté ou photo du modèle** : admise, avec la provenance écrite dans le champ `format`.
5. **Pages de loueur** : « PC 16 A » sur le cordon d'un appareil vaut cordon captif, sur un socle femelle vaut prise française ; « pour rail tri » vaut adaptateur de rail 3 allumages.
6. **Onze connecteurs ajoutés au catalogue** : `mains-cord`, `mains-cord-3ph`, `lemo2`, `veam`, `kino-4bank`, `power-molex`, `power-din4`, `dc-locking`, `ross-power6`, `minidin6`, `f-connector`.
7. **Désignation corrigée** quand la référence de la fiche est une variante d'écriture évidente de celle du constructeur ; l'ancienne écriture reste en alias (par exemple OXO WD512R, Sierra Aspen 1616HD-3G, Panasonic PT-RZ12K, Samsung DB22D).

## Résultat par lot

| Lot | Marques | Fiches | Vérifiées | Fusionnées | Écartées | En attente |
|---|---|---|---|---|---|---|
| 01 | Samsung | 26 | 16 | 10 | 0 | 0 |
| 03 | Modulo Pi | 17 | 16 | 0 | 0 | 1 |
| 05 | Sony | 17 | 11 | 1 | 0 | 5 |
| 06 | Panasonic | 11 | 11 | 0 | 0 | 0 |
| 07 | Barco | 10 | 10 | 0 | 0 | 0 |
| 08 | Taiden | 13 | 9 | 0 | 1 | 3 |
| 09 | LG, Samsung | 19 | 11 | 8 | 0 | 0 |
| 10 | Fischer Amps, Audio-Technica, Midas, Solid State Logic… | 24 | 15 | 2 | 0 | 7 |
| 11 | DELL, Epson, iiyama, Infiled… | 19 | 13 | 1 | 1 | 4 |
| 12 | NEC, NEOVO, Pioneer, Swit… | 22 | 15 | 2 | 4 | 1 |
| 13 | AVAB, ChamSys, ETC, MA Lighting… | 22 | 14 | 1 | 1 | 6 |
| 14 | ARRI, Arri, Ayrton, Bron… | 24 | 9 | 4 | 5 | 6 |
| 15 | Elation, ERMEA, Franco Belge, GHOST… | 21 | 5 | 0 | 14 | 2 |
| 16 | LTM, LUMILA, Mac Mah, Mole-Richardson… | 24 | 14 | 2 | 2 | 6 |
| 17 | Quartzcolor, Reel EFX, Robe, SAF… | 20 | 13 | 1 | 4 | 2 |
| 18 | THOMAS, Avid, Cisco, OXO | 20 | 9 | 0 | 0 | 11 |
| 19 | Tenda, Canon, COMPULITE, APC… | 20 | 6 | 0 | 9 | 5 |
| 20 | Robert Juliat, Avalon, DiGiGrid, Empirical Labs… | 18 | 16 | 0 | 1 | 1 |
| 21 | TC Electronic, Yamaha, Amix, Klark Teknik… | 23 | 11 | 0 | 2 | 10 |
| 22 | Datapath, Decimator Design, Digital Forecast, ECLER… | 20 | 13 | 0 | 2 | 5 |
| 23 | Teradek, Analog Way, Blackmagic Design, Ross Video… | 19 | 19 | 0 | 0 | 0 |
| 24 | Epson, LG, Panasonic, Samsung… | 17 | 16 | 0 | 0 | 1 |

Le lot 24 est le lot de régularisation des 17 fiches déjà vérifiées. Les fiches en attente comptées dans chaque lot incluent celles restées bloquées après la troisième passe.

## Contrôles

- Contrôle par script de toute la bibliothèque : aucun connecteur non précisé, aucun connecteur hors catalogue, aucune connectique « à documenter », une source datée par fiche.
- Relecture indépendante de documents constructeurs sur un échantillon tiré au sort (LG 55UH5F-H, Teradek Beam TX, Decimator DMON-4S, Ayrton Arcaline 2) et sur les cas tranchés à la main (Barco XLM HD30, ETC Gio d'origine, ETC SmartPack) : conformes aux fiches.
- Suite de tests complète, lint, typage et construction : au vert.

## Points de vigilance

- **Vérifications sur indices indirects.** Quatre projecteurs sur rail (LTM LT300B et LT300N, Procédés Hallier Fenyx 20W B et N) : le type de rail est déduit de la rubrique du loueur ; la déduction est écrite dans la fiche. Deux LTM « PC16 » : cordon déduit de la désignation.
- **Fiches vérifiées mais incomplètes.** Les prises secondaires retirées sont citées dans `notes`. Sur quelques appareils la liste est longue (Barco SLM R12+, Barco UDM-4K30, Taiden HCS-4100).
- **Sources de seconde main.** Plusieurs vérifications reposent sur la copie d'un document constructeur hébergée par un tiers, ou sur une seule page de revendeur (Elation DTW Blinder 350 IP, Blackmagic ATEM Television Studio HD, Lilliput PVM220S, Absen PL3.9 Pro V2).
- **Variantes choisies le 4 novembre.** Les ETC SmartPack Portable 6 et 12 canaux sont en attente : la fiche technique ETC donne un panneau de sorties différent par référence (SL620A, B, C, J, P, V, TM ; SL1210A, B, P, V, TM). Il suffit de désigner la référence du parc pour les terminer.
- **Marques jugées propres au loueur** faute de toute trace ailleurs : Dynatec, ERMEA, Scenilux, HUALI, Amix, Bernie Sound. Si l'une d'elles est un vrai constructeur, sa fiche se réintègre comme une fiche en attente.

## Fiches en attente de preuve (76)

Pour réintégrer une fiche : compléter la preuve (le plus souvent une photo nette de la face arrière ou le manuel), passer la fiche à « verified », retirer son identifiant de `src/library/excluded.json`.

| Fiche | Appareil | Ce qu'il faut pour la réintégrer |
|---|---|---|
| `absen-pl2-5pro` | Absen PL2.5Pro | Prises principales dataIn/dataOut et acIn/acOut : connecteurs non nommés. Nouvelle recherche web (rentex, 4wall, fullcompass, brochures Absen) : aucune ne nomme les connecteurs de la PL2.5 Pro ; absen.com 403 (non contourné). Il faudrait le manuel PL2.5 Pro ou |
| `akai-apc40` | Akaï APC40 | Forme de la prise USB (principale) : schéma du panneau arrière (manuel p. 5, image lue) trop petit pour lire la forme ; Gear4music : 403 (non contourné) ; akaipro 404 ; Wayback : connexion coupée. USB-B lu seulement pour la MKII. Il faudrait une photo nette de |
| `arri-eb-2500-4000-alf-dmx` | ARRI EB 2500/4000 ALF DMX | Prises DMX, tête et secteur de la référence L2.76676(UL) (ALF + DMX, 90-125/180-250 V, VEAM) : aucun document ne porte cette référence ; le manuel L2.76646.0 est celui de la version « 2,5/4 EB DMX » sans ALF nommé, et ne nomme pas le connecteur DMX (dessin seu |
| `avid-nitris-dx` | Avid Nitris DX | Face arrière complète (nombre et forme des prises vidéo SDI/composante/composite, audio XLR/TRS/DB25) sans source concordante. Pistes : recherche web (3 variantes), AVGear, Adorama, B&H, brochure déjà lue en passe 2 ; cvp.com 403 non contourné. Il faudrait le  |
| `avid-mtrx-dual-sdi` | Avid Pro Tools / MTRX Dual SDI/HD/3G Card | Nombre et sens des BNC (principales) : aucun document (guide installation 5.4.5, fiche MTRX II, kmraudio, proaudiola, Avid Build Your Own) ne les donne ; seulement « 2 x 16 canaux », « Accepts 3G, HD-SDI and SD-SDI », « Embed 2-channels », « de-embed up to 16  |
| `bron-kobold-dw400` | Bron Kobold DW400 | Connecteur du câble tête / ballast (prise principale) : le manuel et la fiche technique (relus) disent seulement « lamp base cable », écrou à vis, 6 m ; 1 recherche supplémentaire sans résultat Kobold. Il faudrait une photo du ballast ou le nom du connecteur ( |
| `canon-hj11x4-7-ias-e` | Canon HJ11x4.7 IAS E | Prise principale lens (câble d'objectif) : le connecteur « Hirose 12 points » n'est écrit dans aucun document de ce modèle. Fiche Novelty HJ11ex4-7B.pdf sans texte exploitable sur ce point ; recherche web : un manuel Canon d'un autre objectif évoque le Hirose  |
| `canon-hj40x-ias-d` | Canon HJ40x IAS D | Prise principale lens (câble d'objectif) : le manuel Canon HJ40x10B/14B IASD-V (Novelty, scan, relu en images) nomme « Lens Cable » (p. 11, énoncé « Power and signals are sent to the lens from the camera head through this cable »), « Connector for Remote Zoom  |
| `chamsys-mq500-stadium` | ChamSys MagicQ MQ500 Stadium | Sorties DMX (principales) : aucune source ne nomme le connecteur (XLR 5) du MQ500 Stadium d'origine ; les XLR 5 ne sont cités que pour les MQ500M+ et le Stadium Wing. Réseau : etherCON non prouvé (rj45 par D8 possible). Pistes : page ChamSys p=5333, manuel MQ5 |
| `chauvet-festoon-2-rgb` | Chauvet DJ Festoon 2 RGB | Sortie guirlande (principale) : connecteur circulaire IP54 non nommé par le manuel (vu sur le dessin p. 3, 3 contacts apparents). Il faudrait la référence du connecteur (fiche Chauvet de la guirlande ou du câble d'extension). |
| `chauvet-professional-colorado-2-quad-zoom-ip-mkii` | Chauvet Professional COLORado 2 Quad Zoom IP MKII | Entrées et sorties DMX (prise principale) : le constructeur les nomme « connecteur IP66 propriétaire », absent de connectors.ts ; entrée secteur : cordon captif terminé par ce même connecteur propriétaire (aucun identifiant exact). La variante MKII n'est pas c |
| `cisco-sg300-10p` | Cisco SG300-10P | Entrée d'alimentation du bloc externe (principale) : seuls des revendeurs de blocs de remplacement parlent de « 4 pin » (48 V ou 54 V selon les annonces), sans toujours écrire DIN ; eBay, Newegg-like, pcliquidations, prology : 403 non contourné ou texte non lu |
| `cyanview-rio-live` | CyanView RIO Live | Toutes les prises : support-next.cyanview.com/docs/products/rio (relu) ne donne que « DC IN 10 V à 24 V », pas de PoE, sans forme de connecteur ; ni Ethernet, ni séries, ni USB, ni GPIO listés ; présentation 2022 trop lourde. Il faudrait la fiche technique ou  |
| `d-san-perfectcue-mini` | D'San PerfectCue Mini | Prises principales usb1 et usb2 : forme non nommée. Guide D'San relu (texte et image de couverture : port USB rectangulaire visible mais trop petit pour conclure), page produit D'San « USB (2), deux câbles USB de 6 pieds » sans forme, recherche web sans résult |
| `datapath-x4` | Datapath x4 | Entrée Power 5 V CC (unique, principale) : connecteur du bloc non nommé par le constructeur ; B&H dit « barrel » mais une réponse client dit propriétaire. Pistes : manuel, setup guide, fiche technique, annonces Exxact, SabrePC, B&H. |
| `desisti-piccoletto` | DeSisti Piccoletto | Variante non désignée par la fiche, son alias ou la page Novelty (les alimentations diffèrent d'une variante à l'autre ; DMX « miniature XLR » (brochure) contre « 5-pin XLR » (page Novelty), nombre de broches du mini-XLR non écrit). Il faudrait la désignation  |
| `desisti-piccoletto-led` | DeSisti Piccoletto LED | Aucune variante précise désignée par la fiche, son alias ou sa source de loueur (D11) ; connexions DMX (mini-XLR ou XLR 5) et alimentation (batterie, bloc intégré, rail, bloc externe) différentes selon P/F/FA/FE/DIM/VW. Il faudrait que le superviseur désigne l |
| `ecler-dva15s` | ECLER DVA15S | Toutes les prises (BNC, RCA, secteur) : la référence DVA 1-5S n'a aucun document. Le manuel DVA1-5c (cdn.korn.eu) décrit entrée vidéo BNC 75 ohms, entrée audio RCA, 5 sorties, secteur 90-264 V avec câble secteur, mais c'est une autre référence : aucune source  |
| `ecler-sva-15s` | ECLER SVA 15S | Toutes les prises (BNC vidéo, RCA audio) : aucun document pour la référence SVA1-5S ; il faudrait le manuel ou une photo de la face arrière du SVA1-5S. Passe 3 : recherche web « SVA1-5S » (seulement une annonce d'occasion Asonic et le manuel du SVA1-5c voisin, |
| `electro-voice-dml-1122` | Electro-Voice DeltaMax DML-1122 | Entrée haut-parleur (principale) : le manuel propriétaire DML-1122 (manualslib 43628, 17 p., sections Back Panel Connections / Connector and Cable Requirements) existe mais son texte n'est pas lisible ici ; manualzz 403 non contourné ; products.electrovoice.co |
| `electro-voice-nd308` | Electro-Voice N/D308 | Sortie XLR : aucune page n'écrit le connecteur du N/D308 (Solotech sans connecteur, Reverb 403, sound-dali 503, pixelproaudio 404). Il faudrait une photo nette du N/D308 ou son fiche technique. |
| `etc-smartpack-portable-12` | ETC SmartPack Portable 12 canaux | Fiche sans référence de variante : sorties de puissance variables (SL1210A Edison, B stage pin, P powerCON, V 2 multipin 6 circuits, TM bornier). Entrée de puissance sur bornes à cosses, pas de cordon. Il faut choisir une référence (D11). |
| `etc-smartpack-portable-6` | ETC SmartPack Portable 6 canaux | Idem : variantes SL620A/B/C/J/P/V/TM. Choisir une référence. |
| `fujinon-rmd-30` | FUJINON RMD-30 | Liaison à l'objectif et alimentation (principales). Essayé en passe 3 : PDF Novelty (polices absentes, rendu image : tableaux vides), fiche Pyramid Imaging T16x5.5DA-R11 (rendu image : tableaux vides, texte seulement via recherche : « 4-pin receptacle / plug » |
| `grass-valley-advc-g4` | Grass Valley ADVC G4 | Entrée d'alimentation DC (unique, principale) : forme non nommée par Grass Valley. Passe 3 : manuel utilisateur Grass Valley (403, non contourné) ; forum Grass Valley (utilisateur : « BIG 4 pin DIN » pour l'ADVC G1) et Gearspace (Kycon ou mini-DIN 4 selon les  |
| `infiled-x3-9-curve` | Infiled X3.9 Curve | Data In, Data Out, Power In, Power Out (principales) : aucun document ne nomme les connecteurs. Passe 3 : recherche web (pages Infiled d'autres gammes 3,9 mm sans connecteurs ; manuel de la gamme Wallpaper, autre produit, non retenu). |
| `infiled-x3-9-edge` | Infiled X3.9 Edge | Data In, Data Out, Power In, Power Out (principales) : aucun document ne nomme les connecteurs. Passe 3 : recherche web (pages Infiled d'autres gammes 3,9 mm sans connecteurs ; manuel de la gamme Wallpaper, autre produit, non retenu). |
| `infiled-x3-9-flat` | Infiled X3.9 Flat | Data In, Data Out, Power In, Power Out (principales) : aucun document ne nomme les connecteurs. Passe 3 : recherche web (pages Infiled d'autres gammes 3,9 mm sans connecteurs ; manuel de la gamme Wallpaper, autre produit, non retenu). |
| `keylite-boule-chinoise` | KEYLITE Boule Chinoise | Forme de l'alimentation (cordon fixe ou embase) : aucune source, aucune nouvelle piste. |
| `kino-flo-bal-415-230` | Kino Flo BAL-415-230 (Select 4Bank) | Entrée secteur : aucune mention de cordon fourni ni d'embase AC nommée dans le manuel 3100052 (relu en texte intégral : seule tension 220-240 V CA sur circuit à la terre) ; recherches revendeurs sans résultat. D1 non applicable. Il faudrait une photo de la fac |
| `klarkteknik-dn9696` | Klark Teknik DN9696 | Entrée secteur (unique, principale) : aucun document DN9696 lisible. Brochure AV-iQ renvoie 503/503 en passe 1 et HTTP 503 en passe 3 ; le téléchargement direct échoue (certificat). Recherches : DN9696 + rear panel IEC/AES50/manual, DN9696 quick start. Seuls D |
| `l-acoustics-mtd112b` | L-Acoustics MTD112b | in1/in2 (NL4, câblage 1+/1-) : aucun texte lisible du manuel MTD. Une recherche donne l'extrait « sense return speakON : ch.1 1+ & 1-, ch.2 2+ & 2- » mais depuis manualshive (anti-robot, non lu directement) ; le PDF Novelty benelux du manuel répond 526 ; usedf |
| `lafont-lp-22` | Lafont Audio Labs LP-22 | Entrée micro, sortie et secteur : aucun document. Recherches : LP-22 + rear panel/XLR/IEC, Audiofanzine EN/FR (sans caractéristiques). Produit retiré. Il faudrait le manuel ou une photo de la face arrière. |
| `le-cosinus-transfo-40-kva` | Le Cosinus Transfo 40 kVA | Prises principales in (primaire 400 V) et out (secondaire 230 V) : la fiche gamme (160 kVA) dit « borniers ou barres suivant la puissance » sans préciser pour 40 kVA ; le certificat 40 kVA ne parle pas du raccordement. Nouvelle recherche web (fiche Le Cosinus  |
| `ledgo-lg-1200cscii` | LEDGO LG-1200CSCII | Alimentation (bloc secteur externe, prise CC non nommée) et DMX (type non nommé ; un revendeur néerlandais parle d'entrée et sortie DMX). Aucun manuel LEDGO trouvé, Adorama montre l'ancien modèle Pro 1200. Il faudrait le manuel ou une photo de la face arrière. |
| `lightware-modex-opts-rx` | Lightware MODEX-OPTS-RX | Cadre modulaire : connecteur média fibre, alimentation et modules d'E/S dépendent de la configuration commandée (manuel Lightware, cf. passe 2). Pas de nouvelle preuve en passe 3. |
| `lightware-modex-opts-tx` | Lightware MODEX-OPTS-TX | Cadre modulaire : connecteur média fibre, alimentation et modules d'E/S dépendent de la configuration commandée (manuel Lightware, cf. passe 2). Pas de nouvelle preuve en passe 3. |
| `ma-lighting-scx16` | MA Lighting SCX16 | Aucune connectique ni alimentation publiée. Appareil probablement la « Scancommander Extension » (réf. MA 120103, archive MA : MIDI vers la console, commande à distance DMX/analogique/SMPTE, câble de liaison fourni), mais « SCX16 » n'apparaît nulle part chez M |
| `mac-mah-blackgun-400` | Mac Mah Blackgun 400 | Alimentation : aucun document Mac Mah ; le Eurolite Black Gun trouvé est un autre produit (pas de rapprochement sans supposition). |
| `martin-atomic-detonator` | Martin Atomic Detonator | Une ou deux embases XLR 3 (données + alimentation) et nature du signal : brochure Martin ambiguë ; manuels non accessibles (403/anti-robot, refus respectés). |
| `martin-maxedia-compact` | Martin Maxedia Compact | out1 (sortie vidéo 1) et entrée secteur : aucun manuel Maxedia Compact ni photo de face arrière. Recherches : manual connections, rear panel photo, specifications. Le manuel Maxedia 4 dit que les connexions varient avec la révision matérielle. Il faudrait le m |
| `midas-xl3-24` | Midas XL3 24 voies | Face arrière non documentée : les pages 110-119 du manuel scanné (textfiles) sont des tableaux de brochage internes aux modules (XL301/310/320/330, connecteurs 'A' et 'B', 22 à 36 points) et le brochage du bloc XL390, pas des prises de face arrière ; la fiche  |
| `midas-xl3-32` | Midas XL3 32 voies | Face arrière non documentée : les pages 110-119 du manuel scanné (textfiles) sont des tableaux de brochage internes aux modules (XL301/310/320/330, connecteurs 'A' et 'B', 22 à 36 points) et le brochage du bloc XL390, pas des prises de face arrière ; la fiche  |
| `midas-xl3` | Midas XL3 40 voies | Face arrière non documentée : les pages 110-119 du manuel scanné (textfiles) sont des tableaux de brochage internes aux modules (XL301/310/320/330, connecteurs 'A' et 'B', 22 à 36 points) et le brochage du bloc XL390, pas des prises de face arrière ; la fiche  |
| `mled-m6` | MLed M6 | Data In/Out et Power In/Out (principales) : connecteurs non publiés. Passe 3 : pages LED Wall Central (spécifications électriques seulement) et Elation M6 (produit Elation sans lien établi avec Desay, non retenu), manuel FDS MLED (autre produit). |
| `modulo-pi-nano-1` | Modulo Pi Modulo Player Nano NANO-1 | Prise d'alimentation DC (unique, principale) : forme de la fiche non publiée. Passe 3 : recherche web sur le panneau arrière, rien de Modulo Pi. Il faudrait une photo du panneau arrière ou le manuel matériel. |
| `mole-richardson-mickey` | Mole-Richardson Mickey | acIn : la page Novelty (loueur) dit « 50W/220V, transfo intégré » sans cordon ni embase ; aucune fiche constructeur. Le « Mickey-Mole » de Mole-Richardson connu est un 1000 W, pas ce 50 W dichroïque : identité à confirmer. |
| `mole-richardson-mickey-mole-50w-b` | Mole-Richardson Mickey Mole 50W B | Alimentation 220 V : page sans cordon ni embase ; aucune fiche Mole-Richardson trouvée pour ce modèle. |
| `mole-richardson-mickey-mole-50w-b-rail` | Mole-Richardson Mickey Mole 50W B – Rail | Type de rail non écrit (page Novelty : « – Rail », 50W/220V, aucune mention « rail tri » ni adaptateur). Le port rail-3c déjà dans la fiche n'est donc pas prouvé. |
| `mole-richardson-vm70` | Mole-Richardson VM70 | acIn : aucune source propre au VM70 (aucune trace chez Mole-Richardson, Adorama, Kayelites ; Novelty sans page). |
| `montelem-transfo-63t40` | Montelem TRANSFO 63T40 | Prises principales (entrée et sortie du transformateur) : aucune connectique publiée. Nouvelle recherche web : aucune fiche « TRANSFO 63T40 ». Montelem Industrie existe bien (transformateurs, code NAF 27.11Z, établissement fermé depuis le 29/01/2024 selon l'IN |
| `newtek-tricaster-450cs` | NewTek TriCaster 450CS | Liaison USB (unique, principale) : le guide NewTek « TriCaster CS User Guide » (computerwise.net, rendu en texte) dit « USB cable supplied », alimentation par le bus, mais ne dit pas la forme du connecteur côté pupitre (D8 : pas de règle pour la forme USB). Il |
| `newtek-tricaster-455` | NewTek TriCaster 455 | Entrée secteur (principale) : aucune source pour le 455 ne cite cordon ni embase ; le manuel famille (rév. oct. 2019) ne cite le 455 que dans les marques. Loueur PCG (productionconsultinggroup.com) donne les prises (4 entrées SDI/analogiques dont Y/C en BNC, 2 |
| `oxo-multibeam-led18-fcw` | OXO MultiBeam LED18 FCW | Identité non établie : manual OXO « MultiBeam FCW » = 18 × 8 W, la fiche dit 18 × 10 W ; aucune prise nommée ; powerCON seulement évoqué pour une autre gamme OXO. manualmachine : 403 non contourné. Il faudrait le manuel OXO nommant les connecteurs ou une photo |
| `oxo-par575msr` | OXO PAR575MSR | Alimentation et DMX : aucun document. Le manuel OXO MultiBeam 575 MSR décrit un autre appareil (12,3 kg) ; recherche web : aucune référence « OXO PAR575MSR ». |
| `oxo-solano2` | OXO Solano 2 | Embase de l'alimentation externe 9-12 VDC (principale, bloc secteur fourni). Fiche OXO FI420180 relue et rendue en image (face avant seulement) ; recherches web sans manuel du Solano 2 (seul le Solano Pro, autre modèle, est documenté). Il faudrait une photo de |
| `philips-arenaled-gen3` | PHILIPS ArenaLED Gen3 | Forme de la connexion 5 pôles (alimentation) et de l'interface DMX : fiches Signify (BVP427) citent « Connection unit 5-pole » et « Dynamix DMX » sans forme ni brochage ; la 5 pôles peut être alimentation seule, DMX non attribué. |
| `sony-ac500` | Sony AC500 | Entrée secteur et sortie continue (principales) : aucun document Sony ni revendeur pour l'AC-500. Passe 3 : recherche web (seulement des manuels DXC-D30 qui citent l'adaptateur CMA-8A, et rien sur l'AC-500). Alimentation externe : D1 ne s'applique pas. Il faud |
| `sony-hdc-x300` | Sony HDC-X300 | DC IN (entrée d'alimentation unique, bloc externe) : forme et nombre de broches non écrits. Essayé : manuel Sony (403, non contourné ; une tentative Wayback a été refusée par le contrôle d'accès de la session, non répétée), deux recherches (aucun texte du HDC- |
| `sony-icp-3016` | Sony ICP-3016 | Face arrière du pupitre ICP-3016 (AC IN, 2 RJ-45, 4 USB, DVI-D) : manuel Sony 4-444-919-21 en 403 (non contourné) ; le manuel MVS-6520 sur manualslib (pages 54, 56, 57, 60, 62) ne donne pas la face arrière des ICP (il mentionne seulement « AC IN A and B » sur  |
| `sony-mvs-3000` | Sony MVS-3000 (processeur de mélangeur) | Entrées AC IN A/B du processeur : seule la page ICP-6520 (panneau de commande) du manuel ManualsLib décrit « AC IN A/B 3 broches, cordons optionnels », elle ne vaut pas pour le processeur ; aucune page lue ne décrit l'embase du processeur. Il faudrait la page  |
| `sony-mvs-3000a` | Sony MVS-3000A | Entrées AC IN A/B du processeur : seule la page ICP-6520 (panneau de commande) du manuel ManualsLib décrit « AC IN A/B 3 broches, cordons optionnels », elle ne vaut pas pour le processeur ; aucune page lue ne décrit l'embase du processeur. Il faudrait la page  |
| `spotlight-fresneled-50-dmx` | Spotlight FresneLED 50 DMX | Prises principales (DMX, secteur) sans preuve pour ce modèle exact : aucun manuel lisible (manualzilla 403 non contourné, Novelty 404, recherches web). Il faudrait le PDF du manuel de la génération exacte. Fiche inchangée, portStatus pending conservé. |
| `spotlight-profiled-50-zs-dmx` | Spotlight Profiled 50 ZS DMX | Prises principales (DMX, secteur) sans preuve pour ce modèle exact : aucun manuel lisible (manualzilla 403 non contourné, Novelty 404, recherches web). Il faudrait le PDF du manuel de la génération exacte. Fiche inchangée, portStatus pending conservé. |
| `swit-m-1073h` | SWIT M-1073H (double moniteur 7" rack 3U) | Prise principale dc (alimentation, DC 6,5-36 V) : forme non nommée. Fiche SWIT relue et rendue en image (la photo du panneau arrière est trop petite pour lire l'embase, le bloc d'alimentation y apparaît sans forme lisible). Wex (ADPV16, 4-pin XLR) renvoie 403  |
| `swit-s-2120c` | Swit S-2120C | Toutes les prises (fiche sans port) : aucune source pour la référence S-2120C. Essayé : recherches « SWIT S-2120C », « S-2120C 1024 LED user manual », « S-2120C XLR 4-pin » ; seules les références S-2120CS/DS (V-mount, entrée DC XLR 4 broches chez des revendeu |
| `taiden-hcs-5100ma-08n` | Taiden HCS-5100MA/08N | Identité : la référence HCS-5100MA/08N (sans « FS ») n'a aucun document Taiden. Le seul document de ce type est la fiche HCS-5100MA/FS/08N (variante avec fibre optique SC), qui donne 55 W max et « Power supply socket » sans forme ni cordon, alors que la fiche  |
| `taiden-hcs-8385` | Taiden HCS-8385 | Embase micro (principale) : fiches techniques euro-trend 8385/60 et 8685 : seulement « Socket for pluggable microphone » ; manuel HCS-8300 (manualmachine) : 403, non contourné ; manuals.online : 404. Il faudrait le manuel d'installation ou une photo de l'embas |
| `taiden-hcs-8685` | Taiden HCS-8685 | Embase micro (principale) : fiches techniques euro-trend 8385/60 et 8685 : seulement « Socket for pluggable microphone » ; manuel HCS-8300 (manualmachine) : 403, non contourné ; manuals.online : 404. Il faudrait le manuel d'installation ou une photo de l'embas |
| `tc-electronic-2290` | TC Electronic 2290 | Prise principale ac : ni embase ni cordon nommés. Prise tclink : « TC LINK or TC 0144 Serial Jack » sans forme. Essayé : manuel 2290 sur Scribd (page non chargée), service-tcgroup.tcelectronic.com (502 du proxy), vintagedigital.com.au (403, non contourné), rec |
| `thomas-acl250-seriex8-chromee` | THOMAS ACL250/SERIEX8 chromée | Alimentation : aucune fiche JTE ; nouvelle recherche sans résultat. |
| `thomas-acl250-seriex8-noire` | THOMAS ACL250/SERIEX8 noire | Alimentation / connectique de la barre : page Novelty « noire » relue, aucune connectique ; aucune fiche constructeur JTE retrouvée. Il faudrait la fiche JTE de la barre ou une photo de ses sorties de câble. |
| `thomas-par56` | THOMAS PAR56 | Prise d'alimentation : aucune source ne nomme la connectique du PAR56 THOMAS. Il faudrait la fiche JTE ou une photo. |
| `thomas-par64` | THOMAS PAR64 | Alimentation : fiche JTE sans preuve de câble sans fiche, identité de la version Novelty (2,9 kg contre 1,84 kg) incertaine ; pas de nouvelle source. |
| `thomas-par64-barre-x6` | THOMAS PAR64 BARRE X6 | Les 6 circuits : « connectique 6 circuits » (Novelty) sans nom de prise ; nouvelle recherche (Socapex/PC16/multicable) ne donne que des fouets d'autres fournisseurs. Il faudrait la fiche JTE de la barre ou une photo de la sortie. |
| `yamaha-spx990` | Yamaha SPX990 | Prise principale ac : le manuel Yamaha SPX990E (usa.yamaha.com, relu en images) montre la face arrière p. 5 sans entrée secteur, la page Add-1 donne seulement les tensions par pays (120 V 60 Hz, 230 V 50 Hz, 25 W) ; ni embase, ni cordon, ni « AC IN » nommés ;  |

## Fiches fusionnées (32)

La désignation de chaque fiche fusionnée est reprise en alias sur la fiche conservée.

| Fiche fusionnée | Désignation | Fiche conservée |
|---|---|---|
| `absen-pl-3-9-pro-v2` | Absen PL 3.9 pro V2 | `absen-pl3-9-pro-v2` |
| `absen-pl2-5` | Absen PL2.5 | `absen-pl2-5pro` |
| `chauvet-professional-double-derby` | Chauvet Professional Double Derby | `chauvet-double-derbyx` |
| `chauvet-professional-well-fit-b` | Chauvet Professional Well Fit B | `chauvet-well-fit` |
| `chauvet-professional-well-fit-c` | Chauvet Professional Well Fit C | `chauvet-well-fit` |
| `chauvet-professional-well-fit-n` | Chauvet Professional Well Fit N | `chauvet-well-fit` |
| `iiyama-b2280hs-novelty-27883` | iiyama B2280HS | `iiyama-b2280hs` |
| `lg-43sm5ke-novelty-33836` | LG 43SM5KE | `lg-43sm5ke` |
| `lg-43uh5f-h-novelty-35526` | LG 43UH5F-H | `lg-43uh5f-h` |
| `lg-55sm5ke-novelty-33853` | LG 55SM5KE | `lg-55sm5ke` |
| `lg-55uh5f-h-novelty-35100` | LG 55UH5F-H | `lg-55uh5f-h` |
| `lg-lg-32sm5j-b` | LG LG 32SM5J-B | `lg-32sm5j` |
| `lg-uh5f-h` | LG UH5F-H | `lg-75uh5f-h` |
| `ma-lightcommander-ii-12-24` | MA Lighting Lightcommander II 12/24 | `ma-lighting-lightcommander-12-24` |
| `prolights-eclipse-zoom` | Prolights Eclipse Zoom | `prolights-gallery-eclipse-zoom-19-36` |
| `prolights-gallery-eclipse` | Prolights Gallery Eclipse | `prolights-gallery-eclipse-zoom-19-36` |
| `samsung-db32` | Samsung DB32 (32") | `samsung-db32e` |
| `samsung-db40` | Samsung DB40 (40") | `samsung-db40e` |
| `samsung-db48` | Samsung DB48 (48") | `samsung-db48e` |
| `samsung-db55` | Samsung DB55 (55") | `samsung-db55e` |
| `samsung-dm32` | Samsung DM32 (32") | `samsung-dm32e` |
| `samsung-dm75` | Samsung DM75 (75") | `samsung-dm75e` |
| `samsung-me75` | Samsung ME75 (75") | `samsung-me75c` |
| `samsung-me95` | Samsung ME95 (95") | `samsung-me95c` |
| `samsung-qb75h-novelty-32249` | Samsung QB75H | `samsung-qb75h` |
| `samsung-qm98f-novelty-33029` | Samsung QM98F | `samsung-qm98f` |
| `samsung-ue46` | Samsung UE46 (46") | `samsung-ue46d` |
| `samsung-ue55` | Samsung UE55 (55") | `samsung-ue55d` |
| `sony-pmw-350` | Sony PMW-350 | `sony-pmw-350k` |
| `spotlight-profiled-50` | SPOTLIGHT ProfiLED 50 | `spotlight-profiled-50-zs-dmx` |
| `swisson-xsr-r5-5r` | Swisson XSR-R5-5R | `swisson-xsr-5r-5r` |
| `wireless-solution-blackbox-f-1-g4` | Wireless Solution BlackBox F-1 G4 | `w-dmx-blackbox-f-1-g4` |

## Fiches écartées (46)

| Fiche | Désignation | Motif |
|---|---|---|
| `amix-dpr-10` | Amix DPR 10 | Aucune trace d un constructeur indépendant nommé Amix dans 5 recherches (passe 1 et 2) : marque propre ou revendue sous marque par le loueur Novelty (règle CLAUDE.md : pas de fabrication de loueur). Réserve : la conclusi |
| `apc-smart-ups-1500` | APC Smart-UPS 1500 | Modèle non identifiable : « Smart-UPS 1500 » issu d'un relevé utilisateur sans référence exacte ; la désignation recouvre plusieurs références APC (SMT1500I, SMT1500RMI2U, SUA1500, SMC1500I…) aux connectiques différentes |
| `aric-rail-dichro` | ARIC RAIL/DICHRO | Appareil non identifiable : aucune référence ARIC « RAIL/DICHRO » ni projecteur ARIC dichroïque rail à transformateur intégré trouvé (recherche ARIC et catalogues) ; la même description exacte figure chez Mole-Richardson |
| `armoire-a125` | Fabricant non indiqué Armoire A125 | Fabrication ou désignation propre à un loueur : fiche issue du seul catalogue Audio Pro 2025 (section Distribution électrique), fabricant « Fabricant non indiqué », désignation générique. Recherches web : aucune trace d' |
| `armoire-a250` | Fabricant non indiqué Armoire A250 | Fabrication ou désignation propre à un loueur : fiche issue du seul catalogue Audio Pro 2025 (section Distribution électrique), fabricant « Fabricant non indiqué », désignation générique. Recherches web : aucune trace d' |
| `armoire-a32` | Fabricant non indiqué Armoire A32 | Fabrication ou désignation propre à un loueur : fiche issue du seul catalogue Audio Pro 2025 (section Distribution électrique), fabricant « Fabricant non indiqué », désignation générique. Recherches web : aucune trace d' |
| `armoire-a400` | Fabricant non indiqué Armoire A400 | Fabrication ou désignation propre à un loueur : fiche issue du seul catalogue Audio Pro 2025 (section Distribution électrique), fabricant « Fabricant non indiqué », désignation générique. Recherches web : aucune trace d' |
| `armoire-a63` | Fabricant non indiqué Armoire A63 | Fabrication ou désignation propre à un loueur : fiche issue du seul catalogue Audio Pro 2025 (section Distribution électrique), fabricant « Fabricant non indiqué », désignation générique. Recherches web : aucune trace d' |
| `bernie-sound-vst30` | Bernie Sound VST30 | La marque Bernie Sound et le VST30 n apparaissent nulle part hors du catalogue Novelty (recherche web « Bernie Sound VST30 » sans aucun résultat à ce nom, passe 1 et 2). Marque propre ou revendue sous marque par le loueu |
| `boite-b32` | Fabricant non indiqué Boîte B32 (B32 / B32M / B32T / B232T) | Fabrication ou désignation propre à un loueur : fiche issue du seul catalogue Audio Pro 2025 (section Distribution électrique), fabricant « Fabricant non indiqué », désignation générique. Recherches web : aucune trace d' |
| `coemar-moteur-boule-20-30` | coemar Moteur-Boule Ø20/30 | Référence de type BOULEF020MOT introuvable chez Coemar (deux recherches : aucun moteur de boule à facettes au catalogue) ; probablement un code interne du loueur Novelty ; accessoire mécanique sans signal. |
| `coemar-moteur-boule-40-50` | coemar Moteur-Boule Ø40/50 | Référence de type BOULEF020MOT introuvable chez Coemar (deux recherches : aucun moteur de boule à facettes au catalogue) ; probablement un code interne du loueur Novelty ; accessoire mécanique sans signal. |
| `coemar-moteur-boule-60-100` | coemar Moteur-Boule Ø60/100 | Référence de type BOULEF020MOT introuvable chez Coemar (deux recherches : aucun moteur de boule à facettes au catalogue) ; probablement un code interne du loueur Novelty ; accessoire mécanique sans signal. |
| `de-sisti-de-lux-2-4650` | De Sisti De Lux 2 4650 | Modèle non identifiable : la référence 4650 n'apparaît chez aucun document De Sisti ni revendeur (De Lux 2 = 4600, De Lux 4 = 4610/4660). Corriger en 4600 serait une supposition. |
| `divers-spoutnick` | DIVERS Spoutnick | Marque « DIVERS » : aucun constructeur identifiable ; référence Novelty seule ; aucun produit « Spoutnick » trouvé en recherche. |
| `dynatec-booster-6s-set-x2` | Dynatec Booster 6S | marque Dynatec introuvable chez un constructeur indépendant : seules pages trouvées = novelty.fr (et sa déclinaison london.novelty.fr). Requêtes : « Dynatec Booster 6S DMX splitter », « Dynatec Novelty marque propre... » |
| `dynatec-rh32` | Dynatec RH32 | marque Dynatec introuvable chez un constructeur indépendant : seules pages trouvées = novelty.fr (et sa déclinaison london.novelty.fr). Requêtes : « Dynatec Booster 6S DMX splitter », « Dynatec Novelty marque propre... » |
| `dynatec-rh63` | Dynatec RH63 | marque Dynatec introuvable chez un constructeur indépendant : seules pages trouvées = novelty.fr (et sa déclinaison london.novelty.fr). Requêtes : « Dynatec Booster 6S DMX splitter », « Dynatec Novelty marque propre... » |
| `dynatec-trusssplitter` | Dynatec TrussSplitter | marque Dynatec introuvable chez un constructeur indépendant : seules pages trouvées = novelty.fr (et sa déclinaison london.novelty.fr). Requêtes : « Dynatec Booster 6S DMX splitter », « Dynatec Novelty marque propre... » |
| `eaton-baes-sati-d-ambiance-lum10208-lum10208` | Eaton BAES SATI d ambiance-LUM10208 – LUM10208 | Modèle non identifiable : la référence LUM10208 est donnée par des distributeurs (passe 1) pour un luminaire fluorescent STD 400C, alors que les trois PDF cités par la fiche (via Novelty, 0 octet, illisibles) portent sur |
| `ermea-acl600t` | ERMEA ACL600T | Marque ERMEA introuvable hors des pages du loueur Novelty (Novelty France, Londres, Occitanie) : aucun site, catalogue ou revendeur d'un constructeur indépendant n'a été trouvé après plusieurs recherches (nom de marque,  |
| `ermea-par36h` | ERMEA PAR36H | Marque ERMEA introuvable hors des pages du loueur Novelty (Novelty France, Londres, Occitanie) : aucun site, catalogue ou revendeur d'un constructeur indépendant n'a été trouvé après plusieurs recherches (nom de marque,  |
| `ermea-par38h` | ERMEA PAR38H | Marque ERMEA introuvable hors des pages du loueur Novelty (Novelty France, Londres, Occitanie) : aucun site, catalogue ou revendeur d'un constructeur indépendant n'a été trouvé après plusieurs recherches (nom de marque,  |
| `ermea-par56` | ERMEA PAR56 | Marque ERMEA introuvable hors des pages du loueur Novelty (Novelty France, Londres, Occitanie) : aucun site, catalogue ou revendeur d'un constructeur indépendant n'a été trouvé après plusieurs recherches (nom de marque,  |
| `franco-belge-quartz300b` | Franco Belge QUARTZ300B | Référence QUARTZ300B / Franco Belge introuvable : deux recherches web (marque + référence, avec et sans tiret) ne donnent que des projecteurs de piscine ou LED sans rapport. Modèle non identifiable, aucune correction évi |
| `ghost-gyro36r` | GHOST GYRO36R | GHOST GYRO36R introuvable hors Novelty (recherche marque + référence + description : seuls des gyrophares Eurolite et autres marques). Modèle non identifiable ; tension et raccordement non écrits. |
| `griven-arco-650` | Griven Arco 650 | Aucun produit « Arco 650 » chez Griven : recherches Woodbrass/Thomann/Algam et web général ne renvoient que Freccia 650-1000-1200, Spot 650/1000 PC/Fresnel. Fiche issue d'un relevé utilisateur (désignation seule). Pas de |
| `huali-quartz-led-480w` | HUALI QUARTZ LED 480W | Aucune trace de la marque HUALI ni du produit hors de la page Novelty (recherche web sans résultat). La page ne dit pas si les queues de câble de 20 cm et le boîtier d'adressage dédié sont d'origine ou rapportés par le l |
| `lansee-d12g-duo` | LanSee D12G DUO | Modèle non identifiable chez le constructeur : la référence « D12G DUO » est absente du catalogue LanSee (catalogue général, Widy Box, Muxlan II, AV Devices) et seuls deux loueurs du même groupe la citent, sans connecteu |
| `lansee-extender-12g-sdi` | LanSee Extender 12G SDI | Modèle non identifiable (aucune référence LanSee « Extender 12G SDI ») et connectique visiblement ajoutée ou modifiée par le loueur (Neutrik duo, etherCON, XLR 12 V caméra). |
| `legrand-fluo060` | LEGRAND FLUO060 | Désignation FLUO060 sans trace chez Legrand (le constructeur vend des variateurs et ballasts du bâtiment, pas de rampes fluo sur rail pour spectacle ; recherche web « FLUO120DMX » sans résultat). Codes de la forme FLUO12 |
| `legrand-fluo060dmx` | LEGRAND FLUO060DMX | Désignation FLUO060DMX sans trace chez Legrand (le constructeur vend des variateurs et ballasts du bâtiment, pas de rampes fluo sur rail pour spectacle ; recherche web « FLUO120DMX » sans résultat). Codes de la forme FLU |
| `legrand-fluo120` | LEGRAND FLUO120 | Désignation FLUO120 sans trace chez Legrand (le constructeur vend des variateurs et ballasts du bâtiment, pas de rampes fluo sur rail pour spectacle ; recherche web « FLUO120DMX » sans résultat). Codes de la forme FLUO12 |
| `legrand-fluo120dmx` | LEGRAND FLUO120DMX | Désignation FLUO120DMX sans trace chez Legrand (le constructeur vend des variateurs et ballasts du bâtiment, pas de rampes fluo sur rail pour spectacle ; recherche web « FLUO120DMX » sans résultat). Codes de la forme FLU |
| `legrand-fluo240dmx` | LEGRAND FLUO240DMX | Désignation FLUO240DMX sans trace chez Legrand (le constructeur vend des variateurs et ballasts du bâtiment, pas de rampes fluo sur rail pour spectacle ; recherche web « FLUO120DMX » sans résultat). Codes de la forme FLU |
| `legrand-guirl12-40` | LEGRAND GUIRL12/40 | Désignation GUIRL12/40 sans trace chez Legrand (le constructeur vend des variateurs et ballasts du bâtiment, pas de rampes fluo sur rail pour spectacle ; recherche web « FLUO120DMX » sans résultat). Codes de la forme FLU |
| `ltm-lt1000` | LTM LT1000 | Référence issue d’un relevé de désignations utilisateur, sans aucune source : aucune page constructeur, revendeur ni loueur trouvée (passe 1 : LTM LT1000, LTM LT300 projecteur fresnel LED ; passe 2 : recherche web LTM LT |
| `mled-m6-ech` | MLed M6-ECH | Accessoire mécanique sans signal ni alimentation à représenter (échelle de maintien arrière, ports vides, portStatus none) ; aucune trace d'un document constructeur, uniquement le catalogue Novelty. |
| `novelty-ap63compt` | Non renseigné AP63COMPT | Modèle non identifiable : la page Novelty AP63COMPT (catégorie Armoire de comptage) ne nomme aucun fabricant et décrit une lyre LED de 342 x 3 W (70 kg, 100-240 V), sans rapport avec un comptage ; aucune connectique ni d |
| `procedes-hallier-luneo-5w-set-x24` | Procedes Hallier Luneo 5W | Lot commercial du loueur (set de 24) sans fiche unitaire correspondante ; aucune trace du Luneo 5W chez Procédés Hallier (passe 1 : deux requêtes sans résultat). Pas de prise documentée. |
| `quartzcolor-polaris-bambino-630` | Quartzcolor Polaris Bambino 630 | Modèle non identifiable : aucune « Polaris Bambino 630 » chez Quartzcolor/Strand (gamme Bambino 500, 650, 1000, 2000 W ; Polaris est une autre gamme). Corriger en 650 W serait une supposition (D6). |
| `robert-juliat-hermes` | Robert Juliat HERMES | Modèle non identifiable : aucune trace d'une interface Hermès chez Robert Juliat (page Novelty vide de caractéristiques, recherches « Robert Juliat Hermes interface DMX » sans résultat ; seul « Hermes » trouvé est un las |
| `scenilux-bt1000` | Scenilux BT1000 | Marque propre apparente du loueur Novelty : aucune trace d'un constructeur Scenilux indépendant (recherche web sans résultat, page Novelty sans document ni constructeur). |
| `scenilux-bt250` | Scenilux BT250 | Marque propre apparente du loueur Novelty (même motif que BT1000). |
| `scenilux-bt500` | Scenilux BT500 | Marque propre apparente du loueur Novelty (même motif que BT1000). |
| `taiden-hcs-5100ma-16bd` | Taiden HCS-5100MA/16BD | Modèle non identifiable : la référence MA/16BD n'existe pas chez Taiden (MC/16BD existe, d'une autre série, avec Dante) ; aucune page de Novelty ou autre ne la décrit ; corriger en MC/16BD ou MA/FS/16B serait une supposi |
