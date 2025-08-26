// =================================================================
// FORM SPECIFIC TYPE EXPORTS
// =================================================================

import z from "zod";
import { signupSchema, userSchema } from "@/schemas/auth";
import { employeeDesignationSchema, employeeSchema, lookupTypeSchema, maintenanceAreaSchema } from "@/schemas/masters";
import { managementPortSchema, nodeSchema, ofcCableSchema, ofcConnectionSchema, ringSchema, sdhNodeAssociationSchema, systemConnectionSchema, systemSchema } from "@/schemas/core";
import { cpanConnectionSchema, cpanSystemSchema, maanConnectionSchema, maanSystemSchema, sdhConnectionSchema, sdhSystemSchema, vmuxConnectionSchema, vmuxSystemSchema } from "@/schemas/system-specific";
import { userProfileSchema } from "@/schemas/user";


// =================================================================
// TYPE EXPORTS
// =================================================================
export type LookupType = z.infer<typeof lookupTypeSchema>;
export type MaintenanceArea = z.infer<typeof maintenanceAreaSchema>;
export type EmployeeDesignation = z.infer<typeof employeeDesignationSchema>;
export type Employee = z.infer<typeof employeeSchema>;
export type Ring = z.infer<typeof ringSchema>;
export type Node = z.infer<typeof nodeSchema>;
export type OfcCable = z.infer<typeof ofcCableSchema>;
export type System = z.infer<typeof systemSchema>;
export type OfcConnection = z.infer<typeof ofcConnectionSchema>;
export type SystemConnection = z.infer<typeof systemConnectionSchema>;
export type ManagementPort = z.infer<typeof managementPortSchema>;
export type SdhNodeAssociation = z.infer<typeof sdhNodeAssociationSchema>;
export type CpanSystem = z.infer<typeof cpanSystemSchema>;
export type MaanSystem = z.infer<typeof maanSystemSchema>;
export type SdhSystem = z.infer<typeof sdhSystemSchema>;
export type VmuxSystem = z.infer<typeof vmuxSystemSchema>;
export type CpanConnection = z.infer<typeof cpanConnectionSchema>;
export type MaanConnection = z.infer<typeof maanConnectionSchema>;
export type SdhConnection = z.infer<typeof sdhConnectionSchema>;
export type VmuxConnection = z.infer<typeof vmuxConnectionSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;

export const nodeFormSchema = nodeSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type NodeFormData = z.infer<typeof nodeFormSchema>;

export const employeeFormSchema = employeeSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  status: true,
});
export type EmployeeFormData = z.infer<typeof employeeFormSchema>

export const userProfileFormSchema = userProfileSchema.omit({
  created_at: true,
  updated_at: true,
});
export type UserProfileFormData = z.infer<typeof userProfileFormSchema>

export const maintenanceAreaFormSchema = maintenanceAreaSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type MaintenanceAreaFormData = z.infer<typeof maintenanceAreaFormSchema>

export const ringFormSchema = ringSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type RingFormData = z.infer<typeof ringFormSchema>

