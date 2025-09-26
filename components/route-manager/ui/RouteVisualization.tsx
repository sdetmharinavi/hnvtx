"use client";

import { motion } from 'framer-motion';
import { Trash2, Edit } from 'lucide-react';
import { z } from 'zod';
import { 
    junction_closuresRowSchema, 
    cable_segmentsRowSchema,
    v_ofc_cables_completeRowSchema 
} from '@/schemas/zod-schemas';

// --- Types are now correctly inferred from Zod schemas ---
type CableRoute = z.infer<typeof v_ofc_cables_completeRowSchema> & {
    distance_km?: number | null;
    start_site: { id: string | null; name: string | null };
    end_site: { id: string | null; name: string | null };
};
type Equipment = z.infer<typeof junction_closuresRowSchema> & {
  node?: { name: string | null; } | null;
  status: 'existing' | 'planned'; 
  attributes: { position_on_route: number; name?: string; } 
};
type CableSegment = z.infer<typeof cable_segmentsRowSchema>;

interface RouteDetailsPayload {
    route: CableRoute;
    equipment: Equipment[];
    segments: CableSegment[];
}

interface RouteVisualizationProps {
    routeDetails: RouteDetailsPayload;
    onJcClick: (jc: Equipment) => void;
    onEditJc: (jc: Equipment) => void;
    onDeleteJc: (jcId: string) => void;
}

export default function RouteVisualization({ routeDetails, onJcClick, onEditJc, onDeleteJc }: RouteVisualizationProps) {
  const { route, equipment, segments } = routeDetails;
  
  const allPoints = [
    // FIX: Safely access potentially null names
    { id: route.sn_id, name: route.sn_name || 'Start Node', type: 'site' as const, position: 0, raw: {} },
    ...equipment.map(e => ({ 
        id: e.id, 
        name: e.attributes.name || e.node?.name || 'JC', 
        type: 'equipment' as const, 
        position: e.attributes.position_on_route, 
        status: e.status,
        raw: e 
    })),
    { id: route.en_id, name: route.en_name || 'End Node', type: 'site' as const, position: 100, raw: {} }
  ].sort((a, b) => a.position - b.position);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
      <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Route Visualization</h3>
      
      {/* Route visualization container with proper spacing */}
      <div className="mb-8">
        <div className="overflow-x-auto">
          <div className="relative min-w-[800px] h-40 py-8">
            {/* Main route line */}
            <div className="absolute top-1/2 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-sm" style={{ transform: 'translateY(-50%)', left: '12%', width: '76%' }} />
            
            {/* Points container */}
            <div className="absolute top-0 left-0 right-0 h-full">
              {allPoints.map((point, index) => {
                const km = ((point.position / 100) * (route.current_rkm || 0)).toFixed(2);
                return (
                  <motion.div 
                    key={point.id} 
                    className="absolute top-1/2 flex flex-col items-center group" 
                    style={{ 
                      left: `${12 + (point.position / 100) * 76}%`, 
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
                    {/* Point name label - above */}
                    {/* <div className="absolute -top-12 text-center min-w-max max-w-32">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate px-2 py-1 bg-white dark:bg-gray-700 rounded shadow-sm border dark:border-gray-600">
                        {point.name}
                      </p>
                    </div> */}
                    
                    {/* Main point circle */}
                    <div 
                      onClick={() => point.type === 'equipment' && onJcClick(point.raw as Equipment)}
                      className={`relative w-4 h-4 rounded-full border-4 flex items-center justify-center transition-all duration-300 z-10 shadow-lg ${
                        point.type === 'site' 
                          ? 'bg-blue-600 border-blue-200 hover:bg-blue-700' 
                          : point.status === 'existing' 
                            ? 'bg-green-600 border-green-200 hover:bg-green-700' 
                            : 'bg-yellow-500 border-yellow-200 hover:bg-yellow-600'
                      } ${point.type === 'equipment' ? 'cursor-pointer hover:scale-125' : ''}`}
                      title={`${point.name} at ${km} km`}
                    >
                      <span className='text-white font-bold text-xs'>
                        {point.type === 'site' ? 'N' : 'J'}
                      </span>
                    </div>
                    
                    {/* Distance label - below */}
                    <div className="absolute top-8 text-center min-w-max">
                      <p className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded border dark:border-gray-600">
                        {km} km
                      </p>
                    </div>
                    
                    {/* Action buttons for equipment */}
                    {point.type === 'equipment' && (
                      <div className="absolute top-16 flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditJc(point.raw as Equipment);
                          }} 
                          className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors shadow-sm border border-blue-200" 
                          title="Edit JC"
                        >
                          <Edit size={12} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteJc(point.id!);
                          }} 
                          className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors shadow-sm border border-red-200" 
                          title="Delete JC"
                        >
                          <Trash2 size={12} />
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
      
      {/* Cable segments section */}
      <div className="border-t dark:border-gray-600 pt-6">
        <h4 className="font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
          <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
          Cable Segments
        </h4>
        {segments.length > 0 ? (
          <div className="space-y-2">
            {segments.map((seg, index) => {
              const start = allPoints.find(p => p.id === seg.start_node_id);
              const end = allPoints.find(p => p.id === seg.end_node_id);
              return (
                <motion.div 
                  key={seg.id} 
                  className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border dark:border-gray-600/50 hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className="flex justify-between items-center">
                    <div className="text-gray-800 dark:text-gray-200">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mr-3">
                        Segment #{seg.segment_order}
                      </span>
                      <span className="text-sm">
                        <span className="font-medium">{start?.name || 'N/A'}</span>
                        <span className="mx-2 text-gray-400">→</span>
                        <span className="font-medium">{end?.name || 'N/A'}</span>
                      </span>
                    </div>
                    <span className='font-mono text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full border dark:border-gray-500'>
                      {seg.distance_km} km
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className='text-center text-sm text-gray-500 dark:text-gray-400 py-8 bg-gray-50 dark:bg-gray-700/30 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600'>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <span className="text-xs">—</span>
              </div>
              <p>No segments to display</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}