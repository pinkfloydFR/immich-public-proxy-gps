# Immich Public Proxy — GPS Fork

> 🗺️ Fork of [immich-public-proxy](https://github.com/alangrainger/immich-public-proxy) with **GPS coordinates display** and **interactive map** (Leaflet + OpenStreetMap).

Share your Immich photos and albums in a safe way without exposing your Immich instance to the public — now with photo location display!

## 🗺️ GPS & Map Features

This fork adds the following features on top of the original immich-public-proxy:

- **📍 GPS coordinates in lightbox** — When viewing a photo in the lightbox, clickable GPS coordinates are shown below the image (links to Google Maps search).
- **🗺️ Interactive map** — An interactive OpenStreetMap map is displayed below the gallery, showing markers for all geolocated photos.
- **🖼️ Photo thumbnails in map popups** — Click on a map marker to see the photo thumbnail.
- **🆓 No API key required** — Uses [Leaflet](https://leafletjs.com/) + [OpenStreetMap](https://www.openstreetmap.org/) (100% free, no usage limits, no tracking).
- **🔒 Privacy-first** — GPS display is disabled by default (`ipp.showMetadata.location: false`). You must explicitly opt-in.
- **⚡ Lightweight** — Leaflet CSS+JS is only loaded when the map is actually needed (~40KB).

## 🐳 Build & Deploy with Docker Compose

Since this is a fork, there is no pre-built Docker image on Docker Hub. You need to **build it yourself**.

### Quick start

1. **Clone this repository:**

```bash
git clone https://github.com/pinkfloydFR/immich-public-proxy-gps.git
cd immich-public-proxy-gps
```

2. **Create your `docker-compose.yml`:**

```yaml
services:
  immich-public-proxy:
    build: .
    container_name: immich-public-proxy-gps
    restart: always
    ports:
      - "3000:3000"
    environment:
      IMMICH_URL: http://your-immich-server:2283
      PUBLIC_BASE_URL: https://your-proxy-url.com
    volumes:
      - ./config.json:/app/config.json:ro
    healthcheck:
      test: curl -s http://localhost:3000/share/healthcheck -o /dev/null || exit 1
      start_period: 10s
      timeout: 5s
```

> **Note:** Use `build: .` instead of `image:` since we're building from source.

3. **Create your `config.json`** (in the same directory):

```json
{
  "ipp": {
    "showMetadata": {
      "description": false,
      "location": true
    },
    "showGalleryTitle": true,
    "showHomePage": true,
    "downloadOriginalPhoto": true,
    "allowDownloadAll": 1,
    "singleImageGallery": false,
    "singleItemAutoOpen": true
  },
  "lightGallery": {
    "controls": true,
    "download": true,
    "customSlideName": true,
    "mobileSettings": {
      "controls": false,
      "showCloseIcon": true,
      "download": true
    }
  }
}
```

4. **Build and start:**

```bash
docker compose up -d --build
```

5. **Verify it's running:**

```bash
curl http://localhost:3000/share/healthcheck
# Should return: ok
```

### Rebuild after updates

```bash
git pull
docker compose up -d --build
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `IMMICH_URL` | ✅ | Internal URL of your Immich instance (e.g. `http://immich:2283`). **Not** a public URL. |
| `PUBLIC_BASE_URL` | Optional | Public URL for the proxy (e.g. `https://photos.example.com`). Used for `og:image` meta tags. If omitted, it will be auto-detected from the request. |
| `IPP_PORT` | Optional | Internal port (default: `3000`). |

## Configuration

### GPS / Location options

| Option | Type | Default | Description |
|---|---|---|---|
| `ipp.showMetadata.location` | `bool` | `false` | Enable GPS coordinates display and interactive map. |
| `ipp.showMetadata.description` | `bool` | `false` | Show the photo description as a caption in the lightbox. |

When `location` is `true`:
- **In the lightbox**: A clickable `📍 lat, lng` link appears below each photo (opens Google Maps in a new tab).
- **Below the gallery**: An interactive Leaflet/OpenStreetMap map shows all geolocated photos with markers. Click a marker to see the photo thumbnail.

### All IPP options

| Option | Type | Description |
|---|---|---|
| `responseHeaders` | `object` | Change the headers sent with your web responses. |
| `singleImageGallery` | `bool` | Show a gallery page for single image links (default: directly opens the image). |
| `downloadOriginalPhoto` | `bool` | Set to `false` to only allow preview-quality downloads. |
| `downloadedFilename` | `int` | `0` = original filename, `1` = Immich asset ID, `2` = sanitised ID. |
| `showGalleryTitle` | `bool` | Show album title on the gallery page. |
| `showGalleryDescription` | `bool` | Show album description below the title. |
| `allowDownloadAll` | `int` | `0` = disabled, `1` = follow Immich setting, `2` = always enabled. |
| `allowSlugLinks` | `bool` | Enable/disable custom URL slug links. |
| `showHomePage` | `bool` | Show the IPP shield page at `/` and `/share`. |
| `showMetadata` | `object` | See GPS/Location options above. |
| `customInvalidResponse` | various | Custom 404 response — see upstream docs. |

### lightGallery

The gallery is created using [lightGallery](https://github.com/sachinchoolur/lightGallery). See all settings: https://www.lightgalleryjs.com/docs/settings/

## How to use it

1. Set the **External domain** in your Immich **Server Settings** to your proxy's public URL.
2. Share photos/albums normally through Immich — the links will automatically use your proxy URL.
3. That's it! All sharing is managed through Immich.

## How it works

When the proxy receives a shared link request, it:
1. Validates the share key format.
2. Makes an API call to your Immich instance over the local network.
3. Fetches the shared assets and returns them as a gallery (with GPS data if enabled).
4. Expired or trashed assets are automatically excluded.

All incoming data is validated and sanitised. Anything unexpected returns a 404.

## Credits

- Original project: [immich-public-proxy](https://github.com/alangrainger/immich-public-proxy) by [Alan Grainger](https://github.com/alangrainger)
- Map: [Leaflet](https://leafletjs.com/) + [OpenStreetMap](https://www.openstreetmap.org/)
- Gallery: [lightGallery](https://github.com/sachinchoolur/lightGallery)
- Photo management: [Immich](https://github.com/immich-app/immich)

## License

AGPL-3.0 — Same as the original project.

