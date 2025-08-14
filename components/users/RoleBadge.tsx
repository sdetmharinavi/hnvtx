// components/users/RoleBadge.tsx
import { UserRole } from "@/types/user-roles";

const RoleBadge = ({ role }: { role: UserRole }) => {
  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return { bg: "bg-red-500/10", text: "text-red-700" }; // Strong authority
      case UserRole.MAANADMIN:
        return { bg: "bg-indigo-500/10", text: "text-indigo-700" }; // Unique, stands out
      case UserRole.SDHADMIN:
        return { bg: "bg-emerald-500/10", text: "text-emerald-700" }; // Growth/ops
      case UserRole.VMUXADMIN:
        return { bg: "bg-slate-500/10", text: "text-slate-700" }; // Infra feel
      case UserRole.MNGADMIN:
        return { bg: "bg-amber-500/10", text: "text-amber-700" }; // Management vibe
      case UserRole.VIEWER:
        return { bg: "bg-gray-500/10", text: "text-gray-700" }; // Neutral/readonly
      case UserRole.AUTHENTICATED:
        return { bg: "bg-sky-500/10", text: "text-sky-700" }; // Logged-in user
      case UserRole.ANON:
        return { bg: "bg-zinc-500/10", text: "text-zinc-700" }; // Unidentified
      default:
        return { bg: "bg-neutral-500/10", text: "text-neutral-700" };
    }
  };

  const { bg, text } = getRoleConfig(role);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}
    >
      {role.replace("_", " ").toUpperCase()}
    </span>
  );
};

export default RoleBadge;
