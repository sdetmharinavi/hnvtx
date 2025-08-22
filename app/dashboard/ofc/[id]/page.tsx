"use client";

// app/dashboard/ofc/[id]/page.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useOfcConnection } from "@/hooks/useOfcConnection";
import { OfcCablesWithRelations } from "@/components/ofc/ofc-types";
import { Database } from "@/types/supabase-types";
import { PageSpinner } from "@/components/common/ui/LoadingSpinner";
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";
import { DataTable } from "@/components/table";
import { useTableExcelDownload } from "@/hooks/database/excel-queries";
import { formatDate } from "@/utils/formatters";
import { Column } from "@/hooks/database/excel-queries/excel-helpers";
import { Row } from "@/hooks/database";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "@/components/common/ui";

export const dynamic = "force-dynamic";

export type OfcConnectionFilters = {
  search: string;
  ofc_owner_id: string;
};

export default function OfcCableDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const supabase = createClient();
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  const { cable, existingConnections, isLoading, ensureConnectionsExist } =
    useOfcConnection({ supabase, cableId: id as string }) as {
      cable: OfcCablesWithRelations | undefined;
      existingConnections: Database["public"]["Tables"]["ofc_connections"]["Row"][];
      isLoading: boolean;
      ensureConnectionsExist: () => Promise<void>;
    };

  // Automatically ensure connections exist when component mounts
  useEffect(() => {
    if (!isLoading) {
      ensureConnectionsExist();
    }
  }, [isLoading, ensureConnectionsExist]);

  // DataTable Configuration
  const columns = useDynamicColumnConfig("ofc_connections", {
    omit: [
      "id",
      "source_id",
      "destination_id",
      "source_port",
      "destination_port",
      "ofc_id",
      "logical_path_id",
      "created_at",
      "updated_at",
    ],
    overrides: {
      connection_type: { title: "Connection Type", sortable: true, width: 150 },
      destination_id: { title: "Destination ID", sortable: true, width: 250 },
      destination_port: {
        title: "Destination Port",
        sortable: true,
        width: 250,
      },
      en_dom: { title: "EN DOM", sortable: true, width: 250 },
      en_power_dbm: { title: "EN Power (dBm)", sortable: true, width: 250 },
      fiber_no_en: { title: "Fiber No. (EN)", sortable: true, width: 250 },
      fiber_no_sn: { title: "Fiber No. (SN)", sortable: true, width: 250 },
      // id: { title: "ID", sortable: true, width: 250 },
      logical_path_id: { title: "Logical Path ID", sortable: true, width: 250 },
      ofc_id: { title: "OFC ID", sortable: true, width: 250 },
      otdr_distance_en_km: {
        title: "OTDR Distance (EN) (km)",
        sortable: true,
        width: 250,
      },
      otdr_distance_sn_km: {
        title: "OTDR Distance (SN) (km)",
        sortable: true,
        width: 250,
      },
      path_segment_order: {
        title: "Path Segment Order",
        sortable: true,
        width: 250,
      },
      remark: { title: "Remark", sortable: true, width: 250 },
      route_loss_db: { title: "Route Loss (dB)", sortable: true, width: 250 },
      sn_dom: { title: "SN DOM", sortable: true, width: 250 },
      sn_power_dbm: { title: "SN Power (dBm)", sortable: true, width: 250 },
      source_id: { title: "Source ID", sortable: true, width: 250 },
      source_port: { title: "Source Port", sortable: true, width: 250 },
      system_sn_id: { title: "System SN ID", sortable: true, width: 250 },
      system_en_id: { title: "System EN ID", sortable: true, width: 250 },
      updated_at: { title: "Updated At", sortable: true, width: 250 },
      status: {
        title: "Status",
        sortable: true,
        width: 100,
        render: (value: boolean) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {value ? "Active" : "Inactive"}
          </span>
        ),
      },
    },
  });

  const totalCount = useMemo(
    () => existingConnections.length,
    [existingConnections]
  );

  // Download Configuration
  // Convert filters to server format
  const [filters, setFilters] = useState<OfcConnectionFilters>({
    search: "",
    ofc_owner_id: "",
  });
  const serverFilters = useMemo(() => {
    const dbFilters: Record<string, string | boolean> = {};
    if (filters.ofc_owner_id) {
      dbFilters.ofc_owner_id = filters.ofc_owner_id;
    }
    return dbFilters;
  }, [filters.ofc_owner_id]);

  const tableExcelDownload = useTableExcelDownload(supabase, "ofc_connections");
  const columnsForExcelExport = useDynamicColumnConfig("ofc_connections");

  const handleExport = () => {
    const tableName = "ofc_connections";
    const tableOptions = {
      fileName: `${formatDate(new Date(), { format: "dd-mm-yyyy" })}-${String(
        tableName
      )}-export.xlsx`,
      sheetName: String(tableName),
      columns: columnsForExcelExport as Column<Row<typeof tableName>>[],
      filters: serverFilters,
      maxRows: 1000,
      customStyles: {},
    };
    tableExcelDownload.mutate(tableOptions);
  };

  // Debounced search handler
  const debouncedSearch = useDebouncedCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, 300);

  // Define handleSearch before using it in customToolbar
  const handleSearch = useCallback(
    (value: string) => {
      // Update the input value immediately for better UX
      setFilters((prev) => ({ ...prev, search: value }));
      // Debounce the actual search operation (safe even if immediate set happens)
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  console.log("existingConnections", existingConnections);

  const loading = isLoading;

  if (loading) {
    return <PageSpinner />;
  }

  if (!cable) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                OFC cable with ID {id} not found.
              </p>
              <button
                onClick={() => router.push("/dashboard/ofc")}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                &larr; Back to OFC List
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusBadge = cable.status ? (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
      Active
    </span>
  ) : (
    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
      Inactive
    </span>
  );

  return (
    <div className="mx-auto space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
            OFC Cable Details
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">ID: {id}</p>
        </div>
        <div>
          <Link
            href="/dashboard/ofc"
            className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            Back to List
          </Link>
          <Button
            onClick={handleExport}
            variant="outline"
            className="ml-2"
          >
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold mb-3">Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Asset No.</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {String(cable.asset_no ?? "-")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Route Name</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {String(cable.route_name ?? "-")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Status</span>
              <span>{statusBadge}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold mb-3">Metadata</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">OFC Type</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {cable?.ofc_type?.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Maintenance Area</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {cable?.maintenance_area?.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Commissioned On</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {cable.commissioned_on
                  ? new Date(String(cable.commissioned_on)).toLocaleDateString()
                  : "-"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <DataTable
          tableName="ofc_connections"
          data={existingConnections}
          columns={columns}
          loading={isLoading}
          selectable={true}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: totalCount,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            onChange: (page, limit) => setPagination({ page, limit }),
          }}
          customToolbar={true}
        />
      </div>
    </div>
  );
}
