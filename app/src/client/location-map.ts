import type { GalleryItem } from '../shared/types.js'
import { state } from './state.js'
import { openLightbox } from './lightbox.js'
import { applyMeta, fetchDetail } from './metadata.js'
import { relayout } from './virtualisation.js'

declare global {
  interface Window {
    L?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

type LeafletBounds = any // eslint-disable-line @typescript-eslint/no-explicit-any

const LEAFLET_CSS_HREF = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const LEAFLET_CSS_INTEGRITY = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
const LEAFLET_JS_SRC = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
const LEAFLET_JS_INTEGRITY = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
const DETAIL_CONCURRENCY = 6

let leafletPromise: Promise<any> | null = null // eslint-disable-line @typescript-eslint/no-explicit-any

export function initLocationMap (): void {
  if (!state.metadataConfig.showLocationMap) return

  const mapContainer = document.getElementById('map-container')
  const mapEl = document.getElementById('map')
  if (!(mapContainer instanceof HTMLElement) || !(mapEl instanceof HTMLElement)) return

  loadLeaflet().then((L) => {
    const map = L.map(mapEl)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map)

    const seen = new Set<string>()
    const markers = new Map<number, any>() // eslint-disable-line @typescript-eslint/no-explicit-any
    let bounds: LeafletBounds | null = null
    let markerCount = 0
    // Set once the visitor drags, zooms or scrolls the map. From then on the
    // map no longer re-fits itself as lazy markers arrive, and the grid only
    // shows the photos whose pin is in view.
    let userMoved = false
    let hoverPanning = false
    const filter = setupMapFilter(L, map, mapContainer, markers, () => {
      userMoved = false
      if (bounds) map.fitBounds(bounds.pad(0.1))
    })
    for (const type of ['mousedown', 'touchstart', 'wheel', 'dblclick', 'keydown']) {
      mapEl.addEventListener(type, (e) => {
        // The "show all" button is inside the map but isn't a map move
        if ((e.target as HTMLElement).closest('.ipp-map-filter')) return
        userMoved = true
        hoverPanning = false
      }, { passive: true })
    }
    // Centring on a hovered photo's pin must not refilter the grid under the
    // pointer. Leaflet fires moveend even when panTo doesn't move, so the flag
    // is always consumed; a real map interaction clears it too.
    map.on('moveend', () => {
      if (hoverPanning) {
        hoverPanning = false
        return
      }
      if (userMoved) filter.apply()
    })
    highlightMarkerOnTileHover(markers, (marker) => {
      hoverPanning = true
      map.panTo(marker.getLatLng())
    })

    // The map column changes size when it first appears and when the window
    // resizes; Leaflet only redraws its tiles after invalidateSize()
    new ResizeObserver(() => map.invalidateSize()).observe(mapEl)

    const addMarker = (item: GalleryItem, index: number): void => {
      const lat = item.exif?.latitude
      const lng = item.exif?.longitude
      if (lat == null || lng == null || seen.has(item.id)) return

      const marker = L.marker([lat, lng]).addTo(map)
      if (item.thumbnailUrl) {
        const img = document.createElement('img')
        img.src = item.thumbnailUrl
        img.className = 'ipp-map-thumb'
        img.alt = item.description || 'Photo preview'
        img.title = 'Open in gallery'
        img.addEventListener('click', () => {
          marker.closePopup()
          openLightbox(index)
        })
        marker.bindPopup(img)
      }

      seen.add(item.id)
      markers.set(index, marker)
      markerCount += 1
      mapContainer.hidden = false

      if (!bounds) {
        bounds = L.latLngBounds([lat, lng], [lat, lng])
        map.setView([lat, lng], 14)
      } else {
        bounds.extend([lat, lng])
        if (!userMoved) map.fitBounds(bounds.pad(0.1))
      }
      // A pin that arrives (lazy album metadata) while the grid is filtered
      if (userMoved) filter.scheduleApply()

      if (markerCount === 1) {
        requestAnimationFrame(() => map.invalidateSize())
      }
    }

    state.items.forEach((item, index) => addMarker(item, index))
    if (state.metaBase) loadLazyDetails(addMarker)
  }).catch(() => {})
}

/**
 * Fork: filter the grid to the photos whose pin is inside the map's visible
 * area. A control on the map shows how many photos are listed and a button
 * to show them all again (which also re-fits the map to every pin).
 */
function setupMapFilter (
  L: any, map: any, mapContainer: HTMLElement, markers: Map<number, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  onReset: () => void
): { apply: (fromVisitor?: boolean) => void, scheduleApply: () => void } {
  const box = document.createElement('div')
  box.className = 'ipp-map-filter leaflet-bar'
  box.hidden = true
  const label = document.createElement('span')
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = 'Show all'
  box.append(label, button)
  L.DomEvent.disableClickPropagation(box)
  L.DomEvent.disableScrollPropagation(box)
  const Control = L.Control.extend({ onAdd: () => box })
  new Control({ position: 'topright' }).addTo(map)

  // `fromVisitor`: the visitor moved the map or pressed "Show all", so the
  // grid's new content is shown from its start. Otherwise (a lazy album pin
  // arriving while the visitor scrolls) the scroll position is left anchored
  // on the photo in view, or the page would jump under the visitor.
  const setFilter = (next: Set<number> | null, fromVisitor: boolean): void => {
    const before = state.mapFilter
    state.mapFilter = next
    box.hidden = !next
    if (next) label.textContent = next.size + ' of ' + state.items.length + ' photos'
    if (sameSet(before, next)) return
    relayout()
    // Side by side, the map is sticky: bring the top of the (now shorter)
    // grid into view. Stacked on a phone, the visitor is at the map; leave it.
    if (fromVisitor && state.container && getComputedStyle(mapContainer).position === 'sticky') {
      const top = state.container.getBoundingClientRect().top
      if (top < 0) window.scrollTo({ top: window.scrollY + top - 16, behavior: 'instant' })
    }
  }

  const apply = (fromVisitor = true): void => {
    const view = map.getBounds()
    const inView = new Set<number>()
    for (const [index, marker] of markers) {
      if (view.contains(marker.getLatLng())) inView.add(index)
    }
    setFilter(inView, fromVisitor)
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  const scheduleApply = (): void => {
    clearTimeout(timer)
    timer = setTimeout(() => apply(false), 300)
  }

  button.addEventListener('click', () => {
    clearTimeout(timer)
    setFilter(null, true)
    onReset()
  })

  return { apply, scheduleApply }
}

function sameSet (a: Set<number> | null, b: Set<number> | null): boolean {
  if (a === b) return true
  if (!a || !b || a.size !== b.size) return false
  for (const v of a) if (!b.has(v)) return false
  return true
}

/**
 * Highlight the marker of the grid tile under the pointer and centre the map
 * on it (after a short pause, so sweeping across the grid doesn't make the
 * map chase every tile). Tiles are virtualised, so this listens on the grid
 * container and reads the tile's `data-index`.
 */
function highlightMarkerOnTileHover (markers: Map<number, any>, centreOn: (marker: any) => void): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  const gallery = state.container
  if (!gallery) return
  let active: number | undefined
  let timer: ReturnType<typeof setTimeout> | undefined

  const setActive = (index: number | undefined): void => {
    if (index === active) return
    markers.get(active as number)?.getElement()?.classList.remove('ipp-marker-active')
    active = index
    const marker = markers.get(index as number)
    marker?.getElement()?.classList.add('ipp-marker-active')
    clearTimeout(timer)
    if (marker) timer = setTimeout(() => centreOn(marker), 150)
  }

  gallery.addEventListener('mouseover', (e) => {
    const tile = (e.target as HTMLElement).closest<HTMLElement>('a[data-index]')
    setActive(tile ? Number(tile.dataset.index) : undefined)
  })
  gallery.addEventListener('mouseleave', () => setActive(undefined))
}

async function loadLazyDetails (addMarker: (item: GalleryItem, index: number) => void): Promise<void> {
  const pending = state.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.needsDetail)

  let cursor = 0
  const workers = Array.from({ length: Math.min(DETAIL_CONCURRENCY, pending.length) }, async () => {
    while (true) {
      const current = pending[cursor++]
      if (!current) return
      const meta = await fetchDetail(current.item.id)
      if (!meta) continue
      applyMeta(current.item, meta)
      addMarker(current.item, current.index)
    }
  })

  await Promise.all(workers)
}

function loadLeaflet (): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (window.L) return Promise.resolve(window.L)
  if (leafletPromise) return leafletPromise

  ensureLeafletCss()
  leafletPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-ipp-leaflet="1"]') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(window.L), { once: true })
      existing.addEventListener('error', () => reject(new Error('Leaflet failed to load')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = LEAFLET_JS_SRC
    script.integrity = LEAFLET_JS_INTEGRITY
    script.crossOrigin = ''
    script.dataset.ippLeaflet = '1'
    script.addEventListener('load', () => resolve(window.L), { once: true })
    script.addEventListener('error', () => reject(new Error('Leaflet failed to load')), { once: true })
    document.head.appendChild(script)
  })

  return leafletPromise
}

function ensureLeafletCss (): void {
  const existing = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .find((link) => (link as HTMLLinkElement).href === LEAFLET_CSS_HREF)
  if (existing) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = LEAFLET_CSS_HREF
  link.integrity = LEAFLET_CSS_INTEGRITY
  link.crossOrigin = ''
  document.head.appendChild(link)
}
