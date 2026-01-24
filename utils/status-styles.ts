// path: utils/status-styles.ts
export type StatusIntent =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'blue'
  | 'purple';

export interface StatusStyle {
  bg: string;
  text: string;
  border: string;
  shadow?: string;
  dot: string;
  dotShadow?: string;
  label?: string; // Optional override label
  pulse?: boolean;
}

const INTENT_MAP: Record<StatusIntent, StatusStyle> = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/50 bg-linear-to-r from-green-500/20 to-emerald-500/20 dark:from-green-500/30 dark:to-emerald-500/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200/60 dark:border-green-500/40',
    shadow: 'shadow-green-500/20 dark:shadow-green-500/30',
    dot: 'bg-green-500 dark:bg-green-400',
    dotShadow: 'shadow-green-500/40',
    pulse: true,
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-900/50 bg-linear-to-r from-red-500/20 to-rose-500/20 dark:from-red-500/30 dark:to-rose-500/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200/60 dark:border-red-500/40',
    shadow: 'shadow-red-500/20 dark:shadow-red-500/30',
    dot: 'bg-red-500 dark:bg-red-400',
    dotShadow: 'shadow-red-500/40',
    pulse: false,
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/50 bg-linear-to-r from-amber-500/20 to-yellow-500/20 dark:from-amber-500/30 dark:to-yellow-500/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200/60 dark:border-amber-500/40',
    shadow: 'shadow-amber-500/20 dark:shadow-amber-500/30',
    dot: 'bg-amber-500 dark:bg-amber-400',
    dotShadow: 'shadow-amber-500/40',
    pulse: true,
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/50 bg-linear-to-r from-blue-500/20 to-cyan-500/20 dark:from-blue-500/30 dark:to-cyan-500/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200/60 dark:border-blue-500/40',
    shadow: 'shadow-blue-500/20 dark:shadow-blue-500/30',
    dot: 'bg-blue-500 dark:bg-blue-400',
    dotShadow: 'shadow-blue-500/40',
    pulse: false,
  },
  neutral: {
    bg: 'bg-gray-50 dark:bg-gray-900/50 bg-linear-to-r from-gray-400/15 to-slate-400/15 dark:from-gray-500/25 dark:to-slate-500/25',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-200/50 dark:border-gray-600/40',
    shadow: 'shadow-gray-500/10 dark:shadow-gray-500/20',
    dot: 'bg-gray-500 dark:bg-gray-400',
    dotShadow: 'shadow-gray-500/30',
    pulse: false,
  },
  blue: {
    bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
    pulse: false,
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/50',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    dot: 'bg-purple-500',
    pulse: false,
  },
};

export const getStatusConfig = (status: string | boolean | null | undefined): StatusStyle => {
  if (status === null || status === undefined) {
    return { ...INTENT_MAP.neutral, label: 'Unknown' };
  }

  // Boolean handling
  if (typeof status === 'boolean') {
    return status
      ? { ...INTENT_MAP.success, label: 'Active' }
      : { ...INTENT_MAP.danger, label: 'Inactive' };
  }

  // String normalization
  const s = status.toLowerCase().trim();

  // Map strings to intents
  switch (s) {
    case 'active':
    case 'ready':
    case 'on-air':
    case 'issued':
    case 'online':
    case 'working':
    case 'true':
      return { ...INTENT_MAP.success, label: status }; // Preserve original case for label if needed, or use formatted

    case 'inactive':
    case 'suspended':
    case 'banned':
    case 'faulty':
    case 'offline':
    case 'false':
      return { ...INTENT_MAP.danger, label: status };

    case 'pending':
    case 'partial ready':
    case 'survey':
    case 'configured':
      return { ...INTENT_MAP.warning, label: status };

    case 'verified':
    case 'available':
      return { ...INTENT_MAP.info, label: status };

    // Inventory Specific
    case 'utilized':
    case 'allocated':
      return { ...INTENT_MAP.blue, label: status };

    default:
      return { ...INTENT_MAP.neutral, label: status };
  }
};
