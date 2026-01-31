import { z } from 'zod';

// Matches v_e_files_extended
export const v_e_files_extendedRowSchema = z.object({
  id: z.uuid(),
  file_number: z.string(),
  subject: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  priority: z.enum(['normal', 'urgent', 'immediate']),
  status: z.enum(['active', 'closed']),
  created_at: z.string(),
  updated_at: z.string(),

  // FIX: Added .default(null) to ensure it resolves to 'string | null' not 'undefined'
  last_action_date: z.string().nullable().optional().default(null),

  // Employee fields
  initiator_employee_id: z.uuid().nullable(),
  initiator_name: z.string().nullable(),
  initiator_designation: z.string().nullable(),

  current_holder_employee_id: z.uuid().nullable(),
  current_holder_name: z.string().nullable(),
  current_holder_designation: z.string().nullable(),
  current_holder_area: z.string().nullable(),

  // Operator fields
  recorded_by_user_id: z.uuid().nullable(),
  recorded_by_name: z.string().nullable(),
});
export type EFileRow = z.infer<typeof v_e_files_extendedRowSchema>;

// Matches v_file_movements_extended
export const v_file_movements_extendedRowSchema = z.object({
  id: z.uuid(),
  file_id: z.uuid(),
  action_type: z.enum(['initiated', 'forwarded', 'returned', 'closed']),
  remarks: z.string().nullable(),
  created_at: z.string(),
  // ADDED: Action Date
  action_date: z.string().optional().nullable(),

  from_employee_id: z.uuid().nullable(),
  from_employee_name: z.string().nullable(),
  from_employee_designation: z.string().nullable(),

  to_employee_id: z.uuid().nullable(),
  to_employee_name: z.string().nullable(),
  to_employee_designation: z.string().nullable(),

  performed_by_user_id: z.uuid().nullable(),
  performed_by_name: z.string().nullable(),
});
export type EFileMovementRow = z.infer<typeof v_file_movements_extendedRowSchema>;

// Form Payloads
export const initiateFileSchema = z.object({
  file_number: z.string().min(1, 'File number is required'),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  priority: z.enum(['normal', 'urgent', 'immediate']),
  remarks: z.string().optional(),
  initiator_employee_id: z.string().uuid('Initiator employee is required'),
  // ADDED: Optional date
  action_date: z.string().optional().nullable(),
});
export type InitiateFilePayload = z.infer<typeof initiateFileSchema>;

export const forwardFileSchema = z.object({
  file_id: z.uuid(),
  to_employee_id: z.string().uuid('Recipient employee is required'),
  remarks: z.string().min(1, 'Remarks are required'),
  action_type: z.enum(['forwarded', 'returned']).default('forwarded'),
  // ADDED: Optional date
  action_date: z.string().optional().nullable(),
});
export type ForwardFilePayload = z.infer<typeof forwardFileSchema>;

// ADDED: Schema for editing an existing movement
export const updateMovementSchema = z.object({
  movement_id: z.uuid(),
  remarks: z.string().min(1, 'Remarks are required'),
  action_date: z.string().min(1, 'Date is required'),
});
export type UpdateMovementPayload = z.infer<typeof updateMovementSchema>;