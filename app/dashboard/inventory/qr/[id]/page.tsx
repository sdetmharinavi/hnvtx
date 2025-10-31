// app/inventory/qr/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useTableRecord } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { V_inventory_itemsRowSchema } from "@/schemas/zod-schemas";
import { PageSpinner, ErrorDisplay } from "@/components/common/ui";
import { QRCodeCanvas } from "qrcode.react";
import { FiTag, FiBox, FiInfo, FiMapPin, FiCalendar, FiDollarSign, FiLayers } from "react-icons/fi";

// A simple component to render details with an icon
const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number | null | undefined }) => {
  if (!value) return null;
  return (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
      <div className="flex-shrink-0 text-gray-500 mt-1">{icon}</div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-base text-gray-800 font-medium">{value}</p>
      </div>
    </div>
  );
};

export default function QrCodePage() {
  const params = useParams();
  const itemId = params.id as string;
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  const { data: item, isLoading, isError, error } = useTableRecord<"v_inventory_items", V_inventory_itemsRowSchema>(
    createClient(),
    "v_inventory_items",
    itemId
  );

  if (isLoading) return <PageSpinner text="Loading Asset Details..." />;
  if (isError) return <ErrorDisplay error={error.message} />;
  if (!item) return <ErrorDisplay error="Asset not found." />;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border-t-8 border-blue-600">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Asset Details
        </h1>
        
        <div className="flex flex-col items-center space-y-8">
          {/* QR Code */}
          <div className="p-4 border-4 border-gray-200 rounded-lg">
            <QRCodeCanvas value={pageUrl} size={200} bgColor={"#ffffff"} fgColor={"#000000"} level={"H"} />
          </div>
          
          {/* Details List */}
          <div className="w-full space-y-3">
            <DetailItem icon={<FiTag size={18} />} label="Asset No" value={item.asset_no} />
            <DetailItem icon={<FiBox size={18} />} label="Name" value={item.name} />
            <DetailItem icon={<FiInfo size={18} />} label="Description" value={item.description} />
            <DetailItem icon={<FiLayers size={18} />} label="Category" value={item.category_name} />
            <DetailItem icon={<FiInfo size={18} />} label="Store Location" value={item.store_location} />
            <DetailItem icon={<FiMapPin size={18} />} label="Functional Location" value={item.functional_location} />
            <DetailItem icon={<FiCalendar size={18} />} label="Purchase Date" value={item.purchase_date} />
            <DetailItem icon={<FiDollarSign size={18} />} label="Cost" value={item.cost ? `$${item.cost}` : null} />
            <DetailItem icon={<FiInfo size={18} />} label="Status" value={item.status_name} />
          </div>
        </div>

        <div className="mt-8 text-center">
            <button 
                onClick={() => window.print()}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
                Print QR Code
            </button>
        </div>
      </div>
    </div>
  );
}