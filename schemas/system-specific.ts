// =================================================================
// SYSTEM-SPECIFIC TABLES
// =================================================================

import z from "zod";

export const cpanSystemSchema = z.object({
  system_id: z.uuid(),
  ring_no: z.string().optional().nullable(),
  area: z.string().optional().nullable(),
});

export const maanSystemSchema = z.object({
  system_id: z.uuid(),
  ring_no: z.string().optional().nullable(),
  area: z.string().optional().nullable(),
});

export const sdhSystemSchema = z.object({
  system_id: z.uuid(),
  gne: z.string().optional().nullable(),
  make: z.string().optional().nullable(),
});

export const vmuxSystemSchema = z.object({
  system_id: z.uuid(),
  vm_id: z.string().optional().nullable(),
});

export const cpanConnectionSchema = z.object({
  system_connection_id: z.uuid(),
  sfp_port: z.string().optional().nullable(),
  sfp_type_id: z.uuid().optional().nullable(),
  sfp_capacity: z.string().optional().nullable(),
  sfp_serial_no: z.string().optional().nullable(),
  fiber_in: z.number().int().optional().nullable(),
  fiber_out: z.number().int().optional().nullable(),
  customer_name: z.string().optional().nullable(),
  bandwidth_allocated_mbps: z.number().int().optional().nullable(),
});

export const maanConnectionSchema = cpanConnectionSchema.extend({});

export const sdhConnectionSchema = z.object({
  system_connection_id: z.uuid(),
  stm_no: z.string().optional().nullable(),
  carrier: z.string().optional().nullable(),
  a_slot: z.string().optional().nullable(),
  a_customer: z.string().optional().nullable(),
  b_slot: z.string().optional().nullable(),
  b_customer: z.string().optional().nullable(),
});

export const vmuxConnectionSchema = z.object({
  system_connection_id: z.uuid(),
  subscriber: z.string().optional().nullable(),
  c_code: z.string().optional().nullable(),
  channel: z.string().optional().nullable(),
  tk: z.string().optional().nullable(),
});