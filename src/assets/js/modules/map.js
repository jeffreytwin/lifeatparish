/**
 * Map utilities
 */

import mapboxgl from 'mapbox-gl';
import { getHousesForSale, getNeighborhoodsData, getVillagesWithFloorPlans } from './state.js';

/**
 * Fetch neighborhood GeoJSON data from Wix
 * @returns {Promise<Object>} GeoJSON data
 */
export async function fetchNeighborhoodGeojson() {
  const response = await fetch('https://d4ab3c8b-a6bd-41c2-be01-9df7d7d13631.usrfiles.com/ugd/d4ab3c_2ee50ed343dc4840ad74e76c82c08883.json');
  const neighborhoodData = await response.json();
  return neighborhoodData;
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
 * Check if a neighborhood has new construction (has floor plans)
 * @param {string} neighborhoodName - Name from GeoJSON
 * @returns {boolean} True if neighborhood has new construction available
 */
export function hasNewConstruction(neighborhoodName) {
  // Find the matching Wix neighborhood data
  const neighborhoodData = findNeighborhoodData(neighborhoodName);

  if (!neighborhoodData || !neighborhoodData._id) {
    return false;
  }

  // Check if this neighborhood's ID exists in the floor plans Set
  const villagesWithFloorPlans = getVillagesWithFloorPlans();
  return villagesWithFloorPlans.has(neighborhoodData._id);
}

/**
 * Check if a neighborhood has resale homes (has houses for sale)
 * @param {string} neighborhoodName - Name from GeoJSON
 * @returns {boolean} True if neighborhood has resale homes available
 */
export function hasResaleHomes(neighborhoodName) {
  const houses = getHousesForSale();
  const normalizedSearchName = normalizeNeighborhoodName(neighborhoodName);

  // Check if any houses exist in this neighborhood
  const hasHouses = houses.some(h => {
    const houseVillage = h.village || '';
    const normalizedHouseVillage = normalizeNeighborhoodName(houseVillage);
    return normalizedHouseVillage === normalizedSearchName;
  });

  return hasHouses;
}

/**
 * Calculate actual price range from houses for sale in a neighborhood
 * @param {string} neighborhoodName - Name of the neighborhood
 * @returns {string|null} Formatted price range or null if no houses
 */
function calculatePriceRange(neighborhoodName) {
  const houses = getHousesForSale();

  // Normalize both the search name and house village names for comparison
  const normalizedSearchName = normalizeNeighborhoodName(neighborhoodName);

  // Filter houses in this neighborhood using normalized comparison
  const neighborhoodHouses = houses.filter(h => {
    const houseVillage = h.village || '';
    const normalizedHouseVillage = normalizeNeighborhoodName(houseVillage);
    return normalizedHouseVillage === normalizedSearchName;
  });

  if (neighborhoodHouses.length === 0) {
    return null;
  }

  // Extract prices (use listingPricePure which is the numeric value)
  const prices = neighborhoodHouses
    .map(h => h.listingPricePure)
    .filter(p => p && !isNaN(p));

  if (prices.length === 0) {
    return null;
  }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Round min down to nearest 100K, max up to nearest 100K
  const roundedMin = Math.floor(minPrice / 100000) * 100000;
  const roundedMax = Math.ceil(maxPrice / 100000) * 100000;

  // Format prices in thousands (e.g., "$300K - $500K")
  const formatPrice = (price) => {
    if (price >= 1000000) {
      const millions = price / 1000000;
      // Remove decimal if it's a whole number
      return millions % 1 === 0 ? `$${millions}M` : `$${millions.toFixed(1)}M`;
    }
    return `$${price / 1000}K`;
  };

  if (roundedMin === roundedMax) {
    return formatPrice(roundedMin);
  }

  return `${formatPrice(roundedMin)} - ${formatPrice(roundedMax)}`;
}

/**
 * Convert Wix image URL to optimized format with auto-optimization
 * @param {string} wixUrl - Wix image URL
 * @param {number|null} width - Target width in pixels (optional, use null for auto)
 * @param {number|null} height - Target height in pixels (optional, use null for auto)
 * @returns {string} Converted image URL with Wix auto-optimization
 */
export function convertWixImageUrl(wixUrl, width = null, height = null) {
  if (!wixUrl) return null;

  if (wixUrl.startsWith('wix:image://')) {
    // Format: wix:image://v1/d0be81_XXXXX~mv2.png/filename.png#originWidth=1909&originHeight=1070
    const match = wixUrl.match(/wix:image:\/\/v1\/(.*?)\/(.*?)#/);
    if (match) {
      const imageId = match[1];
      const filename = match[2];

      // If width and height are provided, create optimized URL with auto quality
      if (width && height) {
        const params = [
          `w_${width}`,
          `h_${height}`,
          'al_c', // Align center
          'usm_0.66_1.00_0.01' // Unsharp mask for sharpening
        ].join(',');

        // Let Wix auto-detect best format (WebP/AVIF) and quality
        return `https://static.wixstatic.com/media/${imageId}/v1/fill/${params}/${encodeURIComponent(filename)}`;
      }

      // Fallback to basic URL - Wix will still auto-optimize
      return `https://static.wixstatic.com/media/${imageId}`;
    }
  }

  return wixUrl; // Return as-is if not Wix format
}

/**
 * Create an image element with shimmer loading effect
 * @param {string} imageUrl - Image URL to load
 * @param {string} alt - Alt text for the image
 * @param {string} imageCss - CSS styles for the image element itself
 * @param {string} containerCss - CSS styles for the container div (optional)
 * @param {Map} imageCache - Optional image cache
 * @returns {Object} Object with container element and promise that resolves when loaded
 */
export function createImageWithLoader(imageUrl, alt, imageCss = '', containerCss = '', imageCache = null) {
  const imageContainer = document.createElement('div');
  // Set base container styles that ensure proper shimmer display
  const baseContainerCss = 'position: relative; overflow: hidden; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%;';
  imageContainer.style.cssText = containerCss ? `${baseContainerCss} ${containerCss}` : baseContainerCss;
  imageContainer.style.animation = 'shimmer 1.5s infinite';

  // Check if image is already cached
  if (imageCache && imageCache.has(imageUrl)) {
    const cachedImg = imageCache.get(imageUrl).cloneNode();
    cachedImg.style.cssText = imageCss;
    imageContainer.appendChild(cachedImg);
    // Remove shimmer for cached images
    imageContainer.style.background = 'none';
    imageContainer.style.animation = 'none';
    return { container: imageContainer, promise: Promise.resolve() };
  }

  const img = document.createElement('img');
  img.src = imageUrl;
  img.alt = alt;
  img.style.cssText = `${imageCss}; opacity: 0; transition: opacity 0.3s;`;

  const loadPromise = new Promise((resolve, reject) => {
    img.onload = () => {
      img.style.opacity = '1';
      imageContainer.style.background = 'none';
      imageContainer.style.animation = 'none';
      // Cache the loaded image
      if (imageCache) {
        imageCache.set(imageUrl, img.cloneNode());
      }
      resolve();
    };

    img.onerror = () => {
      imageContainer.remove();
      reject(new Error('Failed to load image'));
    };
  });

  imageContainer.appendChild(img);

  return { container: imageContainer, promise: loadPromise };
}

/**
 * Create and return a reusable popup instance
 * @returns {mapboxgl.Popup} Popup instance
 */
export function createPopup() {
  return new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 15,
    className: 'neighborhood-popup'
  });
}

/**
 * Fit map to all neighborhoods on initial load
 * @param {mapboxgl.Map} map - The map instance
 * @param {Object} geojson - The GeoJSON data
 */
export function fitMapToAllNeighborhoods(map, geojson) {
  const bounds = new mapboxgl.LngLatBounds();

  geojson.features.forEach(feature => {
    feature.geometry.coordinates.forEach(polygon => {
      polygon.forEach(coord => {
        bounds.extend(coord);
      });
    });
  });

  map.fitBounds(bounds, {
    padding: 50, // Equal padding on all sides
    duration: 1000 // 1 second smooth animation
  });
}

// Store the enhanced GeoJSON for use by filters
let enhancedNeighborhoodGeojson = null;

/**
 * Get the enhanced GeoJSON data (with dynamic new_construction values)
 * @returns {Object|null} Enhanced GeoJSON or null if not yet loaded
 */
export function getEnhancedGeojson() {
  return enhancedNeighborhoodGeojson;
}

/**
 * Load GeoJSON data and add map layers
 * @param {mapboxgl.Map} map - The map instance
 * @param {Object} geojson - The GeoJSON data
 */
export function loadNeighborhoodsGeojson(map, geojson) {
  // Dynamically set new_construction property, use Wix names, and Wix amenities
  enhancedNeighborhoodGeojson = {
    ...geojson,
    features: geojson.features.map(feature => {
      const originalName = feature.properties.neighborhood;
      // Use mapped Wix name if available, otherwise keep original
      const wixName = NEIGHBORHOOD_NAME_MAPPING[originalName] || originalName;
      const hasNew = hasNewConstruction(originalName);
      const hasResales = hasResaleHomes(wixName);

      // Get Wix neighborhood data to extract amenitiesTags
      const neighborhoodsData = getNeighborhoodsData();
      const neighborhoodData = neighborhoodsData.find(n => {
        const title = (n.villageTitle || '').replace(/^Homes for Sale in /i, '');
        const normalizedTitle = normalizeNeighborhoodName(title);
        const normalizedSearch = normalizeNeighborhoodName(wixName);
        return normalizedTitle === normalizedSearch;
      });

      // Use Wix amenitiesTags if available, otherwise keep original amenities
      const amenities = neighborhoodData?.amenitiesTags || feature.properties.amenities || [];

      // Calculate actual price range from houses for sale
      const calculatedPriceRange = calculatePriceRange(wixName);

      return {
        ...feature,
        properties: {
          ...feature.properties,
          neighborhood: wixName, // Use Wix name
          new_construction: hasNew, // Check using original for matching
          has_resale_homes: hasResales, // Check if neighborhood has resale homes
          amenities: amenities, // Use Wix amenitiesTags
          priceRange: calculatedPriceRange // Actual price range from houses
        }
      };
    })
  };

  // add the polygons
  map.addSource('neighborhoods', {
    type: 'geojson',
    data: enhancedNeighborhoodGeojson,
    generateId: true // Generate IDs for features automatically
  });

  // Style the polygons - 2 colors based on new_construction
  map.addLayer({
    id: 'neighborhood-fills',
    type: 'fill',
    source: 'neighborhoods',
    paint: {
      'fill-color': [
        'case',
        ['==', ['get', 'new_construction'], true],
        '#10b981', // New construction - green
        '#676ACE'  // Resale homes - purple (default for false or null)
      ],
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        0.8, // Keep bright when selected
        ['boolean', ['feature-state', 'faded'], false],
        0.15, // Fade when another neighborhood is selected
        ['boolean', ['feature-state', 'hover'], false],
        0.8, // Brighten on hover
        0.5 // Default opacity
      ],
    }
  });

  // Add border/stroke layer - matching the fill colors
  map.addLayer({
    id: 'neighborhood-borders',
    type: 'line',
    source: 'neighborhoods',
    paint: {
      'line-color': [
        'case',
        ['==', ['get', 'new_construction'], true],
        '#10b981', // New construction - green
        '#676ACE'  // Resale homes - purple (default for false or null)
      ],
      'line-width': 2,
      'line-opacity': [
        'case',
        ['boolean', ['feature-state', 'faded'], false],
        0.2, // Fade border when another neighborhood is selected
        1 // Default opacity
      ]
    }
  });

  // Add highlight layer for selected polygon
  map.addLayer({
    id: 'neighborhood-highlight',
    type: 'line',
    source: 'neighborhoods',
    paint: {
      'line-color': '#2563eb',
      'line-width': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        4,
        0
      ],
      'line-opacity': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        1,
        0
      ]
    }
  });
}

/**
 * Helper function to fade all features except the selected one
 * @param {mapboxgl.Map} map - The map instance
 * @param {number} selectedId - The ID of the selected feature
 */
function fadeUnselectedFeatures(map, selectedId) {
  const features = map.querySourceFeatures('neighborhoods');
  features.forEach(feature => {
    if (feature.id !== selectedId) {
      map.setFeatureState(
        { source: 'neighborhoods', id: feature.id },
        { faded: true }
      );
    }
  });
}

/**
 * Helper function to unfade all features
 * @param {mapboxgl.Map} map - The map instance
 */
export function unfadeAllFeatures(map) {
  const features = map.querySourceFeatures('neighborhoods');
  features.forEach(feature => {
    map.setFeatureState(
      { source: 'neighborhoods', id: feature.id },
      { faded: false }
    );
  });
}

/**
 * Setup all map interactions (hover, click, tooltips)
 * @param {mapboxgl.Map} map - The map instance
 * @param {mapboxgl.Popup} popup - The popup instance
 * @param {Function} getSelectedId - Function to get selected neighborhood ID
 * @param {Function} setSelectedId - Function to set selected neighborhood ID
 * @param {Function} showDetails - Function to show neighborhood details
 * @param {Function} closeDetails - Function to close details panel
 */
export function setupMapInteractions(map, popup, getSelectedId, setSelectedId, showDetails, closeDetails) {
  let hoveredNeighborhoodId = null;
  const imageCache = new Map(); // Cache for preloaded images

  // Detect if device has touch capability
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  // Change cursor to pointer on hover (desktop only)
  if (!isTouchDevice) {
    map.on('mouseenter', 'neighborhood-fills', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'neighborhood-fills', () => {
      map.getCanvas().style.cursor = '';
    });
  }

  // Hover effect - brighten polygon and show tooltip (desktop only)
  if (!isTouchDevice) {
    map.on('mousemove', 'neighborhood-fills', (e) => {
    if (e.features.length > 0) {
      if (hoveredNeighborhoodId !== null) {
        map.setFeatureState(
          { source: 'neighborhoods', id: hoveredNeighborhoodId },
          { hover: false }
        );
      }
      hoveredNeighborhoodId = e.features[0].id;
      map.setFeatureState(
        { source: 'neighborhoods', id: hoveredNeighborhoodId },
        { hover: true }
      );

      // Show popup tooltip
      const properties = e.features[0].properties;
      const coordinates = e.lngLat;

      // Determine color based on new_construction status (dynamically checked)
      const isNewConstruction = hasNewConstruction(properties.neighborhood);
      const themeColor = isNewConstruction ? '#10b981' : '#676ACE'; // Green for new construction, purple for resale

      // Find matching neighborhood data
      const neighborhoodData = findNeighborhoodData(properties.neighborhood);
      // Optimized for popup: 560x320 (2x for retina) - Wix auto-optimizes quality and format
      const imageUrl = neighborhoodData ? convertWixImageUrl(neighborhoodData.topBackgroundImage, 560, 320) : null;

      // Build popup HTML with enhanced styling
      const priceText = properties.priceRange ? properties.priceRange : '';
      const constructionStatus = isNewConstruction ? 'New Construction' : '';

      // Build the popup content
      const popupContainer = document.createElement('div');
      popupContainer.style.width = '280px';

      // Add image container with shimmer if image exists
      if (imageUrl) {
        const imageWrapper = document.createElement('div');
        imageWrapper.style.cssText = 'position: relative; width: 280px; height: 160px;';

        const { container } = createImageWithLoader(
          imageUrl,
          properties.neighborhood,
          'width: 280px; height: 160px; object-fit: cover; display: block;',
          'width: 280px; height: 160px;',
          imageCache
        );
        imageWrapper.appendChild(container);

        // Add New Construction badge if applicable
        if (isNewConstruction) {
          const badge = document.createElement('div');
          badge.style.cssText = 'position: absolute; top: 0.75rem; left: 0.75rem; background: #10b981; color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.025em; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);';
          badge.textContent = 'New Construction';
          imageWrapper.appendChild(badge);
        }

        popupContainer.appendChild(imageWrapper);
      }

      // Add content section
      const contentDiv = document.createElement('div');
      contentDiv.style.cssText = 'padding: 1rem; width: 280px; box-sizing: border-box;';
      contentDiv.innerHTML = `
        <h3 style="font-weight: 700; font-size: 1.125rem; color: #111827; margin-bottom: 0.5rem; border-bottom: 2px solid ${themeColor}; padding-bottom: 0.5rem;">${properties.neighborhood || 'Neighborhood'}</h3>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          ${priceText ? `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div style="width: 0.5rem; height: 0.5rem; border-radius: 9999px; background-color: ${themeColor};"></div>
              <span style="font-size: 0.875rem; font-weight: 600; color: ${themeColor};">${priceText}</span>
            </div>
          ` : ''}
          ${constructionStatus ? `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div style="width: 0.5rem; height: 0.5rem; border-radius: 9999px; background-color: #2C9E36;"></div>
              <span style="font-size: 0.875rem; font-weight: 500; color: #374151;">${constructionStatus}</span>
            </div>
          ` : ''}
        </div>
        <div style="margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 0.75rem; color: #6b7280; font-style: italic;">Click to view details</p>
        </div>
      `;

      popupContainer.appendChild(contentDiv);

      // Add shimmer animation style
      const style = document.createElement('style');
      style.textContent = `
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `;
      document.head.appendChild(style);

      popup.setLngLat(coordinates).setDOMContent(popupContainer).addTo(map);
    }
  });

    map.on('mouseleave', 'neighborhood-fills', () => {
      if (hoveredNeighborhoodId !== null) {
        map.setFeatureState(
          { source: 'neighborhoods', id: hoveredNeighborhoodId },
          { hover: false }
        );
      }
      hoveredNeighborhoodId = null;

      // Hide popup
      popup.remove();
    });
  } // End of desktop-only hover interactions

  // Click event - select neighborhood
  map.on('click', 'neighborhood-fills', (e) => {
    if (e.features.length > 0) {
      const clickedFeature = e.features[0];

      // Clear previous selection
      if (getSelectedId() !== null) {
        map.setFeatureState(
          { source: 'neighborhoods', id: getSelectedId() },
          { selected: false }
        );
      }

      // Set new selection
      setSelectedId(clickedFeature.id);
      map.setFeatureState(
        { source: 'neighborhoods', id: getSelectedId() },
        { selected: true }
      );

      // Fade all other features
      fadeUnselectedFeatures(map, clickedFeature.id);

      // Pan map to fit the polygon bounds
      if (clickedFeature.geometry && clickedFeature.geometry.coordinates) {
        const bounds = new mapboxgl.LngLatBounds();
        const coords = clickedFeature.geometry.coordinates[0];

        coords.forEach(coord => {
          bounds.extend(coord);
        });

        map.fitBounds(bounds, {
          padding: 100, // Equal padding on all sides since map will resize
          maxZoom: map.getZoom(), // Don't zoom in more than current level
          duration: 800
        });
      }

      // Show details panel with neighborhood data
      showDetails(clickedFeature.properties);
    }
  });

  // Click outside polygons - deselect and close panel
  map.on('click', (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['neighborhood-fills']
    });

    // If clicked outside any polygon
    if (features.length === 0) {
      // Clear selection
      if (getSelectedId() !== null) {
        map.setFeatureState(
          { source: 'neighborhoods', id: getSelectedId() },
          { selected: false }
        );
        setSelectedId(null);
      }

      // Unfade all features
      unfadeAllFeatures(map);

      // Close panel
      closeDetails();
    }
  });
}
