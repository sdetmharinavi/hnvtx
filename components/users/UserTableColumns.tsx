import { Column } from "@/hooks/database/excel-queries";
import { UserProfileData } from "@/components/users/user-types";
import { formatDate, formatPhoneNumber } from "@/utils/formatters";
import { UserDisplay } from "./UserDisplay";
import RoleBadge from "@/components/users/RoleBadge";
import StatusBadge from "@/components/common/ui/StatusBadge";
import { UserRole } from "@/types/user-roles";

export const getUserTableColumns = (): Column<UserProfileData>[] => [
  {
    title: "Name",
    dataIndex: "full_name",
    key: "full_name",
    render: (_, record) => <UserDisplay user={record} />,
    width: 200,
    filterable: true,
  },
  {
    title: "Contact",
    dataIndex: "phone_number",
    key: "phone_number",
    render: (text: string, record: UserProfileData) => formatPhoneNumber(record.phone_number || "N/A"),
    width: 120,
  },
  {
    title: "Role",
    dataIndex: "role",
    key: "role",
    render: (_, record) => <RoleBadge role={record.role as UserRole} />,
    width: 120,
  },
  {
    title: "DOB",
    dataIndex: "date_of_birth",
    key: "date_of_birth",
    render: (text: string, record: UserProfileData) => 
      record.date_of_birth ? formatDate(record.date_of_birth, { format: "dd/mm/yyyy" }) : "N/A",
    width: 220,
  },
  {
    title: "Last Login",
    dataIndex: "last_sign_in_at",
    key: "last_sign_in_at",
    render: (_, record) => 
      record.last_sign_in_at ? formatDate(record.last_sign_in_at, { format: "dd/mm/yyyy" }) : "Never",
    width: 220,
  },
  {
    title: "Email Verified",
    dataIndex: "is_email_verified",
    key: "is_email_verified",
    render: (text: string, record: UserProfileData) => record.is_email_verified ? "Yes" : "No",
    width: 120,
  },
  {
    title: "Account Created",
    dataIndex: "created_at",
    key: "created_at",
    render: (_, record) => 
      record.created_at ? formatDate(record.created_at, { format: "dd/mm/yyyy" }) : "Never",
    width: 220,
  },
  {
    title: "Account Updated",
    dataIndex: "updated_at",
    key: "updated_at",
    render: (_, record) => 
      record.updated_at ? formatDate(record.updated_at, { format: "dd/mm/yyyy" }) : "Never",
    width: 220,
  },
  {
    title: "Designation",
    dataIndex: "designation",
    key: "designation",
    render: (text: string, record: UserProfileData) => record.designation || "N/A",
    width: 200,
  },
  {
    title: "Account Age",
    dataIndex: "account_age_days",
    key: "account_age_days",
    render: (text: string, record: UserProfileData) => 
      record.account_age_days ? `${record.account_age_days} days` : "N/A",
    width: 100,
  },
  {
    title: "Status",
    dataIndex: "computed_status",
    key: "status",
    render: (_, record) => <StatusBadge status={record.computed_status || ""} />,
    width: 120,
  },
];