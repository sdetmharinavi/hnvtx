import { UserRole } from '@/types/user-roles';
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
} from 'react-icons/fi';
import { GoServer } from 'react-icons/go';
import { BsPeople } from 'react-icons/bs';
import { ImUserTie } from 'react-icons/im';
import { GiElectric, GiLinkedRings } from 'react-icons/gi';
import { TfiLayoutMediaOverlayAlt } from 'react-icons/tfi';
import { AiFillMerge } from 'react-icons/ai';
import { FaRoute } from 'react-icons/fa';
import { BiSitemap } from 'react-icons/bi';

function NavItems() {
  const items: NavItemType[] = useMemo(
    () => [
      {
        id: 'home',
        label: 'Home',
        icon: <FiHome className="h-5 w-5" />,
        href: '/dashboard',
        roles: [
          UserRole.ADMIN,
          UserRole.VIEWER,
          UserRole.AUTHENTICATED,
          UserRole.CPANADMIN,
          UserRole.MAANADMIN,
          UserRole.SDHADMIN,
          UserRole.ASSETADMIN,
        ],
      },
      {
        id: 'diary',
        label: 'Log Book',
        icon: <FiCalendar className="h-5 w-5" />,
        href: '/dashboard/diary',
        roles: [
          UserRole.ADMIN,
          UserRole.VIEWER,
          UserRole.AUTHENTICATED,
          UserRole.CPANADMIN,
          UserRole.MAANADMIN,
          UserRole.SDHADMIN,
          UserRole.ASSETADMIN,
          UserRole.MNGADMIN,
        ],
      },
      {
        id: 'user-management',
        label: 'User Management',
        icon: <FiUsers className="h-5 w-5" />,
        href: '/dashboard/users',
        roles: [],
      },
      {
        id: 'audit-logs',
        label: 'Audit Logs',
        icon: <FiShield className="h-5 w-5" />,
        href: '/dashboard/audit-logs',
        roles: [],
      },
      {
        id: 'employees',
        label: 'Employees',
        icon: <BsPeople className="h-5 w-5" />,
        href: '/dashboard/employees',
        roles: [UserRole.ADMIN],
      },
      {
        id: 'inventory',
        label: 'Inventory',
        icon: <FiArchive className="h-5 w-5" />,
        href: '/dashboard/inventory',
        roles: [UserRole.ADMIN, UserRole.ASSETADMIN],
      },
      {
        id: 'base-menu',
        label: 'Base Structure',
        icon: <BiSitemap className="h-5 w-5" />,
        roles: [
          UserRole.ADMIN,
          UserRole.VIEWER,
          UserRole.AUTHENTICATED,
          UserRole.CPANADMIN,
          UserRole.MAANADMIN,
          UserRole.SDHADMIN,
          UserRole.ASSETADMIN,
        ],
        children: [
          {
            id: 'designations',
            label: 'Designations',
            icon: <ImUserTie className="h-5 w-5" />,
            href: '/dashboard/designations',
            roles: [UserRole.ADMIN],
          },
          {
            id: 'categories',
            label: 'Categories',
            icon: <FiLayers className="h-5 w-5" />,
            href: '/dashboard/categories',
            roles: [UserRole.ADMIN],
          },
          {
            id: 'lookups',
            label: 'Lookups',
            icon: <FiList className="h-5 w-5" />,
            href: '/dashboard/lookup',
            roles: [UserRole.ADMIN],
          },
          {
            id: 'maintenance-areas',
            label: 'Maintenance Areas',
            icon: <FiMapPin className="h-5 w-5" />,
            href: '/dashboard/maintenance-areas',
            roles: [UserRole.ADMIN],
          },
          {
            id: 'nodes',
            label: 'Nodes',
            icon: <FiCpu className="h-5 w-5" />,
            href: '/dashboard/nodes',
            roles: [UserRole.ADMIN],
          },
          {
            id: 'rings',
            label: 'Rings',
            icon: <GiLinkedRings className="h-5 w-5" />,
            href: '/dashboard/rings',
            roles: [UserRole.ADMIN],
          },
        ],
      },
      {
        id: 'ofc-menu',
        label: 'Ofc & Routes',
        icon: <GiElectric className="h-5 w-5" />,
        roles: [
          UserRole.ADMIN,
          UserRole.VIEWER,
          UserRole.AUTHENTICATED,
          UserRole.CPANADMIN,
          UserRole.MAANADMIN,
          UserRole.SDHADMIN,
          UserRole.ASSETADMIN,
        ],
        children: [
          {
            id: 'ofc-menu',
            label: 'Optical Fiber Cable',
            href: '/dashboard/ofc',
            icon: <AiFillMerge className="h-5 w-5" />,
            roles: [UserRole.ADMIN],
          },
          {
            id: 'route-manager',
            label: 'RouteManager',
            icon: <FaRoute className="h-5 w-5" />,
            href: '/dashboard/route-manager',
            roles: [UserRole.ADMIN],
          },
        ],
      },
      {
        id: 'services',
        label: 'Services & Customers',
        href: '/dashboard/services',
        icon: <FiDatabase className="h-5 w-5" />,
        roles: [UserRole.ADMIN],
      },
      {
        id: 'systems',
        label: 'Systems & Rings Manager',
        icon: <GoServer className="h-5 w-5" />,
        roles: [
          UserRole.ADMIN,
          UserRole.VIEWER,
          UserRole.AUTHENTICATED,
          UserRole.CPANADMIN,
          UserRole.MAANADMIN,
          UserRole.SDHADMIN,
          UserRole.ASSETADMIN,
        ],
        children: [
          {
            id: 'systems',
            label: 'Systems',
            href: '/dashboard/systems',
            icon: <GoServer className="h-5 w-5" />,
            roles: [UserRole.ADMIN],
          },
          {
            id: 'ring-manager',
            label: 'Rings Manager',
            icon: <GoServer className="h-5 w-5" />,
            href: '/dashboard/ring-manager',
            roles: [UserRole.ADMIN],
          },
        ],
      },
      {
        id: 'diagrams',
        label: 'Diagrams',
        icon: <TfiLayoutMediaOverlayAlt className="h-5 w-5" />,
        href: '/dashboard/diagrams',
        roles: [UserRole.ADMIN],
      },
      {
        id: 'kml-manager',
        label: 'KML Manager',
        icon: <FiGlobe className="h-5 w-5" />,
        href: '/dashboard/kml-manager',
        roles: [
          UserRole.ADMIN,
          UserRole.VIEWER,
          UserRole.AUTHENTICATED,
          UserRole.CPANADMIN,
          UserRole.MAANADMIN,
          UserRole.SDHADMIN,
          UserRole.ASSETADMIN,
        ],
      },
      {
        id: 'survey-app',
        label: 'Route Survey',
        icon: <FiAirplay className="h-5 w-5" />,
        href: 'https://route-survey.vercel.app/',
        roles: [
          UserRole.ADMIN,
          UserRole.VIEWER,
          UserRole.MAANADMIN,
          UserRole.SDHADMIN,
          UserRole.ASSETADMIN,
        ],
        external: true,
        preferNative: true, // Added flag to signal preference for opening installed PWA
      },
      {
        id: 'map',
        label: 'BTS Map',
        icon: <FiMap className="h-5 w-5" />,
        href: 'https://www.google.com/maps/d/u/0/embed?mid=1dpO2c3Qt2EmLFxovZ14rcqkjrN6uqlvP&ehbc=2E312F&ll=22.485295672038035%2C88.3701163022461&z=14',
        roles: [
          UserRole.ADMIN,
          UserRole.VIEWER,
          UserRole.MAANADMIN,
          UserRole.SDHADMIN,
          UserRole.ASSETADMIN,
        ],
        external: true,
      },
      {
        id: 'help',
        label: 'Help & Documentation',
        icon: <FiHelpCircle className="h-5 w-5" />,
        href: '/doc',
        roles: [
          UserRole.ADMIN,
          UserRole.VIEWER,
          UserRole.AUTHENTICATED,
          UserRole.CPANADMIN,
          UserRole.MAANADMIN,
          UserRole.SDHADMIN,
          UserRole.ASSETADMIN,
          UserRole.MNGADMIN,
        ],
      },
    ],
    []
  );
  return items;
}

export default NavItems;
