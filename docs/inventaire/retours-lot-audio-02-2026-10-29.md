# Retours du lot audio 02 — 29 octobre 2026

Version **0.5.23**. Réponses du tableau révision **822**, puis instruction explicite de validation du D5000. Les vingt décisions sont appliquées : **12 retraits, 8 conservations validées, aucune décision utilisateur en attente**. Ne pas réappliquer cette révision ni les anciennes réponses du lot audio 01.

La validation utilisateur porte sur les décisions et valeurs fournies. Elle ne transforme pas une déclaration non recoupée en spécification constructeur : les réserves techniques restent indiquées et les fiches concernées restent Communauté. Aucun nouveau lot lancé.

| Équipement | Décision appliquée | Résultat |
|---|---|---|
| Allen & Heath — Xone:92 | Valider | Fiche conservée et validée par l’utilisateur. |
| Korg — KAOSS PAD KP3+ | Retirer | Retiré du catalogue général ; fichier conservé pour la compatibilité des projets. |
| Midas — Venice 160 | Valider | 75 W confirmés ; talkback +48 V permanent précisé. |
| Midas — Venice 240 | Valider | 95 W confirmés ; EPS1200 externe optionnel précisé, connecteur mécanique encore réservé. |
| Midas — Venice 320 | Valider | 120 W confirmés ; EPS1200 externe optionnel précisé, connecteur mécanique encore réservé. |
| Numark — MP103USB | Retirer | Retiré du catalogue général ; fichier conservé pour la compatibilité des projets. |
| Pioneer DJ — CDJ-2000NXS2 | Retirer | Retiré du catalogue général ; fichier conservé pour la compatibilité des projets. |
| Pioneer DJ — DJM-2000NXS | Retirer | Retiré du catalogue général ; fichier conservé pour la compatibilité des projets. |
| Pioneer DJ — DJM-2000 | Retirer | Retiré du catalogue général ; fichier conservé pour la compatibilité des projets. |
| Pioneer DJ — DJM-900NXS2 | Retirer | Retiré du catalogue général ; fichier conservé pour la compatibilité des projets. |
| Pioneer DJ — DJM-900NXS | Retirer | Retiré du catalogue général ; fichier conservé pour la compatibilité des projets. |
| Pioneer DJ — EFX-1000 | Retirer | Retiré du catalogue général ; fichier conservé pour la compatibilité des projets. |
| Pioneer DJ — RMX-1000-M (Platinum) | Retirer | Retiré du catalogue général ; fichier conservé pour la compatibilité des projets. |
| Pro-Ject — Tuner Box S | Retirer | Retiré du catalogue général ; fichier conservé pour la compatibilité des projets. |
| QSC — TouchMix-16 | Valider | 42 W confirmés, 2,98 kg métriques retenus selon ton choix avec contradiction livres/kg signalée. Bloc externe distinct de la prise console 6 contacts. |
| Rane — TTM 57SL | Retirer | Retiré du catalogue général ; fichier conservé pour la compatibilité des projets. |
| Tascam — SS-CDR200 | Retirer | Retiré du catalogue général ; fichier conservé pour la compatibilité des projets. |
| Universal Audio — UAD-2 Live Rack | Valider | Fiche conservée et validée par l’utilisateur. |
| XTA — DP448 | Valider | Sélecteur arrière pour les entrées, menu pour les sorties AES ; mêmes prises XLR, pas de ports physiques doublés. |
| Yamaha — D5000 | Valider | Validation explicite ultérieure appliquée : pédaliers omis, quatre jacks audio conservés, cordon captif avec fiche type C déclaré. |

## Données confirmées et déclarations

- **Midas Venice** : 75 / 95 / 120 W pour 160 / 240 / 320, alimentation externe EPS1200 optionnelle uniquement sur 240/320 et fantôme permanent du talkback confirmés dans le [manuel constructeur fourni](https://www.proscene.ch/data/web/proscene.ch/uploads/database/S02040/midas_venice_manual.pdf), pages PDF 4, 21 et 25. Les valeurs sont maintenant actives dans les budgets ; le brochage mécanique EPS1200 reste à préciser.
- **QSC TouchMix-16** : 42 W confirmés dans la [fiche constructeur de mars 2024](https://www.qscaudio.com/resource-files/productresources/mix/q_mix_tmix_specs_web.pdf), page PDF 6. La valeur métrique 2,98 kg est appliquée sur choix de l’utilisateur ; le document contient aussi 5,9 lb, incohérence conservée. La console possède une liaison 6 contacts vers un bloc externe dans le manuel déjà consulté. La déclaration IEC C14 est donc interprétée côté secteur du bloc ; aucune fausse embase IEC n’est ajoutée sur la console. Le manuel français de 49 Mo proposé n’a pas pu être lu par le lecteur web (limite de taille) ; il n’est pas présenté comme preuve consultée.
- **XTA DP448** : précision utilisateur confirmée par la notice série 4 déjà en cache, page PDF 31. Les entrées A/C transportent les paires AES 1/2 et 3/4 ; les sorties 1/3/5/7 transportent chacune deux canaux. La fiche reste analogique par défaut ; les prises numériques ne sont pas ajoutées comme des prises supplémentaires. Le lien Scribd fourni n’est pas utilisé comme nouvelle preuve.
- **Yamaha D5000** : le choix initial À décider, puis Conserver à compléter, est remplacé par la dernière instruction « Valide le D5000 selon mes réponses ». Les prises de pédalier sont retirées ; les quatre TRS audio d’entrée/sortie L/R documentés dans le manuel sont conservés. Cordon secteur intégré avec fiche de type C : déclaration utilisateur acceptée et indiquée comme telle, sans embase IEC inventée. Le modèle reste techniquement Communauté, la prise secteur n’étant pas représentable exactement et recoupée par une source constructeur. La validation utilisateur est complète.

## Compatibilité et bilan

Les douze retraits passent par le filtre de bibliothèque, sans supprimer leurs fichiers source. Aucun équipement ou port n’est supprimé des projets déjà enregistrés. Le test de compatibilité couvre désormais aussi ces douze retraits ; sa référence de classement Korg retirée est remplacée par le D5000 conservé.

Bibliothèque active : **749 Vérifié, 945 Communauté et 30 génériques** (1 694 références réelles, 1 724 blocs au total). Les 722 références encore non examinées du chantier initial restent en attente.

Le [relevé JSON](retours-lot-audio-02-2026-10-29.json) conserve les réponses, l’ordre des décisions D5000, les sources, les champs corrigés et les réserves.

Validation locale : **479 tests réussis, 6 essais réels de modèle ignorés** ; types et compilation réussis ; lint sans erreur (quatre avertissements préexistants). Les tests incluent les douze exclusions et la conservation des équipements et ports dans les projets enregistrés. Les installateurs et essais natifs restent à confirmer dans GitHub Actions.
