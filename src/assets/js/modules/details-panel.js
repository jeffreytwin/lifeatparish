/**
 * Details Panel Management
 */

import { createImageCarousel } from './image-carousel.js';
import { filterState, getHousesForSale, defaultPriceRange } from './state.js';

let map = null;

/**
 * Initialize the details panel module with map instance
 * @param {mapboxgl.Map} mapInstance - The Mapbox map instance
 */
export function initDetailsPanel(mapInstance) {
  map = mapInstance;
  setupDetailsPanelClose();
}

/**
 * Show neighborhood details in the side panel
 * @param {Object} neighborhood - Neighborhood properties from GeoJSON
 */
export function showNeighborhoodDetails(neighborhood) {
  const panel = document.getElementById('neighborhood-details');
  const mapContainer = document.getElementById('map');

  if (!panel) {
    console.error('Details panel not found!');
    return;
  }

  // Populate panel content
  const headerElement = document.querySelector('.details-header');
  headerElement.innerHTML = '';

  // Add neighborhood title
  const title = document.createElement('h2');
  title.className = 'text-2xl font-bold text-gray-900 mb-2';
  title.textContent = neighborhood.neighborhood || 'Neighborhood';
  headerElement.appendChild(title);

  // Add neighborhood stats (price range, home types)
  const statsContainer = document.createElement('div');
  statsContainer.className = 'space-y-1 mb-3';

  if (neighborhood.price_range) {
    const priceRow = document.createElement('div');
    priceRow.className = 'flex items-center gap-2 text-xs';
    priceRow.innerHTML = `
      <span class="font-semibold text-gray-600">Price Range:</span>
      <span class="text-gray-900 font-medium">${neighborhood.price_range}</span>
    `;
    statsContainer.appendChild(priceRow);
  }

  headerElement.appendChild(statsContainer);

  // Add detailed specs with icons (bedrooms, bathrooms, garage, sqft)
  const specsContainer = document.createElement('div');
  specsContainer.className = 'flex flex-wrap gap-3 mb-3 text-xs';

  if (neighborhood.bedrooms) {
    const bedsSpec = document.createElement('div');
    bedsSpec.className = 'flex items-center gap-1';
    bedsSpec.innerHTML = `
      <svg class="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 640 512"><path d="M32 32c17.7 0 32 14.3 32 32V320H288V160c0-17.7 14.3-32 32-32H544c53 0 96 43 96 96V448c0 17.7-14.3 32-32 32s-32-14.3-32-32V416H352 320 64v32c0 17.7-14.3 32-32 32s-32-14.3-32-32V64C0 46.3 14.3 32 32 32zm144 96a80 80 0 1 1 0 160 80 80 0 1 1 0-160z"/></svg>
      <span class="font-semibold text-gray-700">${neighborhood.bedrooms} bedrooms</span>
    `;
    specsContainer.appendChild(bedsSpec);
  }

  if (neighborhood.bathrooms) {
    const bathsSpec = document.createElement('div');
    bathsSpec.className = 'flex items-center gap-1';
    bathsSpec.innerHTML = `
      <svg class="w-3 h-3 text-teal-600" fill="currentColor" viewBox="0 0 512 512"><path d="M96 77.3c0-7.3 5.9-13.3 13.3-13.3c3.5 0 6.9 1.4 9.4 3.9l14.9 14.9C130 91.8 128 101.7 128 112c0 19.9 7.2 38 19.2 52c-5.3 9.2-4 21.1 3.8 29c9.4 9.4 24.6 9.4 33.9 0L289 89c9.4-9.4 9.4-24.6 0-33.9c-7.9-7.9-19.8-9.1-29-3.8C246 39.2 227.9 32 208 32c-10.3 0-20.2 2-29.2 5.5L163.9 22.6C149.4 8.1 129.7 0 109.3 0C66.6 0 32 34.6 32 77.3V256c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H96V77.3zM32 352v16c0 28.4 12.4 54 32 71.6V480c0 17.7 14.3 32 32 32s32-14.3 32-32V464H384v16c0 17.7 14.3 32 32 32s32-14.3 32-32V439.6c19.6-17.6 32-43.1 32-71.6V352H32z"/></svg>
      <span class="font-semibold text-gray-700">${neighborhood.bathrooms} bathrooms</span>
    `;
    specsContainer.appendChild(bathsSpec);
  }

  if (neighborhood.garage) {
    const garageSpec = document.createElement('div');
    garageSpec.className = 'flex items-center gap-1';
    garageSpec.innerHTML = `
      <svg class="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 640 512"><path d="M171.3 96H224v96H111.3l30.4-75.9C146.5 104 158.2 96 171.3 96zM272 192V96h81.2c9.7 0 18.9 4.4 25 12l67.2 84H272zm256.2 1L428.2 68c-18.2-22.8-45.8-36-75-36H171.3c-39.3 0-74.6 23.9-89.1 60.3L40.6 196.4C16.8 205.8 0 228.9 0 256V368c0 17.7 14.3 32 32 32H65.3c7.6 45.4 47.1 80 94.7 80s87.1-34.6 94.7-80H385.3c7.6 45.4 47.1 80 94.7 80s87.1-34.6 94.7-80H608c17.7 0 32-14.3 32-32V320c0-65.2-48.8-119-111.8-127zM434.7 368a48 48 0 1 1 90.5 32 48 48 0 1 1 -90.5-32zM160 336a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"/></svg>
      <span class="font-semibold text-gray-700">${neighborhood.garage}</span>
    `;
    specsContainer.appendChild(garageSpec);
  }

  if (neighborhood.home_size) {
    const sizeSpec = document.createElement('div');
    sizeSpec.className = 'flex items-center gap-1';
    sizeSpec.innerHTML = `
      <svg class="w-3 h-3 text-amber-600" fill="currentColor" viewBox="0 0 512 512"><path d="M344 0H488c13.3 0 24 10.7 24 24V168c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39-87 87c-9.4 9.4-24.6 9.4-33.9 0l-32-32c-9.4-9.4-9.4-24.6 0-33.9l87-87L327 41c-6.9-6.9-8.9-17.2-5.2-26.2S334.3 0 344 0zM168 512H24c-13.3 0-24-10.7-24-24V344c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2l39 39 87-87c9.4-9.4 24.6-9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8z"/></svg>
      <span class="font-semibold text-gray-700">${neighborhood.home_size}</span>
    `;
    specsContainer.appendChild(sizeSpec);
  }

  headerElement.appendChild(specsContainer);

  // Add amenity tags to header
  if (neighborhood.amenities && Array.isArray(neighborhood.amenities)) {
    const amenitiesContainer = document.createElement('div');
    amenitiesContainer.className = 'flex flex-wrap gap-1.5';

    neighborhood.amenities.forEach(amenity => {
      const badge = document.createElement('div');
      badge.className = 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm';
      badge.textContent = amenity;
      amenitiesContainer.appendChild(badge);
    });

    headerElement.appendChild(amenitiesContainer);
  }

  // Filter and display houses for this neighborhood
  const filteredHouses = filterHousesByNeighborhood(neighborhood.neighborhood);
  renderHouseCards(filteredHouses);

  // Show panel with animation
  panel.classList.add('open');
  mapContainer.classList.add('panel-open');

  // Resize map to fit new container size
  if (map) {
    setTimeout(() => {
      map.resize();
    }, 300); // Wait for transition to complete
  }
}

/**
 * Close the details panel
 */
export function closeDetailsPanel() {
  const panel = document.getElementById('neighborhood-details');
  const mapContainer = document.getElementById('map');

  panel.classList.remove('open');
  mapContainer.classList.remove('panel-open');

  // Resize map to fit new container size
  if (map) {
    setTimeout(() => {
      map.resize();
    }, 300); // Wait for transition to complete
  }
}

/**
 * Setup close button event listener
 */
function setupDetailsPanelClose() {
  const closeBtn = document.querySelector('.details-close');

  // Close button click
  closeBtn.onclick = () => {
    closeDetailsPanel();
  };
}

/**
 * Filter houses by neighborhood and current filter state
 * @param {string} neighborhoodName - Name of the neighborhood
 * @returns {Array} Filtered array of houses
 */
function filterHousesByNeighborhood(neighborhoodName) {
  const allHouses = getHousesForSale();

  return allHouses.filter(house => {
    // Match using the village field
    const houseVillage = house.village || '';
    if (houseVillage.toLowerCase() !== neighborhoodName.toLowerCase()) return false;

    // Apply bedroom filter (updated ranges: 1-2, 3-4, 5+)
    if (filterState.bedrooms.length > 0) {
      const houseBeds = house.bedrooms || 0;
      const matchesBedrooms = filterState.bedrooms.some(range => {
        if (range === '1-2') return houseBeds >= 1 && houseBeds <= 2;
        if (range === '3-4') return houseBeds >= 3 && houseBeds <= 4;
        if (range === '5+') return houseBeds >= 5;
        return false;
      });
      if (!matchesBedrooms) return false;
    }

    // Apply garage filter
    if (filterState.garages.length > 0) {
      const garageStr = house.garages || '';
      const garageCount = parseInt(garageStr) || 0;
      const matchesGarages = filterState.garages.some(range => {
        if (range === '1-2') return garageCount >= 1 && garageCount <= 2;
        if (range === '3-4') return garageCount >= 3 && garageCount <= 4;
        if (range === '5+') return garageCount >= 5;
        return false;
      });
      if (!matchesGarages) return false;
    }

    // Apply price filter
    const hasPriceFilter = filterState.priceMin !== defaultPriceRange.min || filterState.priceMax !== defaultPriceRange.max;
    if (hasPriceFilter) {
      const priceRaw = house.listingPricePure || parseFloat((house.listingPrice || '').replace(/[$,]/g, ''));
      const price = priceRaw / 1000; // Convert to thousands

      if (!price || price <= 0) {
        return false; // Reject houses without valid prices
      }

      if (price < filterState.priceMin || price > filterState.priceMax) {
        return false; // Reject houses outside price range
      }
    }

    // Apply amenities filter
    if (filterState.amenities.length > 0) {
      const houseAmenities = house.amenities || [];
      const hasAllAmenities = filterState.amenities.every(amenity =>
        houseAmenities.includes(amenity)
      );
      if (!hasAllAmenities) return false;
    }

    // Note: For Sale filter (new construction vs existing) is neighborhood-based,
    // so if we're viewing a neighborhood, it already matches the forSale criteria.
    // No need to filter individual houses by this.

    return true;
  });
}

/**
 * Render house cards in the details panel
 * @param {Array} houses - Array of house objects to display
 */
function renderHouseCards(houses) {
  // Find or create houses container
  let housesContainer = document.getElementById('houses-for-sale-container');

  if (!housesContainer) {
    // Create houses section if it doesn't exist
    const detailsContent = document.querySelector('.details-content');
    housesContainer = document.createElement('div');
    housesContainer.id = 'houses-for-sale-container';
    housesContainer.className = 'details-section';
    detailsContent.appendChild(housesContainer);
  }

  // Clear existing content
  housesContainer.innerHTML = '';

  // Add section title
  const title = document.createElement('h3');
  title.className = 'text-lg font-bold text-gray-900 mb-4';
  title.textContent = `Homes for Sale (${houses.length})`;
  housesContainer.appendChild(title);

  // Show message if no houses
  if (houses.length === 0) {
    const noHousesMsg = document.createElement('p');
    noHousesMsg.className = 'text-gray-500 text-center py-8';
    noHousesMsg.textContent = 'No homes match your current filters. Try adjusting your filters or explore other neighborhoods.';
    housesContainer.appendChild(noHousesMsg);
    return;
  }

  // Create cards container
  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'space-y-4';

  // Render each house card
  houses.forEach(house => {
    const card = createHouseCard(house);
    cardsContainer.appendChild(card);
  });

  housesContainer.appendChild(cardsContainer);
}

/**
 * Extract image URLs from Wix listingImageGallery
 * @param {Array} imageGallery - Array of Wix image objects
 * @returns {Array<string>} Array of image URLs
 */
function extractImageUrls(imageGallery) {
  if (!imageGallery || !Array.isArray(imageGallery)) return [];

  return imageGallery
    .filter(img => img.type === 'Image' && img.src)
    .map(img => {
      // Convert Wix image format to usable URL
      const src = img.src;
      if (src.startsWith('wix:image://')) {
        // Extract the image ID (the part before the slash after v1/)
        // Format: wix:image://v1/32a977_XXXXX~mv2.jpeg/filename.jpeg
        const match = src.match(/wix:image:\/\/v1\/(.*?)\/(.*?)#/);
        if (match) {
          const imageId = match[1]; // e.g., "32a977_5d0782add1114e3baac09fe38627f662~mv2.jpeg"
          // Use Wix's image service URL with proper format
          return `https://static.wixstatic.com/media/${imageId}`;
        }
      }
      return src;
    });
}

/**
 * Get amenity icon SVG
 * @param {string} amenity - Amenity name
 * @returns {string} SVG icon HTML
 */
function getAmenityIcon(amenity) {
  const icons = {
    'Clubhouse': '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>',
    'Gym': '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 640 512"><path d="M96 64c0-17.7 14.3-32 32-32h32c17.7 0 32 14.3 32 32V224v64V448c0 17.7-14.3 32-32 32H128c-17.7 0-32-14.3-32-32V384H64c-17.7 0-32-14.3-32-32V288c-17.7 0-32-14.3-32-32s14.3-32 32-32V160c0-17.7 14.3-32 32-32H96V64zm448 0v64h32c17.7 0 32 14.3 32 32v64c17.7 0 32 14.3 32 32s-14.3 32-32 32v64c0 17.7-14.3 32-32 32H544v64c0 17.7-14.3 32-32 32H480c-17.7 0-32-14.3-32-32V288 224 64c0-17.7 14.3-32 32-32h32c17.7 0 32 14.3 32 32zM416 224v64H224V224H416z"/></svg>',
    'Pickleball': '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 512 512"><path d="M511.8 267.4c-26.1 8.7-53.4 13.8-81 15.1c9.2-105.3-31.5-204.2-103.2-272.4C434.1 41.1 512 139.5 512 256c0 3.8-.1 7.6-.2 11.4zm-3.9 34.7c-5.8 32-17.6 62-34.2 88.7c-97.5 48.5-217.7 42.6-311.9-24.5c23.7-36.2 55.4-67.7 94.5-91.8c79.9 43.2 170.1 50.8 251.6 27.6zm-236-55.5c-2.5-90.9-41.1-172.7-101.9-231.7C196.8 5.2 225.8 0 256 0c2.7 0 5.3 .1 7.9 .2c90.8 60.2 145.7 167.2 134.7 282.3c-43.1-2.4-86.4-14.1-126.8-35.9zM138 28.8c20.6 18.3 38.7 39.4 53.7 62.6C95.9 136.1 30.6 220.8 7.3 316.9C2.5 297.4 0 277 0 256C0 157.2 56 71.5 138 28.8zm69.6 90.5c19.5 38.6 31 81.9 32.2 127.7C162.2 294.6 110.9 368.9 90.2 451C66 430.4 45.6 405.4 30.4 377.2c6.7-108.7 71.9-209.9 177.1-257.9zM256 512c-50.7 0-98-14.7-137.8-40.2c5.6-27 14.8-53.1 27.4-77.7C232.2 454.6 338.1 468.8 433 441c-46 44-108.3 71-177 71z"/></svg>',
    'Trails': '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 576 512"><path d="M288 0c17.7 0 32 14.3 32 32V96c0 17.7-14.3 32-32 32s-32-14.3-32-32V32c0-17.7 14.3-32 32-32zM209.6 5.4c13.3 9.1 16.7 27.3 7.6 40.6L168.8 112c-9.1 13.3-27.3 16.7-40.6 7.6s-16.7-27.3-7.6-40.6L169 13c9.1-13.3 27.3-16.7 40.6-7.6zm193.4 7.6c9.1 13.3 5.7 31.5-7.6 40.6s-31.5 5.7-40.6-7.6L306.4 46c-9.1-13.3-5.7-31.5 7.6-40.6s31.5-5.7 40.6 7.6l48.4 66zM120 256c0-53 43-96 96-96h16V104c0-13.3 10.7-24 24-24s24 10.7 24 24v56h16c53 0 96 43 96 96s-43 96-96 96H240v32 24c0 13.3-10.7 24-24 24s-24-10.7-24-24V384 352H176c-53 0-96-43-96-96zm96-48c-26.5 0-48 21.5-48 48s21.5 48 48 48h80 80c26.5 0 48-21.5 48-48s-21.5-48-48-48H296 216 176z"/></svg>',
    'Playground': '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 640 512"><path d="M144 16C144 7.16 151.2 0 160 0C168.8 0 176 7.16 176 16V32C176 40.84 168.8 48 160 48C151.2 48 144 40.84 144 32V16zM112 32C103.2 32 96 39.16 96 48C96 56.84 103.2 64 112 64H208C216.8 64 224 56.84 224 48C224 39.16 216.8 32 208 32H112zM112 160H128V128C128 109.6 142.3 94.85 160 94.85C177.7 94.85 192 109.6 192 128V160H208C216.8 160 224 152.8 224 144V128C224 92.65 195.3 64 160 64C124.7 64 96 92.65 96 128V144C96 152.8 103.2 160 112 160zM192 288H384V272C384 245.5 362.5 224 336 224H240C213.5 224 192 245.5 192 272V288zM144 160V272C144 290.7 146.6 308.8 151.4 326.1L106.4 486.2C101.9 501.8 110.4 518.3 126 522.8C141.6 527.4 158.1 518.8 162.6 503.2L205 351.8C221.2 374.3 245.7 390.9 274.1 397.7L230.2 511.9C223 527.1 229.7 544.4 244.9 551.7C260.1 558.9 277.4 552.3 284.6 537.1L331.2 417.6C336.7 418.5 342.3 419 348.1 419C353.9 419 359.5 418.5 364.1 417.6L411.4 537.1C418.6 552.3 435.9 558.9 451.1 551.7C466.3 544.4 472.1 527.1 465.8 511.9L421 397.7C450.3 390.9 474.8 374.3 490.1 351.8L533.4 503.2C537.9 518.8 554.4 527.4 569.1 522.8C585.6 518.3 594.1 501.8 589.6 486.2L544.6 326.1C549.4 308.8 552 290.7 552 272V160H576C584.8 160 592 152.8 592 144C592 135.2 584.8 128 576 128H544V48C544 39.16 536.8 32 528 32H416V64H512V128H528C536.8 128 544 135.2 544 144V272C544 333.9 493.9 384 432 384H264C202.1 384 152 333.9 152 272V144C152 135.2 159.2 128 168 128H184V64H160V128H128C119.2 128 112 135.2 112 144C112 152.8 119.2 160 128 160H152z"/></svg>',
    'Pool': '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 576 512"><path d="M309.5 178.4L447.9 297.1c-1.6 .9-3.2 2-4.8 3c-18 12.4-40.1 20.3-59.2 20.3c-19.6 0-40.8-7.7-59.2-20.3c-22.1-15.5-51.6-15.5-73.7 0c-17.1 11.8-38 20.3-59.2 20.3c-10.1 0-21.1-2.2-31.9-6.2C163.1 193.2 262.2 96 384 96c14.7 0 29.2 1.4 43.4 4.1L320 230.8c-11.1 9.7-22 20-32.5 30.8zM384 32c-119.5 0-217.4 86.5-237.8 200.1C123.4 224.7 100.4 224 80 224c-35.3 0-64 28.7-64 64s28.7 64 64 64c35.3 0 64.1-28.7 64.1-64c18.3 5.3 35.9 8.4 52.8 8.4c13.2 0 26.7-2.8 39.5-8.6c14.7-6.7 27.8-17.1 38.8-29.8c10.1-11.7 18.2-25.9 24-41.4c6.7-17.9 10.4-37.5 10.4-57.7c0-6.9-.4-13.7-1.1-20.4L448 352c0 35.3 28.7 64 64 64s64-28.7 64-64s-28.7-64-64-64c-17.5 0-33.2 7-44.7 18.3L350.8 175.5c-1.8-14.4-5.1-28.5-9.8-41.9C383.9 127.1 416 96 416 96c0-53-86-96-146.3-96z"/></svg>',
    'Gated': '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 448 512"><path d="M144 144v48H304V144c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192V144C80 64.5 144.5 0 224 0s144 64.5 144 144v48h16c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V256c0-35.3 28.7-64 64-64H80z"/></svg>',
    'Golf': '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 576 512"><path d="M96 0C113.7 0 128 14.33 128 32V480C128 497.7 113.7 512 96 512C78.33 512 64 497.7 64 480V32C64 14.33 78.33 0 96 0zM416 176C416 140.7 387.3 112 352 112H192V240H352C387.3 240 416 211.3 416 176zM192 288V416H416C469 416 512 373 512 320V288H192z"/></svg>'
  };

  // Return icon or a default one
  return icons[amenity] || '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"/></svg>';
}

/**
 * Get amenity badge color
 * @param {string} amenity - Amenity name
 * @returns {string} Tailwind color classes
 */
function getAmenityColor(amenity) {
  const colors = {
    'Clubhouse': 'bg-orange-400',
    'Gym': 'bg-indigo-500',
    'Pickleball': 'bg-teal-400',
    'Trails': 'bg-green-500',
    'Playground': 'bg-pink-500',
    'Pool': 'bg-blue-400',
    'Gated': 'bg-purple-500',
    'Golf': 'bg-emerald-500'
  };

  return colors[amenity] || 'bg-gray-500';
}

/**
 * Create a single house card element
 * @param {Object} house - House object with properties
 * @returns {HTMLElement} House card element
 */
function createHouseCard(house) {
  const card = document.createElement('div');
  card.className = 'bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden';

  // Make card clickable (except carousel)
  card.addEventListener('click', () => {
    if (house.link) {
      window.open(house.link, '_blank');
    }
  });

  // Image container wrapper
  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'relative';

  // Extract images from listingImageGallery (limit to 2)
  const images = extractImageUrls(house.listingImageGallery).slice(0, 2);

  // Create image carousel
  const carousel = createImageCarousel(images, house.fullAddress || house.streetAddress || 'House');
  imageWrapper.appendChild(carousel);

  // Amenity badges overlay on image
  if (house.amenities && house.amenities.length > 0) {
    const amenitiesBadges = document.createElement('div');
    amenitiesBadges.className = 'absolute bottom-3 left-3 right-3 flex flex-wrap gap-2';

    house.amenities.slice(0, 3).forEach(amenity => {
      const badge = document.createElement('div');
      badge.className = `${getAmenityColor(amenity)} text-white px-3 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg`;
      badge.innerHTML = `
        ${getAmenityIcon(amenity)}
        <span>${amenity}</span>
      `;
      amenitiesBadges.appendChild(badge);
    });

    imageWrapper.appendChild(amenitiesBadges);
  }

  card.appendChild(imageWrapper);

  // Card content
  const content = document.createElement('div');
  content.className = 'p-5';

  // Price
  const price = document.createElement('div');
  price.className = 'text-4xl font-bold text-[#676ACE] mb-3';
  const priceValue = house.listingPrice || house.listPrice || house.price;
  price.textContent = priceValue || 'Contact for price';
  content.appendChild(price);

  // Beds, Baths, Sqft - smaller fonts with colors
  const specs = document.createElement('div');
  specs.className = 'flex gap-4 mb-4';

  if (house.bedrooms) {
    const bedItem = document.createElement('div');
    bedItem.className = 'flex items-center gap-1';
    bedItem.innerHTML = `
      <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 640 512"><path d="M32 32c17.7 0 32 14.3 32 32V320H288V160c0-17.7 14.3-32 32-32H544c53 0 96 43 96 96V448c0 17.7-14.3 32-32 32s-32-14.3-32-32V416H352 320 64v32c0 17.7-14.3 32-32 32s-32-14.3-32-32V64C0 46.3 14.3 32 32 32zm144 96a80 80 0 1 1 0 160 80 80 0 1 1 0-160z"/></svg>
      <span class="text-sm font-semibold text-gray-700">${house.bedrooms} Beds</span>
    `;
    specs.appendChild(bedItem);
  }

  if (house.bathrooms) {
    const bathItem = document.createElement('div');
    bathItem.className = 'flex items-center gap-1';
    bathItem.innerHTML = `
      <svg class="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 512 512"><path d="M96 77.3c0-7.3 5.9-13.3 13.3-13.3c3.5 0 6.9 1.4 9.4 3.9l14.9 14.9C130 91.8 128 101.7 128 112c0 19.9 7.2 38 19.2 52c-5.3 9.2-4 21.1 3.8 29c9.4 9.4 24.6 9.4 33.9 0L289 89c9.4-9.4 9.4-24.6 0-33.9c-7.9-7.9-19.8-9.1-29-3.8C246 39.2 227.9 32 208 32c-10.3 0-20.2 2-29.2 5.5L163.9 22.6C149.4 8.1 129.7 0 109.3 0C66.6 0 32 34.6 32 77.3V256c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H96V77.3zM32 352v16c0 28.4 12.4 54 32 71.6V480c0 17.7 14.3 32 32 32s32-14.3 32-32V464H384v16c0 17.7 14.3 32 32 32s32-14.3 32-32V439.6c19.6-17.6 32-43.1 32-71.6V352H32z"/></svg>
      <span class="text-sm font-semibold text-gray-700">${house.bathrooms} Baths</span>
    `;
    specs.appendChild(bathItem);
  }

  if (house.squareFeet) {
    const sqftItem = document.createElement('div');
    sqftItem.className = 'flex items-center gap-1';
    sqftItem.innerHTML = `
      <svg class="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 512 512"><path d="M344 0H488c13.3 0 24 10.7 24 24V168c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39-87 87c-9.4 9.4-24.6 9.4-33.9 0l-32-32c-9.4-9.4-9.4-24.6 0-33.9l87-87L327 41c-6.9-6.9-8.9-17.2-5.2-26.2S334.3 0 344 0zM168 512H24c-13.3 0-24-10.7-24-24V344c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2l39 39 87-87c9.4-9.4 24.6-9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8z"/></svg>
      <span class="text-sm font-semibold text-gray-700">${house.squareFeet.toLocaleString()} Sq. Ft.</span>
    `;
    specs.appendChild(sqftItem);
  }

  content.appendChild(specs);

  // Address
  const address = document.createElement('div');
  address.className = 'text-gray-600 text-lg';
  address.textContent = house.fullAddress || house.streetAddress || '';
  content.appendChild(address);

  card.appendChild(content);
  return card;
}
