// path: components/doc/types/workflowTypes.ts

// THE FIX: The WorkflowIcon type is now correctly and simply defined as a string.
// The unused LucideIcon import has been removed.
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
  uiSteps: string[];
  techSteps: string[];
}

export interface WorkflowCardProps {
  section: WorkflowSection;
}

export interface WorkflowSectionProps {
  workflow: Workflow;
  index: number;
  colors: {
    border: {
      light: string;
      dark: string;
    };
    glow: {
      light: string;
      dark: string;
    };
    badge: {
      light: string;
      dark: string;
    };
    icon: {
      light: string;
      dark: string;
    };
    gradient: {
      light: string;
      dark: string;
    };
    accent: string;
  };
  isLast: boolean;
}