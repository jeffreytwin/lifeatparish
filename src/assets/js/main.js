import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { formatPrice, debounce } from './modules/utils.js';
import { filterState, getSelectedNeighborhoodId, setSelectedNeighborhoodId } from './modules/state.js';
import { fetchNeighborhoods, fetchHousesForSale, fetchFloorPlans } from './modules/api.js';
import { initDetailsPanel, showNeighborhoodDetails, closeDetailsPanel } from './modules/details-panel.js';
import { fetchNeighborhoodGeojson, createPopup, fitMapToAllNeighborhoods, setupMapInteractions, loadNeighborhoodsGeojson } from './modules/map.js';
import { populateHomeTypes, populateAmenities, populateBedrooms, setupPriceSlider, setupSearch, setupAmenitiesDropdown, setupForSaleFilter, setupCommunityFeatures, setupClearAll, updateAmenitiesPlaceholder, applyFilters as applyFiltersModule } from './modules/filters.js';

const neighborhoodGeojson = await fetchNeighborhoodGeojson()

// init mapbox
mapboxgl.accessToken = config.mapboxAccessToken;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-82.43, 27.58], // Parrish, FL
  zoom: 7
});

// fetch data from wix
fetchNeighborhoods();
fetchHousesForSale();
fetchFloorPlans();

map.on('load', () => {
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

  // Setup filters
  setupFilters();

  // Fit map to all neighborhoods on initial load
  fitMapToAllNeighborhoods(map, neighborhoodGeojson);
});

// ========== NEW FILTER SYSTEM (Phase 2A) ==========

// Wrapper for applyFilters that provides all necessary dependencies
function applyFilters() {
  applyFiltersModule(map, neighborhoodGeojson, getSelectedNeighborhoodId, setSelectedNeighborhoodId, closeDetailsPanel, updateFilterUI);
}

function setupFilters() {
  // Initialize UI components
  populateHomeTypes(applyFilters);
  populateAmenities(neighborhoodGeojson, applyFilters);
  populateBedrooms(applyFilters);
  setupPriceSlider(applyFilters);
  setupSearch(applyFilters);
  setupAmenitiesDropdown();
  setupForSaleFilter(applyFilters);
  setupCommunityFeatures(applyFilters);
  setupClearAll(applyFilters);

  // Initial display
  updateResultsCounter();
}

function updateFilterUI(matchedCount) {
  const totalFilters =
    filterState.homeTypes.length +
    filterState.amenities.length +
    filterState.bedrooms.length +
    (filterState.forSale !== 'all' ? 1 : 0) +
    (filterState.gated ? 1 : 0) +
    (filterState.age55Plus ? 1 : 0) +
    (filterState.search ? 1 : 0) +
    (filterState.priceMin !== 200 || filterState.priceMax !== 6000 ? 1 : 0);

  const badge = document.getElementById('active-filters-badge');
  const clearAllBtn = document.getElementById('clear-all-filters');

  if (totalFilters > 0) {
    badge.classList.remove('hidden');
    clearAllBtn.classList.remove('hidden');
    document.getElementById('filter-count').textContent = totalFilters;
  } else {
    badge.classList.add('hidden');
    clearAllBtn.classList.add('hidden');
  }

  updateResultsCounter(matchedCount);

  const noResults = document.getElementById('no-results');
  if (matchedCount === 0 && totalFilters > 0) {
    noResults.classList.remove('hidden');
  } else {
    noResults.classList.add('hidden');
  }
}

function updateResultsCounter(matchedCount) {
  const total = neighborhoodGeojson.features.length;
  const matched = matchedCount !== undefined ? matchedCount : total;
  document.getElementById('matched-count').textContent = matched;
  document.getElementById('total-count').textContent = total;
}