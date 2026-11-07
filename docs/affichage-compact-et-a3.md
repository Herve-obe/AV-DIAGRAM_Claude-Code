# Équipements volumineux et mise en page A3

Examen du 15 octobre 2026, version proposée dans la PR n° 2, commit `a98f794`. Ce document distingue le fonctionnement actuel des évolutions proposées. L’application n’a pas été modifiée pour cette étude.

## Ce que fait le logiciel aujourd’hui

Une stagebox de 32 entrées et 24 sorties affiche ses 56 ports, répartis sur 32 lignes dans deux colonnes. Le mode appelé « compact » dans le code masque seulement le modèle de l’appareil en mode débutant : il ne replie pas les ports.

Le calcul d’encombrement estime ce bloc à 240 × 704 unités. À l’échelle d’impression de 100 %, sa hauteur représente environ 176 mm. Un A3 paysage mesure 420 × 297 mm ; sans historique de révisions, la zone de dessin prévue par le logiciel est de 400 × 225 mm, après les marges, le cartouche et la légende. Cette seule stagebox prend donc environ 78 % de la hauteur disponible. Sa hauteur exacte à l’écran dépend du rendu.

Créer un projet A3 active normalement le mode « page ». Le cadre reste aux proportions de l’A3, se centre sur le contenu et grandit en unités du schéma si nécessaire. L’impression réduit alors le dessin pour le faire tenir sur une seule page A3 par feuille du projet. Le papier ne change pas de dimensions.

| Mode actuel | Résultat |
|---|---|
| Page | Une page par feuille, sans agrandir les petits schémas ; réduction si le contenu dépasse. |
| Mise à l’échelle | Une page par feuille, avec recadrage automatique de la vue. |
| Taille fixe | Échelle choisie conservée ; découpage en plusieurs pages repérées si nécessaire. |

Le logiciel ne dispose pas actuellement d’une organisation complète des équipements selon les connexions et le format de papier. Les commandes d’alignement/répartition agissent sur la sélection. Les ajouts par double-clic cherchent de la place vers la droite ; ils ne passent pas automatiquement à la ligne au bord de l’A3. Le tracé automatique concerne les câbles, pas l’organisation des appareils.

## Affichage recommandé : ports reliés et ports libres regroupés

Pour les appareils à nombreux ports, afficher par défaut le nom, la capacité totale et uniquement les ports reliés. Les ports libres restent accessibles derrière « Ajouter une connexion » ; un bouton « Tous les ports » permet d’ouvrir la vue complète.

Exemple : une stagebox 32/24 avec trois entrées et deux sorties utilisées présente cinq ports et la mention « 29 entrées libres · 22 sorties libres ». Le port IN 09 garde son numéro, même si IN 03 à IN 08 sont masqués.

Le parcours proposé :

1. Importer la stagebox crée un petit bloc portant sa capacité et le bouton d’ajout.
2. Ajouter une connexion permet de choisir un port libre, avec son numéro, son sens et son type de signal. Lorsqu’on tire un câble vers l’équipement, seuls les ports compatibles sont proposés.
3. Le port choisi devient une vraie extrémité de liaison visible ; la liaison n’aboutit jamais au compteur de ports libres.
4. Les ports déjà reliés restent visibles, y compris ceux qui renvoient à une autre feuille. Aucun port ni câble n’est supprimé par le repliage.
5. Une vue complète reste disponible pour le contrôle du câblage. Le bloc ne se replie pas sous le pointeur pendant un branchement.

L’export doit utiliser la représentation choisie et masquer les boutons d’édition. Les droits des calques restent applicables au branchement. Un simple dépliage pour consulter les ports ne doit pas exiger un droit de modification du projet.

Si les 56 ports sont utilisés, le bloc restera dense : des feuilles de détail ou les sous-schémas existants seront alors plus adaptés. Masquer des connexions actives derrière un bloc anonyme ferait perdre l’information de câblage.

## Mise en page recommandée

Le format de papier et l’organisation des équipements doivent être traités ensemble. Une commande explicite « Organiser dans la page » devrait utiliser les dimensions réellement affichées, les liaisons, les espaces nécessaires à leurs étiquettes et la zone réservée au cartouche. Elle doit offrir un aperçu et être annulable.

Pour un résultat lisible : garder la taille des textes en priorité, puis proposer plusieurs A3 si nécessaire. Une option « Tout sur une page » peut conserver la réduction, avec son pourcentage et un avertissement si les textes deviennent trop petits. Un seuil initial de 7 points pour les libellés est une proposition de conception, pas une exigence normative.

Exemple calculé avec le code actuel : huit blocs de stagebox rangés côte à côte avec des écarts de 40 unités sont réduits à environ 70 % en mode page. Les noms de ports de 11,5 unités correspondent alors à environ 5,7 points sur papier. En taille fixe à 100 %, ce même encombrement nécessite deux A3 paysage. Il s’agit d’un exemple de calcul, pas d’une impression mesurée.

## Anomalies confirmées lors de l’examen

- **Une vue générale composée seulement de groupes repliés peut être omise du PDF.** La sélection des feuilles à exporter ne considère que les équipements et les annotations directement rattachés à la feuille. Les blocs représentant ses sous-schémas ne sont pas comptés. Le calcul d’encombrement présente le même manque.
- **L’annonce du nombre de pages peut différer de l’export.** L’aperçu utilise une taille de bloc estimée, alors que l’export en taille fixe utilise les dimensions mesurées. Le calcul annoncé parcourt également le contenu du projet sans reprendre exactement les éléments visibles du canevas. Il faut un calcul commun fondé sur la représentation réellement exportée, groupes compris.
- **Le placement initial ne tient pas compte de l’A3.** Le décalage vers la droite et une taille supposée de 220 × 140 unités servent à placer un ajout, indépendamment de son nombre de ports et de la zone imprimable. Ce n’est pas une organisation automatique à l’intérieur de la page.

## Vérifications effectuées et limites

Les 26 tests existants ciblant les formats, les cadres de page, le placement et les sauvegardes passent. Neuf assertions supplémentaires ont été exécutées directement sur les fonctions actuelles : dimensions A3, encombrement 32/24, échelle, découpage, placement horizontal et absence de bornes pour une vue générale contenant seulement un groupe. Les interactions de la maquette sont vérifiées séparément ; elles ne constituent pas une fonctionnalité déjà intégrée.

Les références principales sont [EquipmentNode.tsx](../src/editor/EquipmentNode.tsx), [exportOptions.ts](../src/io/exportOptions.ts), [exportPdfUi.ts](../src/io/exportPdfUi.ts), [ExportControls.tsx](../src/ui/ExportControls.tsx) et [LibraryPanel.tsx](../src/ui/LibraryPanel.tsx).

Restent à vérifier sur l’application : le PDF avec groupes repliés, les câbles et étiquettes en bord de page, la netteté après export et une impression A3 à taille réelle. Aucun changement n’a été publié dans la PR pour cette étude.
