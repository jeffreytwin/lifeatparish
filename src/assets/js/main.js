import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { fetchFloorPlans, fetchHousesForSale, fetchNeighborhoods } from './modules/api.js';
import { closeDetailsPanel, initDetailsPanel, showNeighborhoodDetails } from './modules/details-panel.js';
import { applyFilters as applyFiltersModule, setupFilters, updateFilterUI } from './modules/filters.js';
import { createPopup, fetchNeighborhoodGeojson, fitMapToAllNeighborhoods, getEnhancedGeojson, loadNeighborhoodsGeojson, setupMapInteractions } from './modules/map.js';
import { getHousesForSale, getNeighborhoodsData, getSelectedNeighborhoodId, setHousesForSale, setNeighborhoodsData, setSelectedNeighborhoodId, setVillagesWithFloorPlans } from './modules/state.js';

const neighborhoodGeojson = await fetchNeighborhoodGeojson()

/**
 * Normalize neighborhood name for matching (same logic as in map.js)
 * @param {string} name - Neighborhood name
 * @returns {string} Normalized name
 */
function normalizeNeighborhoodName(name) {
  const NEIGHBORHOOD_NAME_MAPPING = {
    'Oakfield': 'Oakfield Lakes',
    'Del Webb BayView': 'Del Webb at Bayview',
    'Isles at BayView': 'Isles at Bayview',
    'The Islands on the Manatee River': 'The Islands on The Manatee River'
  };

  const mappedName = NEIGHBORHOOD_NAME_MAPPING[name] || name;

  return mappedName.toLowerCase()
    .replace(/\s+/g, '') // Remove spaces
    .replace(/[^a-z0-9]/g, ''); // Remove special characters
}

/**
 * Parse URL parameters and get the neighborhood parameter
 * @returns {string|null} Neighborhood name from URL or null
 */
function getNeighborhoodFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('neighborhood');
}

/**
 * Select a neighborhood programmatically by name
 * @param {string} neighborhoodName - Name of the neighborhood to select
 */
function selectNeighborhoodByName(neighborhoodName) {
  if (!map || !map.getSource('neighborhoods')) {
    console.warn('Map or neighborhoods source not ready');
    return;
  }

  const enhancedGeojson = getEnhancedGeojson();
  if (!enhancedGeojson) {
    console.warn('Enhanced GeoJSON not available');
    return;
  }

  // Normalize the search name
  const normalizedSearch = normalizeNeighborhoodName(neighborhoodName);

  // Find matching feature
  const feature = enhancedGeojson.features.find(f => {
    const featureName = f.properties.neighborhood || '';
    const normalizedFeatureName = normalizeNeighborhoodName(featureName);
    return normalizedFeatureName === normalizedSearch;
  });

  if (!feature) {
    console.warn(`Neighborhood not found: ${neighborhoodName}`);
    return;
  }

  // Find the feature ID from the map source
  const sourceFeatures = map.querySourceFeatures('neighborhoods');
  const mapFeature = sourceFeatures.find(f => {
    const featureName = f.properties.neighborhood || '';
    const normalizedFeatureName = normalizeNeighborhoodName(featureName);
    return normalizedFeatureName === normalizedSearch;
  });

  if (!mapFeature) {
    console.warn(`Map feature not found: ${neighborhoodName}`);
    return;
  }

  // Clear previous selection if any
  if (getSelectedNeighborhoodId() !== null) {
    map.setFeatureState(
      { source: 'neighborhoods', id: getSelectedNeighborhoodId() },
      { selected: false }
    );
  }

  // Set new selection
  setSelectedNeighborhoodId(mapFeature.id);
  map.setFeatureState(
    { source: 'neighborhoods', id: mapFeature.id },
    { selected: true }
  );

  // Fade all other features
  sourceFeatures.forEach(f => {
    if (f.id !== mapFeature.id) {
      map.setFeatureState(
        { source: 'neighborhoods', id: f.id },
        { faded: true }
      );
    }
  });

  // Fit bounds to the neighborhood
  if (mapFeature.geometry && mapFeature.geometry.coordinates) {
    const bounds = new mapboxgl.LngLatBounds();
    const coords = mapFeature.geometry.coordinates[0];

    coords.forEach(coord => {
      bounds.extend(coord);
    });

    map.fitBounds(bounds, {
      padding: 100,
      maxZoom: map.getZoom(),
      duration: 800
    });
  }

  // Show details panel
  showNeighborhoodDetails(mapFeature.properties);

  console.log(`Auto-selected neighborhood: ${feature.properties.neighborhood}`);
}

/**
 * Setup postMessage listener to receive neighborhood selection from parent window
 * This allows the Wix parent page to communicate with the embedded iframe
 */
function setupPostMessageListener() {
  // Allowed origins for postMessage communication
  const ALLOWED_ORIGINS = [
    'https://www.lifeatparrish.com',
    'https://lifeatparrish.com',
    // Allow localhost for development (any port)
    ...(window.location.hostname === 'localhost' ? ['http://localhost:5173', 'http://localhost:4173'] : [])
  ];

  window.addEventListener('message', (event) => {
    // Security: Validate message origin
    if (!ALLOWED_ORIGINS.includes(event.origin)) {
      console.warn(`Rejected postMessage from unauthorized origin: ${event.origin}`);
      return;
    }

    // Check if message contains neighborhood data
    if (event.data && event.data.neighborhood) {
      const neighborhoodName = event.data.neighborhood;
      console.log(`Received neighborhood selection via postMessage: ${neighborhoodName}`);

      // Select the neighborhood
      selectNeighborhoodByName(neighborhoodName);
    }

    // Also support action commands
    if (event.data && event.data.action === 'selectNeighborhood' && event.data.name) {
      console.log(`Received selectNeighborhood action via postMessage: ${event.data.name}`);
      selectNeighborhoodByName(event.data.name);
    }

    // Support clearing selection
    if (event.data && event.data.action === 'clearSelection') {
      console.log('Received clearSelection action via postMessage');

      // Clear selection
      if (getSelectedNeighborhoodId() !== null) {
        map.setFeatureState(
          { source: 'neighborhoods', id: getSelectedNeighborhoodId() },
          { selected: false }
        );
        setSelectedNeighborhoodId(null);
      }

      // Unfade all features
      const sourceFeatures = map.querySourceFeatures('neighborhoods');
      sourceFeatures.forEach(f => {
        map.setFeatureState(
          { source: 'neighborhoods', id: f.id },
          { faded: false }
        );
      });

      // Close details panel
      closeDetailsPanel();
    }
  });

  console.log('postMessage listener initialized - ready to receive neighborhood selections from parent window');
}

// init mapbox
mapboxgl.accessToken = window.config.mapboxAccessToken;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-82.51, 27.58], // Parrish, FL - wider view showing beach proximity
  zoom: 11.5,
  cooperativeGestures: true
});

// Track when critical data is loaded
let floorPlansLoaded = false;
let neighborhoodsLoaded = false;
let mapLoaded = false;

// Function to initialize map layers once all data is ready
function initializeMapIfReady() {
  if (floorPlansLoaded && neighborhoodsLoaded && mapLoaded) {
    // Add your GeoJSON polygons and layers
    loadNeighborhoodsGeojson(map, neighborhoodGeojson);

    // Create a reusable popup instance
    const popup = createPopup();

    // Setup map interactions
    setupMapInteractions(
      map,
      popup,
      getSelectedNeighborhoodId,
      setSelectedNeighborhoodId,
      showNeighborhoodDetails,
      closeDetailsPanel
    );

    // Setup details panel
    initDetailsPanel(map);

    // Initialize filters if houses are already loaded
    const houses = getHousesForSale();
    if (houses.length > 0) {
      initializeFilters();

      // Hide loading overlay since houses are already loaded
      const loadingOverlay = document.getElementById('sidebar-loading');
      if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
      }
    }

    // Fit map to all neighborhoods on initial load
    // fitMapToAllNeighborhoods(map, neighborhoodGeojson); // Commented out to use custom initial view

    // Check for neighborhood parameter in URL and auto-select if present
    const neighborhoodParam = getNeighborhoodFromUrl();
    if (neighborhoodParam) {
      // Wait a bit for map to fully render before selecting
      setTimeout(() => {
        selectNeighborhoodByName(neighborhoodParam);
      }, 500);
    }

    // Setup postMessage listener for parent window communication
    setupPostMessageListener();
  }
}

// Fetch and store neighborhoods data
fetchNeighborhoods().then(neighborhoods => {
  setNeighborhoodsData(neighborhoods || []);
  console.log(`Loaded ${neighborhoods?.length || 0} neighborhoods from Wix`);
  neighborhoodsLoaded = true;
  initializeMapIfReady();
}).catch(error => {
  console.error('Error fetching neighborhoods:', error);
  setNeighborhoodsData([]);
  neighborhoodsLoaded = true;
  initializeMapIfReady();
});

// Fetch floor plans to determine which neighborhoods have new construction
// This MUST complete before loading map layers
fetchFloorPlans().then(villagesSet => {
  setVillagesWithFloorPlans(villagesSet);
  console.log(`Loaded ${villagesSet.size} neighborhoods with new construction`);
  floorPlansLoaded = true;
  initializeMapIfReady();
}).catch(error => {
  console.error('Error fetching floor plans:', error);
  setVillagesWithFloorPlans(new Set());
  floorPlansLoaded = true;
  initializeMapIfReady();
});

// Fetch houses and store in state
fetchHousesForSale().then(houses => {
  setHousesForSale(houses || []);
  console.log(`Loaded ${houses?.length || 0} houses for sale`);

  // Hide loading overlay
  const loadingOverlay = document.getElementById('sidebar-loading');
  if (loadingOverlay) {
    loadingOverlay.classList.add('hidden');
  }

  // Setup filters once houses are loaded
  if (map.loaded()) {
    initializeFilters();
  }
}).catch(error => {
  console.error('Error fetching houses:', error);
  setHousesForSale([]);

  // Hide loading overlay even on error
  const loadingOverlay = document.getElementById('sidebar-loading');
  if (loadingOverlay) {
    loadingOverlay.classList.add('hidden');
    loadingOverlay.innerHTML = '<div class="loading-text" style="color: #ef4444;">Error loading homes data</div>';
  }
});

map.on('load', () => {
  mapLoaded = true;

  // Add zoom controls
  map.addControl(new mapboxgl.NavigationControl({
    showCompass: false,
    showZoom: true
  }), 'bottom-right');

  // Create custom fit bounds control
  class FitBoundsControl {
    onAdd(map) {
      this.map = map;
      this.container = document.createElement('div');
      this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';

      const button = document.createElement('button');
      button.className = 'mapboxgl-ctrl-icon';
      button.type = 'button';
      button.title = 'Fit to all neighborhoods';
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center';
      button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3L7 3M3 3L3 7M3 3L7 7M17 3L13 3M17 3V7M17 3L13 7M3 17L7 17M3 17L3 13M3 17L7 13M17 17H13M17 17V13M17 17L13 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      button.setAttribute('aria-label', 'Fit to all neighborhoods');

      button.onclick = () => {
        fitMapToAllNeighborhoods(map, neighborhoodGeojson);
      };

      this.container.appendChild(button);
      return this.container;
    }

    onRemove() {
      this.container.parentNode.removeChild(this.container);
      this.map = undefined;
    }
  }

  map.addControl(new FitBoundsControl(), 'bottom-right');

  // Create custom legend control
  class LegendControl {
    onAdd(map) {
      this.map = map;
      this.container = document.createElement('div');
      this.container.className = 'mapboxgl-ctrl bg-white p-2.5 rounded shadow-md';

      this.container.innerHTML = `
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-sm" style="background: #10b981;"></div>
          <span class="text-xs text-gray-700">New Construction Available</span>
        </div>
      `;

      return this.container;
    }

    onRemove() {
      this.container.parentNode.removeChild(this.container);
      this.map = undefined;
    }
  }

  map.addControl(new LegendControl(), 'top-left');

  // Initialize map layers once floor plans and neighborhoods are loaded
  initializeMapIfReady();
});

let filtersInitialized = false;

function initializeFilters() {
  if (filtersInitialized) {
    return;
  }

  const houses = getHousesForSale();
  const enhancedGeojson = getEnhancedGeojson();
  const neighborhoods = getNeighborhoodsData();

  if (!enhancedGeojson) {
    console.error('Cannot initialize filters: Enhanced GeoJSON not available');
    return;
  }

  filtersInitialized = true;

  // Wrapper for applyFilters that provides all necessary dependencies
  const applyFiltersWrapper = () => {
    applyFiltersModule(map, enhancedGeojson, getSelectedNeighborhoodId, setSelectedNeighborhoodId, closeDetailsPanel, updateFilterUI);
  };

  // Setup filters with houses data, neighborhoods data, and enhanced GeoJSON
  setupFilters(enhancedGeojson, houses, neighborhoods, applyFiltersWrapper);

}

// ===== MOBILE SIDEBAR TOGGLE =====
// Simple toggle for mobile bottom sheet (reuses existing sidebar)
const mobileFiltersBtn = document.getElementById('mobile-filters-btn');
const sidebar = document.querySelector('.sidebar');
const mobileOverlay = document.getElementById('mobile-sidebar-overlay');
const mobileCloseBtn = document.getElementById('mobile-sidebar-close');

const openMobileSidebar = () => {
  sidebar?.classList.add('mobile-open');
  mobileOverlay?.classList.add('active');
  document.body.classList.add('mobile-sidebar-open');
};

const closeMobileSidebar = () => {
  sidebar?.classList.remove('mobile-open');
  mobileOverlay?.classList.remove('active');
  document.body.classList.remove('mobile-sidebar-open');
};

mobileFiltersBtn?.addEventListener('click', openMobileSidebar);
mobileCloseBtn?.addEventListener('click', closeMobileSidebar);
mobileOverlay?.addEventListener('click', closeMobileSidebar);

// ===== MOBILE SEARCH =====
// Wire up mobile search to use existing desktop search functionality
const mobileSearchInput = document.getElementById('mobile-search-input');
const desktopSearchInput = document.getElementById('search-input');

// Sync mobile search with desktop search (they share the same filter logic)
mobileSearchInput?.addEventListener('input', (e) => {
  if (desktopSearchInput) {
    desktopSearchInput.value = e.target.value;
    // Trigger input event on desktop search to activate existing search logic
    desktopSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
});

// Sync desktop search back to mobile (for when filters are cleared, etc.)
desktopSearchInput?.addEventListener('input', (e) => {
  if (mobileSearchInput && e.target.value !== mobileSearchInput.value) {
    mobileSearchInput.value = e.target.value;
  }
});
