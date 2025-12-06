import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Cable, Calendar, MapPin, Settings, Hash, Route, LucideIcon } from 'lucide-react';
import { StatusBadge } from '@/components/common/ui/badges/StatusBadge';
import { Row } from '@/hooks/database';

interface OfcDetailsHeaderProps {
    cable: Row<'v_ofc_cables_complete'>;
}
  
  const OfcDetailsHeader: React.FC<OfcDetailsHeaderProps> = ({ cable }) => {
    const containerVariants: Variants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.2
        }
      }
    };
  
    const cardVariants: Variants = {
      hidden: { 
        opacity: 0, 
        y: 20,
        scale: 0.95
      },
      visible: { 
        opacity: 1, 
        y: 0,
        scale: 1,
        transition: {
          type: "spring" as const,
          stiffness: 100,
          damping: 15
        }
      }
    };
  
    const itemVariants: Variants = {
      hidden: { opacity: 0, x: -10 },
      visible: { 
        opacity: 1, 
        x: 0,
        transition: {
          type: "spring" as const,
          stiffness: 150,
          damping: 20
        }
      }
    };
  
    interface InfoItemProps {
      icon: LucideIcon;
      label: string;
      value: string;
      delay?: number;
    }
  
    const InfoItem: React.FC<InfoItemProps> = ({ icon: Icon, label, value }) => (
      <motion.div 
        variants={itemVariants}
        className="flex items-center justify-between py-3 px-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            <Icon size={16} />
          </div>
          <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">
            {label}
          </span>
        </div>
        <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm max-w-[60%] text-right truncate">
          {value}
        </span>
      </motion.div>
    );
  
    return (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
      >
        {/* Summary Card */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ 
            y: -2,
            boxShadow: "0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
          }}
          className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-all duration-300"
        >
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-linear-to-br from-blue-50/50 via-transparent to-indigo-50/30 dark:from-blue-900/10 dark:via-transparent dark:to-indigo-900/10" />
          
          {/* Decorative Element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-bl from-blue-100/20 to-transparent dark:from-blue-800/10 rounded-bl-full" />
          
          <div className="relative p-6">
            <motion.div 
              className="flex items-center gap-3 mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="p-2.5 rounded-xl bg-linear-to-r from-blue-500 to-indigo-600 text-white shadow-lg">
                <Cable size={20} />
              </div>
              {/* FIX: Replaced gradient text with solid colors */}
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Summary
              </h2>
            </motion.div>
            
            <motion.div 
              variants={containerVariants}
              className="space-y-1"
            >
              <InfoItem 
                icon={Hash}
                label="Asset No."
                value={String(cable.asset_no ?? '-')}
              />
              <InfoItem 
                icon={Route}
                label="Route Name"
                value={String(cable.route_name ?? '-')}
              />
              <motion.div 
                variants={itemVariants}
                className="flex items-center justify-between py-3 px-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                    <Settings size={16} />
                  </div>
                  <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">
                    Status
                  </span>
                </div>
                <StatusBadge status={cable.status || 'Unknown'} />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
  
        {/* Metadata Card */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ 
            y: -2,
            boxShadow: "0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
          }}
          className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-all duration-300"
        >
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-linear-to-br from-emerald-50/50 via-transparent to-teal-50/30 dark:from-emerald-900/10 dark:via-transparent dark:to-teal-900/10" />
          
          {/* Decorative Element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-bl from-emerald-100/20 to-transparent dark:from-emerald-800/10 rounded-bl-full" />
          
          <div className="relative p-6">
            <motion.div 
              className="flex items-center gap-3 mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="p-2.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 text-white shadow-lg">
                <Settings size={20} />
              </div>
              {/* FIX: Replaced gradient text with solid colors */}
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Metadata
              </h2>
            </motion.div>
            
            <motion.div 
              variants={containerVariants}
              className="space-y-1"
            >
              <InfoItem 
                icon={Cable}
                label="OFC Type"
                value={cable?.ofc_type_name || '-'}
              />
              <InfoItem 
                icon={MapPin}
                label="Maintenance Area"
                value={cable?.maintenance_area_name || '-'}
              />
              <InfoItem 
                icon={Calendar}
                label="Commissioned On"
                value={
                  cable.commissioned_on
                    ? new Date(String(cable.commissioned_on)).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
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