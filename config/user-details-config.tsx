// ==== USER DETAILS MODAL CONFIGURATION ====
import {
  DetailsModal,
  defaultFormatters,
  type HeaderConfig,
  type SectionConfig,
} from '@/components/common/ui/Modal/DetailsModal';
import {
  FiUser,
  FiPhone,
  FiCalendar,
  FiUserCheck,
  FiBriefcase,
  FiMail,
  FiShield,
  FiClock,
  FiSettings,
  FiMapPin,
} from 'react-icons/fi';
import { RoleBadge } from '@/components/common/ui/badges/RoleBadge';
import { StatusBadge } from '@/components/common/ui/badges/StatusBadge';
import { V_user_profiles_extendedRowSchema } from '@/schemas/zod-schemas';
import { UserRole } from '@/types/user-roles';

// User details modal configuration
export const userDetailsConfig = {
  header: {
    title: (user: V_user_profiles_extendedRowSchema) => {
      const firstName = user.first_name?.trim() || '';
      const lastName = user.last_name?.trim() || '';
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || 'No name provided';
    },
    subtitle: (user: V_user_profiles_extendedRowSchema) => user.email,
    avatar: {
      urlKey: 'avatar_url',
      fallbackText: (user: V_user_profiles_extendedRowSchema) => {
        const firstInitial = user.first_name?.charAt(0)?.toUpperCase() || '';
        const lastInitial = user.last_name?.charAt(0)?.toUpperCase() || '';
        return firstInitial + lastInitial || '?';
      },
    },
    badges: [
      {
        key: 'designation',
        component: (designation: string) =>
          designation ? (
            <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200">
              {designation}
            </span>
          ) : null,
      },
    ],
  } as HeaderConfig<V_user_profiles_extendedRowSchema>,
  sections: [
    {
      title: 'Personal Information',
      icon: <FiUser size={20} />,
      fields: [
        {
          key: 'first_name',
          label: 'First Name',
          icon: <FiUser size={18} />,
        },
        {
          key: 'last_name',
          label: 'Last Name',
          icon: <FiUser size={18} />,
        },
        {
          key: 'email',
          label: 'Email Address',
          icon: <FiMail size={18} />,
          formatter: (email: string, data: V_user_profiles_extendedRowSchema) =>
            defaultFormatters.email(email, data?.is_email_verified ?? undefined),
        },
        {
          key: 'phone_number',
          label: 'Phone Number',
          icon: <FiPhone size={18} />,
        },
        {
          key: 'date_of_birth',
          label: 'Date of Birth',
          icon: <FiCalendar size={18} />,
          formatter: defaultFormatters.date,
        },
        {
          key: 'designation',
          label: 'Designation',
          icon: <FiBriefcase size={18} />,
        },
      ],
    },
    {
      title: 'Account Information',
      icon: <FiUserCheck size={20} />,
      fields: [
        {
          key: 'role',
          label: 'Role',
          icon: <FiShield size={18} />,
          formatter: (role: UserRole) => <RoleBadge role={role} />,
        },
        {
          key: 'status',
          label: 'Status',
          formatter: (status: string) => <StatusBadge status={status || ''} />,
        },
        {
          key: 'created_at',
          label: 'Account Created',
          icon: <FiCalendar size={18} />,
          formatter: defaultFormatters.date,
        },
        {
          key: 'last_sign_in_at',
          label: 'Last Sign In',
          icon: <FiClock size={18} />,
          formatter: defaultFormatters.dateTime,
        },
        {
          key: 'updated_at',
          label: 'Last Updated',
          icon: <FiClock size={18} />,
          formatter: defaultFormatters.dateTime,
        },
      ],
    },
    {
      title: 'Address Information',
      icon: <FiMapPin size={20} />,
      condition: (user: V_user_profiles_extendedRowSchema) =>
        user.address && defaultFormatters.address(user.address),
      renderCustom: (user: V_user_profiles_extendedRowSchema) => (
        <div className="p-6 bg-gray-50 bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 rounded-2xl border border-gray-200 dark:border-gray-700">
          <p className="text-gray-900 dark:text-white font-medium text-lg leading-relaxed">
            {defaultFormatters.address(user.address)}
          </p>
        </div>
      ),
    },
    {
      title: 'User Preferences',
      icon: <FiSettings size={20} />,
      condition: (user: V_user_profiles_extendedRowSchema) =>
        user.preferences && Object.keys(user.preferences).length > 0,
      renderCustom: (user: V_user_profiles_extendedRowSchema) => (
        <div className="p-6 bg-gray-50  bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {defaultFormatters.json(user.preferences)}
        </div>
      ),
    },
  ] as SectionConfig<V_user_profiles_extendedRowSchema>[],
};

export const UserDetailsModal = ({
  user,
  onClose,
  isOpen,
}: {
  user: V_user_profiles_extendedRowSchema;
  onClose: () => void;
  isOpen: boolean;
}) => {
  return <DetailsModal data={user} onClose={onClose} isOpen={isOpen} config={userDetailsConfig} />;
};
