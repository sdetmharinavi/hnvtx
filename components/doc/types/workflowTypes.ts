import { LucideIcon } from "lucide-react";

export interface WorkflowSection {
  value: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  gradient: string;
  iconColor: string;
  bgGlow: string;
  color: "violet" | "blue" | "teal" | "cyan" | "orange";
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
  purpose: string;
  workflows: Workflow[];
  color: "violet" | "blue" | "teal" | "cyan" | "orange";
}

export interface WorkflowSectionProps {
  workflow: Workflow;
  index: number;
  colors: {
    border: string;
    glow: string;
    badge: string;
    icon: string;
  };
  isLast: boolean;
}