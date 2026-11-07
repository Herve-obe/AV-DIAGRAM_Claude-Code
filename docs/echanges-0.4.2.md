# Échanges et manuel — 0.4.2

## draw.io

Import .drawio/.xml en XML brut, mxGraphModel seul ou pages mxfile compressées (base64, deflate brut et URI). Pages, objets englobants, groupes translatés, ports relatifs et extrémités explicites des connexions sont lus. La structure passe par la vérification des équipements et liaisons existante : choisir une page, corriger les propositions puis importer sur une nouvelle feuille, en une opération annulable. Les images et liens distants ne sont pas ouverts ; les formes avancées et rotations sont simplifiées et signalées. Les groupes sont aplatis, leur hiérarchie n'est pas recréée.

L'export écrit du XML non compressé éditable : feuilles non vides, noms/modèles, prises visibles avec sens/signal/connecteur, câbles sur la feuille, textes et renvois vers les autres feuilles. Le .avd reste la référence : baies, implantations métriques, données de déploiement, ports libres masqués, hiérarchie des sous-schémas, rotations et réglages fins des tracés ne constituent pas un aller-retour complet. Un renvoi exporté est du texte et ne devient pas automatiquement une liaison entre pages lors du réimport.

## Visio

Import partiel de .vsdx (ZIP/XML), pages et relations internes, formes, textes, groupes, valeurs de transformation enregistrées et connexions BeginX/EndX. Les formes de base des masters peuvent fournir les valeurs absentes des instances. Les valeurs enregistrées des cellules sont utilisées, jamais les formules. Les anciens .vsd binaires, macros, images/OLE, références externes et géométries avancées ne sont pas exécutés ni reproduits. Les connexions sans deux blocs identifiés sont signalées. Pas d'export VSDX dans cette version.

## DWG

Un DWG peut être choisi dans le dialogue DXF/DWG. Il ouvre une proposition de conversion locale, sans modification du projet. L'utilisateur installe séparément ODA File Converter puis sélectionne son programme ; aucune copie du convertisseur n'est embarquée, téléchargée ou lancée automatiquement depuis un projet. Le binaire attendu est ODAFileConverter.exe sous Windows ou ODAFileConverter sur Mac/Linux. Sur Mac, il se trouve dans Contents/MacOS de l'application. Vérifier la compatibilité de la version du convertisseur avec le système utilisé.

Le seul fichier choisi est copié dans un dossier temporaire privé. Le programme reçoit des arguments séparés : dossier source, destination, ACAD2018, DXF, sans récursion ni réparation, filtre source.dwg. Aucun shell ni nom de fichier fourni n'est exécuté. Limites : DWG et DXF de 10 Mo, 60 secondes, une conversion à la fois ; annulation et sortie de l'application arrêtent le processus. Les fichiers temporaires sont nettoyés après son arrêt. Le DXF est ensuite lu par le lecteur existant, avec choix d'unité et vérification. Pas de lecteur DWG autonome, pas de garantie de reprise de tous les objets AutoCAD. Si le convertisseur n'est pas disponible, préparer un DXF texte avec le logiciel d'origine.

## Bornes et droits

Lecture XML dans un worker, arrêt à 15 secondes. 10 Mo de fichier, 50 pages, 2 000 éléments par page, 4 000 sur le document ; XML à profondeur 64 et 50 000 éléments. Décompression progressive : 10 Mo par document XML, 50 Mo de XML Visio au total, 2 000 entrées ZIP ; les tailles réelles sont comptées, les chemins ambigus et DTD refusés. Aucune entité externe ni URL n'est résolue. Un échec n'applique rien au projet. Les importations restent réservées à l'hôte en collaboration et vérifient l'identité du projet à l'application.

## Manuel et périmètre V1

Le [manuel utilisateur](manuel-utilisateur.md) comporte 21 chapitres : projets, sauvegardes, bibliothèque, édition, prises repliées, câblage, collaboration, baies, implantation, réseau, électricité, intercom/synchronisation, Excel, PDF/CAO, draw.io/Visio, exports, deux écrans et dépannage. HTML et PDF sont intégrés hors ligne. Le bouton Manuel permet de lire le HTML et d'enregistrer le PDF. Sources générées par scripts/build-manual.py (ReportLab), sans service en ligne.

Formation, distribution officielle avec certificats et version tablette sont en attente (décision du 20 octobre 2026). Cloud et assistant IA restent en attente. Les vidéos de démonstration sont une possibilité ultérieure : privilégier des captures réelles de l'application, avec texte, voix de synthèse et sous-titres ; aucune vidéo ni aucun envoi de projet à un service d'IA n'est inclus dans ce lot.

## Sources techniques

- [Structure et styles draw.io](https://www.drawio.com/docs/reference/diagram-generation/style-reference/).
- [Modèle de graphe draw.io](https://github.com/jgraph/drawio/wiki/Graph-Model).
- [Format Visio VSDX](https://learn.microsoft.com/en-us/office/client-developer/visio/introduction-to-the-visio-file-formatvsdx) et [connexions](https://learn.microsoft.com/en-us/office/client-developer/visio/connect-element-connects_type-complextypevisio-xml).
- [ODA File Converter : interfaces et paramètres](https://www.opendesign.com/guestfiles/oda_file_converter).
- [LibreDWG : licence GPLv3+](https://www.gnu.org/software/libredwg/) ; ce moteur n'est pas intégré à AV Diagram.
- [fflate, MIT](https://github.com/101arrowz/fflate) 0.8.3 et [saxes, ISC](https://github.com/lddubeau/saxes) 6.0.0, déjà installés transitivement, deviennent des dépendances directes fixées. Notices incluses dans docs/third-party/import-licenses.txt et le paquet bureau.
