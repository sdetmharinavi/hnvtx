import React from 'react';
import { V_ofc_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { FiActivity, FiArrowRight } from 'react-icons/fi';
import { StatusBadge } from '@/components/common/ui/badges/StatusBadge';
import { formatDate } from '@/utils/formatters';
import TruncateTooltip from '@/components/common/TruncateTooltip';

interface FiberConnectionCardProps {
  fiber: V_ofc_connections_completeRowSchema;
  actions?: React.ReactNode;
}

export const FiberConnectionCard: React.FC<FiberConnectionCardProps> = ({
  fiber,
  actions,
}) => {
  // Determine if this fiber connects to something specific
  const isAllocated = !!fiber.system_name;
  
  // Use updated values if they exist (from tracing/splicing), otherwise fallback to physical defaults
  const startNodeName = fiber.updated_sn_name || fiber.sn_name || 'Start Node';
  const endNodeName = fiber.updated_en_name || fiber.en_name || 'End Node';
  
  const startFiberNo = fiber.updated_fiber_no_sn || fiber.fiber_no_sn;
  const endFiberNo = fiber.updated_fiber_no_en || fiber.fiber_no_en;

  const startDom = fiber.sn_dom ? formatDate(fiber.sn_dom, { format: 'dd-mm-yyyy' }) : null;
  const endDom = fiber.en_dom ? formatDate(fiber.en_dom, { format: 'dd-mm-yyyy' }) : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col group relative overflow-hidden">
      
      {/* Header */}
      <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start gap-2 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2">
             <span className="font-mono font-bold text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-1 rounded text-gray-700 dark:text-gray-200">
                F-{fiber.fiber_no_sn}
             </span>
             {isAllocated ? (
                 <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider">Allocated</span>
                    <span className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-[150px]" title={fiber.system_name || ''}>
                        {fiber.system_name}
                    </span>
                 </div>
             ) : (
                 <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                    Available
                 </span>
             )}
        </div>
        <StatusBadge status={fiber.status ?? false} />
      </div>

      {/* Connection Flow Body */}
      <div className="p-4 space-y-4">
         
         {/* A -> B Visual */}
         <div className="relative">
            {/* Connector Line */}
            <div className="absolute top-1/2 left-[15%] right-[15%] h-px bg-gray-300 dark:bg-gray-600 -z-10 transform -translate-y-1/2" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-1 rounded-full border border-gray-200 dark:border-gray-600 z-0">
                 <FiArrowRight className="w-3 h-3 text-gray-400" />
            </div>

            <div className="flex justify-between items-start relative z-10">
                {/* END A */}
                <div className="flex flex-col items-start max-w-[45%]">
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">END A</div>
                    
                    <div className="font-bold text-gray-800 dark:text-gray-200 truncate w-full text-sm mb-1" title={startNodeName}>
                        {startNodeName}
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Fiber: <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{startFiberNo}</span>
                    </div>

                    {/* End A Metrics */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-1.5 rounded border border-gray-100 dark:border-gray-700 w-full text-[10px]">
                        <div className="flex justify-between mb-0.5">
                            <span className="text-gray-400">OTDR</span>
                            <span className="font-mono">{fiber.otdr_distance_sn_km ? `${fiber.otdr_distance_sn_km}km` : '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">DOM</span>
                            <span className="font-mono text-gray-600 dark:text-gray-400">{startDom || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* END B */}
                <div className="flex flex-col items-end max-w-[45%] text-right">
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">END B</div>
                     
                     <div className="font-bold text-gray-800 dark:text-gray-200 truncate w-full text-sm mb-1" title={endNodeName}>
                        {endNodeName}
                     </div>
                     
                     <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Fiber: <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{endFiberNo}</span>
                     </div>

                    {/* End B Metrics */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-1.5 rounded border border-gray-100 dark:border-gray-700 w-full text-[10px]">
                        <div className="flex justify-between mb-0.5">
                            <span className="text-gray-400">OTDR</span>
                            <span className="font-mono">{fiber.otdr_distance_en_km ? `${fiber.otdr_distance_en_km}km` : '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">DOM</span>
                            <span className="font-mono text-gray-600 dark:text-gray-400">{endDom || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>
         </div>

         {/* Shared Metrics */}
         <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <FiActivity className="w-3.5 h-3.5" />
                <span>Loss: <span className="font-mono font-medium text-gray-900 dark:text-gray-200">{fiber.route_loss_db ? `${fiber.route_loss_db}dB` : '-'}</span></span>
            </div>
            
            {fiber.remark && (
                <TruncateTooltip 
                    text={fiber.remark} 
                    className="text-gray-400 italic max-w-[150px]" 
                />
            )}
         </div>
      </div>

      {/* Footer / Actions */}
      {actions && (
        <div className="p-3 bg-gray-50/50 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
            {actions}
        </div>
      )}
    </div>
  );
};