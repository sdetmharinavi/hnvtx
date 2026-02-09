// path: config/cable-details-config.tsx
import {
  DetailsModal,
  defaultFormatters,
  type HeaderConfig,
  type SectionConfig,
} from '@/components/common/ui/Modal/DetailsModal';
import { FiGitBranch, FiMapPin, FiClock, FiInfo, FiHash, FiActivity } from 'react-icons/fi';
import { StatusBadge } from '@/components/common/ui/badges/StatusBadge';
import { ExtendedOfcCable } from '@/schemas/custom-schemas';

export const cableDetailsConfig = {
  header: {
    title: (cable: ExtendedOfcCable) => cable.route_name || 'Unnamed Route',
    subtitle: (cable: ExtendedOfcCable) => cable.ofc_owner_name || 'Unknown Owner',
    badges: [
      {
        key: 'status',
        component: (status: boolean | null) => <StatusBadge status={status ?? false} />,
      },
      {
        key: 'ofc_type_name',
        component: (type: string) =>
          type ? (
            <span className="px-3 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full dark:bg-purple-900 dark:text-purple-200">
              {type}
            </span>
          ) : null,
      },
    ],
  } as HeaderConfig<ExtendedOfcCable>,

  sections: [
    {
      title: 'Route Information',
      icon: <FiGitBranch size={20} />,
      fields: [
        { key: 'route_name', label: 'Route Name', icon: <FiInfo size={18} /> },
        { key: 'asset_no', label: 'Asset Number', icon: <FiHash size={18} /> },
        { key: 'sn_name', label: 'Start Node', icon: <FiMapPin size={18} /> },
        { key: 'en_name', label: 'End Node', icon: <FiMapPin size={18} /> },
      ],
    },
    {
      title: 'Specifications',
      icon: <FiActivity size={20} />,
      fields: [
        { key: 'capacity', label: 'Fiber Capacity', icon: <FiActivity size={18} /> },
        {
          key: 'current_rkm',
          label: 'Route Length (RKM)',
          icon: <FiActivity size={18} />,
          formatter: (val) => `${val} km`,
        },
        { key: 'ofc_type_name', label: 'Cable Type', icon: <FiInfo size={18} /> },
      ],
    },
    {
      title: 'Ownership & Timestamps',
      icon: <FiClock size={20} />,
      fields: [
        { key: 'ofc_owner_name', label: 'Owner', icon: <FiInfo size={18} /> },
        { key: 'maintenance_area_name', label: 'Maintenance Area', icon: <FiMapPin size={18} /> },
        {
          key: 'commissioned_on',
          label: 'Commissioned On',
          icon: <FiClock size={18} />,
          formatter: defaultFormatters.date,
        },
      ],
    },
  ] as SectionConfig<ExtendedOfcCable>[],
};

export const CableDetailsModal = ({
  cable,
  onClose,
  isOpen,
}: {
  cable: ExtendedOfcCable | null;
  onClose: () => void;
  isOpen: boolean;
}) => {
  return (
    <DetailsModal
      data={cable}
      onClose={onClose}
      isOpen={isOpen}
      config={cableDetailsConfig}
      loading={!cable}
    />
  );
};
