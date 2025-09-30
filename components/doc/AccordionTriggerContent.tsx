import { WorkflowSection } from "@/components/doc/types/workflowTypes";
import { ChevronRight } from "lucide-react";


interface AccordionTriggerContentProps {
  section: WorkflowSection;
  isOpen: boolean;
}

export default function AccordionTriggerContent({ 
  section, 
  isOpen 
}: AccordionTriggerContentProps) {
  const Icon = section.icon;
  
  return (
    <div className={`w-full flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm border border-gray-800 hover:border-${section.color}-500/50 transition-all duration-300 ${isOpen ? `border-${section.color}-500/50 shadow-lg shadow-${section.color}-500/20` : ""}`}>
      <div className={`p-3 rounded-xl bg-gradient-to-br ${section.gradient} ${section.bgGlow}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 text-left">
        <h3 className="text-xl font-semibold text-gray-100 group-hover:text-white transition-colors">
          {section.title}
        </h3>
        <p className="text-sm text-gray-500 mt-1">{section.subtitle}</p>
      </div>
      <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`} />
    </div>
  );
}