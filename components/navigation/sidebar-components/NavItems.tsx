// components/navigation/sidebar-components/NavItems.tsx
import { NavItem as NavItemType } from '@/components/navigation/sidebar-components/sidebar-types';
import { useMemo } from 'react';
import {
  FiHome,
  FiMap,
  FiUsers,
  FiLayers,
  FiCpu,
  FiMapPin,
  FiList,
  FiHelpCircle,
  FiCalendar,
  FiArchive,
  FiGlobe,
  FiShield,
  FiAirplay,
  FiDatabase,
  FiActivity,
} from 'react-icons/fi';
import { GoServer } from 'react-icons/go';
import { BsPeople } from 'react-icons/bs';
import { ImUserTie } from 'react-icons/im';
import { GiElectric, GiLinkedRings } from 'react-icons/gi';
import { TfiLayoutMediaOverlayAlt } from 'react-icons/tfi';
import { AiFillMerge } from 'react-icons/ai';
import { FaRoute } from 'react-icons/fa';
import { BiSitemap } from 'react-icons/bi';
import { FileText, GitBranch } from 'lucide-react';
import { PERMISSIONS, ROLES } from '@/config/permissions';

function NavItems() {
  const items: NavItemType[] = useMemo(
    () => [
      {
        id: 'home',
        label: 'Home',
        icon: <FiHome className="h-5 w-5" />,
        href: '/dashboard',
        roles: ROLES.VIEWERS,
      },
      {
        id: 'diary',
        label: 'Log Book',
        icon: <FiCalendar className="h-5 w-5" />,
        href: '/dashboard/diary',
        roles: ROLES.VIEWERS,
      },
      {
        id: 'user-management',
        label: 'User Management',
        icon: <FiUsers className="h-5 w-5" />,
        href: '/dashboard/users',
        roles: PERMISSIONS.canManageUsers,
      },
      {
        id: 'audit-logs',
        label: 'Audit Logs',
        icon: <FiShield className="h-5 w-5" />,
        href: '/dashboard/audit-logs',
        roles: PERMISSIONS.canViewAuditLogs,
      },
      {
        id: 'employees',
        label: 'Employees',
        icon: <BsPeople className="h-5 w-5" />,
        href: '/dashboard/employees',
        roles: PERMISSIONS.canManageEmployees,
      },
      {
        id: 'inventory',
        label: 'Inventory',
        icon: <FiArchive className="h-5 w-5" />,
        href: '/dashboard/inventory',
        roles: PERMISSIONS.canManageInventory,
      },
      {
        id: 'efiles',
        label: 'E-File Tracking',
        icon: <FileText className="h-5 w-5" />,
        href: '/dashboard/e-files',
        roles: ROLES.VIEWERS,
      },
      {
        id: 'base-menu',
        label: 'Base Structure',
        icon: <BiSitemap className="h-5 w-5" />,
        roles: ROLES.VIEWERS,
        children: [
          {
            id: 'designations',
            label: 'Designations',
            icon: <ImUserTie className="h-5 w-5" />,
            href: '/dashboard/designations',
            roles: ROLES.SUPER_ADMIN,
          },
          {
            id: 'categories',
            label: 'Categories',
            icon: <FiLayers className="h-5 w-5" />,
            href: '/dashboard/categories',
            roles: ROLES.SUPER_ADMIN,
          },
          {
            id: 'lookups',
            label: 'Lookups',
            icon: <FiList className="h-5 w-5" />,
            href: '/dashboard/lookup',
            roles: ROLES.SUPER_ADMIN,
          },
          {
            id: 'maintenance-areas',
            label: 'Maintenance Areas',
            icon: <FiMapPin className="h-5 w-5" />,
            href: '/dashboard/maintenance-areas',
            roles: ROLES.SUPER_ADMIN,
          },
          {
            id: 'nodes',
            label: 'Nodes',
            icon: <FiCpu className="h-5 w-5" />,
            href: '/dashboard/nodes',
            roles: PERMISSIONS.canManageSystems,
          },
          {
            id: 'rings',
            label: 'Rings',
            icon: <GiLinkedRings className="h-5 w-5" />,
            href: '/dashboard/rings',
            roles: PERMISSIONS.canManageSystems,
          },
          {
            id: 'services',
            label: 'Services',
            href: '/dashboard/services',
            icon: <FiDatabase className="h-5 w-5" />,
            roles: PERMISSIONS.canManageSystems,
          },
        ],
      },
      {
        id: 'ofc-menu',
        label: 'Ofc & Routes',
        icon: <GiElectric className="h-5 w-5" />,
        roles: ROLES.VIEWERS,
        children: [
          {
            id: 'ofc-menu-list',
            label: 'Optical Fiber Cable',
            href: '/dashboard/ofc',
            icon: <AiFillMerge className="h-5 w-5" />,
            roles: PERMISSIONS.canManageRoutes,
          },
          {
            id: 'ofc-connections',
            label: 'Fiber Inventory', // NEW PAGE
            href: '/dashboard/ofc/connections',
            icon: <FiActivity className="h-5 w-5" />,
            roles: PERMISSIONS.canManageRoutes,
          },
          {
            id: 'route-manager',
            label: 'RouteManager',
            icon: <FaRoute className="h-5 w-5" />,
            href: '/dashboard/route-manager',
            roles: PERMISSIONS.canManageRoutes,
          },
        ],
      },
      {
        id: 'systems-menu',
        label: 'Systems & Rings Manager',
        icon: <GoServer className="h-5 w-5" />,
        roles: ROLES.VIEWERS,
        children: [
          {
            id: 'systems',
            label: 'Systems',
            href: '/dashboard/systems',
            icon: <GoServer className="h-5 w-5" />,
            roles: PERMISSIONS.canManageSystems,
          },
          {
            id: 'global-connections',
            label: 'Global Connections',
            href: '/dashboard/systems/connections',
            icon: <GitBranch className="h-5 w-5" />,
            roles: PERMISSIONS.canManageSystems,
          },
          {
            id: 'ring-manager',
            label: 'Rings Manager',
            icon: <GoServer className="h-5 w-5" />,
            href: '/dashboard/ring-manager',
            roles: PERMISSIONS.canManageSystems,
          },
        ],
      },
      {
        id: 'diagrams',
        label: 'Diagrams',
        icon: <TfiLayoutMediaOverlayAlt className="h-5 w-5" />,
        href: '/dashboard/diagrams',
        roles: ROLES.ADMINS,
      },
      {
        id: 'kml-manager',
        label: 'KML Manager',
        icon: <FiGlobe className="h-5 w-5" />,
        href: '/dashboard/kml-manager',
        roles: ROLES.VIEWERS,
      },
      {
        id: 'survey-app',
        label: 'Route Survey',
        icon: <FiAirplay className="h-5 w-5" />,
        href: 'https://route-survey.vercel.app/',
        roles: ROLES.ADMINS,
        external: true,
        preferNative: true,
      },
      {
        id: 'map',
        label: 'BTS Map',
        icon: <FiMap className="h-5 w-5" />,
        href: 'https://www.google.com/maps/d/u/0/embed?mid=1dpO2c3Qt2EmLFxovZ14rcqkjrN6uqlvP&ehbc=2E312F&ll=22.485295672038035%2C88.3701163022461&z=14',
        roles: ROLES.ADMINS,
        external: true,
      },
      {
        id: 'help',
        label: 'Help & Documentation',
        icon: <FiHelpCircle className="h-5 w-5" />,
        href: '/doc',
        roles: ROLES.VIEWERS,
      },
    ],
    []
  );
  return items;
}

export default NavItems;