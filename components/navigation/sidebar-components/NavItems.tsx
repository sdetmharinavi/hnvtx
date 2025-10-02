import { UserRole } from '@/types/user-roles';
import { NavItem as NavItemType } from '@/components/navigation/sidebar-components/sidebar-types';
import { useMemo } from 'react';
import {
  FiDatabase,
  FiHome,
  FiMap,
  FiUsers,
  FiServer,
  FiLayers,
  FiCpu,
  FiMapPin,
  FiList,
  FiGitBranch,
} from 'react-icons/fi';
import { FaDiagramNext } from 'react-icons/fa6';
import { BsPeople } from 'react-icons/bs';
import { ImUserTie } from 'react-icons/im';
import { GiElectric, GiLinkedRings} from 'react-icons/gi';
import { AiFillMerge } from 'react-icons/ai';
import {FaRoute } from 'react-icons/fa';

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
          UserRole.VMUXADMIN,
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
        id: 'employees',
        label: 'Employees',
        icon: <BsPeople className="h-5 w-5" />,
        href: '/dashboard/employees',
        roles: [UserRole.ADMIN],
      },
      {
        id: 'base-menu',
        label: 'Base Structure',
        icon: <FiServer className="h-5 w-5" />,
        roles: [
          UserRole.ADMIN,
          UserRole.VIEWER,
          UserRole.AUTHENTICATED,
          UserRole.CPANADMIN,
          UserRole.MAANADMIN,
          UserRole.SDHADMIN,
          UserRole.VMUXADMIN,
        ],
        children: [
          {
            id: 'designations',
            label: 'Designations',
            icon: <ImUserTie className="h-5 w-5" />,
            href: '/dashboard/designations',
            roles: [],
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
          UserRole.VMUXADMIN,
        ],
        children: [
          {
            id: 'ofc-menu',
            label: 'Optical Fiber Cable',
            href: '/dashboard/ofc',
            icon: <AiFillMerge className="h-5 w-5" />, // replaced non-existent TbCableData with a valid icon
            roles: [UserRole.ADMIN],
          },
          {
            id: 'route-manager',
            label: 'RouteManager',
            icon: <FaRoute className="h-5 w-5" />,
            href: '/dashboard/route-manager',
            roles: [UserRole.ADMIN],
          },
          {
            id: 'logical-paths',
            label: 'Logical Paths',
            icon: <FiGitBranch className="h-5 w-5" />,
            href: '/dashboard/logical-paths',
            roles: [UserRole.ADMIN, UserRole.VIEWER], // Accessible to admins and viewers
          },
        ],
      },
      {
        id: 'systems',
        label: 'Systems',
        icon: <FiDatabase className="h-5 w-5" />,
        href: '/dashboard/systems',
        roles: [UserRole.ADMIN],
      },
      {
        id: 'diagrams',
        label: 'Diagrams',
        icon: <FaDiagramNext className="h-5 w-5" />,
        href: '/dashboard/diagrams',
        roles: [UserRole.ADMIN],
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
          UserRole.VMUXADMIN,
        ],
        external: true,
      },
    ],
    []
  );
  return items;
}

export default NavItems;
