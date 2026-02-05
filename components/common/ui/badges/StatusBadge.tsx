// components/common/ui/badges/StatusBadge.tsx
import { getStatusConfig } from '@/utils/status-styles';

export const StatusBadge = ({
  status,
  showStatusLabel,
}: {
  status: string | boolean | null | undefined;
  showStatusLabel?: boolean;
}) => {
  const config = getStatusConfig(status);

  // Format label to Title Case if it matches the raw status string
  const displayLabel =
    typeof status === 'string' && config.label?.toLowerCase() === status.toLowerCase()
      ? status.charAt(0).toUpperCase() + status.slice(1)
      : config.label;

  return (
    <span
      className={`
        inline-flex items-center gap-2
        ${showStatusLabel ? 'px-3 py-1.5' : 'p-0'}
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
          relative w-2 h-2 rounded-full shadow-sm shrink-0
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
      {showStatusLabel && <span className='font-medium whitespace-nowrap'>{displayLabel}</span>}
    </span>
  );
};
