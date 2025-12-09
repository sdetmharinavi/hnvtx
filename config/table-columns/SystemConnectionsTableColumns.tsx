// config/table-columns/SystemConnectionsTableColumns.tsx
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";
import { StatusBadge } from "@/components/common/ui/badges/StatusBadge";
import { FiMapPin } from "react-icons/fi";
import { formatDate } from "@/utils/formatters";
import { Row } from "@/hooks/database";
import { PathDisplay } from "@/components/system-details/PathDisplay"; // Updated Import
import { Column } from "@/hooks/database/excel-queries/excel-helpers";
import TruncateTooltip from "@/components/common/TruncateTooltip";

export const SystemConnectionsTableColumns = (
  data: Row<"v_system_connections_complete">[]
): Column<Row<"v_system_connections_complete">>[] => {
  const baseColumns = useDynamicColumnConfig("v_system_connections_complete", {
    data: data,
    omit: [
      "id",
      "system_id",
      "system_name",
      "system_type_name",
      "media_type_id",
      "created_at",
      "updated_at",
      "en_interface",
      "sn_interface",
      "en_ip",
      "sn_ip",
      "sn_id",
      "en_id",
      "service_node_id",
      "sn_node_id",
      "en_node_id",
      "sdh_a_customer",
      "sdh_a_slot",
      "sdh_b_customer",
      "sdh_b_slot",
      "sdh_carrier",
      "sdh_stm_no",
      "vlan",
      "en_node_name",
      "sn_node_name",
      "media_type_name",
      "remark",
      "working_fiber_in_ids",
      "working_fiber_out_ids",
      "protection_fiber_in_ids",
      "protection_fiber_out_ids",
      "service_id",
      "connected_link_type_id",
      "sn_name",
      "en_name",
      "connected_system_type_name",
      "en_system_type_name",
      "sn_system_type_name",
      "bandwidth",
      "connected_system_name",
      "service_node_name",



    ],
    overrides: {
      service_name: {
        title: "Service / Customer",
        sortable: true,
        searchable: true,
        width: 250,
        render: (value, record) => (
          <div className='grid '>
            <TruncateTooltip
              text={(value as string) || record.connected_system_name || "N/A"}
              className='font-medium text-gray-900 dark:text-white'
            />
            <div className='text-xs text-gray-500 dark:text-gray-400 flex gap-2'>
              <span>{record.connected_link_type_name || record.en_system_type_name || ""}</span>
              {record.bandwidth_allocated && (
                <span className='bg-blue-50 text-blue-700 px-1 rounded'>
                  {record.bandwidth_allocated}
                </span>
              )}
            </div>
          </div>
        ),
      },
      connected_link_type_name: {
        sortable: true,
        naturalSort: true,
      },
      bandwidth_allocated: {
        sortable: true,
        naturalSort: true,
      },
      system_working_interface: {
        title: "Working Interface",
        sortable: true,
        naturalSort: true,
      },
      system_protection_interface: {
        title: "Protection Interface",
        sortable: true,
        naturalSort: true,
      },
      bandwidth: {
        title: "Capacity (Mbps)",
        sortable: true,
        width: 120,
        render: (value) => <span className='font-mono text-sm'>{value ? `${value}` : "N/A"}</span>,
      },
      en_name: {
        title: "End Node",
        sortable: true,
        width: 150,
        render: (value) => (
          <div className='flex items-center gap-1'>
            <FiMapPin className='h-3 w-3 text-gray-400' />
            <span>{(value as string) || "N/A"}</span>
          </div>
        ),
      },
      sn_name: {
        title: "Start Node",
        sortable: true,
        width: 150,
        render: (value) => (
          <div className='flex items-center gap-1'>
            <FiMapPin className='h-3 w-3 text-gray-400' />
            <span>{(value as string) || "N/A"}</span>
          </div>
        ),
      },
      lc_id: {
        title: "LC ID",
        width: 100,
        excelFormat: "text",
        sortable: true,
        naturalSort: true,
      },
      unique_id: {
        title: "Unique ID",
        width: 120,
        excelFormat: "text",
        sortable: true,
        naturalSort: true,
      },
      status: {
        title: "Status",
        sortable: true,
        width: 120,
        render: (value) => <StatusBadge status={value as boolean} />,
      },
      commissioned_on: {
        title: "Commissioned On",
        sortable: true,
        width: 150,
        render: (value) => formatDate(value as string, { format: "dd-mm-yyyy" }),
      },
    },
  });

  const provisionedPathColumn: Column<Row<"v_system_connections_complete">> = {
    key: "provisioned_path",
    title: "Provisioned Path",
    dataIndex: "id",
    width: 350,
    render: (value) => <PathDisplay systemConnectionId={value as string | null} />,
  };

  const serviceNameIndex = baseColumns.findIndex((c) => c.key === "service_name");
  const finalColumns = [...baseColumns];

  if (serviceNameIndex !== -1) {
    finalColumns.splice(serviceNameIndex + 1, 0, provisionedPathColumn);
  } else {
    finalColumns.unshift(provisionedPathColumn);
  }

  return finalColumns;
};
