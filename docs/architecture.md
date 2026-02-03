# Architecture

## Stack

**Frontend:** Vanilla JavaScript (ES6+), Vite, Tailwind CSS v4
**Map:** Mapbox GL JS
**Data:** Wix Data API, GeoJSON (hosted on Wix Media Manager)
**Hosting:** Firebase Hosting
**Analytics:** Firebase Analytics
**CI/CD:** GitHub Actions

## Project Structure

```
parrish-map/
├── .github/workflows/deploy.yml    # Auto-deploy to Firebase
├── docs/                           # Documentation
├── src/
│   └── assets/
│       ├── css/                   # Styles (main, mobile, tablet, etc.)
│       └── js/
│           ├── main.js            # Entry point
│           └── modules/
│               ├── api.js         # Wix API calls
│               ├── map.js         # Mapbox integration
│               ├── filters.js     # Filter logic
│               ├── details-panel.js
│               ├── state.js       # App state
│               ├── analytics.js   # Firebase Analytics
│               └── utils.js
├── config.example.js              # Config template
├── index.html                     # Main HTML
├── firebase.json                  # Firebase config
└── package.json
```

## Data Flow

### Initialization

1. Load `config.js` (Mapbox token)
2. Initialize Firebase Analytics
3. Initialize Mapbox map
3. **Fetch in parallel:**
   - Wix: Neighborhoods, HousesforSale, FloorPlans
   - Wix Media Manager: GeoJSON boundaries
4. **Enhance GeoJSON** with Wix data (amenities, new_construction, has_resale_homes)
5. Render map with colored polygons
6. Initialize filters

### User Interactions

**Filtering:**

```
User selects filter → Update state → Filter data in-memory →
Update map visibility → Update UI counts
```

**Neighborhood Click:**

```
Click polygon → Highlight → Fetch related houses →
Show details panel → Pan to fit bounds
```

**Search:**

```
Type → Debounce (300ms) → Filter by name → Update map
```

## State Management

Centralized state in `state.js`:

```javascript
let selectedNeighborhoodId = null;
let neighborhoodsData = [];
let housesForSale = [];
let villagesWithFloorPlans = new Set();
let enhancedGeojson = null;

const filterState = {
  search: '',
  priceMin: 200,
  priceMax: 6000,
  homeTypes: [],
  amenities: [],
  bedrooms: [],
  garages: [],
  forSale: 'all'
};
```

Access via getters/setters: `getHousesForSale()`, `setHousesForSale(data)`

## Key Modules

### main.js

Entry point. Initializes map, fetches data, sets up interactions, handles URL params and postMessage.

### api.js

Wix SDK integration:

- `fetchNeighborhoods()` - Neighborhood metadata
- `fetchHousesForSale()` - Real estate listings
- `fetchFloorPlans()` - New construction plans
- `fetchNeighborhoodGeojson()` - GeoJSON from Wix URL

### map.js

Mapbox integration:

- `loadNeighborhoodsGeojson()` - Add polygons to map
- `setupMapInteractions()` - Click, hover, tooltips
- `hasNewConstruction()` - Check if neighborhood has floor plans
- `hasResaleHomes()` - Check if neighborhood has listings

### filters.js

Filter system:

- `setupFilters()` - Initialize all filters
- `applyFilters()` - Filter logic (combines all active filters)
- `normalizeHomeType()` - Standardize home type names
- Populates: price slider, home types, bedrooms, garages, amenities

### details-panel.js

- `showNeighborhoodDetails()` - Display panel with houses
- `closeDetailsPanel()` - Hide panel
- Responsive: side panel (desktop) → bottom sheet (mobile)

### analytics.js

- `initAnalytics()` - Initializes Firebase Analytics with configuration

## Data Sources

### Wix Collections

**Neighborhoods:**

- `villageName` - Name (must match GeoJSON)
- `amenitiesTags` - Array of amenities
- `topBackgroundImage` - Hero image (Wix format)

**HousesforSale:**

- `village` - Neighborhood name
- `listingPrice` / `listingPricePure` - Price (string/number)
- `bedrooms`, `bathrooms`, `homeType`, `garage`, `squareFeet`

**FloorPlans:**

- `villages` - Array of neighborhood IDs
- `floorPlanName`, `bedrooms`, `bathrooms`, `squareFeet`
- `garages`, `floorPlanPrice`, `homeType`
- Links neighborhoods to new construction

### GeoJSON

Hosted in Wix Media Manager as `neighborhoods.geojson.json` (Wix supports `.json` but not `.geojson` extensions).

**URL:** Configured in `src/assets/js/modules/map.js`
**Update process:** Replace file in Wix Media Manager → Map updates automatically

**Structure:**

```json
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": { "type": "Polygon", "coordinates": [[...]] },
    "properties": { "neighborhood": "Silverleaf" }
  }]
}
```

Enhanced properties added by app: `amenities`, `new_construction`, `has_resale_homes`, `priceRange`

## Map Layers

Three layers render neighborhoods:

1. **neighborhood-fills** (fill) - Polygon interiors
   - Green (#10b981) if `new_construction === true`
   - Purple (#676ACE) if resale only
   - Opacity changes on hover/select

2. **neighborhood-borders** (line) - Polygon borders
   - Matches fill color
   - Width: 2px

3. **neighborhood-highlight** (line) - Selection indicator
   - Blue (#2563eb), width 4px
   - Only visible when selected

## UI Components

### Sidebar Filter Controls

| Control | Type | Description |
|---------|------|-------------|
| Search | Text input | Filters neighborhoods by name (debounced 300ms) |
| Clear Search | Button (×) | Clears search input, hidden when empty |
| Price Range | Dual range slider | Min/max from $200K to $6M+ |
| Availability | Radio buttons | "Show All", "New Construction Available", "Resale Homes Available" |
| Home Types | Toggle buttons | Dynamically populated from house data (Single Family, Villa, Townhome, Condo) |
| Amenities | Dropdown + checkboxes | Searchable dropdown with multi-select, shows selected as chips |
| Bedrooms | Toggle buttons | "1-2", "3-4", "5+" |
| Garages | Toggle buttons | "1-2", "3-4" |
| Clear All Filters | Text button | Resets all filters to defaults |
| View Results | Button (mobile) | Closes sidebar and shows map |

### Map Controls

| Control | Position | Description |
|---------|----------|-------------|
| Zoom +/- | Bottom right | Mapbox NavigationControl (compass hidden) |
| Fit Bounds | Bottom right | Custom button - fits view to all neighborhoods |
| Legend | Top left | Shows "New Construction Available" indicator (green) |

### Details Panel

| Element | Description |
|---------|-------------|
| Close button (×) | Top right, closes panel |
| Header | Neighborhood image, name, price range, links |
| House cards | Scrollable list of available homes |

### Mobile-Only Elements

| Element | Description |
|---------|-------------|
| Top bar | Fixed bar with search input + "Filters" button |
| Filters button | Opens sidebar as bottom sheet |
| Mobile sidebar close (×) | Closes bottom sheet |

## Responsive Design

**Breakpoints:**

- Mobile: < 768px
- Tablet: 768px - 1023px
- Desktop: > 1024px

**Mobile Changes:**

- Sidebar → Bottom sheet
- Details panel → Bottom sheet
- Top bar with search + filters button
- Full-width map

## Performance

**Optimizations:**

- Data fetched once on load, cached in state
- Debounced search input (300ms)
- Filters applied in-memory (no DOM manipulation during filter)
- Layer filters instead of removing/adding features
- Feature state for hover/select (not layer updates)

**Bundle Size:**

- Total: ~540 KB gzipped
- JavaScript: ~500 KB (includes Mapbox)
- CSS: ~12 KB
- GeoJSON: ~40 KB (fetched separately)

## Security

- **postMessage origin validation** - Only allows approved domains
- **Read-only Wix access** - No write permissions
- **Public tokens only** - No secrets in frontend
- **Mapbox token** - URL restrictions configured

## Name Mapping

GeoJSON and Wix names sometimes differ. Mapping in `src/assets/js/modules/map.js`:

```javascript
const NEIGHBORHOOD_NAME_MAPPING = {
  'Oakfield': 'Oakfield Lakes',
  'Del Webb BayView': 'Del Webb at Bayview',
  'Isles at BayView': 'Isles at Bayview'
};
```

Normalized comparison removes spaces/special chars for matching.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires: ES6 modules, Async/await, Fetch API, CSS Grid/Flexbox

## Related Documentation

- [Setup](./setup.md) - Getting started
- [Deployment](./deployment.md) - Deploy to Firebase
- [Maintenance](./maintenance.md) - Updates and troubleshooting
