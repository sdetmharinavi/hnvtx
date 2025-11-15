// path: components/systems/FiberAllocationModal.tsx
"use client";

import { FC, useMemo, useState, useEffect } from "react";
import { useForm, Controller, useFieldArray, Control, UseFormWatch } from "react-hook-form";
import { Modal, Button, PageSpinner, SearchableSelect } from "@/components/common/ui";
import { FormCard } from "@/components/common/form";
import { useTableQuery, useRpcMutation } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { V_system_connections_completeRowSchema, V_ofc_cables_completeRowSchema, V_nodes_completeRowSchema, V_systems_completeRowSchema } from "@/schemas/zod-schemas";
import { toast } from "sonner";
import { GitBranch, Plus, Trash2 } from "lucide-react";
import TruncateTooltip from "@/components/common/TruncateTooltip";

// --- TYPE DEFINITIONS ---
interface PathStep {
  cable_id: string | null;
  fiber_id: string | null;
}
interface FiberAllocationForm {
  working_path_in: PathStep[];
  working_path_out: PathStep[];
  protection_path_in: PathStep[];
  protection_path_out: PathStep[];
}

// --- THIS IS THE FIX: The props interface is updated ---
interface FiberAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: V_system_connections_completeRowSchema | null;
  parentSystem: V_systems_completeRowSchema | null; // Added parentSystem
  onSave: () => void;
}

// --- HELPER FUNCTIONS FOR FUZZY SEARCH ---
const normalizeName = (name: string | null | undefined): string => {
    if (!name) return '';
    return name.toLowerCase().replace(/[\s-._/]/g, '');
};

function getBigrams(str: string): Set<string> {
    const bigrams = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
        bigrams.add(str.substring(i, i + 2));
    }
    return bigrams;
}

function calculateStringSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    const bigrams1 = getBigrams(str1);
    const bigrams2 = getBigrams(str2);
    const intersection = new Set([...bigrams1].filter(x => bigrams2.has(x)));
    return (2.0 * intersection.size) / (bigrams1.size + bigrams2.size);
}

// (PathSegmentRow component remains the same)
const PathSegmentRow: FC<{
  index: number;
  pathType: keyof FiberAllocationForm;
  control: Control<FiberAllocationForm>;
  watch: UseFormWatch<FiberAllocationForm>;
  segmentInfo: { startNodeName: string; endNodeName: string; cableName: string; };
  onRemove: () => void;
}> = ({ index, pathType, control, watch, segmentInfo, onRemove }) => {
  const cableIdForThisRow = watch(`${pathType}.${index}.cable_id`);

  const { data: availableFibersResult, isLoading: isLoadingFibers } = useTableQuery(createClient(), 'ofc_connections', {
      columns: 'id, fiber_no_sn',
      filters: { ofc_id: cableIdForThisRow || '', system_id: { operator: 'is', value: null } },
      enabled: !!cableIdForThisRow,
  });
  const fiberOptions = useMemo(() => (availableFibersResult?.data || []).map(f => ({ value: f.id, label: `Fiber #${f.fiber_no_sn}` })), [availableFibersResult]);

  return (
    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-2 rounded">
      <span className="font-mono text-xs p-1 bg-gray-200 dark:bg-gray-600 rounded">{index + 1}</span>
      <div className="flex-1 text-sm">
        <TruncateTooltip text={segmentInfo.cableName} className="font-medium" />
        <p className="text-xs text-gray-500 dark:text-gray-400">{`${segmentInfo.startNodeName} → ${segmentInfo.endNodeName}`}</p>
      </div>
      <div className="w-32 flex-shrink-0">
        <Controller name={`${pathType}.${index}.fiber_id`} control={control} render={({ field }) => (
          <SearchableSelect
            options={fiberOptions}
            {...field}
            placeholder={isLoadingFibers ? "Loading..." : "Select Fiber"}
            disabled={!cableIdForThisRow || isLoadingFibers}
          />
        )} />
      </div>
      <Button variant="danger" size="xs" onClick={onRemove}><Trash2 size={12} /></Button>
    </div>
  );
};

const PathBuilder: FC<{
    pathType: keyof FiberAllocationForm;
    control: Control<FiberAllocationForm>;
    watch: UseFormWatch<FiberAllocationForm>;
    nodes: V_nodes_completeRowSchema[];
    cables: V_ofc_cables_completeRowSchema[];
    startNode: { id: string, name: string } | null;
}> = ({ pathType, control, watch, nodes, cables, startNode }) => {
    
    const { fields, append, remove } = useFieldArray({ control, name: pathType });
    const [selectedCableId, setSelectedCableId] = useState<string | null>(null);
    const [selectedFiberId, setSelectedFiberId] = useState<string | null>(null);

    const lastNode = useMemo(() => {
      let currentNode = startNode;
      fields.forEach(field => {
        if (!currentNode) return;
        const cable = cables.find(c => c.id === (field as PathStep).cable_id);
        if (!cable) return;
        const nextNodeId = cable.sn_id === currentNode.id ? cable.en_id : cable.sn_id;
        currentNode = nodes.find(n => n.id === nextNodeId) ? { id: nextNodeId!, name: nodes.find(n => n.id === nextNodeId)!.name! } : null;
      });
      return currentNode;
    }, [fields, startNode, cables, nodes]);
    
    const availableCables = useMemo(() => {
        if (!lastNode?.name) return [];
        const normalizedNodeName = normalizeName(lastNode.name);
        const SIMILARITY_THRESHOLD = 0.6;

        return cables
            .map(cable => {
                const normalizedRouteName = normalizeName(cable.route_name);
                const score = calculateStringSimilarity(normalizedNodeName, normalizedRouteName);
                return { ...cable, score };
            })
            .filter(cable => cable.score >= SIMILARITY_THRESHOLD)
            .sort((a, b) => b.score - a.score)
            .map(c => ({ value: c.id!, label: c.route_name! }));
    }, [cables, lastNode]);

    const { data: availableFibers, isLoading: isLoadingFibers } = useTableQuery(createClient(), 'ofc_connections', {
        columns: 'id, fiber_no_sn',
        filters: { ofc_id: selectedCableId || '', system_id: { operator: 'is', value: null } },
        enabled: !!selectedCableId,
    });
    const fiberOptions = useMemo(() => (availableFibers?.data || []).map(f => ({ value: f.id, label: `Fiber #${f.fiber_no_sn}` })), [availableFibers]);
    
    const handleAddSegment = () => {
        if (!selectedCableId || !selectedFiberId) {
            toast.error("Please select both a cable and a fiber.");
            return;
        }
        append({ cable_id: selectedCableId, fiber_id: selectedFiberId });
        setSelectedCableId(null);
        setSelectedFiberId(null);
    };

    return (
        <div className="space-y-3">
            {fields.map((field, index) => {
                let currentStartNode = startNode;
                for (let i = 0; i < index; i++) {
                    const prevCable = cables.find(c => c.id === (fields[i] as PathStep).cable_id);
                    if (prevCable && currentStartNode) {
                        const nextNodeId = prevCable.sn_id === currentStartNode.id ? prevCable.en_id : prevCable.sn_id;
                        currentStartNode = nodes.find(n => n.id === nextNodeId) ? { id: nextNodeId!, name: nodes.find(n => n.id === nextNodeId)!.name! } : null;
                    }
                }
                const cable = cables.find(c => c.id === (field as PathStep).cable_id);
                const endNodeId = cable && currentStartNode ? (cable.sn_id === currentStartNode.id ? cable.en_id : cable.sn_id) : null;
                const endNode = nodes.find(n => n.id === endNodeId);

                return (
                    <PathSegmentRow
                        key={field.id}
                        index={index}
                        pathType={pathType}
                        control={control}
                        watch={watch}
                        segmentInfo={{
                          startNodeName: currentStartNode?.name || '...',
                          endNodeName: endNode?.name || '...',
                          cableName: cable?.route_name || '...',
                        }}
                        onRemove={() => remove(index)}
                    />
                );
            })}
            
            <div className="space-y-2 pt-2 border-t dark:border-gray-600">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Add Next Segment from: {lastNode?.name || startNode?.name}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <SearchableSelect
                        options={availableCables}
                        value={selectedCableId}
                        onChange={setSelectedCableId}
                        placeholder="Search for next cable..."
                        clearable
                    />
                    <SearchableSelect
                        options={fiberOptions}
                        value={selectedFiberId}
                        onChange={setSelectedFiberId}
                        placeholder={isLoadingFibers ? "Loading..." : "Select fiber..."}
                        disabled={!selectedCableId}
                        clearable
                    />
                </div>
                <Button variant="outline" size="sm" onClick={handleAddSegment} disabled={!selectedCableId || !selectedFiberId} className="w-full">
                    <Plus size={16} className="mr-2" />Add Segment
                </Button>
            </div>
        </div>
    );
};

export const FiberAllocationModal: FC<FiberAllocationModalProps> = ({ isOpen, onClose, connection, parentSystem, onSave }) => {
    const { control, handleSubmit, watch, reset } = useForm<FiberAllocationForm>({
        defaultValues: { working_path_in: [], working_path_out: [], protection_path_in: [], protection_path_out: [] }
    });

    const { data: allCablesResult, isLoading: isLoadingCables } = useTableQuery(createClient(), 'v_ofc_cables_complete');
    const { data: allNodesResult, isLoading: isLoadingNodes } = useTableQuery(createClient(), 'v_nodes_complete');
    
    const provisionMutation = useRpcMutation(createClient(), 'provision_fibers_to_connection', {
        onSuccess: () => { toast.success("Fibers successfully provisioned."); onSave(); onClose(); },
        onError: (err) => toast.error(`Provisioning failed: ${err.message}`),
    });

    // --- THIS IS THE DEFINITIVE FIX ---
    // The startNode is now derived from the parentSystem, not the individual connection.
    const startNode = useMemo(() => {
        if (!parentSystem || !allNodesResult?.data) {
            return null;
        }
        const node = allNodesResult.data.find(n => n.id === parentSystem.node_id);
        return node ? { id: node.id!, name: node.name! } : null;
    }, [parentSystem, allNodesResult]);
    // --- END FIX ---

    useEffect(() => {
        reset({ working_path_in: [], working_path_out: [], protection_path_in: [], protection_path_out: [] });
    }, [isOpen, reset]);

    const onValidSubmit = (data: FiberAllocationForm) => {
        if (!connection?.id) return;
        if (data.working_path_in.length === 0 || data.working_path_out.length === 0 || data.working_path_in.some(s => !s.fiber_id) || data.working_path_out.some(s => !s.fiber_id)) {
            toast.error("Working Path In/Out must be defined and have fibers selected.");
            return;
        }
        const workingIds = [...data.working_path_in.map(s => s.fiber_id!), ...data.working_path_out.map(s => s.fiber_id!)];
        const protectionIds = [...data.protection_path_in.filter(s => s.fiber_id).map(s => s.fiber_id!), ...data.protection_path_out.filter(s => s.fiber_id).map(s => s.fiber_id!)];
        provisionMutation.mutate({
            p_system_connection_id: connection.id,
            p_working_fiber_ids: workingIds,
            p_protection_fiber_ids: protectionIds.length > 0 ? protectionIds : undefined,
        });
    };
    
    if (!connection) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Allocate Fibers for ${connection.system_name}`} size="xl">
            <FormCard
                title={`Path: ${connection.sn_name} ↔ ${connection.en_name}`}
                onSubmit={handleSubmit(onValidSubmit)}
                onCancel={onClose}
                isLoading={provisionMutation.isPending}
                standalone={false}
                widthClass="max-w-4xl"
            >
                {isLoadingCables || isLoadingNodes ? <PageSpinner text="Loading..." /> : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4 p-4 border rounded-lg">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><GitBranch className="text-blue-500" /> Working Path</h3>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Inbound (Tx)</label>
                                <PathBuilder pathType="working_path_in" control={control} watch={watch} startNode={startNode} nodes={allNodesResult!.data} cables={allCablesResult!.data} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Outbound (Rx)</label>
                                <PathBuilder pathType="working_path_out" control={control} watch={watch} startNode={startNode} nodes={allNodesResult!.data} cables={allCablesResult!.data} />
                            </div>
                        </div>
                        <div className="space-y-4 p-4 border rounded-lg">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><GitBranch className="text-gray-400" /> Protection Path <span className="text-xs">(Optional)</span></h3>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Inbound (Tx)</label>
                                <PathBuilder pathType="protection_path_in" control={control} watch={watch} startNode={startNode} nodes={allNodesResult!.data} cables={allCablesResult!.data} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Outbound (Rx)</label>
                                <PathBuilder pathType="protection_path_out" control={control} watch={watch} startNode={startNode} nodes={allNodesResult!.data} cables={allCablesResult!.data} />
                            </div>
                        </div>
                    </div>
                )}
            </FormCard>
        </Modal>
    );
};