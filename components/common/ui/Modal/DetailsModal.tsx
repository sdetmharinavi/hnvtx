import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import Image from 'next/image';
import { Modal } from '@/components/common/ui';
import { CardSpinner } from '@/components/common/ui/LoadingSpinner';
import { ReactNode } from 'react';

type FieldKey<T extends Record<string, unknown>> = keyof T | string;

export interface FieldConfig<T extends Record<string, unknown>> {
  key: FieldKey<T>;
  label: string;
  icon?: ReactNode;
  formatter?: (value: unknown, data: T) => ReactNode;
  condition?: (data: T) => boolean;
  className?: string;
}

export interface SectionConfig<T extends Record<string, unknown>> {
  title: string;
  icon?: ReactNode;
  fields: FieldConfig<T>[];
  condition?: (data: T) => boolean;
  className?: string;
  renderCustom?: (data: T) => ReactNode;
}

export interface HeaderConfig<T extends Record<string, unknown>> {
  title: (data: T) => string;
  subtitle?: (data: T) => string;
  avatar?: {
    urlKey: FieldKey<T>;
    fallbackText: (data: T) => string;
  };
  badges?: Array<{
    key: FieldKey<T>;
    component: (value: unknown, data: T) => ReactNode;
  }>;
}

export interface DetailsModalProps<T extends Record<string, unknown> = Record<string, unknown>> {
  data: T | null;
  onClose: () => void;
  isOpen: boolean;
  config: {
    header: HeaderConfig<T>;
    sections: SectionConfig<T>[];
  };
  loading?: boolean;
  className?: string;
}

const defaultFormatters = {
  date: (dateString: string | null | undefined): string => {
    if (!dateString) return 'Not provided';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  },

  dateTime: (dateString: string | null | undefined): string => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  },

  address: (
    address:
      | Partial<{
          street?: string | null;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          zipCode?: string | null;
          country?: string | null;
        }>
      | null
      | undefined,
  ): string | null => {
    if (!address) return null;
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zip_code ?? address.zipCode,
      address.country,
    ].filter((part) => part != null) as string[];
    return parts.length > 0 ? parts.join(', ') : null;
  },

  json: (value: unknown): ReactNode => {
    if (value === null || value === undefined) return 'Not provided';
    return (
      <pre className='text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto bg-gray-50 dark:bg-gray-800/50 p-2 rounded'>
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  },

  boolean: (value: boolean): ReactNode => (
    <span
      className={`inline-flex items-center text-sm px-2 py-0.5 rounded-full font-medium ${
        value
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
          : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
      }`}
    >
      {value ? '✓ Yes' : '✗ No'}
    </span>
  ),

  email: (email: string, isVerified?: boolean): ReactNode => (
    <div className='flex items-center justify-between gap-2'>
      <span className='text-gray-900 dark:text-gray-100 text-sm flex-1 truncate'>{email}</span>
      {typeof isVerified === 'boolean' && (
        <span
          className={`text-sm px-2 py-0.5 rounded-full font-medium shrink-0 ${
            isVerified
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
              : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
          }`}
        >
          {isVerified ? '✓ Verified' : '✗ Unverified'}
        </span>
      )}
    </div>
  ),
} as const;

const formatDefaultValue = (value: unknown): ReactNode => {
  if (value === null || value === undefined) {
    return <span className='text-gray-400 dark:text-gray-500 text-sm'>Not provided</span>;
  }

  if (typeof value === 'string') {
    return value.trim() ? (
      <span className='text-gray-900 dark:text-gray-100 text-sm'>{value}</span>
    ) : (
      <span className='text-gray-400 dark:text-gray-500 text-sm'>Not provided</span>
    );
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return <span className='text-gray-900 dark:text-gray-100 text-sm'>{value.toString()}</span>;
  }

  if (typeof value === 'boolean') {
    return defaultFormatters.boolean(value);
  }

  return defaultFormatters.json(value);
};

const getNestedValue = <T extends Record<string, unknown>>(obj: T, key: string): unknown => {
  return key.split('.').reduce<unknown>((current, prop) => {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[prop];
  }, obj);
};

const DetailsModal = <T extends Record<string, unknown>>({
  data,
  onClose,
  isOpen,
  config,
  loading = false,
  className = '',
}: DetailsModalProps<T>) => {
  // Enhanced backdrop animation
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.25,
        ease: [0.4, 0, 0.2, 1] as const, // Custom easing for smoother feel
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 1, 1] as const,
      },
    },
  };

  // Enhanced modal animation with better spring physics
  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.92,
      y: 30,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        damping: 25,
        stiffness: 300,
        mass: 0.8,
        delayChildren: 0.1,
        staggerChildren: 0.03,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 1, 1] as const,
      },
    },
  };

  // Improved header animation with slide-in effect
  const headerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  // Enhanced section animation with smooth fade and slide
  const sectionVariants = {
    hidden: {
      opacity: 0,
      y: 15,
      scale: 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.35,
        ease: [0.4, 0, 0.2, 1] as const,
        staggerChildren: 0.04,
      },
    },
  };

  // Refined field animation
  const fieldVariants = {
    hidden: {
      opacity: 0,
      x: -8,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.25,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  // Avatar pulse animation
  const avatarVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        damping: 20,
        stiffness: 300,
      },
    },
  };

  // Badge stagger animation
  const badgeContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 5 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        damping: 25,
        stiffness: 400,
      },
    },
  };

  const renderField = (field: FieldConfig<T>, record: T) => {
    if (field.condition && !field.condition(record)) {
      return null;
    }

    const key = String(field.key);
    const value = getNestedValue(record, key);
    const formattedValue = field.formatter
      ? field.formatter(value, record)
      : formatDefaultValue(value);

    return (
      <motion.div key={key} className={`group ${field.className || ''}`} variants={fieldVariants}>
        <motion.div
          className='flex items-start gap-2.5'
          whileHover={{ x: 2 }}
          transition={{ duration: 0.2 }}
        >
          {field.icon && (
            <motion.div
              className='text-gray-400 dark:text-gray-500 mt-0.5 shrink-0 w-4'
              initial={{ rotate: -10, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              {field.icon}
            </motion.div>
          )}
          <div className='flex-1 min-w-0'>
            <label className='text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1'>
              {field.label}
            </label>
            <div className='text-sm'>{formattedValue}</div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const renderSection = (section: SectionConfig<T>, record: T) => {
    if (section.condition && !section.condition(record)) {
      return null;
    }

    return (
      <motion.div
        key={section.title}
        className={`${section.className || ''}`}
        variants={sectionVariants}
      >
        <motion.div
          className='flex items-center gap-2 mb-4'
          whileHover={{ x: 3 }}
          transition={{ duration: 0.2 }}
        >
          {section.icon && (
            <motion.div
              className='w-8 h-8 flex items-center justify-center bg-linear-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 rounded-lg text-blue-600 dark:text-blue-400'
              whileHover={{
                scale: 1.1,
                rotate: 5,
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 15,
              }}
            >
              {section.icon}
            </motion.div>
          )}
          <h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
            {section.title}
          </h3>
        </motion.div>

        {section.renderCustom ? (
          section.renderCustom(record)
        ) : (
          <motion.div className='space-y-4' variants={sectionVariants}>
            {section.fields.map((fieldConfig) => renderField(fieldConfig, record))}
          </motion.div>
        )}
      </motion.div>
    );
  };

  const renderHeader = (record: T) => {
    const { header } = config;
    const title = header.title(record);
    const subtitle = header.subtitle ? header.subtitle(record) : null;
    const avatarKey = header.avatar ? String(header.avatar.urlKey) : null;
    const avatarValue = avatarKey ? getNestedValue(record, avatarKey) : undefined;
    const avatarUrl = typeof avatarValue === 'string' ? avatarValue : undefined;

    return (
      <motion.div
        className='relative px-6 py-5 border-b border-gray-200 dark:border-gray-800'
        variants={headerVariants}
      >
        <div className='flex items-start justify-between gap-4'>
          <motion.div className='flex items-center gap-3 flex-1 min-w-0' variants={headerVariants}>
            {header.avatar && (
              <motion.div
                className='shrink-0 relative'
                variants={avatarVariants}
                whileHover={{
                  scale: 1.08,
                  rotate: 2,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 15,
                }}
              >
                {avatarUrl ? (
                  <div className='relative'>
                    <Image
                      className='h-12 w-12 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm'
                      src={avatarUrl}
                      alt={title}
                      width={48}
                      height={48}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <motion.div
                      className='absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full'
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.2,
                        type: 'spring',
                        stiffness: 500,
                        damping: 15,
                      }}
                    />
                  </div>
                ) : null}
                <div
                  className={`h-12 w-12 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm ${
                    avatarUrl ? 'hidden' : ''
                  }`}
                >
                  <span className='text-lg font-semibold text-white'>
                    {header.avatar.fallbackText(record)}
                  </span>
                  <motion.div
                    className='absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full'
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: 0.2,
                      type: 'spring',
                      stiffness: 500,
                      damping: 15,
                    }}
                  />
                </div>
              </motion.div>
            )}
            <div className='flex-1 min-w-0'>
              <motion.h2
                className='text-lg font-semibold text-gray-900 dark:text-gray-100 truncate'
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                {title}
              </motion.h2>
              {subtitle && (
                <motion.p
                  className='text-sm text-gray-600 dark:text-gray-400 truncate'
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                >
                  {subtitle}
                </motion.p>
              )}
              {header.badges && (
                <motion.div
                  className='flex items-center gap-2 flex-wrap mt-2'
                  variants={badgeContainerVariants}
                  initial='hidden'
                  animate='visible'
                >
                  {header.badges.map((badge, index) => (
                    <motion.div key={`${String(badge.key)}-${index}`} variants={badgeVariants}>
                      {badge.component(getNestedValue(record, String(badge.key)), record)}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
          <motion.button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0'
            aria-label='Close modal'
            whileHover={{
              scale: 1.1,
              rotate: 90,
            }}
            whileTap={{ scale: 0.9 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 17,
            }}
          >
            <FiX size={20} />
          </motion.button>
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence mode='wait'>
      {isOpen && (
        <Modal isOpen={isOpen} onClose={onClose}>
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50'
            >
              <CardSpinner />
            </motion.div>
          ) : data ? (
            <motion.div
              variants={backdropVariants}
              initial='hidden'
              animate='visible'
              exit='exit'
              className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'
              onClick={onClose}
            >
              <motion.div
                variants={modalVariants}
                onClick={(e) => e.stopPropagation()}
                className={`bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-7xl w-full max-h-[85vh] overflow-hidden border border-gray-200 dark:border-gray-800 ${className}`}
              >
                {renderHeader(data)}
                <motion.div
                  className='p-6 overflow-y-auto max-h-[calc(85vh-100px)] custom-scrollbar'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                >
                  <motion.div
                    className='grid grid-cols-1 md:grid-cols-2 gap-6'
                    variants={sectionVariants}
                    initial='hidden'
                    animate='visible'
                  >
                    {config.sections.map((section) => renderSection(section, data))}
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          ) : null}
        </Modal>
      )}
    </AnimatePresence>
  );
};

export { DetailsModal, defaultFormatters };
