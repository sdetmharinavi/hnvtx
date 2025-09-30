import L from "leaflet";

// --- ICONS ---
export const MaanIcon = L.icon({ iconUrl: "/images/switch_image.png", iconSize: [40, 40], iconAnchor: [20, 20] });
export const BTSIcon = L.icon({ iconUrl: "/images/bts_image.png", iconSize: [40, 40], iconAnchor: [20, 20] });
export const BTSRLIcon = L.icon({ iconUrl: "/images/bts_rl_image.png", iconSize: [40, 40], iconAnchor: [20, 20] });
export const DefaultIcon = L.icon({ iconUrl: "/images/marker-icon.png", shadowUrl: "/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41] });
export const HighlightedIcon = L.icon({ iconUrl: "/images/marker-icon-highlight.png", shadowUrl: "/images/marker-shadow.png", iconSize: [28, 46], iconAnchor: [14, 46] });

export const getNodeIcon = (nodeType: string | null | undefined, isHighlighted: boolean) => {
    if (isHighlighted) return HighlightedIcon;
    switch (nodeType) {
      case 'Metro Access Aggregation Node': case 'Compact Passive Access Node': case 'Terminal Node': case 'Telephone Exchange (Exch.)': case 'Transmission Nodes': return MaanIcon;
      case 'Base Transceiver Station' : return BTSIcon;
      case 'BTS (running over radiolink)': return BTSRLIcon;
      default: return DefaultIcon;
    }
  };