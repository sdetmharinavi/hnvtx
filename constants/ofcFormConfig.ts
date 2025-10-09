// components/ofc/OfcForm/constants/ofcFormConfig.ts
export const OFC_FORM_CONFIG = {
  CAPACITY_OPTIONS: [
    { value: '2', label: '2' },
    { value: '4', label: '4' },
    { value: '6', label: '6' },
    { value: '12', label: '12' },
    { value: '24', label: '24' },
    { value: '48', label: '48' },
    { value: '96', label: '96' },
    { value: '144', label: '144' },
    { value: '288', label: '288' },
    { value: '576', label: '576' },
    { value: '864', label: '864' },
    { value: '1728', label: '1728' },
  ],

  ALLOWED_NODE_TYPES: [
    'Transmission Nodes',
    'Joint / Splice Point',
    'Base Transceiver Station',
    'Backhaul Hub / Block HQ',
    'Customer Premises',
    'Gram Panchayat',
  ],

  NODES_FETCH_LIMIT: 1000,
  CACHE_TIME: 5 * 60 * 1000, // 5 minutes
} as const;
