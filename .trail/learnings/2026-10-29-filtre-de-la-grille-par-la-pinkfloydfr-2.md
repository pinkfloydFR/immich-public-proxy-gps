---
title: "Filtre de la grille par la carte : ne réagir qu'aux mouvements faits par le visiteur"
author: PinkfloydFR
date: 2026-10-29
branch: carte-a-droite
cost: { minutes: 1, tokens: 8282 }
id: l-12d14519
scope: repo
status: active
replaces: l-a17f3856
src: agent
touches:
  - app/src/client/location-map.ts
  - app/src/client/layout.ts
---

## Decided
- La grille n'affiche que les photos dont le pin est visible sur la carte (`state.mapFilter`, appliqué dans `app/src/client/layout.ts#applyMapFilter`, recalcul forcé par `virtualisation.ts#relayout`). Le filtre ne s'active qu'après un mouvement fait par le visiteur, détecté par des événements DOM (mousedown/touchstart/wheel/dblclick/keydown) sur `#map`, parce que Leaflet émet les mêmes `movestart`/`zoomstart` pour ses propres `fitBounds`/`setView`. Sinon, le recadrage automatique au chargement filtrerait la grille.
- Le lightbox et « Select all » portent toujours sur toutes les photos du partage, parce que les filtrer obligerait à remapper les index de PhotoSwipe et de la sélection, qui sont des index dans `state.items`.

## Tried and ruled out
- Ignorer tout `moveend` pendant 1 s après le `panTo` du survol : un zoom fait juste après avoir quitté la grille tombait dans cette fenêtre et ne filtrait pas.

## Watch out
- Le `panTo` du centrage au survol déclenche un `moveend`. Seul celui-là est ignoré, grâce au drapeau `hoverPanning` dans `location-map.ts` : Leaflet émet `moveend` même quand `panTo` ne bouge pas, donc le drapeau est toujours consommé. Sans ça, la grille se re-filtrerait sous le pointeur.
- Une fois que le visiteur a bougé la carte, les pins qui arrivent plus tard ne recadrent plus la carte, sinon la vue choisie serait écrasée. Ils relancent seulement le filtre, avec un délai de 300 ms.
