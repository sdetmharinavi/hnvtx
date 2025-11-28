// config/port-templates.ts
import { Ports_managementInsertSchema } from "@/schemas/zod-schemas";

// Use a loose type intersection for now until schema is regenerated
type PortConfig = Omit<Ports_managementInsertSchema, 'id' | 'system_id'> & {
    port_utilization?: boolean;
    port_admin_status?: boolean;
    services_count?: number;
};

export interface PortTemplate {
  name: string;
  description: string;
  ports: PortConfig[];
}

// Helper to create default port config
const createPort = (port: string, typeId: string, capacity: string): PortConfig => ({
  port,
  port_type_id: typeId,
  port_capacity: capacity,
  sfp_serial_no: null,
  port_utilization: false,
  port_admin_status: false,
  services_count: 0
});

// UUID Constants for Port Types (from your SQL)
const PORT_TYPES = {
  E1_2MBPS: '1b49c00c-734e-4dd9-8e0f-c0525edd9fa1',
  FE: '14888b49-2f7d-4dbd-93c2-b19dcafbcd8c',
  GE_OPTICAL: '4b86eede-d502-4368-85c1-8e68d9b50282',
  GE_ELECTRICAL: 'bf63f1aa-0976-401a-8309-1ede374d0c54',
  TEN_GE: '6c9460cb-22dd-4457-82e3-0ccebe0f3afc',
  STM1: '7be2cd28-a794-4f98-b2aa-31ea6c1c6edc'
};

export const PORT_TEMPLATES: Record<string, PortTemplate> = {
  // A1 Ports (System Capacity ID: 42f21547-e070-4a94-a13d-d4f158e51fc1)
  "42f21547-e070-4a94-a13d-d4f158e51fc1": {
    name: "A1 Ports Configuration",
    description: "Configuration for A1 type systems (2 Slots, mixed E1/GE)",
    ports: [
      // Slot 1
      createPort('1.1', PORT_TYPES.E1_2MBPS, '2mbps'),
      createPort('1.2', PORT_TYPES.E1_2MBPS, '2mbps'),
      createPort('1.3', PORT_TYPES.GE_ELECTRICAL, 'GE(E)'),
      createPort('1.4', PORT_TYPES.GE_ELECTRICAL, 'GE(E)'),
      createPort('1.5', PORT_TYPES.GE_OPTICAL, 'GE(O)'),
      createPort('1.6', PORT_TYPES.GE_OPTICAL, 'GE(O)'),
      // Slot 2
      createPort('2.1', PORT_TYPES.E1_2MBPS, '2mbps'),
      createPort('2.2', PORT_TYPES.E1_2MBPS, '2mbps'),
      createPort('2.3', PORT_TYPES.GE_ELECTRICAL, 'GE(E)'),
      createPort('2.4', PORT_TYPES.GE_ELECTRICAL, 'GE(E)'),
      createPort('2.5', PORT_TYPES.GE_OPTICAL, 'GE(O)'),
      createPort('2.6', PORT_TYPES.GE_OPTICAL, 'GE(O)'),
      // NMS
      createPort('NMS', PORT_TYPES.FE, 'FE')
    ]
  },

  // A3 Ports (System Capacity ID: b63e879c-6b09-402f-8958-a45a023e4339)
  "b63e879c-6b09-402f-8958-a45a023e4339": {
    name: "A3 Ports Configuration",
    description: "High density GE/10GE configuration",
    ports: [
      createPort('ETH-1-1-1', PORT_TYPES.GE_OPTICAL, 'GE(O)'),
      createPort('ETH-1-1-2', PORT_TYPES.GE_OPTICAL, 'GE(O)'),
      createPort('ETH-1-1-3', PORT_TYPES.GE_OPTICAL, 'GE(O)'),
      createPort('ETH-1-1-4', PORT_TYPES.GE_OPTICAL, 'GE(O)'),
      createPort('ETH-1-1-5', PORT_TYPES.GE_OPTICAL, 'GE(O)'),
      createPort('ETH-1-1-6', PORT_TYPES.GE_OPTICAL, 'GE(O)'),
      createPort('ETH-1-1-7', PORT_TYPES.GE_OPTICAL, 'GE(O)'),
      createPort('ETH-1-1-8', PORT_TYPES.GE_OPTICAL, 'GE(O)'),
      createPort('ETH-1-1-9', PORT_TYPES.GE_OPTICAL, 'GE(O)'),
      createPort('ETH-1-1-10', PORT_TYPES.GE_OPTICAL, 'GE(O)'),
      createPort('ETH-1-1-11', PORT_TYPES.GE_OPTICAL, 'GE(O)'),
      createPort('ETH-1-1-12', PORT_TYPES.GE_OPTICAL, 'GE(O)'),
      createPort('ETH-1-1-13', PORT_TYPES.TEN_GE, '10GE'),
      createPort('ETH-1-1-14', PORT_TYPES.TEN_GE, '10GE'),
      createPort('ETH-1-1-17', PORT_TYPES.GE_OPTICAL, 'GE(E)'),
      createPort('ETH-1-1-18', PORT_TYPES.GE_OPTICAL, 'GE(E)'),
      createPort('ETH-1-1-19', PORT_TYPES.GE_OPTICAL, 'GE(E)'),
      createPort('ETH-1-1-20', PORT_TYPES.GE_OPTICAL, 'GE(E)'),
      createPort('NMS', PORT_TYPES.FE, 'FE')
    ]
  },

  // B1 Ports (System Capacity ID: 3beb3ea2-55a4-48da-a7fa-f7c9ccf7de79)
  "3beb3ea2-55a4-48da-a7fa-f7c9ccf7de79": {
    name: "B1 Ports Configuration",
    description: "Configuration with STM1, E1, GE and 10GE mix",
    ports: [
      // Slot 1 (STM1 & E1)
      ...['1.1', '1.2', '1.3', '1.4'].map(p => createPort(p, PORT_TYPES.STM1, 'STM1')),
      ...Array.from({length: 16}, (_, i) => createPort(`1.${i+5}`, PORT_TYPES.E1_2MBPS, '2mbps')),
      
      // Slot 2 (STM1 & E1)
      ...['2.1', '2.2', '2.3', '2.4'].map(p => createPort(p, PORT_TYPES.STM1, 'STM1')),
      ...Array.from({length: 16}, (_, i) => createPort(`2.${i+5}`, PORT_TYPES.E1_2MBPS, '2mbps')),

      // Slot 3 (10GE & GE)
      createPort('3.1', PORT_TYPES.TEN_GE, '10GE'),
      ...Array.from({length: 5}, (_, i) => createPort(`3.${i+2}`, PORT_TYPES.GE_OPTICAL, 'GE(O)')),
      ...Array.from({length: 6}, (_, i) => createPort(`3.${i+7}`, PORT_TYPES.GE_ELECTRICAL, 'GE(E)')),

      // Slot 4 (10GE & GE)
      createPort('4.1', PORT_TYPES.TEN_GE, '10GE'),
      ...Array.from({length: 5}, (_, i) => createPort(`4.${i+2}`, PORT_TYPES.GE_OPTICAL, 'GE(O)')),
      ...Array.from({length: 6}, (_, i) => createPort(`4.${i+7}`, PORT_TYPES.GE_ELECTRICAL, 'GE(E)')),

      // Slot 5 (10GE & GE)
      createPort('5.1', PORT_TYPES.TEN_GE, '10GE'),
      ...Array.from({length: 5}, (_, i) => createPort(`5.${i+2}`, PORT_TYPES.GE_OPTICAL, 'GE(O)')),
      ...Array.from({length: 6}, (_, i) => createPort(`5.${i+7}`, PORT_TYPES.GE_ELECTRICAL, 'GE(E)')),

      // Slot 6 (10GE & GE)
      createPort('6.1', PORT_TYPES.TEN_GE, '10GE'),
      ...Array.from({length: 5}, (_, i) => createPort(`6.${i+2}`, PORT_TYPES.GE_OPTICAL, 'GE(O)')),
      ...Array.from({length: 6}, (_, i) => createPort(`6.${i+7}`, PORT_TYPES.GE_ELECTRICAL, 'GE(E)')),

      createPort('NMS', PORT_TYPES.FE, 'FE')
    ]
  },

  // B2 Ports (System Capacity ID: 8e4dde01-4900-4fa5-a9e5-9b89bfe2663a)
  // Similar to B1 but potentially different specific requirements, matching the SQL logic structure
  "8e4dde01-4900-4fa5-a9e5-9b89bfe2663a": {
    name: "B2 Ports Configuration",
    description: "Configuration matching B1 layout (STM1, E1, GE, 10GE)",
    ports: [
       // Slot 1 (STM1 & E1)
      ...['1.1', '1.2', '1.3', '1.4'].map(p => createPort(p, PORT_TYPES.STM1, 'STM1')),
      ...Array.from({length: 16}, (_, i) => createPort(`1.${i+5}`, PORT_TYPES.E1_2MBPS, '2mbps')),
      
      // Slot 2 (STM1 & E1)
      ...['2.1', '2.2', '2.3', '2.4'].map(p => createPort(p, PORT_TYPES.STM1, 'STM1')),
      ...Array.from({length: 16}, (_, i) => createPort(`2.${i+5}`, PORT_TYPES.E1_2MBPS, '2mbps')),
      
      // Slot 3
      createPort('3.1', PORT_TYPES.TEN_GE, '10GE'),
      ...Array.from({length: 5}, (_, i) => createPort(`3.${i+2}`, PORT_TYPES.GE_OPTICAL, 'GE(O)')),
      ...Array.from({length: 6}, (_, i) => createPort(`3.${i+7}`, PORT_TYPES.GE_ELECTRICAL, 'GE(E)')),

      // Slot 4
      createPort('4.1', PORT_TYPES.TEN_GE, '10GE'),
      ...Array.from({length: 5}, (_, i) => createPort(`4.${i+2}`, PORT_TYPES.GE_OPTICAL, 'GE(O)')),
      ...Array.from({length: 6}, (_, i) => createPort(`4.${i+7}`, PORT_TYPES.GE_ELECTRICAL, 'GE(E)')),

      // Slot 5
      createPort('5.1', PORT_TYPES.TEN_GE, '10GE'),
      ...Array.from({length: 5}, (_, i) => createPort(`5.${i+2}`, PORT_TYPES.GE_OPTICAL, 'GE(O)')),
      ...Array.from({length: 6}, (_, i) => createPort(`5.${i+7}`, PORT_TYPES.GE_ELECTRICAL, 'GE(E)')),

      // Slot 6
      createPort('6.1', PORT_TYPES.TEN_GE, '10GE'),
      ...Array.from({length: 5}, (_, i) => createPort(`6.${i+2}`, PORT_TYPES.GE_OPTICAL, 'GE(O)')),
      ...Array.from({length: 6}, (_, i) => createPort(`6.${i+7}`, PORT_TYPES.GE_ELECTRICAL, 'GE(E)')),

      createPort('NMS', PORT_TYPES.FE, 'FE')
    ]
  },

  // B3 Ports (System Capacity ID: ce06f9b7-02e7-4741-8911-46cf1f47ffdd)
  "ce06f9b7-02e7-4741-8911-46cf1f47ffdd": {
    name: "B3 Ports Configuration",
    description: "High density GE Optical/Electrical + 4x 10GE",
    ports: [
      ...Array.from({length: 12}, (_, i) => createPort(`ETH-1-1-${i+1}`, PORT_TYPES.GE_OPTICAL, 'GE(O)')),
      ...['13', '14', '15', '16'].map(n => createPort(`ETH-1-1-${n}`, PORT_TYPES.TEN_GE, '10GE')),
      ...['17', '18', '19', '20'].map(n => createPort(`ETH-1-1-${n}`, PORT_TYPES.GE_OPTICAL, 'GE(E)')), // Note: SQL used GE(E) with GE_OPTICAL UUID, preserving that logic here
      createPort('NMS', PORT_TYPES.FE, 'FE')
    ]
  },

  // BBU Ports (System Capacity ID: 3830d349-f4ce-4391-9796-111cbf942a6f)
  "3830d349-f4ce-4391-9796-111cbf942a6f": {
    name: "BBU Ports Configuration",
    description: "Base Band Unit standard ports",
    ports: [
      createPort('P1', PORT_TYPES.GE_ELECTRICAL, 'GE(E)'),
      createPort('P2', PORT_TYPES.GE_OPTICAL, 'GE(O)'),
      createPort('P3', PORT_TYPES.GE_OPTICAL, 'GE(O)'),
      createPort('P4', PORT_TYPES.TEN_GE, '10GE'),
      createPort('P5', PORT_TYPES.TEN_GE, '10GE')
    ]
  }
};

export const generatePortsFromTemplate = (templateKey: string, systemId: string): Ports_managementInsertSchema[] => {
  const template = PORT_TEMPLATES[templateKey];
  if (!template) return [];

  return template.ports.map(item => ({
    // system_id is injected here
    system_id: systemId,
    ...item
  }));
};