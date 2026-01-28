# Maintenance

Guide for updating neighborhood boundaries and troubleshooting common issues.

## Updating GeoJSON Boundaries

### Overview

The neighborhood GeoJSON boundaries file is hosted in Wix Media Manager as `neighborhoods.geojson.json` (Wix supports `.json` but not `.geojson` extensions). To update, replace the file in Wix Media Manager with the same filename. The map updates automatically; no code changes needed. Just ensure the file follows the [GeoJSON specification](https://geojson.org/).

**Current URL:** Configured in `src/assets/js/modules/map.js`

```javascript
export async function fetchNeighborhoodGeojson() {
  const response = await fetch('https://d4ab3c8b-a6bd-41c2-be01-9df7d7d13631.usrfiles.com/ugd/d4ab3c_2ee50ed343dc4840ad74e76c82c08883.json');
  const neighborhoodData = await response.json();
  return neighborhoodData;
}
```

### GeoJSON Structure

**Required format:**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [-82.51234, 27.58123],
            [-82.51456, 27.58234],
            [-82.51234, 27.58123]
          ]
        ]
      },
      "properties": {
        "neighborhood": "Silverleaf"
      }
    }
  ]
}
```

**Required properties:**

- `neighborhood` - Must match `villageName` in Wix Neighborhoods collection (case-sensitive)

**Auto-added properties** (don't add manually):

- `amenities`, `new_construction`, `has_resale_homes`, `house_count` - Added from Wix data

## Troubleshooting

### Map Issues

**Map not loading:**

Check Mapbox token in `config.js`:

```javascript
window.config = {
  mapboxAccessToken: 'pk.xxxxx'  // Must start with 'pk.'
};
```

Test token:

```bash
curl "https://api.mapbox.com/v4/mapbox.mapbox-streets-v8.json?access_token=YOUR_TOKEN"
```

Check URL restrictions:

- [Mapbox Account](https://account.mapbox.com/) → Tokens
- Add: `https://your-domain.com/*` and `http://localhost:*`

**Neighborhoods not appearing:**

1. Check GeoJSON loads: Browser console → Network tab → Look for GeoJSON request
2. Verify URL in `map.js` is accessible
3. Validate GeoJSON at [GeoJSONLint](https://geojsonlint.com/)
4. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

**Polygons render incorrectly:**

- Wrong coordinate order (should be [long, lat])
- Self-intersecting polygon
- Polygon not closed

### Wix Data Issues


**Wix data not loading:**

Check client ID in `config.js`:

```javascript
window.config = {
  wixClientId: 'YOUR_WIX_CLIENT_ID'
};
```

Verify collections exist:

- Wix Dashboard → Database Collections
- Check: `Neighborhoods`, `HousesforSale`, `FloorPlans`

**Missing data for neighborhood:**

Check name matching:

```javascript
// In browser console
const geojsonName = 'Silverleaf';
const wixName = 'Silverleaf';  // Must match exactly
console.log(geojsonName === wixName);
```

Add mapping if names differ (in `map.js`):

```javascript
const NEIGHBORHOOD_NAME_MAPPING = {
  'Oakfield': 'Oakfield Lakes',
  'Del Webb BayView': 'Del Webb at Bayview'
};
```

**Expected Wix fields:**

**Neighborhoods:**

- `villageName` (text)
- `amenitiesTags` (array)

**HousesforSale:**

- `village` (text)
- `listingPrice` / `listingPricePure` (text/number)
- `bedrooms`, `bathrooms`, `homeType`

**FloorPlans:**

- `villages` (array of neighborhood names)

### Filter Issues

**Filters not working:**

Check filter state in console:

```javascript
import { getFilterState } from './modules/state.js';
console.log(getFilterState());
```

Hard refresh browser:

- Windows: Ctrl + Shift + R
- Mac: Cmd + Shift + R

**Search not working:**

- Search is debounced 300ms - wait after typing
- Check input element: `document.querySelector('#search-input')`

### Details Panel Issues

**Panel not opening:**

Check click handler attached:

```javascript
// In console
map.on('click', 'neighborhood-fills', (e) => {
  console.log('Clicked:', e.features[0].properties.neighborhood);
});
```

Verify panel element exists:

```javascript
document.querySelector('.details-panel');  // Should return element
```

**Panel shows no data:**

Check data filtering:

```javascript
import { getHousesForSale } from './modules/state.js';
const neighborhoodName = 'Silverleaf';
const houses = getHousesForSale().filter(h =>
  h.village.toLowerCase() === neighborhoodName.toLowerCase()
);
console.log('Houses:', houses);
```

If empty, name mismatch between GeoJSON and Wix.

### Build & Deployment Issues

**Build fails:**

```bash
npm install  # Reinstall dependencies
npm run build
```

**Deployment fails (permission denied):**

```bash
firebase logout
firebase login
firebase deploy
```

**GitHub Actions fails:**

1. Generate new Firebase token: `firebase login:ci`
2. Update GitHub secret `FIREBASE_TOKEN`

**Deployed site shows blank page:**

1. Verify `firebase.json` has `"public": "dist"`
2. Check `config.js` exists before building
3. Browser console for errors

### Analytics Issues

**No data appearing in Firebase Console:**
1. Wait 24 hours (data latency).
2. Check `analytics.js` config matches project.
3. Verify "Firebase Analytics initialized" log appears in dev console.
4. Check network tab for requests to `google-analytics.com` or `firebase`.

### Analytics Issues

**No data appearing in Firebase Console:**
1. Wait 24 hours (data latency).
2. Check `analytics.js` config matches project.
3. Verify "Firebase Analytics initialized" log appears in dev console.
4. Check network tab for requests to `google-analytics.com` or `firebase`.

### Mobile Issues

**Mobile layout broken:**

Check viewport meta tag in `index.html`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

Verify `mobile.css` imported in `main.css`:

```css
@import './mobile.css';
```

Test responsive breakpoints:

- Mobile: < 768px
- Tablet: 768px - 1023px
- Desktop: > 1024px

**Touch events not working:**

Check touch actions in `map.css`:

```css
.map-container {
  touch-action: none;
}
```

### CORS Errors

**CORS policy blocked:**

Always use dev server:

```bash
npm run dev  # NOT open index.html directly
```

Add domain to allowed origins:

- Mapbox: [Mapbox Account](https://account.mapbox.com/) → Tokens → URL restrictions
- Wix: Dashboard → Settings → OAuth

### iframe Integration

**postMessage not working:**

Check allowed origins in `src/assets/js/main.js`:

```javascript
const ALLOWED_ORIGINS = [
  'https://www.lifeatparrish.com',
  'https://lifeatparrish.com'
];
```

Verify message format from parent:

```javascript
iframe.contentWindow.postMessage({
  action: 'selectNeighborhood',
  name: 'Silverleaf'
}, 'https://your-map-domain.com');
```

### Browser Compatibility

**Minimum versions:**

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Check browser support:**

```javascript
if (!window.fetch) {
  console.error('Fetch API not supported');
}
```

### Debugging Tools

**Enable debug mode** in `config.js`:

```javascript
window.config = {
  debug: true
};
```

**Mapbox debug:**

```javascript
// In browser console
map.showTileBoundaries = true;
map.showCollisionBoxes = true;
```

**Check Wix connection:**

```javascript
console.log(await wixClient.auth.getAuthHeaders());
console.log(await wixClient.collections.listCollections());
```

## Quick Solutions

| Issue | Solution |
|-------|----------|
| Map blank | Check Mapbox token in `config.js` |
| No neighborhoods | Verify GeoJSON URL in `map.js`, test URL in browser |
| Wix data missing | Check collection names match exactly |
| Filters not working | Hard refresh (Ctrl+Shift+R) |
| Details panel empty | Check neighborhood name matching |
| Build fails | `npm install` then `npm run build` |
| Deploy fails | `firebase login` then deploy |
| Mobile broken | Check viewport meta tag |
| Slow load | Simplify GeoJSON, check file size |
| CORS errors | Use `npm run dev`, not direct file |

## Resources

- [GeoJSON Specification](https://geojson.org/)
- [Mapbox GL JS Issues](https://github.com/mapbox/mapbox-gl-js/issues)
- [Wix SDK Documentation](https://dev.wix.com/docs/sdk)
- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
