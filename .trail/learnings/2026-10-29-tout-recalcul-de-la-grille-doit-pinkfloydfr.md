---
title: "Tout recalcul de la grille doit garder la photo en haut de l'écran, sinon la page saute"
author: PinkfloydFR
date: 2026-10-29
branch: carte-a-droite
cost: { minutes: 2, tokens: 12206 }
id: l-fbb425db
scope: repo
status: active
src: agent
touches:
  - app/src/client/location-map.ts
  - app/src/client/virtualisation.ts
---

## Decided
- `computeLayoutAndRender` (`app/src/client/virtualisation.ts`) mémorise la tuile en haut de l'écran avant chaque recalcul (`captureScrollAnchor`), puis fait défiler la page pour la remettre au même endroit (`restoreScrollAnchor`). Raison : la grille est recalculée pendant que le visiteur défile (la carte apparaît et réduit la colonne, le filtre change quand des pins d'album arrivent), et sans ancrage la page sautait vers le haut ou vers le bas.
- Dans `location-map.ts#setFilter`, seul un geste du visiteur (zoom/déplacement de la carte, « Show all ») ramène en haut de la grille (`fromVisitor`). Un pin chargé à la demande ne le fait pas, sinon la page remontait toute seule pendant le défilement.

## Watch out
- La molette au-dessus de la carte zoome la carte (Leaflet `scrollWheelZoom`) au lieu de faire défiler la page, ce qui active le filtre et ramène en haut de la grille.
