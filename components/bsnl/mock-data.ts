// path: components/bsnl/mock-data.ts
import { BsnlNode, BsnlCable, BsnlSystem } from './types';

// This function now generates data that matches the shape of your database views.
export function generateLargeDataset() {
  const regions = ['North', 'South', 'East', 'West', 'Central'];

  // Generate nodes that conform to V_nodes_completeRowSchema
  const nodes: BsnlNode[] = Array.from({ length: 100 }, (_, i) => ({
    id: `node_${i}`,
    name: `NODE-${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26)}`,
    latitude: 22.5 + (Math.random() - 0.5) * 0.2,
    longitude: 88.35 + (Math.random() - 0.5) * 0.2,
    status: [true, true, false][i % 3],
    node_type_name: ['OFC', 'JC', 'END_POINT'][i % 3],
    maintenance_area_name: regions[i % regions.length],
    // --- Adding null or default values for other required fields ---
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    active_count: null,
    inactive_count: null,
    maintenance_area_code: null,
    maintenance_area_type_name: null,
    maintenance_terminal_id: null,
    node_type_code: null,
    node_type_id: null,
    remark: `Mock remark for node ${i}`,
    total_count: null,
  }));

  // Generate cables that conform to V_ofc_cables_completeRowSchema
  const ofcCables: BsnlCable[] = Array.from({ length: 500 }, (_, i) => {
    const startNode = nodes[Math.floor(Math.random() * nodes.length)];
    const endNode = nodes[Math.floor(Math.random() * nodes.length)];
    return {
      id: `ofc_${i}`,
      route_name: `ROUTE-${startNode.name}-TO-${endNode.name}-${i}`,
      sn_id: startNode.id,
      en_id: endNode.id,
      sn_name: startNode.name,
      en_name: endNode.name,
      capacity: [12, 24, 48, 96][i % 4],
      current_rkm: Math.random() * 10 + 0.5,
      status: [true, true, false][i % 3],
      ofc_type_name: ['Main', 'Branch', 'Cascade'][i % 3],
      ofc_owner_name: ['BSNL', 'BBNL'][i % 2],
      maintenance_area_name: startNode.maintenance_area_name,
      // --- Adding null or default values for other required fields ---
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      active_count: null,
      asset_no: `ASSET-00${i}`,
      commissioned_on: new Date().toISOString(),
      inactive_count: null,
      maintenance_area_code: null,
      maintenance_terminal_id: null,
      ofc_owner_code: null,
      ofc_owner_id: null,
      ofc_type_code: null,
      ofc_type_id: null,
      remark: `Mock remark for cable ${i}`,
      total_count: null,
      transnet_id: null,
      transnet_rkm: null,
    };
  });

  // Generate systems that conform to V_systems_completeRowSchema
  const systems: BsnlSystem[] = Array.from({ length: 1000 }, (_, i) => {
    const node = nodes[Math.floor(Math.random() * nodes.length)];
    return {
      id: `system_${i}`,
      system_name: `SYSTEM-${node.name}-${i}`,
      node_id: node.id,
      node_name: node.name,
      system_type_name: ['Transmission', 'Access', 'Backbone'][i % 3],
      status: [true, false, true][i % 3],
      ip_address: `10.20.${i % 255}.${Math.floor(Math.random() * 254) + 1}`,
      // --- Adding null or default values for other required fields ---
      active_count: null,
      commissioned_on: new Date().toISOString(),
      created_at: new Date().toISOString(),
      inactive_count: null,
      latitude: node.latitude,
      longitude: node.longitude,
      maintenance_terminal_id: null,
      remark: `Mock remark for system ${i}`,
      ring_id: null,
      ring_logical_area_name: null,
      s_no: `SN-00${i}`,
      sdh_gne: null,
      sdh_make: null,
      system_category: null,
      system_maintenance_terminal_name: node.maintenance_area_name,
      system_type_code: null,
      system_type_id: null,
      total_count: null,
      updated_at: new Date().toISOString(),
      vmux_vm_id: null,
    };
  });

  return { nodes, ofcCables, systems };
}