// app/dashboard/ofc/[id]/page.tsx
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

async function getOfcCable(id: string) {
  const supabase = await createClient();

  // Prefer the complete view for richer info if available
  const { data, error } = await supabase
    .from("v_ofc_cables_complete")
    .select("*")
    .eq("id", id)
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    // Any error other than no rows
    throw new Error(error.message);
  }

  // If view has no row, try base table as fallback
  if (!data) {
    const { data: base, error: baseErr } = await supabase
      .from("ofc_cables")
      .select("*")
      .eq("id", id)
      .limit(1)
      .single();

    if (baseErr && baseErr.code !== "PGRST116") throw new Error(baseErr.message);
    return base || null;
  }

  return data;
}

export default async function OfcCableDetailsPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const cable = await getOfcCable(id);

  if (!cable) {
    notFound();
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
              <span className="font-medium text-gray-900 dark:text-gray-100">{String((cable as any).route_name ?? "-")}</span>
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
              <span className="font-medium text-gray-900 dark:text-gray-100">{String((cable as any).ofc_type_name ?? (cable as any).ofc_type_id ?? "-")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Maintenance Area</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{String((cable as any).maintenance_area_name ?? (cable as any).maintenance_terminal_id ?? "-")}</span>
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
        <pre className="text-xs overflow-x-auto bg-gray-50 dark:bg-gray-900/30 p-3 rounded">{JSON.stringify(cable, null, 2)}</pre>
      </div>
    </div>
  );
}
