"use client";

// app/dashboard/ofc/[id]/page.tsx
import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { usePagedOfcCablesComplete, useRpcQuery, useTableQuery, useTableRecord } from "@/hooks/database";
import { useOfcConnection } from "@/hooks/useOfcConnection";
import { OfcCablesWithRelations } from "@/components/ofc/ofc-types";
import { Database } from "@/types/supabase-types";

export const dynamic = "force-dynamic";


export default function OfcCableDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  // const [cable, setCable] = useState<OfcCablesWithRelations | null>(null);
  const supabase = createClient();

  const {
    cable,
    existingConnections,
    isLoading,
    ensureConnectionsExist,
  } = useOfcConnection({ supabase, cableId: id as string })as {
    cable: OfcCablesWithRelations | undefined;
    existingConnections: Database['public']['Tables']['ofc_connections']['Row'][];
    isLoading: boolean;
    ensureConnectionsExist: () => Promise<void>;
    // ... other properties
  };

// Automatically ensure connections exist when component mounts
useEffect(() => {
  if (!isLoading) {
    ensureConnectionsExist();
  }
}, [isLoading, ensureConnectionsExist]);



const { data: cables, isLoading: isLoadingCables } = useTableQuery(supabase, "v_ofc_connections_complete",{
  filters:{
    id: id as string
  }
} );

console.log("existingConnections", existingConnections);
console.log("isLoading", isLoading);
console.log("cable", cable);
console.log("cables", cables);



  const loading = isLoading || isLoadingCables;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!cable || !cables) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                OFC cable with ID {id} not found.
              </p>
              <button
                onClick={() => router.push('/dashboard/ofc')}
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
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Active</span>
  ) : (
    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">Inactive</span>
  );

  return (
    <div className="mx-auto space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">OFC Cable Details</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">ID: {id}</p>
        </div>
        <Link href="/dashboard/ofc" className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
          Back to List
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold mb-3">Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Asset No.</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{String(cable.asset_no ?? "-")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Route Name</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{String(cable.route_name ?? "-")}</span>
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
              <span className="font-medium text-gray-900 dark:text-gray-100">{cable?.ofc_type?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Maintenance Area</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{cable?.maintenance_area?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Commissioned On</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{cable.commissioned_on ? new Date(String(cable.commissioned_on)).toLocaleDateString() : "-"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-semibold mb-3">Raw Data</h2>
        <pre className="text-xs overflow-x-auto bg-gray-50 dark:bg-gray-900/30 p-3 rounded">{JSON.stringify(existingConnections, null, 2)}</pre>
      </div>
    </div>
  );
}