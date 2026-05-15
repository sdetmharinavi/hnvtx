// components/map/MeshDiagram/MeshConnectionLine.tsx
'use client';

import { Polyline, Popup } from 'react-leaflet';
import { getCurvedPath, getLoopPath, getDynamicLineWeight } from '@/utils/mapUtils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState, useMemo } from 'react';
import { MeshConnectionLineProps } from './types';
import { PopupFiberRow } from '@/components/map/PopupFiberRow';
import { toast } from 'sonner';
import { PopupRemarksRow } from '@/components/map/PopupRemarksRow';
import useIsMobile from '@/hooks/useIsMobile';

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
  const isMobile = useIsMobile();

  const [connectionId, setConnectionId] = useState<string | undefined>(undefined);
  const [allotedService, setAllotedService] = useState<string | undefined>(undefined);
  const [isEditingRemark, setIsEditingRemark] = useState(false);
  const [remarkText, setRemarkText] = useState('');

  // THE FIX: Removed 'remark' from logical_paths selection
  const { data: configuredPaths = [], refetch: refetchConfig } = useQuery({
    queryKey: ['logical_paths', 'mesh-segment', start.id, end.id],
    queryFn: async () => {
      if (!start.id || !end.id) return [];

      const { data, error } = await supabase
        .from('logical_paths')
        .select('id, name, source_system_id, destination_system_id')
        .in('source_system_id', [start.id, end.id])
        .in('destination_system_id', [start.id, end.id]);

      if (error) throw error;

      return data.filter(
        (p) =>
          (p.source_system_id === start.id && p.destination_system_id === end.id) ||
          (p.source_system_id === end.id && p.destination_system_id === start.id),
      );
    },
    enabled: shouldFetch && !!start.id && !!end.id,
  });

  const { data: provisionedPaths = [] } = useQuery({
    queryKey: ['logical_fiber_paths', 'mesh-segment', start.id, end.id],
    queryFn: async () => {
      if (!start.id || !end.id) return [];

      const { data, error } = await supabase
        .from('logical_fiber_paths')
        .select('id, system_connection_id, remark, source_system_id, destination_system_id')
        .in('source_system_id', [start.id, end.id])
        .in('destination_system_id', [start.id, end.id]);

      if (error) throw error;

      return data.filter(
        (p) =>
          (p.source_system_id === start.id && p.destination_system_id === end.id) ||
          (p.source_system_id === end.id && p.destination_system_id === start.id),
      );
    },
    enabled: shouldFetch && !!start.id && !!end.id,
  });

  useEffect(() => {
    const configPath = configuredPaths[0];
    const provPath = provisionedPaths[0];
    setAllotedService(configPath?.name || config?.cableName);
    setConnectionId(provPath?.system_connection_id || config?.connectionId);
    // THE FIX: Only attempt to pull remarks from provisionedPaths as logical_paths has no remark column
    if (!isEditingRemark) setRemarkText(provPath?.remark || '');
  }, [configuredPaths, provisionedPaths, config, isEditingRemark]);

  const { mutate: saveRemark, isPending: isSaving } = useMutation({
    mutationFn: async (text: string) => {
      const existingPath = provisionedPaths[0];
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
          remark: text,
          path_name: `Remark for Link: ${start.name} - ${end.name}`,
          path_role: 'working',
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Remark saved successfully');
      setIsEditingRemark(false);
      refetchConfig();
      queryClient.invalidateQueries({ queryKey: ['logical_fiber_paths'] });
    },
    onError: (err: Error) => toast.error(`Failed to save remark: ${err.message}`),
  });

  let color = isSpur ? (isDark ? '#b4083f' : '#ff0066') : isDark ? '#60a5fa' : '#3b82f6';
  if (customColor) color = customColor;

  const hasConfig =
    (config &&
      (config.source ||
        (config.fiberMetrics && config.fiberMetrics.length > 0) ||
        config.cableName)) ||
    configuredPaths.length > 0 ||
    provisionedPaths.length > 0;

  const positions = useMemo(() => {
    const dist = startPos.distanceTo(endPos);
    const isSelf = start.id === end.id;
    if (dist < 50 || isSelf) return getLoopPath(startPos, Math.round(curveOffset * 10), 120);
    if (curveOffset !== 0) return getCurvedPath(startPos, endPos, curveOffset);
    if (isSpur || nodesLength !== 2) return [startPos, endPos];
    return getCurvedPath(startPos, endPos, 0.15);
  }, [startPos, endPos, start.id, end.id, curveOffset, isSpur, nodesLength]);

  const baseWeight = isSpur ? 2 : 4;
  const dynamicWeight = getDynamicLineWeight(config?.bandwidthGbps, baseWeight);

  return (
    <>
      <Polyline
        key={`visual-${start.id}-${end.id}-${curveOffset}`}
        positions={positions}
        pathOptions={{
          color,
          weight: dynamicWeight,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round',
          dashArray: isSpur ? '10, 10' : undefined,
          interactive: false,
        }}
      />
      <Polyline
        key={`hitbox-${start.id}-${end.id}-${curveOffset}`}
        positions={positions}
        pathOptions={{ color: 'transparent', weight: isMobile ? 30 : 15, opacity: 0 }}
        eventHandlers={{
          click: () => setIsInteracted(true),
          popupopen: () => setIsInteracted(true),
        }}>
        <Popup className={isDark ? 'dark-popup' : ''} minWidth={280} maxWidth={350}>
          <div className='text-sm w-full'>
            {hasConfig ? (
              <div className='mb-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden'>
                <div className='divide-y divide-gray-100 dark:divide-gray-700'>
                  <PopupFiberRow connectionId={connectionId} allotedService={allotedService} />
                </div>
              </div>
            ) : !isSpur ? (
              <div className='mb-2 text-xs text-gray-400 dark:text-gray-500 italic border border-dashed border-gray-300 dark:border-gray-600 p-2 rounded text-center'>
                Physical link not provisioned
              </div>
            ) : null}
            <PopupRemarksRow
              remark={remarkText}
              isEditing={isEditingRemark}
              editText={remarkText}
              isSaving={isSaving}
              onEditClick={(e) => {
                e.stopPropagation();
                setIsEditingRemark(true);
              }}
              onSaveClick={(e) => {
                e.stopPropagation();
                saveRemark(remarkText);
              }}
              onCancelClick={(e) => {
                e.stopPropagation();
                setIsEditingRemark(false);
                setRemarkText(provisionedPaths[0]?.remark || '');
              }}
              onTextChange={setRemarkText}
            />
          </div>
        </Popup>
      </Polyline>
    </>
  );
};
