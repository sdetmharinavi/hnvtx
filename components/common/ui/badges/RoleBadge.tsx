// components/users/RoleBadge.tsx
import { UserRole } from "@/types/user-roles";

export const RoleBadge = ({ role }: { role: UserRole }) => {
  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return { 
          bg: "bg-gradient-to-r from-red-500/20 to-pink-500/20 dark:from-red-500/30 dark:to-pink-500/30", 
          text: "text-red-700 dark:text-red-300",
          border: "border-red-200/60 dark:border-red-500/40",
          shadow: "shadow-red-500/20 dark:shadow-red-500/30",
          icon: "👑"
        };
      case UserRole.MAANADMIN:
        return { 
          bg: "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 dark:from-indigo-500/30 dark:to-purple-500/30", 
          text: "text-indigo-700 dark:text-indigo-300",
          border: "border-indigo-200/60 dark:border-indigo-500/40",
          shadow: "shadow-indigo-500/20 dark:shadow-indigo-500/30",
          icon: "⭐"
        };
      case UserRole.SDHADMIN:
        return { 
          bg: "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 dark:from-emerald-500/30 dark:to-teal-500/30", 
          text: "text-emerald-700 dark:text-emerald-300",
          border: "border-emerald-200/60 dark:border-emerald-500/40",
          shadow: "shadow-emerald-500/20 dark:shadow-emerald-500/30",
          icon: "🚀"
        };
      case UserRole.VMUXADMIN:
        return { 
          bg: "bg-gradient-to-r from-slate-500/20 to-gray-500/20 dark:from-slate-500/30 dark:to-gray-500/30", 
          text: "text-slate-700 dark:text-slate-300",
          border: "border-slate-200/60 dark:border-slate-500/40",
          shadow: "shadow-slate-500/20 dark:shadow-slate-500/30",
          icon: "⚙️"
        };
      case UserRole.MNGADMIN:
        return { 
          bg: "bg-gradient-to-r from-amber-500/20 to-orange-500/20 dark:from-amber-500/30 dark:to-orange-500/30", 
          text: "text-amber-700 dark:text-amber-300",
          border: "border-amber-200/60 dark:border-amber-500/40",
          shadow: "shadow-amber-500/20 dark:shadow-amber-500/30",
          icon: "📊"
        };
      case UserRole.VIEWER:
        return { 
          bg: "bg-gradient-to-r from-gray-400/15 to-slate-400/15 dark:from-gray-500/25 dark:to-slate-500/25", 
          text: "text-gray-600 dark:text-gray-400",
          border: "border-gray-200/50 dark:border-gray-600/40",
          shadow: "shadow-gray-500/10 dark:shadow-gray-500/20",
          icon: "👁️"
        };
      case UserRole.AUTHENTICATED:
        return { 
          bg: "bg-gradient-to-r from-sky-500/20 to-blue-500/20 dark:from-sky-500/30 dark:to-blue-500/30", 
          text: "text-sky-700 dark:text-sky-300",
          border: "border-sky-200/60 dark:border-sky-500/40",
          shadow: "shadow-sky-500/20 dark:shadow-sky-500/30",
          icon: "✅"
        };
      case UserRole.ANON:
        return { 
          bg: "bg-gradient-to-r from-zinc-400/15 to-stone-400/15 dark:from-zinc-500/25 dark:to-stone-500/25", 
          text: "text-zinc-600 dark:text-zinc-400",
          border: "border-zinc-200/50 dark:border-zinc-600/40",
          shadow: "shadow-zinc-500/10 dark:shadow-zinc-500/20",
          icon: "❓"
        };
      default:
        return { 
          bg: "bg-gradient-to-r from-neutral-400/15 to-gray-400/15 dark:from-neutral-500/25 dark:to-gray-500/25", 
          text: "text-neutral-600 dark:text-neutral-400",
          border: "border-neutral-200/50 dark:border-neutral-600/40",
          shadow: "shadow-neutral-500/10 dark:shadow-neutral-500/20",
          icon: "🔸"
        };
    }
  };

  const { bg, text, border, shadow, icon } = getRoleConfig(role);
  const displayText = role.replace("_", " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 
        rounded-full text-xs font-semibold tracking-wide
        border backdrop-blur-sm
        transition-all duration-300 ease-out
        hover:scale-105 hover:shadow-lg hover:-translate-y-0.5
        cursor-default select-none
        ${bg} ${text} ${border} ${shadow}
        dark:shadow-lg
      `}
    >
      <span className="text-[10px] leading-none" role="img" aria-hidden="true">
        {icon}
      </span>
      <span className="font-medium">
        {displayText}
      </span>
    </span>
  );
};
