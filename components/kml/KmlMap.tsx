// components/kml/KmlMap.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import * as toGeoJSON from '@mapbox/togeojson'; 
import JSZip from 'jszip';
import { toPng } from 'html-to-image'; // THE FIX: Replaced html2canvas
import 'leaflet/dist/leaflet.css';
import { PageSpinner } from '@/components/common/ui';
import { Maximize, Minimize, Printer, RotateCw, RotateCcw, Plus, Minus, Camera } from 'lucide-react';
import useIsMobile from '@/hooks/useIsMobile';
import { calculateGeoJsonLength } from '@/utils/distance';
import { toast } from 'sonner';
import { MeasureController } from './MeasureController'; // IMPORTED

interface KmlMapProps {
  kmlUrl: string | null;
}

// --- HELPER: ROTATE IMAGE DATA URL ---
const rotateImage = (dataUrl: string, degrees: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      const rads = (degrees * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rads));
      const cos = Math.abs(Math.cos(rads));

      // Calculate new container width/height based on rotation
      canvas.width = img.width * cos + img.height * sin;
      canvas.height = img.width * sin + img.height * cos;

      // Move to center, rotate, move back
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rads);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
};

// --- ROTATION DRAG HANDLER (Unchanged) ---
const RotatedDragOverlay = ({ map, rotation }: { map: L.Map; rotation: number }) => {
  const isDragging = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const mapWithTap = map as L.Map & { tap?: L.Handler };

  useEffect(() => {
    if (rotation !== 0) {
      map.dragging.disable();
      if (mapWithTap.tap) mapWithTap.tap.disable();
    } else {
      map.dragging.enable();
      if (mapWithTap.tap) mapWithTap.tap.enable();
    }
  }, [map, rotation, mapWithTap]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (rotation === 0) return; 
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault(); 
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !lastPos.current || rotation === 0) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    let panX = 0; let panY = 0;
    const r = ((rotation % 360) + 360) % 360;
    if (r === 90) { panX = -dy; panY = dx; } 
    else if (r === 180) { panX = dx; panY = dy; } 
    else if (r === 270) { panX = dy; panY = -dx; } 
    else { panX = -dx; panY = -dy; }
    map.panBy([panX, panY], { animate: false });
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    lastPos.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  if (rotation === 0) return null;
  return <div className="absolute inset-0 z-1000 cursor-move" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} style={{ touchAction: 'none' }} />;
};

const extractKmlStyles = (doc: Document): Record<string, string> => {
  const styleMap: Record<string, string> = {};
  const styles = doc.getElementsByTagName('Style');
  for (let i = 0; i < styles.length; i++) {
    const style = styles[i];
    const id = style.getAttribute('id');
    const icon = style.getElementsByTagName('Icon')[0];
    if (id && icon) {
      let href = icon.getElementsByTagName('href')[0]?.textContent?.trim();
      if (href) { href = href.replace(/^http:\/\//i, 'https://'); styleMap[`#${id}`] = href; }
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
      if (key === 'normal') { normalStyleUrl = pairs[j].getElementsByTagName('styleUrl')[0]?.textContent?.trim() || ''; break; }
    }
    if (id && normalStyleUrl && styleMap[normalStyleUrl]) styleMap[`#${id}`] = styleMap[normalStyleUrl];
  }
  return styleMap;
};

const MapController = ({ data, isFullScreen, rotation }: { data: GeoJSON.FeatureCollection | null, isFullScreen: boolean, rotation: number }) => {
  const map = useMap();
  useEffect(() => {
    if (data && map) {
      try {
        const geoJsonLayer = L.geoJSON(data);
        const bounds = geoJsonLayer.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      } catch (e) { console.error("Error fitting bounds", e); }
    }
  }, [data, map]);
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 400); 
    return () => clearTimeout(timer);
  }, [isFullScreen, rotation, map]);
  useEffect(() => {
    const handleBeforePrint = () => {
        map.invalidateSize();
        if (data) {
             const geoJsonLayer = L.geoJSON(data);
             const bounds = geoJsonLayer.getBounds();
             if (bounds.isValid()) map.fitBounds(bounds, { animate: false });
        }
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    return () => window.removeEventListener('beforeprint', handleBeforePrint);
  }, [map, data]);
  return <RotatedDragOverlay map={map} rotation={rotation} />;
};

export default function KmlMap({ kmlUrl }: KmlMapProps) {
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [kmlStyles, setKmlStyles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0); 
  const isMobile = useIsMobile();
  
  // NEW STATE: Measurement Tool
  const [isMeasureMode, setIsMeasureMode] = useState(false);

  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const mapRef = useRef<L.Map | null>(null);
  const defaultIconRef = useRef<L.Icon | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
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
            iconSize: [12, 20], iconAnchor: [6, 20], popupAnchor: [0, -20], shadowSize: [20, 20], shadowAnchor: [6, 20] 
        });
    }

    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setRotation(0); 
    }
    return () => { document.body.style.overflow = ''; };
  }, [isFullScreen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { 
        if (e.key === 'Escape') {
            if (isMeasureMode) setIsMeasureMode(false);
            else setIsFullScreen(false);
        } 
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isMeasureMode]); // Add dependency

  useEffect(() => {
    if (!kmlUrl) { setGeoJsonData(null); setKmlStyles({}); setErrorMsg(null); return; }

    const fetchAndParseData = async () => {
      setLoading(true); setErrorMsg(null); setGeoJsonData(null); setKmlStyles({});
      try {
        const response = await fetch(kmlUrl);
        if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
        const arrayBuffer = await response.arrayBuffer();
        let kmlText = "";
        try {
          const zip = await JSZip.loadAsync(arrayBuffer);
          const kmlFileName = Object.keys(zip.files).find(name => name.toLowerCase().endsWith('.kml'));
          if (kmlFileName) kmlText = await zip.file(kmlFileName)!.async("string");
          else throw new Error("No KML in zip"); 
        } catch (e) {
          void e;
          const decoder = new TextDecoder("utf-8");
          kmlText = decoder.decode(arrayBuffer);
        }
        const cleanText = kmlText.trim();
        if (!cleanText.startsWith('<')) throw new Error("File content is not valid XML/KML.");
        const parser = new DOMParser();
        const kmlDom = parser.parseFromString(cleanText, 'text/xml');
        if (kmlDom.querySelector("parsererror")) throw new Error("XML Parsing Error: Invalid syntax.");
        const styles = extractKmlStyles(kmlDom);
        setKmlStyles(styles);
        const converted = toGeoJSON.kml(kmlDom);
        if (converted && converted.features && converted.features.length > 0) setGeoJsonData(converted);
        else setErrorMsg("File contains no valid geographical data.");
      } catch (error) {
        console.error("Error parsing file:", error);
        setErrorMsg(error instanceof Error ? error.message : "Failed to parse file");
      } finally { setLoading(false); }
    };
    fetchAndParseData();
  }, [kmlUrl]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pointToLayer = (feature: any, latlng: L.LatLng) => {
    const styleUrl = feature.properties?.styleUrl;
    const iconUrl = styleUrl ? kmlStyles[styleUrl] : null;
    if (iconUrl) {
      const customIcon = L.icon({
        iconUrl: iconUrl, iconSize: [16, 16], iconAnchor: [8, 16], popupAnchor: [0, -16],
      });
      return L.marker(latlng, { icon: customIcon });
    }
    return L.marker(latlng, { icon: defaultIconRef.current || undefined });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onEachFeature = (feature: any, layer: L.Layer) => {
    // Disable popup interactions if in measure mode to prevent clicks being captured
    if (isMeasureMode) {
        layer.unbindPopup();
        return;
    }

    if (feature.properties) {
      const { name, description } = feature.properties;
      let extraContent = "";
      if (feature.geometry.type === "Point") {
        const [lng, lat] = feature.geometry.coordinates;
        extraContent += `<div class="text-xs text-gray-500 mt-1">Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}</div>`;
      }
      if (feature.geometry.type === "LineString" || feature.geometry.type === "MultiLineString") {
         const distanceMeters = calculateGeoJsonLength(feature.geometry);
         const distDisplay = distanceMeters > 1000 ? `${(distanceMeters / 1000).toFixed(2)} km` : `${distanceMeters.toFixed(0)} m`;
         extraContent += `<div class="text-xs text-blue-600 font-semibold mt-1 border-t pt-1 border-gray-200">Path Length: ${distDisplay}</div>`;
      }
      if (name || description || extraContent) {
        let popupContent = `<div class="font-sans p-1 min-w-[200px]">`;
        if (name) popupContent += `<h3 class="font-bold text-sm mb-1">${name}</h3>`;
        if (description) popupContent += `<div class="text-xs text-gray-600 max-h-32 overflow-y-auto mb-1">${description}</div>`;
        popupContent += extraContent;
        popupContent += `</div>`;
        layer.bindPopup(popupContent, { autoClose: false, closeOnClick: false, closeButton: true });
        layer.on({
          popupopen: (e) => { const l = e.target; if (l.setStyle && feature.geometry.type !== 'Point') l.setStyle({ weight: isMobile ? 10 : 7, opacity: 1 }); },
          popupclose: (e) => { const l = e.target; if (l.setStyle && feature.geometry.type !== 'Point') l.setStyle({ weight: isMobile ? 8 : 4, opacity: 0.8 }); }
        });
      }
    }
  };

  const handleRotate = (deg: number) => {
    setRotation(prev => prev + deg);
  };

  const handlePrint = () => {
    window.print();
  };

  // --- SAVE IMAGE (ROBUST) ---
  const handleSaveImage = async () => {
    if (!containerRef.current || !mapRef.current) return;
    
    setIsGeneratingImage(true);
    const toastId = toast.loading("Generating High-Res Image...");

    // Store the current rotation to restore later
    const currentRotation = rotation;

    try {
      // 1. Temporarily reset rotation to 0
      // This is crucial because standard DOM-to-image libraries can struggle with 
      // rotated elements, especially complex ones like Leaflet containers.
      setRotation(0);
      
      // 2. Wait for the state update and re-render
      await new Promise(resolve => setTimeout(resolve, 800));

      // 3. Force map to redraw in 0-degree state to ensure tiles are loaded
      mapRef.current.invalidateSize();

      // 4. Capture the map using html-to-image
      // This library uses SVG serialization which handles modern CSS variables better than html2canvas
      const dataUrl = await toPng(containerRef.current, {
        cacheBust: true,
        pixelRatio: 2, // High resolution
        backgroundColor: '#f3f4f6', // Ensure a background color if tiles have gaps
        filter: (node) => {
            // Exclude controls that shouldn't appear in the image
            return !node.classList?.contains('no-print');
        }
      });

      // 5. If the map was rotated, apply that rotation to the captured image manually
      let finalDataUrl = dataUrl;
      
      if (currentRotation !== 0) {
        finalDataUrl = await rotateImage(dataUrl, currentRotation);
      }

      // 6. Download the resulting image
      const link = document.createElement('a');
      link.download = `kml-map-view-${new Date().toISOString().split('T')[0]}.png`;
      link.href = finalDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Image saved successfully!", { id: toastId });

    } catch (error) {
      console.error("Snapshot failed:", error);
      toast.error("Failed to generate image.", { id: toastId });
    } finally {
      // 7. Restore original rotation state
      setRotation(currentRotation);
      setIsGeneratingImage(false);
    }
  };

  const containerClass = isFullScreen 
    ? "fixed inset-0 z-[9999] bg-gray-100 dark:bg-gray-900 printable-map-container" 
    : "h-full w-full relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 printable-map-container";

  const getMapStyle = () => {
    if (isFullScreen && (Math.abs(rotation) % 180 !== 0)) {
        return {
            width: '100vh',
            height: '100vw',
            position: 'absolute' as const,
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            transition: 'all 0.5s ease-in-out'
        };
    }
    return {
        width: '100%',
        height: '100%',
        transform: `rotate(${rotation}deg)`,
        transition: 'all 0.5s ease-in-out'
    };
  };

  return (
    <div className={containerClass} ref={containerRef}>
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

      {/* Map Controls */}
      <div className="absolute bottom-6 right-4 z-1000 flex flex-col gap-2 no-print">
        
        {/* Tool Group */}
        <div className="flex flex-col gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-600">
           {/* MEASURE BUTTON */}
           <button
            onClick={() => setIsMeasureMode(!isMeasureMode)}
            className={`p-2 transition-colors ${
              isMeasureMode 
              ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300" 
              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
            title="Measure Distance"
           >
             <Ruler size={18} />
           </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex flex-col gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-600">
           <button 
             onClick={() => mapRef.current?.zoomIn()}
             className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
             title="Zoom In"
           >
             <Plus size={18} />
           </button>
           <button 
             onClick={() => mapRef.current?.zoomOut()}
             className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-600"
             title="Zoom Out"
           >
             <Minus size={18} />
           </button>
        </div>

        {/* Rotation Controls */}
        {isFullScreen && (
          <div className="flex flex-col gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-600">
             <button 
               onClick={() => handleRotate(-90)}
               className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
               title="Rotate Left"
             >
               <RotateCcw size={18} />
             </button>
             <button 
               onClick={() => handleRotate(90)}
               className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-600"
               title="Rotate Right"
             >
               <RotateCw size={18} />
             </button>
          </div>
        )}

        {/* Capture / Print Actions */}
        <div className="flex flex-col gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-600">
            <button
                onClick={handleSaveImage}
                disabled={isGeneratingImage}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50"
                title="Save as PNG"
            >
                <Camera size={18} className={isGeneratingImage ? 'animate-pulse' : ''} />
            </button>
            <button
                onClick={handlePrint}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-600"
                title="Print Map View"
            >
                <Printer size={18} />
            </button>
        </div>

        {/* Fullscreen Button */}
        <button
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
        >
          {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </button>
      </div>
      
      {/* Map Wrapper with Dynamic Rotation Styles */}
      <div style={getMapStyle()}>
        <MapContainer
          center={[22.57, 88.36]} 
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          className="z-0 bg-gray-100 dark:bg-gray-800"
          closePopupOnClick={false}
          zoomControl={false} 
          ref={mapRef}
          keyboard={false} 
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Street View">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
                crossOrigin="anonymous" 
              />
            </LayersControl.BaseLayer>
            
            <LayersControl.BaseLayer name="Satellite View">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                crossOrigin="anonymous" 
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
              <MapController data={geoJsonData} isFullScreen={isFullScreen} rotation={rotation} />
            </>
          )}

          {/* New Measurement Controller */}
          <MeasureController 
             isActive={isMeasureMode} 
             onClose={() => setIsMeasureMode(false)} 
          />

        </MapContainer>
      </div>
    </div>
  );
}
