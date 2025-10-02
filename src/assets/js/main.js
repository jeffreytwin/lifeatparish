import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getSelectedNeighborhoodId, setSelectedNeighborhoodId } from './modules/state.js';
import { fetchNeighborhoods, fetchHousesForSale, fetchFloorPlans } from './modules/api.js';
import { initDetailsPanel, showNeighborhoodDetails, closeDetailsPanel } from './modules/details-panel.js';
import { fetchNeighborhoodGeojson, createPopup, fitMapToAllNeighborhoods, setupMapInteractions, loadNeighborhoodsGeojson } from './modules/map.js';
import { setupFilters, updateFilterUI, applyFilters as applyFiltersModule } from './modules/filters.js';

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

  // Wrapper for applyFilters that provides all necessary dependencies
  const applyFiltersWrapper = () => {
    applyFiltersModule(map, neighborhoodGeojson, getSelectedNeighborhoodId, setSelectedNeighborhoodId, closeDetailsPanel, updateFilterUI);
  };

  // Setup filters
  setupFilters(neighborhoodGeojson, applyFiltersWrapper);

  // Fit map to all neighborhoods on initial load
  fitMapToAllNeighborhoods(map, neighborhoodGeojson);
});