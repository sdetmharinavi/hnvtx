// =================================================================
// CORE INFRASTRUCTURE
// =================================================================

import z from "zod";
import { emptyStringToNumber, ipValidation, requiredStringToNumber } from "@/schemas/helpers";

export const ringSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().min(1, { message: "Ring name is required." }),
  ring_type_id: z.uuid().optional().nullable(),
  description: z.string().optional().nullable(),
  maintenance_terminal_id: z.uuid().optional().nullable(),
  total_nodes: z.number().int().default(0).optional(),
  status: z.boolean().default(true).optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const nodeSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().min(1, { message: "Node name is required." }),
  node_type_id: z.uuid().optional().nullable(),
  latitude: requiredStringToNumber,
  longitude: requiredStringToNumber,
  maintenance_terminal_id: z.uuid().optional().nullable(),
  remark: z.string().optional().nullable(),
  status: z.boolean().default(true).optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const ofcCableSchema = z
  .object({
    id: z.uuid().optional(),
    route_name: z.string().min(1, { message: "Route name is required." }),
    sn_id: z.uuid({ message: "Starting node is required." }),
    en_id: z.uuid({ message: "Ending node is required." }),
    ofc_type_id: z.uuid({ message: "OFC type is required." }),
    // capacity must be a positive integer
    capacity: requiredStringToNumber.pipe(
      z
        .number()
        .int({ message: "Capacity must be an integer." })
        .refine((val) => val > 0, {
          message: "Capacity must be a positive integer.",
        })
    ),
    // current_rkm must be a positive number
    current_rkm: emptyStringToNumber.pipe(
      z
        .number()
        .refine((val) => val >= 0, {
          message: "Current RKM must be a positive number.",
        })
    ),
    transnet_id: z.string().optional().nullable(),
    // transnet_rkm must be a positive number
    transnet_rkm: emptyStringToNumber.pipe(
      z
        .number()
        .refine((val) => val >= 0, {
          message: "Transnet RKM must be a positive number.",
        })
    ),
    asset_no: z.string().optional().nullable(),
    maintenance_terminal_id: z.uuid().optional().nullable(),
    commissioned_on: z.coerce.date().optional().nullable(),
    remark: z.string().optional().nullable(),
    status: z.boolean().default(true).optional(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
    total_count: z.number().int().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const a = data.sn_id;
    const b = data.en_id;
    // Run this check only when both IDs are present
    if (!a || !b) return;
    if (a === b) {
      ctx.addIssue({
        code: "custom",
        message: "Ending node must be different from starting node.",
        path: ["en_id"],
      });
    }
  });

export const systemSchema = z.object({
  id: z.uuid().optional(),
  system_type_id: z.string().uuid({ message: "System type is required." }),
  node_id: z.string().uuid({ message: "Node is required." }),
  system_name: z.string().optional().nullable(),
  ip_address: ipValidation.optional().or(z.literal("")),
  maintenance_terminal_id: z.uuid().optional().nullable(),
  commissioned_on: z.coerce.date().optional().nullable(),
  remark: z.string().optional().nullable(),
  status: z.boolean().default(true).optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const ofcConnectionSchema = z.object({
  // Primary key and foreign keys
  id: z.uuid().optional(),
  ofc_id: z.uuid({ message: "OFC Cable is required." }),
  logical_path_id: z.uuid().optional().nullable(),
  system_id: z.uuid().optional().nullable(),

  // Fiber connection details
  fiber_no_sn: z.number().int({ message: "Start Node Fiber No. is required." }),
  fiber_no_en: z.number().int().optional().nullable(),

  // Fields for logical path ordering and type
  path_segment_order: z.number().int().optional().nullable(),
  connection_category: z.string({
    message: "Connection Category is required.",
  }),
  connection_type: z.string({ message: "Connection Type is required." }),

  // Port names
  source_port: z.string().optional().nullable(),
  destination_port: z.string().optional().nullable(),

  // Start Node (sn) side measurements
  sn_dom: z.coerce.date().optional().nullable(),
  otdr_distance_sn_km: emptyStringToNumber,
  sn_power_dbm: emptyStringToNumber,

  // End Node (en) side measurements
  en_dom: z.coerce.date().optional().nullable(),
  otdr_distance_en_km: emptyStringToNumber,
  en_power_dbm: emptyStringToNumber,

  // Overall measurements and status
  route_loss_db: emptyStringToNumber,
  status: z.boolean().optional().nullable(), // Corrected to allow null
  remark: z.string().optional().nullable(),

  // Timestamps are usually handled by the database
  created_at: z.coerce.date().optional().nullable(),
  updated_at: z.coerce.date().optional().nullable(),
});

export const systemConnectionSchema = z.object({
  id: z.uuid().optional(),
  system_id: z.uuid({ message: "System is required." }),
  node_a_id: z.uuid().optional().nullable(),
  node_b_id: z.uuid().optional().nullable(),
  connected_system_id: z.uuid().optional().nullable(),
  ea_ip: ipValidation.optional().or(z.literal("")),
  ea_interface: z.string().optional().nullable(),
  eb_ip: ipValidation.optional().or(z.literal("")),
  eb_interface: z.string().optional().nullable(),
  media_type_id: z.uuid().optional().nullable(),
  bandwidth_mbps: z.number().int().optional().nullable(),
  vlan: z.string().optional().nullable(),
  commissioned_on: z.coerce.date().optional().nullable(),
  remark: z.string().optional().nullable(),
  status: z.boolean().default(true).optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const managementPortSchema = z.object({
  id: z.uuid().optional(),
  port_no: z.string().min(1, { message: "Port number is required." }),
  name: z.string().optional().nullable(),
  node_id: z.uuid().optional().nullable(),
  system_id: z.uuid().optional().nullable(),
  commissioned_on: z.coerce.date().optional().nullable(),
  remark: z.string().optional().nullable(),
  status: z.boolean().default(true).optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const sdhNodeAssociationSchema = z.object({
  id: z.uuid().optional(),
  sdh_system_id: z.string().uuid({ message: "SDH System is required." }),
  node_id: z.string().uuid({ message: "Node is required." }),
  node_position: z
    .enum(["A", "B", "C", "D", "E", "F", "G", "H"])
    .optional()
    .nullable(),
  node_ip: ipValidation.optional().or(z.literal("")),
});