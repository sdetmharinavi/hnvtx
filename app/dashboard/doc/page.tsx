"use client";

import { useState } from "react";
import { Separator } from "@/components/common/ui/separator";
import WorkflowAccordion from "@/components/doc/WorkflowAccordion";
import HeaderSection from "@/components/doc/HeaderSection";
import BackgroundElements from "@/components/doc/BackgroundElements";
import { workflowSections } from "@/components/doc/data/workflowData";

export default function Workflows() {
  const [open, setOpen] = useState<string | undefined>("auth");

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100 p-4 md:p-8">
      <BackgroundElements />
      
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        <HeaderSection />
        
        <Separator className="bg-gradient-to-r from-transparent via-gray-700 to-transparent h-px" />

        <WorkflowAccordion 
          sections={workflowSections}
          open={open}
          onValueChange={setOpen}
        />
      </div>
    </div>
  );
}