// path: config/system-details-config.tsx
import {
    DetailsModal,
    defaultFormatters,
    type HeaderConfig,
    type SectionConfig
  } from '@/components/common/ui/Modal/DetailsModal';
  import { FiCpu, FiMapPin, FiClock, FiServer, FiGitBranch, FiInfo } from "react-icons/fi";
  import { StatusBadge } from "@/components/common/ui/badges/StatusBadge";
  import { BsnlSystem } from '@/components/bsnl/types';
  
  export const systemDetailsConfig = {
    header: {
      title: (system: BsnlSystem) => system.system_name || "Unnamed System",
      subtitle: (system: BsnlSystem) => system.system_type_name || "Unknown Type",
      badges: [
        {
          key: 'status',
          component: (status: boolean | null) => <StatusBadge status={status ?? false} />,
        },
      ]
    } as HeaderConfig<BsnlSystem>,
  
    sections: [
      {
        title: "Primary Information",
        icon: <FiServer size={20} />,
        fields: [
          { key: 'system_name', label: 'System Name', icon: <FiInfo size={18} /> },
          { key: 'system_type_name', label: 'System Type', icon: <FiCpu size={18} /> },
          { key: 's_no', label: 'Serial Number', icon: <FiInfo size={18} /> },
          { key: 'ip_address', label: 'IP Address', icon: <FiInfo size={18} />, formatter: (value) => <code className="text-sm">{String(value)}</code> },
        ]
      },
      {
        title: "Location & Maintenance",
        icon: <FiMapPin size={20} />,
        fields: [
          { key: 'node_name', label: 'Node Location', icon: <FiMapPin size={18} /> },
          { key: 'system_maintenance_terminal_name', label: 'Maintenance Area', icon: <FiMapPin size={18} /> },
          { key: 'ring_logical_area_name', label: 'Ring Logical Area', icon: <FiGitBranch size={18} /> },
        ]
      },
      {
        title: "Timestamps",
        icon: <FiClock size={20} />,
        fields: [
          { key: 'commissioned_on', label: 'Commissioned On', icon: <FiClock size={18} />, formatter: defaultFormatters.date },
          { key: 'created_at', label: 'Record Created', icon: <FiClock size={18} />, formatter: defaultFormatters.dateTime },
        ]
      }
    ] as SectionConfig<BsnlSystem>[],
  };
  
  export const SystemDetailsModal = ({ system, onClose, isOpen }: { system: BsnlSystem | null; onClose: () => void; isOpen: boolean; }) => {
    return (
      <DetailsModal
        data={system}
        onClose={onClose}
        isOpen={isOpen}
        config={systemDetailsConfig}
        loading={!system}
      />
    );
  };