---
title: "Carte à droite : colonne sticky, pas de colonnes à défilement indépendant, car la virtualisation suit le scroll de la fenêtre"
author: PinkfloydFR
date: 2026-10-29
branch: carte-a-droite
cost: { minutes: 5, tokens: 33127 }
id: l-2fdf3682
scope: repo
status: active
src: agent
touches:
  - app/public/style.css
  - app/src/client/location-map.ts
  - app/src/view/gallery.tsx
  - app/src/client/virtualisation.ts
---

## Decided
- La mise en page « photos à gauche, carte à droite » (`#gallery-layout` dans `app/src/view/gallery.tsx`, CSS dans `app/public/style.css`) garde le défilement de toute la page et rend la carte `position: sticky` au-dessus de 900px.
- Raison : `app/src/client/virtualisation.ts` calcule les tuiles visibles à partir de `window.scrollY`/`window.innerHeight`, et la largeur de la grille à partir de `#gallery.clientWidth` (via le ResizeObserver de `init.ts`). Des colonnes à défilement indépendant comme dans AREP (`overflow: auto`) casseraient la virtualisation, sauf à la réécrire.

## Watch out
- Leaflet doit recevoir `invalidateSize()` à chaque changement de taille de la colonne de la carte, sinon les tuiles s'affichent mal. Un ResizeObserver sur `#map` s'en charge dans `location-map.ts`.
- `#map-container` a `display: flex` sur grand écran, donc une règle `[hidden] { display: none }` explicite est nécessaire pour qu'il reste masqué tant qu'aucune photo n'a de coordonnées GPS.
- Redéployer avec `docker compose ... up -d --build immich-public-proxy` sans `--no-deps` redémarre aussi `immich_server` ; le proxy renvoie alors 503 tant qu'Immich n'est pas revenu.
