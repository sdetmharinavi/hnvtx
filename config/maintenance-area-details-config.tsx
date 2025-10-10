// path: config/maintenance-area-details-config.tsx
import {
  DetailsModal,
  defaultFormatters,
  type HeaderConfig,
  type SectionConfig,
} from "@/components/common/ui/Modal/DetailsModal";
import {
  FiMapPin,
  FiUser,
  FiPhone,
  FiMail,
  FiGlobe,
  FiClock,
  FiCalendar,
  FiGitMerge,
  FiHash,
} from "react-icons/fi";
import { StatusBadge } from "@/components/common/ui/badges/StatusBadge";
import { MaintenanceAreaWithRelations } from "@/config/areas";

// This configuration defines how to display the rich data for a Maintenance Area.
export const maintenanceAreaDetailsConfig = {
  header: {
    title: (area: MaintenanceAreaWithRelations) => area.name,
    subtitle: (area: MaintenanceAreaWithRelations) => area.area_type?.name || "No Type Specified",
    avatar: {
      urlKey: "", // No avatar
      fallbackText: (area: MaintenanceAreaWithRelations) =>
        area.name?.charAt(0)?.toUpperCase() || "?",
    },
    badges: [
      {
        key: "status",
        component: (status: boolean | null) => <StatusBadge status={status ?? false} />,
      },
    ],
  } as HeaderConfig<MaintenanceAreaWithRelations>,

  sections: [
    {
      title: "Primary Information",
      icon: <FiMapPin size={20} />,
      fields: [
        { key: "name", label: "Area Name", icon: <FiMapPin size={18} /> },
        { key: "code", label: "Area Code", icon: <FiHash size={18} /> },
        { key: "area_type.name", label: "Area Type", icon: <FiGitMerge size={18} /> },
        { key: "parent_area.name", label: "Parent Area", icon: <FiGitMerge size={18} /> },
      ],
    },
    {
      title: "Contact Details",
      icon: <FiUser size={20} />,
      condition: (area) => area.contact_person || area.contact_number || area.email,
      fields: [
        { key: "contact_person", label: "Contact Person", icon: <FiUser size={18} /> },
        { key: "contact_number", label: "Contact Number", icon: <FiPhone size={18} /> },
        {
          key: "email",
          label: "Email",
          icon: <FiMail size={18} />,
          formatter: (email) => {
            if (typeof email === "string" && email.trim()) {
              return (
                <a href={`mailto:${email}`} className='text-blue-600 hover:underline'>
                  {email}
                </a>
              );
            }
            return "N/A";
          },
        },
      ],
    },
    {
      title: "Location",
      icon: <FiGlobe size={20} />,
      condition: (area) => area.address || (area.latitude && area.longitude),
      fields: [
        { key: "address", label: "Address", icon: <FiMapPin size={18} /> },
        { key: "latitude", label: "Latitude", icon: <FiGlobe size={18} /> },
        { key: "longitude", label: "Longitude", icon: <FiGlobe size={18} /> },
      ],
    },
    {
      title: "Timestamps",
      icon: <FiClock size={20} />,
      fields: [
        {
          key: "created_at",
          label: "Record Created",
          icon: <FiCalendar size={18} />,
          formatter: defaultFormatters.dateTime,
        },
        {
          key: "updated_at",
          label: "Last Updated",
          icon: <FiClock size={18} />,
          formatter: defaultFormatters.dateTime,
        },
      ],
    },
  ] as SectionConfig<MaintenanceAreaWithRelations>[],
};

// This is the actual component that will be imported by the page.
export const MaintenanceAreaDetailsModal = ({
  area,
  onClose,
  isOpen,
}: {
  area: MaintenanceAreaWithRelations | null;
  onClose: () => void;
  isOpen: boolean;
}) => {
  return (
    <DetailsModal
      data={area}
      onClose={onClose}
      isOpen={isOpen}
      config={maintenanceAreaDetailsConfig}
      loading={!area}
    />
  );
};