import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { formatPrice, debounce } from './modules/utils.js';
import { filterState, getSelectedNeighborhoodId, setSelectedNeighborhoodId } from './modules/state.js';
import { fetchNeighborhoods, fetchHousesForSale, fetchFloorPlans } from './modules/api.js';
import { initDetailsPanel, showNeighborhoodDetails, closeDetailsPanel } from './modules/details-panel.js';
import { fetchNeighborhoodGeojson, createPopup, fitMapToAllNeighborhoods, setupMapInteractions, loadNeighborhoodsGeojson } from './modules/map.js';
import { populateHomeTypes, populateAmenities, populateBedrooms, setupPriceSlider, setupSearch, setupAmenitiesDropdown, setupForSaleFilter, setupCommunityFeatures, setupClearAll, updateAmenitiesPlaceholder } from './modules/filters.js';

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

// Apply Filters to Map
function applyFilters() {
  // Clear selected polygon and close details panel when filtering
  if (getSelectedNeighborhoodId() !== null) {
    map.setFeatureState(
      { source: 'neighborhoods', id: getSelectedNeighborhoodId() },
      { selected: false }
    );
    setSelectedNeighborhoodId(null);
  }
  closeDetailsPanel();

  let matchedCount = 0;
  const features = neighborhoodGeojson.features;
  const matchedFeatures = [];

  features.forEach((feature, index) => {
    const props = feature.properties;
    let matches = true;

    // Search filter
    if (filterState.search) {
      const name = (props.neighborhood || '').toLowerCase();
      const builder = (props.builder || '').toLowerCase();
      const amenities = Array.isArray(props.amenities) ? props.amenities.join(' ').toLowerCase() : '';
      matches = name.includes(filterState.search) || builder.includes(filterState.search) || amenities.includes(filterState.search);
    }

    // Price range (stub - will be dynamic later)
    // For now, just pass through

    // Home types - disabled for Phase 2A (no homeType property in GeoJSON)
    // Will be implemented in Phase 2B with Wix data
    // if (matches && filterState.homeTypes.length > 0) {
    //   const propHomeType = props.homeType || '';
    //   matches = filterState.homeTypes.some(type => propHomeType.includes(type));
    // }

    // Amenities
    if (matches && filterState.amenities.length > 0) {
      const propAmenities = props.amenities || [];
      matches = filterState.amenities.every(amenity => propAmenities.includes(amenity));
    }

    // For Sale
    if (matches && filterState.forSale !== 'all') {
      if (filterState.forSale === 'new') {
        matches = props.new_construction === true;
      } else if (filterState.forSale === 'existing') {
        matches = !props.new_construction;
      }
    }

    // Gated (stub for now)
    // Will implement when we have the data

    // Update visibility
    map.setFeatureState(
      { source: 'neighborhoods', id: index },
      { hidden: !matches }
    );

    if (matches) {
      matchedCount++;
      matchedFeatures.push(feature);
    }
  });

  updateMapVisibility();
  updateFilterUI(matchedCount);
  fitMapToMatches(matchedFeatures);
}

function fitMapToMatches(matchedFeatures) {
  if (matchedFeatures.length === 0) return;

  // Calculate bounds of all matched features
  const bounds = new mapboxgl.LngLatBounds();

  matchedFeatures.forEach(feature => {
    feature.geometry.coordinates.forEach(polygon => {
      polygon.forEach(coord => {
        bounds.extend(coord);
      });
    });
  });

  // Fit map to bounds with smooth animation
  map.fitBounds(bounds, {
    padding: 50, // Equal padding on all sides
    duration: 1000, // 1 second smooth animation
    maxZoom: 15 // Don't zoom in too close
  });
}

function updateMapVisibility() {
  map.setPaintProperty('neighborhood-fills', 'fill-opacity', [
    'case',
    ['boolean', ['feature-state', 'hidden'], false],
    0,
    ['boolean', ['feature-state', 'selected'], false],
    0.8,
    ['boolean', ['feature-state', 'hover'], false],
    0.8,
    ['get', 'fill-opacity']
  ]);

  map.setPaintProperty('neighborhood-borders', 'line-opacity', [
    'case',
    ['boolean', ['feature-state', 'hidden'], false],
    0,
    ['get', 'stroke-opacity']
  ]);
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