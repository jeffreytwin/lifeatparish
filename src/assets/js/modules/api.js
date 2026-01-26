/**
 * Wix Data API Integration
 */

import { items } from '@wix/data';
import { createClient, OAuthStrategy } from '@wix/sdk';

// Initialize Wix client
const wixClient = createClient({
  modules: { items },
  auth: OAuthStrategy({
    clientId: window.config.wixClientId,
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

  // console.log('Fetching houses for sale with pagination...');

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
    .limit(300)
    .find();

  pageCount++;
  // console.log(`Page ${pageCount}: Fetched ${result.items.length} houses`);
  allHouses = allHouses.concat(result.items);

  // Fetch remaining pages
  while (result.hasNext()) {
    result = await result.next();
    pageCount++;
    // console.log(`Page ${pageCount}: Fetched ${result.items.length} houses`);
    allHouses = allHouses.concat(result.items);
  }

  // console.log(`✓ Fetched all houses: ${allHouses.length} total (${pageCount} pages)`);

  return allHouses;
}

/**
 * Fetch neighborhoods data from Wix
 * @returns {Promise<Array>} Array of neighborhood items
 */
export async function fetchNeighborhoods() {
  // Define only the fields we need to reduce payload size
  const requiredFields = [
    'link-copy-of-neighborhood-title', // Used for neighborhood page URLs
    'villageTitle',// Used for matching neighborhoods
    'topOfPageBackground',// Header image (details panel)
    'topBackgroundImage',// Background image (hover popup)
    'homeTypes',// Home type specs
    'houseIconImage',// Home type icon
    'bedroomRange',// Bedroom specs
    'garageSizeRange',// Garage specs
    'squareFeet',// Square feet specs
    'youTubeVideo',// YouTube video embed
    'villageShortDescription',// Neighborhood description
    'amenitiesTags',// List of amenity tags
    // Amenity images (only fetched if corresponding amenity tag exists)
    'clubhouseImage',
    'poolImage',
    'fitnessCenterImage',
    'gymImage',
    'pickleballImage',
    'bocceBallImage',
    'dogParkImage',
    'lifestyleDirectorImage',
    'totLotImage',
    'walkingPathsImage',
    'trailsImage',
    'tennisImage',
    'golfImage',
    'gatedImage',
    'ageRestrictedImage',
    'maintenanceIncludedImage'
  ];

  const result = await wixClient.items
    .query('HousesforSale-DynamicPages')
    .fields(...requiredFields)
    .limit(300)
    .find();

  console.group('DEBUG: Fetch Neighborhoods');
  console.log('Total neighborhoods fetched:', result.items?.length);

  // Check first 3 neighborhoods for amenitiesTags field
  result.items?.slice(0, 3).forEach((item, index) => {
    console.log(`Neighborhood ${index} (${item.villageTitle}):`, {
      hasAmenitiesTags: 'amenitiesTags' in item,
      amenitiesTags: item.amenitiesTags,
      isArray: Array.isArray(item.amenitiesTags),
      length: item.amenitiesTags?.length
    });
  });

  console.groupEnd();
  // console.log('items', result);
  return result.items;
}

/**
 * Fetch all floor plans and return both the full array and Set of village IDs
 * This determines which neighborhoods have new construction available
 * @returns {Promise<{plans: Array, villageIds: Set<string>}>} Object containing floor plans array and Set of village IDs
 */
export async function fetchFloorPlans() {
  let allFloorPlans = [];
  let pageCount = 0;

  // console.log('Fetching floor plans with pagination (quickMoveInAvailable=true only)...');

  // Define only the fields we need to reduce payload size
  const requiredFields = [
    'villages',// Used for creating Set of village IDs
    'village',// Used for matching neighborhoods
    'floorPlanPrice', // Used for price range calculations
    'floorPlanName' // Used for debugging/logging
  ];

  // Get first page - fetch only required fields
  // Filter for only quick move-in available properties
  let result = await wixClient.items
    .query('FloorPlans')
    .eq('quickMoveInAvailable', true)
    .fields(...requiredFields)
    .limit(300)
    .find();

  pageCount++;
  // console.log(`  Page ${pageCount}: Fetched ${result.items.length} floor plans`);
  allFloorPlans = allFloorPlans.concat(result.items);

  // Fetch remaining pages
  while (result.hasNext()) {
    result = await result.next();
    pageCount++;
    // console.log(`  Page ${pageCount}: Fetched ${result.items.length} floor plans`);
    allFloorPlans = allFloorPlans.concat(result.items);
  }

  // console.log(`✓ Fetched all floor plans: ${allFloorPlans.length} total (${pageCount} pages)`);

  // Log sample floor plan to verify structure
  // if (allFloorPlans.length > 0) {
  //   console.log('Sample floor plan structure:', {
  //     village: allFloorPlans[0].village,
  //     villages: allFloorPlans[0].villages,
  //     floorPlanPrice: allFloorPlans[0].floorPlanPrice,
  //     floorPlanName: allFloorPlans[0].floorPlanName
  //   });
  // }

  // Create a Set of unique village IDs that have floor plans
  const villagesWithFloorPlans = new Set(
    allFloorPlans
      .map(fp => fp.villages)
      .filter(id => id) // Filter out null/undefined
  );

  // console.log(`✓ Found ${villagesWithFloorPlans.size} unique neighborhoods with floor plans (new construction)`);

  return {
    plans: allFloorPlans,
    villageIds: villagesWithFloorPlans
  };
}