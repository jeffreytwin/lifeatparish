/**
 * Filter System
 */

import { filterState } from './state.js';
import { formatPrice, debounce } from './utils.js';

// ========== POPULATION FUNCTIONS ==========

/**
 * Populate Home Types from GeoJSON
 * @param {Function} applyFiltersCallback - Callback to apply filters
 */
export function populateHomeTypes(applyFiltersCallback) {
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
      applyFiltersCallback();
    });

    container.appendChild(btn);
  });
}

// ========== SETUP FUNCTIONS ==========

/**
 * Setup Price Slider
 * @param {Function} applyFiltersCallback - Callback to apply filters
 */
export function setupPriceSlider(applyFiltersCallback) {
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

    applyFiltersCallback();
  }

  minSlider.addEventListener('input', updateSlider);
  maxSlider.addEventListener('input', updateSlider);
  updateSlider(); // Initial setup
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

    applyFiltersCallback();
  });
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
