# Reference

Quick reference for project-specific configurations and commands.

## NPM Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production → /dist
npm run preview      # Preview build (http://localhost:4173)
```

**Deploy workflow:**

```bash
npm run build
firebase deploy --only hosting
```

**Dev options:**

```bash
npm run dev -- --port 3000    # Custom port
npm run dev -- --host         # Expose to network
```

## Mapbox Configuration

### Token Location

`config.js` in project root:

```javascript
window.config = {
  mapboxAccessToken: 'pk.xxxxx',  // Public token
  wixClientId: '7cbe278c-f794-4ac6-8261-404022bb5625'
};
```

**Manage tokens:** [account.mapbox.com/access-tokens](https://account.mapbox.com/access-tokens/)

### Map Initialization

`src/assets/js/main.js`:

```javascript
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = config.mapboxAccessToken;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-82.51, 27.58],  // Parrish, FL
  zoom: 11.5,
  minZoom: 10,
  maxZoom: 18
});
```

### Map Layers

Three layers render neighborhoods (defined in `src/assets/js/modules/map.js`):

**1. neighborhood-fills** (type: fill)

- Green (#10b981) if `new_construction === true`
- Gray (#9CA3AF) otherwise
- Opacity changes on hover

**2. neighborhood-borders** (type: line)

- Border color: #374151
- Width: 2px (normal), 4px (selected)

**3. neighborhood-highlight** (type: line)

- Selection indicator
- Color: #2563eb, width: 4px

### GeoJSON Source

Hosted in Wix Media Manager, loaded in `src/assets/js/modules/map.js`:

```javascript
export async function fetchNeighborhoodGeojson() {
  const response = await fetch('https://d4ab3c8b-a6bd-41c2-be01-9df7d7d13631.usrfiles.com/ugd/d4ab3c_2ee50ed343dc4840ad74e76c82c08883.json');
  return await response.json();
}
```

To update: Replace file in Wix Media Manager.

## Wix API Configuration

### Client Setup

`src/assets/js/modules/api.js`:

```javascript
import { createClient, OAuthStrategy } from '@wix/sdk';
import { items, collections } from '@wix/data';

const wixClient = createClient({
  modules: { items, collections },
  auth: OAuthStrategy({
    clientId: window.config.wixClientId
  })
});
```

**Client ID Location:** Configured in `config.js` (public - safe to expose)

### Collections

**Neighborhoods**

- `_id` - Unique identifier
- `villageName` - Name (must match GeoJSON `neighborhood` property)
- `amenitiesTags` - Array of amenities
- `description` - Neighborhood description
- `websiteUrl`, `floorPlansUrl`, `tourUrl` - Links

**HousesforSale**

- `_id` - Unique identifier
- `village` - Neighborhood name
- `listingPrice` / `listingPricePure` - Price (formatted/numeric)
- `bedrooms`, `bathrooms`, `homeType`, `garage`
- `squareFeet`, `address`, `imageUrl`, `listingUrl`

**FloorPlans**

- `_id` - Unique identifier
- `villages` - Array of neighborhood names
- `planName`, `bedrooms`, `bathrooms`, `squareFeet`
- `floorPlanUrl` - PDF/image link

### Query Pattern

```javascript
export async function fetchNeighborhoods() {
  const result = await wixClient.items
    .queryDataItems({ dataCollectionId: 'Neighborhoods' })
    .find();

  return result.items.map(item => item.data);
}
```

### Name Mapping

When GeoJSON and Wix names differ, mapping is in `src/assets/js/modules/map.js`:

```javascript
const NEIGHBORHOOD_NAME_MAPPING = {
  'Oakfield': 'Oakfield Lakes',
  'Del Webb BayView': 'Del Webb at Bayview',
  'Isles at BayView': 'Isles at Bayview'
};
```

### Home Type Normalization

Inconsistent home types are normalized in `src/assets/js/modules/filters.js`:

```javascript
export function normalizeHomeType(type) {
  const normalized = {
    'Single Family Residence': 'Single Family',
    'Single Family Home': 'Single Family',
    'Attached Villa': 'Villa',
    'Townhouse': 'Townhome'
  };
  return normalized[type] || type;
}
```

## Firebase Configuration

### Project Details

**Project ID:** `lifeatparrish` (from `.firebaserc`)

**Hosting URL:** `https://lifeatparrish.web.app`

### Deployment

```bash
# Manual
firebase deploy --only hosting

# Via GitHub Actions
# Push to main branch triggers auto-deploy
```

### Required Secrets (GitHub Actions)

Set at: Repository → Settings → Secrets and variables → Actions

- `FIREBASE_TOKEN` - Get via `firebase login:ci`
- `MAPBOX_ACCESS_TOKEN` - Production Mapbox token

## postMessage API

For iframe integration, allowed origins are in `src/assets/js/main.js`:

```javascript
const ALLOWED_ORIGINS = [
  'https://www.lifeatparrish.com',
  'https://lifeatparrish.com',
  ...(window.location.hostname === 'localhost' ?
    ['http://localhost:5173', 'http://localhost:4173'] : [])
];
```

**Message format:**

```javascript
iframe.contentWindow.postMessage({
  action: 'selectNeighborhood',
  name: 'Silverleaf'
}, 'https://map-domain.com');
```

## State Management

Centralized state in `src/assets/js/modules/state.js`:

```javascript
// Getters
getSelectedNeighborhoodId()
getNeighborhoodsData()
getHousesForSale()
getVillagesWithFloorPlans()
getEnhancedGeojson()
getFilterState()

// Setters
setSelectedNeighborhoodId(id)
setNeighborhoodsData(data)
setHousesForSale(data)
setVillagesWithFloorPlans(set)
setEnhancedGeojson(geojson)
updateFilterState(updates)
```

## Project Structure

```
src/assets/js/
├── main.js                    # Entry point, map initialization
└── modules/
    ├── api.js                 # Wix SDK client, data fetching
    ├── map.js                 # Mapbox integration, GeoJSON loading
    ├── filters.js             # Filter logic, normalization
    ├── details-panel.js       # Neighborhood details UI
    ├── state.js               # Centralized state management
    └── utils.js               # Utility functions
```

## External Documentation

- [Mapbox GL JS API](https://docs.mapbox.com/mapbox-gl-js/api/)
- [Wix SDK Documentation](https://dev.wix.com/docs/sdk)
- [Wix Data API](https://dev.wix.com/docs/sdk/api-reference/wix-data)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
- [Vite Documentation](https://vitejs.dev/)
