// import L from 'leaflet';

// // Helper to create a DivIcon from an inline SVG string while controlling size/anchor
// const createSvgDivIcon = (
//   svg: string,
//   size: [number, number] = [40, 40],
//   anchor: [number, number] = [20, 20]
// ) =>
//   L.divIcon({
//     className: 'leaflet-inline-svg-icon',
//     iconSize: size,
//     iconAnchor: anchor,
//     html: `
//       <div style="width:${size[0]}px;height:${size[1]}px;display:flex;align-items:center;justify-content:center">
//         ${svg}
//       </div>
//     `,
//   });

// // Inline SVGs adapted from svgs/*.jsx, sized to fill container
// const SVG_CELL_TOWER = `
// <svg viewBox="0 0 120 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
//   <path d="M60 0 C27 0 0 27 0 60 C0 75 5 88 13 99 L60 160 L107 99 C115 88 120 75 120 60 C120 27 93 0 60 0 Z" fill="#3F51B5" stroke="#303F9F" stroke-width="2"/>
//   <path d="M60 30 L48 80 L52 80 L52 85 L68 85 L68 80 L72 80 Z" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round"/>
//   <line x1="54" y1="50" x2="66" y2="50" stroke="white" stroke-width="2" />
//   <line x1="52" y1="60" x2="68" y2="60" stroke="white" stroke-width="2" />
//   <line x1="51" y1="70" x2="69" y2="70" stroke="white" stroke-width="2" />
//   <circle cx="60" cy="27" r="3" fill="white" />
// </svg>`;

// const SVG_RADIO_ANTENNA = `
// <svg viewBox="0 0 120 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
//   <path d="M60 0 C27 0 0 27 0 60 C0 75 5 88 13 99 L60 160 L107 99 C115 88 120 75 120 60 C120 27 93 0 60 0 Z" fill="#F44336" stroke="#D32F2F" stroke-width="2"/>
//   <path d="M60 35 L50 70 L55 70 L60 85 L65 70 L70 70 Z" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round"/>
//   <circle cx="60" cy="32" r="4" fill="white" />
//   <path d="M45 40 Q40 45 40 52" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/>
//   <path d="M48 35 Q44 40 44 47" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/>
//   <path d="M75 40 Q80 45 80 52" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/>
//   <path d="M72 35 Q76 40 76 47" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/>
//  </svg>`;

// const SVG_NETWORK_SWITCH = `
// <svg viewBox="0 0 120 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
//   <path d="M60 0 C27 0 0 27 0 60 C0 75 5 88 13 99 L60 160 L107 99 C115 88 120 75 120 60 C120 27 93 0 60 0 Z" fill="#424242" stroke="#212121" stroke-width="2"/>
//   <rect x="32" y="48" width="56" height="20" rx="2" fill="white" />
//   <rect x="35" y="52" width="6" height="12" rx="1" fill="#424242" />
//   <rect x="43" y="52" width="6" height="12" rx="1" fill="#424242" />
//   <rect x="51" y="52" width="6" height="12" rx="1" fill="#424242" />
//   <rect x="59" y="52" width="6" height="12" rx="1" fill="#424242" />
//   <rect x="67" y="52" width="6" height="12" rx="1" fill="#424242" />
//   <rect x="75" y="52" width="6" height="12" rx="1" fill="#424242" />
//   <circle cx="84" cy="58" r="2" fill="#4CAF50" />
//  </svg>`;

// const SVG_COMPASS = `
// <svg viewBox="0 0 120 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
//   <path d="M60 0 C27 0 0 27 0 60 C0 75 5 88 13 99 L60 160 L107 99 C115 88 120 75 120 60 C120 27 93 0 60 0 Z" fill="#9C27B0" stroke="#7B1FA2" stroke-width="2"/>
//   <circle cx="60" cy="60" r="24" fill="white" stroke="#9C27B0" stroke-width="3"/>
//   <line x1="30" y1="60" x2="90" y2="60" stroke="#9C27B0" stroke-width="3" />
//   <line x1="42" y1="42" x2="78" y2="78" stroke="#9C27B0" stroke-width="3" />
//   <polygon points="78,42 88,52 68,52" fill="#9C27B0" />
//  </svg>`;

// const SVG_NETWORK_NODE = `
// <svg viewBox="0 0 120 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
//   <path d="M60 0 C27 0 0 27 0 60 C0 75 5 88 13 99 L60 160 L107 99 C115 88 120 75 120 60 C120 27 93 0 60 0 Z" fill="#4CAF50" stroke="#388E3C" stroke-width="2"/>
//   <circle cx="60" cy="60" r="12" fill="white" stroke="#4CAF50" stroke-width="4"/>
//   <circle cx="60" cy="35" r="6" fill="white" stroke="#4CAF50" stroke-width="4"/>
//   <circle cx="40" cy="75" r="6" fill="white" stroke="#4CAF50" stroke-width="4"/>
//   <circle cx="80" cy="75" r="6" fill="white" stroke="#4CAF50" stroke-width="4"/>
//   <line x1="60" y1="48" x2="60" y2="41" stroke="#4CAF50" stroke-width="4" />
//   <line x1="53" y1="68" x2="46" y2="75" stroke="#4CAF50" stroke-width="4" />
//   <line x1="67" y1="68" x2="74" y2="75" stroke="#4CAF50" stroke-width="4" />
//  </svg>`;

// const SVG_CALCULATOR = `
// <svg viewBox="0 0 120 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
//   <path d="M60 0 C27 0 0 27 0 60 C0 75 5 88 13 99 L60 160 L107 99 C115 88 120 75 120 60 C120 27 93 0 60 0 Z" fill="#20B2AA" stroke="#178F88" stroke-width="2"/>
//   <rect x="30" y="30" width="60" height="60" rx="8" fill="white" />
//   <rect x="38" y="38" width="44" height="16" rx="3" fill="#20B2AA" />
//   <rect x="38" y="60" width="10" height="12" rx="2" fill="#20B2AA" />
//   <rect x="55" y="60" width="10" height="12" rx="2" fill="#20B2AA" />
//   <rect x="72" y="60" width="10" height="12" rx="2" fill="#20B2AA" />
//   <rect x="38" y="76" width="10" height="12" rx="2" fill="#20B2AA" />
//   <rect x="55" y="76" width="10" height="12" rx="2" fill="#20B2AA" />
//   <rect x="72" y="76" width="10" height="12" rx="2" fill="#20B2AA" />
//  </svg>`;

// // --- ICONS ---
// export const MaanIcon = L.icon({
//   iconUrl: '/images/switch_image.png',
//   iconSize: [40, 40],
//   iconAnchor: [20, 20],
// });
// export const BTSIcon = L.icon({
//   iconUrl: '/images/bts_image.png',
//   iconSize: [40, 40],
//   iconAnchor: [20, 20],
// });
// export const BTSRLIcon = L.icon({
//   iconUrl: '/images/bts_rl_image.png',
//   iconSize: [40, 40],
//   iconAnchor: [20, 20],
// });
// export const DefaultIcon = L.icon({
//   iconUrl: '/images/marker-icon.png',
//   shadowUrl: '/images/marker-shadow.png',
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
// });
// export const HighlightedIcon = L.icon({
//   iconUrl: '/images/marker-icon-highlight.png',
//   shadowUrl: '/images/marker-shadow.png',
//   iconSize: [28, 46],
//   iconAnchor: [14, 46],
// });

// // Derived DivIcons
// const IconMAAN = createSvgDivIcon(SVG_NETWORK_SWITCH); // aggregation/switch-like
// const IconBTS = createSvgDivIcon(SVG_CELL_TOWER);
// const IconBTS_RL = createSvgDivIcon(SVG_RADIO_ANTENNA);
// const IconNetwork = createSvgDivIcon(SVG_NETWORK_NODE);
// const IconCalculator = createSvgDivIcon(SVG_CALCULATOR);
// const IconDefault = createSvgDivIcon(SVG_COMPASS, [34, 34], [17, 17]);

// // THE FIX: Updated the switch cases to match the specific node types from your old logic,
// // making the icons more representative of the network equipment.
// export const getNodeIcon = (nodeType: string | null | undefined, isHighlighted: boolean) => {

  
//   if (isHighlighted) return HighlightedIcon;
//   // Normalize the node type for case-insensitive matching
//   const type = nodeType?.toLowerCase() ?? '';

//   if (
//     type.includes('metro access aggregation node') ||
//     type.includes('multi-access aggregation node')
//   ) {
//     return MaanIcon;
//   }
//   if (
//     type.includes('compact passive access node') ||
//     type.includes('converged packet aggregation node')
//   ) {
//     return IconMAAN;
//   }
//   if (
//     type.includes('terminal node') ||
//     type.includes('telephone exchange (exch.)') ||
//     type.includes('transmission nodes')
//   ) {
//     return IconDefault;
//   }
//   if (type.includes('bts (running over radiolink)') || type.includes('bts microwave link') || type.includes('BTS (running over radiolink)')) {
//     return BTSRLIcon;
//   }
//   if (type.includes('base transceiver station') || type.includes('baseband unit')) {
//     return BTSIcon;
//   }
//   // Fallback for other types like 'Joint / Splice Point'
//   return DefaultIcon;
// };

// path: utils/getNodeIcons.ts
import L from 'leaflet';

// Helper to create a DivIcon from an inline SVG string while controlling size/anchor
const createSvgDivIcon = (
  svg: string,
  size: [number, number] = [40, 40],
  anchor: [number, number] = [20, 20]
) =>
  L.divIcon({
    className: 'leaflet-inline-svg-icon',
    iconSize: size,
    iconAnchor: anchor,
    html: `
      <div style="width:${size[0]}px;height:${size[1]}px;display:flex;align-items:center;justify-content:center">
        ${svg}
      </div>
    `,
  });

// Inline SVGs adapted from svgs/*.jsx, sized to fill container
const SVG_CELL_TOWER = `
<svg viewBox="0 0 120 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <path d="M60 0 C27 0 0 27 0 60 C0 75 5 88 13 99 L60 160 L107 99 C115 88 120 75 120 60 C120 27 93 0 60 0 Z" fill="#3F51B5" stroke="#303F9F" stroke-width="2"/>
  <path d="M60 30 L48 80 L52 80 L52 85 L68 85 L68 80 L72 80 Z" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round"/>
  <line x1="54" y1="50" x2="66" y2="50" stroke="white" stroke-width="2" />
  <line x1="52" y1="60" x2="68" y2="60" stroke="white" stroke-width="2" />
  <line x1="51" y1="70" x2="69" y2="70" stroke="white" stroke-width="2" />
  <circle cx="60" cy="27" r="3" fill="white" />
</svg>`;

const SVG_RADIO_ANTENNA = `
<svg viewBox="0 0 120 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <path d="M60 0 C27 0 0 27 0 60 C0 75 5 88 13 99 L60 160 L107 99 C115 88 120 75 120 60 C120 27 93 0 60 0 Z" fill="#F44336" stroke="#D32F2F" stroke-width="2"/>
  <path d="M60 35 L50 70 L55 70 L60 85 L65 70 L70 70 Z" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="60" cy="32" r="4" fill="white" />
  <path d="M45 40 Q40 45 40 52" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/>
  <path d="M48 35 Q44 40 44 47" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/>
  <path d="M75 40 Q80 45 80 52" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/>
  <path d="M72 35 Q76 40 76 47" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/>
 </svg>`;

const SVG_NETWORK_SWITCH = `
<svg viewBox="0 0 120 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <path d="M60 0 C27 0 0 27 0 60 C0 75 5 88 13 99 L60 160 L107 99 C115 88 120 75 120 60 C120 27 93 0 60 0 Z" fill="#424242" stroke="#212121" stroke-width="2"/>
  <rect x="32" y="48" width="56" height="20" rx="2" fill="white" />
  <rect x="35" y="52" width="6" height="12" rx="1" fill="#424242" />
  <rect x="43" y="52" width="6" height="12" rx="1" fill="#424242" />
  <rect x="51" y="52" width="6" height="12" rx="1" fill="#424242" />
  <rect x="59" y="52" width="6" height="12" rx="1" fill="#424242" />
  <rect x="67" y="52" width="6" height="12" rx="1" fill="#424242" />
  <rect x="75" y="52" width="6" height="12" rx="1" fill="#424242" />
  <circle cx="84" cy="58" r="2" fill="#4CAF50" />
 </svg>`;

const SVG_COMPASS = `
<svg viewBox="0 0 120 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <path d="M60 0 C27 0 0 27 0 60 C0 75 5 88 13 99 L60 160 L107 99 C115 88 120 75 120 60 C120 27 93 0 60 0 Z" fill="#9C27B0" stroke="#7B1FA2" stroke-width="2"/>
  <circle cx="60" cy="60" r="24" fill="white" stroke="#9C27B0" stroke-width="3"/>
  <line x1="30" y1="60" x2="90" y2="60" stroke="#9C27B0" stroke-width="3" />
  <line x1="42" y1="42" x2="78" y2="78" stroke="#9C27B0" stroke-width="3" />
  <polygon points="78,42 88,52 68,52" fill="#9C27B0" />
 </svg>`;

const SVG_NETWORK_NODE = `
<svg viewBox="0 0 120 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <path d="M60 0 C27 0 0 27 0 60 C0 75 5 88 13 99 L60 160 L107 99 C115 88 120 75 120 60 C120 27 93 0 60 0 Z" fill="#4CAF50" stroke="#388E3C" stroke-width="2"/>
  <circle cx="60" cy="60" r="12" fill="white" stroke="#4CAF50" stroke-width="4"/>
  <circle cx="60" cy="35" r="6" fill="white" stroke="#4CAF50" stroke-width="4"/>
  <circle cx="40" cy="75" r="6" fill="white" stroke="#4CAF50" stroke-width="4"/>
  <circle cx="80" cy="75" r="6" fill="white" stroke="#4CAF50" stroke-width="4"/>
  <line x1="60" y1="48" x2="60" y2="41" stroke="#4CAF50" stroke-width="4" />
  <line x1="53" y1="68" x2="46" y2="75" stroke="#4CAF50" stroke-width="4" />
  <line x1="67" y1="68" x2="74" y2="75" stroke="#4CAF50" stroke-width="4" />
 </svg>`;

const SVG_CALCULATOR = `
<svg viewBox="0 0 120 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <path d="M60 0 C27 0 0 27 0 60 C0 75 5 88 13 99 L60 160 L107 99 C115 88 120 75 120 60 C120 27 93 0 60 0 Z" fill="#20B2AA" stroke="#178F88" stroke-width="2"/>
  <rect x="30" y="30" width="60" height="60" rx="8" fill="white" />
  <rect x="38" y="38" width="44" height="16" rx="3" fill="#20B2AA" />
  <rect x="38" y="60" width="10" height="12" rx="2" fill="#20B2AA" />
  <rect x="55" y="60" width="10" height="12" rx="2" fill="#20B2AA" />
  <rect x="72" y="60" width="10" height="12" rx="2" fill="#20B2AA" />
  <rect x="38" y="76" width="10" height="12" rx="2" fill="#20B2AA" />
  <rect x="55" y="76" width="10" height="12" rx="2" fill="#20B2AA" />
  <rect x="72" y="76" width="10" height="12" rx="2" fill="#20B2AA" />
 </svg>`;

// --- ICONS ---
export const MaanIcon = L.icon({
  iconUrl: '/images/switch_image.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});
export const BTSIcon = L.icon({
  iconUrl: '/images/bts_image.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});
export const BTSRLIcon = L.icon({
  iconUrl: '/images/bts_rl_image.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});
export const DefaultIcon = L.icon({
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
export const HighlightedIcon = L.icon({
  iconUrl: '/images/marker-icon-highlight.png',
  shadowUrl: '/images/marker-shadow.png',
  iconSize: [28, 46],
  iconAnchor: [14, 46],
});

// Derived DivIcons
const IconMAAN = createSvgDivIcon(SVG_NETWORK_SWITCH); // aggregation/switch-like
const IconNetwork = createSvgDivIcon(SVG_NETWORK_NODE);
const IconDefault = createSvgDivIcon(SVG_COMPASS, [34, 34], [17, 17]);

// Updated logic to check both System Type and Node Type
export const getNodeIcon = (
  systemType: string | null | undefined,
  nodeType: string | null | undefined,
  isHighlighted: boolean
) => {
  if (isHighlighted) return HighlightedIcon;

  const sType = (systemType || '').toLowerCase();
  const nType = (nodeType || '').toLowerCase();

  // 1. Priority: System Type specific equipment (MAAN, CPAN)
  if (
    sType.includes('maan') || 
    sType.includes('metro access') || 
    sType.includes('multi-access')
  ) {
    return MaanIcon;
  }

  if (
    sType.includes('cpan') || 
    sType.includes('compact passive') || 
    sType.includes('converged packet')
  ) {
    return IconMAAN;
  }

  // 2. Priority: Radio/Microwave (checked in both system and node types)
  if (
    sType.includes('radiolink') || 
    sType.includes('microwave') || 
    nType.includes('radiolink') ||
    nType.includes('microwave')
  ) {
    return BTSRLIcon;
  }

  // 3. Priority: BTS / Towers (checked in both)
  if (
    sType.includes('bts') || 
    sType.includes('base transceiver') || 
    sType.includes('baseband') ||
    nType.includes('bts') || 
    nType.includes('base transceiver') ||
    nType.includes('tower')
  ) {
    return BTSIcon;
  }

  // 4. Priority: Core Nodes / Exchanges / Offices
  if (
    nType.includes('exchange') ||
    nType.includes('exch.') ||
    nType.includes('transmission node') ||
    nType.includes('terminal node') ||
    nType.includes('core') ||
    nType.includes('office')
  ) {
    return IconDefault; // Using the Compass/Default SVG for stability
  }
  
  // 5. Priority: OLTs
  if (sType.includes('olt') || nType.includes('olt')) {
      return IconNetwork;
  }

  // Fallback
  return DefaultIcon;
};
