// path: components/map/types/node.ts
export enum NodeType {
  EXCHANGE = "EXCHANGE",
  CUSTOMER = "CUSTOMER",
  BTS = "BTS",
  MAAN = "MAAN",
  CPAN = "CPAN",
  BTS_RUNNING_OVER_RADIOLINK = "BTS(RUNNING OVER RADIOLINK)",
}

// A generic, standardized interface for any node to be displayed on the map
export interface MapNode {
  id: string;
  name: string;
  lat: number;
  long: number;
  type?: string | null;
  status?: boolean | null;
  ip?: string | null;
  remark?: string | null;
}

// A more specific type that includes all possible fields from your ring data
export type MaanNode = MapNode & {
  ring_id: string | null;
  order_in_ring: number | null;
  ring_status: boolean | null;
  builtup?: string | null;
  otdr_distance?: number | null;
  otdr_loss?: number | null;
  power?: number | null;
  dom?: Date | null;
  east_port?: string | null;
  west_port?: string | null;
};