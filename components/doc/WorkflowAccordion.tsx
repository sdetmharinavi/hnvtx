import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/common/ui/accordion";
import AccordionTriggerContent from "@/components/doc/AccordionTriggerContent";
import { WorkflowSection } from "@/components/doc/types/workflowTypes";
import WorkflowCard from "@/components/doc/WorkflowCard";

  
  interface WorkflowAccordionProps {
    sections: WorkflowSection[];
    open: string | undefined;
    onValueChange: (value: string | undefined) => void;
  }
  
  export default function WorkflowAccordion({ 
    sections, 
    open, 
    onValueChange 
  }: WorkflowAccordionProps) {
    return (
      <Accordion
        type="single"
        collapsible
        value={open}
        onValueChange={onValueChange}
        className="space-y-4"
      >
        {sections.map((section) => (
          <AccordionItem key={section.value} value={section.value} className="border-none">
            <AccordionTrigger className="hover:no-underline group">
              <AccordionTriggerContent 
                section={section}
                isOpen={open === section.value}
              />
            </AccordionTrigger>
            <AccordionContent>
              <WorkflowCard
                purpose={section.purpose}
                workflows={section.workflows}
                color={section.color}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  }