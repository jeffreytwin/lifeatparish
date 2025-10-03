/**
 * Centralized State Management
 */

/**
 * Filter state object - tracks all active filters
 */
export const filterState = {
  search: '',
  priceMin: 200,
  priceMax: 6000,
  homeTypes: [],
  amenities: [],
  bedrooms: [],
  forSale: 'all',
  gated: false,
  age55Plus: false
};

/**
 * Default price range (calculated from houses data)
 * Used to check if price filter is active
 */
export let defaultPriceRange = { min: 200, max: 6000 };

/**
 * Set default price range
 * @param {number} min - Minimum price in thousands
 * @param {number} max - Maximum price in thousands
 */
export function setDefaultPriceRange(min, max) {
  defaultPriceRange = { min, max };
  filterState.priceMin = min;
  filterState.priceMax = max;
}

/**
 * Selected neighborhood tracking
 */
let selectedNeighborhoodId = null;

/**
 * Get the currently selected neighborhood ID
 * @returns {number|null} The selected neighborhood ID or null
 */
export function getSelectedNeighborhoodId() {
  return selectedNeighborhoodId;
}

/**
 * Set the currently selected neighborhood ID
 * @param {number|null} id - The neighborhood ID to select, or null to clear
 */
export function setSelectedNeighborhoodId(id) {
  selectedNeighborhoodId = id;
}

/**
 * Houses for sale data storage
 */
let housesForSale = [];

/**
 * Get all houses for sale
 * @returns {Array} Array of house objects
 */
export function getHousesForSale() {
  return housesForSale;
}

/**
 * Set houses for sale data
 * @param {Array} houses - Array of house objects
 */
export function setHousesForSale(houses) {
  housesForSale = houses;
}
