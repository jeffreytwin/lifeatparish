/**
 * Details Panel Management
 */

import { defaultPriceRange, filterState, getHousesForSale, getNeighborhoodsData } from './state.js';
import { unfadeAllFeatures, convertWixImageUrl, createImageWithLoader } from './map.js';

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
 * Normalize neighborhood name for matching
 * @param {string} name - Neighborhood name
 * @returns {string} Normalized name
 */
function normalizeNeighborhoodName(name) {
  return name.toLowerCase()
    .replace(/\s+/g, '') // Remove spaces
    .replace(/[^a-z0-9]/g, ''); // Remove special characters
}

/**
 * Find neighborhood data by name
 * @param {string} neighborhoodName - Name from GeoJSON
 * @returns {Object|null} Neighborhood data object or null
 */
function findNeighborhoodData(neighborhoodName) {
  const neighborhoods = getNeighborhoodsData();
  const normalizedSearch = normalizeNeighborhoodName(neighborhoodName);

  return neighborhoods.find(n => {
    // Try matching against villageTitle (remove "Homes for Sale in " prefix)
    const title = (n.villageTitle || '').replace(/^Homes for Sale in /i, '');
    const normalizedTitle = normalizeNeighborhoodName(title);
    return normalizedTitle === normalizedSearch;
  }) || null;
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

  // Find matching neighborhood data from Wix
  const neighborhoodData = findNeighborhoodData(neighborhood.neighborhood);

  // Get color theme based on new_construction
  const isNewConstruction = neighborhood.new_construction === true;
  const themeColor = isNewConstruction ? '#676ACE' : '#4AC2A9';

  // Get elements
  const detailsContent = document.querySelector('.details-content');
  let headerElement = detailsContent.querySelector('.details-header');

  // Clear previous content
  detailsContent.innerHTML = '';

  // Recreate header element
  headerElement = document.createElement('div');
  headerElement.className = 'details-header';
  detailsContent.appendChild(headerElement);

  // Create content element for scrollable content
  const contentElement = document.createElement('div');
  contentElement.className = 'details-body';
  detailsContent.appendChild(contentElement);

  // === HEADER IMAGE SECTION ===
  const imageUrl = neighborhoodData ? convertWixImageUrl(neighborhoodData.topOfPageBackground) : null;

  if (imageUrl) {
    const headerContainer = document.createElement('div');
    headerContainer.className = 'relative';
    headerContainer.style.cssText = 'height: 240px; margin: -1.5rem -2rem 0 -2rem;';

    // Create image with loader
    // Panel is 400px wide, we need full bleed (extend beyond 2rem padding on each side)
    const { container: imageWrapper } = createImageWithLoader(
      imageUrl,
      neighborhood.neighborhood,
      'width: 100%; height: 100%; object-fit: cover; display: block;',
      'width: 100%; height: 100%;'
    );
    headerContainer.appendChild(imageWrapper);

    // Overlay with neighborhood name
    const overlay = document.createElement('div');
    overlay.className = 'absolute bottom-0 left-0 right-0';
    overlay.style.cssText = 'background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); padding: 2rem 2rem 1rem 2rem;';
    overlay.innerHTML = `<h2 class="text-3xl font-bold text-white m-0">${neighborhood.neighborhood}</h2>`;
    headerContainer.appendChild(overlay);

    // Close button on image
    const closeButton = document.createElement('button');
    closeButton.className = 'absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all border-0 cursor-pointer';
    closeButton.innerHTML = `
      <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    `;
    closeButton.setAttribute('aria-label', 'Close details panel');
    closeButton.addEventListener('click', () => closeDetailsPanel());
    headerContainer.appendChild(closeButton);

    headerElement.appendChild(headerContainer);
  } else {
    // No image - just show title and close button
    const headerWrapper = document.createElement('div');
    headerWrapper.className = 'flex items-start justify-between mb-4';

    const title = document.createElement('h2');
    title.className = 'text-3xl font-bold text-gray-900 flex-1';
    title.textContent = neighborhood.neighborhood;
    headerWrapper.appendChild(title);

    const closeButton = document.createElement('button');
    closeButton.className = 'text-gray-400 hover:text-gray-600 transition-colors p-1';
    closeButton.innerHTML = `
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    `;
    closeButton.addEventListener('click', () => closeDetailsPanel());
    headerWrapper.appendChild(closeButton);

    headerElement.appendChild(headerWrapper);
  }

  // === KEY STATS SECTION ===
  const filteredHouses = filterHousesByNeighborhood(neighborhood.neighborhood);

  const statsContainer = document.createElement('div');
  statsContainer.className = 'flex gap-4 mb-6 mt-4';

  // Homes for Sale count
  const homesCount = document.createElement('div');
  homesCount.className = 'flex-1 bg-white rounded-lg border-2 border-gray-200 p-4 text-center';
  homesCount.innerHTML = `
    <div style="font-size: 2rem; font-weight: 700; color: ${themeColor};">${filteredHouses.length}</div>
    <div style="font-size: 0.875rem; color: #6b7280; font-weight: 600; margin-top: 0.25rem;">Homes for Sale</div>
  `;
  statsContainer.appendChild(homesCount);

  // Floor Plans count (placeholder - will fetch on-demand)
  const floorPlansCount = document.createElement('div');
  floorPlansCount.className = 'flex-1 bg-white rounded-lg border-2 border-gray-200 p-4 text-center';
  floorPlansCount.innerHTML = `
    <div style="font-size: 2rem; font-weight: 700; color: ${themeColor};">-</div>
    <div style="font-size: 0.875rem; color: #6b7280; font-weight: 600; margin-top: 0.25rem;">Floor Plans</div>
  `;
  statsContainer.appendChild(floorPlansCount);

  // New Construction badge
  if (isNewConstruction) {
    const newConstructionBadge = document.createElement('div');
    newConstructionBadge.className = 'flex-1 bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-center flex flex-col items-center justify-center';
    newConstructionBadge.innerHTML = `
      <svg style="width: 2rem; height: 2rem; color: white; margin-bottom: 0.25rem;" fill="currentColor" viewBox="0 0 640 512"><path d="M0 488V171.3c0-26.2 15.9-49.7 40.2-59.4L308.1 4.8c7.6-3.1 16.1-3.1 23.8 0L599.8 111.9c24.3 9.7 40.2 33.3 40.2 59.4V488c0 13.3-10.7 24-24 24H568c-13.3 0-24-10.7-24-24V224c0-17.7-14.3-32-32-32H128c-17.7 0-32 14.3-32 32V488c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24z"/></svg>
      <div style="font-size: 0.75rem; color: white; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">New Construction</div>
    `;
    statsContainer.appendChild(newConstructionBadge);
  }

  contentElement.appendChild(statsContainer);

  // === SHORT DESCRIPTION SECTION ===
  if (neighborhoodData && neighborhoodData.villageShortDescription) {
    const descSection = document.createElement('div');
    descSection.className = 'mb-6';

    const descTitle = document.createElement('h3');
    descTitle.className = 'text-lg font-bold text-gray-900 mb-2';
    descTitle.textContent = 'About This Neighborhood';
    descSection.appendChild(descTitle);

    const descText = document.createElement('p');
    descText.className = 'text-gray-700 leading-relaxed';
    descText.textContent = neighborhoodData.villageShortDescription;
    descSection.appendChild(descText);

    contentElement.appendChild(descSection);
  }

  // === AMENITIES SECTION ===
  if (neighborhoodData && neighborhoodData.amenitiesTags && neighborhoodData.amenitiesTags.length > 0) {
    const amenitiesSection = document.createElement('div');
    amenitiesSection.className = 'mb-6';

    const amenitiesTitle = document.createElement('h3');
    amenitiesTitle.className = 'text-lg font-bold text-gray-900 mb-3';
    amenitiesTitle.textContent = 'Amenities';
    amenitiesSection.appendChild(amenitiesTitle);

    const amenitiesGrid = document.createElement('div');
    amenitiesGrid.className = 'flex flex-wrap gap-2';

    neighborhoodData.amenitiesTags.forEach(amenity => {
      const tag = document.createElement('div');
      tag.style.cssText = `background: ${themeColor}; color: white; padding: 0.5rem 1rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.1);`;
      tag.textContent = amenity;
      amenitiesGrid.appendChild(tag);
    });

    amenitiesSection.appendChild(amenitiesGrid);
    contentElement.appendChild(amenitiesSection);
  }

  // === EXPLORE BUTTON ===
  if (neighborhoodData && neighborhoodData['link-copy-of-neighborhood-title']) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'mb-6';

    const exploreButton = document.createElement('a');
    exploreButton.href = neighborhoodData['link-copy-of-neighborhood-title'];
    exploreButton.target = '_blank';
    exploreButton.rel = 'noopener noreferrer';
    exploreButton.className = 'block w-full text-center py-3 px-6 rounded-lg font-bold text-white transition-all duration-200 shadow-lg hover:shadow-xl';
    exploreButton.style.cssText = `background: linear-gradient(135deg, ${themeColor} 0%, ${isNewConstruction ? '#5558b8' : '#3da894'} 100%);`;
    exploreButton.innerHTML = `
      Explore ${neighborhood.neighborhood}
      <svg style="display: inline-block; width: 1.25rem; height: 1.25rem; margin-left: 0.5rem; vertical-align: middle;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    `;
    buttonContainer.appendChild(exploreButton);
    contentElement.appendChild(buttonContainer);
  }

  // Show panel with animation
  panel.classList.add('open');
  mapContainer.classList.add('panel-open');

  // Resize map to fit new container size
  if (map) {
    setTimeout(() => {
      map.resize();
    }, 300);
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

  // Unfade all features when closing panel
  if (map) {
    unfadeAllFeatures(map);
  }

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

