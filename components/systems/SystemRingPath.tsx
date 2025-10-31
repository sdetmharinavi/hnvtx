// path: components/systems/SystemRingPath.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useTableQuery, useTableInsert, useRpcQuery} from "@/hooks/database";
import { Button, PageSpinner, SearchableSelect } from "@/components/common/ui";
import { FiCheckCircle, FiXCircle, FiAlertTriangle } from "react-icons/fi";
import { useSystemPath } from "@/hooks/database/path-queries";
import { useDeletePathSegment, useReorderPathSegments } from "@/hooks/database/path-mutations";
import { DragEndEvent } from "@dnd-kit/core";
import { CreatePathModal } from "./CreatePathModal";
import { PathSegmentList } from "./PathSegmentList";
import { FiberProvisioning } from "./FiberProvisioning";
import ClientRingMap from "@/components/map/ClientRingMap";
import { toast } from "sonner";
import { SystemsRowSchema, NodesRowSchema, V_nodes_completeRowSchema } from "@/schemas/zod-schemas";
import { Option } from "../common/ui/select/SearchableSelect";
import { MapNode } from "@/components/map/types/node";
import { Edit, Eye } from "lucide-react";

interface PathValidationResult {
  status: 'empty' | 'broken' | 'valid_ring' | 'open_path';
  message: string;
}

const PathStatusIndicator = ({ status, message }: PathValidationResult) => {
  const config = useMemo(() => {
    switch (status) {
      case 'valid_ring': return { icon: FiCheckCircle, color: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-900/20' };
      case 'open_path': return { icon: FiCheckCircle, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' };
      case 'broken': return { icon: FiXCircle, color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20' };
      default: return { icon: FiAlertTriangle, color: 'text-yellow-500', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' };
    }
  }, [status]);
  const Icon = config.icon;
  return (
    <div className={`p-3 rounded-lg flex items-center gap-3 border ${config.bgColor} border-current`}>
      <Icon className={`w-6 h-6 flex-shrink-0 ${config.color}`} />
      <div>
        <p className={`font-semibold ${config.color}`}>{status.replace(/_/g, ' ').toUpperCase()}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
      </div>
    </div>
  );
};


interface Props {
  system: SystemsRowSchema & { node: NodesRowSchema | null };
}

type BuilderMode = 'view' | 'build';

export function SystemRingPath({ system }: Props) {
  const supabase = createClient();
  const [isCreatePathModalOpen, setIsCreatePathModalOpen] = useState(false);
  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null);
  const [mode, setMode] = useState<BuilderMode>('view');

  const { data: logicalPathResult, refetch: refetchLogicalPath, isLoading: isLoadingPath } = useTableQuery(supabase, 'logical_fiber_paths', { filters: { source_system_id: system.id }, limit: 1 });
  const path = logicalPathResult?.data[0];

  const { data: pathSegments = [], isLoading: isLoadingSegments, refetch: refetchSegments } = useSystemPath(path?.id || null);
  
  const { data: validationResult, isLoading: isValidating } = useRpcQuery<"validate_ring_path", PathValidationResult>(supabase, 'validate_ring_path', { p_path_id: path?.id ?? '' }, { enabled: !!path?.id && pathSegments.length > 0 });

  const { data: nodesInAreaResult, isLoading: isLoadingNodes } = useTableQuery(supabase, 'v_nodes_complete', { filters: { maintenance_terminal_id: system.maintenance_terminal_id! }, enabled: !!system.maintenance_terminal_id });
  
  const pathNodeIdsToFetch = useMemo(() => {
    if (!pathSegments || pathSegments.length === 0) return [];
    const ids = new Set(pathSegments.flatMap(s => [s.start_node_id, s.end_node_id]));
    return Array.from(ids).filter((id): id is string => id !== null);
  }, [pathSegments]);

  const { data: pathNodesResult, isLoading: isLoadingPathNodes } = useTableQuery(supabase, 'v_nodes_complete', { filters: { id: { operator: 'in', value: pathNodeIdsToFetch } }, enabled: pathNodeIdsToFetch.length > 0 });
  
  const deleteSegmentMutation = useDeletePathSegment();
  const reorderSegmentsMutation = useReorderPathSegments();
  const { mutate: addSegment } = useTableInsert(supabase, 'logical_path_segments', {
    onSuccess: () => { toast.success("Segment added!"); refetchSegments(); },
    onError: (err) => toast.error(`Failed to add segment: ${err.message}`),
  });

  const pathNodeIds = useMemo((): string[] => {
    if (!pathSegments || pathSegments.length === 0) return system.node_id ? [system.node_id] : [];
    const ids = [pathSegments[0].start_node_id, ...pathSegments.map(s => s.end_node_id)];
    return [...new Set(ids)].filter((id): id is string => id !== null);
  }, [pathSegments, system.node_id]);

  const lastNodeInPathId = useMemo(() => (pathSegments?.length > 0) ? pathSegments[pathSegments.length - 1].end_node_id : system.node_id, [pathSegments, system.node_id]);
  
  const mapNodes = useMemo((): MapNode[] => {
    const allNodes = new Map<string, V_nodes_completeRowSchema>();
    (nodesInAreaResult?.data || []).forEach(node => { if(node.id) allNodes.set(node.id, node) });
    (pathNodesResult?.data || []).forEach(node => { if(node.id) allNodes.set(node.id, node) });
    return Array.from(allNodes.values())
      .filter(node => node.latitude != null && node.longitude != null)
      .map(node => ({ 
          id: node.id!, 
          name: node.name!, 
          lat: node.latitude!, 
          long: node.longitude!, 
          type: node.node_type_name, 
          status: node.status, 
          remark: node.remark, 
          ip: null, 
          is_hub: null,
          ring_id: null, 
          ring_name: null, 
          order_in_ring: null, 
          ring_status: null, 
          system_status: null,
          system_type: node.node_type_name || ''
      }));
  }, [nodesInAreaResult, pathNodesResult]);
  
  const nodeOptionsForSearch = useMemo((): Option[] => 
    mapNodes
      .filter(n => n.id && n.name) // Ensure value and label are not null
      .map(n => ({ value: n.id!, label: n.name! })), 
  [mapNodes]);

  const handleNodeClick = useCallback(async (clickedNodeId: string) => {
    if (mode !== 'build') {
      toast.info("Switch to 'Build Mode' to add segments.");
      return;
    }
    if (!path || !lastNodeInPathId || clickedNodeId === lastNodeInPathId) return;
    if (clickedNodeId === system.node_id && pathSegments.length > 0) {
      toast.info("Attempting to close the loop...");
    }
    try {
      const { data: cable, error } = await supabase.rpc('find_cable_between_nodes', { p_node1_id: lastNodeInPathId, p_node2_id: clickedNodeId });
      if (error) throw new Error(`Could not find cable: ${error.message}`);
      if (!cable || (Array.isArray(cable) && cable.length === 0)) {
        toast.warning("No direct cable route found between the selected nodes.");
        return;
      }
      const foundCable = Array.isArray(cable) ? cable[0] : cable;
      addSegment({ logical_path_id: path.id, ofc_cable_id: (foundCable as { id: string }).id, path_order: (pathSegments?.length || 0) + 1 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unknown error occurred");
    }
  }, [path, lastNodeInPathId, pathSegments, addSegment, supabase, mode, system.node_id]);

  const handleNodeSearchSelect = useCallback((nodeId: string | null) => {
    const node = mapNodes.find(n => n.id === nodeId);
    if (node) {
      setFlyToCoords([node?.lat ?? 0, node?.long ?? 0]);
    }
  }, [mapNodes]);
  
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && pathSegments && path) {
      const oldIndex = pathSegments.findIndex(s => s.id === active.id);
      const newIndex = pathSegments.findIndex(s => s.id === over.id);
      const reorderedSegments = Array.from(pathSegments);
      const [movedItem] = reorderedSegments.splice(oldIndex, 1);
      reorderedSegments.splice(newIndex, 0, movedItem);
      const newSegmentIds = reorderedSegments.map(s => s.id).filter((id): id is string => !!id);
      reorderSegmentsMutation.mutate({ pathId: path.id, segmentIds: newSegmentIds });
    }
  }, [path, pathSegments, reorderSegmentsMutation]);

  const handleDeleteSegment = useCallback((segmentId: string) => {
    if (window.confirm("Are you sure you want to remove this segment from the path?") && path) {
      deleteSegmentMutation.mutate({ segmentId, pathId: path.id });
    }
  }, [path, deleteSegmentMutation]);

  if (isLoadingPath || isLoadingNodes || isLoadingPathNodes) return <PageSpinner text="Loading path builder..." />;

  const shouldShowProvisioning = path && pathSegments && pathSegments.length > 0 && validationResult && (validationResult.status === 'valid_ring' || validationResult.status === 'open_path');

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">
        <div className="p-4 border-b dark:border-gray-700 flex flex-wrap gap-4 justify-between items-center">
          <h3 className="text-xl font-semibold">Ring Path Builder</h3>
          {!path ? (
            <Button onClick={() => setIsCreatePathModalOpen(true)}>Initialize Path</Button>
          ) : (
            <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Button size="sm" variant={mode === 'view' ? 'primary' : 'ghost'} onClick={() => setMode('view')} leftIcon={<Eye />}>View Mode</Button>
              <Button size="sm" variant={mode === 'build' ? 'primary' : 'ghost'} onClick={() => setMode('build')} leftIcon={<Edit />}>Build Mode</Button>
            </div>
          )}
        </div>
        
        {path ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
            <div className="space-y-4 flex flex-col">
              <SearchableSelect options={nodeOptionsForSearch} onChange={handleNodeSearchSelect} placeholder="Search and fly to a node..." clearable />
              <div className="flex-grow min-h-[500px] rounded-lg overflow-hidden border dark:border-gray-700">
                <ClientRingMap
                  nodes={mapNodes}
                  solidLines={pathSegments?.map((seg) => {
                    const start = mapNodes.find(n => n.id === seg.start_node_id);
                    const end = mapNodes.find(n => n.id === seg.end_node_id);
                    return (start && end) ? [start, end] : null;
                  }).filter((p): p is [MapNode, MapNode] => p !== null)}
                  highlightedNodeIds={pathNodeIds}
                  onNodeClick={handleNodeClick}
                  flyToCoordinates={flyToCoords}
                  showControls={false}
                />
              </div>
            </div>

            <div className="space-y-6 flex flex-col">
              <div className="flex-shrink-0">
                {isValidating && <p className="text-sm text-gray-500">Validating path...</p>}
                {validationResult && typeof validationResult === 'object' && <PathStatusIndicator {...validationResult} />}
              </div>
              <div className="flex-grow overflow-y-auto pr-2 max-h-[calc(100vh-450px)]">
                {isLoadingSegments ? <PageSpinner text="Loading path segments..." /> : (!pathSegments || pathSegments.length === 0) ? (
                  <div className="text-center py-16">
                    <p className="text-gray-500">Switch to &apos;Build Mode&apos; and click a node on the map to start.</p>
                    <p className="text-sm text-gray-400 mt-2">Path starts at: <span className="font-semibold">{system.node?.name}</span></p>
                  </div>
                ) : (
                  <PathSegmentList segments={pathSegments} onDragEnd={handleDragEnd} onDelete={handleDeleteSegment} />
                )}
              </div>
              {shouldShowProvisioning && (
                <div className="flex-shrink-0 pt-4 border-t dark:border-gray-700">
                  <FiberProvisioning
                    path={path}
                    pathName={path.path_name ?? ""}
                    systemId={system.id}
                    physicalPathId={path.id}
                    validationStatus={validationResult.status}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            Click &apos;Initialize Path&apos; to begin building the ring topology.
          </div>
        )}
      </div>

      {isCreatePathModalOpen && <CreatePathModal isOpen={isCreatePathModalOpen} onClose={() => setIsCreatePathModalOpen(false)} system={system} onPathCreated={refetchLogicalPath} />}
    </div>
  );
}