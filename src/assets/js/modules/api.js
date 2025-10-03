/**
 * Wix Data API Integration
 */

import { items } from '@wix/data';
import { createClient, OAuthStrategy } from '@wix/sdk';

// Initialize Wix client
const wixClient = createClient({
  modules: { items },
  auth: OAuthStrategy({
    clientId: '7cbe278c-f794-4ac6-8261-404022bb5625',
  })
});

/**
 * Fetch houses for sale from Wix with pagination
 * Fetches all pages to get complete dataset
 * @returns {Promise<Array>} Array of all house items
 */
export async function fetchHousesForSale() {
  let allHouses = [];
  let pageCount = 0;

  console.log('Fetching houses for sale with pagination...');

  // Define only the fields we need to reduce payload size
  const requiredFields = [
    'homeType',
    'bedrooms',
    'bathrooms',
    'garages',
    'squareFeet',
    'listingPrice',
    'listingPricePure',
    'listPrice',
    'price',
    'village',
    'amenities',
    'link',
    'listingPrimaryImage',
    'fullAddress',
    'streetAddress'
  ];

  // Get first page
  let result = await wixClient.items
    .query('HousesforSale')
    .fields(...requiredFields)
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

