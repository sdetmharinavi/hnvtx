// path: app/doc/[slug]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { workflowSections } from "@/components/doc/data/workflowData";
import { featuresData } from "@/components/doc/data/featuresData"; // Import features
import WorkflowCard from "@/components/doc/WorkflowCard";
import FeatureCard from "@/components/doc/FeatureCard"; // Import component
import { AlertTriangle } from "lucide-react";

export default function ContentPage() {
  const params = useParams();
  const slug = params.slug as string;

  // 1. Check if it's a Feature
  const feature = featuresData.find(f => f.id === slug);
  if (feature) {
    return <FeatureCard feature={feature} />;
  }

  // 2. Check if it's a Workflow
  const section = workflowSections.find((s) => s.value === slug);
  if (section) {
    return <WorkflowCard section={section} />;
  }

  // 3. 404 State
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10 text-yellow-600 dark:text-yellow-500" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Doc Not Found</h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
        The documentation for &quot;{slug}&quot; could not be found. Please select a valid topic from the sidebar.
      </p>
    </div>
  );
}