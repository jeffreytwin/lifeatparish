import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { fetchFloorPlans, fetchHousesForSale } from './modules/api.js';
import { closeDetailsPanel, initDetailsPanel, showNeighborhoodDetails } from './modules/details-panel.js';
import { applyFilters as applyFiltersModule, setupFilters, updateFilterUI } from './modules/filters.js';
import { createPopup, fetchNeighborhoodGeojson, fitMapToAllNeighborhoods, loadNeighborhoodsGeojson, setupMapInteractions } from './modules/map.js';
import { getSelectedNeighborhoodId, setHousesForSale, setSelectedNeighborhoodId } from './modules/state.js';

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
// fetchNeighborhoods();
fetchFloorPlans();

// Fetch houses and store in state
fetchHousesForSale().then(houses => {
  setHousesForSale(houses || []);
  console.log(`Loaded ${houses?.length || 0} houses for sale`);
}).catch(error => {
  console.error('Error fetching houses:', error);
  setHousesForSale([]);
});

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