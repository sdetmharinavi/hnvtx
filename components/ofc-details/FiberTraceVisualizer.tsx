// path: components/ofc-details/FiberTraceVisualizer.tsx
'use client';

import { FiberTraceSegment } from '@/schemas/custom-schemas';
import { Cable, GitBranch, MapPin } from 'lucide-react';

interface FiberTraceVisualizerProps {
  traceData: FiberTraceSegment[];
}

export const FiberTraceVisualizer: React.FC<FiberTraceVisualizerProps> = ({ traceData }) => {
    // FIX: Check for empty array and show a user-friendly message.
  if (!traceData || traceData.length === 0) {
    return (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <GitBranch className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h4 className="mt-4 text-lg font-semibold text-gray-800 dark:text-gray-200">Path Ends Here</h4>
            <p className="mt-2 text-sm">This fiber is not spliced to any other segment from this point.</p>
        </div>
    );
  }

  return (
    <div className="p-4 font-sans">
      <ol className="relative border-l-2 border-blue-200 dark:border-blue-800 ml-4">
        {traceData.map((segment, index) => {
          const [startNode, endNode] = segment.details.split(' → ');
          const isLastSegment = index === traceData.length - 1;

          return (
            <li key={segment.element_id} className="mb-10 ml-8">
              {/* Step Icon */}
              <span className="absolute -left-4 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 ring-8 ring-white dark:bg-blue-900 dark:ring-gray-800">
                <Cable className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              </span>
              
              {/* Segment Info */}
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="text-md font-semibold text-gray-900 dark:text-white">{segment.element_name}</h3>
                <p className="mb-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  {segment.details}
                </p>
                <div className="flex items-center space-x-4 text-xs text-gray-700 dark:text-gray-300">
                  <span><strong>Segment:</strong> {segment.step_order}</span>
                  <span><strong>Fiber In:</strong> {segment.fiber_in}</span>
                  <span><strong>Length:</strong> {segment.distance_km} km</span>
                </div>
              </div>

              {/* Splice/Termination Info */}
              <div className="mt-3 flex items-center">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 ring-4 ring-white dark:bg-gray-700 dark:ring-gray-800">
                  <GitBranch className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                </span>
                <div className="ml-2 text-xs font-mono text-gray-500 dark:text-gray-400">
                  {isLastSegment ? (
                    <span className="font-semibold text-red-600 dark:text-red-400">TERMINATES AT {endNode}</span>
                  ) : (
                    <span>
                      Splice at {endNode}: Fiber <span className="font-bold">{segment.fiber_in}</span> → <span className="font-bold">{segment.fiber_out}</span>
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
         <li className="ml-8">
            <span className="absolute -left-4 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 ring-8 ring-white dark:bg-green-900 dark:ring-gray-800">
                <MapPin className="h-4 w-4 text-green-600 dark:text-green-300" />
            </span>
            <div className="p-4">
                <h3 className="text-md font-semibold text-gray-900 dark:text-white">Path End</h3>
            </div>
        </li>
      </ol>
    </div>
  );
};