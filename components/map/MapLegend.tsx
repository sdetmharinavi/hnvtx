// components/map/MapLegend.tsx
import { useState } from "react";
import Image from "next/image";
import { FiChevronDown, FiChevronUp, FiMap } from "react-icons/fi";
import { 
  SVG_NETWORK_SWITCH, 
  SVG_COMPASS, 
  SVG_NETWORK_NODE 
} from "@/utils/getNodeIcons";

interface LegendItemProps {
  icon?: string;   
  imgSrc?: string; 
  color?: string;  
  label: string;
  type?: 'icon' | 'line';
  dashed?: boolean;
  weight?: number;
}

const LegendItem = ({ icon, imgSrc, color, label, type = 'icon', dashed, weight = 2 }: LegendItemProps) => (
  <div className="flex items-center gap-3 py-1">
    <div className="w-8 flex justify-center items-center">
      {type === 'icon' && icon && !imgSrc && (
        <div className="w-4 h-6" dangerouslySetInnerHTML={{ __html: icon }} />
      )}
      {type === 'icon' && imgSrc && (
        <div className="relative w-6 h-8">
          <Image src={imgSrc} alt={label} fill className="object-contain drop-shadow-sm" sizes="24px" />
        </div>
      )}
      {type === 'line' && (
        <div 
          className="w-8 h-0" 
          style={{ 
            borderTop: dashed ? `${weight}px dashed ${color}` : `${weight}px solid ${color}` 
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
          
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 mt-1">Key Equipment</div>
          <LegendItem imgSrc="/images/switch_image.png" label="MAAN Aggregator" />
          <LegendItem imgSrc="/images/bts_image.png" label="BTS Tower / Baseband" />
          <LegendItem imgSrc="/images/bts_rl_image.png" label="Radio Link / Microwave" />

          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 mt-2">Network Nodes</div>
          <LegendItem icon={SVG_NETWORK_SWITCH} label="CPAN / Aggregation" />
          <LegendItem icon={SVG_COMPASS} label="Exchange / Terminal" />
          <LegendItem icon={SVG_NETWORK_NODE} label="Network Node / OLT" />
          
          <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
          
          {/* THE FIX: Updated Legend to accurately reflect the new calculated line weights */}
          {/* 100G: base(4) + 8 = 12px */}
          {/* 10G: base(4) + 4 = 8px */}
          {/* 1G: base(4) = 4px */}
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Bandwidth Capacity</div>
          <LegendItem type="line" color="#64748b" label="100G+" weight={12} />
          <LegendItem type="line" color="#64748b" label="10G" weight={8} />
          <LegendItem type="line" color="#64748b" label="2.5G" weight={5.5} />
          <LegendItem type="line" color="#64748b" label="1G / Standard" weight={4} />
          
          <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status / Type</div>
          <LegendItem type="line" color="#3b82f6" label="Active Route" weight={4} />
          <LegendItem type="line" color="#ef4444" label="Inactive Route" weight={4} />
          <LegendItem type="line" color="#ef4444" label="Logical / Spur Path" dashed weight={2} />
        </div>
      )}
    </div>
  );
}