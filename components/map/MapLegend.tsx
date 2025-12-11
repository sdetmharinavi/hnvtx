// path: components/map/MapLegend.tsx
import { useState } from "react";
import Image from "next/image";
import { FiChevronDown, FiChevronUp, FiMap } from "react-icons/fi";
import { 
  SVG_NETWORK_SWITCH, 
  SVG_COMPASS, 
  SVG_NETWORK_NODE 
} from "@/utils/getNodeIcons";

interface LegendItemProps {
  icon?: string;   // Inline SVG string
  imgSrc?: string; // Path to PNG image (e.g., '/images/bts.png')
  color?: string;  // For lines
  label: string;
  type?: 'icon' | 'line';
  dashed?: boolean;
}

const LegendItem = ({ icon, imgSrc, color, label, type = 'icon', dashed }: LegendItemProps) => (
  <div className="flex items-center gap-3 py-1">
    <div className="w-8 flex justify-center items-center">
      {/* 1. Render SVG Icon */}
      {type === 'icon' && icon && !imgSrc && (
        <div 
          className="w-4 h-6" 
          dangerouslySetInnerHTML={{ __html: icon }} 
        />
      )}

      {/* 2. Render PNG Image */}
      {type === 'icon' && imgSrc && (
        <div className="relative w-6 h-8">
          <Image 
            src={imgSrc} 
            alt={label}
            fill
            className="object-contain drop-shadow-sm"
            sizes="24px"
          />
        </div>
      )}

      {/* 3. Render Polyline Style */}
      {type === 'line' && (
        <div 
          className="w-8 h-0.5" 
          style={{ 
            backgroundColor: dashed ? 'transparent' : color,
            borderTop: dashed ? `2px dashed ${color}` : 'none' 
          }} 
        />
      )}
    </div>
    <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{label}</span>
  </div>
);

export function MapLegend() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute bottom-4 left-4 z-900 w-60 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FiMap className="text-blue-500" />
          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">Map Legend</span>
        </div>
        {isOpen ? <FiChevronDown className="text-gray-500" /> : <FiChevronUp className="text-gray-500" />}
      </button>

      {isOpen && (
        <div className="p-3 space-y-0.5 max-h-[40vh] overflow-y-auto custom-scrollbar text-xs">
          
          {/* PNG BASED ICONS (High Priority Equipment) */}
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 mt-1">Key Equipment</div>
          <LegendItem imgSrc="/images/switch_image.png" label="MAAN Aggregator" />
          <LegendItem imgSrc="/images/bts_image.png" label="BTS Tower / Baseband" />
          <LegendItem imgSrc="/images/bts_rl_image.png" label="Radio Link / Microwave" />

          {/* SVG BASED ICONS (Generic/Other) */}
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 mt-2">Network Nodes</div>
          <LegendItem icon={SVG_NETWORK_SWITCH} label="CPAN / Aggregation" />
          <LegendItem icon={SVG_COMPASS} label="Exchange / Terminal" />
          <LegendItem icon={SVG_NETWORK_NODE} label="Network Node / OLT" />
          
          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
          
          {/* LINES */}
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Connection Status</div>
          <LegendItem type="line" color="#3b82f6" label="Active Route" />
          <LegendItem type="line" color="#ef4444" label="Inactive Route" />
          <LegendItem type="line" color="#ef4444" label="Logical / Spur Path" dashed />
        </div>
      )}
    </div>
  );
}