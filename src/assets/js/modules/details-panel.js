/**
 * Details Panel Management
 */

let map = null;

/**
 * Initialize the details panel module with map instance
 * @param {mapboxgl.Map} mapInstance - The Mapbox map instance
 */
export function initDetailsPanel(mapInstance) {
  map = mapInstance;
  setupDetailsPanelClose();
}

/**
 * Show neighborhood details in the side panel
 * @param {Object} neighborhood - Neighborhood properties from GeoJSON
 */
export function showNeighborhoodDetails(neighborhood) {
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

  // Home types - no data in Phase 2A GeoJSON
  const homeTypes = document.getElementById('home-types');
  homeTypes.textContent = 'Available in multiple styles';

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
  if (map) {
    setTimeout(() => {
      map.resize();
    }, 300); // Wait for transition to complete
  }
}

/**
 * Close the details panel
 */
export function closeDetailsPanel() {
  const panel = document.getElementById('neighborhood-details');
  const mapContainer = document.getElementById('map');

  panel.classList.remove('open');
  mapContainer.classList.remove('panel-open');

  // Resize map to fit new container size
  if (map) {
    setTimeout(() => {
      map.resize();
    }, 300); // Wait for transition to complete
  }
}

/**
 * Setup close button event listener
 */
function setupDetailsPanelClose() {
  const closeBtn = document.querySelector('.details-close');

  // Close button click
  closeBtn.onclick = () => {
    closeDetailsPanel();
  };
}
