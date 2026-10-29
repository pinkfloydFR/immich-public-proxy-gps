---
title: "Filtre de la grille par la carte : ne réagir qu'aux mouvements faits par le visiteur"
author: PinkfloydFR
date: 2026-10-29
branch: carte-a-droite
cost: { minutes: 1, tokens: 1852 }
id: l-a17f3856
scope: repo
status: active
src: agent
touches:
  - app/src/client/layout.ts
---

## Decided
- La grille n'affiche que les photos dont le pin est visible sur la carte (`state.mapFilter`, appliqué dans `app/src/client/layout.ts#applyMapFilter`, recalcul forcé par `virtualisation.ts#relayout`). Le filtre ne s'active qu'après un mouvement fait par le visiteur, détecté par des événements DOM (mousedown/touchstart/wheel/dblclick/keydown) sur `#map`, parce que Leaflet émet les mêmes `movestart`/`zoomstart` pour ses propres `fitBounds`/`setView`. Sinon, le recadrage automatique au chargement filtrerait la grille et masquerait les photos sans GPS.
- Le lightbox et « Select all » portent toujours sur toutes les photos du partage, parce que les filtrer obligerait à remapper les index de PhotoSwipe et de la sélection, qui sont des index dans `state.items`.

## Watch out
- Le centrage de la carte au survol d'une photo (`panTo`) déclenche un `moveend`. Il est ignoré pendant 1 s (`hoverPanUntil` dans `location-map.ts`), sinon la grille se re-filtrerait sous le pointeur et la photo survolée pourrait disparaître.
- Une fois que le visiteur a bougé la carte, les pins qui arrivent plus tard (métadonnées chargées à la demande sur un album) ne recadrent plus la carte, sinon la vue choisie par le visiteur serait écrasée. Ils relancent seulement le filtre, avec un délai de 300 ms.
