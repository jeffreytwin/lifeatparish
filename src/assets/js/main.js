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
        0.8, // Keep bright when selected
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

  // Add highlight layer for selected polygon
  map.addLayer({
    id: 'neighborhood-highlight',
    type: 'line',
    source: 'neighborhoods',
    paint: {
      'line-color': '#2563eb',
      'line-width': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        4,
        0
      ],
      'line-opacity': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        1,
        0
      ]
    }
  });

  // Setup map interactions
  setupMapInteractions();

  // Setup details panel close functionality
  setupDetailsPanelClose();
}

// Create a reusable popup instance
const popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false,
  offset: 15,
  className: 'neighborhood-popup'
});

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

  // Hover effect - brighten polygon and show tooltip
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

      // Show popup tooltip
      const properties = e.features[0].properties;
      const coordinates = e.lngLat;

      // Build popup HTML
      const priceText = properties.price_range ? `💰 ${properties.price_range}` : '';
      const homeInfo = properties.new_construction
        ? '🏗️ New Construction'
        : (properties.homeType || '');

      const html = `
        <div class="p-2">
          <h3 class="font-bold text-base text-gray-900 mb-1">${properties.neighborhood || 'Neighborhood'}</h3>
          <div class="text-sm text-gray-600 space-y-0.5">
            ${priceText ? `<p>${priceText}</p>` : ''}
            ${homeInfo ? `<p>${homeInfo}</p>` : ''}
          </div>
        </div>
      `;

      popup.setLngLat(coordinates).setHTML(html).addTo(map);
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

    // Hide popup
    popup.remove();
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

      // Pan map to fit the polygon bounds
      if (clickedFeature.geometry && clickedFeature.geometry.coordinates) {
        const bounds = new mapboxgl.LngLatBounds();
        const coords = clickedFeature.geometry.coordinates[0];

        coords.forEach(coord => {
          bounds.extend(coord);
        });

        map.fitBounds(bounds, {
          padding: 100, // Equal padding on all sides since map will resize
          maxZoom: map.getZoom(), // Don't zoom in more than current level
          duration: 800
        });
      }

      // Show details panel with neighborhood data
      showNeighborhoodDetails(clickedFeature.properties);
    }
  });

  // Click outside polygons - deselect and close panel
  map.on('click', (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['neighborhood-fills']
    });

    // If clicked outside any polygon
    if (features.length === 0) {
      // Clear selection
      if (selectedNeighborhoodId !== null) {
        map.setFeatureState(
          { source: 'neighborhoods', id: selectedNeighborhoodId },
          { selected: false }
        );
        selectedNeighborhoodId = null;
      }

      // Close panel
      closeDetailsPanel();
    }
  });
}

function showNeighborhoodDetails(neighborhood) {
  const panel = document.getElementById('neighborhood-details');
  const mapContainer = document.getElementById('map');

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
  mapContainer.classList.add('panel-open');

  // Resize map to fit new container size
  setTimeout(() => {
    map.resize();
  }, 300); // Wait for transition to complete
}


function closeDetailsPanel() {
  const panel = document.getElementById('neighborhood-details');
  const mapContainer = document.getElementById('map');

  panel.classList.remove('open');
  mapContainer.classList.remove('panel-open');

  // Resize map to fit new container size
  setTimeout(() => {
    map.resize();
  }, 300); // Wait for transition to complete
}

function setupDetailsPanelClose() {
  const closeBtn = document.querySelector('.details-close');

  // Close button click
  closeBtn.onclick = () => {
    closeDetailsPanel();
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