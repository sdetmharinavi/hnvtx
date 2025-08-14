// components/DetailItem.tsx
"use client";

import { DetailItemProps } from "@/components/maintenance-areas/maintenance-areas-types";

export function DetailItem({ label, value, icon }: DetailItemProps) {
  if (!value) return null;
  return (
    <div>
        <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>{label}</label>
        <p className='flex items-center gap-2 text-gray-900 dark:text-white mt-1'>
          {icon}
          <span>{value}</span>
        </p>
    </div>
  )
}