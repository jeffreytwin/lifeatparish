/**
 * Details Panel Management
 */

import { convertWixImageUrl, createImageWithLoader, hasNewConstruction, unfadeAllFeatures } from './map.js';
import { normalizeHomeType } from './filters.js';
import { defaultPriceRange, filterState, getHousesForSale, getNeighborhoodsData } from './state.js';

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
 * Map GeoJSON neighborhood names to Wix neighborhood names
 * Handles discrepancies in naming between the two data sources
 */
const NEIGHBORHOOD_NAME_MAPPING = {
  'Oakfield': 'Oakfield Lakes',
  'Del Webb BayView': 'Del Webb at Bayview',
  'Isles at BayView': 'Isles at Bayview',
  'The Islands on the Manatee River': 'The Islands on The Manatee River'
};

/**
 * Normalize neighborhood name for matching
 * @param {string} name - Neighborhood name
 * @returns {string} Normalized name
 */
function normalizeNeighborhoodName(name) {
  // First, check if there's a direct mapping
  const mappedName = NEIGHBORHOOD_NAME_MAPPING[name] || name;

  return mappedName.toLowerCase()
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
 * Extract YouTube video ID from various URL formats
 * @param {string} url - YouTube URL
 * @returns {string|null} Video ID or null if invalid
 */
function extractYouTubeVideoId(url) {
  if (!url) return null;

  // Handle different YouTube URL formats:
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://www.youtube.com/embed/VIDEO_ID

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\/\s]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Map amenity tag to its corresponding image field name in neighborhood data
 * @param {string} amenityTag - The amenity tag (e.g., "Community Pool")
 * @returns {string} The field name for the image (e.g., "poolImage")
 */
function getAmenityImageField(amenityTag) {
  const mapping = {
    'Clubhouse': 'clubhouseImage',
    'Community Pool': 'poolImage',
    'Pool': 'poolImage',
    'Fitness Center': 'fitnessCenterImage',
    'Gym': 'gymImage',
    'Pickleball': 'pickleballImage',
    'Bocce Ball': 'bocceBallImage',
    'Dog Park': 'dogParkImage',
    'Lifestyle Activities': 'lifestyleDirectorImage',
    'Playground': 'totLotImage',
    'Tot Lot': 'totLotImage',
    'Walking Paths': 'walkingPathsImage',
    'Walking Trails': 'walkingPathsImage',
    'Trails': 'trailsImage',
    'Tennis': 'tennisImage',
    'Golf': 'golfImage',
    'Gated': 'gatedImage',
    'Gated Community': 'gatedImage',
    'Nature Trails': 'trailsImage',
    'Community Events': 'lifestyleDirectorImage',
    '55+': 'ageRestrictedImage'
  };

  return mapping[amenityTag] || null;
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

  // Get color theme based on new_construction (dynamically checked)
  const isNewConstruction = hasNewConstruction(neighborhood.neighborhood);
  const themeColor = isNewConstruction ? '#10b981' : '#676ACE'; // Green for new construction, purple for resale

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
  // No longer need padding since button is outside content area
  detailsContent.appendChild(contentElement);

  // === HEADER IMAGE SECTION ===
  const imageUrl = neighborhoodData ? convertWixImageUrl(neighborhoodData.topOfPageBackground) : null;

  if (imageUrl) {
    const headerContainer = document.createElement('div');
    headerContainer.className = 'relative';
    headerContainer.style.cssText = 'height: 240px;';

    // Make header clickable if URL is available
    const rawNeighborhoodUrl = neighborhoodData && (neighborhoodData.neighborhoodHomesForSale || neighborhoodData['neighborhood-homes-for-sale'] || neighborhoodData['link-villages-title']);
    if (rawNeighborhoodUrl) {
      // Ensure URL starts with base domain
      const neighborhoodUrl = rawNeighborhoodUrl.startsWith('http') ? rawNeighborhoodUrl : `https://www.lifeatparrish.com${rawNeighborhoodUrl.startsWith('/') ? rawNeighborhoodUrl : '/' + rawNeighborhoodUrl}`;

      headerContainer.style.cursor = 'pointer';
      headerContainer.addEventListener('click', (e) => {
        // Don't open link if clicking close button
        if (!e.target.closest('button')) {
          window.open(neighborhoodUrl, '_blank', 'noopener,noreferrer');
        }
      });
    }

    // Create image with loader
    // Panel is 400px wide, we need full bleed (extend beyond 2rem padding on each side)
    const { container: imageWrapper } = createImageWithLoader(
      imageUrl,
      neighborhood.neighborhood,
      'width: 100%; height: 100%; object-fit: cover; display: block;',
      'width: 100%; height: 100%;'
    );
    headerContainer.appendChild(imageWrapper);

    // New Construction badge (if applicable)
    if (isNewConstruction) {
      const badge = document.createElement('div');
      badge.className = 'absolute top-4 left-4 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg flex items-center gap-1';
      badge.style.backgroundColor = '#10b981'; // Green for new construction
      badge.innerHTML = `
        New Construction
      `;
      headerContainer.appendChild(badge);
    }

    // Overlay with neighborhood name and price range
    const overlay = document.createElement('div');
    overlay.className = 'absolute bottom-0 left-0 right-0';
    overlay.style.cssText = 'background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); padding: 2rem 2rem 1rem 2rem;';

    const titleHtml = `<h2 class="text-3xl font-bold text-white m-0">${neighborhood.neighborhood}</h2>`;
    // Use calculated price range from enhanced GeoJSON, not Wix static field
    const priceRangeHtml = neighborhood.priceRange
      ? `<p class="text-base text-white text-opacity-90 mb-0">${neighborhood.priceRange}</p>`
      : '';

    overlay.innerHTML = titleHtml + priceRangeHtml;
    headerContainer.appendChild(overlay);

    // Close button on image
    const closeButton = document.createElement('button');
    closeButton.className = 'absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all border-0 cursor-pointer z-10';
    closeButton.innerHTML = `
      <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    `;
    closeButton.setAttribute('aria-label', 'Close details panel');
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent triggering header click
      closeDetailsPanel();
    });
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
  // Commented out for now - can re-enable if needed
  // const filteredHouses = filterHousesByNeighborhood(neighborhood.neighborhood);

  const statsContainer = document.createElement('div');
  statsContainer.className = 'flex gap-4 mb-6 mt-4';

  // Homes for Sale count
  // const homesCount = document.createElement('div');
  // homesCount.className = 'flex-1 bg-white rounded-lg border-2 border-gray-200 p-4 text-center';
  // homesCount.innerHTML = `
  //   <div style="font-size: 2rem; font-weight: 700; color: ${themeColor};">${filteredHouses.length}</div>
  //   <div style="font-size: 0.875rem; color: #6b7280; font-weight: 600; margin-top: 0.25rem;">Homes for Sale</div>
  // `;
  // statsContainer.appendChild(homesCount);

  // Floor Plans count (placeholder - will fetch on-demand)
  // const floorPlansCount = document.createElement('div');
  // floorPlansCount.className = 'flex-1 bg-white rounded-lg border-2 border-gray-200 p-4 text-center';
  // floorPlansCount.innerHTML = `
  //   <div style="font-size: 2rem; font-weight: 700; color: ${themeColor};">-</div>
  //   <div style="font-size: 0.875rem; color: #6b7280; font-weight: 600; margin-top: 0.25rem;">Floor Plans</div>
  // `;
  // statsContainer.appendChild(floorPlansCount);

  // contentElement.appendChild(statsContainer);

  // === SPECS SECTION (Bedrooms, Bathrooms, Garage, Sqft) ===
  if (neighborhoodData) {
    const specsSection = document.createElement('div');
    specsSection.className = 'mb-6';

    const specsGrid = document.createElement('div');
    specsGrid.className = 'grid grid-cols-2 gap-2';

    // Home Types
    if (neighborhoodData.homeTypes) {
      const homeTypesItem = document.createElement('div');
      homeTypesItem.className = 'flex flex-col items-center text-center';
      homeTypesItem.innerHTML = `
        <img loading="lazy" src="/House Icon - Teal.png" alt="Home Types" class="w-8 h-8 object-contain" />
        <span class="text-sm font-semibold" style="color: #4AC2A9;">Home Types</span>
        <span class="text-xs text-gray-700">${neighborhoodData.homeTypes}</span>
      `;
      specsGrid.appendChild(homeTypesItem);
    }

    // Bedrooms
    if (neighborhoodData.bedroomRange) {
      const bedroomItem = document.createElement('div');
      bedroomItem.className = 'flex flex-col items-center text-center';
      bedroomItem.innerHTML = `
        <img loading="lazy" sizes="34px" srcset="https://static.wixstatic.com/media/d0be81_3dc38905965d4491b16f0d134f6c02bc~mv2.png/v1/fill/w_34,h_26,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Bedroom%20Icon%20-%20Teal.png 1x, https://static.wixstatic.com/media/d0be81_3dc38905965d4491b16f0d134f6c02bc~mv2.png/v1/fill/w_68,h_52,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Bedroom%20Icon%20-%20Teal.png 2x"  src="https://static.wixstatic.com/media/d0be81_3dc38905965d4491b16f0d134f6c02bc~mv2.png/v1/fill/w_34,h_26,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Bedroom%20Icon%20-%20Teal.png" alt="Bedrooms" class="w-8 h-8 object-contain" />
        <span class="text-sm font-semibold" style="color: #4AC2A9;">Bedrooms</span>
        <span class="text-xs text-gray-700">${neighborhoodData.bedroomRange}</span>
      `;
      specsGrid.appendChild(bedroomItem);
    }


    // Garage
    if (neighborhoodData.garageSizeRange) {
      const garageItem = document.createElement('div');
      garageItem.className = 'flex flex-col items-center text-center';
      garageItem.innerHTML = `
        <img loading="lazy" sizes="35px" srcset="https://static.wixstatic.com/media/d0be81_b3139303e62f425aa1a0248a096469f7~mv2.png/v1/fill/w_35,h_34,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Garage%20Icon%20-%20Teal.png 1x, https://static.wixstatic.com/media/d0be81_b3139303e62f425aa1a0248a096469f7~mv2.png/v1/fill/w_70,h_68,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Garage%20Icon%20-%20Teal.png 2x" src="https://static.wixstatic.com/media/d0be81_b3139303e62f425aa1a0248a096469f7~mv2.png/v1/fill/w_35,h_34,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Garage%20Icon%20-%20Teal.png" alt="Garage" class="w-8 h-8 object-contain" />
        <span class="text-sm font-semibold" style="color: #4AC2A9;">Garages</span>
        <span class="text-xs text-gray-700">${neighborhoodData.garageSizeRange}</span>
      `;
      specsGrid.appendChild(garageItem);
    }

    // Square Feet
    if (neighborhoodData.squareFeet) {
      const sqftItem = document.createElement('div');
      sqftItem.className = 'flex flex-col items-center text-center';
      sqftItem.innerHTML = `
        <img loading="lazy" src="/Measurement Icon - Teal.png" alt="Square Feet" class="w-8 h-8 object-contain" />
        <span class="text-sm font-semibold" style="color: #4AC2A9;">Square Feet</span>
        <span class="text-xs text-gray-700">${neighborhoodData.squareFeet}</span>
      `;
      specsGrid.appendChild(sqftItem);
    }

    specsSection.appendChild(specsGrid);
    contentElement.appendChild(specsSection);
  }

  // === YOUTUBE VIDEO SECTION ===
  if (neighborhoodData && neighborhoodData.youTubeVideo) {
    const videoId = extractYouTubeVideoId(neighborhoodData.youTubeVideo);

    if (videoId) {
      const videoSection = document.createElement('div');
      videoSection.className = 'mb-6';

      const videoContainer = document.createElement('div');
      videoContainer.className = 'relative w-full';
      videoContainer.style.paddingBottom = '56.25%'; // 16:9 aspect ratio

      const iframe = document.createElement('iframe');
      iframe.className = 'absolute top-0 left-0 w-full h-full';
      iframe.src = `https://www.youtube.com/embed/${videoId}`;
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      iframe.setAttribute('allowfullscreen', '');

      videoContainer.appendChild(iframe);
      videoSection.appendChild(videoContainer);
      contentElement.appendChild(videoSection);
    }
  }

  // === SHORT DESCRIPTION SECTION ===
  if (neighborhoodData && neighborhoodData.villageShortDescription) {
    const descSection = document.createElement('div');
    descSection.className = 'mb-6';

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
    amenitiesGrid.className = 'grid grid-cols-2 gap-2';

    neighborhoodData.amenitiesTags.forEach(amenity => {
      const imageField = getAmenityImageField(amenity);
      const imageUrl = imageField && neighborhoodData[imageField] ? convertWixImageUrl(neighborhoodData[imageField]) : null;

      const tag = document.createElement('div');
      tag.className = 'flex items-center gap-2 px-3 py-2 rounded-full bg-white';

      if (imageUrl) {
        const icon = document.createElement('img');
        icon.src = imageUrl;
        icon.alt = amenity;
        icon.className = 'w-5 h-5 object-contain';
        tag.appendChild(icon);
      }

      const label = document.createElement('span');
      label.className = 'text-sm font-semibold';
      label.style.color = '#4AC2A9';
      label.textContent = amenity;
      tag.appendChild(label);

      amenitiesGrid.appendChild(tag);
    });

    amenitiesSection.appendChild(amenitiesGrid);
    contentElement.appendChild(amenitiesSection);
  }

  // === ACTION BUTTONS (Fixed at bottom of panel) ===
  // Get neighborhood URL from various possible field names
  const rawNeighborhoodPageUrl = neighborhoodData && (neighborhoodData.neighborhoodHomesForSale || neighborhoodData['neighborhood-homes-for-sale'] || neighborhoodData['link-villages-title']);

  if (rawNeighborhoodPageUrl) {
    // Ensure URL starts with base domain
    const neighborhoodPageUrl = rawNeighborhoodPageUrl.startsWith('http') ? rawNeighborhoodPageUrl : `https://www.lifeatparrish.com${rawNeighborhoodPageUrl.startsWith('/') ? rawNeighborhoodPageUrl : '/' + rawNeighborhoodPageUrl}`;

    // Remove any existing button container
    const existingButton = panel.querySelector('.explore-button-container');
    if (existingButton) {
      existingButton.remove();
    }

    // Check if neighborhood has floor plans (new construction)
    const hasFloorPlans = isNewConstruction;

    // Check if neighborhood has homes for sale
    const neighborhoodHouses = getHousesForSale().filter(house => {
      const houseVillage = house.village || '';
      return normalizeNeighborhoodName(houseVillage) === normalizeNeighborhoodName(neighborhood.neighborhood);
    });
    const hasHomesForSale = neighborhoodHouses.length > 0;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'explore-button-container p-4 bg-white border-t-2 border-gray-200';
    buttonContainer.style.cssText = 'box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);';

    // Determine which buttons to show
    if (hasFloorPlans && hasHomesForSale) {
      // Show both buttons - stacked vertically
      buttonContainer.style.display = 'flex';
      buttonContainer.style.flexDirection = 'column';
      buttonContainer.style.gap = '0.75rem';

      // See Floor Plans button
      const floorPlansButton = document.createElement('a');
      floorPlansButton.href = neighborhoodPageUrl;
      floorPlansButton.target = '_blank';
      floorPlansButton.rel = 'noopener noreferrer';
      floorPlansButton.className = 'block w-full text-center py-3 px-6 rounded-lg font-bold text-white transition-all duration-200 shadow-lg hover:shadow-xl';
      floorPlansButton.style.cssText = 'background: linear-gradient(135deg, #10b981 0%, #059669 100%);';
      floorPlansButton.innerHTML = `
        See Floor Plans
        <svg style="display: inline-block; width: 1.25rem; height: 1.25rem; margin-left: 0.5rem; vertical-align: middle;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      `;
      buttonContainer.appendChild(floorPlansButton);

      // See Homes for Sale button
      const homesButton = document.createElement('a');
      homesButton.href = neighborhoodPageUrl;
      homesButton.target = '_blank';
      homesButton.rel = 'noopener noreferrer';
      homesButton.className = 'block w-full text-center py-3 px-6 rounded-lg font-bold text-white transition-all duration-200 shadow-lg hover:shadow-xl';
      homesButton.style.cssText = 'background: linear-gradient(135deg, #676ACE 0%, #5558b8 100%);';
      homesButton.innerHTML = `
        See Homes for Sale
        <svg style="display: inline-block; width: 1.25rem; height: 1.25rem; margin-left: 0.5rem; vertical-align: middle;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      `;
      buttonContainer.appendChild(homesButton);
    } else if (hasFloorPlans) {
      // Only floor plans - single button
      const floorPlansButton = document.createElement('a');
      floorPlansButton.href = neighborhoodPageUrl;
      floorPlansButton.target = '_blank';
      floorPlansButton.rel = 'noopener noreferrer';
      floorPlansButton.className = 'block w-full text-center py-3 px-6 rounded-lg font-bold text-white transition-all duration-200 shadow-lg hover:shadow-xl';
      floorPlansButton.style.cssText = 'background: linear-gradient(135deg, #10b981 0%, #059669 100%);';
      floorPlansButton.innerHTML = `
        See Floor Plans
        <svg style="display: inline-block; width: 1.25rem; height: 1.25rem; margin-left: 0.5rem; vertical-align: middle;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      `;
      buttonContainer.appendChild(floorPlansButton);
    } else if (hasHomesForSale) {
      // Only homes for sale - single button
      const homesButton = document.createElement('a');
      homesButton.href = neighborhoodPageUrl;
      homesButton.target = '_blank';
      homesButton.rel = 'noopener noreferrer';
      homesButton.className = 'block w-full text-center py-3 px-6 rounded-lg font-bold text-white transition-all duration-200 shadow-lg hover:shadow-xl';
      homesButton.style.cssText = 'background: linear-gradient(135deg, #676ACE 0%, #5558b8 100%);';
      homesButton.innerHTML = `
        See Homes for Sale
        <svg style="display: inline-block; width: 1.25rem; height: 1.25rem; margin-left: 0.5rem; vertical-align: middle;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      `;
      buttonContainer.appendChild(homesButton);
    } else {
      // Neither - show generic explore button
      const exploreButton = document.createElement('a');
      exploreButton.href = neighborhoodPageUrl;
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
    }

    panel.appendChild(buttonContainer);
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

    // Apply home type filter
    if (filterState.homeTypes.length > 0) {
      const normalizedHouseType = normalizeHomeType(house.homeType);
      if (!filterState.homeTypes.includes(normalizedHouseType)) return false;
    }

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

