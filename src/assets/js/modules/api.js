/**
 * Wix Data API Integration
 */

import { collections, items } from '@wix/data';
import { createClient, OAuthStrategy } from '@wix/sdk';

// Initialize Wix client
const wixClient = createClient({
  modules: { items, collections },
  auth: OAuthStrategy({
    clientId: '7cbe278c-f794-4ac6-8261-404022bb5625',
  })
});

/**
 * Fetch neighborhoods data from Wix
 * @returns {Promise<Array>} Array of neighborhood items
 */
export async function fetchNeighborhoods() {
  const result = await wixClient.items
    .query('Realtors')
    .find();

  console.log('items', result);
  return result.items;
}

/**
 * Fetch houses for sale from Wix
 * @returns {Promise<Array>} Array of house items
 */
export async function fetchHousesForSale() {
  const result = await wixClient.items
    .query('HousesforSale')
    .find();

  console.log('Houses for sale', { result });
  return result.items;
}

/**
 * Fetch floor plans from Wix
 * @returns {Promise<Array>} Array of floor plan items
 */
export async function fetchFloorPlans() {
  const result = await wixClient.items
    .query('FloorPlans')
    .find();

  console.log('floor plans', { result });
  return result.items;
}
