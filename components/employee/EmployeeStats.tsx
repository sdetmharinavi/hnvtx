// app/dashboard/employees/components/EmployeeStats.tsx
interface EmployeeStatsProps {
    total: number;
    active: number;
    inactive: number;
  }
  
  export const EmployeeStats = ({ total, active, inactive }: EmployeeStatsProps) => {
    return (
      <div className="mt-6 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          Showing {total} employee{total !== 1 ? "s" : ""}
        </span>
        <span>
          {active} active, {inactive} inactive
        </span>
      </div>
    );
  };