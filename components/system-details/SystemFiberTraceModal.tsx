import React from 'react';
import { AlertCircle, ArrowRight, Network, Radio, Shield, X } from 'lucide-react';
import { TraceRoutes } from '@/hooks/database/trace-hooks';

// Tracing Modal Component
const SystemFiberTraceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  traceData: TraceRoutes | null;
  isLoading?: boolean;
}> = ({ isOpen, onClose, traceData, isLoading = false }) => {
  if (!isOpen) return null;

  const RouteDisplay = ({
    title,
    route,
    icon: Icon,
    color,
  }: {
    title: string;
    route: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: any;
    color: string;
  }) => {
    const segments = route.split(' → ');
    const hasRoute = route !== 'No route configured';

    return (
      <div className="mb-6 last:mb-0">
        <div className="flex items-center gap-2 mb-3">
          <Icon className={`w-5 h-5 ${color}`} />
          <h3 className="font-semibold text-gray-800 dark:text-white">{title}</h3>
        </div>

        {hasRoute ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-2">
              {segments.map((segment, idx) => (
                <React.Fragment key={idx}>
                  <div className="bg-white dark:bg-gray-700 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 shadow-sm">
                    <span className="font-mono text-sm text-gray-700 dark:text-gray-200">
                      {segment}
                    </span>
                  </div>
                  {idx < segments.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
            <span className="text-sm text-amber-700 dark:text-amber-300">{route}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        {/* FIX: Added bg-blue-600 as fallback */}
        <div className="bg-blue-600 bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Network className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Service Path Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Tracing fiber paths...</p>
            </div>
          ) : traceData ? (
            <>
              {/* Working Paths */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-200 dark:border-blue-800">
                  <Radio className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">Working Paths</h3>
                </div>
                <RouteDisplay
                  title="Tx (Transmit) Path"
                  route={traceData.workingTx}
                  icon={ArrowRight}
                  color="text-blue-600 dark:text-blue-400"
                />
                <RouteDisplay
                  title="Rx (Receive) Path"
                  route={traceData.workingRx}
                  icon={ArrowRight}
                  color="text-green-600 dark:text-green-400"
                />
              </div>

              {/* Protection Paths */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-purple-200 dark:border-purple-800">
                  <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                    Protection Paths
                  </h3>
                </div>
                <RouteDisplay
                  title="Tx (Transmit) Path"
                  route={traceData.protectionTx}
                  icon={ArrowRight}
                  color="text-blue-600 dark:text-blue-400"
                />
                <RouteDisplay
                  title="Rx (Receive) Path"
                  route={traceData.protectionRx}
                  icon={ArrowRight}
                  color="text-green-600 dark:text-green-400"
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <AlertCircle className="w-12 h-12 mb-4" />
              <p>No trace data available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemFiberTraceModal;
