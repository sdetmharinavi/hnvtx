// path: components/doc/data/featuresData.ts
import { FeatureItem } from "../types/featureTypes";

export const featuresData: FeatureItem[] = [
  {
    id: "feat-mobile-ux",
    title: "Mobile-First Operations",
    subtitle: "Optimized for Field Engineers",
    icon: "Smartphone", // Lucide icon
    color: "violet",
    description: "The entire application adapts intelligently to your device. Complex data tables automatically transform into rich, easy-to-read cards on mobile devices, ensuring field engineers can access and update critical data without horizontal scrolling or zooming.",
    benefits: [
      "Adaptive Interfaces: Tables become Cards on mobile.",
      "Touch-friendly actions for Editing, Viewing, and Calls.",
      "Collapsible sidebars and optimized navigation.",
    ],
    technicalHighlights: [
      "Responsive React Design Patterns",
      "Conditional Component Rendering",
      "Tailwind CSS Breakpoints",
    ],
  },
  {
    id: "feat-offline-architecture",
    title: "Offline-First Resilience",
    subtitle: "Zero downtime, anywhere access",
    icon: "WifiOff",
    color: "rose",
    description: "Never let a poor internet connection stop your maintenance work. Our system ensures you can read, search, and even modify critical network data in the remotest field locations without a signal.",
    benefits: [
      "Works completely without internet access.",
      "Automatic background synchronization when online.",
      "Conflict-free data queuing ensures no data is lost.",
    ],
    technicalHighlights: [
      "IndexedDB (Dexie.js) local storage",
      "Optimistic UI updates",
      "Background Mutation Queue replay",
      "Stale-While-Revalidate caching strategy",
    ],
  },
  {
    id: "feat-network-topology",
    title: "Interactive Network Topology",
    subtitle: "Visualize the invisible",
    icon: "Map",
    color: "blue",
    description: "Transform complex spreadsheet data into interactive, visual maps. Understand your network's physical layout at a glance, from high-level ring structures down to individual cable segments.",
    benefits: [
      "Toggle between Geographic Maps and Schematic Logical diagrams.",
      "Visualize Hubs, Spokes, and Spur links instantly.",
      "Identify breaks or open loops in ring structures.",
    ],
    technicalHighlights: [
      "React Leaflet & OpenStreetMap integration",
      "Auto-calculated mesh layouts",
      "GeoJSON rendering",
      "SVG-based dynamic node icons",
    ],
  },
  {
    id: "feat-fiber-intelligence",
    title: "Advanced Fiber Intelligence",
    subtitle: "Trace every strand of light",
    icon: "GitCommit",
    color: "cyan",
    description: "Manage the lifecycle of your optical fiber network with surgical precision. From defining cable capacity to splicing individual strands and tracing end-to-end logical paths.",
    benefits: [
      "Visual Splicing Matrix: Connect fibers with a click.",
      "End-to-End Tracing: See the full path from Source to Destination.",
      "Visual Port Heatmaps: See port utilization at a glance.",
      "Auto-provisioning for straight-through joints.",
    ],
    technicalHighlights: [
      "Recursive SQL CTEs for path tracing", //Common Table Expression
      "Dynamic segmentation logic",
      "Graph-based data modeling",
      "Atomic provisioning transactions",
    ],
  },
  {
    id: "feat-excel-import",
    title: "Bulk Excel Integration",
    subtitle: "Seamless migration & mass updates",
    icon: "FileSpreadsheet", // Mapped in FeatureCard
    color: "green",
    description: "Eliminate manual data entry. Our robust import engine allows you to upload thousands of records—Systems, Cables, or Connections—in seconds, with real-time validation to prevent bad data from entering your system.",
    benefits: [
      "Smart Column Mapping: Automatically detects headers.",
      "Real-time Validation: Errors are flagged row-by-row before commit.",
      "Bulk Updates: Supports both 'Insert' and 'Upsert' (Update if exists) modes.",
      "Export any table to Excel.",
    ],
    technicalHighlights: [
      "Client-side parsing via `xlsx` (lazy loaded)",
      "Batch processing (500 rows/chunk) for performance",
      "Zod schema validation per row",
      "Transactional database commits",
    ],
  },
  {
    id: "feat-kml-overlay",
    title: "GIS & KML Overlays",
    subtitle: "Bridge Google Earth with your data",
    icon: "Globe",
    color: "orange",
    description: "Bring external geographical context into your dashboard. Upload KML/KMZ files from Google Earth to overlay proposed routes, terrain data, or legacy network paths directly onto your live network map.",
    benefits: [
      "Native support for .kml and .kmz (zipped) files.",
      "Interactive overlays: Click KML elements to see metadata.",
      "Visual comparison: Compare planned routes vs. actual node locations.",
      "Stored securely in the cloud for team access.",
    ],
    technicalHighlights: [
      "Vercel Blob Storage integration",
      "Server-side XML parsing",
      "`@mapbox/togeojson` conversion",
      "Leaflet GeoJSON layer rendering",
    ],
  },
  {
    id: "feat-smart-inventory",
    title: "Smart Inventory & QR",
    subtitle: "Track assets with physical links",
    icon: "QrCode",
    color: "teal",
    description: "Bridge the gap between digital records and physical equipment. Generate and print QR codes for every asset, making field identification instant and error-free.",
    benefits: [
      "Instant QR Code generation for any asset.",
      "Scan to view details immediately.",
      "Track costs, vendors, and purchase dates.",
      "Link physical assets to logical nodes and locations.",
    ],
    technicalHighlights: [
      "Dynamic Canvas QR generation",
      "Print-optimized CSS layouts",
      "Relational asset mapping",
      "Fast search indexing",
    ],
  },
  {
    id: "feat-audit-logs",
    title: "Comprehensive Auditing",
    subtitle: "Total accountability & history",
    icon: "FileClock", // Mapped in FeatureCard
    color: "violet",
    description: "Keep your critical infrastructure data secure. Every action—create, update, or delete—is immutably recorded, allowing you to trace changes back to specific users and timestamps.",
    benefits: [
      "Visual Diff Viewer: See exactly what changed (Before vs. After).",
      "Filter logs by User, Action Type, or Date.",
      "Indestructible records: Logs cannot be deleted by standard users.",
      "Detailed metadata tracking (IP, Device).",
    ],
    technicalHighlights: [
      "Database-level Triggers (PostgreSQL)",
      "JSONB storage for flexible schema versioning",
      "Read-only SQL Views for security",
      "Optimized indexing for fast history lookup",
    ],
  },
];