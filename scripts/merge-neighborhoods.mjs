/**
 * Merge new neighborhood polygons into the hosted neighborhoods GeoJSON.
 *
 * The map reads its boundaries from a JSON file in Wix Media Manager, not from
 * this repo (see docs/maintenance.md). This script downloads that file, merges
 * in the features from data/new-neighborhoods.geojson, validates the result and
 * writes it to disk so it can be re-uploaded to Wix under the same filename.
 *
 * Usage:
 *   npm run merge:neighborhoods
 *   npm run merge:neighborhoods -- --source ./current.json --out ./neighborhoods.geojson.json
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Same URL the app fetches in src/assets/js/modules/map.js
const LIVE_GEOJSON_URL =
  'https://d4ab3c8b-a6bd-41c2-be01-9df7d7d13631.usrfiles.com/ugd/d4ab3c_80b530e674514ac68a3450d40b8f3a9e.json';

function parseArgs(argv) {
  const args = { source: LIVE_GEOJSON_URL, additions: resolve(ROOT, 'data/new-neighborhoods.geojson'), out: resolve(ROOT, 'neighborhoods.geojson.json') };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    const value = argv[i + 1];
    if (!key || value === undefined) continue;
    if (key === 'source' || key === 'additions' || key === 'out') {
      args[key] = key === 'source' && /^https?:/.test(value) ? value : resolve(process.cwd(), value);
    }
  }
  return args;
}

async function loadCollection(source) {
  const raw = /^https?:/.test(source)
    ? await fetch(source).then(res => {
        if (!res.ok) throw new Error(`${source} responded ${res.status}`);
        return res.text();
      })
    : await readFile(source, 'utf8');

  const data = JSON.parse(raw);
  if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
    throw new Error(`${source} is not a GeoJSON FeatureCollection`);
  }
  return data;
}

function validateFeature(feature) {
  const name = feature?.properties?.neighborhood;
  const problems = [];

  if (!name) problems.push('missing properties.neighborhood');
  if (feature?.geometry?.type !== 'Polygon') problems.push(`geometry.type is ${feature?.geometry?.type}, expected Polygon`);

  for (const ring of feature?.geometry?.coordinates ?? []) {
    const [first] = ring;
    const last = ring[ring.length - 1];
    if (ring.length < 4) problems.push('ring has fewer than 4 positions');
    if (first?.[0] !== last?.[0] || first?.[1] !== last?.[1]) problems.push('ring is not closed');
    for (const [lng, lat] of ring) {
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        problems.push(`position out of range: [${lng}, ${lat}] — coordinates must be [longitude, latitude]`);
        break;
      }
    }
  }

  return { name: name ?? '(unnamed)', problems };
}

const args = parseArgs(process.argv.slice(2));
const [current, additions] = await Promise.all([loadCollection(args.source), loadCollection(args.additions)]);

const features = [...current.features];
const indexByName = new Map(
  features.map((feature, index) => [feature?.properties?.neighborhood, index]).filter(([name]) => name)
);

for (const feature of additions.features) {
  const { name, problems } = validateFeature(feature);
  if (problems.length) {
    throw new Error(`"${name}" is invalid: ${problems.join('; ')}`);
  }

  const existing = indexByName.get(name);
  if (existing === undefined) {
    indexByName.set(name, features.push(feature) - 1);
    console.log(`added   ${name}`);
  } else {
    features[existing] = feature;
    console.log(`replaced ${name}`);
  }
}

const merged = { ...current, features };
await writeFile(args.out, `${JSON.stringify(merged, null, 2)}\n`);

console.log(`\n${current.features.length} features in → ${features.length} features out`);
console.log(`wrote ${args.out}`);
console.log('Upload this file to Wix Media Manager under the existing filename (neighborhoods.geojson.json) to publish it.');
