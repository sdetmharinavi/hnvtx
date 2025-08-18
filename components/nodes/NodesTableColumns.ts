import { Column } from "@/hooks/database/excel-queries";
import { Row } from "@/hooks/database";
import { formatDate } from "@/utils/formatters";


export const getNodesTableColumns = (): Column<Row<"nodes">>[] => [
  { key: "name", title: "Name", dataIndex: "name", searchable: true, align: "left", width: "20%" },
  { key: "latitude", title: "Latitude", dataIndex: "latitude", align: "left" },
  { key: "longitude", title: "Longitude", dataIndex: "longitude", align: "left" },
  { key: "node_type_name", title: "Node Type", dataIndex: "node_type_name", align: "left" },
  { key: "maintenance_area_name", title: "Maintenance Terminal", dataIndex: "maintenance_area_name", align: "left" },
  { key: "ring_name", title: "Ring", dataIndex: "ring_name", align: "left" },
  { key: "ring_status", title: "Ring Status", dataIndex: "ring_status", render: (v: boolean | string) => (String(v) === "true" ? "Active" : "Inactive") },
  { key: "order_in_ring", title: "Order in Ring", dataIndex: "order_in_ring", align: "left" },
  { key: "builtup", title: "Builtup", dataIndex: "builtup", align: "left" },
  { key: "ip_address", title: "IP Address", dataIndex: "ip_address", align: "left" },
  { key: "east_port", title: "East Port", dataIndex: "east_port", align: "left" },
  { key: "site_id", title: "Site", dataIndex: "site_id", align: "left" },
  { key: "vlan", title: "VLAN", dataIndex: "vlan", align: "left" },
  { key: "west_port", title: "West Port", dataIndex: "west_port", align: "left" },
  { key: "status", title: "Status", dataIndex: "status", render: (v: boolean) => (v ? "Active" : "Inactive") },
  { key: "remark", title: "Remark", dataIndex: "remark", align: "left" },
  { key: "created_at", title: "Created", dataIndex: "created_at", render: (v: string | null) => (v ? formatDate(v) : "-") },
  { key: "updated_at", title: "Updated", dataIndex: "updated_at", render: (v: string | null) => (v ? formatDate(v) : "-") },
];
