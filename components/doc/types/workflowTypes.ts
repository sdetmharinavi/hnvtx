import type { LucideIcon } from "lucide-react";
import type { IconType } from "react-icons";

export type WorkflowIcon = LucideIcon | IconType;

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
  purpose: string;
  workflows: Workflow[];
  color: "violet" | "blue" | "teal" | "cyan" | "orange" | "yellow";
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