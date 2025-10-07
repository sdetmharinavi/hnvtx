// path: components/ofc-details/FiberTraceVisualizer.tsx
"use client";

import { Button } from "@/components/common/ui";
import { useSyncPathFromTrace, useSyncPathUpdates } from "@/hooks/database/route-manager-hooks";
import { FiberTraceSegment, PathToUpdate } from "@/schemas/custom-schemas";
import { Cable, GitBranch, MapPin, Milestone, RefreshCw, Route } from "lucide-react";

interface FiberTraceVisualizerProps {
  traceData: FiberTraceSegment[];
  onSync: () => void;
  isSyncing: boolean;
}

const SegmentStep = ({ item }: { item: FiberTraceSegment }) => {
  return (
    <li className='mb-10 ml-8'>
      <span className='absolute -left-4 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 ring-8 ring-white dark:bg-blue-900 dark:ring-gray-900'>
        <Route className='h-4 w-4 text-blue-600 dark:text-blue-300' />
      </span>
      <div className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800'>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-md font-semibold text-gray-900 dark:text-white'>{item.element_name}</h3>
          <span className='rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-300'>SEGMENT</span>
        </div>
        <p className='mb-3 text-sm font-normal text-gray-500 dark:text-gray-400'>{item.details}</p>
        <div className='grid grid-cols-2 gap-2 text-xs text-gray-700 dark:text-gray-300'>
          <span>
            <strong>Fiber:</strong> <span className='font-mono'>{item.fiber_in}</span>
          </span>
          <span>
            <strong>Length:</strong> <span className='font-mono'>{item.distance_km?.toFixed(2)} km</span>
          </span>
        </div>
      </div>
    </li>
  );
};

// Small helper component for rendering a single SPLICE step
const SpliceStep = ({ item, prevStep }: { item: FiberTraceSegment; prevStep: FiberTraceSegment | undefined }) => {
  // Gracefully handle the case where the first fiber_in is null
  const fiberIn = item.fiber_in ?? prevStep?.fiber_out;

  return (
    <li className='mb-10 ml-8'>
      <span className='absolute -left-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white dark:bg-gray-700 dark:ring-gray-900'>
        <GitBranch className='h-4 w-4 text-gray-600 dark:text-gray-300' />
      </span>
      <div className='rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800/50'>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-md font-semibold text-gray-900 dark:text-white'>{item.element_name}</h3>
          <span className='rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-300'>SPLICE</span>
        </div>
        <p className='mb-3 text-sm font-normal text-gray-500 dark:text-gray-400'>{item.details}</p>
        <div className='grid grid-cols-2 gap-2 text-xs text-gray-700 dark:text-gray-300'>
          <span>
            <strong>In → Out:</strong>{" "}
            <span className='font-mono font-bold'>
              {fiberIn} → {item.fiber_out}
            </span>
          </span>
          <span>
            <strong>Loss:</strong> <span className='font-mono'>{item.loss_db?.toFixed(2)} dB</span>
          </span>
        </div>
      </div>
    </li>
  );
};

export const FiberTraceVisualizer: React.FC<FiberTraceVisualizerProps> = ({ traceData, onSync, isSyncing }) => {
  const syncPathMutation = useSyncPathFromTrace();

  // Extract start and end node names from the details of the first and last segments
  const firstSegment = traceData.find((s) => s.element_type === "SEGMENT");
  const lastSegment = [...traceData].reverse().find((s) => s.element_type === "SEGMENT");
  const startNodeName = firstSegment?.details.match(/^(?:Segment \d+ \()(.+?)(?: →)/)?.[1] || "Unknown Start";
  const endNodeName = lastSegment?.details.match(/(?:→ )(.+?)(?:\))$/)?.[1] || "Unknown End";

  if (!traceData || traceData.length === 0) {
    return (
      <div className='p-8 text-center text-gray-500 dark:text-gray-400'>
        <Cable className='mx-auto h-12 w-12 text-gray-400 dark:text-gray-500' />
        <h4 className='mt-4 text-lg font-semibold text-gray-800 dark:text-gray-200'>No Trace Data</h4>
        <p className='mt-2 text-sm'>Could not find a path for this fiber.</p>
      </div>
    );
  }

  return (
    <div className='p-4 font-sans relative'>
      <Button 
        className='absolute top-0 right-10 z-10 animate-pulse' 
        onClick={onSync}
        disabled={isSyncing}
        leftIcon={isSyncing ? <RefreshCw className="animate-spin" /> : <RefreshCw />}
      >
        {isSyncing ? "Syncing..." : "Sync Path to DB"}
      </Button>
      <ol className='relative border-l-2 border-gray-300 dark:border-gray-700 ml-4'>
        {/* START POINT */}
        <li className='mb-10 ml-8'>
          <span className='absolute -left-4 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 ring-8 ring-white dark:bg-green-900 dark:ring-gray-900'>
            <MapPin className='h-4 w-4 text-green-600 dark:text-green-300' />
          </span>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>{startNodeName}</h3>
          <p className='text-sm text-gray-500 dark:text-gray-400'>Path Start</p>
        </li>

        {/* DYNAMIC PATH STEPS */}
        {traceData.map((item, index) => {
          if (item.element_type === "SEGMENT") {
            return <SegmentStep key={`${item.element_id}-${index}`} item={item} />;
          } else if (item.element_type === "SPLICE") {
            const prevStep = traceData[index - 1];
            return <SpliceStep key={`${item.element_id}-${index}`} item={item} prevStep={prevStep} />;
          }
          return null;
        })}

        {/* END POINT */}
        <li className='ml-8'>
          <span className='absolute -left-4 flex h-8 w-8 items-center justify-center rounded-full bg-red-100 ring-8 ring-white dark:bg-red-900 dark:ring-gray-900'>
            <Milestone className='h-4 w-4 text-red-600 dark:text-red-300' />
          </span>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>{endNodeName}</h3>
          <p className='text-sm text-gray-500 dark:text-gray-400'>Path End</p>
        </li>
      </ol>
    </div>
  );
};
