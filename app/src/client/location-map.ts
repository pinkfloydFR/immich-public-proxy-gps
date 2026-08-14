import type { GalleryItem } from '../shared/types.js'
import { state } from './state.js'
import { openLightbox } from './lightbox.js'
import { applyMeta, fetchDetail } from './metadata.js'

declare global {
  interface Window {
    L?: any
  }
}

type LeafletMap = any
type LeafletBounds = any

const LEAFLET_CSS_HREF = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const LEAFLET_CSS_INTEGRITY = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
const LEAFLET_JS_SRC = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
const LEAFLET_JS_INTEGRITY = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
const DETAIL_CONCURRENCY = 6

let leafletPromise: Promise<any> | null = null

export function initLocationMap (): void {
  if (!state.metadataConfig.showLocationMap) return

  const mapContainer = document.getElementById('map-container')
  const mapEl = document.getElementById('map')
  if (!(mapContainer instanceof HTMLElement) || !(mapEl instanceof HTMLElement)) return

  void loadLeaflet().then((L) => {
    const map = L.map(mapEl)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map)

    const seen = new Set<string>()
    let bounds: LeafletBounds | null = null
    let markerCount = 0

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
      markerCount += 1
      mapContainer.hidden = false

      if (!bounds) {
        bounds = L.latLngBounds([lat, lng], [lat, lng])
        map.setView([lat, lng], 14)
      } else {
        bounds.extend([lat, lng])
        map.fitBounds(bounds.pad(0.1))
      }

      if (markerCount === 1) {
        requestAnimationFrame(() => map.invalidateSize())
      }
    }

    state.items.forEach((item, index) => addMarker(item, index))
    if (state.metaBase) void loadLazyDetails(addMarker)
  }).catch(() => {})
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

function loadLeaflet (): Promise<any> {
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