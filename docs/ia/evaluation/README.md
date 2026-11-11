# Batterie d'évaluation de l'assistant IA

Cas tirés d'exercices de BTS Métiers de l'audiovisuel, option son, fournis par leur auteur, Hervé Obejero (formateur). Chaque fichier de `cas/` reprend le cahier des charges d'un sujet. Seule la partie conception du système et du synoptique est conservée : les questions de cours et le travail de post-production sont écartés. Aucun corrigé n'était joint aux sujets (`corrigeDisponible: false` partout).

## Liste des cas

| id | Titre | Source (Drive) | Difficulté | Domaines |
|---|---|---|---|---|
| `conference-presse` | Conférence de presse d'après-match avec press-box | Sujet 2 - Débat Public.pdf | simple | son |
| `concert-acoustique-youtube` | Concert acoustique en festival, YouTube et enregistrement | Sujet 3 - Concert.pdf | simple | son |
| `radio-crossroad` | Émission de radio musicale en direct avec duplex | PLAT3-crossroad.pdf | simple | son, intercom |
| `radio-tablettes-duplex` | Plateau radio avec duplex de Berlin et quiz | Sujet TMO 1.pdf | simple | son |
| `postprod-clinic` | Régie de post-production avec voix off | Sujet TMO 3.pdf | simple | son |
| `tournage-fiction-locataire` | Tournage et post-production d'une fiction TV | Sujet TMO 2.pdf | simple | son, video, sync |
| `talk-show-twitch` | Talk-show vidéo sur Twitch avec intermède musical | Sujet 1 - Talk-show TV.pdf | moyen | son |
| `td-radio-saint-genes` | Émission de radio en public, en extérieur, avec duplex | TD Sono - AV 2 SON.pdf | moyen | son |
| `concert-noel-synchro` | Concert de Noël : synchro et timecode | BTS Blanc TMO AV2 SON dossier Concert de Noël avec ANNEXES.pdf | moyen | son, sync, reseau |
| `concert-noel-sonorisation` | Concert de Noël : diffusion, retours, HF, multipiste | BTS Blanc TMO AV2 SON dossier Concert de Noël avec ANNEXES.pdf | complexe | son, reseau, intercom |
| `emission-concert-youtube` | Émission radio/podcast avec concert live sur YouTube | Sujet - Emission Concert.docx.pdf | complexe | son |
| `radio-avenir-cinema` | Webradio en public avec duplex, téléphone et live | BTS BLANC AV 2 - Radio + concert v2.pdf | complexe | son, reseau |
| `zero-dechet-plateau` | Plateau TV, duplex Londres, triple enregistrement synchro | Devoir Maison TMO 2 Console Type PCP.pdf | complexe | son, video, sync |
| `plateau-tv-duplex-bilingue` | Plateau TV/radio, deux duplex, traduction simultanée | Exercice Plateau TV + duplex bilingue.pdf | complexe | son, video, reseau, sync |
| `plateau-stream-duplex-jazz` | Streaming bilingue, deux duplex, groupe de jazz | BTS BLANC AV 2 - Plateau TV stream et duplex.pdf | complexe | son, video, intercom, reseau, sync |
| `plateau-radio-tv-intercom` | Plateau multi-espaces, micro-trottoir, matrice de communication | Cahier des charges Exercice plateau Radio TV.pdf | complexe | son, video, intercom, sync |

Bilan : 16 cas tirés de 15 fichiers. Le dossier Concert de Noël donne deux cas, car il demande deux synoptiques distincts : l'un pour l'audio, l'autre pour la synchro.

## Fichiers illisibles ou lus en partie

Les 15 fichiers ont été lus. Aucun n'est illisible. Plusieurs parties n'ont cependant pas pu être exploitées :

- **Devoir Maison TMO 2** : le devis en annexe (pages 4 et 5) n'est qu'une image. Il a été lu à partir d'un rendu de la page.
- **Concert de Noël** :
  - les pages 5 et 6 (vue 3D de la chapelle, capture Scanzone) ne sont que des images et n'ont pas été exploitées ;
  - la carte des fréquences Shure (page 7) a été extraite en morceaux ;
  - les fiches produits (pages 14 à 27) sont des annexes constructeur, sans exigence.
- **Sujet TMO 2** :
  - le croquis d'implantation annoncé est absent du texte ;
  - les pages 4 et 5 contiennent une télécopie administrative sans rapport avec le sujet.
- **Sujet TMO 3** : le plan de montage annoncé en annexe est absent. Le sujet porte surtout sur la post-production, et la partie système du cas est mince.
- **Incohérences dans les sujets** :
  - « Sujet 2 - Débat Public.pdf » traite en fait d'une conférence de presse ;
  - « Sujet - Emission Concert » demande trois consoles mais n'en fournit qu'une, et mentionne un cajon absent de l'effectif. Ces écarts sont repris en exigences `question_attendue`.

## Rôles utilisés dans `de` / `vers`

Les rôles sont des étiquettes libres en kebab-case. La comparaison se fait par préfixe : `console` couvre `console-foh`, `console-broadcast`, etc. ; `enregistreur` couvre `enregistreur-744`, etc.

Rôles principaux :

- consoles : `console`, `console-foh`, `console-broadcast`, `console-live`, `console-itw`, `console-ssl` ;
- liaisons distantes : `codec-duplex`, `codec-diffusion`, `insert-telephone`, `duplex` (correspondant dans une autre pièce) ;
- sources : `lecteur-media`, `station-daw`, `station-protools`, `recepteur-hf`, `stagebox` ;
- enregistrement et diffusion : `enregistreur-*`, `poste-streaming`, `encodeur-*` ;
- écoutes et retours : `diffusion-public`, `retour-plateau`, `retour-artistes`, `retour-casques`, `ecoute-regie`, `mesure-niveau` ;
- synchro et ordres : `horloge-maitre`, `generateur-tc`, `talkback`.

Une quantité `null` dans `materielImpose` signifie que le sujet ne la précise pas.

## Méthode de notation proposée

1. Chaque cas est joué tel quel : la `demande` est envoyée à l'assistant, puis on récupère le plan structuré et le schéma qu'il produit.
2. **Exigences `quantite`** : on compte les équipements de la `famille` dans le schéma et on vérifie `min` et `max`. Le cas est réussi ou échoué, sans note intermédiaire.
3. **Exigences `liaison` et `sortie`** : on cherche un chemin, direct ou à travers des équipements intermédiaires, du rôle `de` vers le rôle `vers`, avec le `signal` demandé s'il est renseigné. Les rôles sont associés aux équipements par leur étiquette ou leur nom.
4. **Matériel imposé** : chaque référence doit apparaître, avec la quantité demandée. Si l'assistant substitue un modèle sans le signaler, la note est nulle.
5. **Exigences `contrainte`** : un juge les note de 0 à 2 (absente, partielle, satisfaite). Ce juge est un humain ou un modèle de référence, et il dispose du texte de l'exigence et de la réponse de l'assistant.
6. **Exigences `question_attendue`** : un point si l'assistant pose la question ou formule l'hypothèse de façon explicite, zéro s'il choisit en silence.
7. **Pénalités** :
   - caractéristique constructeur inventée : −2 ;
   - liaison incompatible signalée par le moteur de règles : −1 ;
   - N-1 qui renvoie au destinataire sa propre voix : −1.
8. **Note du cas** : points obtenus divisés par les points possibles, ramenés sur 100, puis pénalités. Les `pointsDeVigilance` servent au diagnostic, pas à la note.
9. **Note globale** : moyenne des cas, pondérée par la difficulté (simple ×1, moyen ×2, complexe ×3), publiée séparément pour l'IA locale et pour l'IA personnelle.
10. **Robustesse** : chaque cas est joué trois fois. On publie la médiane et l'écart, et une note qui baisse entre deux versions de l'agent bloque la publication.

## Lancer la batterie

La notation automatique (quantités, liaisons, sorties) est codée dans `src/ai/evaluation.ts` et testée dans `src/ai/evaluation.test.ts`. Le lanceur `src/ai/evaluation.run.test.ts` joue les cas avec un vrai modèle ; `npm test` l'ignore.

- IA locale : démarrer le serveur avec `scripts/test-local-ai.py`, puis `AVD_EVAL=1 AVD_LOCAL_AI_TEST_URL=… AVD_LOCAL_AI_TEST_TOKEN=… npx vitest run src/ai/evaluation.run.test.ts`.
- IA personnelle : `AVD_EVAL=1 AVD_EVAL_PROVIDER=anthropic AVD_EVAL_MODEL=claude-sonnet-5-5 AVD_EVAL_KEY=… npx vitest run src/ai/evaluation.run.test.ts`. Chaque cas est facturé par le fournisseur.
- Options : `AVD_EVAL_CASES=talk-show-twitch,conference-presse`, `AVD_EVAL_RUNS=3`, `AVD_EVAL_OUT=chemin.json`.

Si l'assistant pose une question, il reçoit une seule relance : « Fais des hypothèses raisonnables, annonce-les, et propose le schéma complet. » Les résultats sont écrits dans `resultats/`. Ils comprennent la note automatique de chaque cas, les exigences laissées au juge, les questions posées et le nombre d'erreurs du moteur de règles.
