// components/route-manager/ui/CommitView.tsx
"use client";

import { Equipment, CableSegment, FiberSplice } from '@/components/route-manager/types';

interface Props {
  equipment: Equipment[];
  segments: CableSegment[];
  splices: FiberSplice[]; // Pass the calculated splices for a full summary
  onCommit: () => void;
  isCommitting: boolean;
}

export default function CommitView({ equipment, segments, splices, onCommit, isCommitting }: Props) {
  const plannedJCs = equipment.filter(eq => eq.status === 'planned');

  if (plannedJCs.length === 0) {
    return (
        <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-center">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Nothing to Commit</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Add one or more new Junction Closures to the route before committing.
            </p>
        </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Review & Commit Changes</h4>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          This will permanently update the route structure by adding {plannedJCs.length} new junction closure(s) and creating {segments.length} new cable segments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            <span className="text-green-500 font-mono text-xs py-1 px-2 bg-green-100 dark:bg-green-900 rounded mr-2">ADD</span>
            New Junction Closures
          </h4>
          <ul className="space-y-2">
            {plannedJCs.map(jc => (
              <li key={jc.id} className="flex justify-between text-sm">
                <span className="font-medium text-gray-800 dark:text-gray-200">{jc.name}</span>
                <span className="text-gray-600 dark:text-gray-400">{jc.attributes.position_on_route}% on route</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            <span className="text-green-500 font-mono text-xs py-1 px-2 bg-green-100 dark:bg-green-900 rounded mr-2">CREATE</span>
            New Cable Segments
          </h4>
          <ul className="space-y-2">
            {segments.map(segment => (
              <li key={segment.id} className="flex justify-between text-sm">
                <span className="text-gray-800 dark:text-gray-200">
                  Segment #{segment.segment_order}
                </span>
                <span className="text-gray-600 dark:text-gray-400">{segment.distance_km} km</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {splices.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                <span className="text-green-500 font-mono text-xs py-1 px-2 bg-green-100 dark:bg-green-900 rounded mr-2">CREATE</span>
                New Fiber Splices
            </h4>
            <div className="text-center text-sm text-gray-700 dark:text-gray-300">
                A total of <span className="font-bold text-lg">{splices.length}</span> default "through" splices will be created.
            </div>
        </div>
      )}

      <div className="flex justify-end mt-6">
        <button
          onClick={onCommit}
          disabled={isCommitting}
          className="px-8 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-wait"
        >
          {isCommitting ? 'Committing...' : 'Confirm & Commit Evolution'}
        </button>
      </div>
    </div>
  );
}