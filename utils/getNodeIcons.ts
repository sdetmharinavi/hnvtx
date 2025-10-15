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

  console.log(nodeType);
  
  if (isHighlighted) return HighlightedIcon;
  // Normalize the node type for case-insensitive matching
  const type = nodeType?.toLowerCase() ?? '';

  if (
    type.includes('Metro Access Aggregation Node') ||
    type.includes('Compact Passive Access Node') ||
    type.includes('Terminal Node') ||
    type.includes('Telephone Exchange (Exch.)') ||
    type.includes('Transmission Nodes')
  ) {
    return MaanIcon;
  }
  if (type.includes('BTS (running over radiolink)')) {
    return BTSRLIcon;
  }
  if (type.includes('Base Transceiver Station')) {
    return BTSIcon;
  }
  if (type.includes('BTS Microwave Link')) {
    return BTSRLIcon;
  }
  if (type.includes('Converged Packet Aggregation Node')) {
    return MaanIcon;
  }
  // Fallback for other types like 'Joint / Splice Point'
  return DefaultIcon;
};
