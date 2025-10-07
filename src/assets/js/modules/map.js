/**
 * Map utilities
 */

import mapboxgl from 'mapbox-gl';

/**
 * Fetch neighborhood GeoJSON data
 * @returns {Promise<Object>} GeoJSON data
 */
export async function fetchNeighborhoodGeojson() {
  const response = await fetch('neighborhoods.geojson');
  const neighborhoodData = await response.json();
  return neighborhoodData;
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

/**
 * Load GeoJSON data and add map layers
 * @param {mapboxgl.Map} map - The map instance
 * @param {Object} geojson - The GeoJSON data
 */
export function loadNeighborhoodsGeojson(map, geojson) {
  // add the polygons
  map.addSource('neighborhoods', {
    type: 'geojson',
    data: geojson,
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
        '#676ACE', // New construction - purple
        '#4AC2A9'  // Not new construction - teal (default for false or null)
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
        '#676ACE', // New construction - purple
        '#4AC2A9'  // Not new construction - teal (default for false or null)
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

  // Change cursor to pointer on hover
  map.on('mouseenter', 'neighborhood-fills', () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'neighborhood-fills', () => {
    map.getCanvas().style.cursor = '';
  });

  // Hover effect - brighten polygon and show tooltip
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

      // Build popup HTML with enhanced styling
      const priceText = properties.price_range ? properties.price_range : '';
      const homeInfo = properties.new_construction
        ? 'New Construction'
        : (properties.homeType || '');

      const html = `
        <div class="px-4 py-3 min-w-[200px]">
          <h3 class="font-bold text-lg text-gray-900 mb-2 border-b-2 border-[#676ACE] pb-2">${properties.neighborhood || 'Neighborhood'}</h3>
          <div class="space-y-2">
            ${priceText ? `
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-[#676ACE]"></div>
                <span class="text-sm font-semibold text-[#676ACE]">${priceText}</span>
              </div>
            ` : ''}
            ${homeInfo ? `
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-[#2C9E36]"></div>
                <span class="text-sm font-medium text-gray-700">${homeInfo}</span>
              </div>
            ` : ''}
          </div>
          <div class="mt-3 pt-2 border-t border-gray-200">
            <p class="text-xs text-gray-500 italic">Click to view details</p>
          </div>
        </div>
      `;

      popup.setLngLat(coordinates).setHTML(html).addTo(map);
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
