import Image from 'next/image';
import {StatusBadge} from '@/components/common/ui/badges/StatusBadge';
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";
import { formatDate } from "@/utils/formatters";
import { RoleBadge } from '@/components/common/ui';
import { UserRole } from '@/types/user-roles';
import { renderKeyValueCell } from '@/utils/renderKeyValueCell';

export const UserProfileColumns = () => {
  return useDynamicColumnConfig("v_user_profiles_extended", {
    omit: ["id", "created_at", "updated_at", "auth_updated_at", "email_confirmed_at", "raw_user_meta_data", "raw_app_meta_data", "phone_confirmed_at", "first_name", "last_name", "is_phone_verified", "computed_status"],
    overrides: {
      last_sign_in_at: {
        render: (value) => {
          return formatDate(value as string, { format: "dd-mm-yyyy" });
        },
      },
      status: {
        render: (value) => {
          return <StatusBadge status={value as string} />;
        },
      },
      date_of_birth: {
        render: (value) => {
          return formatDate(value as string, { format: "dd-mm-yyyy" });
        },
      },
      avatar_url: {
        render: (value) => {
          return value ? (
            <Image src={value as string} alt='Avatar' className='w-10 h-10 rounded-full' width={40} height={40} />
          ) : (
            <Image src='/default-avatar.png' alt='Avatar' className='w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700' width={40} height={40} />
          );
        },
      },
      role: {
        render: (value) => {
          return <RoleBadge role={value as UserRole} />;
        },
      },
      address: {
        render: (value) => renderKeyValueCell(value),
      },
      preferences: {
        render: (value) => renderKeyValueCell(value),
      },
    },
  });
};