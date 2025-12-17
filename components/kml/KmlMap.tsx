// components/kml/KmlMap.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import * as toGeoJSON from '@mapbox/togeojson'; 
import JSZip from 'jszip';
import 'leaflet/dist/leaflet.css';
import { PageSpinner } from '@/components/common/ui';
import { Maximize, Minimize } from 'lucide-react';
import useIsMobile from '@/hooks/useIsMobile';

interface KmlMapProps {
  kmlUrl: string | null;
}

// Helper to extract KML Styles
const extractKmlStyles = (doc: Document): Record<string, string> => {
  const styleMap: Record<string, string> = {};
  
  const styles = doc.getElementsByTagName('Style');
  for (let i = 0; i < styles.length; i++) {
    const style = styles[i];
    const id = style.getAttribute('id');
    const icon = style.getElementsByTagName('Icon')[0];
    if (id && icon) {
      let href = icon.getElementsByTagName('href')[0]?.textContent?.trim();
      if (href) {
        href = href.replace(/^http:\/\//i, 'https://');
        styleMap[`#${id}`] = href;
      }
    }
  }

  const styleMaps = doc.getElementsByTagName('StyleMap');
  for (let i = 0; i < styleMaps.length; i++) {
    const sm = styleMaps[i];
    const id = sm.getAttribute('id');
    const pairs = sm.getElementsByTagName('Pair');
    let normalStyleUrl = '';

    for (let j = 0; j < pairs.length; j++) {
      const key = pairs[j].getElementsByTagName('key')[0]?.textContent;
      if (key === 'normal') {
        normalStyleUrl = pairs[j].getElementsByTagName('styleUrl')[0]?.textContent?.trim() || '';
        break;
      }
    }

    if (id && normalStyleUrl && styleMap[normalStyleUrl]) {
      styleMap[`#${id}`] = styleMap[normalStyleUrl];
    }
  }
  
  return styleMap;
};

const MapController = ({ 
  data, 
  isFullScreen 
}: { 
  data: GeoJSON.FeatureCollection | null, 
  isFullScreen: boolean 
}) => {
  const map = useMap();
  
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

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);
    return () => clearTimeout(timer);
  }, [isFullScreen, map]);

  return null;
};

export default function KmlMap({ kmlUrl }: KmlMapProps) {
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [kmlStyles, setKmlStyles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  // THE FIX: Store default icon in ref or state to ensure 'L' is accessed only on client
  const defaultIconRef = useRef<L.Icon | null>(null);

  useEffect(() => {
    // Initialize Leaflet globals only on client side
    if (typeof window !== 'undefined') {
        // Fix for default marker icons
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
            iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
            shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
        });

        defaultIconRef.current = L.icon({
            iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
            iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
            shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
            iconSize: [12, 20],
            iconAnchor: [6, 20],
            popupAnchor: [0, -20],
            shadowSize: [20, 20],
            shadowAnchor: [6, 20] 
        });
    }

    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isFullScreen]);

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
      setKmlStyles({});
      setErrorMsg(null);
      return;
    }

    const fetchAndParseData = async () => {
      setLoading(true);
      setErrorMsg(null);
      setGeoJsonData(null);
      setKmlStyles({});

      try {
        const response = await fetch(kmlUrl);
        if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        let kmlText = "";

        try {
          const zip = await JSZip.loadAsync(arrayBuffer);
          const kmlFileName = Object.keys(zip.files).find(name => name.toLowerCase().endsWith('.kml'));
          
          if (kmlFileName) {
            kmlText = await zip.file(kmlFileName)!.async("string");
          } else {
            throw new Error("No KML in zip"); 
          }
        } catch (e) {
          void e;
          const decoder = new TextDecoder("utf-8");
          kmlText = decoder.decode(arrayBuffer);
        }
        
        const cleanText = kmlText.trim();
        if (!cleanText.startsWith('<')) {
             throw new Error("File content is not valid XML/KML.");
        }

        const parser = new DOMParser();
        const kmlDom = parser.parseFromString(cleanText, 'text/xml');

        if (kmlDom.querySelector("parsererror")) {
            throw new Error("XML Parsing Error: Invalid syntax.");
        }
        
        const styles = extractKmlStyles(kmlDom);
        setKmlStyles(styles);

        const converted = toGeoJSON.kml(kmlDom);
        
        if (converted && converted.features && converted.features.length > 0) {
            setGeoJsonData(converted);
        } else {
            setErrorMsg("File contains no valid geographical data.");
        }

      } catch (error) {
        console.error("Error parsing file:", error);
        setErrorMsg(error instanceof Error ? error.message : "Failed to parse file");
      } finally {
        setLoading(false);
      }
    };

    fetchAndParseData();
  }, [kmlUrl]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pointToLayer = (feature: any, latlng: L.LatLng) => {
    const styleUrl = feature.properties?.styleUrl;
    const iconUrl = styleUrl ? kmlStyles[styleUrl] : null;

    if (iconUrl) {
      const customIcon = L.icon({
        iconUrl: iconUrl,
        iconSize: [16, 16],
        iconAnchor: [8, 16],
        popupAnchor: [0, -16],
      });
      return L.marker(latlng, { icon: customIcon });
    }
    // Safe fallback using ref
    return L.marker(latlng, { icon: defaultIconRef.current || undefined });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties) {
      const { name, description } = feature.properties;
      
      let coordsHtml = "";
      if (feature.geometry.type === "Point") {
        const [lng, lat] = feature.geometry.coordinates;
        coordsHtml = `<div class="text-xs text-gray-500 mt-1">Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}</div>`;
      }

      if (name || description || coordsHtml) {
        let popupContent = `<div class="font-sans p-1 min-w-[200px]">`;
        if (name) popupContent += `<h3 class="font-bold text-sm mb-1">${name}</h3>`;
        if (description) popupContent += `<div class="text-xs text-gray-600 max-h-32 overflow-y-auto mb-1">${description}</div>`;
        popupContent += coordsHtml;
        popupContent += `</div>`;
        
        layer.bindPopup(popupContent, {
          autoClose: false,    
          closeOnClick: false, 
          closeButton: true    
        });

        layer.on({
          popupopen: (e) => {
             const l = e.target;
             // Only style paths/polygons, not markers
             if (l.setStyle && feature.geometry.type !== 'Point') {
               const letters = '0123456789ABCDEF';
               let color = '#';
               for (let i = 0; i < 6; i++) { color += letters[Math.floor(Math.random() * 16)]; }
               
               l.setStyle({ color: color, weight: isMobile ? 10 : 7, opacity: 1 });
             }
          },
          popupclose: (e) => {
            const l = e.target;
            if (l.setStyle && feature.geometry.type !== 'Point') {
              l.setStyle({ color: "#3b82f6", weight: isMobile ? 8 : 4, opacity: 0.8 });
            }
          }
        });
      }
    }
  };

  const containerClass = isFullScreen 
    ? "fixed inset-0 z-[9999] bg-gray-100 dark:bg-gray-900" 
    : "h-full w-full relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700";

  return (
    <div className={containerClass}>
      {loading && (
        <div className="absolute inset-0 z-1000 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center backdrop-blur-sm">
           <PageSpinner text="Processing File..." />
        </div>
      )}

      {errorMsg && !loading && (
        <div className="absolute inset-0 z-999 bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center text-red-500 p-4 text-center">
           <p className="font-semibold mb-2">Error Loading Preview</p>
           <p className="text-sm text-gray-500 dark:text-gray-400">{errorMsg}</p>
        </div>
      )}

      {/* Fullscreen Toggle */}
      <button
        onClick={() => setIsFullScreen(!isFullScreen)}
        className="absolute bottom-6 right-4 z-1000 p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        title={isFullScreen ? "Exit Full Screen (Esc)" : "Enter Full Screen"}
      >
        {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
      </button>
      
      <MapContainer
        center={[22.57, 88.36]} 
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        className="z-0 bg-gray-100 dark:bg-gray-800"
        closePopupOnClick={false}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Street View">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="Satellite View">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        {geoJsonData && (
          <>
            <GeoJSON 
              key={kmlUrl} 
              data={geoJsonData} 
              onEachFeature={onEachFeature}
              pointToLayer={pointToLayer}
              style={() => ({ 
                  color: "#3b82f6", 
                  weight: isMobile ? 8 : 4,
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