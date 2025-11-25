// components/users/StatusBadge.tsx

export const StatusBadge = ({ status }: { status: string | boolean | null }) => {
  const getStatusConfig = (status: string | boolean | null) => {
    // Handle null/undefined cases first
    if (status === null || status === undefined) {
      return { 
        bg: "bg-gray-50 dark:bg-gray-900/50 bg-gradient-to-r from-gray-400/15 to-slate-400/15 dark:from-gray-500/25 dark:to-slate-500/25",
        text: "text-gray-600 dark:text-gray-400",
        border: "border-gray-200/50 dark:border-gray-600/40",
        shadow: "shadow-gray-500/10 dark:shadow-gray-500/20",
        dot: "bg-gray-50 dark:bg-gray-400",
        dotShadow: "shadow-gray-500/30",
        label: "Unknown",
        pulse: false
      };
    }

    // Handle boolean cases
    if (typeof status === 'boolean') {
      return status
        ? {
            bg: "bg-green-50 dark:bg-green-900/50 bg-gradient-to-r from-green-500/20 to-emerald-500/20 dark:from-green-500/30 dark:to-emerald-500/30",
            text: "text-green-700 dark:text-green-300",
            border: "border-green-200/60 dark:border-green-500/40",
            shadow: "shadow-green-500/20 dark:shadow-green-500/30",
            dot: "bg-green-500 dark:bg-green-400",
            dotShadow: "shadow-green-500/40",
            label: "Active",
            pulse: true
          }
        : {
            bg: "bg-red-50 dark:bg-red-900/50 bg-gradient-to-r from-red-500/20 to-rose-500/20 dark:from-red-500/30 dark:to-rose-500/30",
            text: "text-red-700 dark:text-red-300",
            border: "border-red-200/60 dark:border-red-500/40",
            shadow: "shadow-red-500/20 dark:shadow-red-500/30",
            dot: "bg-red-500 dark:bg-red-400",
            dotShadow: "shadow-red-500/40",
            label: "Inactive",
            pulse: false
          };
    }

    // Handle string cases
    switch (status.toLowerCase()) {
      case "active":
        return {
          bg: "bg-green-50 dark:bg-green-900/50 bg-gradient-to-r from-green-500/20 to-emerald-500/20 dark:from-green-500/30 dark:to-emerald-500/30",
          text: "text-green-700 dark:text-green-300",
          border: "border-green-200/60 dark:border-green-500/40",
          shadow: "shadow-green-500/20 dark:shadow-green-500/30",
          dot: "bg-green-500 dark:bg-green-400",
          dotShadow: "shadow-green-500/40",
          label: "Active",
          pulse: true
        };
      case "inactive":
        return { 
          bg: "bg-gray-50 dark:bg-gray-900/50 bg-gradient-to-r from-gray-400/15 to-slate-400/15 dark:from-gray-500/25 dark:to-slate-500/25",
          text: "text-gray-600 dark:text-gray-400",
          border: "border-gray-200/50 dark:border-gray-600/40",
          shadow: "shadow-gray-500/10 dark:shadow-gray-500/20",
          dot: "bg-gray-500 dark:bg-gray-400",
          dotShadow: "shadow-gray-500/30",
          label: "Inactive",
          pulse: false
        };
      case "suspended":
        return { 
          bg: "bg-red-50 dark:bg-red-900/50 bg-gradient-to-r from-red-500/20 to-orange-500/20 dark:from-red-500/30 dark:to-orange-500/30",
          text: "text-red-700 dark:text-red-300",
          border: "border-red-200/60 dark:border-red-500/40",
          shadow: "shadow-red-500/20 dark:shadow-red-500/30",
          dot: "bg-red-500 dark:bg-red-400",
          dotShadow: "shadow-red-500/40",
          label: "Suspended",
          pulse: false
        };
      case "pending":
        return {
          bg: "bg-amber-50 dark:bg-amber-900/50 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 dark:from-amber-500/30 dark:to-yellow-500/30",
          text: "text-amber-700 dark:text-amber-300",
          border: "border-amber-200/60 dark:border-amber-500/40",
          shadow: "shadow-amber-500/20 dark:shadow-amber-500/30",
          dot: "bg-amber-500 dark:bg-amber-400",
          dotShadow: "shadow-amber-500/40",
          label: "Pending",
          pulse: true
        };
      case "verified":
        return {
          bg: "bg-blue-50 dark:bg-blue-900/50 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 dark:from-blue-500/30 dark:to-cyan-500/30",
          text: "text-blue-700 dark:text-blue-300",
          border: "border-blue-200/60 dark:border-blue-500/40",
          shadow: "shadow-blue-500/20 dark:shadow-blue-500/30",
          dot: "bg-blue-500 dark:bg-blue-400",
          dotShadow: "shadow-blue-500/40",
          label: "Verified",
          pulse: false
        };
      case "banned":
        return {
          bg: "bg-red-100 dark:bg-red-900/60 bg-gradient-to-r from-red-600/25 to-red-800/25 dark:from-red-600/35 dark:to-red-800/35",
          text: "text-red-800 dark:text-red-200",
          border: "border-red-300/70 dark:border-red-400/50",
          shadow: "shadow-red-600/25 dark:shadow-red-600/35",
          dot: "bg-red-600 dark:bg-red-500",
          dotShadow: "shadow-red-600/50",
          label: "Banned",
          pulse: false
        };
      case "online":
        return {
          bg: "bg-green-100 dark:bg-green-900/60 bg-gradient-to-r from-green-400/25 to-green-600/25 dark:from-green-400/35 dark:to-green-600/35",
          text: "text-green-800 dark:text-green-200",
          border: "border-green-300/70 dark:border-green-400/50",
          shadow: "shadow-green-500/25 dark:shadow-green-500/35",
          dot: "bg-green-500 dark:bg-green-400",
          dotShadow: "shadow-green-500/50",
          label: "Online",
          pulse: true
        };
      case "offline":
        return {
          bg: "bg-slate-50 dark:bg-slate-900/50 bg-gradient-to-r from-slate-400/15 to-gray-500/15 dark:from-slate-500/25 dark:to-gray-600/25",
          text: "text-slate-600 dark:text-slate-400",
          border: "border-slate-200/50 dark:border-slate-600/40",
          shadow: "shadow-slate-500/10 dark:shadow-slate-500/20",
          dot: "bg-slate-500 dark:bg-slate-400",
          dotShadow: "shadow-slate-500/30",
          label: "Offline",
          pulse: false
        };
      default:
        return { 
          bg: "bg-gray-50 dark:bg-gray-900/50 bg-gradient-to-r from-gray-400/15 to-slate-400/15 dark:from-gray-500/25 dark:to-slate-500/25",
          text: "text-gray-600 dark:text-gray-400",
          border: "border-gray-200/50 dark:border-gray-600/40",
          shadow: "shadow-gray-500/10 dark:shadow-gray-500/20",
          dot: "bg-gray-500 dark:bg-gray-400",
          dotShadow: "shadow-gray-500/30",
          label: typeof status === 'string' ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown",
          pulse: false
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`
        inline-flex items-center gap-2 px-3 py-1.5
        rounded-full text-xs font-semibold tracking-wide
        border backdrop-blur-sm
        transition-all duration-300 ease-out
        hover:scale-105 hover:shadow-lg hover:-translate-y-0.5
        cursor-default select-none
        ${config.bg} ${config.text} ${config.border} ${config.shadow}
        dark:shadow-lg
      `}
    >
      <span 
        className={`
          relative w-2 h-2 rounded-full shadow-sm
          ${config.dot} ${config.dotShadow}
          ${config.pulse ? 'animate-pulse' : ''}
        `}
      >
        {config.pulse && (
          <span 
            className={`
              absolute inset-0 w-2 h-2 rounded-full opacity-75
              animate-ping
              ${config.dot}
            `}
          />
        )}
      </span>
      <span className="font-medium">
        {config.label}
      </span>
    </span>
  );
};