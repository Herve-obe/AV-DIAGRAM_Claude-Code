# Corrections de l’assistant IA — 0.5.14

26 octobre 2026. Base : commit 33bf48995cfc3d5d49a1e634db299225cd784927 (0.5.13).

## Échecs constatés

Les journaux du [banc Windows](https://github.com/Herve-obe/AV-DIAGRAM_Claude-Code/actions/runs/40305016184/job/121511873633) montrent quatre essais réussis sur cinq. Pour la conférence générique, le modèle a correctement extrait trois micros, une console et deux enceintes. Il a ensuite demandé deux câbles physiques vers chaque enceinte mono. Le moteur a refusé ce câblage ; le modèle a posé une question au lieu de corriger. Aucun appareil n’a été appliqué, ce qui explique le résultat vide. Il s’agit d’un défaut de reprise et d’informations de capacité insuffisantes, pas d’un port à inventer.

Sur le [banc Mac](https://github.com/Herve-obe/AV-DIAGRAM_Claude-Code/actions/runs/40305016184/job/121511873777), trois essais ont réussi et deux ont échoué avec « fetch failed » après de longs traitements CPU. Le serveur a reçu des annulations proches de cinq minutes. Le délai d’en-têtes par défaut de cinq minutes, documenté par [Undici/Node.js](https://github.com/nodejs/undici/blob/main/docs/docs/api/Client.md), est une cause probable ; le journal ne contenait pas sa cause détaillée. Le test emploie désormais HTTP avec un délai explicite de dix minutes, identique au transport natif local. Le délai des essais et le refus des résultats invalides restent actifs. Ce changement ne prétend pas accélérer le moteur.

## Corrections

- Le plan matériel envoyé au modèle résume les ports par sens, signal, connecteur et niveau, avec une capacité par appareil.
- Après un câblage refusé, le parcours reste orienté vers une correction du système. Trois tentatives au maximum, ou arrêt anticipé d’une répétition, puis clarification. Les règles ne sont ni ignorées ni desserrées.
- La construction du système reçoit le besoin, le plan structuré et le dernier échec utile. Elle ne reçoit plus plusieurs copies du plan ni les longues consignes de la phase d’analyse.
- Un plateau vidéo validé se termine par un résumé calculé et les alertes, sans nouvel appel au modèle.
- Les demandes explicites de mise en page de l’existant sont traitées localement. Les autres formulations peuvent appeler le nouvel outil rearrange_diagram.

## Réorganisation de l’existant

« Adapte ce schéma pour qu’il tienne sur une seule page » prépare un aperçu sur la feuille active. La sélection peut être ciblée explicitement. Aucun appareil ni câble n’est ajouté ou supprimé. Les prises restent présentes, les ports inutilisés sont repliés et les tracés manuels des liaisons concernées sont recalculés.

Les formats plus grands sont proposés à taille lisible. Une demande de page unique présélectionne le premier format valide à une page, s’il existe ; le changement n’est enregistré qu’avec Appliquer. Un format explicitement demandé est conservé dans l’aperçu, même si plusieurs pages sont nécessaires. Le choix reste modifiable avant validation.

La proposition conserve les notes, leurs textes, les autres feuilles et les appareils hors sélection. Les droits sont contrôlés sur chaque variante et lors de l’application. Refuser conserve le projet ; Appliquer puis Annuler restaure aussi le format et les tracés.

Limites : les groupes de sous-feuilles repliés ne sont pas réorganisés depuis leur feuille parente ; ouvrir la sous-feuille pour traiter ses appareils. Une annotation indivisible trop grande peut imposer un format supérieur ou empêcher l’application. Le placement estime les dimensions des blocs ; il ne garantit pas l’absence de tout croisement de câble. Les renvois professionnels de liaisons entre pages et le remplacement/suppression d’appareils par l’IA restent à développer.

## Validation

475 tests automatisés réussis, six essais avec le vrai modèle réservés au banc d’intégration. Types et compilation réussis. Lint ciblé sans erreur, deux avertissements préexistants dans Canvas.

Les nouveaux contrôles couvrent le mauvais nombre de câbles par enceinte, plusieurs formulations de mise en page, les questions et négations, la conservation du patch et des notes, la sélection, les autres feuilles, les droits et l’application annulable. Le banc réel ajoute le cas Concert (13 appareils, 15 liaisons) et vérifie que sa mise en page ne sollicite pas le modèle.

Le contrôle local du vrai modèle n’est pas encore validé : le moteur a chargé le modèle en cache, mais sa connexion locale n’est pas joignable depuis le banc dans cet environnement. Le navigateur de contrôle ne peut pas non plus joindre le serveur de développement local. La recette native et visuelle Windows/macOS reste donc à confirmer ; les tests de composants ne la remplacent pas.
