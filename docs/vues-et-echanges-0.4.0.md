# Vues et échanges — version 0.4.0

Ces fonctions complètent les baies et le synoptique. Le plan, les tableaux et les câbles utilisent les mêmes instances d'équipement : renommer ou retirer un appareil se répercute dans les différentes vues. La version reste en développement et demande des essais sur les postes de travail.

## Prises repliées — complément 0.4.1

Toutes les familles utilisent le même principe : au-delà de 16 prises, seuls les ports reliés sont affichés automatiquement. Les appareils de 16 prises ou moins restent dépliés. Les ports et câbles conservent leurs noms, identifiants et renvois vers les autres feuilles.

Sélectionner un appareil fait apparaître « Tous les ports » ou « Ports reliés ». Le second choix peut aussi replier un petit appareil, par exemple une caméra. Dans l'inspecteur, « Prises visibles sur le schéma » propose également le retour à « Automatique ». Ce choix appartient à chaque équipement : il est enregistré dans le .avd, annulable et partagé avec la session. L'hôte peut le modifier partout ; un invité uniquement pour un équipement de son domaine principal, depuis le calque qui lui est attribué.

En mode replié, « Ajouter une connexion » indique le nombre de prises disponibles dans le calque autorisé. Choisir Entrées, Sorties ou Bidirectionnels, puis la prise dans la liste regroupée par signal. Le port choisi apparaît temporairement pour tirer le câble ; une fois relié il reste visible. « Masquer ce port » annule cet affichage temporaire sans supprimer de prise. Les prises bidirectionnelles sont comptées séparément des sorties.

PDF, PNG et SVG reprennent la présentation du canevas ; les outils flottants sont exclus de l'image. Le DXF respecte aussi le choix mémorisé. Les tableaux de câblage et Excel gardent les données complètes. Les anciens projets sans choix explicite utilisent le mode automatique.

## Plan d'implantation

Dans **Plan**, choisir un équipement existant dans « Équipement à placer », puis cliquer sur le plan ou sur « Placer au centre ». Un modèle de la bibliothèque peut aussi être déposé sur le plan. L'inspecteur permet de saisir X/Y en mètres, la largeur, la profondeur et l'orientation. La position et l'orientation du bloc du synoptique restent indépendantes.

Les dimensions physiques inconnues sont représentées par un symbole pointillé, jamais par une dimension inventée. Retirer du plan conserve l'équipement et ses câbles. Glisser déplace un équipement ; les flèches suivent l'aimantation (Maj multiplie le pas par dix). Glisser le fond navigue ; F affiche l'ensemble. « Mesurer » donne une distance droite entre deux points, sans modifier une longueur de câble.

Le plan est propre à chaque feuille logique. L'export PDF ajusté affiche son échelle calculée ; l'export sur plusieurs pages utilise l'échelle 1:N saisie dans le plan. Le format, le cartouche, les révisions, les destinataires, le filigrane et la protection utilisent les mêmes réglages que les autres PDF. SVG et PNG sont également disponibles pour le plan.

## AutoCAD et DXF

Le bouton d'import DXF propose un aperçu et deux usages :

1. **Fond de plan** : importer la géométrie sur une nouvelle feuille, ou remplacer explicitement le fond de la feuille courante. Ses calques peuvent être masqués. Les équipements restent des objets AV Diagram indépendants.
2. **Synoptique éditable** : reconnaître les cadres, textes, ports et liaisons, puis vérifier les propositions dans la fenêtre de reconnaissance avant de créer la feuille. Des dessins réels et variés restent à essayer ; une convention graphique particulière peut demander une correction manuelle.

Les unités déclarées sont utilisées si elles sont reconnues. Sinon, l'utilisateur doit choisir mm, cm, m, pouces ou pieds. Les lignes, polylignes, arcs, cercles, ellipses, textes et blocs imbriqués 2D sont traités. Les courbes sont approchées par des segments ; les objets non pris en charge sont signalés. Les références externes ne sont pas ouvertes. Les plans 3D, hachures, cotations complexes et présentations AutoCAD ne sont pas reproduits comme dans AutoCAD.

**DWG n'est pas lu directement** : exporter d'abord un DXF depuis AutoCAD ou un convertisseur adapté. Le logiciel explique cette limite à l'ouverture d'un DWG.

L'export DXF du plan écrit les coordonnées en mètres et sépare fond, équipements, symboles sans dimensions et étiquettes. Celui du synoptique reprend la géométrie visible des blocs et des câbles ; il est identifié comme schéma de principe sans échelle physique. Ces échanges géométriques ne constituent pas un aller-retour de toutes les propriétés métier d'AutoCAD. Maximum à l'import : fichier de 10 Mo, 25 000 objets développés, 200 000 points ; lecture interrompue après 15 s.

## Excel et patch

**Listes** ou le menu d'export produit un `.xlsx` avec câblage, patch, nomenclature, interfaces réseau, PoE, débits prévus, circuits/phases, affectations électriques, intercom, horloges, liaisons physiques et alertes. Les quantités et valeurs sont des nombres. Les cases vides indiquent une information inconnue ; une caractéristique unitaire différente entre deux exemplaires du même modèle n'est pas présentée comme une valeur commune.

Pour modifier un patch, conserver la feuille **Patch** et ses colonnes d'identifiants masquées. Renseigner l'équipement et le port source, puis la destination. Les noms sont prioritaires ; les identifiants aident quand un nom est absent ou ambigu. Les lignes sans destination sont ignorées et ne suppriment pas de câbles. Les longueurs acceptent une virgule décimale et zéro. Un champ facultatif vide dans une colonne présente efface sa valeur ; une colonne absente la conserve.

L'import montre les modifications et les erreurs avant application. Une erreur refuse tout le lot ; les avertissements de compatibilité demandent une validation dans la fenêtre. L'application est une seule opération annulable. Les formules ne sont pas exécutées : fournir leurs résultats comme valeurs simples. Maximum : `.xlsx` de 10 Mo, 50 Mo décompressés, 10 000 lignes par feuille, 100 colonnes, 200 000 cellules ; 2 000 liaisons par import de patch. Les fichiers Excel chiffrés et l'ancien format `.xls` ne sont pas pris en charge.

## Réseau

Renseigner par port l'adresse IPv4, son préfixe, le VLAN natif, les VLAN tagués, la capacité et le rôle/puissance PoE. Le budget total PoE appartient à l'équipement fournisseur. La demande connue est calculée depuis les récepteurs physiquement raccordés ; les puissances inconnues sont signalées. Le débit prévu est un agrégat déclaré par câble, comparé aux capacités renseignées de ses extrémités.

Les alertes couvrent les doublons d'adresse potentiels, adresses réseau/diffusion, sous-réseaux ou VLAN natifs différents sur un câble, dépassements de capacité et de PoE. Deux réseaux isolés peuvent légitimement réutiliser une adresse : les doublons sont des points à examiner. Les VLAN tagués sont documentés, pas simulés. Cette vue ne configure aucun switch, ne découvre pas les adresses des équipements et ne déduit pas le trafic de protocoles AV, la redondance, le multicast ou les chemins à travers les switches.

## Électricité

L'hôte crée les circuits monophasés ou triphasés, avec tension **phase-neutre** et calibre par phase facultatif. Chaque équipement reçoit un circuit, une phase et un facteur de puissance de l'ensemble châssis/cartes. Pour une charge triphasée déclarée équilibrée, choisir explicitement L1+L2+L3 ; aucune répartition n'est supposée pour une charge sans phase.

Le courant connu est la somme des puissances connues divisées par la tension et le facteur de puissance déclaré. Une charge équilibrée est répartie sur les trois phases. Les charges sans phase sont comptées à part. Les puissances ou facteurs manquants rendent le bilan incomplet, indiqué par ≥ ; ils ne sont pas remplacés par zéro ni par un facteur de puissance de 1. Un courant connu déjà supérieur au calibre est signalé même si le bilan est incomplet.

Vérifier que la puissance renseignée est la consommation absorbée de l'appareil, et non sa puissance de sortie ou la capacité d'un distributeur. Le bilan est un outil de préparation : il ne calcule ni neutre, harmoniques, chute de tension, section, protection, courant de démarrage ni conformité d'installation. Retirer un circuit retire ses affectations sans supprimer les appareils.

Référence des relations puissance/courant : [Schneider Electric, Electrical Installation Guide](https://www.electrical-installation.org/enwiki/Definition_of_reactive_power). Le calcul utilise une somme conservatrice des courants nominaux, sans foisonnement ni compensation supposée.

## Intercom et synchronisation

Intercom documente les canaux/groupes et propose une matrice paginée des **liaisons physiques**. Un clic crée ou retire un câble du projet, avec les mêmes contrôles et annulations que le synoptique. Elle ne programme pas le routage audio interne d'une matrice constructeur.

Synchronisation documente protocole, domaine, rôle et cadence/fréquence des ports. Les candidats automatiques ne sont pas traités comme plusieurs maîtres forcés. Les alertes comparent les domaines déclarés, les maîtres forcés concurrents, les suiveurs sans source déclarée, les cadences textuelles différentes et les extrémités de câbles incompatibles. Elles ne simulent ni l'élection PTP ni un verrouillage réel. Les deux vues permettent de raccorder leurs ports existants et de retrouver les câbles dans l'inspecteur.

## Collaboration, fichiers et tracés

Tous les postes d'une session doivent utiliser **0.4.0 (protocole 3)**. Les versions au protocole précédent sont refusées. Les anciens `.avd` s'ouvrent toujours ; conserver une copie avant de revenir à un logiciel antérieur qui ne connaît pas ces champs.

Le sélecteur de calque est disponible dans les nouvelles vues. Les invités ne modifient que les appareils/ports de leur domaine attribué, depuis ce calque. Leur vue générale est en lecture seule. Les fonds/dimensions du plan, circuits, importations de feuilles et de patch restent communs, réservés à l'hôte. Les câbles transversaux synchro/contrôle, sans calque de signal, restent réservés à l'hôte selon les règles existantes. Les paramètres par port suivent Yjs et l'annulation de chaque participant. Dupliquer un équipement efface son adresse IP et transforme son rôle maître forcé en candidat automatique ; créer un modèle personnel ne conserve aucune affectation de canal, d'adresse ou de domaine d'horloge.

Les ports orientés haut/bas bénéficient des voies ordonnées et d'une poignée de segment horizontal. Les ports gauche/droite conservent leur poignée de segment vertical. Glisser, ou utiliser les flèches de la poignée sélectionnée, règle le coude. Un double-clic ou « Tracé auto » supprime le réglage manuel. Les positions sont conservées dans le fichier et la collaboration.

## Dépendances et essais

Lecteur DXF : [dxf-parser 1.1.2](https://github.com/gdsestimating/dxf-parser), MIT. Excel : [ExcelJS 4.4.0](https://github.com/exceljs/exceljs), MIT. Versions fixées dans le manifeste et le verrou. Les [notices](third-party/import-licenses.txt) sont générées par `scripts/generate-import-notices.mjs` et embarquées dans les ressources de l'application.

Les tests automatisés couvrent les unités/blocs DXF, la reconnaissance d'un petit synoptique, les fichiers XLSX réels, le refus atomique d'un patch, les PDF vectoriels paginés, la persistance/Yjs, les droits, les budgets et les orientations de ports. Les essais de rendu en navigateur ne remplacent pas les essais de fichiers natifs Windows/macOS ni les tests en LAN sur plusieurs postes.
