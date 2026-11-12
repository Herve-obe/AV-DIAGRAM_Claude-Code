# Compléments utilisateur — lot audio 01

29 octobre 2026 · version 0.5.20 · formulaire de compléments, révision 156.

**Les neuf nouveaux compléments sont traités. Les six retraits du 28 octobre restent appliqués** ; les vingt réponses de la révision 533 ne sont pas rejouées. Aucun nouveau lot de recherche et aucun agent supplémentaire.

Les valeurs choisies par l’utilisateur sont maintenant renseignées : MGB 10 W, OctoPre 30 W, RedNet 25 W, dbx 15 W, SPL 20 W ; poids Attero 0,363 kg ; profondeurs Distressor 254 mm et Lexicon 317,5 mm. Leur origine est conservée dans chaque description et source. Une valeur choisie pour le budget n’est pas rebaptisée mesure constructeur.

Bibliothèque active : **745 Vérifié, 961 Communauté et 30 génériques**. Quatre fiches précédemment Vérifié repassent Communauté (Attero, dbx, RedNet, Lexicon) car des valeurs actives non entièrement vérifiées y sont désormais renseignées. L’identité, les prises documentées et les anciens projets ne sont pas modifiés par ce changement de statut. Les [retours 0.5.19](retours-lot-audio-01-2026-10-28.md) restent historiques.

## Traitement des neuf lignes

| Équipement | Valeur / correction retenue | Nature de la donnée | Réserve conservée |
|---|---|---|---|
| unDIO2x2 | Poids 0,8 lb retenu sur déclaration utilisateur, soit 0,363 kg arrondis ; version sans + conservée. | Déclaration utilisateur et conversion d’unité. | Le PDF fourni concerne la version + ; il ne prouve pas directement la masse de l’ancien modèle. |
| 120A | 15 W intégrés comme valeur déclarée par l’utilisateur ; prises TRS et RCA inchangées. | Déclaration utilisateur ; justificatif fourni non consultable. | Le lien Notice Facile retourne HTTP 403 ; les 15 W ne sont pas présentés comme vérifiés dans un document constructeur. |
| MGB | 10 W retenus explicitement pour les budgets ; alimentation à verrouillage vissé confirmée par le catalogue. | Valeur de budget choisie par l’utilisateur, calculée à partir de 5 V × 2 A ; type de verrouillage publié. | 10 W ne sont pas une consommation réelle mesurée ou publiée de l’appareil. Le catalogue ne donne pas la référence mécanique et les dimensions exactes de la fiche DC. |
| Distressor EL8-X | Profondeur 254 mm retenue d’après le complément utilisateur et sa référence Funky Junk. | Dimension déclarée par l’utilisateur ; nouveau lien revendeur inaccessible. | Funky Junk retourne HTTP 503 ; la page WRD antérieure indiquait 216 mm. La divergence reste documentée. |
| OctoPre Platinum | Poids 3,2 kg et profondeur 265 mm confirmés dans le manuel Focusrite ; 30 W conservés selon instruction utilisateur. | Dimensions et masse publiées par le constructeur ; consommation déclarée. | 30 W ne figurent pas dans la page de spécifications consultée ; valeur utilisateur, pas une mesure constructeur retrouvée. |
| RedNet D16R | 25 W retenus comme valeur de budget utilisateur ; indication constructeur 30 VA conservée. | Valeur déclarée / choisie par l’utilisateur, aucune conversion électrique justifiée. | Sans facteur de puissance, 30 VA ne permettent pas de déduire 25 W ; cette valeur n’est pas présentée comme une conversion certifiée. |
| PCM96 Surround (PCM96SUR-A, FireWire) | Profondeur métrique 317,5 mm du document retenue, avec réserve sur les pouces contradictoires. | Valeur métrique documentaire recopiée par l’utilisateur ; contradiction du document maintenue. | Le même manuel indique 16 pouces, soit 406,4 mm. La profondeur 317,5 mm retenue n’est pas une conversion validée de 16 pouces. |
| DTD-T-N | Source Audinate ajoutée ; fiche et IEC C14 déjà renseignées conservées. | Page du partenaire Dante consultée ; IEC C14 reste une déclaration utilisateur. | La page Dante consultée confirme le produit et son interface Dante, sans mention textuelle de l’embase IEC. |
| Channel One 2950 | 20 W intégrés ; la page constructeur Channel One indique max. 20 W. | Consommation publiée pour Channel One et retenue pour le 2950 sur complément utilisateur. | La page SPL ne mentionne pas 2950 et indique un gabarit 300 mm / 4,85 kg différent du manuel 2950 (210 mm / 4,15 kg) : pas de transposition de ces dimensions ou de ce poids. |

## Sources consultées et limites

- **Attero** : la [fiche transmise](https://seesound.es/productos/pdfs/Datasheet_unDIO2x2+-7723-7724.pdf) est celle de l’unDIO2x2+ et décrit ses différences avec l’ancienne génération. Le poids 0,8 lb est appliqué à l’ancienne version sur déclaration explicite « même poids », soit 0,362873896 kg arrondis à 0,363 kg. Le modèle sans + conserve son fantôme +24 V et sa connectique ; aucune propriété +48 V n’est recopiée.
- **dbx** : le [lien Notice Facile](https://www.notice-facile.com/en/manual/1654720/dbx+120a) renvoie HTTP 403 pendant le contrôle. Les 15 W sont renseignés avec origine utilisateur ; le document constructeur antérieur valide les prises et niveaux, pas cette consommation.
- **MGB** : le [catalogue DiGiGrid 2022, page PDF 25](https://digigrid.net/wp-content/uploads/2022/08/DiGiGrid-Complete-2022-Web.pdf) confirme le verrouillage vissé professionnel. Le calcul 5 V × 2 A produit 10 W de capacité du bloc DC ; l’utilisateur demande de retenir cette valeur dans le budget. Elle reste identifiée comme estimation choisie et ne devient pas une consommation électrique mesurée de l’appareil. La référence mécanique exacte de la fiche n’est toujours pas donnée.
- **Distressor** : le [lien Funky Junk fourni](https://shop.funky-junk.com/fr/boutique/enregistrement/peripheriques/compresseurs/empirical-labs-el8x-distressor-with-brit-mod/) retourne HTTP 503. Les dimensions 44 × 483 × 254 mm sont retenues sur déclaration utilisateur avec ce justificatif non lu ; les 216 mm de la page WRD antérieure restent une divergence documentée.
- **OctoPre** : le [manuel constructeur fourni](https://fael-downloads-prod.focusrite.com/customer/prod/s3fs-public/downloads/octopre-user-guide-multilanguage1.pdf), p. 11 et p. 35 française, confirme 480 × 44 × 265 mm et 3,2 kg. Les 30 W restent une valeur utilisateur expressément conservée, absente de la page de spécifications lue. Configuration 220–240 V sans carte inchangée.
- **RedNet** : 25 W sont conservés pour le budget à la demande de l’utilisateur ; le manuel constructeur donne 30 VA. Aucun facteur de puissance documenté ne permet d’affirmer une conversion de 30 VA vers 25 W.
- **Lexicon** : le [manuel Harman fourni](https://adn.harmanpro.com/product_documents/documents/1018_1602284184/PCM96_Surround-Manual-French_original.pdf) n’a pas pu être chargé ; sa copie FR déjà disponible chez Novelty est conservée. La valeur métrique 317,5 mm est désormais renseignée d’après le retour et le document, avec sa contradiction explicite : 16 pouces valent 406,4 mm. Pas de validation physique de cette profondeur.
- **NEXO** : la [page du catalogue Dante](https://www.getdante.com/product/nexo-dtd-t-n/) confirme le produit et son interface. L’embase IEC C14 reste renseignée sur déclaration utilisateur : elle n’est pas citée dans le texte de cette page.
- **SPL** : la [page officielle Channel One](https://spl.audio/en/spl-produkt/channel-one/) donne max. 20 W. Elle ne précise pas 2950 et affiche un gabarit 300 mm / 4,85 kg différent de son manuel 2950 : la valeur de 20 W est retenue, le gabarit du manuel spécifique 210 mm / 4,15 kg n’est pas remplacé.

Le [relevé JSON](complements-lot-audio-01-2026-10-29.json) conserve les neuf réponses, les champs modifiés et les réserves. Les fiches incomplètement recoupées restent Communauté ; aucun document bloqué n’est déclaré lu.

## Validation

Validation locale : 479 tests réussis, 6 essais du modèle réel ignorés ; types TypeScript et compilation réussis ; lint sans erreur, quatre avertissements préexistants. Auto-contrôles : seules les neuf fiches sont modifiées, les six retraits restent appliqués, le modèle et les ports Attero ne changent pas de génération, les valeurs de budget demandées sont actives et aucune dépendance du fichier lock ne change. Les installateurs et essais natifs Windows/macOS sont lancés après publication.
