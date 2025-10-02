/**
 * Details Panel Management
 */

import { getHousesForSale } from './state.js';
import { filterState } from './state.js';
import { createImageCarousel } from './image-carousel.js';

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
  document.querySelector('.details-title').textContent = neighborhood.neighborhood || 'Neighborhood';

  // Price range
  const priceRange = document.getElementById('price-range');
  priceRange.textContent = neighborhood.price_range || 'Contact for pricing';

  // Home types - no data in Phase 2A GeoJSON
  const homeTypes = document.getElementById('home-types');
  homeTypes.textContent = 'Available in multiple styles';

  // Amenities
  const amenitiesList = document.getElementById('amenities-list');
  amenitiesList.innerHTML = '';
  if (neighborhood.amenities && Array.isArray(neighborhood.amenities)) {
    neighborhood.amenities.forEach(amenity => {
      const chip = document.createElement('span');
      chip.className = 'amenity-chip';
      chip.textContent = amenity;
      amenitiesList.appendChild(chip);
    });
  }

  // Description (using available data)
  const description = document.getElementById('description');
  const descParts = [];
  if (neighborhood.bedrooms) descParts.push(`${neighborhood.bedrooms} bedrooms`);
  if (neighborhood.bathrooms) descParts.push(`${neighborhood.bathrooms} bathrooms`);
  if (neighborhood.garage) descParts.push(`${neighborhood.garage} garage`);
  if (neighborhood.home_size) descParts.push(`${neighborhood.home_size}`);
  description.textContent = descParts.length > 0 ? descParts.join(' • ') : 'Beautiful neighborhood in Parrish, FL';

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

    // Apply bedroom filter
    if (filterState.bedrooms.length > 0) {
      const houseBeds = house.bedrooms || 0;
      const matchesBedrooms = filterState.bedrooms.some(range => {
        if (range === '2-3') return houseBeds >= 2 && houseBeds <= 3;
        if (range === '3-4') return houseBeds >= 3 && houseBeds <= 4;
        if (range === '4-5') return houseBeds >= 4 && houseBeds <= 5;
        if (range === '5+') return houseBeds >= 5;
        return false;
      });
      if (!matchesBedrooms) return false;
    }

    // Apply amenities filter
    if (filterState.amenities.length > 0) {
      const houseAmenities = house.amenities || [];
      const hasAllAmenities = filterState.amenities.every(amenity =>
        houseAmenities.includes(amenity)
      );
      if (!hasAllAmenities) return false;
    }

    // Apply for sale filter (new construction vs existing)
    if (filterState.forSale !== 'all') {
      if (filterState.forSale === 'new' && !house.new_construction) return false;
      if (filterState.forSale === 'existing' && house.new_construction) return false;
    }

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
          const filename = match[2]; // e.g., "395ef002-b0fb-4a28-a599-45063da843af.jpeg"

          // Use Wix's image service URL with proper format
          return `https://static.wixstatic.com/media/${imageId}`;
        }
      }
      return src;
    });
}

/**
 * Create a single house card element
 * @param {Object} house - House object with properties
 * @returns {HTMLElement} House card element
 */
function createHouseCard(house) {
  const card = document.createElement('div');
  card.className = 'bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer overflow-hidden';

  // Make card clickable (except carousel)
  card.addEventListener('click', () => {
    if (house.link) {
      window.open(house.link, '_blank');
    }
  });

  // Extract images from listingImageGallery
  const images = extractImageUrls(house.listingImageGallery);

  // Create image carousel
  const carousel = createImageCarousel(images, house.fullAddress || house.streetAddress || 'House');
  card.appendChild(carousel);

  // Card content
  const content = document.createElement('div');
  content.className = 'p-4';

  // Price
  const price = document.createElement('div');
  price.className = 'text-2xl font-bold text-[#676ACE] mb-2';
  const priceValue = house.listPrice || house.price;
  price.textContent = priceValue ? `$${parseFloat(priceValue).toLocaleString()}` : 'Contact for price';
  content.appendChild(price);

  // Beds, Baths, Sqft
  const specs = document.createElement('div');
  specs.className = 'flex items-center gap-4 text-gray-600 mb-3';
  const specItems = [];
  if (house.bedrooms) specItems.push(`${house.bedrooms} Beds`);
  if (house.bathrooms) specItems.push(`${house.bathrooms} Baths`);
  // squareFeet is a string with commas like "4,097"
  if (house.squareFeet) specItems.push(`${house.squareFeet} Sq. Ft.`);
  specs.textContent = specItems.join('  •  ');
  content.appendChild(specs);

  // Address
  const address = document.createElement('div');
  address.className = 'text-gray-700 font-medium mb-3';
  address.textContent = house.fullAddress || house.streetAddress || '';
  content.appendChild(address);

  // Amenities (if any)
  if (house.amenities && house.amenities.length > 0) {
    const amenitiesContainer = document.createElement('div');
    amenitiesContainer.className = 'flex flex-wrap gap-2';

    house.amenities.slice(0, 3).forEach(amenity => {
      const chip = document.createElement('span');
      chip.className = 'px-3 py-1 bg-[#4AC2A9] text-white text-xs font-medium rounded-full';
      chip.textContent = amenity;
      amenitiesContainer.appendChild(chip);
    });

    if (house.amenities.length > 3) {
      const more = document.createElement('span');
      more.className = 'px-3 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded-full';
      more.textContent = `+${house.amenities.length - 3} more`;
      amenitiesContainer.appendChild(more);
    }

    content.appendChild(amenitiesContainer);
  }

  card.appendChild(content);
  return card;
}
