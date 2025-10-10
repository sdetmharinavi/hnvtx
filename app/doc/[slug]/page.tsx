// path: app/doc/[slug]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { workflowSections } from "@/components/doc/data/workflowData";
import WorkflowCard from "@/components/doc/WorkflowCard";
import { AlertTriangle } from "lucide-react";

export default function WorkflowContentPage() {
  const params = useParams();
  const slug = params.slug as string;

  const section = workflowSections.find((s) => s.value === slug);

  if (!section) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Workflow Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          The documentation for &quot;{slug}&quot; could not be found. Please select a valid topic from the sidebar.
        </p>
      </div>
    );
  }

  return <WorkflowCard section={section} />;
}