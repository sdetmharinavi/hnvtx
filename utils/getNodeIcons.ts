import L from 'leaflet';

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

// THE FIX: Updated the switch cases to match the specific node types from your old logic,
// making the icons more representative of the network equipment.
export const getNodeIcon = (nodeType: string | null | undefined, isHighlighted: boolean) => {

  
  if (isHighlighted) return HighlightedIcon;
  // Normalize the node type for case-insensitive matching
  const type = nodeType?.toLowerCase() ?? '';

  if (
    type.includes('metro access aggregation node') ||
    type.includes('compact passive access node') ||
    type.includes('converged packet aggregation node') ||
    type.includes('terminal node') ||
    type.includes('telephone exchange (exch.)') ||
    type.includes('transmission nodes')
  ) {
    return MaanIcon;
  }
  if (type.includes('bts (running over radiolink)') || type.includes('bts microwave link')) {
    return BTSRLIcon;
  }
  if (type.includes('base transceiver station') || type.includes('baseband unit')) {
    return BTSIcon;
  }
  // Fallback for other types like 'Joint / Splice Point'
  return DefaultIcon;
};
