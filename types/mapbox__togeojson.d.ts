declare module '@mapbox/togeojson' {
  import type { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';

  // Minimal typings for the commonly used conversions
  export function kml(
    doc: Document
  ): FeatureCollection<Geometry, GeoJsonProperties>;

  export function gpx(
    doc: Document
  ): FeatureCollection<Geometry, GeoJsonProperties>;
}
