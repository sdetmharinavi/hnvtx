import { Column } from "@/hooks/database/excel-queries";
import { Row } from "@/hooks/database";
import { formatDate } from "@/utils/formatters";

export const getRingsTableColumns = (): Column<Row<"rings">>[] => [
  { key: "name", title: "Name", dataIndex: "name", searchable: true, align: "left", width: "20%" },
  { key: "total_nodes", title: "Total Nodes", dataIndex: "total_nodes", align: "right" },
  { key: "ring_type", title: "Ring Type", dataIndex: "ring_type", render: (v: Row<"lookup_types"> | "N/A") => (v as Row<"lookup_types">)?.code || "N/A", align: "left" },
  { key: "maintenance_terminal", title: "Maintenance Terminal", dataIndex: "maintenance_terminal", render: (v: Row<"maintenance_areas"> | "N/A") => (v as Row<"maintenance_areas">)?.name || "N/A", align: "left" },
  { key: "status", title: "Status", dataIndex: "status", render: (v: boolean) => (v ? "Active" : "Inactive") },
  { key: "description", title: "Description", dataIndex: "description", align: "left" },
  { key: "created_at", title: "Created", dataIndex: "created_at", render: (v: string) => formatDate(v) },
  { key: "updated_at", title: "Updated", dataIndex: "updated_at", render: (v: string) => formatDate(v) },
];
