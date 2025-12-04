import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import Image from "next/image";
import { Modal } from "@/components/common/ui";
import { CardSpinner } from "@/components/common/ui/LoadingSpinner";
import { ReactNode } from "react";

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
    if (!dateString) return "Not provided";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  },

  dateTime: (dateString: string | null | undefined): string => {
    if (!dateString) return "Never";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
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
    return parts.length > 0 ? parts.join(", ") : null;
  },

  json: (value: unknown): ReactNode => {
    if (value === null || value === undefined) return "Not provided";
    return (
      <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  },

  boolean: (value: boolean): ReactNode => (
    <span
      className={`text-xs px-3 py-1 rounded-full font-semibold ${
        value
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      }`}
    >
      {value ? "✓ Yes" : "✗ No"}
    </span>
  ),

  email: (email: string, isVerified?: boolean): ReactNode => (
    <div className="flex items-center justify-between">
      <span className="text-gray-900 dark:text-white font-medium flex-1">{email}</span>
      {typeof isVerified === "boolean" && (
        <span
          className={`text-xs px-3 py-1 rounded-full font-semibold ml-3 ${
            isVerified
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {isVerified ? "✓ Verified" : "✗ Unverified"}
        </span>
      )}
    </div>
  ),
} as const;

const formatDefaultValue = (value: unknown): ReactNode => {
  if (value === null || value === undefined) {
    return "Not provided";
  }

  if (typeof value === "string") {
    return value.trim() ? value : "Not provided";
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "boolean") {
    return defaultFormatters.boolean(value);
  }

  return defaultFormatters.json(value);
};

const getNestedValue = <T extends Record<string, unknown>>(obj: T, key: string): unknown => {
  return key.split(".").reduce<unknown>((current, prop) => {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[prop];
  }, obj);
};

const DetailsModal = <T extends Record<string, unknown>>({
  data,
  onClose,
  isOpen,
  config,
  loading = false,
  className = "",
}: DetailsModalProps<T>) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 50,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        damping: 25,
        stiffness: 300,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 30,
      transition: {
        duration: 0.2,
      },
    },
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut" as const,
      },
    },
  };

  const fieldVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  const renderField = (field: FieldConfig<T>, record: T) => {
    if (field.condition && !field.condition(record)) {
      return null;
    }

    const key = String(field.key);
    const value = getNestedValue(record, key);
    const formattedValue = field.formatter ? field.formatter(value, record) : formatDefaultValue(value);
    const isPrimitive = typeof formattedValue === "string" || typeof formattedValue === "number";

    return (
      <motion.div
        key={key}
        className={`group ${field.className || ""}`}
        variants={fieldVariants}
        whileHover={{ x: 4 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 block mb-2 uppercase tracking-wider">
          {field.label}
        </label>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 group-hover:border-blue-300 dark:group-hover:border-blue-600 transition-colors">
          <div className="flex items-center gap-3">
            {field.icon && <div className="text-gray-400 shrink-0">{field.icon}</div>}
            <div className="flex-1">
              {isPrimitive ? (
                <p className="text-gray-900 dark:text-white font-medium">{formattedValue}</p>
              ) : (
                formattedValue
              )}
            </div>
          </div>
        </div>
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
        className={`space-y-6 ${section.className || ""}`}
        variants={sectionVariants}
      >
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          {section.icon && <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">{section.icon}</div>}
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{section.title}</h3>
        </div>

        {section.renderCustom ? (
          section.renderCustom(record)
        ) : (
          <div className="space-y-5">
            {section.fields.map((fieldConfig) => renderField(fieldConfig, record))}
          </div>
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
    const avatarUrl = typeof avatarValue === "string" ? avatarValue : undefined;

    return (
      <div className="relative px-8 py-6 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <motion.div className="flex items-center gap-4" variants={fieldVariants}>
            {header.avatar && (
              <motion.div
                className="shrink-0 relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {avatarUrl ? (
                  <div className="relative">
                    <Image
                      className="h-16 w-16 rounded-full object-cover border-4 border-white shadow-lg ring-2 ring-blue-500/20"
                      src={avatarUrl}
                      alt={title}
                      width={64}
                      height={64}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                ) : null}
                <div
                  className={`h-16 w-16 rounded-full bg-blue-500 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg ring-2 ring-blue-500/20 ${
                    avatarUrl ? "hidden" : ""
                  }`}
                >
                  <span className="text-xl font-bold text-white">{header.avatar.fallbackText(record)}</span>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
              </motion.div>
            )}
            <div className="space-y-1">
              <motion.h2 className="text-2xl font-bold text-gray-900 dark:text-white" variants={fieldVariants}>
                {title}
              </motion.h2>
              {subtitle && (
                <motion.p className="text-gray-600 dark:text-gray-300 font-medium" variants={fieldVariants}>
                  {subtitle}
                </motion.p>
              )}
              {header.badges && (
                <motion.div className="flex items-center gap-2 flex-wrap" variants={fieldVariants}>
                  {header.badges.map((badge, index) => (
                    <div key={`${String(badge.key)}-${index}`}>
                      {badge.component(getNestedValue(record, String(badge.key)), record)}
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
          <motion.button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200 backdrop-blur-sm"
            aria-label="Close modal"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <FiX size={24} />
          </motion.button>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <Modal isOpen={isOpen} onClose={onClose}>
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <CardSpinner />
            </motion.div>
          ) : data ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                variants={modalVariants}
                className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-gray-200/50 dark:border-gray-700/50 ${className}`}
              >
                {renderHeader(data)}
                <div className="p-8 overflow-y-auto max-h-[calc(90vh-160px)] custom-scrollbar">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {config.sections.map((section) => renderSection(section, data))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </Modal>
      )}
    </AnimatePresence>
  );
};

export { DetailsModal, defaultFormatters };
