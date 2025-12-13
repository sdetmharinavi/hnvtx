"use client"

import React, { useState, useMemo } from 'react';
import { X, GitBranch, Plus, Trash2 } from 'lucide-react';
import { BsnlNode, BsnlCable, BsnlSystem, FiberRoutePath } from '@/components/bsnl/types';

// The mock data is now only used as a fallback and is correctly typed.
export const mockData = {
  nodes: [] as BsnlNode[],
  ofcCables: [] as BsnlCable[],
  systems: [] as BsnlSystem[],
};

type AllocationTopology = 'p2p-unprotected' | 'p2p-protected' | 'ring' | 'tap-spur';

export interface AllocationSaveData {
  systemId: string;
  topology: AllocationTopology;
  paths: {
    working: FiberRoutePath[];
    protection: FiberRoutePath[];
    taps: { [key: string]: FiberRoutePath[] };
  };
}

// --- REUSABLE PATH BUILDER COMPONENT ---
interface PathBuilderProps {
  path: FiberRoutePath[];
  onPathChange: (newPath: FiberRoutePath[]) => void;
  startNodeId: string;
  nodes: BsnlNode[];
  cables: BsnlCable[];
  allAllocatedFibers: Set<string>;
}

function PathBuilder({ path, onPathChange, startNodeId, nodes, cables, allAllocatedFibers }: PathBuilderProps) {
  const [nextCableId, setNextCableId] = useState('');
  const [nextFiber1, setNextFiber1] = useState('');
  const [nextFiber2, setNextFiber2] = useState('');
  const [nextAction, setNextAction] = useState<'pass_through' | 'terminate'>('pass_through');

  const lastNodeIdInPath = useMemo(() => {
    if (path.length === 0) return startNodeId;
    const lastStep = path[path.length - 1];
    const lastCable = cables.find(c => c.id === lastStep.ofcId);
    if (!lastCable) return lastStep.nodeId;
    return lastCable.sn_id === lastStep.nodeId ? lastCable.en_id : lastCable.sn_id;
  }, [path, startNodeId, cables]);

  const availableCables = useMemo(() => cables.filter(c => c.sn_id === lastNodeIdInPath || c.en_id === lastNodeIdInPath), [cables, lastNodeIdInPath]);

  const availableFibers = useMemo(() => {
    const cable = cables.find(c => c.id === nextCableId);
    if (!cable || !cable.capacity) return [];
    const available = [];
    for (let i = 1; i <= cable.capacity; i++) {
      if (!allAllocatedFibers.has(`${cable.id}-${i}`)) available.push(i);
    }
    return available;
  }, [cables, nextCableId, allAllocatedFibers]);

  const handleAddStep = () => {
    if (!nextCableId || !nextFiber1 || !nextFiber2 || !lastNodeIdInPath || nextFiber1 === nextFiber2) return;
    const newSteps = [
      { nodeId: lastNodeIdInPath, ofcId: nextCableId, fiberNumber: parseInt(nextFiber1), action: nextAction },
      { nodeId: lastNodeIdInPath, ofcId: nextCableId, fiberNumber: parseInt(nextFiber2), action: nextAction }
    ];
    onPathChange([...path, ...newSteps]);
    setNextCableId(''); setNextFiber1(''); setNextFiber2(''); setNextAction('pass_through');
  };

  const handleRemoveLastStep = () => onPathChange(path.slice(0, -2));
  const getNodeName = (id: string | null) => nodes.find(n => n.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-4">
      {path.filter((_, i) => i % 2 === 0).map((step, pairIndex) => {
        const fiber2 = path[pairIndex * 2 + 1];
        const cable = cables.find(c => c.id === step.ofcId);
        return (
          <div key={pairIndex} className="flex items-center bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
            <div className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs font-bold mr-3">{pairIndex + 1}</div>
            <div className="flex-1 text-sm">
              <span className="font-medium text-gray-800 dark:text-gray-200">{getNodeName(step.nodeId)}</span>
              <span className="text-gray-500 dark:text-gray-400 mx-1">→</span>
              <span className="text-gray-700 dark:text-gray-300">{cable?.route_name}</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 ml-2">F{step.fiberNumber}/{fiber2.fiberNumber}</span>
              <span className="ml-3 px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded-full">{step.action.replace('_', ' ')}</span>
            </div>
            {pairIndex === Math.floor(path.length / 2) - 1 && (
              <button onClick={handleRemoveLastStep} className="p-1 text-gray-400 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )
      })}
      {path.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">Path starts at <span className='font-semibold text-gray-700 dark:text-gray-200'>{getNodeName(startNodeId)}</span>.</p>}
      <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Add Step (from {getNodeName(lastNodeIdInPath!)})</p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">OFC Cable</label>
            <select value={nextCableId} onChange={e => { setNextCableId(e.target.value); setNextFiber1(''); setNextFiber2(''); }} className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm bg-white dark:bg-gray-700 dark:text-white">
              <option value="" disabled>Select cable...</option>
              {availableCables.map(c => <option key={c.id} value={c.id!}>{c.route_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fiber A (Tx)</label>
            <select value={nextFiber1} onChange={e => setNextFiber1(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm bg-white dark:bg-gray-700 dark:text-white" disabled={!nextCableId}>
              <option value="" disabled>...</option>
              {availableFibers.filter(f => f.toString() !== nextFiber2).map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fiber B (Rx)</label>
            <select value={nextFiber2} onChange={e => setNextFiber2(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm bg-white dark:bg-gray-700 dark:text-white" disabled={!nextCableId}>
              <option value="" disabled>...</option>
              {availableFibers.filter(f => f.toString() !== nextFiber1).map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Action</label>
            <select value={nextAction} onChange={e => setNextAction(e.target.value as 'pass_through' | 'terminate')} className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm bg-white dark:bg-gray-700 dark:text-white">
              <option value="pass_through">Pass Through</option>
              <option value="terminate">Terminate</option>
            </select>
          </div>
        </div>
        <button onClick={handleAddStep} className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-dashed border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
          <Plus className="h-4 w-4 mr-2" />Add Fiber Pair
        </button>
      </div>
    </div>
  );
}

// --- THE MULTI-TOPOLOGY WIZARD MODAL ---
interface AdvancedAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AllocationSaveData) => void;
  systems: BsnlSystem[];
  nodes: BsnlNode[];
  cables: BsnlCable[];
}

function AdvancedAllocationModal({ isOpen, onClose, onSave, systems, nodes, cables }: AdvancedAllocationModalProps) {
  const [step, setStep] = useState(1);
  const [selectedSystemId, setSelectedSystemId] = useState('');
  const [topology, setTopology] = useState<AllocationTopology>('p2p-unprotected');
  const [paths, setPaths] = useState<{ working: FiberRoutePath[], protection: FiberRoutePath[], taps: { [key: string]: FiberRoutePath[] } }>({ working: [], protection: [], taps: {} });
  const [error, setError] = useState<string | null>(null);

  const selectedSystem = useMemo(() => systems.find(s => s.id === selectedSystemId), [systems, selectedSystemId]);

  const allAllocatedFibers = useMemo(() => new Set<string>(), []);

  const resetState = () => {
    setStep(1); setSelectedSystemId(''); setTopology('p2p-unprotected'); setPaths({ working: [], protection: [], taps: {} }); setError(null);
  };
  const handleClose = () => { resetState(); onClose(); };
  const handleSave = () => {
    setError(null);
    onSave({ systemId: selectedSystemId, topology, paths });
    handleClose();
  };

  if (!isOpen) return null;

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">1. Basic Setup</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select System</label>
                <select value={selectedSystemId} onChange={e => setSelectedSystemId(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 dark:text-white">
                  <option value="" disabled>Choose a system...</option>
                  {systems.map(s => <option key={s.id} value={s.id!}>{s.system_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Allocation Topology</label>
                <select value={topology} onChange={e => setTopology(e.target.value as AllocationTopology)} className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 dark:text-white">
                  <option value="p2p-unprotected">Point-to-Point (Unprotected)</option>
                  <option value="p2p-protected">Point-to-Point (Protected)</option>
                  <option value="ring">Protected Ring</option>
                  <option value="tap-spur">Tap / Spur (Point-to-Multipoint)</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 2:
        if (!selectedSystem) {
            return <p className="text-red-500">Please go back and select a system first.</p>;
        }
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">2. Build Fiber Paths</h3>
             <div className="border rounded-lg border-gray-200 dark:border-gray-600">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-300">Working Path</div>
                <div className="p-4">
                  <PathBuilder 
                    path={paths.working} 
                    onPathChange={p => setPaths(c => ({ ...c, working: p }))} 
                    startNodeId={selectedSystem.node_id!} 
                    nodes={nodes} 
                    cables={cables} 
                    allAllocatedFibers={allAllocatedFibers} 
                  />
                </div>
              </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <GitBranch className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Allocation Wizard (Step {step}/2)</h2>
          </div>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {renderStep()}
          {error && <p className="mt-4 text-sm text-red-600 text-center animate-pulse">{error}</p>}
        </div>
        <div className="flex justify-between items-center p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">Cancel</button>
          <div className="space-x-3">
            {step > 1 && <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">Back</button>}
            {step < 2 ? 
              <button onClick={() => setStep(s => s + 1)} disabled={!selectedSystemId} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-500">Next</button> : 
              <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Create Allocation</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdvancedAllocationModal;