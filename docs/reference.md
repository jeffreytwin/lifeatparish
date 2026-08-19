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
  wixClientId: 'YOUR_WIX_CLIENT_ID'
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
  const response = await fetch('https://d4ab3c8b-a6bd-41c2-be01-9df7d7d13631.usrfiles.com/ugd/d4ab3c_80b530e674514ac68a3450d40b8f3a9e.json');
  return await response.json();
}
```

To update: upload the new file to Wix Media Manager, then point the URL above at the uploaded file — each upload gets its own `d4ab3c_<hash>.json` path. See [maintenance](./maintenance.md).

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

- `FIREBASE_SERVICE_ACCOUNT` - Firebase service account JSON used by deploy workflow

### Config Source (GitHub Actions)

- CI builds use committed `public/config.js` directly.
- `MAPBOX_ACCESS_TOKEN` is no longer injected by workflow secrets.

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

## UI Element IDs

### Sidebar Filters

| Element ID | Type | Purpose |
|------------|------|---------|
| `search-input` | input | Neighborhood search |
| `clear-search` | button | Clear search (hidden when empty) |
| `price-min` | range input | Min price slider |
| `price-max` | range input | Max price slider |
| `price-range-fill` | div | Visual fill between sliders |
| `selected-range` | span | Displays current price range text |
| `forSale` (name) | radio group | Availability filter (values: `all`, `new`, `existing`) |
| `home-types-container` | div | Container for home type buttons |
| `amenities-dropdown-btn` | button | Opens amenities dropdown |
| `amenities-dropdown` | div | Dropdown panel |
| `amenities-search` | input | Search within amenities |
| `amenities-list` | div | Amenity checkboxes container |
| `selected-amenities` | div | Selected amenity chips |
| `bedrooms-container` | div | Bedroom filter buttons |
| `garages-container` | div | Garage filter buttons |
| `clear-all-filters` | button | Reset all filters |
| `filter-count` | span | Active filter count |
| `no-results` | div | "No matches" warning |
| `matched-count` | span | Neighborhoods matching filters |
| `total-count` | span | Total neighborhoods |

### Mobile Elements

| Element ID | Type | Purpose |
|------------|------|---------|
| `mobile-search-input` | input | Mobile search (synced with desktop) |
| `mobile-filters-btn` | button | Opens sidebar bottom sheet |
| `mobile-sidebar-close` | button | Closes sidebar bottom sheet |
| `mobile-sidebar-overlay` | div | Backdrop overlay |
| `view-results-btn` | button | Closes sidebar, shows map |

### Map & Details

| Element ID | Type | Purpose |
|------------|------|---------|
| `map` | div | Mapbox container |
| `neighborhood-details` | div | Details panel container |
| `sidebar-loading` | div | Loading overlay |

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
