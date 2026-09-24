# Fiches constructeur

Un fichier JSON par modèle, nommé `fabricant-modele.json` (minuscules, tirets), par exemple `ssl-sb32-24.json`.

Règles :

1. Chaque valeur (ports, connecteurs, puissance, poids, hauteur en U) vient de la **documentation du fabricant** : fiche technique, manuel ou page produit officielle.
2. `sources` cite cette documentation (`url`) et la date de consultation (`accessed`, au format AAAA-MM-JJ).
3. Une valeur inconnue est **omise**, jamais estimée.
4. `status` vaut `verified` seulement après relecture. Sinon, il vaut `community`.
5. Les identifiants de connecteurs et de signaux sont ceux de `src/model/connectors.ts` et `src/model/signals.ts`.

Un test automatique (`npm test`) vérifie chaque fiche. Une fiche invalide est écartée au démarrage de l'application.

Structure :

```json
{
  "id": "fabricant-modele",
  "family": "stagebox",
  "manufacturer": "Fabricant",
  "model": "Modèle",
  "pictogram": "stagebox",
  "status": "verified",
  "powerW": 0,
  "weightKg": 0,
  "rackU": 0,
  "sources": [{ "url": "https://…", "accessed": "2026-09-24" }],
  "ports": [
    { "id": "in1", "name": "In 1", "direction": "in", "signal": "audioAnalog", "connector": "xlr3", "level": "mic" }
  ]
}
```
