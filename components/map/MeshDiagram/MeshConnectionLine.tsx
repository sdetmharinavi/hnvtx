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
import L from 'leaflet';

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
  const isMobile = useIsMobile();

  const [connectionId, setConnectionId] = useState<string | undefined>(undefined);
  const [allotedService, setAllotedService] = useState<string | undefined>(undefined);
  const [isEditingRemark, setIsEditingRemark] = useState(false);
  const [remarkText, setRemarkText] = useState('');

  const { data: logicalPaths = [], refetch } = useQuery<LogicalPath[]>({
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

      if (!isEditingRemark) {
        setRemarkText(logicalPaths[0].remark || '');
      }
    } else if (config?.connectionId) {
      setConnectionId(config.connectionId);
    }
  }, [logicalPaths, config?.connectionId, isEditingRemark]);

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

  // --- PATH CALCULATION ---
  const positions = useMemo(() => {
    // 1. Check distance in Schematic Pixels
    // In CRS.Simple, these are abstract units.
    // If distance is very small (e.g., overlapping or adjacent due to sort), treat as loop.
    const dist = startPos.distanceTo(endPos);
    const isSelf = start.id === end.id;

    if (dist < 50 || isSelf) {
      // Use loop path for self-connections or very close nodes
      // Map curveOffset to an integer index to stack multiple loops if needed
      const loopIndex = Math.round(curveOffset * 10); 
      return getLoopPath(startPos, loopIndex, 120);
    } 
    
    if (curveOffset !== 0) {
      // Explicit curve (parallel lines)
      return getCurvedPath(startPos, endPos, curveOffset);
    } 
    
    if (isSpur || nodesLength !== 2) {
      // Default: If it's a spur or complex ring, use straight line
      return [startPos, endPos];
    }
    
    // Default: If simple 2-node ring, use slight curve for aesthetics
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