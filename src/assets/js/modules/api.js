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
    .query('neighborhoods')
    .find();

  console.log('items', result);
  return result.items;
}

/**
 * Fetch houses for sale from Wix with pagination
 * Fetches all pages to get complete dataset
 * @returns {Promise<Array>} Array of all house items
 */
export async function fetchHousesForSale() {
  let allHouses = [];
  let pageCount = 0;

  console.log('Fetching houses for sale with pagination...');

  // Get first page
  let result = await wixClient.items
    .query('HousesforSale')
    .find();

  pageCount++;
  console.log(`Page ${pageCount}: Fetched ${result.items.length} houses`);
  allHouses = allHouses.concat(result.items);

  // Fetch remaining pages
  while (result.hasNext()) {
    result = await result.next();
    pageCount++;
    console.log(`Page ${pageCount}: Fetched ${result.items.length} houses`);
    allHouses = allHouses.concat(result.items);
  }

  console.log(`✓ Fetched all houses: ${allHouses.length} total (${pageCount} pages)`);

  return allHouses;
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
