/**
 * hospitalService.js
 *
 * Fetches nearby hospitals and clinics using the Overpass API.
 * 100% free — no API key required.
 * Falls back to a secondary Overpass endpoint if the primary fails.
 */

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const TIMEOUT_MS = 20_000;

/**
 * Build an Overpass QL query for hospitals and clinics within a radius.
 */
function buildQuery(lat, lon, radiusM) {
  return `
[out:json][timeout:18];
(
  node["amenity"~"^(hospital|clinic|doctors|health_centre)$"](around:${radiusM},${lat},${lon});
  way["amenity"~"^(hospital|clinic)$"](around:${radiusM},${lat},${lon});
);
out center;
`.trim();
}

/**
 * @param {number} lat
 * @param {number} lon
 * @param {number} radiusM  search radius in metres (default 5000)
 * @returns {Promise<Array<Hospital>>}
 *
 * Hospital shape:
 *   { id, name, type, lat, lon, address, phone, distance }
 */
export async function fetchNearbyHospitals(lat, lon, radiusM = 5000) {
  const query = buildQuery(lat, lon, radiusM);

  for (const endpoint of ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const res = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    `data=${encodeURIComponent(query)}`,
        signal:  controller.signal,
      });

      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const hospitals = parseElements(json.elements ?? [], lat, lon);
      return hospitals.sort((a, b) => a.distance - b.distance);

    } catch (err) {
      if (err.name === 'AbortError') {
        console.warn(`[Overpass] timeout on ${endpoint}`);
      } else {
        console.warn(`[Overpass] error on ${endpoint}:`, err.message);
      }
    }
  }

  throw new Error('Unable to fetch hospitals. Please check your connection and try again.');
}

// ─── Parse Overpass elements into clean objects ───────────────────────────────
function parseElements(elements, userLat, userLon) {
  return elements
    .map((el) => {
      // Ways have a center object; nodes have lat/lon directly
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (!lat || !lon) return null;

      const tags = el.tags ?? {};
      const name = tags.name || tags['name:en'] || tags['brand'] || inferName(tags.amenity);

      const addressParts = [
        tags['addr:housenumber'],
        tags['addr:street'],
        tags['addr:suburb'] || tags['addr:city'],
      ].filter(Boolean);

      return {
        id:       String(el.id),
        name,
        type:     tags.amenity ?? 'hospital',
        lat,
        lon,
        address:  addressParts.length ? addressParts.join(' ') : null,
        phone:    tags.phone || tags['contact:phone'] || tags['contact:mobile'] || null,
        website:  tags.website || tags['contact:website'] || null,
        emergency:tags.emergency === 'yes',
        distance: haversineM(userLat, userLon, lat, lon),
      };
    })
    .filter(Boolean);
}

function inferName(amenity) {
  switch (amenity) {
    case 'hospital':      return 'Hospital';
    case 'clinic':        return 'Clinic';
    case 'doctors':       return 'Doctor\'s Office';
    case 'health_centre': return 'Health Centre';
    default:              return 'Medical Facility';
  }
}

// Haversine distance in metres
function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a  = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(metres) {
  return metres < 1000
    ? `${Math.round(metres)} m`
    : `${(metres / 1000).toFixed(1)} km`;
}
