# config.json explained

This file documents the runtime options used by Immich Public Proxy GPS.

The application itself must read strict JSON from `/app/config.json`, so comments cannot be embedded directly in the JSON file. Use this document as the human-readable reference next to your active `config.json`.

## Recommended placement

If your `docker-compose.yml` mounts:

```yaml
volumes:
  - ./config.json:/app/config.json
```

then the active file is the `config.json` at the repository root.

## Example structure

```json
{
  "ipp": {
    "responseHeaders": {
      "Cache-Control": "public, max-age=2592000",
      "Access-Control-Allow-Origin": "*"
    },
    "maxDownloadQuality": "original",
    "maxZoomQuality": "fullsize",
    "downloadedFilename": 0,
    "allowDownload": 1,
    "downloadFromImmichConcurrencyLimit": 10,
    "allowSlugLinks": true,
    "showHomePage": true,
    "showMetadata": {
      "description": {
        "caption": false,
        "sidebar": true
      },
      "exif": {
        "dateTimeOriginal": true,
        "timeZone": true,
        "fileName": true,
        "dimensions": true,
        "fileSize": true,
        "make": true,
        "model": true,
        "lensModel": true,
        "exposureTime": true,
        "iso": true,
        "fNumber": true,
        "focalLength": true
      },
      "location": {
        "city": true,
        "state": true,
        "country": true,
        "gps": true,
        "webLink": true
      }
    },
    "customInvalidResponse": false,
    "gallery": {
      "singleImage": false,
      "singleVideo": true,
      "singleItemAutoOpen": true,
      "showTitle": true,
      "showDescription": false,
      "showExpiryDate": false,
      "expiryDateFormat": "YYYY-MM-DD",
      "expiryDateLocale": "",
      "groupByDate": "month",
      "showDownloadZip": true,
      "cacheTime": 300
    },
    "lightbox": {
      "showArrows": true,
      "showDownload": true,
      "mobileArrows": false,
      "autoPlayVideos": false,
      "options": {}
    }
  }
}
```

## Option reference

### `ipp.responseHeaders`

Extra HTTP headers added to responses.

- `Cache-Control`: controls browser/proxy caching.
- `Access-Control-Allow-Origin`: controls CORS access.

Recommended default:

- Keep `Cache-Control` enabled for public shares.
- Keep `Access-Control-Allow-Origin: "*"` only if cross-origin embedding is acceptable for your use case.

### `ipp.maxDownloadQuality`

Maximum quality allowed for downloaded images.

Allowed values:

- `"preview"`
- `"fullsize"`
- `"original"`

Recommended:

- `"original"` if you want Immich's own share permissions to decide access.
- `"preview"` if you want to reduce data exposure.

### `ipp.maxZoomQuality`

Maximum quality used when the visitor zooms inside the lightbox.

Allowed values:

- `"preview"`
- `"fullsize"`

Recommended:

- `"fullsize"` for photo viewing.
- `"preview"` for lower bandwidth and lower detail exposure.

### `ipp.downloadedFilename`

Controls the filename used when downloading assets.

Values:

- `0`: original filename when available
- `1`: Immich asset ID
- `2`: shortened generated ID

Recommended:

- `0` for human-friendly downloads.

### `ipp.allowDownload`

Controls whether downloads are allowed.

Values:

- `0`: disabled
- `1`: follow the Immich share setting
- `2`: always allow

Recommended:

- `1` for best alignment with Immich permissions.

### `ipp.downloadFromImmichConcurrencyLimit`

Maximum number of parallel fetches when building a zip download.

Recommended:

- `10` for a balanced load.
- Lower it if your server or storage is slow.
- Raise it only if you know your backend can absorb the extra parallelism.

### `ipp.allowSlugLinks`

Enables custom share slugs.

Recommended:

- `true` unless you explicitly want to restrict share URL styles.

### `ipp.showHomePage`

Controls whether the home page at `/` and `/share` is shown.

Recommended:

- `true` for normal public use.
- `false` if you want to minimize the exposed surface.

## Metadata

### `ipp.showMetadata.description`

Controls where asset descriptions appear.

- `caption`: show under the item in the lightbox
- `sidebar`: show in the info sidebar

Recommended:

- `caption: false`
- `sidebar: true`

This keeps the image area clean while still exposing useful context.

### `ipp.showMetadata.exif`

Per-field EXIF display toggles.

Fields:

- `dateTimeOriginal`
- `timeZone`
- `fileName`
- `dimensions`
- `fileSize`
- `make`
- `model`
- `lensModel`
- `exposureTime`
- `iso`
- `fNumber`
- `focalLength`

Recommended:

- Enable all of them for a photo-oriented public gallery.
- Disable camera/lens/exposure details if you want a lighter, less technical presentation.

### `ipp.showMetadata.location`

Per-field location display toggles.

Fields:

- `city`
- `state`
- `country`
- `gps`
- `webLink`

Recommended:

- `gps: true` to show coordinates
- `webLink: true` to expose the OpenStreetMap link
- `city/state/country: true` only if you are comfortable exposing approximate or exact place information

When `gps` is enabled, the gallery also renders the interactive map below the grid for geotagged assets. On album shares using lazy metadata loading, markers appear progressively as each asset's detail is fetched.

Privacy note:

- `gps: true` can reveal precise shooting coordinates.
- If that is too sensitive, keep `gps: false` and possibly keep only `city/state/country`.

Legacy note:

Older versions of the GPS fork used:

```json
{
  "ipp": {
    "showMetadata": {
      "location": true
    }
  }
}
```

The upgraded code still migrates that legacy boolean automatically, but the modern explicit format is preferred.

## Invalid responses

### `ipp.customInvalidResponse`

Allows replacing the default behavior for invalid share requests.

Recommended:

- `false` unless you want custom redirects, status codes, or error pages.

## Gallery

### `ipp.gallery.singleImage`

If `false`, single images can be served directly instead of forcing a gallery page.

Recommended:

- `false` for direct image sharing.
- `true` if you want every share to open in the gallery UI.

### `ipp.gallery.singleVideo`

Controls whether a single video still opens in the gallery experience.

Recommended:

- `true`.

### `ipp.gallery.singleItemAutoOpen`

Automatically opens the lightbox when the share contains only one item.

Recommended:

- `true`.

### `ipp.gallery.showTitle`

Displays the share or album title above the gallery.

Recommended:

- `true`.

### `ipp.gallery.showDescription`

Displays the album description above the gallery page.

Recommended:

- `false` in most cases, especially if descriptions are already visible in the sidebar.

### `ipp.gallery.showExpiryDate`

Shows the share expiry date in the header if the share expires.

Recommended:

- `false` unless this information matters to your audience.

### `ipp.gallery.expiryDateFormat`

Controls the header format when expiry display is enabled.

Recommended:

- `"YYYY-MM-DD"` for a simple unambiguous format.

### `ipp.gallery.expiryDateLocale`

Locale override for expiry formatting.

Recommended:

- Empty string to use the default behavior unless you need a forced locale.

### `ipp.gallery.groupByDate`

Controls grouping inside larger galleries.

Allowed values:

- `false`
- `"month"`
- `"day"`

Recommended:

- `"month"` for large chronological galleries.
- `"day"` only if you want finer granularity.
- `false` for a simpler flat layout.

### `ipp.gallery.showDownloadZip`

Enables the download-all action when downloads are allowed.

Recommended:

- `true` unless you want to avoid zip generation entirely.

### `ipp.gallery.cacheTime`

HTML page cache time in seconds.

Recommended:

- `300` as a reasonable default.

## Lightbox

### `ipp.lightbox.showArrows`

Shows next/previous arrows on desktop.

Recommended:

- `true`.

### `ipp.lightbox.showDownload`

Shows the per-item download button in the lightbox when downloads are allowed.

Recommended:

- `true`.

### `ipp.lightbox.mobileArrows`

Shows arrows on mobile.

Recommended:

- `false` because swipe is usually enough.

### `ipp.lightbox.autoPlayVideos`

Automatically plays videos when opened.

Recommended:

- `false` for a less intrusive experience.

### `ipp.lightbox.options`

Advanced raw options forwarded to the lightbox engine.

Recommended:

- Keep `{}` unless you need a specific advanced PhotoSwipe override.

## Recommended profiles

### Balanced public sharing

- Good metadata visibility
- GPS enabled
- Download permission follows Immich
- Group by month

### Privacy-first sharing

Suggested changes:

- Set `allowDownload` to `0` or `1`
- Set `maxZoomQuality` to `preview`
- Disable `gps`
- Disable `city`, `state`, `country`
- Possibly disable camera and lens details

### Photographer-focused sharing

Suggested changes:

- Enable all EXIF fields
- Enable all location fields
- Set `maxZoomQuality` to `fullsize`
- Keep `allowDownload` at `1`

## Workflow

After changing the active `config.json`:

1. Rebuild the image if your deployment bakes in any local source changes:

```bash
./rebuild-image.sh
```

2. Restart the container stack so the mounted config is re-read.

If you only changed the mounted config file and not the image contents, a container restart is usually enough.
