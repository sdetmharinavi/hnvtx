// components/map/MeshDiagram/MeshConnectionLine.tsx
'use client';

import { Polyline, Popup } from 'react-leaflet';
import { getCurvedPath } from '@/utils/mapUtils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { MeshConnectionLineProps } from './types';
import { PopupFiberRow } from '@/components/map/PopupFiberRow';
import { MessageSquare, Edit2, X, Save } from 'lucide-react';
import { ButtonSpinner } from '@/components/common/ui';
import { toast } from 'sonner';

type LogicalPath = {
  id: string;
  path_name: string;
  path_role: string | null;
  system_connection_id: string | null;
  bandwidth_gbps: number | null;
  remark: string | null;
};

export const MeshConnectionLine = ({
  startPos,
  endPos,
  isSpur,
  config,
  theme,
  nodesLength,
  customColor,
  start,
  end,
  curveOffset = 0,
}: MeshConnectionLineProps) => {
  const isDark = theme === 'dark';
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [isInteracted, setIsInteracted] = useState(false);
  const shouldFetch = isInteracted;

  const [connectionId, setConnectionId] = useState<string | undefined>(undefined);
  const [allotedService, setAllotedService] = useState<string | undefined>(undefined);
  const [hasActiveService, setHasActiveService] = useState(false);

  // --- Local State for Remarks UI ---
  const [isEditingRemark, setIsEditingRemark] = useState(false);
  const [remarkText, setRemarkText] = useState('');

  // --- LOGICAL PATH QUERY ---
  const { data: logicalPaths = [], refetch } = useQuery<LogicalPath[]>({
    // THE FIX: Changed key to start with 'logical_fiber_paths' for correct invalidation
    queryKey: [
      'logical_fiber_paths',
      'mesh-segment',
      start.id,
      end.id,
      config?.sourcePort,
      config?.destPort,
    ],
    queryFn: async () => {
      if (!start.id || !end.id) return [];

      const srcPort = config?.sourcePort;
      const dstPort = config?.destPort;
      let filter = '';

      if (srcPort && dstPort) {
        const dir1 = `and(source_system_id.eq.${start.id},destination_system_id.eq.${end.id},source_port.eq.${srcPort},destination_port.eq.${dstPort})`;
        const dir2 = `and(source_system_id.eq.${end.id},destination_system_id.eq.${start.id},source_port.eq.${dstPort},destination_port.eq.${srcPort})`;
        filter = `${dir1},${dir2}`;
      } else {
        filter = `and(source_system_id.eq.${start.id},destination_system_id.eq.${end.id}),and(source_system_id.eq.${end.id},destination_system_id.eq.${start.id})`;
      }

      const { data, error } = await supabase
        .from('logical_fiber_paths')
        .select('id, path_name, path_role, system_connection_id, bandwidth_gbps, remark')
        .or(filter);

      if (error) throw error;
      return data;
    },
    enabled: shouldFetch && !!start.id && !!end.id,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (logicalPaths.length > 0) {
      setConnectionId(logicalPaths[0].system_connection_id || undefined);
      setAllotedService(logicalPaths[0].path_name || undefined);
      setHasActiveService(!!logicalPaths[0].system_connection_id);

      if (!isEditingRemark) {
        setRemarkText(logicalPaths[0].remark || '');
      }
    } else if (config?.connectionId) {
      setConnectionId(config.connectionId);
      setHasActiveService(false);
    } else {
      setHasActiveService(false);
    }
  }, [logicalPaths, config?.connectionId, isEditingRemark]);

  // --- REMARK MUTATION ---
  const { mutate: saveRemark, isPending: isSaving } = useMutation({
    mutationFn: async (text: string) => {
      const existingPath = logicalPaths[0];

      if (existingPath) {
        const { error } = await supabase
          .from('logical_fiber_paths')
          .update({ remark: text })
          .eq('id', existingPath.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('logical_fiber_paths').insert({
          source_system_id: start.id,
          destination_system_id: end.id,
          // THE FIX: Insert ports from config
          source_port: config?.sourcePort || null,
          destination_port: config?.destPort || null,
          remark: text,
          path_name: `Manual Link: ${start.name} - ${end.name}`,
          path_role: 'working',
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Remark saved successfully');
      setIsEditingRemark(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['logical_fiber_paths'] });
    },
    onError: (err: Error) => {
      toast.error(`Failed to save remark: ${err.message}`);
    },
  });

  // Updated handlers with stopPropagation
  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveRemark(remarkText);
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingRemark(false);
    setRemarkText(logicalPaths[0]?.remark || '');
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingRemark(true);
  };

  let color = isSpur ? (isDark ? '#b4083f' : '#ff0066') : isDark ? '#60a5fa' : '#3b82f6';
  if (customColor) {
    color = customColor;
  }

  const hasConfig =
    config &&
    (config.source || (config.fiberMetrics && config.fiberMetrics.length > 0) || config.cableName);

  // CURVE LOGIC
  let positions;
  if (curveOffset !== 0) {
    positions = getCurvedPath(startPos, endPos, curveOffset);
  } else if (isSpur || nodesLength !== 2) {
    // THE FIX: Use dashed line for spurs
    positions = [startPos, endPos];
  } else {
    positions = getCurvedPath(startPos, endPos, 0.15);
  }

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: color,
        weight: isSpur ? 2 : 4,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round',
        // THE FIX: Add dashArray for spurs
        dashArray: isSpur ? '10, 10' : undefined,
      }}
      eventHandlers={{
        click: () => setIsInteracted(true),
        popupopen: () => setIsInteracted(true),
      }}
    >
      <Popup className={isDark ? 'dark-popup' : ''} minWidth={280} maxWidth={350}>
        <div className="text-sm w-full">
          {hasConfig ? (
            <div className="mb-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                <PopupFiberRow connectionId={connectionId} allotedService={allotedService} />
              </div>
            </div>
          ) : (
            !isSpur && (
              <div className="mb-2 text-xs text-gray-400 dark:text-gray-500 italic border border-dashed border-gray-300 dark:border-gray-600 p-2 rounded text-center">
                Physical link not provisioned
              </div>
            )
          )}

          {/* Remarks Section for Mesh - Only if no service */}
          {!hasActiveService && (
            <div className="mb-2 bg-gray-50 dark:bg-gray-900/40 rounded-lg p-2 border border-gray-200 dark:border-gray-700 group hover:shadow-sm transition-all">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                  <MessageSquare size={12} />
                  <span>Remarks</span>
                </div>
                {!isEditingRemark && (
                  <button
                    onClick={handleEditClick}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-blue-600 dark:text-blue-400 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Edit Remarks"
                  >
                    <Edit2 size={12} />
                  </button>
                )}
              </div>

              {isEditingRemark ? (
                <div className="space-y-2">
                  <textarea
                    className="w-full text-xs p-2 rounded border border-blue-300 dark:border-blue-700 focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    rows={3}
                    value={remarkText}
                    onChange={(e) => setRemarkText(e.target.value)}
                    placeholder="Enter remarks..."
                    onKeyDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleCancelClick}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                    <button
                      onClick={handleSaveClick}
                      disabled={isSaving}
                      className="p-1 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                      title="Save"
                    >
                      {isSaving ? <ButtonSpinner size="xs" /> : <Save size={14} />}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-900 dark:text-gray-400 italic wrap-break-words pl-1 min-h-[1.2em]">
                  {remarkText || 'No remarks added.'}
                </p>
              )}
            </div>
          )}
        </div>
      </Popup>
    </Polyline>
  );
};
