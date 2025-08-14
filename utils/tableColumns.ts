import { Column } from "@/hooks/database/excel-queries";
import { Database } from "@/types/supabase-types";

type UserProfileExtended = Database['public']['Views']['v_user_profiles_extended']['Row'];

export const userProfileColumns: Column<UserProfileExtended>[] = [
  { key: 'id', title: 'ID', dataIndex: 'id', excelFormat: 'text' },
  { key: 'email', title: 'Email', dataIndex: 'email', excelFormat: 'text' },
  { key: 'full_name', title: 'Full Name', dataIndex: 'full_name', excelFormat: 'text' },
  { key: 'first_name', title: 'First Name', dataIndex: 'first_name', excelFormat: 'text' },
  { key: 'last_name', title: 'Last Name', dataIndex: 'last_name', excelFormat: 'text' },
  { key: 'role', title: 'Role', dataIndex: 'role', excelFormat: 'text' },
  { key: 'is_active', title: 'Is Active', dataIndex: 'is_active', excelFormat: 'text' },
  { key: 'created_at', title: 'Created At', dataIndex: 'created_at', excelFormat: 'date' },
  { key: 'updated_at', title: 'Updated At', dataIndex: 'updated_at', excelFormat: 'date' },
  { key: 'last_sign_in_at', title: 'Last Sign In', dataIndex: 'last_sign_in_at', excelFormat: 'date' },
  { key: 'avatar_url', title: 'Avatar URL', dataIndex: 'avatar_url', excelFormat: 'text' },
  { key: 'phone_number', title: 'Phone Number', dataIndex: 'phone_number', excelFormat: 'text' },
  { key: 'date_of_birth', title: 'Date of Birth', dataIndex: 'date_of_birth', excelFormat: 'date' },
  { key: 'designation', title: 'Designation', dataIndex: 'designation', excelFormat: 'text' },
  { key: 'address', title: 'Address', dataIndex: 'address', excelFormat: 'text' },
  { key: 'account_age_days', title: 'Account Age (Days)', dataIndex: 'account_age_days', excelFormat: 'number' },
  { key: 'auth_updated_at', title: 'Auth Updated At', dataIndex: 'auth_updated_at', excelFormat: 'date' },
  { key: 'computed_status', title: 'Status', dataIndex: 'computed_status', excelFormat: 'text' },
];

// Add more table column definitions as needed

export const tableColumns = {
  user_profiles: userProfileColumns,
  // Add other tables here
} as const;
