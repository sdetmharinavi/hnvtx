// path: components/map/types/node.ts
import { z } from 'zod';
import { v_ring_nodesRowSchema } from '@/schemas/zod-schemas';

// The RingMapNode is the primary, feature-rich node type, derived directly from the view.
export type RingMapNode = z.infer<typeof v_ring_nodesRowSchema>;

// The MapNode can be a simplified version or a partial type for more generic use cases.
// For simplicity and type safety, we can often just use RingMapNode everywhere.
export type MapNode = RingMapNode;

// Enums can remain as they are application-level constants, not direct DB models.
export enum NodeType {
  EXCHANGE = "EXCHANGE",
  CUSTOMER = "CUSTOMER",
  BTS = "BTS",
  MAAN = "MAAN",
  CPAN = "CPAN",
  BTS_RUNNING_OVER_RADIOLINK = "BTS(RUNNING OVER RADIOLINK)",
}