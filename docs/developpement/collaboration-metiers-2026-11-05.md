# Collaboration par métier — 0.5.29

Carte COLLAB-METIERS-001, autorisée le 5 novembre 2026, à partir de la 0.5.28 (`f543818254b43e8a84cddabd1560687001e1a0cc`). Le retour de classe indique des invités toujours connectés mais refusés par les droits ; aucun défaut de transport réseau n’est établi.

## Correction

- Une règle commune contrôle les opérations dans l’interface, le garde local et la validation de l’hôte. Les filtres affichent les domaines ; les métiers attribués autorisent les modifications. Général reste en lecture seule pour les invités.
- Les interfaces techniques des appareils du métier sont modifiables : IP d’une console Audio, synchronisation, contrôle ou alimentation associés. Les ports Audio d’un appareil Image restent accessibles au métier Audio, sans ouvrir les propriétés Image.
- Les prises réseau libres des appareils de famille Réseau sont raccordables depuis un appareil autorisé. Cela n’ouvre pas les paramètres du switch ; une prise occupée ou une liaison étrangère ne peut pas être réaffectée par une opération combinée.
- Un appareil mixte non relié peut être supprimé par son métier principal. Toute suppression qui toucherait une liaison protégée est refusée dans son ensemble, avec le motif précis.
- L’ajout de ports Expert choisit un signal autorisé. L’annulation et le rétablissement sont simulés localement avant de modifier le document partagé, avec les droits actuels.
- Les prises et liaisons autorisées restent visibles dans le synoptique, y compris sur les équipements repliés ; les commandes de configuration protégées restent désactivées.

## Preuves et revue

Les trois régressions sont d’abord observées en échec : suppression d’un récepteur HF mixte non relié, console Dante vers switch et ajout réel d’un port Expert Image. Après correction, 57 tests ciblés passent sur sept fichiers. Ils couvrent les autorisations, les refus, la session simulée, l’Inspector, l’éditeur de ports, la vue Réseau et le Canvas avec les points de raccordement.

Le contrôle général réussit : 516 tests, six essais IA réelle ignorés, vérification des types et compilation. Lint : aucune erreur, quatre avertissements historiques de dépendances React. Le manuel HTML/PDF est régénéré (22 chapitres, 10 captures). La revue indépendante relit les changements face au snapshot initial ; elle ne trouve pas de contournement concret dans le périmètre. Son observation sur le motif générique du LinkInspector est reproduite en échec, corrigée, puis les quatre tests UI concernés passent ; leur lint ciblé est sans erreur ni avertissement. Les styles navigateur des nouveaux fieldsets sont neutralisés pour conserver la mise en page de l’Inspector.

L’agent de développement utilise gpt-6.1-sol moyen ; la revue bornée utilise gpt-6-luna moyen. Le principal relit les différences, exécute les contrôles généraux et publie uniquement la liste contrôlée sur `codex/ia-locale`, PR4 en brouillon. Deux passes au maximum : implémentation puis correction de la remarque UI. Aucun lot catalogue en attente n’est appliqué.

## Limites

Le protocole client/relais est 5 : mettre à jour tous les postes en 0.5.29, les versions précédentes sont refusées. La règle de raccordement partagé concerne les appareils de famille Réseau avec des ports de signal Réseau ; elle ne crée pas de verrouillage individuel ni de permission universelle sur les autres appareils.

Aucun essai sur le réseau physique des étudiants ni contrôle Rust/Tauri local n’est réalisé. Les installateurs et contrôles natifs doivent être confirmés par GitHub Actions pour le commit exact. Les six essais IA ignorés localement ne sont pas comptés comme des succès. Cette correction ne garantit pas l’absence de tout autre défaut dans une future séance.
