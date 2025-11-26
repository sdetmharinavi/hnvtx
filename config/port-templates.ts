// config/port-templates.ts
import { Ports_managementInsertSchema } from "@/schemas/zod-schemas";

// Use a loose type intersection for now until schema is regenerated
type PortConfig = Omit<Ports_managementInsertSchema, "id" | "system_id"> & {
  port_utilization?: boolean;
  port_admin_status?: boolean;
  services_count?: number;
};

export interface PortTemplate {
  name: string;
  description: string;
  ports: PortConfig[];
}

// A registry of available templates. Keys are internal slugs.
export const PORT_TEMPLATES: Record<string, PortTemplate> = {
  "cpan-standard-a1/a2": {
    name: "CPAN A1/A2",
    description: "Standard configuration with 1.1-2.6 slots",
    ports: [
      // Slot 1
      {
        port: "1.1",
        port_type_id: "1b49c00c-734e-4dd9-8e0f-c0525edd9fa1",
        port_capacity: "2mbps",
        port_utilization: false,
        port_admin_status: true,
        services_count: 0,
      },
      {
        port: "1.2",
        port_type_id: "1b49c00c-734e-4dd9-8e0f-c0525edd9fa1",
        port_capacity: "2mbps",
        port_utilization: false,
        port_admin_status: true,
        services_count: 0,
      },
      {
        port: "1.3",
        port_type_id: "14888b49-2f7d-4dbd-93c2-b19dcafbcd8c",
        port_capacity: "1G",
        port_utilization: false,
        port_admin_status: true,
        services_count: 0,
      },
      {
        port: "1.4",
        port_type_id: "14888b49-2f7d-4dbd-93c2-b19dcafbcd8c",
        port_capacity: "1G",
        port_utilization: false,
        port_admin_status: true,
        services_count: 0,
      },
      {
        port: "1.5",
        port_type_id: "4b86eede-d502-4368-85c1-8e68d9b50282",
        port_capacity: "1G",
        port_utilization: false,
        port_admin_status: true,
        services_count: 0,
      },
      {
        port: "1.6",
        port_type_id: "4b86eede-d502-4368-85c1-8e68d9b50282",
        port_capacity: "1G",
        port_utilization: false,
        port_admin_status: true,
        services_count: 0,
      },
      // Slot 2
      {
        port: "2.1",
        port_type_id: "1b49c00c-734e-4dd9-8e0f-c0525edd9fa1",
        port_capacity: "2mbps",
        port_utilization: false,
        port_admin_status: true,
        services_count: 0,
      },
      {
        port: "2.2",
        port_type_id: "1b49c00c-734e-4dd9-8e0f-c0525edd9fa1",
        port_capacity: "2mbps",
        port_utilization: false,
        port_admin_status: true,
        services_count: 0,
      },
      {
        port: "2.3",
        port_type_id: "14888b49-2f7d-4dbd-93c2-b19dcafbcd8c",
        port_capacity: "1G",
        port_utilization: false,
        port_admin_status: true,
        services_count: 0,
      },
      {
        port: "2.4",
        port_type_id: "14888b49-2f7d-4dbd-93c2-b19dcafbcd8c",
        port_capacity: "1G",
        port_utilization: false,
        port_admin_status: true,
        services_count: 0,
      },
      {
        port: "2.5",
        port_type_id: "4b86eede-d502-4368-85c1-8e68d9b50282",
        port_capacity: "1G",
        port_utilization: false,
        port_admin_status: true,
        services_count: 0,
      },
      {
        port: "2.6",
        port_type_id: "4b86eede-d502-4368-85c1-8e68d9b50282",
        port_capacity: "1G",
        port_utilization: false,
        port_admin_status: true,
        services_count: 0,
      },
    ],
  },
  "sdh-stm16": {
    name: "SDH (STM-16)",
    description: "Standard SDH configuration",
    ports: [
      // Add SDH specific ports here in the future
      {
        port: "1",
        port_type_id: null,
        port_capacity: "STM-1",
        port_utilization: false,
        port_admin_status: true,
        services_count: 0,
      },
    ],
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const generatePortsFromTemplate = (templateKey: string, systemId: string): any[] => {
  const template = PORT_TEMPLATES[templateKey];
  if (!template) return [];

  return template.ports.map((item) => ({
    id: crypto.randomUUID(),
    system_id: systemId,
    port: item.port,
    port_type_id: item.port_type_id,
    port_capacity: item.port_capacity,
    sfp_serial_no: null,
    port_utilization: item.port_utilization ?? false,
    port_admin_status: item.port_admin_status ?? true,
    services_count: item.services_count ?? 0,
  }));
};
