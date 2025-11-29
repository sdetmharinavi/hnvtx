// path: components/doc/types/workflowTypes.ts

export type WorkflowIcon = string;

export interface WorkflowSection {
  value: string;
  icon: WorkflowIcon;
  title: string;
  subtitle: string;
  gradient: string;
  iconColor: string;
  bgGlow: string;
  color: "violet" | "blue" | "teal" | "cyan" | "orange" | "yellow";
  purpose: string;
  workflows: Workflow[];
}

export interface Workflow {
  title: string;
  userSteps: string[];
  uiSteps?: string[];
  techSteps: string[];
}

export interface WorkflowCardProps {
  section: WorkflowSection;
}

export interface WorkflowSectionProps {
  workflow: Workflow;
  index: number;
  colors: {
    border: string;
    glow: string;
    badge: string;
    icon: string;
    gradient: string;
    accent: string;
  };
  isLast: boolean;
}