// ==== NODE DETAILS MODAL CONFIGURATION ====
import { 
  DetailsModal, 
  defaultFormatters, 
  type HeaderConfig, 
  type SectionConfig 
} from '@/components/common/ui/Modal/DetailsModal';
import { 
  FiCpu,
  FiCalendar, 
  FiClock, 
  FiMapPin, 
  FiDatabase, 
  FiServer,
  FiCode,
  FiInfo
} from "react-icons/fi";
import { StatusBadge } from "@/components/common/ui/badges/StatusBadge";
import { V_nodes_completeRowSchema } from '@/schemas/zod-schemas';

// Node details modal configuration
export const nodeDetailsConfig = {
  header: {
    title: (node: V_nodes_completeRowSchema) => node.name || "Unnamed Node",
    avatar: {
      urlKey: '', // nodes probably don’t have avatars
      fallbackText: (node: V_nodes_completeRowSchema) => (node.name?.charAt(0)?.toUpperCase() || "?")
    },
    badges: [
      {
        key: 'node_type_name',
        component: (type: string) => type ? (
          <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full dark:bg-green-900 dark:text-green-200">
            {type}
          </span>
        ) : null
      },
      {
        key: 'ring_status',
        component: (status: string) => status ? (
          <StatusBadge status={status} />
        ) : null
      }
    ]
  } as HeaderConfig<V_nodes_completeRowSchema>,

  sections: [
    {
      title: "Basic Information",
      icon: <FiCpu size={20} />,
      fields: [
        { key: 'name', label: 'Node Name', icon: <FiServer size={18} /> },
        { key: 'node_type_name', label: 'Node Type', icon: <FiCode size={18} /> },
        { key: 'remark', label: 'Remark', icon: <FiInfo size={18} /> },
      ]
    },
    {
      title: "Maintenance Area",
      icon: <FiMapPin size={20} />,
      fields: [
        { key: 'maintenance_area_code', label: 'Area Code', icon: <FiDatabase size={18} /> },
        { key: 'maintenance_area_name', label: 'Area Name', icon: <FiMapPin size={18} /> },
        { key: 'maintenance_area_type_name', label: 'Area Type', icon: <FiMapPin size={18} /> },
      ]
    },
    {
      title: "Geolocation",
      icon: <FiMapPin size={20} />,
      fields: [
        { key: 'latitude', label: 'Latitude', icon: <FiMapPin size={18} /> },
        { key: 'longitude', label: 'Longitude', icon: <FiMapPin size={18} /> },
      ]
    },
    {
      title: "Timestamps",
      icon: <FiCalendar size={20} />,
      fields: [
        { key: 'created_at', label: 'Created At', icon: <FiCalendar size={18} />, formatter: defaultFormatters.dateTime },
        { key: 'updated_at', label: 'Updated At', icon: <FiClock size={18} />, formatter: defaultFormatters.dateTime }
      ]
    }
  ] as SectionConfig<V_nodes_completeRowSchema>[]
};

export const NodeDetailsModal = ({ node, onClose, isOpen }: { node: V_nodes_completeRowSchema, onClose: () => void, isOpen: boolean }) => {
  return (
    <DetailsModal
      data={node}
      onClose={onClose}
      isOpen={isOpen}
      config={nodeDetailsConfig}
    />
  );
};
