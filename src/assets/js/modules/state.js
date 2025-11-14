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
  garages: [],
  forSale: 'all'
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

/**
 * Neighborhoods data storage (from Wix)
 */
let neighborhoodsData = [];

/**
 * Get all neighborhoods data
 * @returns {Array} Array of neighborhood objects
 */
export function getNeighborhoodsData() {
  return neighborhoodsData;
}

/**
 * Set neighborhoods data
 * @param {Array} neighborhoods - Array of neighborhood objects
 */
export function setNeighborhoodsData(neighborhoods) {
  neighborhoodsData = neighborhoods;
}

/**
 * Floor plans data storage (Set of village IDs with floor plans)
 * Used to determine which neighborhoods have new construction
 */
let villagesWithFloorPlans = new Set();

/**
 * Get villages with floor plans
 * @returns {Set<string>} Set of village IDs that have floor plans
 */
export function getVillagesWithFloorPlans() {
  return villagesWithFloorPlans;
}

/**
 * Set villages with floor plans
 * @param {Set<string>} villages - Set of village IDs
 */
export function setVillagesWithFloorPlans(villages) {
  villagesWithFloorPlans = villages;
}

/**
 * Floor plans array storage (full floor plan objects)
 * Used for price range calculations and displaying floor plan details
 */
let floorPlans = [];

/**
 * Get floor plans array
 * @returns {Array} Array of floor plan objects
 */
export function getFloorPlans() {
  return floorPlans;
}

/**
 * Set floor plans array
 * @param {Array} plans - Array of floor plan objects
 */
export function setFloorPlans(plans) {
  floorPlans = plans;
  console.log('✓ Floor plans stored in state:', floorPlans.length, 'plans');
}
