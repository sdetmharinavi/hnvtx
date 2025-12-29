// path: components/system-details/FiberAllocationModal.tsx
'use client';

import { FC, useMemo, useState, useEffect, useCallback } from 'react';
import { useForm, Controller, useFieldArray, Control, UseFormWatch } from 'react-hook-form';
import { Modal, Button, PageSpinner, SearchableSelect } from '@/components/common/ui';
import { FormCard } from '@/components/common/form';
import { usePagedData, useTableQuery } from '@/hooks/database'; // CHANGED: Imported usePagedData
import { createClient } from '@/utils/supabase/client';
import {
  V_system_connections_completeRowSchema,
  V_ofc_cables_completeRowSchema,
  V_nodes_completeRowSchema,
  V_systems_completeRowSchema,
  V_ofc_connections_completeRowSchema,
} from '@/schemas/zod-schemas';
import { toast } from 'sonner';
import { GitBranch, Plus, Trash2, ChevronsRight } from 'lucide-react';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { useProvisionServicePath } from '@/hooks/database/system-connection-hooks';

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

interface FiberAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: V_system_connections_completeRowSchema | null;
  parentSystem: V_systems_completeRowSchema | null;
  onSave: () => void;
}

// --- HELPER: Reconstruct Path Steps ---
// Fetches fiber details (specifically ofc_id) given a list of fiber IDs
const useReconstructPath = (fiberIds: string[] | null | undefined) => {
  const supabase = createClient();

  // CHANGED: Use usePagedData instead of useTableQuery
  return usePagedData<V_ofc_connections_completeRowSchema>(
    supabase,
    'v_ofc_connections_complete',
    {
      filters: {
        id: { operator: 'in', value: fiberIds || [] },
      },
    },
    { enabled: !!fiberIds && fiberIds.length > 0 }
  );
};

// --- SUB-COMPONENT: Single Row in the Cascade ---
const PathCascadeRow: FC<{
  index: number;
  pathType: keyof FiberAllocationForm;
  control: Control<FiberAllocationForm>;
  watch: UseFormWatch<FiberAllocationForm>;
  cascadeInfo: { startNodeName: string; endNodeName: string; cableName: string };
  onRemove: () => void;
  allAllocatedFiberIds: Set<string>;
  currentFiberId: string | null;
}> = ({
  index,
  pathType,
  control,
  watch,
  cascadeInfo,
  onRemove,
  allAllocatedFiberIds,
  currentFiberId,
}) => {
  const cableIdForThisRow = watch(`${pathType}.${index}.cable_id`);
  const supabase = createClient();

  // Fetch available fibers for the selected cable (Using TABLE query is fine here as fibers are in 'ofc_connections' table)
  // But since we enforced 'useRpcRecord' for views, let's keep consistent. 'ofc_connections' is a table.
  // However, the rule is "No direct calls to VIEWS". This uses the table `ofc_connections`.
  // Wait, previous version used `useTableQuery` on `ofc_connections`. That is a TABLE.
  // The policy restricts VIEWS.
  // BUT, `useTableQuery` is generic. To be safe and performant, we can use RPC if we have one, or just select from table.
  // The issue was specifically `useTableQuery` on a VIEW.
  // `ofc_connections` is a TABLE. So `useTableQuery` is OKAY here.
  // However, let's double check if we need to filter out fibers assigned to other systems.
  // The table has `system_id`.

  // Re-verify: `ofc_connections` IS a table.
  // BUT, to get `fiber_no_sn`, it's on the table too.
  // So this is actually fine as is?
  // Let's check `useTableQuery` implementation again. It does `supabase.from(tableName).select(...)`.
  // If `tableName` is a table, it works with RLS policies for tables.
  // The restriction is for VIEWS because views execute as the owner (often superuser) but RLS is tricky on views without `security_invoker`.
  // Our views DO have `security_invoker = true`.
  // The user prompt said: "Direct call is not allowed, views should always be called through rpc."
  // So:
  // - Tables -> Direct `from()` OK (if RLS permits).
  // - Views -> RPC `get_paged_data` ONLY.

  // Here, we query `ofc_connections`. Is it a table? Yes.
  // So `useTableQuery` is technically allowed.
  // HOWEVER, for consistency and because we have `get_available_fibers_for_cable` RPC, let's use that if possible?
  // `get_available_fibers_for_cable` returns only `fiber_no`. We need `id`.
  // So we stick to querying the table `ofc_connections`.

  // Wait, `hooks/database/core-queries.ts` imports `useTableQuery`.
  // Let's just use `useTableQuery` here as it targets a TABLE.
  // Wait, I listed `components/system-details/FiberAllocationModal.tsx` as having violations.
  // Why?
  // Line 160: `useTableQuery(createClient(), 'v_ofc_cables_complete')` -> VIEW violation.
  // Line 161: `useTableQuery(createClient(), 'v_nodes_complete')` -> VIEW violation.

  // So let's fix those.

  const { data: availableFibersResult, isLoading: isLoadingFibers } = useTableQuery(
    supabase,
    'ofc_connections',
    {
      // TABLE
      columns: 'id, fiber_no_sn, system_id',
      filters: {
        ofc_id: cableIdForThisRow || '',
      },
      enabled: !!cableIdForThisRow,
      limit: 1000,
    }
  );

  const fiberOptions = useMemo(
    () =>
      (availableFibersResult?.data || [])
        .filter(
          (f) =>
            // Show if fiber has no system_id (is free) AND is not picked elsewhere in current form
            // OR if it is the fiber currently selected in this specific dropdown
            (!f.system_id && !allAllocatedFiberIds.has(f.id)) || f.id === currentFiberId
        )
        .map((f) => ({ value: f.id, label: `Fiber #${f.fiber_no_sn}` }))
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true })),
    [availableFibersResult, allAllocatedFiberIds, currentFiberId]
  );

  return (
    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 p-2 rounded-lg border dark:border-gray-600">
      <span className="font-mono text-xs p-1.5 bg-gray-200 dark:bg-gray-600 rounded-md">
        {index + 1}
      </span>
      <div className="flex-1 text-sm min-w-0">
        <TruncateTooltip text={cascadeInfo.cableName} className="font-medium" />
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{`${cascadeInfo.startNodeName} → ${cascadeInfo.endNodeName}`}</p>
      </div>
      <div className="w-48 shrink-0">
        <Controller
          name={`${pathType}.${index}.fiber_id`}
          control={control}
          render={({ field }) => (
            <SearchableSelect
              options={fiberOptions}
              {...field}
              placeholder={isLoadingFibers ? '...' : 'Select Fiber'}
              disabled={!cableIdForThisRow || isLoadingFibers}
            />
          )}
        />
      </div>
      <Button variant="danger" size="sm" onClick={onRemove} aria-label="Remove cascade">
        <Trash2 size={14} />
      </Button>
    </div>
  );
};

// --- SUB-COMPONENT: Path Builder ---
const PathBuilder: FC<{
  pathType: keyof FiberAllocationForm;
  control: Control<FiberAllocationForm>;
  watch: UseFormWatch<FiberAllocationForm>;
  nodes: V_nodes_completeRowSchema[];
  cables: V_ofc_cables_completeRowSchema[];
  startNode: { id: string; name: string } | null;
  allAllocatedFiberIds: Set<string>;
}> = ({ pathType, control, watch, nodes, cables, startNode, allAllocatedFiberIds }) => {
  const { fields, append, remove } = useFieldArray({ control, name: pathType });
  const [selectedCableId, setSelectedCableId] = useState<string | null>(null);

  const pathValues = watch(pathType);

  const lastNode = useMemo(() => {
    let currentNode = startNode;
    const currentSteps = pathValues || fields;

    currentSteps.forEach((step) => {
      if (!currentNode) return;
      const cableId = (step as PathStep).cable_id;

      const cable = cables.find((c) => c.id === cableId);
      if (!cable) return;

      const nextNodeId = cable.sn_id === currentNode.id ? cable.en_id : cable.sn_id;
      const nextNode = nodes.find((n) => n.id === nextNodeId);
      currentNode = nextNode ? { id: nextNode.id!, name: nextNode.name! } : null;
    });
    return currentNode;
  }, [pathValues, fields, startNode, cables, nodes]);

  const availableCables = useMemo(() => {
    if (!lastNode?.id) return [];
    return cables
      .filter((c) => c.sn_id === lastNode.id || c.en_id === lastNode.id)
      .map((c) => ({ value: c.id!, label: c.route_name! }));
  }, [cables, lastNode]);

  const handleAddCascade = useCallback(() => {
    if (!selectedCableId) {
      toast.error('Please select a cable to add a cascade.');
      return;
    }
    append({ cable_id: selectedCableId, fiber_id: null });
    setSelectedCableId(null);
  }, [append, selectedCableId]);

  return (
    <div className="space-y-3">
      {fields.map((field, index) => {
        let currentStartNode = startNode;
        const currentSteps = pathValues || fields;

        for (let i = 0; i < index; i++) {
          const prevCableId = (currentSteps[i] as PathStep).cable_id;
          const prevCable = cables.find((c) => c.id === prevCableId);
          if (prevCable && currentStartNode) {
            const nextNodeId =
              prevCable.sn_id === currentStartNode.id ? prevCable.en_id : prevCable.sn_id;
            const nextNode = nodes.find((n) => n.id === nextNodeId);
            currentStartNode = nextNode ? { id: nextNode.id!, name: nextNode.name! } : null;
          }
        }

        const currentStepValue = currentSteps[index] as PathStep;
        const cableId = currentStepValue?.cable_id;
        const liveFiberId = currentStepValue?.fiber_id;

        const cable = cables.find((c) => c.id === cableId);
        const endNodeId =
          cable && currentStartNode
            ? cable.sn_id === currentStartNode.id
              ? cable.en_id
              : cable.sn_id
            : null;
        const endNode = nodes.find((n) => n.id === endNodeId);

        return (
          <PathCascadeRow
            key={field.id}
            index={index}
            pathType={pathType}
            control={control}
            watch={watch}
            cascadeInfo={{
              startNodeName: currentStartNode?.name || '...',
              endNodeName: endNode?.name || '...',
              cableName: cable?.route_name || '...',
            }}
            onRemove={() => remove(index)}
            allAllocatedFiberIds={allAllocatedFiberIds}
            currentFiberId={liveFiberId}
          />
        );
      })}

      <div className="space-y-2 pt-3 mt-3 border-t dark:border-gray-600">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Add Cascade from: {lastNode?.name || startNode?.name}
        </p>
        <div className="flex items-center gap-2">
          <div className="grow">
            <SearchableSelect
              options={availableCables}
              value={selectedCableId}
              onChange={setSelectedCableId}
              placeholder="Search for next cable..."
              clearable
            />
          </div>
          <Button
            variant="outline"
            size="md"
            onClick={handleAddCascade}
            disabled={!selectedCableId}
            className="shrink-0"
          >
            <Plus size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN MODAL COMPONENT ---
export const FiberAllocationModal: FC<FiberAllocationModalProps> = ({
  isOpen,
  onClose,
  connection,
  parentSystem,
  onSave,
}) => {
  const supabase = createClient();
  const { control, handleSubmit, watch, reset } = useForm<FiberAllocationForm>({
    defaultValues: {
      working_path_in: [],
      working_path_out: [],
      protection_path_in: [],
      protection_path_out: [],
    },
  });

  const allPaths = watch();
  const allAllocatedFiberIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(allPaths).forEach((pathArray: PathStep[]) => {
      if (Array.isArray(pathArray)) {
        pathArray.forEach((step: PathStep) => {
          if (step.fiber_id) ids.add(step.fiber_id);
        });
      }
    });
    return ids;
  }, [allPaths]);

  // 2. Fetch Network Context (CHANGED: Use usePagedData for Views)
  const { data: allCablesResult, isLoading: isLoadingCables } =
    usePagedData<V_ofc_cables_completeRowSchema>(supabase, 'v_ofc_cables_complete', {
      limit: 5000,
      orderBy: 'route_name',
    });

  const { data: allNodesResult, isLoading: isLoadingNodes } =
    usePagedData<V_nodes_completeRowSchema>(supabase, 'v_nodes_complete', {
      limit: 5000,
      orderBy: 'name',
    });

  // 3. Fetch Existing Allocation Data
  const { data: workingInFibers, isLoading: load1 } = useReconstructPath(
    connection?.working_fiber_in_ids
  );
  const { data: workingOutFibers, isLoading: load2 } = useReconstructPath(
    connection?.working_fiber_out_ids
  );
  const { data: protectInFibers, isLoading: load3 } = useReconstructPath(
    connection?.protection_fiber_in_ids
  );
  const { data: protectOutFibers, isLoading: load4 } = useReconstructPath(
    connection?.protection_fiber_out_ids
  );

  const isHydrating = load1 || load2 || load3 || load4;

  useEffect(() => {
    if (isOpen && connection && !isHydrating) {
      const mapToSteps = (
        fibersData: { data: V_ofc_connections_completeRowSchema[] } | undefined,
        originalIds: string[] | null | undefined
      ): PathStep[] => {
        if (!fibersData?.data || !originalIds || originalIds.length === 0) return [];

        const validFibers = fibersData.data.filter((f) => f.id !== null);
        const fiberMap = new Map(validFibers.map((f) => [f.id!, f]));

        return (
          originalIds
            .map((id) => fiberMap.get(id!))
            .filter(Boolean)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((f) => ({ cable_id: (f as any).ofc_id, fiber_id: f!.id }))
        );
      };

      reset({
        working_path_in: mapToSteps(
          workingInFibers as { data: V_ofc_connections_completeRowSchema[] },
          connection.working_fiber_in_ids
        ),
        working_path_out: mapToSteps(
          workingOutFibers as { data: V_ofc_connections_completeRowSchema[] },
          connection.working_fiber_out_ids
        ),
        protection_path_in: mapToSteps(
          protectInFibers as { data: V_ofc_connections_completeRowSchema[] },
          connection.protection_fiber_in_ids
        ),
        protection_path_out: mapToSteps(
          protectOutFibers as { data: V_ofc_connections_completeRowSchema[] },
          connection.protection_fiber_out_ids
        ),
      });
    }
  }, [
    isOpen,
    connection,
    isHydrating,
    workingInFibers,
    workingOutFibers,
    protectInFibers,
    protectOutFibers,
    reset,
  ]);

  const provisionMutation = useProvisionServicePath();

  const startNode = useMemo(() => {
    if (!parentSystem || !allNodesResult?.data) return null;
    const node = allNodesResult.data.find((n) => n.id === parentSystem.node_id);
    return node ? { id: node.id!, name: node.name! } : null;
  }, [parentSystem, allNodesResult]);

  const endNode = useMemo(() => {
    if (!connection || !allNodesResult?.data) return null;
    const node = allNodesResult.data.find((n) => n.id === connection.en_node_id);
    return node ? { id: node.id!, name: node.name! } : null;
  }, [connection, allNodesResult]);

  const onValidSubmit = (data: FiberAllocationForm) => {
    if (!connection?.id) return;

    const workingPathInIsDefined =
      data.working_path_in.length > 0 && data.working_path_in.every((s) => s.fiber_id);
    const workingPathOutIsDefined =
      data.working_path_out.length > 0 && data.working_path_out.every((s) => s.fiber_id);

    if (!workingPathInIsDefined || !workingPathOutIsDefined) {
      toast.error('Both Working Path In (Tx) and Out (Rx) must be fully defined.');
      return;
    }

    provisionMutation.mutate(
      {
        p_system_connection_id: connection.id,
        p_path_name: connection.service_name || `Path for ${connection.system_name}`,
        p_working_tx_fiber_ids: data.working_path_in.map((s) => s.fiber_id!),
        p_working_rx_fiber_ids: data.working_path_out.map((s) => s.fiber_id!),
        p_protection_tx_fiber_ids: data.protection_path_in
          .filter((s) => s.fiber_id)
          .map((s) => s.fiber_id!),
        p_protection_rx_fiber_ids: data.protection_path_out
          .filter((s) => s.fiber_id)
          .map((s) => s.fiber_id!),
      },
      {
        onSuccess: () => {
          onSave();
          onClose();
        },
      }
    );
  };

  if (!connection) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Allocate Fibers`}
      size="full"
      visible={false}
      className="h-0 w-0 bg-transparent"
    >
      <FormCard
        onSubmit={handleSubmit(onValidSubmit)}
        onCancel={onClose}
        isLoading={provisionMutation.isPending}
        title={
          <div className="flex items-center gap-2">
            <span>Path:</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {startNode?.name || '...'}
            </span>
            <ChevronsRight className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {endNode?.name || '...'}
            </span>
          </div>
        }
        standalone
        widthClass="w-full max-w-7xl"
        heightClass="h-full max-h-[95vh]"
      >
        {isLoadingCables || isLoadingNodes || isHydrating ? (
          <PageSpinner text="Loading network configuration..." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[calc(95vh-220px)] overflow-y-auto p-1">
            <div className="space-y-4 p-4 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <GitBranch className="text-blue-500" /> Working Path
              </h3>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Inbound (Tx)
                </label>
                <PathBuilder
                  pathType="working_path_in"
                  control={control}
                  watch={watch}
                  startNode={startNode}
                  nodes={allNodesResult!.data}
                  cables={allCablesResult!.data}
                  allAllocatedFiberIds={allAllocatedFiberIds}
                />
              </div>
              <div className="space-y-1 pt-4 border-t dark:border-gray-600">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Outbound (Rx)
                </label>
                <PathBuilder
                  pathType="working_path_out"
                  control={control}
                  watch={watch}
                  startNode={startNode}
                  nodes={allNodesResult!.data}
                  cables={allCablesResult!.data}
                  allAllocatedFiberIds={allAllocatedFiberIds}
                />
              </div>
            </div>
            <div className="space-y-4 p-4 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <GitBranch className="text-gray-400" /> Protection Path{' '}
                <span className="text-xs font-normal text-gray-500">(Optional)</span>
              </h3>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Inbound (Tx)
                </label>
                <PathBuilder
                  pathType="protection_path_in"
                  control={control}
                  watch={watch}
                  startNode={startNode}
                  nodes={allNodesResult!.data}
                  cables={allCablesResult!.data}
                  allAllocatedFiberIds={allAllocatedFiberIds}
                />
              </div>
              <div className="space-y-1 pt-4 border-t dark:border-gray-600">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Outbound (Rx)
                </label>
                <PathBuilder
                  pathType="protection_path_out"
                  control={control}
                  watch={watch}
                  startNode={startNode}
                  nodes={allNodesResult!.data}
                  cables={allCablesResult!.data}
                  allAllocatedFiberIds={allAllocatedFiberIds}
                />
              </div>
            </div>
          </div>
        )}
      </FormCard>
    </Modal>
  );
};
