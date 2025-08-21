import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';

const OfcTableColumns = (ofcTypeMap: Record<string, string>, areaMap: Record<string, string>) => {

    const columns = useDynamicColumnConfig("ofc_cables", {
        omit: ['updated_at', 'created_at', 'id','sn_id','en_id'],
        overrides: {
           ofc_type_id: {
            render: (value) => ofcTypeMap[value as string]
           },
           maintenance_terminal_id: {
            render: (value) => areaMap[value as string]
           }
        }
    });
  return columns
}

export default OfcTableColumns

