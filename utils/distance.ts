// utils/distance.ts

// Straight-Line Distance (Haversine Formula)
export function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // in kilometers
  }
  
// Calculate total length of a path (GeoJSON coordinates: [lng, lat])
export function calculateGeoJsonLength(geometry: { type: string; coordinates: unknown }): number {
  let totalKm = 0;

  const calculateLineStringLength = (coords: number[][]) => {
      let dist = 0;
      for (let i = 0; i < coords.length - 1; i++) {
          const [lon1, lat1] = coords[i];
          const [lon2, lat2] = coords[i + 1];
          dist += haversineDistance(lat1, lon1, lat2, lon2);
      }
      return dist;
  };

  if (geometry.type === 'LineString') {
      totalKm += calculateLineStringLength(geometry.coordinates as number[][]);
  } else if (geometry.type === 'MultiLineString') {
      const multiCoords = geometry.coordinates as number[][][];
      multiCoords.forEach(coords => {
          totalKm += calculateLineStringLength(coords);
      });
  }

  return totalKm * 1000; // Return in meters
}