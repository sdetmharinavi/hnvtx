// utils/distance.ts

/**
 * Calculates the straight-line distance between two points using the Haversine formula.
 * Safely handles null, undefined, and non-numeric inputs.
 */
export function haversineDistance(
  lat1: number | string | null | undefined,
  lon1: number | string | null | undefined,
  lat2: number | string | null | undefined,
  lon2: number | string | null | undefined
): number {
  const parseCoord = (val: unknown): number | null => {
    if (val === null || val === undefined) return null;
    const num = Number(val);
    return isNaN(num) || !isFinite(num) ? null : num;
  };

  const l1 = parseCoord(lat1);
  const n1 = parseCoord(lon1);
  const l2 = parseCoord(lat2);
  const n2 = parseCoord(lon2);

  // Safely fallback to 0 if coordinates are invalid or uninitialized
  if (l1 === null || n1 === null || l2 === null || n2 === null) {
    return 0;
  }

  const R = 6371; // Radius of the Earth in km
  const dLat = (l2 - l1) * (Math.PI / 180);
  const dLon = (n2 - n1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(l1 * (Math.PI / 180)) *
      Math.cos(l2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // in kilometers
}

/**
 * Calculates the total length of a GeoJSON geometry.
 */
export function calculateGeoJsonLength(geometry: { type: string; coordinates: unknown }): number {
  if (!geometry || !geometry.coordinates) return 0;

  let totalKm = 0;

  const calculateLineStringLength = (coords: unknown): number => {
    if (!Array.isArray(coords)) return 0;

    let dist = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const p1 = coords[i];
      const p2 = coords[i + 1];

      if (Array.isArray(p1) && Array.isArray(p2) && p1.length >= 2 && p2.length >= 2) {
        const [lon1, lat1] = p1;
        const [lon2, lat2] = p2;
        dist += haversineDistance(lat1, lon1, lat2, lon2);
      }
    }
    return dist;
  };

  if (geometry.type === 'LineString') {
    totalKm += calculateLineStringLength(geometry.coordinates);
  } else if (geometry.type === 'MultiLineString') {
    const multiCoords = geometry.coordinates;
    if (Array.isArray(multiCoords)) {
      multiCoords.forEach((coords) => {
        totalKm += calculateLineStringLength(coords);
      });
    }
  }

  return totalKm * 1000; // Return in meters
}
