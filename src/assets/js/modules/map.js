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
