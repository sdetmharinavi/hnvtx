// hooks/data/useKmlData.ts
'use client';

import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import * as toGeoJSON from '@mapbox/togeojson';

export function useKmlData(kmlUrl: string | null | undefined) {
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!kmlUrl) {
      setGeoJsonData(null);
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(kmlUrl);
        if (!response.ok) throw new Error(`Failed to fetch KML: ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        let kmlText = "";

        try {
          // Attempt to read as a zipped .kmz file
          const zip = await JSZip.loadAsync(arrayBuffer);
          const kmlFileName = Object.keys(zip.files).find(name => name.toLowerCase().endsWith('.kml'));
          if (kmlFileName) {
            kmlText = await zip.file(kmlFileName)!.async("string");
          } else {
            throw new Error("No KML file found inside the KMZ archive.");
          }
        } catch (zipError) {
          // If it fails, assume it is a raw unzipped .kml file
          const decoder = new TextDecoder("utf-8");
          kmlText = decoder.decode(arrayBuffer);
        }

        const cleanText = kmlText.trim();
        if (!cleanText.startsWith('<')) throw new Error("File content is not valid XML/KML.");

        const parser = new DOMParser();
        const kmlDom = parser.parseFromString(cleanText, 'text/xml');

        if (kmlDom.querySelector("parsererror")) {
          throw new Error("XML Parsing Error: Invalid syntax.");
        }

        const converted = toGeoJSON.kml(kmlDom);

        if (isMounted) {
          setGeoJsonData(converted);
        }
      } catch (err) {
        console.error("Error parsing KML:", err);
        if (isMounted) setError(err instanceof Error ? err.message : 'Error parsing KML');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [kmlUrl]);

  return { geoJsonData, isLoading, error };
}