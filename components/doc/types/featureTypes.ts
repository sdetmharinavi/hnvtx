// path: components/doc/types/featureTypes.ts

export interface FeatureItem {
  id: string; // The slug (e.g., 'offline-first')
  title: string;
  subtitle: string;
  icon: string; // Name of the Lucide icon
  description: string;
  benefits: string[];
  technicalHighlights: string[];
  color: "violet" | "blue" | "teal" | "cyan" | "orange" | "yellow" | "green" | "rose";
}