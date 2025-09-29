// path: components/route-manager/ui/RouteVisualization.tsx
"use client";

import { motion } from 'framer-motion';
import { Trash2, Edit } from 'lucide-react';
import { RouteDetailsPayload, Equipment } from '@/schemas/custom-schemas';

interface RouteVisualizationProps {
    routeDetails: RouteDetailsPayload;
    onJcClick: (jc: Equipment) => void;
    onEditJc: (jc: Equipment) => void;
    onDeleteJc: (jcId: string) => void;
}

export default function RouteVisualization({ routeDetails, onJcClick, onEditJc, onDeleteJc }: RouteVisualizationProps) {
  const { route, equipment, segments } = routeDetails;
  
  // This is the crucial logic block
  const allPoints = [
    { 
      id: route.sn_id, 
      name: route.sn_name || route.start_site?.name || 'Start Node', 
      type: 'site' as const, 
      position: 0, 
      raw: {} 
    },
    ...equipment.map(e => ({ 
        id: e.node_id, // <-- CORRECTED: Use the node_id for matching against segments
        name: e.attributes?.name || e.node?.name || `JC-${e.id?.slice(-4)}`, 
        type: 'equipment' as const, 
        position: e.attributes?.position_on_route || 0, 
        status: e.status,
        raw: e 
    })),
    { 
      id: route.en_id, 
      name: route.en_name || route.end_site?.name || 'End Node', 
      type: 'site' as const, 
      position: 100, 
      raw: {} 
    }
  ].sort((a, b) => a.position - b.position);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Route Visualization</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span className="text-gray-600 dark:text-gray-400">Sites</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
            <span className="text-gray-600 dark:text-gray-400">Existing JC</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Planned JC</span>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <div className="overflow-x-auto pb-4">
          <div className="relative min-w-[800px] h-64 py-8">
            <div 
              className="absolute top-1/2 h-2 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 rounded-full shadow-lg" 
              style={{ transform: 'translateY(-50%)', left: '4.8%', width: '92%' }} 
            />
            
            <div className="absolute top-0 left-0 right-0 h-full">
              {allPoints.map((point, index) => {
                const km = ((point.position / 100) * (route.current_rkm || 0)).toFixed(2);
                const isFirst = index === 0;
                const isLast = index === allPoints.length - 1;
                
                return (
                  <motion.div 
                    key={point.id} 
                    className="absolute top-1/2 flex flex-col items-center group" 
                    style={{ 
                      left: `calc(4% + ${point.position}% * 0.92)`, 
                      transform: 'translateX(-50%) translateY(-50%)'
                    }}
                    initial={{ opacity: 0, scale: 0.5, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: index * 0.1,
                      ease: "easeOut"
                    }}
                  >
                    <div className="absolute -top-16 text-center min-w-max max-w-40">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 px-2 py-1.5 bg-white dark:bg-gray-700 rounded-lg shadow-md border dark:border-gray-600 whitespace-nowrap">
                        {point.name}
                      </p>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white dark:border-t-gray-700"></div>
                    </div>
                    
                    <div 
                      onClick={() => point.type === 'equipment' && onJcClick(point.raw as Equipment)}
                      className={`relative w-6 h-6 rounded-full border-4 flex items-center justify-center transition-all duration-300 z-10 shadow-lg ${
                        point.type === 'site' 
                          ? 'bg-blue-600 border-blue-200 hover:bg-blue-700 hover:border-blue-300' 
                          : point.status === 'existing' 
                            ? 'bg-green-600 border-green-200 hover:bg-green-700 hover:border-green-300' 
                            : 'bg-yellow-500 border-yellow-200 hover:bg-yellow-600 hover:border-yellow-300'
                      } ${point.type === 'equipment' ? 'cursor-pointer hover:scale-125 hover:shadow-xl' : 'hover:scale-110'}`}
                      title={`${point.name} at ${km} km`}
                    >
                      <span className='text-white font-bold text-xs'>
                        {point.type === 'site' ? (isFirst ? 'S' : 'E') : 'J'}
                      </span>
                    </div>
                    
                    <div className="absolute top-10 text-center min-w-max">
                      <p className="text-xs font-mono text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md border dark:border-gray-600 shadow-sm">
                        {km} km
                      </p>
                    </div>
                    
                    {point.type === 'equipment' && (
                      <div className="absolute top-20 flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditJc(point.raw as Equipment);
                          }} 
                          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105" 
                          title="Edit JC"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteJc((point.raw as Equipment).id!);
                          }} 
                          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105" 
                          title="Delete JC"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-t dark:border-gray-600 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            <span className="w-3 h-3 bg-blue-600 rounded-full mr-2"></span>
            Cable Segments ({segments.length})
          </h4>
          {segments.length > 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total: {segments.reduce((acc, seg) => acc + (seg.distance_km || 0), 0).toFixed(2)} km
            </div>
          )}
        </div>
        
        {segments.length > 0 ? (
          <div className="space-y-3">
            {segments.map((seg, index) => {
              const start = allPoints.find(p => p.id === seg.start_node_id);
              const end = allPoints.find(p => p.id === seg.end_node_id);
              return (
                <motion.div 
                  key={seg.id} 
                  className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/30 dark:to-gray-700/50 p-4 rounded-xl border dark:border-gray-600/50 hover:from-blue-50 hover:to-blue-100 dark:hover:from-gray-700/50 dark:hover:to-gray-700/70 transition-all duration-300 hover:shadow-md"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500 text-white shadow-sm">
                        #{seg.segment_order}
                      </span>
                      <div className="text-sm">
                        <span className="font-medium text-gray-800 dark:text-gray-200">{start?.name || 'Unknown'}</span>
                        <span className="mx-3 text-gray-400">
                          <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{end?.name || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className='font-mono text-sm bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full border dark:border-gray-500 shadow-sm'>
                        {seg.distance_km || 0} km
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <motion.div 
            className='text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600'
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No cable segments found</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Segments will appear here once they are configured</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}