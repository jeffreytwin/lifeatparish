/**
 * Map utilities
 */

/**
 * Fetch neighborhood GeoJSON data
 * @returns {Promise<Object>} GeoJSON data
 */
export async function fetchNeighborhoodGeojson() {
  const response = await fetch('neighborhoods.geojson');
  const neighborhoodData = await response.json();
  return neighborhoodData;
}
