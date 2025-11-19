// components/kml/KmlMap.tsx
'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import * as toGeoJSON from '@mapbox/togeojson'; 
import 'leaflet/dist/leaflet.css';
import { PageSpinner } from '@/components/common/ui';
import { Maximize, Minimize } from 'lucide-react';

// Fix for default marker icons in Next.js
const iconDefault = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = iconDefault;

interface KmlMapProps {
  kmlUrl: string | null;
}

// Component to auto-zoom to the KML bounds and handle resize
const MapController = ({ 
  data, 
  isFullScreen 
}: { 
  data: GeoJSON.FeatureCollection | null, 
  isFullScreen: boolean 
}) => {
  const map = useMap();
  
  // Handle Auto-zoom when data loads
  useEffect(() => {
    if (data && map) {
      try {
        const geoJsonLayer = L.geoJSON(data);
        const bounds = geoJsonLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
      } catch (e) {
        console.error("Error fitting bounds", e);
      }
    }
  }, [data, map]);

  // Handle Map Resize when toggling fullscreen
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300); // Delay to match CSS transition
    return () => clearTimeout(timer);
  }, [isFullScreen, map]);

  return null;
};

export default function KmlMap({ kmlUrl }: KmlMapProps) {
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Handle body scroll lock when in full screen
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullScreen]);

  // Listen for ESC key to exit full screen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullScreen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    if (!kmlUrl) {
      setGeoJsonData(null);
      return;
    }

    const fetchAndParseKml = async () => {
      setLoading(true);
      try {
        // Fetch the raw KML content
        const response = await fetch(kmlUrl);
        const text = await response.text();
        
        // Parse XML string to DOM
        const parser = new DOMParser();
        const kmlDom = parser.parseFromString(text, 'text/xml');
        
        // Convert DOM to GeoJSON using mapbox/togeojson
        const converted = toGeoJSON.kml(kmlDom);
        
        // Basic validation to ensure we have features
        if (converted && converted.features && converted.features.length > 0) {
            setGeoJsonData(converted);
        } else {
            console.warn("Parsed KML has no features");
            setGeoJsonData(null);
        }

      } catch (error) {
        console.error("Error parsing KML:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndParseKml();
  }, [kmlUrl]);

  // Style for GeoJSON features
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties) {
      const { name, description } = feature.properties;
      let popupContent = `<div class="font-sans p-1">`;
      if (name) popupContent += `<h3 class="font-bold text-sm mb-1">${name}</h3>`;
      if (description) popupContent += `<div class="text-xs text-gray-600">${description}</div>`;
      popupContent += `</div>`;
      
      layer.bindPopup(popupContent);
    }
  };

  const containerClass = isFullScreen 
    ? "fixed inset-0 z-[9999] bg-gray-100 dark:bg-gray-900" 
    : "h-full w-full relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700";

  return (
    <div className={containerClass}>
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-[1000] bg-white/80 dark:bg-gray-900/80 flex items-center justify-center backdrop-blur-sm">
           <PageSpinner text="Parsing KML Data..." />
        </div>
      )}

      {/* Fullscreen Toggle Button */}
      <button
        onClick={() => setIsFullScreen(!isFullScreen)}
        className="absolute top-4 right-4 z-[1000] p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        title={isFullScreen ? "Exit Full Screen (Esc)" : "Enter Full Screen"}
      >
        {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
      </button>
      
      <MapContainer
        center={[22.57, 88.36]} // Default to Kolkata
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        className="z-0 bg-gray-100 dark:bg-gray-800"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        {geoJsonData && (
          <>
            <GeoJSON 
              key={kmlUrl} // Force re-render when URL changes
              data={geoJsonData} 
              onEachFeature={onEachFeature}
              style={() => ({
                color: "#3b82f6", // Blue color for lines
                weight: 4,
                opacity: 0.8
              })}
            />
            <MapController data={geoJsonData} isFullScreen={isFullScreen} />
          </>
        )}
      </MapContainer>
    </div>
  );
}