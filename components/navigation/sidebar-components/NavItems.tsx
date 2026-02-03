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
  FiBook,
  FiBriefcase,
} from 'react-icons/fi';
import { GoServer } from 'react-icons/go';
import { BsPeople } from 'react-icons/bs';
import { ImUserTie } from 'react-icons/im';
import { GiElectric, GiLinkedRings, GiPathDistance } from 'react-icons/gi';
import { TfiLayoutMediaOverlayAlt } from 'react-icons/tfi';
import { AiFillMerge } from 'react-icons/ai';
import { FaRoute, FaRupeeSign } from 'react-icons/fa';
import { BiSitemap } from 'react-icons/bi';
import { FileText, GitBranch } from 'lucide-react';
import { PERMISSIONS, ROLES } from '@/config/permissions';

function NavItems() {
  const items: NavItemType[] = useMemo(
    () => [
      {
        id: 'home',
        label: 'Home',
        icon: <FiHome className='h-5 w-5' />,
        href: '/dashboard',
        roles: ROLES.VIEWERS, // THE FIX: Changed from ROLES.ADMINS
      },
      {
        id: 'diary',
        label: 'Log Book',
        icon: <FiCalendar className='h-5 w-5' />,
        href: '/dashboard/diary',
        roles: ROLES.VIEWERS, // THE FIX: Changed from ROLES.ADMINS
      },
      {
        id: 'base-menu',
        label: 'Base Structure',
        icon: <BiSitemap className='h-5 w-5' />,
        roles: ROLES.VIEWERS,
        children: [
          {
            id: 'designations',
            label: 'Designations',
            icon: <ImUserTie className='h-5 w-5' />,
            href: '/dashboard/designations',
            roles: ROLES.PROADMINS, // Correctly restricted
          },
          {
            id: 'categories',
            label: 'Categories',
            icon: <FiLayers className='h-5 w-5' />,
            href: '/dashboard/categories',
            roles: ROLES.PROADMINS, // Correctly restricted
          },
          {
            id: 'lookups',
            label: 'Lookups',
            icon: <FiList className='h-5 w-5' />,
            href: '/dashboard/lookup',
            roles: ROLES.PROADMINS, // Correctly restricted
          },
          {
            id: 'maintenance-areas',
            label: 'Maintenance Areas',
            icon: <FiMapPin className='h-5 w-5' />,
            href: '/dashboard/maintenance-areas',
            roles: ROLES.PROADMINS, // Correctly restricted
          },
          {
            id: 'nodes',
            label: 'Nodes',
            icon: <FiCpu className='h-5 w-5' />,
            href: '/dashboard/nodes',
            roles: ROLES.VIEWERS, // THE FIX: Changed from PERMISSIONS.canManageSystems
          },
          {
            id: 'rings',
            label: 'Rings',
            icon: <GiLinkedRings className='h-5 w-5' />,
            href: '/dashboard/rings',
            roles: ROLES.VIEWERS, // THE FIX: Changed from PERMISSIONS.canManageSystems
          },
          {
            id: 'services',
            label: 'Services',
            href: '/dashboard/services',
            icon: <FiDatabase className='h-5 w-5' />,
            roles: ROLES.VIEWERS, // THE FIX: Changed from PERMISSIONS.canManageSystems
          },
          {
            id: 'employees',
            label: 'Employees',
            icon: <BsPeople className='h-5 w-5' />,
            href: '/dashboard/employees',
            roles: ROLES.VIEWERS, // THE FIX: Changed from PERMISSIONS.canManageEmployees
          },
        ],
      },
      {
        id: 'office-management-menu',
        label: 'Office Management',
        icon: <FiBriefcase className='h-5 w-5' />,
        roles: ROLES.VIEWERS,
        children: [
          {
            id: 'expenses',
            label: 'Expenses',
            icon: <FaRupeeSign className='h-5 w-5' />,
            href: '/dashboard/expenses',
            roles: ROLES.VIEWERS,
          },
          {
            id: 'notes',
            label: 'Tech Notes',
            icon: <FiBook className='h-5 w-5' />,
            href: '/dashboard/notes',
            roles: ROLES.VIEWERS,
          },
          {
            id: 'efiles',
            label: 'E-File',
            icon: <FileText className='h-5 w-5' />,
            href: '/dashboard/e-files',
            roles: ROLES.VIEWERS,
          },
          {
            id: 'inventory',
            label: 'Inventory',
            icon: <FiArchive className='h-5 w-5' />,
            href: '/dashboard/inventory',
            roles: ROLES.VIEWERS,
          },
        ],
      },
      {
        id: 'ofc-menu',
        label: 'Ofc & Routes',
        icon: <GiElectric className='h-5 w-5' />,
        roles: ROLES.VIEWERS,
        children: [
          {
            id: 'ofc-menu-list',
            label: 'Optical Fiber Cable',
            href: '/dashboard/ofc',
            icon: <AiFillMerge className='h-5 w-5' />,
            roles: ROLES.VIEWERS, // THE FIX: Changed from PERMISSIONS.canManageRoutes
          },
          {
            id: 'ofc-connections',
            label: 'Fiber Connections',
            href: '/dashboard/ofc/connections',
            icon: <FiActivity className='h-5 w-5' />,
            roles: ROLES.VIEWERS, // THE FIX: Changed from PERMISSIONS.canManageRoutes
          },
          {
            id: 'logical-fiber-paths',
            label: 'Logical Fiber Paths',
            href: '/dashboard/logical-paths',
            icon: <GiPathDistance className='h-5 w-5' />,
            roles: ROLES.VIEWERS, // THE FIX: Changed from PERMISSIONS.canManageRoutes
          },

          {
            id: 'route-manager',
            label: 'RouteManager',
            icon: <FaRoute className='h-5 w-5' />,
            href: '/dashboard/route-manager',
            roles: ROLES.VIEWERS, // THE FIX: Changed from PERMISSIONS.canManageRoutes
          },
        ],
      },
      {
        id: 'systems-menu',
        label: 'Systems & Rings',
        icon: <GoServer className='h-5 w-5' />,
        roles: ROLES.VIEWERS,
        children: [
          {
            id: 'systems',
            label: 'Systems',
            href: '/dashboard/systems',
            icon: <GoServer className='h-5 w-5' />,
            roles: ROLES.VIEWERS, // THE FIX: Changed from PERMISSIONS.canManageSystems
          },
          {
            id: 'global-connections',
            label: 'Global Connections',
            href: '/dashboard/systems/connections',
            icon: <GitBranch className='h-5 w-5' />,
            roles: ROLES.VIEWERS, // THE FIX: Changed from PERMISSIONS.canManageSystems
          },
          {
            id: 'ring-manager',
            label: 'Rings Manager',
            icon: <GoServer className='h-5 w-5' />,
            href: '/dashboard/ring-manager',
            roles: ROLES.VIEWERS, // THE FIX: Changed from PERMISSIONS.canManageSystems
          },
        ],
      },
      {
        id: 'diagrams',
        label: 'Diagrams & Docs',
        icon: <TfiLayoutMediaOverlayAlt className='h-5 w-5' />,
        href: '/dashboard/diagrams',
        roles: ROLES.VIEWERS, // THE FIX: Changed from ROLES.ADMINS
      },
      {
        id: 'kml-manager',
        label: 'KML Manager',
        icon: <FiGlobe className='h-5 w-5' />,
        href: '/dashboard/kml-manager',
        roles: ROLES.VIEWERS,
      },
      {
        id: 'survey-app',
        label: 'Route Survey',
        icon: <FiAirplay className='h-5 w-5' />,
        href: 'https://route-survey.vercel.app/',
        roles: ROLES.VIEWERS, // THE FIX: Changed from ROLES.ADMINS
        external: true,
        preferNative: true,
      },
      {
        id: 'map',
        label: 'BTS Map',
        icon: <FiMap className='h-5 w-5' />,
        href: 'https://www.google.com/maps/d/u/0/embed?mid=1dpO2c3Qt2EmLFxovZ14rcqkjrN6uqlvP&ehbc=2E312F&ll=22.485295672038035%2C88.3701163022461&z=14',
        roles: ROLES.VIEWERS, // THE FIX: Changed from ROLES.ADMINS
        external: true,
      },
      {
        id: 'user-management',
        label: 'User Management',
        icon: <FiUsers className='h-5 w-5' />,
        href: '/dashboard/users',
        roles: PERMISSIONS.canManageUsers, // Correctly restricted
      },
      {
        id: 'audit-logs',
        label: 'Audit Logs',
        icon: <FiShield className='h-5 w-5' />,
        href: '/dashboard/audit-logs',
        roles: PERMISSIONS.canViewAuditLogs, // Correctly restricted
      },
      {
        id: 'help',
        label: 'Help & Documentation',
        icon: <FiHelpCircle className='h-5 w-5' />,
        href: '/doc',
        roles: ROLES.VIEWERS,
      },
    ],
    [],
  );
  return items;
}

export default NavItems;
