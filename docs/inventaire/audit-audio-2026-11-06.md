# Audit des équipements audio : 6 novembre 2026

Audit des 661 fiches constructeur du menu Audio par trois auditeurs (lots disjoints), puis contrôle par un superviseur. Seules les actions approuvées par le superviseur sont appliquées. Aucune fiche n'est promue en Vérifié. Les fichiers retirés sont supprimés du dépôt (choix de l'utilisateur) ; la liste figure dans `suppressions-audio-2026-11-06.json`.

Bilan : 6 retraits non audio, 17 doublons supprimés, 16 rangements corrigés, 88 fiches corrigées avec source, 41 propositions rejetées, 13 points à décider.

## Retraits (non audio)

| Fiche | Motif |
|--|--|
| `ace-audio-ace-pupitre-orateur-atluglass-oslo` | Pupitre orateur (lutrin) en Altuglas : mobilier sans signal ni connectique, rangé à tort dans Capture. Exemple donné par l'utilisateur. |
| `l-acoustics-k3-tilt` | Élément mécanique de posage du K3 sur KS28, sans signal : accessoire mécanique hors bibliothèque de synoptique. |
| `l-acoustics-karadownk2` | Élément mécanique de fixation de KARA sous K2, sans signal : accessoire mécanique hors bibliothèque de synoptique. |
| `nexo-idt-tvp` | Adaptateur mécanique vis M10 vers tube 35 mm pour enceintes ID, sans signal. |
| `novelty-cmx-adaptatateur` | Désignation collective d'adaptateurs divers (jack/XLR/RCA, câbles d'insert), sans appareil identifiable : même cas que NOVELTY CDXADAPT et novelty-cmx, déjà retirés. |
| `schoeps-srs-420-cg` | Rallonge col de cygne entre préampli et capsule Schoeps : accessoire de micro/câblage (comme dpa-dak4060 et les câbles déjà exclus), pas un appareil autonome à poser sur un synoptique. |

## Doublons supprimés

| Supprimée | Conservée | Motif |
|--|--|--|
| `bss-ar-133` | `bss-audio-ar133` | Même boîtier BSS AR-133. La fiche gardée (référencée par catalogue.test.ts) modélise correctement l'entrée unique jack/XLR en parallèle ; la référence du manuel BSS ZM0199-01 est reportée en source. |
| `bose-802-iii` | `bose-802-iii-novelty-22161` | Même Bose Panaray 802 Series III, mêmes deux NL4 en parallèle ; la fiche Novelty a description, alias et notices. La fiche technique Bose (Full Compass) est reportée en source. |
| `bose-s1` | `bose-s1-pro` | Même Bose S1 Pro (la fiche « S1 » décrit elle-même le « S1 Pro original »), ports identiques. Alias et page Novelty reportés. |
| `rme-madi-router` | `rme-madi-routeur` | Même RME MADI Router. La fiche gardée (référencée par les tests) sépare correctement les BNC In/Out, USB-A/B et IEC et porte puissance, masse, profondeur. Page d'archive RME reportée en source. |
| `roland-studio-capture-ua-1610` | `roland-ua-1610` | Même Roland STUDIO-CAPTURE UA-1610, 34 ports identiques ; la fiche gardée cite le manuel Roland. Alias et sources Novelty reportés. |
| `yamaha-vxs3` | `yamaha-vxs3f` | La fiche « VXS3 » décrit le VXS3F/VXS3FW (alias). La fiche gardée (vérifiée, référencée par les tests) modélise entrée et recopie. Alias et sources Novelty reportés. |
| `akg-c535` | `akg-c535-eb` | La fiche « C535 » décrit le C535 EB et cite son manuel. La fiche gardée a des sources constructeur. Le poids 0,3 kg n'est pas reporté : la fiche gardée signale deux valeurs constructeur contradictoires. |
| `sennheiser-md441-u` | `sennheiser-md441` | La fiche MD441 est explicitement la version MD 441 U (XLR3), plus complète (masse, manuel). Alias et page Sennheiser reportés. |
| `lexicon-pcm90-pcm91` | `lexicon-pcm90` | Référence combinée PCM90/PCM91 sans connectique ; les deux modèles existent séparément (lexicon-pcm90 et lexicon-pcm91), comme pour les références combinées déjà retirées (mkh406-mkh416). |
| `green-go-bpx` | `green-go-bpx-novelty-35686` | Même BPX ; la fiche Novelty reprend la source Green-GO et ajoute dimensions, consommation, PoE. Ancienne désignation reportée en alias. |
| `green-go-interface-x` | `green-go-interfacex` | Même Interface X (INTX) ; la fiche Novelty reprend la source Green-GO et ajoute 1 U, profondeur, consommation. Désignation reportée en alias. |
| `green-go-mcx` | `green-go-mcx-novelty-35634` | Même MCX ; la fiche Novelty reprend la source Green-GO et ajoute 1 U, profondeur, masse, consommation. |
| `green-go-mcxd` | `green-go-mcxd-novelty-35628` | Même MCXD ; la fiche Novelty est un sur-ensemble (niveaux ligne, PoE, dimensions). |
| `green-go-rdx` | `green-go-rdx-novelty-35670` | Même RDX ; la fiche Novelty est un sur-ensemble (PoE, dimensions, consommation). |
| `green-go-waa` | `green-go-waa-novelty-35673` | Même WAA ; la fiche Novelty est un sur-ensemble (PoE, dimensions, consommation). |
| `green-go-wbpx` | `green-go-wbpx-novelty-35681` | Même WBPX ; ports identiques, la fiche Novelty ajoute dimensions et masse. |
| `bosch-dcnm-wde-novelty-35158` | `bosch-dcnm-wde` | Même DICENTIS DCNM-WDE ; la fiche gardée a la connectique, la Novelty est en attente. Consommation et masse reportées depuis la fiche Bosch (4 W et non 4,5 W comme l'indiquait la fiche Novelty). |

## Rangement corrigé

| Fiche | Famille | Menu | Motif |
|--|--|--|--|
| `barco-ec-50` | control | image | Contrôleur Event Master (régie de traitement image) : commande vidéo, menu Image (famille control présente dans DOMAIN_FAMILIES.image). |
| `grass-valley-advc-g4` | sync | image | Générateur de référence vidéo SD/HD (1 entrée et 9 sorties BNC de référence, manuel Grass Valley) : synchronisation du menu Image. |
| `newtek-3play-4800` | recording | image | Serveur de ralenti/replay vidéo : enregistrement du menu Image. |
| `panasonic-ak-hrp1010` | control | image | Pupitre de commande caméra (ROP) : même rangement que panasonic-aw-rp50 (control/image, contrôlé par les tests). |
| `panasonic-aw-rp150` | control | image | Pupitre de commande de caméras PTZ : même rangement que panasonic-aw-rp50. |
| `sony-rcp-750` | control | image | Pupitre de commande caméra (RCP) : commande vidéo, menu Image. |
| `sony-rm-b170` | control | image | Télécommande de caméras : commande vidéo, menu Image. |
| `fohhn-na-11` | control | par défaut | Interface USB vers bus de commande Fohhn-Net, sans audio : famille Commande du menu Audio (menu par défaut). |
| `toa-racksecu` | amplification | par défaut | Rack de sonorisation de sécurité sur batterie (amplification et messages), pas une enceinte. |
| `bosch-dcnm-mic` | capture | par défaut | Micro col de cygne enfichable DICENTIS : un capteur, pas un intercom. |
| `dpa-4066f` | capture | par défaut | Micro serre-tête filaire (relié à un émetteur) : un capteur, pas un système HF. |
| `dpa-4088f` | capture | par défaut | Micro serre-tête filaire : un capteur, pas un système HF. |
| `dpa-4488-core-serre-tete-cardio-beige` | capture | par défaut | Micro serre-tête filaire : un capteur, pas un système HF. |
| `dpa-dfine-slim` | capture | par défaut | Micro serre-tête filaire : un capteur, pas un système HF. |
| `dpa-dfine` | capture | par défaut | Micro serre-tête filaire : un capteur, pas un système HF. |
| `shure-beta98-hf` | capture | par défaut | Micro miniature filaire à brancher sur l'émetteur UR1 : un capteur, pas un système HF. |

## Fiches corrigées

| Fiche | Opérations | Source | Motif |
|--|--|--|--|
| `bss-audio-ar133` | 2 | https://www.novelty.fr/produits/sonorisation/accessoires-sonorisation/microphones-di/ar133/ | Report de la référence du manuel BSS (fiche doublon bss-ar-133) et de sa désignation. |
| `bose-802-iii-novelty-22161` | 1 | https://www.fullcompass.com/common/files/13901-SpecSheet.pdf | Report de la fiche technique Bose et de la désignation de la fiche doublon bose-802-iii. |
| `bose-s1-pro` | 2 | https://www.novelty.fr/produits/sonorisation/diffusion-sonorisation/enceinte-amplifiee/s1/ | Report des sources Novelty et alias de la fiche doublon bose-s1. |
| `rme-madi-routeur` | 0 | https://www.archiv.rme-audio.de/en/products/madi_router.php | Report de la page d'archive RME de la fiche doublon rme-madi-router (ajout de source seulement). |
| `roland-ua-1610` | 2 | https://www.novelty.fr/produits/sonorisation/audio-numerique/interfaces/studio-capture-ua-1610/ | Report des alias et sources Novelty de la fiche doublon roland-studio-capture-ua-1610. |
| `yamaha-vxs3f` | 2 | https://www.novelty.fr/produits/sonorisation/diffusion-sonorisation/enceinte-monitoring/vxs3/ | Report des alias et sources Novelty de la fiche doublon yamaha-vxs3. |
| `akg-c535-eb` | 2 | https://www.novelty.fr/produits/sonorisation/micros-a-fil/statique/c535/ | Report des alias et sources Novelty de la fiche doublon akg-c535 (poids non reporté). |
| `sennheiser-md441` | 1 | https://www.sennheiser.com/en-us/catalog/products/microphones/md-441/md-441-u-000762 | Report de la page Sennheiser MD 441 U et de la désignation de la fiche doublon. |
| `green-go-bpx-novelty-35686` | 1 | https://manual.greengoconnect.com/en/devices/bpx/ | Report de la désignation constructeur de la fiche doublon green-go-bpx. |
| `green-go-interfacex` | 1 | https://manual.greengoconnect.com/en/devices/interfacex/ | Report de la désignation constructeur de la fiche doublon green-go-interface-x. |
| `green-go-mcx-novelty-35634` | 1 | https://manual.greengoconnect.com/en/devices/mcx/ | Report de la désignation constructeur de la fiche doublon green-go-mcx. |
| `green-go-mcxd-novelty-35628` | 1 | https://manual.greengoconnect.com/en/devices/mcxd/ | Report de la désignation constructeur de la fiche doublon green-go-mcxd. |
| `green-go-rdx-novelty-35670` | 1 | https://manual.greengoconnect.com/en/devices/rdx/ | Report de la désignation constructeur de la fiche doublon green-go-rdx. |
| `green-go-waa-novelty-35673` | 1 | https://manual.greengoconnect.com/en/devices/waa/ | Report de la désignation constructeur de la fiche doublon green-go-waa. |
| `green-go-wbpx-novelty-35681` | 1 | https://manual.greengoconnect.com/en/devices/wbpx/ | Report de la désignation constructeur de la fiche doublon green-go-wbpx. |
| `bosch-dcnm-wde` | 4 | https://www.novelty.fr/wp-content/uploads/downloaded/downloads/materiel_fiches_techniques/10890-4496-bosch-dicentis-postes-sans-fil-1.pdf | Fiche technique Bosch DICENTIS postes sans fil : « Consommation 4 W », « DCNM-WDE 670 g » (sans batterie ; 1 131 g avec). Report des sources Novelty de la fiche doublon. |
| `fohhn-na-11` | 1 | https://www.novelty.fr/produits/sonorisation/audio-numerique/interfaces/na-11/ | Pictogramme aligné sur la nouvelle famille (déplacement approuvé) ; aucune donnée constructeur modifiée. |
| `toa-racksecu` | 1 | https://www.novelty.fr/produits/sonorisation/diffusion-sonorisation/securite-diffusion-sonorisation/racksecu/ | Pictogramme aligné sur la nouvelle famille (déplacement approuvé) ; aucune donnée constructeur modifiée. |
| `bosch-dcnm-mic` | 1 | https://www.novelty.fr/produits/sonorisation/traduction-simultanee/recepteur/dcnm-mic/ | Pictogramme aligné sur la nouvelle famille (déplacement approuvé) ; aucune donnée constructeur modifiée. |
| `dpa-4066f` | 1 | https://www.novelty.fr/produits/sonorisation/micros-hf/cravatte-serre-tete/4066f/ | Pictogramme aligné sur la nouvelle famille (déplacement approuvé) ; aucune donnée constructeur modifiée. |
| `dpa-4088f` | 1 | https://www.novelty.fr/produits/sonorisation/micros-hf/cravatte-serre-tete/4088f/ | Pictogramme aligné sur la nouvelle famille (déplacement approuvé) ; aucune donnée constructeur modifiée. |
| `dpa-4488-core-serre-tete-cardio-beige` | 1 | https://www.novelty.fr/produits/sonorisation/micros-hf/cravatte-serre-tete/dpa-4488-core-serre-tete-cardio-beige/ | Pictogramme aligné sur la nouvelle famille (déplacement approuvé) ; aucune donnée constructeur modifiée. |
| `dpa-dfine-slim` | 1 | https://www.novelty.fr/produits/sonorisation/micros-hf/cravatte-serre-tete/dfine-slim/ | Pictogramme aligné sur la nouvelle famille (déplacement approuvé) ; aucune donnée constructeur modifiée. |
| `dpa-dfine` | 1 | https://www.novelty.fr/produits/sonorisation/micros-hf/cravatte-serre-tete/dfine/ | Pictogramme aligné sur la nouvelle famille (déplacement approuvé) ; aucune donnée constructeur modifiée. |
| `shure-beta98-hf` | 1 | https://www.novelty.fr/produits/sonorisation/micros-hf/cravatte-serre-tete/beta98-hf/ | Pictogramme aligné sur la nouvelle famille (déplacement approuvé) ; aucune donnée constructeur modifiée. |
| `audio-technica-at8646qm` | 3 | https://www.audio-technica.com.hk/templates/index/file/320_1_AT8646_47.pdf | Notice Audio-Technica AT8646/47 : « MIC ATTACHMENT XLRF-type », « screw-terminals … terminal order is 1-3-2 ». |
| `digico-sd-rack` | 14 | https://support.digico.biz/hc/en-gb/article_attachments/29324830752401 | Manuel SD-Rack : « MADI I/O BNC 4 sockets (2 Pairs) », « MADI output / split BNC 2 sockets », Word Clock In/Out BNC, « IEC power x 2 Dual redundant supplies », « 365mm deep … 10u (445mm) high ». Le port ac est conservé (renommé Secteur 1) pour ne pas casser les liaisons existantes. |
| `dpa-4060` | 1 | https://www.dpamicrophones.com/document-portal/manual/product/4060/variant/32/ | Portail DPA : « Connector MicroLock, TA4F Mini-XLR, 3-pin LEMO, Mini-Jack » ; MicroLock est la prise du micro, les autres passent par adaptateur. Le connecteur microlock s'accouple aussi au MicroDot des anciennes versions (alsoMates). |
| `dpa-4061` | 1 | https://www.dpamicrophones.com/document-portal/manual/product/4060/variant/32/ | Portail DPA : « Connector MicroLock, TA4F Mini-XLR, 3-pin LEMO, Mini-Jack » ; MicroLock est la prise du micro, les autres passent par adaptateur. Le connecteur microlock s'accouple aussi au MicroDot des anciennes versions (alsoMates). |
| `dpa-4466` | 1 | https://www.dpamicrophones.com/document-portal/manual/product/4466/variant/22/ | Portail DPA : « Connector MicroLock, TA4F Mini-XLR, 3-pin LEMO, Mini-Jack » ; MicroLock est la prise du micro, les autres passent par adaptateur. Le connecteur microlock s'accouple aussi au MicroDot des anciennes versions (alsoMates). |
| `dpa-4066` | 1 | https://www.dpamicrophones.com/document-portal/manual/product/4066/variant/16/ | Portail DPA : « Connector MicroLock, TA4F Mini-XLR, 3-pin LEMO, Mini-Jack » ; MicroLock est la prise du micro, les autres passent par adaptateur. Le connecteur microlock s'accouple aussi au MicroDot des anciennes versions (alsoMates). |
| `dpa-4088` | 1 | https://www.dpamicrophones.com/document-portal/manual/product/4088/variant/17/ | Portail DPA : « Connector MicroLock, TA4F Mini-XLR, 3-pin LEMO, Mini-Jack » ; MicroLock est la prise du micro, les autres passent par adaptateur. Le connecteur microlock s'accouple aussi au MicroDot des anciennes versions (alsoMates). |
| `dpa-4488` | 1 | https://www.dpamicrophones.com/document-portal/manual/product/4488/variant/23/ | Portail DPA : « Connector MicroLock, TA4F Mini-XLR, 3-pin LEMO, Mini-Jack » ; MicroLock est la prise du micro, les autres passent par adaptateur. Le connecteur microlock s'accouple aussi au MicroDot des anciennes versions (alsoMates). |
| `electro-voice-re20` | 1 | https://www.novelty.fr/wp-content/uploads/downloaded/downloads/materiel_fiches_techniques/electrovoice_re20_ft.PDF | Fiche technique Electro-Voice RE20 : polarité « Pin 2 … positive referenced to Pin 3 » (sortie XLR 3 points). |
| `electro-voice-re27n-d` | 1 | https://products.electrovoice.com/cn/en/re27nd | Page produit Electro-Voice RE27N/D : connecteur XLR 3 points. |
| `klotz-lsv2864` | 1 | https://www.novelty.fr/produits/sonorisation/cablage-hp/speakon/lsv2864/ | Correction des fautes de frappe « Spkekon », « Spkeakon » (texte seulement). |
| `novelty-600600` | 1 | https://www.novelty.fr/produits/sonorisation/cablage-modulation/divers-cablage-modulation/600600/ | Correction de l’encodage cassé « dÂ’isolement » (texte seulement). |
| `midas-dl231` | 52 | https://cdn-media.empowertribe.com/4eced00ab33248619bf58ae8c80f9c31/QSG_MI_0606-ABT_DL231_WW.pdf | Guide de démarrage Midas DL231 : « Main Outputs - Balanced XLR connectors - 50R Source », Ethernet « Neutrik EtherCON », « dual redundant mains inlets » IEC, « Diagnostics Connection: 9 W Female ‘D’ type connector ». |
| `midas-dl32` | 1 | https://cdn-media.empowertribe.com/225d65092c484ec38ec47bca8bbd21bd/QSG_MI_0606-ACR_DL32_WW.pdf | Guide de démarrage Midas DL32 : « USB input accepts a USB type-B plug ». |
| `rosendahl-mif-4` | 8 | https://www.novelty.fr/wp-content/uploads/downloaded/downloads/materiel_manuels/rosendahl_mif4_manuel_en.pdf | Manuel Rosendahl mif4, chap. 10 Specifications : LTC In XLR 3 femelle, LTC Out XLR 3 mâle, MIDI DIN 5, « USB type B », Sync input BNC, alimentation USB ou adaptateur externe. |
| `rosendahl-nanoclock` | 19 | https://www.novelty.fr/wp-content/uploads/downloaded/downloads/materiel_fiches_techniques/nanoclocks.pdf | Fiche Rosendahl Nanoclocks : 2 entrées word clock BNC à transformateur, « 3,5 Vpp @ 75 ohms, 12 x BNC » (1-4 aussi super clock), 10 W, 1U, 125 mm. Douze ports de sortie distincts (et non un port groupé comme proposé) pour pouvoir câbler chaque sortie. |
| `sound-devices-mixpre-10-ii` | 1 | https://www.fullcompass.com/common/files/39280-MixPre10IISpecificationsSheet.pdf | Fiche Sound Devices MixPre-10 II : « HDMI (micro) ». |
| `tentacle-sync-e-mkii` | 3 | https://manuals.tentaclesync.com/en/sync-e-manual.html | Manuel Tentacle SYNC E : prise 3,5 mm TRS « Timecode Input / Output », niveaux AUTO/LINE/MIC, « USB-C Connector », MIDI timecode mkII. Bluetooth non représenté. |
| `bss-dpr-402` | 1 | https://manualshive.com/en/manual/bss-audio/dpr-402/2823533?page=11 | Manuel DPR-402 v3.0 : le Stereo Link est un commutateur (voyant LINK en façade), pas une prise. |
| `klarkteknik-dn9630` | 2 | https://im.static-thomann.de/pics/atg/atgdata/document/misc/464637_dn9630_qsg_en.pdf | Guide Klark Teknik DN9630 : « AES50 - Neutrik etherCON », « Up to 48 bidirectional channels @ 48 kHz ». |
| `l-acoustics-ks21` | 8 | https://prdstglaxxwe001.blob.core.windows.net/webapp-lacoustics/documentation/LOUDSPEAKERS/KS21/EN/System%20Spec%20Sheet/KS21_SPS_EN_1.2.pdf | Fiche système L-Acoustics KS21 v1.2 : « IN: 1 × 4-point speakON, LINK: 1 × 4-point speakON » (aussi manuel et prescriptions). Attention : la page produit actuelle affiche « 2 × 4-point terminal block with push-in connection », donnée du KS21i ; la fiche PDF constructeur prévaut. |
| `l-acoustics-l2` | 2 | https://prdstglaxxwe001.blob.core.windows.net/webapp-lacoustics/documentation/LOUDSPEAKERS/L2/EN/Product%20Spec%20Sheet/L2_SP_EN_1.0.pdf | Fiche L-Acoustics L2 : « 1 x 37-point male connector (32 points used) », « 16-channel … amplified by LA7.16 » ; même connecteur SC32 que la fiche L2D. |
| `l-acoustics-sb15p` | 4 | https://prdstglaxxwe001.blob.core.windows.net/webapp-lacoustics/documentation/LOUDSPEAKERS/SB15P/EN/Product%20Spec%20Sheet/SB15P_SP_EN_5.0.pdf | Fiche L-Acoustics SB15P v5.0 : « Connectors: 2 x XLR in parallel, 2 x Powercon® 120 or 230 V selectable by switch », entrée +12 dBu max. |
| `l-acoustics-syva` | 1 | https://www.l-acoustics.com/products/syva/ | Page produit L-Acoustics : « 1 x AutoConnect » ; le connecteur dédié syva-autoconnect existe dans le schéma. |
| `l-acoustics-syva-low` | 1 | https://www.l-acoustics.com/products/syva-low/ | Page produit L-Acoustics : « 1 x AutoConnect » ; le connecteur dédié syva-autoconnect existe dans le schéma. |
| `l-acoustics-syva-sub` | 1 | https://www.l-acoustics.com/products/syva-sub/ | Page produit L-Acoustics : « 1 x AutoConnect » ; le connecteur dédié syva-autoconnect existe dans le schéma. |
| `l-acoustics-la12x` | 2 | https://shop.ccisolutions.com/StoreFront/jsp/pdf/LAC-LA12XUS_specifications.pdf | Spécifications L-Acoustics LA12X : « PowerCON 32 A power supply inlet » (aussi manuel utilisateur). |
| `yamaha-xmv4140` | 2 | https://www.manualslib.com/manual/724634/Yamaha-Xmv4280.html?page=16 | Manuel XMV4280/XMV4140 : « barrier strip type speaker output connectors ». « terminal » est le seul bornier du schéma. |
| `yamaha-xmv4140-d` | 2 | https://www.manualslib.com/manual/724634/Yamaha-Xmv4280.html?page=16 | Manuel XMV4280/XMV4140 : « barrier strip type speaker output connectors ». « terminal » est le seul bornier du schéma. |
| `yamaha-xmv4280` | 2 | https://www.manualslib.com/manual/724634/Yamaha-Xmv4280.html?page=16 | Manuel XMV4280/XMV4140 : « barrier strip type speaker output connectors ». « terminal » est le seul bornier du schéma. |
| `yamaha-xmv4280-d` | 2 | https://www.manualslib.com/manual/724634/Yamaha-Xmv4280.html?page=16 | Manuel XMV4280/XMV4140 : « barrier strip type speaker output connectors ». « terminal » est le seul bornier du schéma. |
| `yamaha-xmv8140` | 2 | https://www.manualslib.com/manual/551662/Yamaha-Xmv8140.html?page=18 | Manuel XMV8280/8140 : « The [SPEAKERS] output connectors … are barrier strip type connectors ». |
| `yamaha-xmv8140-d` | 2 | https://www.manualslib.com/manual/551662/Yamaha-Xmv8140.html?page=18 | Manuel XMV8280/8140 : « The [SPEAKERS] output connectors … are barrier strip type connectors ». |
| `yamaha-xmv8280` | 2 | https://www.manualslib.com/manual/551662/Yamaha-Xmv8140.html?page=18 | Manuel XMV8280/8140 : « The [SPEAKERS] output connectors … are barrier strip type connectors ». |
| `yamaha-xmv8280-d` | 2 | https://www.manualslib.com/manual/551662/Yamaha-Xmv8140.html?page=18 | Manuel XMV8280/8140 : « The [SPEAKERS] output connectors … are barrier strip type connectors ». |
| `universal-audio-uad-2-live-rack` | 2 | https://www.novelty.fr/produits/sonorisation/audio-numerique/interfaces/uad-2-live-rack/ | Deux ports au même nom : numérotation seule, aucune donnée modifiée. |
| `allen-heath-sq-5-dante64` | 2 | https://www.allen-heath.com/content/uploads/2023/05/SQ-5-Technical-Datasheet_G.pdf | Fiche technique SQ-5 issue G : « USB Type-A connector on the surface … recording/playback », « Single/Dual Footswitch Control ». |
| `allen-heath-sq-5` | 1 | https://www.allen-heath.com/content/uploads/2023/05/SQ-5-Technical-Datasheet_G.pdf | Fiche technique SQ-5 issue G : « 2 ¼” Stereo Inputs (TRS) », « 1 3.5mm Stereo Input ». |
| `midas-dm12` | 66 | https://cdn-media.empowertribe.com/2067750f6d374a24bd75431b70dfdf0d/QSG_MI_0601-AHB_DM16-DM12_WW.pdf | Guide Midas DM16/DM12 : 8 voies mono (« MIC input … XLR », « LINE input … ¼" TRS », « INSERT jack … ¼" TRS »), 2 voies stéréo sur TRS, MASTER L/R XLR, MAIN OUT INSERT TRS, AUX OUT et MONITOR OUT TRS, 2 TRACK et RECORD OUT RCA, PHONES TRS, « mains IEC connector » / AC IN. Les entrées 9-12 (micro inexistantes) sont retirées ; ids in1-8, out1-2 et psu conservés. |
| `yamaha-tf1` | 1 | https://www.manualslib.com/manual/1071068/Yamaha-Tf5.html?page=11 | Mode d’emploi série TF, panneau arrière : connecteur NETWORK RJ-45 pour TF Editor / TF StageMix. |
| `yamaha-tf3` | 1 | https://www.manualslib.com/manual/1071068/Yamaha-Tf5.html?page=11 | Mode d’emploi série TF, panneau arrière : connecteur NETWORK RJ-45 pour TF Editor / TF StageMix. |
| `yamaha-tf5` | 1 | https://www.manualslib.com/manual/1071068/Yamaha-Tf5.html?page=11 | Mode d’emploi série TF, panneau arrière : connecteur NETWORK RJ-45 pour TF Editor / TF StageMix. |
| `akai-apc40` | 5 | https://www.manualsdir.com/manuals/459718/akai-apc40.html?page=5 | Manuel Akai APC40, panneau arrière : USB (MIDI), « 12V–2A DC power adapter », « FS 1 & 2 … 1/4" TS ». Le type USB-B proposé par l’auditeur n’est pas écrit dans le manuel : laissé non précisé. |
| `avid-sync-hd` | 2 | https://resources.avid.com/SupportFiles/attach/Pro_Tools/10.0/ENGLISH/SYNC_HD_Guide.pdf | Guide SYNC HD : « Composite Video Input », incrustation de fenêtre timecode sur le signal entrant : c'est de l'image SD, pas seulement une référence. Connecteur laissé non précisé. |
| `grass-valley-advc-g4` | 12 | https://www.manualsdir.com/manuals/795772/grass-valley-advc-g4.html?page=20 | Manuel ADVC G4, 5.2 Hardware specifications : « Reference input connector BNC x 1 », « Output connectors BNC x 9 » en trois lignes A/B/C. Neuf ports distincts (au lieu de trois ports groupés proposés) ; tension et consommation non reprises faute de lecture directe. |
| `klotz-lsv2844` | 7 | https://shop.klotz-ais.com/lsv2844-1.html | Boutique Klotz : 2 × speakON 8 points et 4 × speakON 4 points en sortie, 297 × 90 × 74,5 mm. Quatre ports de sortie distincts. |
| `ssl-a16-d16` | 2 | https://www.solidstatelogic.com/assets/uploads/downloads/Mixed%20Format/A16.D16,%20A32,%20D64%20and%20GPIO%2032%20User%20Guide%20(Rev%201.2).pdf | Guide SSL Rev 1.2 : « Dante Network A etherCON / Dante Network B SFP (Unused) », « Network B functionality is currently not … ». Port B non ajouté. |
| `altair-wbp-212` | 1 | https://theatrelight.co.nz/wp-content/uploads/2022/01/Altair-Catalogue.pdf | Catalogue Altair, WBP-210HD/212HD : « Headset connectors: Standard size XLR-4M and “miniature” XLR-4M ». |
| `altair-wbs-200` | 2 | https://theatrelight.co.nz/wp-content/uploads/2022/01/Altair-Catalogue.pdf | Catalogue Altair : antennes R-54135/R-54136 « Original antenna supplied with ALTAIR … Connector: Male SMA » : embases SMA sur la base. |
| `altair-wbs-202` | 2 | https://theatrelight.co.nz/wp-content/uploads/2022/01/Altair-Catalogue.pdf | Catalogue Altair : antennes R-54135/R-54136 « Original antenna supplied with ALTAIR … Connector: Male SMA » : embases SMA sur la base. |
| `behringer-xr12` | 1 | https://www.thomannmusic.com/behringer_x_air_xr12.htm | Fiche revendeur détaillée : XR12 sans Ultranet ni système de retours personnels ; connexions listées : 4 micro, 8 ligne, 2 sorties, 2 aux, USB, Ethernet, MIDI, casque. Ultranet réservé aux XR16/XR18 dans la gamme. |
| `sennheiser-em-300-500-g4` | 6 | https://www.bimobject.com/en-us/sennheiser/product/em300-500g4 | Spécifications Sennheiser EM 300-500 G4 (BIMobject, recoupées par revendeur) : 2 embases BNC, sortie XLR-3M symétrique +18 dBu et jack 6,35 asymétrique +12 dBu, 12 V CC 350 mA. Prise casque non ajoutée (non confirmée). |
| `shure-slxd4d` | 1 | https://pubs.shure.com/view/guide/SLXD/en-US.pdf | Guide Shure SLX-D, SLXD4/SLXD4D : « 15 V DC @ 600 mA, supplied by external power supply (tip positive) ». |
| `yamaha-01v96i` | 1 | https://www.manualslib.com/manual/352467/Yamaha-01v96i.html?page=17 | Mode d’emploi 01V96i : port « TO HOST USB » à connecteur type B, USB 2.0, 16 × 16 canaux. |
| `yamaha-dm3-standard` | 2 | https://manual.yamaha.com/pa/mixers/dm3/rm/en-US/6203378827.html | Manuel de référence DM3, panneau arrière : NETWORK RJ-45, USB TO HOST type B 18 × 18 ; seul le Dante est réservé au DM3. |
| `yamaha-dm3-d` | 2 | https://manual.yamaha.com/pa/mixers/dm3/rm/en-US/6203378827.html | Manuel de référence DM3, panneau arrière : NETWORK RJ-45 et USB TO HOST type B 18 × 18 (présents sur la fiche yamaha-dm3, absents ici). |
| `yamaha-dm3` | 32 | https://www.scan.co.uk/products/yamaha-dm3-digital-mixer | Entrées micro/ligne à préampli et « Phantom Power 16 Channels » (+48 V) ; cohérent avec les fiches vérifiées yamaha-dm3-d et yamaha-dm3-standard (level mic, phantom supplied). |
| `yamaha-dm7` | 59 | https://manual.yamaha.com/pa/mixers/dm7/rm/en-US/9523967115.html | Manuel de référence DM7, panneau arrière : INPUT et OMNI OUT en XLR symétriques, AES/EBU sur XLR, TC IN sur XLR, WORD CLOCK BNC, GPI D-sub 15, Dante RJ-45 compatibles etherCON, NETWORK RJ-45 (absent de la fiche). |
| `yamaha-dm7-compact` | 40 | https://manual.yamaha.com/pa/mixers/dm7/rm/en-US/9523967115.html | Manuel de référence DM7, panneau arrière : INPUT et OMNI OUT en XLR symétriques, AES/EBU sur XLR, TC IN sur XLR, WORD CLOCK BNC, GPI D-sub 15, Dante RJ-45 compatibles etherCON, NETWORK RJ-45 (absent de la fiche). |
| `yamaha-m7cl-32` | 3 | https://www.manualslib.com/manual/393162/Yamaha-M7cl.html?page=25 | Mode d’emploi M7CL, panneau arrière : NETWORK RJ-45, MIDI IN/OUT. LAMP (XLR-4 d’alimentation de lampe) non ajouté : accessoire. |
| `yamaha-m7cl-48` | 3 | https://www.manualslib.com/manual/393162/Yamaha-M7cl.html?page=25 | Mode d’emploi M7CL, panneau arrière : NETWORK RJ-45, MIDI IN/OUT. LAMP (XLR-4 d’alimentation de lampe) non ajouté : accessoire. |
| `midas-m32-live` | 4 | https://manuals.plus/m/b2b1df2d3dd39e99e766bc763f9e576bd38cd3a3fb7ea595c10e5cd76b74a0c9 | Guide de démarrage M32 LIVE et fiches revendeurs concordantes : entrée talkback XLR, sortie AES/EBU XLR, MIDI IN/OUT DIN 5. Moniteurs et USB laissés tels quels. |
| `turbosound-iq15b` | 7 | https://www.adorama.com/tbiq15b.html | Fiche revendeur détaillée et concordante (Adorama) : 2 entrées combo A/B, sorties XLR A/B liées, sortie mix XLR, Ultranet In/Link, powerCON In 20 A et Link 15 A. Pas de manuel constructeur lu. |

## À décider par l'utilisateur

- `pioneerdj-rmx-1000` : Retirer le RMX-1000 (station d'effets DJ) ? L'utilisateur a déjà retiré le RMX-1000-M Platinum et l'EFX-1000 (lot audio 02), mais le tri du 31 octobre a noté « Conserver » pour le RMX-1000 standard.
- `shure-se215-ecouteurs-intra-auriculaires` : Retirer les écouteurs SE215 comme l'a été le SE112 (« écoute personnelle », révision 21), ou les garder comme retours intra comme les SE315/425/535 vérifiés ?
- `magma-expressbox-3t` : Châssis d'extension PCIe Thunderbolt (périphérique informatique) : le retirer comme non audio, ou le ranger en Divers (passive/misc) parce qu'il héberge des cartes DSP audio ?
- `k-m-emb-mic-table-inter` : Embase de table XLR à interrupteur sans connectique documentée : la retirer comme k-m-emb-mic-table (« embase non référencée ») ou la documenter ?
- `yamaha-dm3` : yamaha-dm3 (fiche Novelty, avec Dante, USB et NETWORK) et yamaha-dm3-d (DM3 Dante, protégé par les tests) semblent désigner la même console ; les tests exigent pourtant que la référence Novelty 36086 ne pointe pas vers yamaha-dm3-d (« variante non précisée »). Fusionner ou garder séparées ?
- `yamaha-spx900-1000` : Référence combinée SPX900/SPX1000 : seule la fiche SPX900 existe. La retirer (en créant une fiche SPX1000 documentée) ou la garder ?
- `solid-state-logic-t25` : « T25 » (désignation seule) est-il le même moteur que ssl-tempest-engine-t25 (Dante HC 512, vérifié) ou une autre configuration ?
- `l-acoustics-syva-n` : Fiches « N » (syva-n, syva-low-n, syva-sub-n) contre syva, syva-low, syva-sub : même modèle en finition différente ou désignation Novelty du même produit ? Fusionner (variante de couleur) ou garder ?
- `bose-l1-compact-blanche` : Variante de couleur de bose-l1-compact, connectique identique : fusionner en alias ou garder une fiche par couleur ?
- `rosendahl-mif-4` : powerW 10 W non justifié : le manuel donne « USB bus powered, 5V DC, < 300mA » ou un adaptateur externe sans puissance. Retirer la valeur ?
- `avid-c24` : Fiche vérifiée dont le poids (20,4 kg) et la puissance (450 W) viennent d’un forum « Communauté Avid » : retirer ces valeurs ou chercher une source constructeur ?
- `klarkteknik-dn9696` : 8 ports AES50 déclarés alors que le texte dit « 4 ports, double redondance » : quelle est la connectique réelle ? (pas de source constructeur trouvée)
- `digigrid-mgb` : portStatus « pending » alors que des ports sont décrits (aussi yamaha-d5000, midas-venice-240, midas-venice-320, qsc-touchmix-16, audio-technica-at8615) : déclarer la connectique complète ? Cela demande une relecture de la notice, non faite ici.

## Propositions rejetées

- `midas-dl32` (ports.adat2.format → « Voies 25-32 ») : Faux positif : la fiche porte déjà « Voies 25-32 ».
- `yamaha-dm3-d` (Doublon de yamaha-dm3 (fusion)) : Refusé : catalogue.test.ts conserve yamaha-dm3-d (ports, statut) et exige que la référence Novelty 36086 (« variante non précisée ») ne pointe pas vers lui : la séparation est voulue. Voir toDecide.
- `shure-ad4d-a` (Doublon de shure-ad4d) : Variante de bande (A, 470-636 MHz), pas exactement le même modèle.
- `shure-ad4q-a` (Doublon de shure-ad4q) : Variante de bande (A), pas exactement le même modèle.
- `taiden-hcs-4800ma` (Doublon de taiden-hcs-4800ma-20) : La référence /20 est une variante ; non identique.
- `dpa-d-vote-4099` (Doublon de dpa-4099 (4099 CORE+)) : Génération non établie (d:vote 4099 vs 4099 CORE+) : variante possible.
- `avid-hd-i-o` (Doublon de avid-hd-io-8x8x8) : Configuration HD I/O non précisée (8x8x8, 16x16 analog, 16x16 digital) : variante.
- `l-acoustics-la8-aes` (Fusion avec l-acoustics-la8) : Variante équipée AES : pas exactement la même référence ; reprise de ports non sourcée pour cette variante.
- `l-acoustics-syva-sub-n` (Ajout AutoConnect / fusion avec syva-sub) : La fiche signale volontairement l’AutoConnect non confirmé dans le schéma du manuel ; fusion : voir toDecide (variantes « N »).
- `ssl-a16-d16` (Ajout du port Dante B (SFP)) : Le guide SSL indique le réseau B « Unused » / non activé.
- `avalon-vt-747sp` (Connecteurs XLR des E/S ligne) : Seule source : copie non officielle (manualmachine) ; non revérifiée.
- `klarkteknik-dn9680` (powerW 50) : Source distributeur coréenne non constructeur, confiance basse.
- `videotek-apm200` (rackU 1) : Revendeur seul, confiance basse, non revérifié.
- `turbosound-iq15b` (Formats « 3 000 W » sur le port secteur) : Constat juste mais aucune consommation sourcée proposée ; format remplacé par le patch powerCON.
- `sennheiser-a-2003-uhf` (direction bidir) : Non sourcé, confiance basse.
- `shure-ha8089` (direction bidir) : Non sourcé, connecteur non vérifié.
- `midas-m32-live` (Monitor L/R connecteur) : Aucune valeur proposée ; source M32 (autre référence).
- `yamaha-01v96i` (Copie de la structure de la fiche 01V96) : Seul l’USB est confirmé pour le 01V96i ; copier la connectique d’un autre modèle n’est pas sourcé.
- `midas-pro2c` (Une prise par paire AES3) : Non vérifié en ligne, aucune correction proposée.
- `audio-technica-at8615` (Niveau nominal (level) proposé) : Aucune source citée ni vérifiée pour le niveau ; une valeur line+4/line-10/mic déduite du type de prise serait une caractéristique inventée.
- `atterotech-undiox2x` (Niveau nominal (level) proposé) : Aucune source citée ni vérifiée pour le niveau ; une valeur line+4/line-10/mic déduite du type de prise serait une caractéristique inventée.
- `avalon-vt-737sp` (Niveau nominal (level) proposé) : Aucune source citée ni vérifiée pour le niveau ; une valeur line+4/line-10/mic déduite du type de prise serait une caractéristique inventée.
- `empirical-labs-distressor-el8x` (Niveau nominal (level) proposé) : Aucune source citée ni vérifiée pour le niveau ; une valeur line+4/line-10/mic déduite du type de prise serait une caractéristique inventée.
- `fohhn-a-1-live` (Niveau nominal (level) proposé) : Aucune source citée ni vérifiée pour le niveau ; une valeur line+4/line-10/mic déduite du type de prise serait une caractéristique inventée.
- `fohhn-abx-2` (Niveau nominal (level) proposé) : Aucune source citée ni vérifiée pour le niveau ; une valeur line+4/line-10/mic déduite du type de prise serait une caractéristique inventée.
- `neve-yamaha-portico-5045` (Niveau nominal (level) proposé) : Aucune source citée ni vérifiée pour le niveau ; une valeur line+4/line-10/mic déduite du type de prise serait une caractéristique inventée.
- `nexo-dtd-t-n` (Niveau nominal (level) proposé) : Aucune source citée ni vérifiée pour le niveau ; une valeur line+4/line-10/mic déduite du type de prise serait une caractéristique inventée.
- `pioneerdj-rmx-1000` (Niveau nominal (level) proposé) : Aucune source citée ni vérifiée pour le niveau ; une valeur line+4/line-10/mic déduite du type de prise serait une caractéristique inventée.
- `sound-performance-lab-channel-one` (Niveau nominal (level) proposé) : Aucune source citée ni vérifiée pour le niveau ; une valeur line+4/line-10/mic déduite du type de prise serait une caractéristique inventée.
- `sound-performance-lab-stereo-vitalizer-mk2-t` (Niveau nominal (level) proposé) : Aucune source citée ni vérifiée pour le niveau ; une valeur line+4/line-10/mic déduite du type de prise serait une caractéristique inventée.
- `the-t-amp-e-800` (Niveau nominal (level) proposé) : Aucune source citée ni vérifiée pour le niveau ; une valeur line+4/line-10/mic déduite du type de prise serait une caractéristique inventée.
- `xta-dp448` (Niveau nominal (level) proposé) : Aucune source citée ni vérifiée pour le niveau ; une valeur line+4/line-10/mic déduite du type de prise serait une caractéristique inventée.
- `yamaha-dzr12` (Niveau nominal (level) proposé) : Aucune source citée ni vérifiée pour le niveau ; une valeur line+4/line-10/mic déduite du type de prise serait une caractéristique inventée.
- `behringer-ultralink-pro-mx882` (Niveau nominal (level) proposé) : Aucune source citée ni vérifiée pour le niveau ; une valeur line+4/line-10/mic déduite du type de prise serait une caractéristique inventée.
- `yamaha-emx312sc` (Niveau nominal (level) proposé) : Aucune source citée ni vérifiée pour le niveau ; une valeur line+4/line-10/mic déduite du type de prise serait une caractéristique inventée.
- `yamaha-emx660` (Niveau nominal (level) proposé) : Aucune source citée ni vérifiée pour le niveau ; une valeur line+4/line-10/mic déduite du type de prise serait une caractéristique inventée.
- `yamaha-mg102c` (Niveau nominal (level) proposé) : Aucune source citée ni vérifiée pour le niveau ; une valeur line+4/line-10/mic déduite du type de prise serait une caractéristique inventée.
- `yamaha-mg124c` (Niveau nominal (level) proposé) : Aucune source citée ni vérifiée pour le niveau ; une valeur line+4/line-10/mic déduite du type de prise serait une caractéristique inventée.
- `dpa-4060-bm-micro-miniature-discret` (Reprendre le port de la fiche dpa-4060/4061) : Terminaison de cette référence (B00/F00) non vérifiée ; aucune correction sourcée proposée.
- `dpa-4061-fm-micro-miniature-d-screet-beige` (Reprendre le port de la fiche dpa-4060/4061) : Terminaison de cette référence (B00/F00) non vérifiée ; aucune correction sourcée proposée.
- `allen-heath-sq-5-dante64` (Source sans URL) : Inutile de modifier : l’URL de la fiche technique sera ajoutée par le patch approuvé de cette fiche.

## Décisions de l'utilisateur : 7 novembre 2026

| Point | Décision appliquée |
|---|---|
| Pioneer RMX-1000 | Supprimé. |
| Écouteurs | Tous supprimés : SE112, SE215, SE315, SE425, SE535. |
| Magma ExpressBox 3T | Supprimé (non audio). |
| Embase K&M avec interrupteur | Supprimée. |
| Yamaha DM3 / DM3-D | Gardées toutes les deux ; la DM3 Standard (fiche `yamaha-dm3-standard`) n'a pas de Dante d'origine, la DM3-D oui. |
| SPX900/1000 | Fiche combinée remplacée par une fiche par modèle : `yamaha-spx900` existante, `yamaha-spx1000` créée d'après le manuel Yamaha SPX1000E (statut Communauté). |
| SSL T25 | Supprimée, doublon du Tempest Engine T25. |
| Syva N, Syva Low N, Syva Sub N | Supprimées, doublons des fiches Syva, Syva Low, Syva Sub. |
| Bose L1 Compact blanche | Supprimée ; seule `bose-l1-compact` est gardée. |
| Rosendahl mif 4 | Puissance 1,5 W (USB 5 V, moins de 300 mA d'après le manuel). |
| Avid C\|24 | Aucune fiche constructeur accessible (document Avid introuvable) : poids 20,4 kg et puissance 450 W conservés. |
| Klark Teknik DN9696 | 8 embases confirmées : 4 liaisons AES50, chacune principale X et redondance Y ; noms des ports corrigés. |
| Connectique « à documenter » | Mention retirée sur DiGiGrid MGB, Yamaha D5000, Midas Venice 240 et 320, QSC TouchMix-16, Audio-Technica AT8615, après contrôle des manuels ; sorties lampe XLR 4 points ajoutées aux deux Venice. |
