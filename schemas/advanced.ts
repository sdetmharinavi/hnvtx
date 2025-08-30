import z from "zod";

export const logicalFiberPathSchema = z.object({
    id: z.uuid().optional(),
    path_name: z.string().min(1, "Path name is required."),
    path_type_id: z.uuid().optional().nullable(),
    source_system_id: z.uuid(),
    destination_system_id: z.uuid().optional().nullable(),
    source_port: z.string().optional().nullable(),
    destination_port: z.string().optional().nullable(),
    operational_status: z.string().default('planning'),
    total_distance_km: z.number().optional().nullable(),
    remark: z.string().optional().nullable(),
  });
  
  export const logicalPathSegmentSchema = z.object({
      id: z.uuid().optional(),
      logical_path_id: z.uuid(),
      ofc_cable_id: z.uuid().optional().nullable(),
      fiber_joint_id: z.uuid().optional().nullable(),
      path_order: z.number().int().positive(),
  }).refine(data => (data.ofc_cable_id && !data.fiber_joint_id) || (!data.ofc_cable_id && data.fiber_joint_id), {
      message: "A segment must be either a cable or a joint, not both.",
      path: ["ofc_cable_id"], 
  });