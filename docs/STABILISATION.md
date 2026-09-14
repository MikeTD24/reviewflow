# Stabilisation du MVP

Ce document conserve les controles de la RF-012 afin que la validation puisse etre reproduite
avant une demonstration ou une candidature.

## Controles automatises

Validation du 9 septembre 2026 :

| Controle                      | Resultat                         |
| ----------------------------- | -------------------------------- |
| `npm run format:check`        | Reussi                           |
| `npm run lint`                | Reussi                           |
| `npm test`                    | 28 tests reussis                 |
| `npm run build`               | Extension et API compilees       |
| `npm audit --omit=dev`        | 0 vulnerabilite connue           |
| Manifeste source contre build | Identiques                       |
| Recherche de secrets          | Aucun secret trouve              |
| `GET /api/health`             | Reponse `{"status":"ok"}`        |
| Serveur de demonstration      | Port libre et port occupe testes |

Le motif `LLM_API_KEY` trouve dans `.env.example` est volontairement vide et commente.

## Permissions verifiees

- `activeTab` : acces temporaire a la page apres une action explicite de l'utilisateur ;
- `scripting` : execution ponctuelle de l'extracteur dans l'onglet actif ;
- `storage` : conservation locale des fiches ;
- `http://localhost:3000/*` : seul acces hote permanent, reserve a l'API locale.

Aucune permission `tabs`, `downloads` ou acces global aux sites n'est declaree.

## Parcours manuel Chrome et Edge

Lancer les deux services dans deux terminaux CMD :

```cmd
npm run start --workspace api
npm run demo
```

Pour chaque navigateur, recharger `extension/dist`, puis verifier :

- [x] la capture de `http://localhost:4173` ;
- [x] le titre, le domaine, le texte selectionne et le produit JSON-LD ;
- [x] la modification des champs et les validations nom/prix/devise ;
- [x] la sauvegarde, la relecture et la suppression avec confirmation ;
- [x] la structuration en mode `demo` avec l'API disponible ;
- [x] la conservation du brouillon avec l'API arretee ;
- [x] les exports JSON et Markdown ;
- [x] l'absence d'erreur dans la page de gestion de l'extension.

RF-012 est terminee : le parcours a ete valide dans Chrome et Edge le 9 septembre 2026.
