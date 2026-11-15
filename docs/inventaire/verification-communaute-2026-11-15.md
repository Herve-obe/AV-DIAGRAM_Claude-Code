# Vérification des fiches « Communauté » du 15 novembre 2026

Point de départ : les 464 fiches non vérifiées recensées dans `non-verifiees-2026-11-09.md`. Elles ont été réparties en 21 lots, chacun confié à un agent, puis relues. Le détail fiche par fiche (modifications, sources lues, ce qui manque) est dans `verification-communaute-2026-11-15.json`.

## Bilan

| | Fiches |
|---|---|
| Examinées | 464 |
| Passées en « Vérifié » | 55 |
| Corrigées ou complétées, laissées en « Communauté » | 30 |
| Inchangées | 379 |
| Restent en « Communauté » | 409 |

Bibliothèque après l'opération : 1 264 fiches vérifiées, 409 en communauté (avant : 1 209 et 464).

## Sources admises (décision d'Hervé Obejero, 15 novembre 2026)

Par ordre de préférence :

1. document du constructeur (manuel, fiche technique, page produit, plan coté) ;
2. photo ou schéma du constructeur montrant le panneau de connexion ;
3. page d'un revendeur qui nomme les connecteurs du modèle, ou photo nette de son panneau ;
4. page d'un loueur, dans les mêmes conditions.

Garde-fous appliqués :

- la nature de chaque source est écrite dans son champ `document` (constructeur, revendeur, loueur, presse, copie hébergée par un tiers) ;
- une photo ou un plan de gamme ne vaut pour une référence que si un document du constructeur confirme par écrit la même prise pour cette référence ;
- aucune déduction par ressemblance entre modèles ;
- une connectique ajoutée ou modifiée par un loueur n'est pas retenue ;
- un site qui refuse l'accès automatisé (codes 401 ou 403, contrôle anti-robot) n'est pas contourné : la piste est abandonnée et notée.

## Résultat par lot

| Lot | Marques | Fiches | Vérifiées | Corrigées, non vérifiées | Inchangées |
|---|---|---|---|---|---|
| 01 | Samsung | 26 | 0 | 1 | 25 |
| 03 | Modulo Pi | 26 | 9 | 0 | 17 |
| 05 | Sony | 19 | 2 | 2 | 15 |
| 06 | Panasonic | 17 | 6 | 1 | 10 |
| 07 | Barco | 16 | 6 | 3 | 7 |
| 08 | Taiden, Modulo Pi | 17 | 4 | 1 | 12 |
| 09 | LG, Samsung | 19 | 0 | 0 | 19 |
| 10 | Fischer Amps, Audio-Technica, Midas, Solid State Logic, Soundcraft… | 24 | 0 | 1 | 23 |
| 11 | BenQ, DELL, Dell, Epson, iiyama… | 23 | 4 | 4 | 15 |
| 12 | NEC, NEOVO, Pioneer, SWIT, Swit… | 24 | 2 | 0 | 22 |
| 13 | AVAB, ChamSys, ETC, MA Lighting, Martin… | 22 | 0 | 2 | 20 |
| 14 | ARRI, Arri, Ayrton, Bron, Chauvet DJ… | 24 | 0 | 0 | 24 |
| 15 | Elation, ERMEA, Franco Belge, GHOST, Griven… | 24 | 3 | 0 | 21 |
| 16 | LTM, LUMILA, Mac Mah, Mole-Richardson, PARA NOCTA… | 24 | 0 | 0 | 24 |
| 17 | Quartzcolor, Reel EFX, Robe, SAF, Scenilux… | 21 | 1 | 2 | 18 |
| 18 | THOMAS, Avid, GoPro, Cisco, Netgear… | 24 | 4 | 3 | 17 |
| 19 | Tenda, Canon, COMPULITE, APC, Eaton… | 20 | 0 | 2 | 18 |
| 20 | Robert Juliat, Avalon, DiGiGrid, DRAWMER, Empirical Labs… | 22 | 4 | 4 | 14 |
| 21 | TC Electronic, Yamaha, Amix, Klark Teknik, M-Audio… | 24 | 1 | 2 | 21 |
| 22 | Datapath, Decimator Design, Digital Forecast, ECLER, Extron… | 24 | 4 | 2 | 18 |
| 23 | Startech, Teradek, Analog Way, Blackmagic Design, Datavideo… | 24 | 5 | 0 | 19 |

## Fiches passées en « Vérifié » (55)

| Fiche | Appareil | Ce qui a été levé | Nature des sources |
|---|---|---|---|
| `analog-way-pulse-pls300` | Analog Way PULSE PLS300 | ac : unspecified → iec-c13 | photo-constructeur |
| `barco-xld-hb-1-0` | Barco XLD HB 1.0 | status : community → verified ; description : mention HB désormais confirmée ; source Audio General ajoutée | revendeur, constructeur |
| `barco-xld-hb-1-45-1-8` | Barco XLD HB 1.45 – 1.8 | status : community → verified ; description : mention HB désormais confirmée ; source Audio General ajoutée | revendeur, constructeur |
| `barco-xld-hb-1-8-2-4` | Barco XLD HB 1.8 – 2.4 | status : community → verified ; description : mention HB désormais confirmée ; source Audio General ajoutée | revendeur, constructeur |
| `barco-xld-hb-2-2-3` | Barco XLD HB 2.2 – 3 | status : community → verified ; description : mention HB désormais confirmée ; source Audio General ajoutée | revendeur, constructeur |
| `barco-xld-hb-2-8-5-5` | Barco XLD HB 2.8 – 5.5 | status : community → verified ; description : mention HB désormais confirmée ; source Audio General ajoutée | revendeur, constructeur |
| `barco-xld-hb-5-5-8-5` | Barco XLD HB 5.5 – 8.5 | status : community → verified ; description : mention HB désormais confirmée ; source Audio General ajoutée | revendeur, constructeur |
| `benq-mh680` | BenQ MH680 | ac : unspecified → iec-c13 ; status community → verified ; 2 sources ajoutées | constructeur |
| `benq-mh684` | BenQ MH684 | ac : unspecified → iec-c13 ; status community → verified ; 1 source ajoutée | constructeur |
| `cisco-catalyst-2950sx` | Cisco Catalyst 2950SX | portStatus pending retiré ; status : community → verified ; source ajoutée : relecture du guide Cisco 78-11157-05 | constructeur |
| `clear-com-hms-4x` | Clear-Com HMS-4X | hotmic : level ajouté line+4 (0 dBu nominal réglable, 12 dBu max, 100 ohms max) ; hotmic : format complété ; description : retrait de « niveau non publié » ; sources : fi | constructeur |
| `datavideo-se-2800` | Datavideo SE-2800 | ajout de la source Instruction Manual (manuel constructeur) avec détail des prises | constructeur |
| `dell-n3024` | Dell N3024 | status community → verified ; document de la source Dell reformulé (nature et contenu) | constructeur |
| `drawmer-ds201` | DRAWMER DS201 | status community → verified ; source manuel constructeur détaillée ajoutée | constructeur |
| `gopro-media-mod-adfmd-001` | GoPro Media Mod (ADFMD-001) | status : community → verified ; description : HERO9 à HERO13 Black, précision sur les sources ; format hdmi : « Micro HDMI (type D) d'après les revendeurs » ; 2 sources a | constructeur, revendeur |
| `innled-t4x-b` | Innled T4X-B | description : « 30 à 110h » → « 6 à 110h » (fiche Innled : 6 à 110 h) ; sources : nature précisée (loueur / constructeur copie Novelty) ; status : community → verified | constructeur |
| `innled-t4x-n` | Innled T4X-N | description : « 30 à 110h » → « 6 à 110h » ; sources : nature précisée ; status : community → verified | constructeur |
| `kiloview-n50` | Kiloview N50 (12G-SDI / NDI) | dc : unspecified → dc-barrel (jack 5,5/2,5 mm) ; statut community → verified | constructeur |
| `kiloview-n60` | Kiloview N60 (HDMI / NDI) | dc : unspecified → dc-barrel (jack 5,5/2,5 mm) ; statut community → verified | constructeur |
| `kramer-vm-5s` | Kramer VM-5S | statut community → verified (relecture : prises et valeurs confirmées) | constructeur, revendeur |
| `ledpro-x6` | Ledpro X6 | sources : nature précisée ; status : community → verified | constructeur |
| `lightware-edid-manager-v4` | LIGHTWARE Edid Manager V4 | usb : unspecified → usb-mini ; format dviIn/dviOut : « DVI-I socket » → DVI-D 29 broches numérique (selon fiche constructeur) ; statut community → verified | constructeur |
| `lilliput-fs7` | Lilliput FS7 | dc : unspecified → dc-barrel ; phones : niveau line+4 retiré (non sourcé, casque exclu de la règle de niveau) ; port usb (USB-A, mise à jour) ajouté ; source manuel Lilli | constructeur |
| `m-audio-m-track-plus-ii` | M-Audio M-Track Plus II | status : community → verified ; portStatus « pending » retiré ; sources : documents des deux sources existantes précisés, accessed 2026-11-15 | constructeur |
| `modulo-pi-rmp-pro-1` | Modulo Pi Modulo Player Pro (châssis durci) RMP-PRO-1 | audio1 : unspecified → xlr3 ; audio2 : unspecified → xlr3 ; source ajoutée : photo constructeur 2019 du châssis durci | constructeur, photo-constructeur |
| `modulo-pi-rmp-pro-2` | Modulo Pi Modulo Player Pro (châssis durci) RMP-PRO-2 | audio1 : unspecified → xlr3 ; audio2 : unspecified → xlr3 ; source ajoutée : photo constructeur 2019 du châssis durci | constructeur, photo-constructeur |
| `modulo-pi-rmp-pro-2x4k` | Modulo Pi Modulo Player Pro (châssis durci) RMP-PRO-2x4K | audio1 : unspecified → xlr3 ; audio2 : unspecified → xlr3 ; source ajoutée : photo constructeur 2019 du châssis durci | constructeur, photo-constructeur |
| `modulo-pi-rmp-pro-3x4k` | Modulo Pi Modulo Player Pro (châssis durci) RMP-PRO-3x4K | audio1 : unspecified → xlr3 ; audio2 : unspecified → xlr3 ; source ajoutée : photo constructeur 2019 du châssis durci | constructeur, photo-constructeur |
| `modulo-pi-rmp-pro-4` | Modulo Pi Modulo Player Pro (châssis durci) RMP-PRO-4 | audio1 : unspecified → xlr3 ; audio2 : unspecified → xlr3 ; source ajoutée : photo constructeur 2019 du châssis durci | constructeur, photo-constructeur |
| `modulo-pi-rmp-pro-4x4k` | Modulo Pi Modulo Player Pro (châssis durci) RMP-PRO-4x4K | audio1 : unspecified → xlr3 ; audio2 : unspecified → xlr3 ; source ajoutée : photo constructeur 2019 du châssis durci | constructeur, photo-constructeur |
| `modulo-pi-rmp-pro-6` | Modulo Pi Modulo Player Pro (châssis durci) RMP-PRO-6 | audio1 : unspecified → xlr3 ; audio2 : unspecified → xlr3 ; source ajoutée : photo constructeur 2019 du châssis durci | constructeur, photo-constructeur |
| `modulo-pi-rmp-ux-1` | Modulo Pi Modulo Player Ultra (châssis durci) RMP-UX-1 | audio1 : unspecified → xlr3 ; audio2 : unspecified → xlr3 ; source ajoutée : photo constructeur 2019 du châssis durci | constructeur, photo-constructeur |
| `modulo-pi-rmp-ux-2` | Modulo Pi Modulo Player Ultra (châssis durci) RMP-UX-2 | audio1 : unspecified → xlr3 ; audio2 : unspecified → xlr3 ; source ajoutée : photo constructeur 2019 du châssis durci | constructeur, photo-constructeur |
| `modulo-pi-rmp-ux-2x4k` | Modulo Pi Modulo Player Ultra (châssis durci) RMP-UX-2x4K | audio1, audio2 : unspecified → xlr3 ; status : community → verified ; source constructeur précisée | constructeur |
| `modulo-pi-rmp-ux-3x4k` | Modulo Pi Modulo Player Ultra (châssis durci) RMP-UX-3x4K | audio1, audio2 : unspecified → xlr3 ; status : community → verified | constructeur |
| `modulo-pi-rmp-ux-4` | Modulo Pi Modulo Player Ultra (châssis durci) RMP-UX-4 | audio1, audio2 : unspecified → xlr3 ; status : community → verified | constructeur |
| `mrc-audio-eqlimit` | MRC Audio EQlimit | mic1, mic2 : unspecified → xlr3, level mic ; display : unspecified → xlr3 ; modemPwr : unspecified → dc-barrel ; usb : unspecified → usb-b ; description mise à jour ; sta | constructeur |
| `netgear-jgs516pe` | Netgear JGS516PE | status : community → verified ; source ajoutée : relecture du guide d'installation Netgear | constructeur |
| `neutrik-nxp2rx-e` | Neutrik NXP2RX-E | usb : unspecified → usb-b ; description : mention « ports à documenter » remplacée par « station de base seule » | constructeur |
| `neutrik-nxp2tx-e` | Neutrik NXP2TX-E | usb : unspecified → usb-b ; description : mention « ports à documenter » remplacée par « station de base seule » | constructeur |
| `oxo-tw512` | OXO TW512 | dmx : unspecified → xlr3 ; dc : unspecified → powercon (secteur 100-240 V CA) ; status : community → verified ; 2 sources précisées | loueur, constructeur |
| `panasonic-ak-uc4000` | Panasonic AK-UC4000 | statut community -> verified (relecture complète, aucune valeur corrigée) | constructeur |
| `panasonic-ak-ucu600` | Panasonic AK-UCU600 | ac : unspecified -> iec-c13 ; format ac précisé | constructeur |
| `panasonic-aw-he40ske` | Panasonic AW-HE40SKE | dc : unspecified -> dc-barrel ; format dc précisé (12 V CC, bloc fourni, PoE+) | constructeur |
| `panasonic-aw-he42` | Panasonic AW-HE42 | audio : unspecified -> minijack ; audio : niveau line+4 -> mic (micro -60 dBV / ligne -10 dBV, commutable) ; format audio précisé | constructeur |
| `panasonic-aw-ue100` | Panasonic AW-UE100 | dc : unspecified -> dc-barrel | constructeur |
| `panasonic-pt-rz120be` | Panasonic PT-RZ120BE | ac : unspecified -> iec-c13 ; weightKg 25.2 -> 23.6 ; powerW 1275 -> 1100 | constructeur |
| `robert-juliat-alimentation-a2-2500` | Robert Juliat Alimentation A2 2500 (poursuites 1039 / 1439) | status community → verified ; description : Héloïse/Ivanhoé étaient inversés (Ivanhoé = 1039, Héloïse = 1439) | constructeur |
| `robert-juliat-victor-1159b` | Robert Juliat Victor 1159B | status community → verified ; description : retrait de « connectique à compléter », ajout cordons et 2 040 W ; source fiche DSFR104 (lue en image) ajoutée | constructeur |
| `sgm-i-2-wash` | SGM i-2 Wash | dmxIn : unspecified → xlr5 ; dmxOut : unspecified → xlr5 ; acIn : unspecified → bare-wire (format « 69 LED RGBW, IP65 » remplacé) ; powerW : 90 → 230 (max constructeur) ; | constructeur, loueur |
| `sony-pmw-ex3` | Sony PMW-EX3 | dc : unspecified → dc-barrel ; status community → verified | constructeur |
| `sony-pxw-x70` | Sony PXW-X70 | dc : unspecified → dc-barrel ; status community → verified | constructeur |
| `startech-dock-usb-c-usb-a` | Startech Dock USB-C & USB-A | dc : unspecified → dc-barrel ; weightKg : 0.365 → 0.402 (fiche technique constructeur : 402 g) ; 2 sources constructeur ajoutées | constructeur |
| `swit-m-1070h` | SWIT M-1070H | status : community → verified ; source ajoutée : page Novelty (loueur) relue, connectique complète | loueur |
| `taiden-hcs-5100t-35b` | Taiden HCS-5100T/35B | ac : unspecified → iec-c13 ; status : community → verified ; 2 sources constructeur ajoutées | constructeur |

## Fiches corrigées mais laissées en « Communauté » (30)

| Fiche | Correction | Ce qui manque encore |
|---|---|---|
| `barco-hdf-w30-flex` | dcOut : unspecified → dc-barrel (embase ronde jack DC visible sur le dessin du panneau) | Entrée secteur : fiche multipolaire à bride de verrouillage (aspect industriel type Harting), aucun identifiant de connectors.ts ne correspond : connecteur manquant au catalogue, ac laissé unspecified. dcOut déduit du dessin seule |
| `barco-hdx-w20-flex` | dcOut : unspecified → dc-barrel (dessin du panneau) | Entrée secteur à bride, non nommée (probablement hors catalogue) : ac laissé unspecified. dcOut déduit du dessin seulement. |
| `barco-udx-4k32` | remote : unspecified → xlr3 ; dcOut : unspecified → dc-barrel ; sync3dOut : unspecified → bnc ; sync3dIn : unspecified → bnc | ac reste unspecified : fiche multipolaire à bride, absente de connectors.ts (connecteur manquant). Fiche : note hdbt (un ou deux ports) non tranchée. |
| `chamsys-mq80` | ac : powercon → powercon-true1 ; format « Neutrik powerCON TRUE1, 110-240 V CA » (la fiche disait 90-240 V, non sourcé) ; ajout de la prise hdmi (HDMI | Reste community. Non confirmés : types d'embase DMX (xlr5), réseau (etherCON : seulement une mention de revendeur « Ethercon locking connectors »), LTC et entrée audio non listées dans la fiche sans connecteur publié. Description  |
| `compulite-corona-m` | ports : 3 prises créées (dmx xlr5 in, dmx48 xlr4 in, analog xlr3 in), portStatus retiré ; weightKg : 4.75 ; source constructeur ajoutée, notes | Texte de la fiche commun à toute la gamme Corona : sens et existence d'une sortie/traversée non confirmés ; secteur interne 240/110 V non nommé (non saisi). Laissée community. |
| `db-technologies-k-162` | source constructeur ajoutée | La sortie : le constructeur annonce trois sorties (XLR, jack, RCA) : une seule prise « out » à trancher. Secteur « VDE type » : ne prouve pas IEC C14. Manuel K82/K162 non téléchargeable par lien direct. Note : la fiche indique « 6 |
| `digital-forecast-bridge-m-hh` | audioIn : unspecified → minijack (3,5 mm) | Reste community : le connecteur USB (usb-mini) n'est établi que par un petit dessin coté, l'image du panneau constructeur ne l'étiquette pas, et Adorama ne donne pas son type ; fonction inconnue. Niveau line+4 de audioIn non confi |
| `epson-eb-pu1008b` | source Epson User's Guide ajoutée ; weightKg : ajouté 16.3 (Epson Specifications Rev.106 : EB-PU1008B/1008W/1007B/1007W approx. 16.3 kg) | Embase secteur non nommée par Epson (guide en ligne : « AC power inlet » ; pictogramme schématique, non une photo nette) : laissée unspecified, pas de déduction. La fiche ne contient pas le port USB-B « Service » du guide Epson ;  |
| `etc-source-four-led-zoom` | dmxIn : format « DMX512 / RDM, XLR 5 » → « DMX512-A, XLR 5 points » (RDM absent du manuel cité) | Les 4 prises sont confirmées pour la famille, mais la fiche est un « moteur » dont la série (Lustr+, Series 2, Studio HD…) n'est pas identifiée (consommation non renseignée, 4 à 173 W selon série) : doute sur l'identité, donc comm |
| `grass-valley-advc-g4` | source constructeur ajoutée (brochure ADVC G-series p. 9) | La prise DC n'est PAS un dc-barrel. Elle ressemble à un mini-DIN 4 broches mais aucun texte ne la nomme : laissée unspecified (hésitation avec minidin4 : décision humaine). |
| `iiyama-b2280hs` | weightKg : 5.1 → 5.2 (manuel iiyama, poids net B2280HS-B1/W1) ; source iiyama fiche produit ajoutée | Embase AC IN non nommée (manuel p.8/12 : seulement « Connecteur d'alimentation secteur (AC IN) », schéma sans détail) ; alimentation interne. Laissée unspecified. Fiche doublon de iiyama-b2280hs-novelty-27883. Le modèle de la fich |
| `iiyama-prolite-b2780hsu-b1` | usbUp : unspecified → usb-b ; weightKg : ajouté 8 ; depthMm : ajouté 250 ; 2 sources iiyama ajoutées | Embase AC IN non nommée ni dessinée (iiyama : « AC-Anschluss (AC IN) ») : ac laissé unspecified, fiche reste community. Écarts de fiche : le manuel montre 3 USB-DOWN + 1 USB-UP et une sortie casque (non dans la fiche) ; la fiche i |
| `jvc-dt-v17l2du` | dc : unspecified → xlr4 ; ac : unspecified → iec-c13 ; source manuel JVC p.8 ajoutée | Le manuel porte sur le DT-V17L2D ; la fiche est DT-V17L2DU (suffixe U, probablement version US 120 V) : identité non confirmée par un document nommant le DU (manualowl : 403, non contourné), donc fiche laissée community. Le reste  |
| `kino-flo-bal-415-230` | weightKg : 2.7 ; notes ajoutées | Embase secteur non nommée dans 3 révisions du manuel ; photo du ballast trop petite (un cordon noir visible, non concluant). Reste unspecified. |
| `lexicon-pcm96` | fw1 et fw2 (FireWire) supprimées : absentes du manuel (face arrière 2 RJ-45, IEC, MIDI, AES, XLR, BNC) ; outL/outR : modes line-10 et mention « commut | Relecture : la presse (Sound On Sound, 2008) décrit deux ports FireWire que le manuel lu ne montre pas ; ports rétablis avec réserve, fiche laissée en communauté. Manuel hébergé par un tiers (barryrudolph.com). Poids 3,9 kg (8,65  |
| `midas-heritage-1000` | source ajoutée : manuel constructeur p. 6 (copie Bestec) | Les nombres de prises (32 entrées, 10 groupes, etc.) ne sont pas lisibles : texte du manuel en grande partie chinois, non extractible. La fiche n'a aucune prise d'insert alors que le manuel montre des jacks TRS send/return : fiche |
| `novastar-cvt10-pro-s` | ac : unspecified → powercon ; port usb (usb-b) ajouté ; powerW 22, weightKg 5,9 | Reste community : la photo du panneau est celle du Pro-M, et elle montre des embases de style etherCON et des boîtiers optiques de style opticalCON alors que le texte dit LC : etherCON et lc non confirmés pour le Pro-S. Le documen |
| `oxo-funstrip` | dmxIn : unspecified → xlr3 ; dmxOut : unspecified → xlr3 ; acIn : unspecified → powercon ; acOut (recopie secteur, powercon) ajouté ; 2 sources ajouté | powerCON déduit du nom des câbles fournis (Sonovente), pas d'une photo. Doute d'identité : Sonovente annonce MR19, la notice La-BS GU10 (notice « Sunstrip DMX »), produit arrêté ; pas de page constructeur. Laissée community. |
| `oxo-simoun2` | acOut : format précisé « embase PC16A » (Novelty), connecteur laissé unspecified ; source ajoutée : Novelty | « PC16A » ne correspond sans ambiguïté à aucun identifiant de connectors.ts (CEE 7/5 ? Schuko ?) : non forcé. Décision humaine : mapper PC16A sur cee7-e ou ajouter un connecteur. Embase d'entrée : cordon captif repris de la notice |
| `oxo-uv-beam` | dmxIn : unspecified → xlr5 ; dmxOut : unspecified → xlr5 ; source ajoutée : fiche La-BS UVBEAM WP | Alimentation : « PC16 In » non traduisible en identifiant (powerCON ? CEE 7/5 ?), reste unspecified. L'identité « UV Beam » = « UVBEAM WP » est plausible (90 W, IP65) mais non confirmée. Sens in/out des XLR 5 pris sur le libellé « |
| `panasonic-dmc-gh4` | mic : unspecified -> minijack, niveau mic ; hp : unspecified -> minijack ; av : format précisé (prise dédiée 8 broches), reste unspecified | Connecteur AV OUT/DIGITAL (8 broches propriétaire) absent de connectors.ts : à décider (ajout d'un identifiant). La page Panasonic UK des spécifications a répondu 403, abandonnée. Le manuel ne dit pas si MIC est stéréo. |
| `robert-juliat-aramis` | 2 sources constructeur ajoutées (dossier technique 1013+ et brochure) | Tout est confirmé par écrit (version 1013+ à obturateur manuel), donc la fiche pourrait passer verified ; je l'ai laissée en community parce que src/library/variants.test.ts impose status 'community' pour Aramis (décision humaine  |
| `robert-juliat-heloise` | auxPower : format précisé (CEE 2P+T 10 A 250 V, réf. pièce COU0003250, usage max 2 A), connecteur laissé unspecified ; sources : brochure 1439 (identi | Modèle confirmé. La forme de l'embase auxiliaire n'est jamais nommée (ni IEC C13, ni Schuko) et le dessin ne la montre pas : laissée unspecified. Aucun identifiant ne correspond à « CEE 2P+T 10 A ». |
| `robert-juliat-ivanhoe` | auxPower : format précisé (CEE 2P+T 10 A 250 V, réf. COU0003250, usage max 2 A), connecteur laissé unspecified ; sources : brochure 1039 et dossier te | Même blocage que Héloïse : forme de l'embase auxiliaire non nommée. |
| `samsung-u28e850r` | ac : unspecified → iec-c13 (entrée [POWER IN] dessinée à trois broches en trapèze, IEC C14) ; hdmi1 : format « HDMI 2.0 (MHL) » → « HDMI, 3840 x 2160  | Reste en community : (1) la prise casque est dessinée ronde et décrite « casque » mais aucun document n'écrit « 3.5 mm » ; (2) « DP 1.2 » : le manuel parle de DisplayPort 1.1/1.2 sélectionnable (FreeSync), pas de version fixe ; (3 |
| `schneider-baes-1500-ova58924` | weightKg : ajouté 7.5 | Aucune prise documentée (bloc de sécurité raccordé au réseau, raccordement non décrit). portStatus laissé pending. |
| `schneider-ova48060` | weightKg : ajouté 3.4 ; source constructeur ajoutée | Aucune prise documentée. Puissance en VA seulement (11 VA), powerW non renseigné. Un document constructeur existe désormais (motif « aucun document constructeur » levé), mais pas de connectique. |
| `sony-pmw-350` | ilink : format « IEEE 1394 4 broches » → « 6 broches » (manuel Sony PMW-350K : i.LINK 6 broches) | dcOut (4 broches) et lens (12 broches) : famille mécanique non nommée par Sony, donc unspecified conservé (hirose12 déduit par ressemblance : interdit). usb : « 4 broches » seulement, usb-mini non confirmé. Fiche PMW-350 (corps nu |
| `sony-pmw-350k` | ilink : format 4 broches → 6 broches | Mêmes blocages que PMW-350 (dcOut, lens, usb). Doublon probable de sony-pmw-350 (candidat à fusion, décision humaine). |
| `taiden-tmx-0808sdi2` | ac : unspecified → iec-c13 ; source plan coté ajoutée | TAINET : connecteur non nommé, le plan montre des borniers mais sans libellé : laissé unspecified. Connecteur « TAINET » absent de connectors.ts à signaler si c'est un bornier ou une prise propriétaire. |

## Ce qui bloque encore (409 fiches)

| Motif relevé le 9 novembre | Fiches restantes |
|---|---|
| Image : seule l'embase secteur n'est pas nommée | 94 |
| Lumière : aucun document constructeur | 68 |
| Image : connecteur de signal non publié | 49 |
| Lumière : seule l'embase secteur n'est pas nommée | 27 |
| Audio : source à confirmer (relecture) | 19 |
| Image : aucun document constructeur | 18 |
| Audio : connecteur de signal non publié | 18 |
| Audio : seule l'embase secteur n'est pas nommée | 15 |
| Lumière : aucune prise documentée | 15 |
| Lumière : source à confirmer (relecture) | 13 |
| Audio : aucun document constructeur | 12 |
| Distribution : aucun document constructeur | 11 |
| Lumière : PDF constructeur, modèle non confirmé | 10 |
| Lumière : connecteur de signal non publié | 7 |
| Image : aucune prise documentée | 5 |
| Image : source à confirmer (relecture) | 4 |
| Image : PDF constructeur, modèle non confirmé | 4 |
| Image : plusieurs blocages : connecteur non précisé, niveau manquant | 3 |
| Lumière : PDF sans rapport avec le modèle | 3 |
| Image : PDF sans rapport avec le modèle | 2 |
| Image : PDF produit par Novelty | 2 |
| Réseau : seule l'embase secteur n'est pas nommée | 2 |
| Audio : PDF constructeur, modèle non confirmé | 1 |
| Image : PDF illisible | 1 |
| Divers : source à confirmer (relecture) | 1 |
| Divers : aucune prise documentée | 1 |
| Réseau : source à confirmer (relecture) | 1 |
| Distribution : connecteur de signal non publié | 1 |
| Lumière : PDF illisible | 1 |
| Distribution : source à confirmer (relecture) | 1 |

Le blocage principal reste l'embase secteur des écrans (Samsung, LG, Sony, NEC, iiyama) : les manuels ne la nomment pas, les photos de presse la cachent, et la plupart des sites de manuels refusent l'accès automatisé. Une photo de l'arrière de l'appareil, prise sur le parc, lèverait ces fiches en quelques minutes chacune.

## Corrections apportées à la relecture

- **Lexicon PCM96** : un agent avait supprimé les deux ports FireWire, absents du manuel lu. Le test de Sound On Sound (Hugh Robjohns, novembre 2008) décrit pourtant « two Firewire 400 ports » en face arrière. Les ports sont rétablis avec cette réserve et la fiche reste en communauté.
- **Modulo Pi RMP (12 fiches)** : deux agents avaient jugé différemment la même preuve. La fiche technique de chaque gamme (Pro et Ultra, châssis durci) écrit « 2 x XLR symmetrical audio outputs » pour ses références et montre le panneau arrière avec deux XLR mâles à 3 broches. La règle de la photo de gamme est donc remplie : les douze fiches sont vérifiées, avec une note sur les prises non saisies (recopie secteur, USB).
- **Dates de consultation** : quatre fiches vérifiées gardaient une date de lecture antérieure pour des sources relues le 15 novembre ; dates mises à jour.

## Décisions à prendre

### Preuves acceptées sur jugement, à confirmer

- Connecteur lu sur un dessin ou un plan coté du constructeur, non nommé dans le texte : BenQ MH680 et MH684, Panasonic AK-UCU600, AW-HE40S, AW-HE42, AW-UE100 et PT-RZ120, Taiden HCS-5100T/35B, Kramer VM-5S, Netgear JGS516PE, Cisco Catalyst 2950SX, MRC Audio EQlimit, Neutrik NXP2RX-E et NXP2TX-E, Lilliput FS7.
- « DC jack » traduit par `dc-barrel` : Sony PMW-EX3 et PXW-X70.
- Vérification sur la seule page d'un loueur ou d'un revendeur : Swit M-1070H, OXO TW512 (Novelty), type micro HDMI du GoPro Media Mod (revendeurs).
- Clear-Com HMS-4X : sortie Hot Mic notée `line+4` pour un niveau publié de 0 dBu.
- M-Audio M-Track Plus II : sorties gardées en `line-10`, seul le maximum (+2,86 dBu) est publié.
- SGM i-2 Wash : identifié à l'i-2 RGBW de SGM (69 LED, 6,1 kg) ; consommation passée de 90 W (Novelty) à 230 W (maximum SGM) ; alimentation par câble à fils nus.
- Panasonic PT-RZ120BE : 23,6 kg et 1 100 W d'après le manuel (la fiche portait 25,2 kg et 1 275 W).
- Fiches vérifiées « sur ce qu'elles affirment » mais incomplètes : Dell N3024 (ports d'empilage, USB), Sony PMW-EX3 (sorties moniteur, composante, S-Video, USB), Datavideo SE-2800 (RS-232 inutilisé), Modulo Pi RMP (recopie secteur, USB).

### Marques ou fabrications de loueur, candidates au retrait

Thomas (6 fiches), Dynatec (4), LanSee (2), armoires A32 à A400 et boîte B32, `novelty-ap63compt`, Coemar « Moteur-Boule » (3), « DIVERS Spoutnick », `aric-rail-dichro`, `mled-m6-ech`, Bernie Sound VST30, Amix DPR-10, cinq « Legrand FLUO », guirlandes GUIRL12/40, Griven Arco 650.

### Doublons probables

`samsung-qb75h-novelty-32249`, `samsung-qm98f-novelty-33029`, paires de générations Samsung DB/DM/ME, `sony-pmw-350` et `sony-pmw-350k`, paires Absen PL 3.9 et PL 2.5, paire MA Lightcommander 12/24, variantes Chauvet WELL Fit, paire DeSisti Piccoletto, `iiyama-b2280hs-novelty-27883`.

### Désignations ambiguës ou fausses

Swisson « XSR R5-5R », Swit S-4600 et S-2120C, Ecler DVA15S et SVA 15S, Sierra Aspen 1616HD et 3232HD, Extron DA4, Genelec 8020 CPM, Prolights Eclipse Zoom, Quartzcolor Polaris Bambino 630, Eaton LUM10208, APC Smart-UPS 1500, `lg-43lt340c0zb`, références Taiden HCS-5100MA, Innled « T4X-B » et « T4X-N » (désignations du loueur pour deux finitions du T4X), fiche `eurolite-s4par-blanc` dont le fabricant est ETC.

### Sens de « PC16 » dans les pages de loueur

Plusieurs pages (OXO Simoun 2, OXO UV Beam) annoncent une prise « PC16 » sans autre précision. Il faut décider de l'identifiant à retenir (`cee7-e` ou `schuko`) ou de laisser ces prises non précisées.

### Connecteurs absents du catalogue `src/model/connectors.ts`

Embase secteur industrielle verrouillable (Barco HDF, HDX, UDX), embase triphasée (Barco XLM HD30), LEMO 2 broches d'alimentation (Teradek Beam et Bolt XT), casque « aviation » (Blackmagic ATEM), AV 8 broches (Panasonic GH4), mini-DIN 6, MagSafe, télécommande d'objectif Canon 20 et 8 broches, connecteur circulaire Kino Flo, VEAM (ballast ARRI), TC Link, JVC 10 et 6 broches, Marshall à verrouillage, DC à vis DiGiGrid, « CEE 2P+T 10 A » (Robert Juliat), Taiden TAINET, Tajimi OPS2404 (Panasonic AK-UCU600).

### Fiches contredites ou incomplètes face au constructeur

ETC Gio (MIDI), ChamSys MQ500 et MQ70, MA dot2 XL-F, Sony LMD-2451W, ports USB des Modulo Pi, NEC LCD4020, Tenda (25 W contre 12 W), Soundcraft EPM6, SGM P-6 et P-3, Ross Ultrix FR2 (4 entrées 15 V citées, 2 saisies), Blackmagic ATEM Television Studio Pro 4K (entrée 12 V 4 broches non saisie), Diwel MELODYcaster (deux variantes d'alimentation mêlées), Analog Way Pulse PLS300 (audio « MCO 10 points » selon la fiche technique, « borniers 5 points » selon le guide rapide), Analog Way VIO 4K (synchro 3D : mini-DIN 3 ou 4 à trancher sur photo).

### Tests qui figent un statut

`src/library/variants.test.ts` impose le statut communauté aux Ayrton Arcaline 2 (50 et 100) et au Robert Juliat Aramis, alors que des sources les confirment maintenant. Les tests n'ont pas été modifiés.
