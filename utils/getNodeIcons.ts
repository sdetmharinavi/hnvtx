// path: utils/getNodeIcons.ts
import L from 'leaflet';

// Helper to create a DivIcon with consistent sizing
const createSvgDivIcon = (
  svg: string,
  size: [number, number] = [25, 41],
  anchor: [number, number] = [12, 41]
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

// Blue teardrop markers with dark icon symbols inside - viewBox 0 0 36 36 for correct size
// Blue teardrop markers with dark icon symbols inside - viewBox 0 0 36 36, 1.4x height, smooth gradients
const SVG_CELL_TOWER = `
<svg viewBox="0 0 36 36" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#5DADE2;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2874A6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <path d="M18 0 C11.1 0 5.5 5.6 5.5 12.5 C5.5 15.6 6.5 18.4 8.3 20.6 L18 45 L27.7 20.6 C29.5 18.4 30.5 15.6 30.5 12.5 C30.5 5.6 24.9 0 18 0 Z" fill="url(#blueGrad)" stroke="#2874A6" stroke-width="1" opacity="0.95"/>
  <path d="M18 5.5 L15.5 15.5 L16.5 15.5 L16.5 18 L19.5 18 L19.5 15.5 L20.5 15.5 Z" fill="#263238" stroke="#263238" stroke-width="0.3" stroke-linejoin="round"/>
  <line x1="16.8" y1="10" x2="19.2" y2="10" stroke="#263238" stroke-width="0.8" stroke-linecap="round" />
  <line x1="16.5" y1="12.5" x2="19.5" y2="12.5" stroke="#263238" stroke-width="0.8" stroke-linecap="round" />
  <line x1="16" y1="14.5" x2="20" y2="14.5" stroke="#263238" stroke-width="0.8" stroke-linecap="round" />
  <circle cx="18" cy="4.5" r="1" fill="#263238" />
</svg>`;

const SVG_RADIO_ANTENNA = `
<svg viewBox="0 0 36 36" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="redGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#EC7063;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#C0392B;stop-opacity:1" />
    </linearGradient>
  </defs>
  <path d="M18 0 C11.1 0 5.5 5.6 5.5 12.5 C5.5 15.6 6.5 18.4 8.3 20.6 L18 45 L27.7 20.6 C29.5 18.4 30.5 15.6 30.5 12.5 C30.5 5.6 24.9 0 18 0 Z" fill="url(#redGrad)" stroke="#C0392B" stroke-width="1" opacity="0.95"/>
  <path d="M18 6.5 L16 14.5 L17 14.5 L18 19 L19 14.5 L20 14.5 Z" fill="#263238" stroke="#263238" stroke-width="0.3" stroke-linejoin="round"/>
  <circle cx="18" cy="5.5" r="1.1" fill="#263238" />
  <path d="M14.5 8 Q13 9.5 13 11.5" fill="none" stroke="#263238" stroke-width="1" stroke-linecap="round"/>
  <path d="M15 6.8 Q14 8 14 10" fill="none" stroke="#263238" stroke-width="1" stroke-linecap="round"/>
  <path d="M21.5 8 Q23 9.5 23 11.5" fill="none" stroke="#263238" stroke-width="1" stroke-linecap="round"/>
  <path d="M21 6.8 Q22 8 22 10" fill="none" stroke="#263238" stroke-width="1" stroke-linecap="round"/>
</svg>`;

const SVG_NETWORK_SWITCH = `
<svg viewBox="0 0 36 36" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#797D7F;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#424949;stop-opacity:1" />
    </linearGradient>
  </defs>
  <path d="M18 0 C11.1 0 5.5 5.6 5.5 12.5 C5.5 15.6 6.5 18.4 8.3 20.6 L18 45 L27.7 20.6 C29.5 18.4 30.5 15.6 30.5 12.5 C30.5 5.6 24.9 0 18 0 Z" fill="url(#grayGrad)" stroke="#424949" stroke-width="1" opacity="0.95"/>
  <rect x="11.5" y="9" width="13" height="6.5" rx="0.8" fill="#263238" stroke="#263238" stroke-width="0.3"/>
  <rect x="12.5" y="10.5" width="1.6" height="3.5" rx="0.3" fill="#ECF0F1" />
  <rect x="14.6" y="10.5" width="1.6" height="3.5" rx="0.3" fill="#ECF0F1" />
  <rect x="16.7" y="10.5" width="1.6" height="3.5" rx="0.3" fill="#ECF0F1" />
  <rect x="18.8" y="10.5" width="1.6" height="3.5" rx="0.3" fill="#ECF0F1" />
  <rect x="20.9" y="10.5" width="1.6" height="3.5" rx="0.3" fill="#ECF0F1" />
  <circle cx="23.2" cy="12.25" r="0.7" fill="#52BE80" />
</svg>`;

const SVG_COMPASS = `
<svg viewBox="0 0 36 36" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#BB8FCE;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7D3C98;stop-opacity:1" />
    </linearGradient>
  </defs>
  <path d="M18 0 C11.1 0 5.5 5.6 5.5 12.5 C5.5 15.6 6.5 18.4 8.3 20.6 L18 45 L27.7 20.6 C29.5 18.4 30.5 15.6 30.5 12.5 C30.5 5.6 24.9 0 18 0 Z" fill="url(#purpleGrad)" stroke="#7D3C98" stroke-width="1" opacity="0.95"/>
  <circle cx="18" cy="12" r="6.2" fill="#263238"/>
  <line x1="11.8" y1="12" x2="24.2" y2="12" stroke="#ECF0F1" stroke-width="1.1" stroke-linecap="round" />
  <line x1="14.2" y1="8.8" x2="21.8" y2="15.2" stroke="#ECF0F1" stroke-width="1.1" stroke-linecap="round" />
  <polygon points="21.8,8.8 24.2,11.2 19.4,11.2" fill="#ECF0F1" />
</svg>`;

const SVG_NETWORK_NODE = `
<svg viewBox="0 0 36 36" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="greenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#7DCEA0;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#27AE60;stop-opacity:1" />
    </linearGradient>
  </defs>
  <path d="M18 0 C11.1 0 5.5 5.6 5.5 12.5 C5.5 15.6 6.5 18.4 8.3 20.6 L18 45 L27.7 20.6 C29.5 18.4 30.5 15.6 30.5 12.5 C30.5 5.6 24.9 0 18 0 Z" fill="url(#greenGrad)" stroke="#27AE60" stroke-width="1" opacity="0.95"/>
  <circle cx="18" cy="12" r="3.3" fill="#263238"/>
  <circle cx="18" cy="6.5" r="1.8" fill="#263238"/>
  <circle cx="13.5" cy="16.2" r="1.8" fill="#263238"/>
  <circle cx="22.5" cy="16.2" r="1.8" fill="#263238"/>
  <line x1="18" y1="8.8" x2="18" y2="8.3" stroke="#263238" stroke-width="1.3" stroke-linecap="round" />
  <line x1="16.2" y1="14.3" x2="15.3" y2="16.2" stroke="#263238" stroke-width="1.3" stroke-linecap="round" />
  <line x1="19.8" y1="14.3" x2="20.7" y2="16.2" stroke="#263238" stroke-width="1.3" stroke-linecap="round" />
</svg>`;

// --- PNG ICONS (unchanged) ---
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
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

export const HighlightedIcon = L.icon({
  iconUrl: '/images/marker-icon-highlight.png',
  shadowUrl: '/images/marker-shadow.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// --- SVG DIVICONS (matching PNG size: 25x41) ---
const IconMAAN = createSvgDivIcon(SVG_NETWORK_SWITCH, [25, 41], [12, 41]);
const IconNetwork = createSvgDivIcon(SVG_NETWORK_NODE, [25, 41], [12, 41]);
const IconDefault = createSvgDivIcon(SVG_COMPASS, [25, 41], [12, 41]);

// Icon selection logic
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
    return IconDefault;
  }
  
  // 5. Priority: OLTs
  if (sType.includes('olt') || nType.includes('olt')) {
    return IconNetwork;
  }

  // Fallback
  return DefaultIcon;
};