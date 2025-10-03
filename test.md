```sh
routeData {
  id: 'feb1b4a5-1ce2-4c8e-a34c-76c6164288be',
  route_name: 'ADSR BARUIPUR - AERIAL JC NEAR BARUIPUR TRAFFIC CONTROL OFF-01',
  sn_id: '9fa7e823-3c49-4cb5-8519-f80ce7f416e4',
  en_id: 'fd990552-d8ae-4283-a06d-f713bab3854a',
  ofc_type_id: '84e8ba18-eedc-4eae-aaa4-e6a82400849d',
  capacity: 24,
  ofc_owner_id: 'ad3477d5-de78-4b9f-9302-a4b5db326e9f',
  current_rkm: 0.37,
  transnet_id: '244443',
  transnet_rkm: 0.37,
  asset_no: null,
  maintenance_terminal_id: '4bc2a086-b131-47e1-9c20-f10650c0196d',
  commissioned_on: null,
  remark: null,
  status: true,
  created_at: '2025-08-19T00:00:00+00:00',
  updated_at: '2025-08-29T00:00:00+00:00',
  sn_name: 'ADSR BARUIPUR',
  en_name: 'AERIAL JC NEAR BARUIPUR TRAFFIC CONTROL OFF',
  sn_node_type_name: 'Customer Premises',
  en_node_type_name: 'Joint / Splice Point',
  ofc_type_name: '24F Unarmored',
  ofc_type_code: '24F-U',
  ofc_owner_name: 'BSNL',
  ofc_owner_code: 'bsnl',
  maintenance_area_name: 'Harinavi Transmission Maintenance',
  maintenance_area_code: 'NDP'
}
jcData [
  {
    id: '55102fe8-a5e7-4b50-b781-5aae372cd011',
    node_id: '2df1be06-ecd8-4045-9779-23bd070ec546',
    ofc_cable_id: 'feb1b4a5-1ce2-4c8e-a34c-76c6164288be',
    position_km: 0.2,
    created_at: '2025-10-02T10:41:15.223814+00:00',
    updated_at: '2025-10-02T10:41:15.223814+00:00',
    node: { name: 'BJC BARUIPUR BAZAR OH JC' }
  }
]
equipment [
  {
    id: '55102fe8-a5e7-4b50-b781-5aae372cd011',
    node_id: '2df1be06-ecd8-4045-9779-23bd070ec546',
    ofc_cable_id: 'feb1b4a5-1ce2-4c8e-a34c-76c6164288be',
    position_km: 0.2,
    created_at: '2025-10-02T10:41:15.223814+00:00',
    updated_at: '2025-10-02T10:41:15.223814+00:00',
    node: { name: 'BJC BARUIPUR BAZAR OH JC' },
    status: 'existing',
    attributes: {
      position_on_route: 54.054054054054056,
      name: 'BJC BARUIPUR BAZAR OH JC'
    }
  }
]
segmentData [
  {
    id: 'fa27ec1d-d08e-4742-b1a7-c3ac837b2ef6',
    original_cable_id: 'feb1b4a5-1ce2-4c8e-a34c-76c6164288be',
    segment_order: 1,
    start_node_id: '9fa7e823-3c49-4cb5-8519-f80ce7f416e4',
    end_node_id: '2df1be06-ecd8-4045-9779-23bd070ec546',
    start_node_type: 'node',
    end_node_type: 'jc',
    distance_km: 0.2,
    fiber_count: 24,
    created_at: '2025-10-02T10:41:15.223814+00:00',
    updated_at: '2025-10-02T10:41:15.223814+00:00'
  },
  {
    id: '1433a79e-154c-4c50-b8ac-b2a947b9deca',
    original_cable_id: 'feb1b4a5-1ce2-4c8e-a34c-76c6164288be',
    segment_order: 2,
    start_node_id: '2df1be06-ecd8-4045-9779-23bd070ec546',
    end_node_id: 'fd990552-d8ae-4283-a06d-f713bab3854a',
    start_node_type: 'jc',
    end_node_type: 'node',
    distance_km: 0.17,
    fiber_count: 24,
    created_at: '2025-10-02T10:41:15.223814+00:00',
    updated_at: '2025-10-02T10:41:15.223814+00:00'
  }
]
payload {
  route: {
    id: 'feb1b4a5-1ce2-4c8e-a34c-76c6164288be',
    route_name: 'ADSR BARUIPUR - AERIAL JC NEAR BARUIPUR TRAFFIC CONTROL OFF-01',
    sn_id: '9fa7e823-3c49-4cb5-8519-f80ce7f416e4',
    en_id: 'fd990552-d8ae-4283-a06d-f713bab3854a',
    ofc_type_id: '84e8ba18-eedc-4eae-aaa4-e6a82400849d',
    capacity: 24,
    ofc_owner_id: 'ad3477d5-de78-4b9f-9302-a4b5db326e9f',
    current_rkm: 0.37,
    transnet_id: '244443',
    transnet_rkm: 0.37,
    asset_no: null,
    maintenance_terminal_id: '4bc2a086-b131-47e1-9c20-f10650c0196d',
    commissioned_on: null,
    remark: null,
    status: true,
    created_at: '2025-08-19T00:00:00+00:00',
    updated_at: '2025-08-29T00:00:00+00:00',
    sn_name: 'ADSR BARUIPUR',
    en_name: 'AERIAL JC NEAR BARUIPUR TRAFFIC CONTROL OFF',
    sn_node_type_name: 'Customer Premises',
    en_node_type_name: 'Joint / Splice Point',
    ofc_type_name: '24F Unarmored',
    ofc_type_code: '24F-U',
    ofc_owner_name: 'BSNL',
    ofc_owner_code: 'bsnl',
    maintenance_area_name: 'Harinavi Transmission Maintenance',
    maintenance_area_code: 'NDP',
    start_site: {
      id: '9fa7e823-3c49-4cb5-8519-f80ce7f416e4',
      name: 'ADSR BARUIPUR'
    },
    end_site: {
      id: 'fd990552-d8ae-4283-a06d-f713bab3854a',
      name: 'AERIAL JC NEAR BARUIPUR TRAFFIC CONTROL OFF'
    },
    evolution_status: 'fully_segmented'
  },
  equipment: [
    {
      id: '55102fe8-a5e7-4b50-b781-5aae372cd011',
      node_id: '2df1be06-ecd8-4045-9779-23bd070ec546',
      ofc_cable_id: 'feb1b4a5-1ce2-4c8e-a34c-76c6164288be',
      position_km: 0.2,
      created_at: '2025-10-02T10:41:15.223814+00:00',
      updated_at: '2025-10-02T10:41:15.223814+00:00',
      node: [Object],
      status: 'existing',
      attributes: [Object]
    }
  ],
  segments: [
    {
      id: 'fa27ec1d-d08e-4742-b1a7-c3ac837b2ef6',
      original_cable_id: 'feb1b4a5-1ce2-4c8e-a34c-76c6164288be',
      segment_order: 1,
      start_node_id: '9fa7e823-3c49-4cb5-8519-f80ce7f416e4',
      end_node_id: '2df1be06-ecd8-4045-9779-23bd070ec546',
      start_node_type: 'node',
      end_node_type: 'jc',
      distance_km: 0.2,
      fiber_count: 24,
      created_at: '2025-10-02T10:41:15.223814+00:00',
      updated_at: '2025-10-02T10:41:15.223814+00:00'
    },
    {
      id: '1433a79e-154c-4c50-b8ac-b2a947b9deca',
      original_cable_id: 'feb1b4a5-1ce2-4c8e-a34c-76c6164288be',
      segment_order: 2,
      start_node_id: '2df1be06-ecd8-4045-9779-23bd070ec546',
      end_node_id: 'fd990552-d8ae-4283-a06d-f713bab3854a',
      start_node_type: 'jc',
      end_node_type: 'node',
      distance_km: 0.17,
      fiber_count: 24,
      created_at: '2025-10-02T10:41:15.223814+00:00',
      updated_at: '2025-10-02T10:41:15.223814+00:00'
    }
  ],
  splices: []
}
```