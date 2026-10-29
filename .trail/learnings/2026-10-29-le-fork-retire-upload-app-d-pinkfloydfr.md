---
title: "Le fork retire upload-app d'upstream et garde ci.yaml ; recette pour les merges upstream"
author: PinkfloydFR
date: 2026-10-29
branch: merge-upstream-v4.1.2
cost: { minutes: 9, tokens: 87677 }
id: l-cd80693c
scope: repo
status: active
src: agent
touches:
  - docker-compose.yml
  - package.json
  - package-lock.json
  - app/src/share.ts
  - app/tests/uploadLink.test.ts
  - ".github/workflows/ci.yaml"
  - app/config.json
---

## Decided
- Upstream v4 a ajouté un service d'upload visiteur (workspace `upload-app/`, `Dockerfile.upload`, service commenté dans `docker-compose.yml`). Le fork ne veut pas d'upload : à chaque merge upstream, supprimer `upload-app/` et `Dockerfile.upload`, retirer `upload-app` des `workspaces`/scripts du `package.json` racine, de la ligne `COPY upload-app/package.json` du `Dockerfile` et de `.dockerignore`, puis régénérer `package-lock.json` (`npm install` à la racine).
- Le bouton « Add photos » est coupé à un seul endroit : `FORK_UPLOADS_DISABLED` dans `app/src/share.ts#uploadBase`, testé par `app/tests/uploadLink.test.ts` (réécrit pour vérifier que c'est toujours désactivé). Le reste du code de lien d'upload dans app/ est gardé tel quel pour limiter les conflits de merge.
- `.github/workflows/ci.yaml` reste la version du fork et `.github/workflows/docs.yaml` est retiré : le token de push n'a pas le scope `workflow`.
- Le `npm test` racine ne lance plus la suite `docs/` (configSchema compare `app/config.json` aux valeurs par défaut de la doc upstream et lit `upload-app/config.json`).

## Watch out
- Upstream a supprimé `app/src/config/migrations.ts` en v4 : l'ancien shim booléen `showMetadata.location: true` du fork a disparu avec. Le `config.json` déployé utilise déjà la forme objet.
- Lors des merges, `app/config.json` est en conflit (le fork active les métadonnées/le GPS) : partir de la version upstream et y superposer les valeurs du fork.
