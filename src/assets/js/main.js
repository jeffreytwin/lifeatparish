import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = config.mapboxAccessToken;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-82.45, 27.56], // Parrish, FL
  zoom: 11
});

map.on('load', () => {
  // Add your GeoJSON polygons
  loadneighborhoods();

});

async function loadneighborhoods() {
  const response = await fetch('neighborhoods.geojson');
  const neighborhoodData = await response.json();
  console.log(neighborhoodData)

  // add the polygons
  map.addSource('neighborhoods', {
    type: 'geojson',
    data: neighborhoodData
  });

  // Style the polygons
  map.addLayer({
    id: 'neighborhood-fills',
    type: 'fill',
    source: 'neighborhoods',
    paint: {
      'fill-color': ['get', 'fill'],
      'fill-opacity': ['get', 'fill-opacity'],
    }
  });

  // Add border/stroke layer
  map.addLayer({
    id: 'neighborhood-borders',
    type: 'line',
    source: 'neighborhoods',
    paint: {
      'line-color': ['get', 'stroke'],
      'line-width': ['get', 'stroke-width'],
      'line-opacity': ['get', 'stroke-opacity']
    }
  });

}

