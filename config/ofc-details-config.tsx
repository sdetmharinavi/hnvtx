// ==== OFC DETAILS MODAL CONFIGURATION ====
import { 
    DetailsModal, 
    defaultFormatters, 
    type HeaderConfig, 
    type SectionConfig 
  } from '@/components/common/ui/Modal/DetailsModal';
  import { 
    FiActivity,
    FiCalendar, 
    FiClock, 
    FiDatabase, 
    FiMapPin, 
    FiInfo,
    FiGitBranch,
    FiTool
  } from "react-icons/fi";
  import { StatusBadge } from "@/components/common/ui/badges/StatusBadge";
import { Row } from '@/hooks/database';
  
  // OFC details modal configuration
  export const ofcDetailsConfig = {
    header: {
      title: (ofc: Row<"v_ofc_cables_complete">) => ofc.route_name || "Unnamed OFC Route",
      subtitle: (ofc: Row<"v_ofc_cables_complete">) => ofc.ofc_owner_name || "Unknown Owner",
      avatar: {
        urlKey: '', // OFC doesn’t have avatars
        fallbackText: (ofc: Row<"v_ofc_cables_complete">) => (ofc.ofc_owner_name?.charAt(0)?.toUpperCase() || "O")
      },
      badges: [
        {
          key: 'ofc_type_name',
          component: (type: string) => type ? (
            <span className="px-3 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full dark:bg-purple-900 dark:text-purple-200">
              {type}
            </span>
          ) : null
        },
        {
          key: 'status',
          component: (status: boolean) => (
            <StatusBadge status={status ? "ACTIVE" : "INACTIVE"} />
          )
        }
      ]
    } as HeaderConfig,
  
    sections: [
      {
        title: "Route Information",
        icon: <FiGitBranch size={20} />,
        fields: [
          { key: 'route_name', label: 'Route Name', icon: <FiInfo size={18} /> },
          { key: 'asset_no', label: 'Asset No.', icon: <FiDatabase size={18} /> },
          { key: 'sn_id', label: 'SN ID', icon: <FiDatabase size={18} /> },
          { key: 'en_id', label: 'EN ID', icon: <FiDatabase size={18} /> },
          { key: 'transnet_id', label: 'Transnet ID', icon: <FiDatabase size={18} /> }
        ]
      },
      {
        title: "Capacity & Type",
        icon: <FiTool size={20} />,
        fields: [
          { key: 'capacity', label: 'Capacity (Fibers)', icon: <FiActivity size={18} /> },
          { key: 'ofc_type_name', label: 'OFC Type', icon: <FiTool size={18} /> },
          { key: 'ofc_type_code', label: 'OFC Type Code', icon: <FiTool size={18} /> }
        ]
      },
      {
        title: "Ownership & Maintenance",
        icon: <FiMapPin size={20} />,
        fields: [
          { key: 'ofc_owner_name', label: 'Owner', icon: <FiInfo size={18} /> },
          { key: 'ofc_owner_code', label: 'Owner Code', icon: <FiDatabase size={18} /> },
          { key: 'maintenance_area_name', label: 'Maintenance Area', icon: <FiMapPin size={18} /> },
          { key: 'maintenance_area_code', label: 'Area Code', icon: <FiDatabase size={18} /> },
          { key: 'maintenance_terminal_id', label: 'Maintenance Terminal ID', icon: <FiDatabase size={18} /> }
        ]
      },
      {
        title: "Length Information",
        icon: <FiActivity size={20} />,
        fields: [
          { key: 'current_rkm', label: 'Current RKM', icon: <FiActivity size={18} /> },
          { key: 'transnet_rkm', label: 'Transnet RKM', icon: <FiActivity size={18} /> }
        ]
      },
      {
        title: "Commissioning & Timestamps",
        icon: <FiCalendar size={20} />,
        fields: [
          { key: 'commissioned_on', label: 'Commissioned On', icon: <FiCalendar size={18} />, formatter: defaultFormatters.date },
          { key: 'created_at', label: 'Created At', icon: <FiCalendar size={18} />, formatter: defaultFormatters.dateTime },
          { key: 'updated_at', label: 'Updated At', icon: <FiClock size={18} />, formatter: defaultFormatters.dateTime }
        ]
      },
      {
        title: "Counts",
        icon: <FiDatabase size={20} />,
        fields: [
          { key: 'total_count', label: 'Total', icon: <FiDatabase size={18} /> },
          { key: 'active_count', label: 'Active', icon: <FiDatabase size={18} /> },
          { key: 'inactive_count', label: 'Inactive', icon: <FiDatabase size={18} /> }
        ]
      }
    ] as SectionConfig[]
  };
  
  export const OfcDetailsModal = ({ ofc, onClose, isOpen }: { ofc: Row<"v_ofc_connections_complete">[], onClose: () => void, isOpen: boolean }) => {
    return (
      <DetailsModal
        data={ofc}
        onClose={onClose}
        isOpen={isOpen}
        config={ofcDetailsConfig}
      />
    );
  };
  