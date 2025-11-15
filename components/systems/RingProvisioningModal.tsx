// path: components/systems/RingProvisioningModal.tsx
"use client";

import { useState, useEffect, useMemo, useCallback, FC } from 'react';
import { Modal, Button, SearchableSelect, PageSpinner } from '@/components/common/ui';
import { useAvailableCables, useAvailableFibers, useAssignSystemToFibers } from '@/hooks/database/ring-provisioning-hooks';
import { Logical_pathsRowSchema, Ofc_cablesRowSchema } from '@/schemas/zod-schemas';
import { ArrowRight, Check, ChevronsRight, GitBranch, X } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// --- TYPE DEFINITIONS ---

interface ProvisioningStep {
  stepIndex: number;
  startNodeId: string;
  startNodeName: string;
  endNodeId: string; // The ultimate end of the logical path for this step
  endNodeName: string;
  cableId: string | null;
  fiberTx: number | null;
  fiberRx: number | null;
  isComplete: boolean;
}

interface RingProvisioningModalProps {
  isOpen: boolean;
  onClose: () => void;
  logicalPath: (Logical_pathsRowSchema & { start_node: { name: string } | null, end_node: { name: string } | null }) | null;
  systemId: string | null;
}

// --- SUB-COMPONENT FOR A SINGLE STEP ---

const ProvisioningStepView: FC<{
  step: ProvisioningStep;
  isActive: boolean;
  onCableSelect: (cableId: string | null) => void;
  onFiberSelect: (type: 'tx' | 'rx', fiber: number | null) => void;
}> = ({ step, isActive, onCableSelect, onFiberSelect }) => {
  
  // CORRECTED: Fetch cables only for the active step, using the reliable startNodeId from props.
  const { data: availableCables = [], isLoading: isLoadingCables } = useAvailableCables(isActive ? step.startNodeId : null);
  const { data: availableFibers = [], isLoading: isLoadingFibers } = useAvailableFibers(isActive ? step.cableId : null);

  console.log("availableCables", availableCables);
  console.log("availableFibers", availableFibers);
  

  const cableOptions = useMemo(() => availableCables.map(c => ({ value: c.id, label: c.route_name })), [availableCables]);
  const fiberOptions = useMemo(() => availableFibers.map(f => ({ value: f.fiber_no.toString(), label: `Fiber #${f.fiber_no}` })), [availableFibers]);
  
  // Fetch the full details of the selected cable to show its endpoints
  const { data: selectedCable } = useQuery({
      queryKey: ['cable-details-for-step', step.cableId],
      queryFn: async () => {
          if (!step.cableId) return null;
          const { data } = await createClient().from('v_ofc_cables_complete').select('sn_name, en_name').eq('id', step.cableId).single();
          return data;
      },
      enabled: !!step.cableId
  });

  return (
    <div className={`p-4 border rounded-lg transition-all ${isActive ? 'bg-white dark:bg-gray-800 border-blue-500 shadow-lg' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full text-white font-bold ${step.isComplete ? 'bg-green-500' : 'bg-blue-500'}`}>
          {step.isComplete ? <Check size={18} /> : step.stepIndex + 1}
        </div>
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-gray-200">Step {step.stepIndex + 1}: Path Segment</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            From <span className="font-medium text-gray-700 dark:text-gray-300">{step.startNodeName}</span>
          </p>
        </div>
      </div>

      {isLoadingCables && isActive && <div className="text-sm text-gray-500">Loading available cables...</div>}
      
      {isActive && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchableSelect
            label="Select Cable"
            options={cableOptions}
            value={step.cableId}
            onChange={onCableSelect}
            placeholder="Choose a physical cable..."
            disabled={!isActive}
          />
          <SearchableSelect
            label="Select TX Fiber"
            options={fiberOptions.filter(f => f.value !== step.fiberRx?.toString())}
            value={step.fiberTx?.toString() ?? null}
            onChange={(val) => onFiberSelect('tx', val ? parseInt(val) : null)}
            placeholder="Select TX..."
            disabled={!isActive || !step.cableId || isLoadingFibers}
          />
          <SearchableSelect
            label="Select RX Fiber"
            options={fiberOptions.filter(f => f.value !== step.fiberTx?.toString())}
            value={step.fiberRx?.toString() ?? null}
            onChange={(val) => onFiberSelect('rx', val ? parseInt(val) : null)}
            placeholder="Select RX..."
            disabled={!isActive || !step.cableId || isLoadingFibers}
          />
        </div>
      )}

      {step.isComplete && selectedCable && (
        <div className="text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
          <p><strong>Cable:</strong> {selectedCable.sn_name} → {selectedCable.en_name}</p>
          <p><strong>Fibers:</strong> TX #{step.fiberTx}, RX #{step.fiberRx}</p>
        </div>
      )}
    </div>
  );
};

// --- MAIN MODAL COMPONENT ---

export const RingProvisioningModal: React.FC<RingProvisioningModalProps> = ({ isOpen, onClose, logicalPath, systemId }) => {
  const [cascade, setCascade] = useState<ProvisioningStep[]>([]);
  const assignMutation = useAssignSystemToFibers();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen && logicalPath) {
      setCascade([{
        stepIndex: 0,
        startNodeId: logicalPath.start_node_id!,
        startNodeName: logicalPath.start_node?.name || 'Unknown Start',
        endNodeId: logicalPath.end_node_id!,
        endNodeName: logicalPath.end_node?.name || 'Unknown End',
        cableId: null,
        fiberTx: null,
        fiberRx: null,
        isComplete: false,
      }]);
    } else {
      setCascade([]);
    }
  }, [isOpen, logicalPath]);

  const handleCableSelect = (stepIndex: number, cableId: string | null) => {
    setCascade(prev => {
      const newCascade = [...prev];
      newCascade[stepIndex].cableId = cableId;
      newCascade[stepIndex].fiberTx = null;
      newCascade[stepIndex].fiberRx = null;
      newCascade[stepIndex].isComplete = false;
      return newCascade.slice(0, stepIndex + 1);
    });
  };

  const handleFiberSelect = (stepIndex: number, type: 'tx' | 'rx', fiber: number | null) => {
    setCascade(prev => {
      const newCascade = [...prev];
      if (type === 'tx') newCascade[stepIndex].fiberTx = fiber;
      if (type === 'rx') newCascade[stepIndex].fiberRx = fiber;
      return newCascade;
    });
  };

  useEffect(() => {
    if (cascade.length === 0) return;
    const lastStep = cascade[cascade.length - 1];

    if (lastStep.cableId && lastStep.fiberTx && lastStep.fiberRx && !lastStep.isComplete) {
      queryClient.fetchQuery({
        queryKey: ['cable-details-for-cascade', lastStep.cableId],
        queryFn: async () => {
          const { data } = await createClient().from('v_ofc_cables_complete').select('sn_id, en_id, sn_name, en_name').eq('id', lastStep.cableId!).single();
          return data;
        }
      }).then(cable => {
        if (!cable) return;

        const exitNodeId = cable.sn_id === lastStep.startNodeId ? cable.en_id : cable.sn_id;
        const exitNodeName = cable.sn_id === lastStep.startNodeId ? cable.en_name : cable.sn_name;

        setCascade(prev => {
          const newCascade = JSON.parse(JSON.stringify(prev));
          newCascade[newCascade.length - 1].isComplete = true;

          if (exitNodeId !== logicalPath?.end_node_id) {
            newCascade.push({
              stepIndex: newCascade.length,
              startNodeId: exitNodeId,
              startNodeName: exitNodeName,
              endNodeId: logicalPath!.end_node_id!,
              endNodeName: logicalPath!.end_node?.name || 'Unknown End',
              cableId: null,
              fiberTx: null,
              fiberRx: null,
              isComplete: false,
            });
          }
          return newCascade;
        });
      });
    }
  }, [cascade, logicalPath, queryClient]);

  const isPathComplete = useMemo(() => {
    return cascade.length > 0 && cascade.every(step => step.isComplete);
  }, [cascade]);

  const handleProvision = async () => {
    if (!isPathComplete || !systemId || !logicalPath) return;

    toast.info(`Provisioning ${cascade.length} segment(s)...`);

    try {
      for (const step of cascade) {
        await assignMutation.mutateAsync({
          systemId,
          cableId: step.cableId!,
          fiberTx: step.fiberTx!,
          fiberRx: step.fiberRx!,
          logicalPathId: logicalPath.id
        });
      }
      onClose();
    } catch (error) {
      // Error is handled by the mutation's onError
    }
  };

  if (!logicalPath) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Provision Path: ${logicalPath.name}`} size="full">
      <div className="p-6">
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600/50">
          <p className="font-semibold text-gray-800 dark:text-gray-200">
            System: <span className="font-mono text-blue-600 dark:text-blue-400">{systemId?.slice(0, 8)}...</span>
          </p>
          <p className="font-semibold text-gray-800 dark:text-gray-200">
            Logical Path: <span className="text-gray-600 dark:text-gray-300 font-normal">{logicalPath.start_node?.name}</span>
            <ChevronsRight className="inline mx-2 h-4 w-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-300 font-normal">{logicalPath.end_node?.name}</span>
          </p>
        </div>
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {cascade.map((step, index) => (
            <ProvisioningStepView
              key={step.stepIndex}
              step={step}
              isActive={index === cascade.length - 1 && !step.isComplete}
              onCableSelect={(cableId) => handleCableSelect(index, cableId)}
              onFiberSelect={(type, fiber) => handleFiberSelect(index, type, fiber)}
            />
          ))}
        </div>
        
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleProvision} disabled={!isPathComplete || assignMutation.isPending}>
            {assignMutation.isPending ? 'Provisioning...' : 'Confirm & Provision Path'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};