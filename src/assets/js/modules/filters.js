/**
 * Filter System
 */

import { filterState } from './state.js';

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
