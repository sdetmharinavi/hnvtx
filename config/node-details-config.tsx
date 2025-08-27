// ==== NODE DETAILS MODAL CONFIGURATION ====
import { 
  DetailsModal, 
  defaultFormatters, 
  type HeaderConfig, 
  type SectionConfig 
} from '@/components/common/ui/Modal/DtailsModal';
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

// Node details modal configuration
export const nodeDetailsConfig = {
  header: {
    title: (node: any) => node.name || "Unnamed Node",
    subtitle: (node: any) => node.ip_address || "No IP Assigned",
    avatar: {
      urlKey: '', // nodes probably don’t have avatars
      fallbackText: (node: any) => (node.name?.charAt(0)?.toUpperCase() || "?")
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
  } as HeaderConfig,

  sections: [
    {
      title: "Basic Information",
      icon: <FiCpu size={20} />,
      fields: [
        { key: 'name', label: 'Node Name', icon: <FiServer size={18} /> },
        { key: 'node_type_name', label: 'Node Type', icon: <FiCode size={18} /> },
        { key: 'ip_address', label: 'IP Address', icon: <FiServer size={18} /> },
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
      title: "Ring Information",
      icon: <FiDatabase size={20} />,
      condition: (node: any) => !!node.ring_id,
      fields: [
        { key: 'ring_name', label: 'Ring Name', icon: <FiDatabase size={18} /> },
        { key: 'ring_status', label: 'Ring Status', formatter: (status: string) => <StatusBadge status={status || ""} /> },
        { key: 'ring_type_name', label: 'Ring Type', icon: <FiCode size={18} /> },
        { key: 'order_in_ring', label: 'Order in Ring', icon: <FiInfo size={18} /> }
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
  ] as SectionConfig[]
};

export const NodeDetailsModal = ({ node, onClose, isOpen }: { node: any, onClose: () => void, isOpen: boolean }) => {
  return (
    <DetailsModal
      data={node}
      onClose={onClose}
      isOpen={isOpen}
      config={nodeDetailsConfig}
    />
  );
};
