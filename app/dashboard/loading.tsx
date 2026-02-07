// app/dashboard/loading.tsx
import { PageSkeleton } from '@/components/common/ui/table/TableSkeleton';

// This is a Server Component that acts as an instant fallback during navigation
export default function DashboardLoading() {
  return (
    <div className='p-6'>
      {/* 
        This is critical for perceived performance. 
        It matches the padding of the dashboard layouts.
      */}
      <PageSkeleton
        showHeader={true}
        showStats={true}
        showFilters={true}
        showTable={true}
        className='p-0' // Remove internal padding to match container
      />
    </div>
  );
}
