import React from "react";

const StatusBadge = ({ status }: { status: boolean | null }) => {
  return status ? (
    <span className='inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200'>Active</span>
  ) : (
    <span className='inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200'>Inactive</span>
  );
};

export default StatusBadge;
