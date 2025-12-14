// app/dashboard/diagrams/page.tsx
"use client";

import dynamic from "next/dynamic";
import { PageSpinner } from "@/components/common/ui";

// Disable SSR for the heavy Uploader component
const FileUploader = dynamic(
  () => import("@/components/diagrams/FileUploader"),
  { 
    ssr: false,
    loading: () => <PageSpinner text="Loading File Manager..." />
  },
);

export default function DiagramsPage() {
  // Authentication protection is handled by the DashboardLayout
  return <FileUploader />;
}
