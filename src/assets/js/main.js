import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { formatPrice, debounce } from './modules/utils.js';
import { filterState, getSelectedNeighborhoodId, setSelectedNeighborhoodId } from './modules/state.js';
import { fetchNeighborhoods, fetchHousesForSale, fetchFloorPlans } from './modules/api.js';

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

  // Setup filters
  setupFilters();

  // Fit map to all neighborhoods on initial load
  fitMapToAllNeighborhoods();
}

function fitMapToAllNeighborhoods() {
  const bounds = new mapboxgl.LngLatBounds();

  neighborhoodGeojson.features.forEach(feature => {
    feature.geometry.coordinates.forEach(polygon => {
      polygon.forEach(coord => {
        bounds.extend(coord);
      });
    });
  });

  map.fitBounds(bounds, {
    padding: 50, // Equal padding on all sides
    duration: 1000 // 1 second smooth animation
  });
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

      // Build popup HTML with enhanced styling
      const priceText = properties.price_range ? properties.price_range : '';
      const homeInfo = properties.new_construction
        ? 'New Construction'
        : (properties.homeType || '');

      const html = `
        <div class="px-4 py-3 min-w-[200px]">
          <h3 class="font-bold text-lg text-gray-900 mb-2 border-b-2 border-[#676ACE] pb-2">${properties.neighborhood || 'Neighborhood'}</h3>
          <div class="space-y-2">
            ${priceText ? `
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-[#676ACE]"></div>
                <span class="text-sm font-semibold text-[#676ACE]">${priceText}</span>
              </div>
            ` : ''}
            ${homeInfo ? `
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-[#2C9E36]"></div>
                <span class="text-sm font-medium text-gray-700">${homeInfo}</span>
              </div>
            ` : ''}
          </div>
          <div class="mt-3 pt-2 border-t border-gray-200">
            <p class="text-xs text-gray-500 italic">Click to view details</p>
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
      if (getSelectedNeighborhoodId() !== null) {
        map.setFeatureState(
          { source: 'neighborhoods', id: getSelectedNeighborhoodId() },
          { selected: false }
        );
      }

      // Set new selection
      setSelectedNeighborhoodId(clickedFeature.id);
      map.setFeatureState(
        { source: 'neighborhoods', id: getSelectedNeighborhoodId() },
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
      if (getSelectedNeighborhoodId() !== null) {
        map.setFeatureState(
          { source: 'neighborhoods', id: getSelectedNeighborhoodId() },
          { selected: false }
        );
        setSelectedNeighborhoodId(null);
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


// ========== NEW FILTER SYSTEM (Phase 2A) ==========

function setupFilters() {
  // Initialize UI components
  populateHomeTypes();
  populateAmenities();
  populateBedrooms();
  setupPriceSlider();
  setupSearch();
  setupAmenitiesDropdown();
  setupForSaleFilter();
  setupCommunityFeatures();
  setupClearAll();

  // Initial display
  updateResultsCounter();
}

// Populate Home Types from GeoJSON
function populateHomeTypes() {
  // Mock data for Phase 2A - will be replaced with dynamic data in Phase 2B
  const types = ['Single Family', 'Townhome', 'Villa', 'Condominium'];

  const container = document.getElementById('home-types-container');

  types.forEach(type => {
    const btn = document.createElement('button');
    btn.className = 'px-4 py-2 text-sm font-medium border-2 border-gray-200 rounded-lg hover:border-[#676ACE] transition-colors';
    btn.textContent = type;
    btn.dataset.type = type;

    btn.addEventListener('click', () => {
      const isActive = filterState.homeTypes.includes(type);
      if (isActive) {
        filterState.homeTypes = filterState.homeTypes.filter(t => t !== type);
        btn.classList.remove('bg-[#676ACE]', 'text-white', 'border-[#676ACE]');
        btn.classList.add('border-gray-200');
      } else {
        filterState.homeTypes.push(type);
        btn.classList.add('bg-[#676ACE]', 'text-white', 'border-[#676ACE]');
        btn.classList.remove('border-gray-200');
      }
      applyFilters();
    });

    container.appendChild(btn);
  });
}

// Populate Amenities Dropdown
function populateAmenities() {
  const amenitiesSet = new Set();
  neighborhoodGeojson.features.forEach(feature => {
    const amenities = feature.properties.amenities;
    if (Array.isArray(amenities)) {
      amenities.forEach(a => amenitiesSet.add(a));
    }
  });

  const list = document.getElementById('amenities-list');
  const sorted = Array.from(amenitiesSet).sort();

  sorted.forEach(amenity => {
    const label = document.createElement('label');
    label.className = 'flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer';
    label.innerHTML = `
      <input type="checkbox" value="${amenity}" class="w-4 h-4 text-[#676ACE] focus:ring-[#676ACE] rounded">
      <span class="text-sm text-gray-700">${amenity}</span>
    `;

    const checkbox = label.querySelector('input');
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        filterState.amenities.push(amenity);
        addAmenityChip(amenity);
      } else {
        filterState.amenities = filterState.amenities.filter(a => a !== amenity);
        removeAmenityChip(amenity);
      }
      updateAmenitiesPlaceholder();
      applyFilters();
    });

    list.appendChild(label);
  });
}

// Populate Bedrooms Chips
function populateBedrooms() {
  const bedroomOptions = ['2-3', '3-4', '4-5', '5+'];
  const container = document.getElementById('bedrooms-container');

  bedroomOptions.forEach(range => {
    const btn = document.createElement('button');
    btn.className = 'px-4 py-2 text-sm font-medium border-2 border-gray-200 rounded-full hover:border-[#2C9E36] transition-colors';
    btn.textContent = `${range} BR`;
    btn.dataset.range = range;

    btn.addEventListener('click', () => {
      const isActive = filterState.bedrooms.includes(range);
      if (isActive) {
        filterState.bedrooms = filterState.bedrooms.filter(b => b !== range);
        btn.classList.remove('bg-[#2C9E36]', 'text-white', 'border-[#2C9E36]');
        btn.classList.add('border-gray-200');
      } else {
        filterState.bedrooms.push(range);
        btn.classList.add('bg-[#2C9E36]', 'text-white', 'border-[#2C9E36]');
        btn.classList.remove('border-gray-200');
      }
      applyFilters();
    });

    container.appendChild(btn);
  });
}

// Setup Price Slider
function setupPriceSlider() {
  const minSlider = document.getElementById('price-min');
  const maxSlider = document.getElementById('price-max');
  const selectedRange = document.getElementById('selected-range');
  const fill = document.getElementById('price-range-fill');

  function updateSlider() {
    let min = parseInt(minSlider.value);
    let max = parseInt(maxSlider.value);

    if (min > max) {
      [min, max] = [max, min];
      minSlider.value = min;
      maxSlider.value = max;
    }

    filterState.priceMin = min;
    filterState.priceMax = max;

    selectedRange.textContent = `$${formatPrice(min)} - $${formatPrice(max)}`;

    const minPercent = ((min - 200) / (6000 - 200)) * 100;
    const maxPercent = ((max - 200) / (6000 - 200)) * 100;
    fill.style.left = `${minPercent}%`;
    fill.style.width = `${maxPercent - minPercent}%`;

    applyFilters();
  }

  minSlider.addEventListener('input', updateSlider);
  maxSlider.addEventListener('input', updateSlider);
  updateSlider(); // Initial setup
}

// Setup Search
function setupSearch() {
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('clear-search');

  const debouncedSearch = debounce((value) => {
    filterState.search = value.toLowerCase();
    applyFilters();
  }, 300);

  searchInput.addEventListener('input', (e) => {
    const value = e.target.value;
    clearBtn.classList.toggle('hidden', !value);
    debouncedSearch(value);
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.classList.add('hidden');
    filterState.search = '';
    applyFilters();
  });
}

// Setup Amenities Dropdown
function setupAmenitiesDropdown() {
  const btn = document.getElementById('amenities-dropdown-btn');
  const dropdown = document.getElementById('amenities-dropdown');
  const arrow = document.getElementById('amenities-arrow');
  const searchInput = document.getElementById('amenities-search');
  const clearSearchBtn = document.getElementById('clear-amenities-search');

  btn.addEventListener('click', () => {
    dropdown.classList.toggle('hidden');
    arrow.classList.toggle('rotate-180');
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add('hidden');
      arrow.classList.remove('rotate-180');
    }
  });

  // Search within amenities
  searchInput.addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    const labels = dropdown.querySelectorAll('label');
    labels.forEach(label => {
      const text = label.textContent.toLowerCase();
      label.style.display = text.includes(search) ? 'flex' : 'none';
    });

    // Show/hide clear button
    clearSearchBtn.classList.toggle('hidden', search === '');
  });

  // Clear search input
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    // Show all amenities
    const labels = dropdown.querySelectorAll('label');
    labels.forEach(label => {
      label.style.display = 'flex';
    });
  });
}

function addAmenityChip(amenity) {
  const container = document.getElementById('selected-amenities');
  const chip = document.createElement('button');
  chip.className = 'flex items-center gap-1 px-3 py-1 bg-[#4AC2A9] text-white text-sm font-medium rounded-full hover:bg-[#2C9E36] transition-colors';
  chip.dataset.amenity = amenity;
  chip.innerHTML = `
    ${amenity}
    <span class="text-lg">&times;</span>
  `;

  chip.addEventListener('click', () => {
    filterState.amenities = filterState.amenities.filter(a => a !== amenity);
    removeAmenityChip(amenity);
    // Uncheck checkbox
    const checkbox = document.querySelector(`#amenities-list input[value="${amenity}"]`);
    if (checkbox) checkbox.checked = false;
    updateAmenitiesPlaceholder();
    applyFilters();
  });

  container.appendChild(chip);
}

function removeAmenityChip(amenity) {
  const chip = document.querySelector(`#selected-amenities [data-amenity="${amenity}"]`);
  if (chip) chip.remove();
}

function updateAmenitiesPlaceholder() {
  const placeholder = document.getElementById('amenities-placeholder');
  const count = filterState.amenities.length;
  placeholder.textContent = count > 0 ? `${count} selected` : 'Select amenities...';
  placeholder.classList.toggle('text-[#676ACE]', count > 0);
  placeholder.classList.toggle('font-semibold', count > 0);
}

// Setup For Sale Filter
function setupForSaleFilter() {
  document.querySelectorAll('input[name="forSale"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      filterState.forSale = e.target.value;
      applyFilters();
    });
  });
}

// Setup Community Features
function setupCommunityFeatures() {
  document.getElementById('filter-gated').addEventListener('change', (e) => {
    filterState.gated = e.target.checked;
    applyFilters();
  });

  document.getElementById('filter-55plus').addEventListener('change', (e) => {
    filterState.age55Plus = e.target.checked;
    applyFilters();
  });
}

// Setup Clear All
function setupClearAll() {
  document.getElementById('clear-all-filters').addEventListener('click', () => {
    // Reset state
    filterState.search = '';
    filterState.priceMin = 200;
    filterState.priceMax = 6000;
    filterState.homeTypes = [];
    filterState.amenities = [];
    filterState.bedrooms = [];
    filterState.forSale = 'all';
    filterState.gated = false;
    filterState.age55Plus = false;

    // Reset UI
    document.getElementById('search-input').value = '';
    document.getElementById('clear-search').classList.add('hidden');
    document.getElementById('price-min').value = 200;
    document.getElementById('price-max').value = 6000;
    document.querySelectorAll('#home-types-container button').forEach(btn => {
      btn.classList.remove('bg-[#676ACE]', 'text-white', 'border-[#676ACE]');
      btn.classList.add('border-gray-200');
    });
    document.querySelectorAll('#bedrooms-container button').forEach(btn => {
      btn.classList.remove('bg-[#2C9E36]', 'text-white', 'border-[#2C9E36]');
      btn.classList.add('border-gray-200');
    });
    document.querySelectorAll('#amenities-list input').forEach(cb => cb.checked = false);
    document.getElementById('selected-amenities').innerHTML = '';
    updateAmenitiesPlaceholder();
    document.querySelector('input[name="forSale"][value="all"]').checked = true;
    document.getElementById('filter-gated').checked = false;
    document.getElementById('filter-55plus').checked = false;

    // Re-trigger slider update
    document.getElementById('price-min').dispatchEvent(new Event('input'));

    applyFilters();
  });
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