const fs = require('fs');
const path = require('path');

function normalizePincode(value) {
  return String(value || '').replace(/\D/g, '').trim();
}

function extractCoordinatePairs(geometry) {
  const pairs = [];

  const walk = (node) => {
    if (!Array.isArray(node)) return;
    if (node.length >= 2 && typeof node[0] === 'number' && typeof node[1] === 'number') {
      pairs.push([node[0], node[1]]);
      return;
    }
    node.forEach(walk);
  };

  walk(geometry?.coordinates);
  return pairs;
}

function computeGeometryBoundingBox(geometry) {
  const pairs = extractCoordinatePairs(geometry);
  if (!pairs.length) return null;

  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  pairs.forEach(([lng, lat]) => {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  });

  return { minLng, minLat, maxLng, maxLat };
}

function pointOnSegment(px, py, x1, y1, x2, y2) {
  const eps = 1e-10;
  const cross = (py - y1) * (x2 - x1) - (px - x1) * (y2 - y1);
  if (Math.abs(cross) > eps) return false;

  const dot = (px - x1) * (px - x2) + (py - y1) * (py - y2);
  return dot <= eps;
}

function pointInRing(lng, lat, ring) {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]?.[0];
    const yi = ring[i]?.[1];
    const xj = ring[j]?.[0];
    const yj = ring[j]?.[1];

    if (
      typeof xi !== 'number' ||
      typeof yi !== 'number' ||
      typeof xj !== 'number' ||
      typeof yj !== 'number'
    ) {
      continue;
    }

    if (pointOnSegment(lng, lat, xi, yi, xj, yj)) return true;

    const intersects = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / ((yj - yi) || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}

function polygonContainsPoint(geometry, lng, lat) {
  if (!geometry?.type || !geometry?.coordinates) return false;

  if (geometry.type === 'Polygon') {
    const rings = geometry.coordinates;
    if (!rings.length || !pointInRing(lng, lat, rings[0])) return false;

    for (let i = 1; i < rings.length; i += 1) {
      if (pointInRing(lng, lat, rings[i])) return false;
    }

    return true;
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((poly) => polygonContainsPoint({ type: 'Polygon', coordinates: poly }, lng, lat));
  }

  return false;
}

function bboxContainsPoint(bbox, lng, lat) {
  if (!bbox) return false;
  return lng >= bbox.minLng && lng <= bbox.maxLng && lat >= bbox.minLat && lat <= bbox.maxLat;
}

function toPlanarKm(lng, lat, refLat) {
  const kmPerDegLat = 111.32;
  const kmPerDegLng = 111.32 * Math.cos((refLat * Math.PI) / 180);
  return { x: lng * kmPerDegLng, y: lat * kmPerDegLat };
}

function pointToSegmentDistanceKm(px, py, x1, y1, x2, y2) {
  const refLat = (py + y1 + y2) / 3;
  const p = toPlanarKm(px, py, refLat);
  const a = toPlanarKm(x1, y1, refLat);
  const b = toPlanarKm(x2, y2, refLat);

  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = p.x - a.x;
  const apy = p.y - a.y;
  const ab2 = abx * abx + aby * aby;

  if (ab2 <= Number.EPSILON) return Math.hypot(p.x - a.x, p.y - a.y);

  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
  const projX = a.x + t * abx;
  const projY = a.y + t * aby;
  return Math.hypot(p.x - projX, p.y - projY);
}

function ringDistanceKm(lng, lat, ring) {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    if (!a || !b) continue;

    const d = pointToSegmentDistanceKm(lng, lat, a[0], a[1], b[0], b[1]);
    if (d < best) best = d;
  }
  return best;
}

function polygonDistanceKm(geometry, lng, lat) {
  if (!geometry?.type || !geometry?.coordinates) return Number.POSITIVE_INFINITY;
  if (polygonContainsPoint(geometry, lng, lat)) return 0;

  if (geometry.type === 'Polygon') {
    let best = Number.POSITIVE_INFINITY;
    geometry.coordinates.forEach((ring) => {
      const d = ringDistanceKm(lng, lat, ring);
      if (d < best) best = d;
    });
    return best;
  }

  if (geometry.type === 'MultiPolygon') {
    let best = Number.POSITIVE_INFINITY;
    geometry.coordinates.forEach((poly) => {
      const d = polygonDistanceKm({ type: 'Polygon', coordinates: poly }, lng, lat);
      if (d < best) best = d;
    });
    return best;
  }

  return Number.POSITIVE_INFINITY;
}

function loadPincodes() {
  const geojsonPath = path.join(process.cwd(), 'geojsonData', 'data.geojson');
  const data = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'));
  const map = new Map();

  for (const feature of data.features || []) {
    const raw = feature?.properties?.Pincode || feature?.properties?.pincode;
    const pincode = normalizePincode(raw);
    if (!pincode) continue;

    map.set(pincode, {
      pincode,
      district: feature?.properties?.district || feature?.properties?.Division || '',
      polygon: feature.geometry,
      bbox: computeGeometryBoundingBox(feature.geometry),
    });
  }

  return map;
}

function matchByCoordinates(pincodeData, lat, lng) {
  for (const data of pincodeData.values()) {
    if (!bboxContainsPoint(data.bbox, lng, lat)) continue;
    if (polygonContainsPoint(data.polygon, lng, lat)) {
      return { method: 'contains', data, distanceKm: 0 };
    }
  }

  let best = null;
  for (const data of pincodeData.values()) {
    const distanceKm = polygonDistanceKm(data.polygon, lng, lat);
    if (!Number.isFinite(distanceKm)) continue;
    if (!best || distanceKm < best.distanceKm) {
      best = { method: 'nearest', data, distanceKm };
    }
  }

  return best;
}

function main() {
  const pincodeData = loadPincodes();

  const cases = [
    { name: 'Amritsar', lat: 31.634, lng: 74.8723 },
    { name: 'Tarn Taran', lat: 31.451, lng: 74.927 },
    { name: 'Gurdaspur', lat: 32.041, lng: 75.404 },
    { name: 'Pathankot', lat: 32.273, lng: 75.652 },
    { name: 'Jalandhar', lat: 31.326, lng: 75.576 },
    { name: 'Ludhiana', lat: 30.901, lng: 75.857 },
    { name: 'Patiala', lat: 30.3398, lng: 76.3869 },
    { name: 'Bathinda', lat: 30.211, lng: 74.951 },
    { name: 'Ferozepur', lat: 30.9257, lng: 74.613 },
  ];

  console.log(`Loaded pincodes: ${pincodeData.size}`);
  for (const item of cases) {
    const matched = matchByCoordinates(pincodeData, item.lat, item.lng);
    if (!matched) {
      console.log(`${item.name}: no-match`);
      continue;
    }

    console.log(
      `${item.name}: ${matched.data.pincode} | ${matched.method} | distance=${matched.distanceKm.toFixed(3)}km | district=${matched.data.district || 'N/A'}`,
    );
  }
}

main();
