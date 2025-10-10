import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { fetchFloorPlans, fetchHousesForSale, fetchNeighborhoods } from './modules/api.js';
import { closeDetailsPanel, initDetailsPanel, showNeighborhoodDetails } from './modules/details-panel.js';
import { applyFilters as applyFiltersModule, setupFilters, updateFilterUI } from './modules/filters.js';
import { createPopup, fetchNeighborhoodGeojson, fitMapToAllNeighborhoods, getEnhancedGeojson, loadNeighborhoodsGeojson, setupMapInteractions } from './modules/map.js';
import { getHousesForSale, getSelectedNeighborhoodId, setHousesForSale, setNeighborhoodsData, setSelectedNeighborhoodId, setVillagesWithFloorPlans } from './modules/state.js';

const neighborhoodGeojson = await fetchNeighborhoodGeojson()

// init mapbox
mapboxgl.accessToken = config.mapboxAccessToken;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-82.43, 27.58], // Parrish, FL
  zoom: 7
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
    fitMapToAllNeighborhoods(map, neighborhoodGeojson);
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
      this.container.className = 'mapboxgl-ctrl';
      this.container.style.cssText = 'background: white; padding: 10px; border-radius: 4px; box-shadow: 0 0 0 2px rgba(0,0,0,.1);';

      this.container.innerHTML = `
        <div style="font-weight: 600; font-size: 12px; margin-bottom: 8px; color: #374151;">Neighborhood Type</div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <div style="width: 16px; height: 16px; background: #10b981; border-radius: 3px;"></div>
          <span style="font-size: 12px; color: #374151;">New Construction</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 16px; height: 16px; background: #676ACE; border-radius: 3px;"></div>
          <span style="font-size: 12px; color: #374151;">Resale Homes</span>
        </div>
      `;

      return this.container;
    }

    onRemove() {
      this.container.parentNode.removeChild(this.container);
      this.map = undefined;
    }
  }

  map.addControl(new LegendControl(), 'bottom-left');

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

  if (!enhancedGeojson) {
    console.error('Cannot initialize filters: Enhanced GeoJSON not available');
    return;
  }

  filtersInitialized = true;

  // Wrapper for applyFilters that provides all necessary dependencies
  const applyFiltersWrapper = () => {
    applyFiltersModule(map, enhancedGeojson, getSelectedNeighborhoodId, setSelectedNeighborhoodId, closeDetailsPanel, updateFilterUI);
  };

  // Setup filters with houses data and enhanced GeoJSON
  setupFilters(enhancedGeojson, houses, applyFiltersWrapper);
}