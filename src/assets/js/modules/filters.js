/**
 * Filter System
 */

import { filterState, getHousesForSale, setDefaultPriceRange, defaultPriceRange } from './state.js';
import { formatPrice, debounce } from './utils.js';
import mapboxgl from 'mapbox-gl';

// ========== POPULATION FUNCTIONS ==========

/**
 * Populate Home Types dynamically from houses data
 * @param {Array} houses - Array of houses from sale
 * @param {Function} applyFiltersCallback - Callback to apply filters
 */
export function populateHomeTypes(houses, applyFiltersCallback) {
  // Extract unique home types from actual houses data
  const homeTypesSet = new Set();
  houses.forEach(house => {
    if (house.homeType) {
      homeTypesSet.add(house.homeType);
    }
  });

  const types = Array.from(homeTypesSet).sort();
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
      applyFiltersCallback();
    });

    container.appendChild(btn);
  });
}

/**
 * Populate Amenities Dropdown
 * @param {Object} geojson - The GeoJSON data
 * @param {Function} applyFiltersCallback - Callback to apply filters
 */
export function populateAmenities(geojson, applyFiltersCallback) {
  const amenitiesSet = new Set();
  geojson.features.forEach(feature => {
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
        addAmenityChip(amenity, applyFiltersCallback);
      } else {
        filterState.amenities = filterState.amenities.filter(a => a !== amenity);
        removeAmenityChip(amenity);
      }
      updateAmenitiesPlaceholder();
      applyFiltersCallback();
    });

    list.appendChild(label);
  });
}

/**
 * Populate Bedrooms Chips
 * @param {Function} applyFiltersCallback - Callback to apply filters
 */
export function populateBedrooms(applyFiltersCallback) {
  const bedroomOptions = ['1-2', '3-4', '5+'];
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
      applyFiltersCallback();
    });

    container.appendChild(btn);
  });
}

// ========== SETUP FUNCTIONS ==========

/**
 * Calculate dynamic price range from houses data
 * @param {Array} houses - Array of houses
 * @returns {Object} Object with min and max prices in thousands
 */
function calculatePriceRange(houses) {
  if (!houses || houses.length === 0) {
    console.log('No houses data, using fallback defaults');
    return { min: 200, max: 6000 }; // Fallback defaults
  }

  console.log(`Analyzing ${houses.length} houses for price range...`);

  let minPrice = Infinity;
  let maxPrice = 0;
  let validPriceCount = 0;

  houses.forEach((house, index) => {
    // Use listingPricePure (already a number) if available, otherwise parse listingPrice string
    const priceRaw = house.listingPricePure || parseFloat((house.listingPrice || '').replace(/[$,]/g, ''));

    if (index < 5) {
      // Log first 5 houses for debugging
      console.log(`House ${index}: listingPricePure=${house.listingPricePure}, listingPrice="${house.listingPrice}" -> using=${priceRaw}`);
    }

    if (priceRaw > 0) {
      validPriceCount++;
      if (priceRaw < minPrice) minPrice = priceRaw;
      if (priceRaw > maxPrice) maxPrice = priceRaw;
    }
  });

  console.log(`Found ${validPriceCount} houses with valid prices`);
  console.log(`Raw min: $${minPrice.toLocaleString()}, Raw max: $${maxPrice.toLocaleString()}`);

  // Convert to thousands and round
  minPrice = Math.floor(minPrice / 1000);
  maxPrice = Math.ceil(maxPrice / 1000);

  console.log(`After converting to thousands: min=${minPrice}, max=${maxPrice}`);

  // Add some padding and round to nice numbers
  minPrice = Math.floor(minPrice / 50) * 50; // Round down to nearest 50K
  maxPrice = Math.ceil(maxPrice / 50) * 50;   // Round up to nearest 50K

  console.log(`After rounding to 50K: min=${minPrice}, max=${maxPrice}`);
  console.log(`Final price range: $${minPrice}K - $${maxPrice}K`);

  return { min: minPrice, max: maxPrice };
}

/**
 * Setup Price Slider
 * @param {Array} houses - Array of houses for calculating range
 * @param {Function} applyFiltersCallback - Callback to apply filters
 */
export function setupPriceSlider(houses, applyFiltersCallback) {
  const minSlider = document.getElementById('price-min');
  const maxSlider = document.getElementById('price-max');
  const selectedRange = document.getElementById('selected-range');
  const fill = document.getElementById('price-range-fill');

  // Calculate dynamic price range
  const priceRange = calculatePriceRange(houses);
  const rangeMin = priceRange.min;
  const rangeMax = priceRange.max;

  // Calculate appropriate step size (50K steps)
  const step = 50;

  // Update slider attributes
  minSlider.setAttribute('min', rangeMin);
  minSlider.setAttribute('max', rangeMax);
  minSlider.setAttribute('step', step);
  minSlider.value = rangeMin;

  maxSlider.setAttribute('min', rangeMin);
  maxSlider.setAttribute('max', rangeMax);
  maxSlider.setAttribute('step', step);
  maxSlider.value = rangeMax;

  console.log(`Setting slider range: ${rangeMin} - ${rangeMax}, step: ${step}`);
  console.log(`Slider values after set: min=${minSlider.value}, max=${maxSlider.value}`);

  // Update filter state defaults and store as default range
  setDefaultPriceRange(rangeMin, rangeMax);
  console.log(`Default price range set to: ${rangeMin} - ${rangeMax}`);

  // Update labels in HTML
  const labels = document.querySelectorAll('.flex.justify-between.text-sm.font-medium.text-gray-700.mb-3 span');
  if (labels.length >= 2) {
    labels[0].textContent = formatPrice(rangeMin);
    labels[1].textContent = formatPrice(rangeMax);
  }

  function updateSlider(triggerFilter = true) {
    let min = parseInt(minSlider.value);
    let max = parseInt(maxSlider.value);

    if (min > max) {
      [min, max] = [max, min];
      minSlider.value = min;
      maxSlider.value = max;
    }

    filterState.priceMin = min;
    filterState.priceMax = max;

    const formattedMin = formatPrice(min);
    const formattedMax = formatPrice(max);
    console.log(`updateSlider: min=${min} -> ${formattedMin}, max=${max} -> ${formattedMax}`);

    selectedRange.textContent = `${formattedMin} - ${formattedMax}`;

    const minPercent = ((min - rangeMin) / (rangeMax - rangeMin)) * 100;
    const maxPercent = ((max - rangeMin) / (rangeMax - rangeMin)) * 100;
    fill.style.left = `${minPercent}%`;
    fill.style.width = `${maxPercent - minPercent}%`;

    if (triggerFilter) {
      applyFiltersCallback();
    }
  }

  minSlider.addEventListener('input', () => updateSlider(true));
  maxSlider.addEventListener('input', () => updateSlider(true));
  updateSlider(false); // Initial setup - don't trigger filter
}

/**
 * Setup Search
 * @param {Function} applyFiltersCallback - Callback to apply filters
 */
export function setupSearch(applyFiltersCallback) {
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('clear-search');

  const debouncedSearch = debounce((value) => {
    filterState.search = value.toLowerCase();
    applyFiltersCallback();
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
    applyFiltersCallback();
  });
}

/**
 * Setup Amenities Dropdown
 */
export function setupAmenitiesDropdown() {
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

/**
 * Setup For Sale Filter
 * @param {Function} applyFiltersCallback - Callback to apply filters
 */
export function setupForSaleFilter(applyFiltersCallback) {
  document.querySelectorAll('input[name="forSale"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      filterState.forSale = e.target.value;
      applyFiltersCallback();
    });
  });
}

/**
 * Setup Community Features
 * @param {Function} applyFiltersCallback - Callback to apply filters
 */
export function setupCommunityFeatures(applyFiltersCallback) {
  document.getElementById('filter-gated').addEventListener('change', (e) => {
    filterState.gated = e.target.checked;
    applyFiltersCallback();
  });

  document.getElementById('filter-55plus').addEventListener('change', (e) => {
    filterState.age55Plus = e.target.checked;
    applyFiltersCallback();
  });
}

/**
 * Setup Clear All
 * @param {Function} applyFiltersCallback - Callback to apply filters
 */
export function setupClearAll(applyFiltersCallback) {
  document.getElementById('clear-all-filters').addEventListener('click', () => {
    // Reset state to defaults
    filterState.search = '';
    filterState.priceMin = defaultPriceRange.min;
    filterState.priceMax = defaultPriceRange.max;
    filterState.homeTypes = [];
    filterState.amenities = [];
    filterState.bedrooms = [];
    filterState.forSale = 'all';
    filterState.gated = false;
    filterState.age55Plus = false;

    // Reset UI
    document.getElementById('search-input').value = '';
    document.getElementById('clear-search').classList.add('hidden');
    document.getElementById('price-min').value = defaultPriceRange.min;
    document.getElementById('price-max').value = defaultPriceRange.max;
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

    applyFiltersCallback();
  });
}

// ========== FILTER APPLICATION FUNCTIONS ==========

/**
 * Apply Filters to Map
 * @param {mapboxgl.Map} map - The map instance
 * @param {Object} geojson - The GeoJSON data
 * @param {Function} getSelectedId - Function to get selected neighborhood ID
 * @param {Function} setSelectedId - Function to set selected neighborhood ID
 * @param {Function} closeDetails - Function to close details panel
 * @param {Function} updateFilterUICallback - Callback to update filter UI
 */
export function applyFilters(map, geojson, getSelectedId, setSelectedId, closeDetails, updateFilterUICallback) {
  console.log('🔍 applyFilters called', {
    priceMin: filterState.priceMin,
    priceMax: filterState.priceMax,
    defaultMin: defaultPriceRange.min,
    defaultMax: defaultPriceRange.max,
    homeTypes: filterState.homeTypes,
    bedrooms: filterState.bedrooms,
    forSale: filterState.forSale
  });

  // Clear selected polygon and close details panel when filtering
  if (getSelectedId() !== null) {
    map.setFeatureState(
      { source: 'neighborhoods', id: getSelectedId() },
      { selected: false }
    );
    setSelectedId(null);
  }
  closeDetails();

  const features = geojson.features;
  const allHouses = getHousesForSale();

  // Step 1: Check if we have house-based filters active
  const hasPriceFilter = filterState.priceMin !== defaultPriceRange.min || filterState.priceMax !== defaultPriceRange.max;
  const hasHouseFilters = filterState.homeTypes.length > 0 ||
                          filterState.bedrooms.length > 0 ||
                          hasPriceFilter;

  let matchingVillages = null;

  // Step 2: If house filters are active, filter houses and get matching villages
  if (hasHouseFilters && allHouses.length > 0) {
    let debugCount = 0; // For logging first few houses

    const filteredHouses = allHouses.filter(house => {
      let matches = true;

      // Home type filter
      if (filterState.homeTypes.length > 0) {
        matches = matches && filterState.homeTypes.includes(house.homeType);
      }

      // Bedroom filter - exact match
      if (filterState.bedrooms.length > 0) {
        const houseBeds = house.bedrooms || 0;
        const matchesBedrooms = filterState.bedrooms.some(range => {
          if (range === '1-2') return houseBeds >= 1 && houseBeds <= 2;
          if (range === '3-4') return houseBeds >= 3 && houseBeds <= 4;
          if (range === '5+') return houseBeds >= 5;
          return false;
        });
        matches = matches && matchesBedrooms;
      }

      // Price filter - use listingPricePure (already a number)
      if (hasPriceFilter) {
        // Use listingPricePure if available, otherwise parse listingPrice string
        const priceRaw = house.listingPricePure || parseFloat((house.listingPrice || '').replace(/[$,]/g, ''));
        const price = priceRaw / 1000; // Convert to thousands

        // If price filter is active, house must have valid price and be in range
        if (!price || price <= 0) {
          matches = false; // Reject houses without valid prices when filtering by price
        } else {
          const inRange = price >= filterState.priceMin && price <= filterState.priceMax;

          // Debug: Log first few houses when price filter is active
          if (debugCount < 5) {
            console.log(`House price check: $${priceRaw.toLocaleString()} (${price}K) - Range: ${filterState.priceMin}K-${filterState.priceMax}K - InRange: ${inRange}`);
            debugCount++;
          }

          matches = matches && inRange;
        }
      }

      return matches;
    });

    // Extract unique villages from filtered houses
    matchingVillages = new Set(filteredHouses.map(h => (h.village || '').toLowerCase()));
    console.log(`House filters: ${filteredHouses.length} houses in ${matchingVillages.size} neighborhoods`);
  }

  // Step 3: Apply neighborhood-based filters
  let matchedCount = 0;
  const matchedFeatures = [];

  features.forEach((feature, index) => {
    const props = feature.properties;
    let matches = true;

    // Search filter (neighborhood name only)
    if (filterState.search) {
      const name = (props.neighborhood || '').toLowerCase();
      matches = matches && name.includes(filterState.search);
    }

    // Amenities filter (neighborhood-level)
    if (matches && filterState.amenities.length > 0) {
      const propAmenities = props.amenities || [];
      matches = matches && filterState.amenities.every(amenity => propAmenities.includes(amenity));
    }

    // Community features
    if (matches && filterState.gated) {
      matches = matches && props.gated === true;
    }

    if (matches && filterState.age55Plus) {
      matches = matches && props.age55Plus === true;
    }

    // For Sale status filter (neighborhood-level)
    if (matches && filterState.forSale !== 'all') {
      if (filterState.forSale === 'new') {
        matches = matches && props.new_construction === true;
      } else if (filterState.forSale === 'existing') {
        matches = matches && props.new_construction === false;
      }
    }

    // Step 4: Intersect with house-based filters (if active)
    if (matches && matchingVillages !== null) {
      const neighborhoodName = (props.neighborhood || '').toLowerCase();
      matches = matches && matchingVillages.has(neighborhoodName);
    }

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

  updateMapVisibility(map);
  updateFilterUICallback(matchedCount, geojson);
  fitMapToMatches(map, matchedFeatures);
}

/**
 * Fit map to matched features
 * @param {mapboxgl.Map} map - The map instance
 * @param {Array} matchedFeatures - Array of matched features
 */
export function fitMapToMatches(map, matchedFeatures) {
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

/**
 * Update map visibility based on feature state
 * @param {mapboxgl.Map} map - The map instance
 */
export function updateMapVisibility(map) {
  // Note: Mapbox doesn't support feature-state in layer filters
  // So we use opacity to hide, but need to handle pointer events in event handlers
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

// ========== UI UPDATE FUNCTIONS ==========

/**
 * Update Filter UI
 * @param {number} matchedCount - Number of matched neighborhoods
 * @param {Object} geojson - The GeoJSON data
 */
export function updateFilterUI(matchedCount, geojson) {
  const totalFilters =
    filterState.homeTypes.length +
    filterState.amenities.length +
    filterState.bedrooms.length +
    (filterState.forSale !== 'all' ? 1 : 0) +
    (filterState.gated ? 1 : 0) +
    (filterState.age55Plus ? 1 : 0) +
    (filterState.search ? 1 : 0) +
    (filterState.priceMin !== defaultPriceRange.min || filterState.priceMax !== defaultPriceRange.max ? 1 : 0);

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

  updateResultsCounter(matchedCount, geojson);

  const noResults = document.getElementById('no-results');
  if (matchedCount === 0 && totalFilters > 0) {
    noResults.classList.remove('hidden');
  } else {
    noResults.classList.add('hidden');
  }
}

/**
 * Update Results Counter
 * @param {number} matchedCount - Number of matched neighborhoods
 * @param {Object} geojson - The GeoJSON data
 */
export function updateResultsCounter(matchedCount, geojson) {
  const total = geojson.features.length;
  const matched = matchedCount !== undefined ? matchedCount : total;
  document.getElementById('matched-count').textContent = matched;
  document.getElementById('total-count').textContent = total;
}

/**
 * Setup all filters
 * @param {Object} geojson - The GeoJSON data
 * @param {Array} houses - Array of houses for sale
 * @param {Function} applyFiltersCallback - Callback to apply filters
 */
export function setupFilters(geojson, houses, applyFiltersCallback) {
  // Initialize UI components
  populateHomeTypes(houses, applyFiltersCallback);
  populateAmenities(geojson, applyFiltersCallback);
  populateBedrooms(applyFiltersCallback);
  setupPriceSlider(houses, applyFiltersCallback);
  setupSearch(applyFiltersCallback);
  setupAmenitiesDropdown();
  setupForSaleFilter(applyFiltersCallback);
  setupCommunityFeatures(applyFiltersCallback);
  setupClearAll(applyFiltersCallback);

  // Initial display
  updateResultsCounter(undefined, geojson);
}

// ========== HELPER FUNCTIONS ==========

/**
 * Add amenity chip to selected amenities container
 * @param {string} amenity - The amenity name
 * @param {Function} onRemove - Callback when chip is removed
 */
export function addAmenityChip(amenity, onRemove) {
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
    onRemove();
  });

  container.appendChild(chip);
}

/**
 * Remove amenity chip from selected amenities container
 * @param {string} amenity - The amenity name
 */
export function removeAmenityChip(amenity) {
  const chip = document.querySelector(`#selected-amenities [data-amenity="${amenity}"]`);
  if (chip) chip.remove();
}

/**
 * Update amenities dropdown placeholder text
 */
export function updateAmenitiesPlaceholder() {
  const placeholder = document.getElementById('amenities-placeholder');
  const count = filterState.amenities.length;
  placeholder.textContent = count > 0 ? `${count} selected` : 'Select amenities...';
  placeholder.classList.toggle('text-[#676ACE]', count > 0);
  placeholder.classList.toggle('font-semibold', count > 0);
}
