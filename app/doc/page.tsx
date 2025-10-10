// path: app/doc/page.tsx
"use client";

import BackgroundElements from "@/components/doc/BackgroundElements";
import HeaderSection from "@/components/doc/HeaderSection";

export default function Workflows() {
  return (
    <div className="relative min-h-full w-full text-gray-100">
      <BackgroundElements />
      <div className="relative z-10">
        <HeaderSection />
        <div className="mt-16 text-center">
          <p className="text-lg text-gray-400">
            Please select a topic from the sidebar to view its detailed workflow documentation.
          </p>
        </div>
      </div>
    </div>
  );
}