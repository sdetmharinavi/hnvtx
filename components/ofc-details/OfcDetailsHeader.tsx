// path: components/ofc-details/OfcDetailsHeader.tsx
import React from 'react';
import { motion, Variants } from 'framer-motion';
import {
  Cable,
  Calendar,
  MapPin,
  Settings,
  Hash,
  Route,
  LucideIcon,
  AlignCenterVertical,
  Info,
} from 'lucide-react';
import { StatusBadge } from '@/components/common/ui/badges/StatusBadge';
import { Row } from '@/hooks/database';

interface OfcDetailsHeaderProps {
  cable: Row<'v_ofc_cables_complete'>;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 120, damping: 18 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -5 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 150, damping: 20 },
  },
};

interface InfoItemProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon: Icon, label, value }) => (
  <motion.div
    variants={itemVariants}
    className="flex items-center justify-between py-2 px-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
  >
    <div className="flex items-center gap-2">
      <div className="p-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
        <Icon size={14} />
      </div>
      <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">{label}</span>
    </div>
    <span className="font-semibold text-gray-900 dark:text-gray-100 text-xs max-w-[60%] text-right truncate">
      {value}
    </span>
  </motion.div>
);

const OfcDetailsHeader: React.FC<OfcDetailsHeaderProps> = ({ cable }) => {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6"
    >
      {/* Summary Card */}
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}
        className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all"
      >
        <div className="absolute inset-0 bg-linear-to-br from-blue-50/50 via-transparent to-indigo-50/30 dark:from-blue-900/10 dark:via-transparent dark:to-indigo-900/10" />

        <div className="relative p-4">
          <motion.div
            className="flex items-center gap-2 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="p-1.5 rounded-lg bg-blue-500 bg-linear-to-r from-blue-500 to-indigo-600 text-white shadow">
              <Cable size={16} />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Summary</h2>
          </motion.div>

          <motion.div variants={containerVariants} className="space-y-0.5">
            <InfoItem icon={Hash} label="Asset No." value={String(cable.asset_no ?? '-')} />
            <InfoItem
              icon={AlignCenterVertical}
              label="Transnet ID"
              value={String(cable.transnet_id ?? '-')}
            />
            <InfoItem icon={Route} label="Route Name" value={String(cable.route_name ?? '-')} />
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-between py-2 px-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                  <Settings size={14} />
                </div>
                <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">Status</span>
              </div>
              <StatusBadge status={cable.status || 'Unknown'} />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Metadata Card */}
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}
        className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all"
      >
        <div className="absolute inset-0 bg-linear-to-br from-emerald-50/50 via-transparent to-teal-50/30 dark:from-emerald-900/10 dark:via-transparent dark:to-teal-900/10" />

        <div className="relative p-4">
          <motion.div
            className="flex items-center gap-2 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <div className="p-1.5 rounded-lg bg-emerald-500 bg-linear-to-r from-emerald-500 to-teal-600 text-white shadow">
              <Settings size={16} />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Metadata</h2>
          </motion.div>

          <motion.div variants={containerVariants} className="space-y-0.5">
            <InfoItem icon={Cable} label="OFC Type" value={cable?.ofc_type_name || '-'} />
            <InfoItem
              icon={MapPin}
              label="Maintenance Area"
              value={cable?.maintenance_area_name || '-'}
            />
            <InfoItem icon={Info} label="OFC Owner" value={cable?.ofc_owner_name || '-'} />
            <InfoItem
              icon={Calendar}
              label="Commissioned"
              value={
                cable.commissioned_on
                  ? new Date(String(cable.commissioned_on)).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '-'
              }
            />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OfcDetailsHeader;
