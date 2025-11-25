import { Database } from "@/types/supabase-types";
import { UserRole } from "@/types/user-roles";
import { ReactNode } from "react";

export type TableName = keyof Database["public"]["Tables"];

export interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  showMenuFeatures: boolean;
}

export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  href?: string;
  children?: NavItem[];
  roles: UserRole[];
  external?: boolean;
  preferNative?: boolean;
}

// Animation variants
export const sidebarVariants = {
  expanded: { width: 260 },
  collapsed: { width: 64 }
};

export const mobileOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

export const mobileSidebarVariants = {
  hidden: { x: -260 },
  visible: { x: 0 }
};

export const contentVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 }
};

export const submenuVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: "auto", opacity: 1 }
};