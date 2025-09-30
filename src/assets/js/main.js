import { collections, items } from '@wix/data';
import { createClient, OAuthStrategy } from '@wix/sdk';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const neighborhoodGeojson = await fetchNeighborhoodGeojson()

// init mapbox
mapboxgl.accessToken = config.mapboxAccessToken;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-82.45, 27.56], // Parrish, FL
  zoom: 11
});

// Initialize Wix client
const wixClient = createClient({
  modules: { items, collections },
  auth: OAuthStrategy({
    clientId: '7cbe278c-f794-4ac6-8261-404022bb5625',
  })
});

// fetch data from wix
// fetchNeighborhoods()
fetchHousesForSale()
fetchFloorPlans()


map.on('load', () => {
  // Add your GeoJSON polygons
  loadNeighborhoodsGeojson();

});

async function fetchNeighborhoodGeojson() {
  const response = await fetch('neighborhoods.geojson');
  const neighborhoodData = await response.json();
  return neighborhoodData
}

async function loadNeighborhoodsGeojson() {

  // add the polygons
  map.addSource('neighborhoods', {
    type: 'geojson',
    data: neighborhoodGeojson,
    generateId: true // Generate IDs for features automatically
  });

  // Style the polygons
  map.addLayer({
    id: 'neighborhood-fills',
    type: 'fill',
    source: 'neighborhoods',
    paint: {
      'fill-color': ['get', 'fill'],
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        ['get', 'fill-opacity'], // Keep original opacity if selected
        ['boolean', ['feature-state', 'hover'], false],
        0.8, // Brighten on hover
        ['get', 'fill-opacity'] // Default opacity
      ],
    }
  });

  // Add border/stroke layer
  map.addLayer({
    id: 'neighborhood-borders',
    type: 'line',
    source: 'neighborhoods',
    paint: {
      'line-color': ['get', 'stroke'],
      'line-width': ['get', 'stroke-width'],
      'line-opacity': ['get', 'stroke-opacity']
    }
  });

  // Add hover effect layer (hidden by default, shown on hover)
  map.addLayer({
    id: 'neighborhood-hover',
    type: 'line',
    source: 'neighborhoods',
    paint: {
      'line-color': ['get', 'stroke'],
      'line-width': 4,
      'line-opacity': 0
    }
  });

  // Setup map interactions
  setupMapInteractions();

  // Setup details panel close functionality
  setupDetailsPanelClose();
}

function setupMapInteractions() {
  let hoveredNeighborhoodId = null;
  let selectedNeighborhoodId = null;

  // Change cursor to pointer on hover
  map.on('mouseenter', 'neighborhood-fills', () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'neighborhood-fills', () => {
    map.getCanvas().style.cursor = '';
  });

  // Hover effect - brighten polygon
  map.on('mousemove', 'neighborhood-fills', (e) => {
    if (e.features.length > 0) {
      if (hoveredNeighborhoodId !== null) {
        map.setFeatureState(
          { source: 'neighborhoods', id: hoveredNeighborhoodId },
          { hover: false }
        );
      }
      hoveredNeighborhoodId = e.features[0].id;
      map.setFeatureState(
        { source: 'neighborhoods', id: hoveredNeighborhoodId },
        { hover: true }
      );
    }
  });

  map.on('mouseleave', 'neighborhood-fills', () => {
    if (hoveredNeighborhoodId !== null) {
      map.setFeatureState(
        { source: 'neighborhoods', id: hoveredNeighborhoodId },
        { hover: false }
      );
    }
    hoveredNeighborhoodId = null;
  });

  // Click event - select neighborhood
  map.on('click', 'neighborhood-fills', (e) => {
    if (e.features.length > 0) {
      const clickedFeature = e.features[0];

      // Clear previous selection
      if (selectedNeighborhoodId !== null) {
        map.setFeatureState(
          { source: 'neighborhoods', id: selectedNeighborhoodId },
          { selected: false }
        );
      }

      // Set new selection
      selectedNeighborhoodId = clickedFeature.id;
      map.setFeatureState(
        { source: 'neighborhoods', id: selectedNeighborhoodId },
        { selected: true }
      );

      // Show details panel with neighborhood data
      showNeighborhoodDetails(clickedFeature.properties);
    }
  });
}

function showNeighborhoodDetails(neighborhood) {
  const panel = document.getElementById('neighborhood-details');

  if (!panel) {
    console.error('Details panel not found!');
    return;
  }

  // Populate panel content
  document.querySelector('.details-title').textContent = neighborhood.neighborhood || 'Neighborhood';

  // Price range
  const priceRange = document.getElementById('price-range');
  priceRange.textContent = neighborhood.price_range || 'Contact for pricing';

  // Home types
  const homeTypes = document.getElementById('home-types');
  homeTypes.textContent = neighborhood.homeType || 'Various types available';

  // Amenities
  const amenitiesList = document.getElementById('amenities-list');
  amenitiesList.innerHTML = '';
  if (neighborhood.amenities && Array.isArray(neighborhood.amenities)) {
    neighborhood.amenities.forEach(amenity => {
      const chip = document.createElement('span');
      chip.className = 'amenity-chip';
      chip.textContent = amenity;
      amenitiesList.appendChild(chip);
    });
  }

  // Description (using available data)
  const description = document.getElementById('description');
  const descParts = [];
  if (neighborhood.bedrooms) descParts.push(`${neighborhood.bedrooms} bedrooms`);
  if (neighborhood.bathrooms) descParts.push(`${neighborhood.bathrooms} bathrooms`);
  if (neighborhood.garage) descParts.push(`${neighborhood.garage} garage`);
  if (neighborhood.home_size) descParts.push(`${neighborhood.home_size}`);
  description.textContent = descParts.length > 0 ? descParts.join(' • ') : 'Beautiful neighborhood in Parrish, FL';

  // TODO: Fetch and display homes for sale count
  // TODO: Fetch and display floor plans count

  // Show panel with animation
  panel.classList.add('open');
}

function setupDetailsPanelClose() {
  const panel = document.getElementById('neighborhood-details');
  const closeBtn = document.querySelector('.details-close');

  // Close button click
  closeBtn.onclick = () => {
    panel.classList.remove('open');
  };

  // Click outside to close
  panel.onclick = (e) => {
    if (e.target === panel) {
      panel.classList.remove('open');
    }
  };
}

async function fetchNeighborhoods() {

  const result = await wixClient.items
    .query('Neighborhoods')
    .find()

  console.log('items', result);
  return result.items;
}

async function fetchHousesForSale() {

  const result = await wixClient.items
    .query('HousesforSale')
    .find()

  console.log('Houses for sale', { result });
  return result.items;
}

async function fetchFloorPlans() {

  const result = await wixClient.items
    .query('FloorPlans')
    .find()

  console.log('floor plans', { result });
  return result.items;
}