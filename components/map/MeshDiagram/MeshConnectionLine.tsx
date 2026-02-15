// components/map/MeshDiagram/MeshConnectionLine.tsx
'use client';

import { Polyline, Popup } from 'react-leaflet';
import { getCurvedPath, getLoopPath } from '@/utils/mapUtils';
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

  // ---------------------------------------------------------------------------
  // QUERY 1: CONFIGURATION (logical_paths) - Header
  // ---------------------------------------------------------------------------
  const { data: configuredPaths = [], refetch: refetchConfig } = useQuery({
    queryKey: [
      'logical_paths',
      'mesh-segment',
      start.id,
      end.id,
    ],
    queryFn: async () => {
      if (!start.id || !end.id) return [];
      // Use standard bidirectional filter
      const filter = `and(source_system_id.eq.${start.id},destination_system_id.eq.${end.id}),and(source_system_id.eq.${end.id},destination_system_id.eq.${start.id})`;
      const { data, error } = await supabase
        .from('logical_paths')
        .select('id, name, status, remark')
        .or(filter);

      if (error) throw error;
      return data;
    },
    enabled: shouldFetch && !!start.id && !!end.id,
    staleTime: 1000 * 60 * 5,
  });

  // ---------------------------------------------------------------------------
  // QUERY 2: PROVISIONING (logical_fiber_paths) - Details
  // ---------------------------------------------------------------------------
  const { data: provisionedPaths = []} = useQuery({
    queryKey: [
      'logical_fiber_paths',
      'mesh-segment',
      start.id,
      end.id,
    ],
    queryFn: async () => {
      if (!start.id || !end.id) return [];
      const filter = `and(source_system_id.eq.${start.id},destination_system_id.eq.${end.id}),and(source_system_id.eq.${end.id},destination_system_id.eq.${start.id})`;
      
      const { data, error } = await supabase
        .from('logical_fiber_paths')
        .select('id, system_connection_id, remark')
        .or(filter);

      if (error) throw error;
      return data;
    },
    enabled: shouldFetch && !!start.id && !!end.id,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    // 1. Get Name from Configuration (Primary)
    const configPath = configuredPaths[0];
    // 2. Get Connection ID from Provisioning (If exists)
    const provPath = provisionedPaths[0];

    // Priority: Display configured name. If not configured but somehow provisioned, use fallback.
    const serviceName = configPath?.name;
    const sysConnectionId = provPath?.system_connection_id || undefined;
    const remark = configPath?.remark || provPath?.remark || '';

    setAllotedService(serviceName || config?.cableName);
    setConnectionId(sysConnectionId || config?.connectionId);

    if (!isEditingRemark) {
      setRemarkText(remark);
    }
  }, [configuredPaths, provisionedPaths, config, isEditingRemark]);

  const { mutate: saveRemark, isPending: isSaving } = useMutation({
    mutationFn: async (text: string) => {
      const existingPath = configuredPaths[0];

      if (existingPath) {
        const { error } = await supabase
          .from('logical_paths')
          .update({ remark: text })
          .eq('id', existingPath.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('logical_paths').insert({
          source_system_id: start.id,
          destination_system_id: end.id,
          remark: text,
          name: `Manual Link: ${start.name} - ${end.name}`,
          status: 'manual',
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Remark saved successfully');
      setIsEditingRemark(false);
      refetchConfig();
      queryClient.invalidateQueries({ queryKey: ['logical_paths'] });
    },
    onError: (err: Error) => {
      toast.error(`Failed to save remark: ${err.message}`);
    },
  });

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveRemark(remarkText);
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingRemark(false);
    setRemarkText(configuredPaths[0]?.remark || '');
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingRemark(true);
  };

  let color = isSpur ? (isDark ? '#b4083f' : '#ff0066') : isDark ? '#60a5fa' : '#3b82f6';
  if (customColor) {
    color = customColor;
  }

  // Count as configured if logical path exists (Configured OR Provisioned)
  const hasConfig =
    (config &&
      (config.source || (config.fiberMetrics && config.fiberMetrics.length > 0) || config.cableName)) ||
    configuredPaths.length > 0 || 
    provisionedPaths.length > 0;

  // --- PATH CALCULATION ---
  const positions = useMemo(() => {
    const dist = startPos.distanceTo(endPos);
    const isSelf = start.id === end.id;

    if (dist < 50 || isSelf) {
      const loopIndex = Math.round(curveOffset * 10);
      return getLoopPath(startPos, loopIndex, 120);
    }

    if (curveOffset !== 0) {
      return getCurvedPath(startPos, endPos, curveOffset);
    }

    if (isSpur || nodesLength !== 2) {
      return [startPos, endPos];
    }

    return getCurvedPath(startPos, endPos, 0.15);

  }, [startPos, endPos, start.id, end.id, curveOffset, isSpur, nodesLength]);

  const hitWeight = isMobile ? 30 : 5;

  return (
    <>
      {/* 1. VISUAL LINE */}
      <Polyline
        key={`visual-${start.id}-${end.id}-${curveOffset}`}
        positions={positions}
        pathOptions={{
          color: color,
          weight: isSpur ? 2 : 4,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round',
          dashArray: isSpur ? '10, 10' : undefined,
          interactive: false,
        }}
      />

      {/* 2. HIT BOX LINE (Interactive) */}
      <Polyline
        key={`hitbox-${start.id}-${end.id}-${curveOffset}`}
        positions={positions}
        pathOptions={{
          color: 'transparent',
          weight: hitWeight,
          opacity: 0,
        }}
        eventHandlers={{
          click: () => setIsInteracted(true),
          popupopen: () => setIsInteracted(true),
        }}
      >
        <Popup className={isDark ? 'dark-popup' : ''} minWidth={280} maxWidth={350}>
          <div className='text-sm w-full'>
            {hasConfig ? (
              <div className='mb-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden'>
                <div className='divide-y divide-gray-100 dark:divide-gray-700'>
                   {/* Passes the Name from logical_paths and the ID from logical_fiber_paths */}
                  <PopupFiberRow connectionId={connectionId} allotedService={allotedService} />
                </div>
              </div>
            ) : (
              !isSpur && (
                <div className='mb-2 text-xs text-gray-400 dark:text-gray-500 italic border border-dashed border-gray-300 dark:border-gray-600 p-2 rounded text-center'>
                  Physical link not provisioned
                </div>
              )
            )}

            <PopupRemarksRow
              remark={remarkText}
              isEditing={isEditingRemark}
              editText={remarkText}
              isSaving={isSaving}
              onEditClick={handleEditClick}
              onSaveClick={handleSaveClick}
              onCancelClick={handleCancelClick}
              onTextChange={setRemarkText}
            />
          </div>
        </Popup>
      </Polyline>
    </>
  );
};