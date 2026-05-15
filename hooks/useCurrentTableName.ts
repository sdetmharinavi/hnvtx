import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { TableNames } from '@/config/helper-types';

export const useCurrentTableName = (tableName?: TableNames): TableNames | null => {
  const pathname = usePathname();

  return useMemo(() => {
    if (tableName) return tableName;

    const path = pathname || '';
    const segments = path.split('/').filter(Boolean);

    const dashboardIndex = segments.findIndex((segment) => segment === 'dashboard');
    if (dashboardIndex === -1 || dashboardIndex >= segments.length - 1) {
      return null;
    }

    const routeSegment = segments[dashboardIndex + 1];
    const subSegment = segments[dashboardIndex + 2];

    switch (routeSegment) {
      case 'users':
        return 'user_profiles';
      case 'employees':
        return 'employees';
      case 'categories':
        return 'lookup_types';
      case 'designations':
        return 'employee_designations';
      case 'rings':
        return 'rings';
      case 'maintenance-areas':
        return 'maintenance_areas';
      case 'lookup':
        return 'lookup_types';
      case 'ofc':
        if (!subSegment) return 'ofc_cables';
        if (subSegment === 'connections') return 'ofc_connections';
        return 'ofc_connections';
      case 'nodes':
        return 'nodes';
      case 'systems':
        if (subSegment === 'connections') return 'system_connections';
        return 'systems';
      case 'fiber-joints':
        return 'fiber_splices';
      case 'logical-fiber-paths':
        return 'logical_fiber_paths';
      case 'management-ports':
        return 'management_ports';
      case 'kml-manager':
        return 'files';
      case 'services':
        return 'services';
      case 'notes':
        return 'technical_notes';
      default:
        return null;
    }
  }, [tableName, pathname]);
};
