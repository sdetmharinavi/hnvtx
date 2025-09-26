"use client"

import React, { useState, useMemo } from 'react';
import { X, GitBranch, Plus, Trash2 } from 'lucide-react';

// --- 1. TYPE DEFINITIONS ---
interface FiberNode { id: string; name: string; type: 'OFC' | 'JC' | 'END_POINT'; }
interface OFCCable { id: string; name: string; startNode: string; endNode: string; fiberCount: number; fiberAllocations: FiberAllocation[]; }
interface FiberAllocation { fiberNumber: number; systemId: string; status: 'active' | 'standby'; }
interface FiberRoutePath { nodeId: string; ofcId: string; fiberNumber: number; action: 'terminate' | 'pass_through' | 'tap'; }
interface NetworkSystem { id: string; name: string; startNode: string; }
type AllocationTopology = 'p2p-unprotected' | 'p2p-protected' | 'ring' | 'tap-spur';

// --- 2. COMPREHENSIVE MOCK DATA ---
export const mockData = {
  nodes: [
    { id: 'POP_A', name: 'POP A (Central Office)', type: 'OFC' },
    { id: 'POP_B', name: 'POP B (Regional Hub)', type: 'OFC' },
    { id: 'POP_C', name: 'POP C (City Exchange)', type: 'OFC' },
    { id: 'POP_D', name: 'POP D (North Sub-station)', type: 'OFC' },
    { id: 'CUST_XYZ', name: 'Customer XYZ Corp', type: 'END_POINT' },
    { id: 'CUST_ABC', name: 'Customer ABC Inc', type: 'END_POINT' },
  ] as FiberNode[],
  ofcCables: [
    { id: 'ofc_ab_west', name: 'OFC A-B (West Route)', startNode: 'POP_A', endNode: 'POP_B', fiberCount: 48, fiberAllocations: [{ fiberNumber: 1, systemId: 'SYS_001', status: 'active' }, { fiberNumber: 2, systemId: 'SYS_001', status: 'active' }] },
    { id: 'ofc_ab_east', name: 'OFC A-B (East Route - Diverse)', startNode: 'POP_A', endNode: 'POP_B', fiberCount: 24, fiberAllocations: [] },
    { id: 'ofc_bc', name: 'OFC B-C', startNode: 'POP_B', endNode: 'POP_C', fiberCount: 24, fiberAllocations: [] },
    { id: 'ofc_cd', name: 'OFC C-D', startNode: 'POP_C', endNode: 'POP_D', fiberCount: 12, fiberAllocations: [] },
    { id: 'ofc_da', name: 'OFC D-A', startNode: 'POP_D', endNode: 'POP_A', fiberCount: 12, fiberAllocations: [] },
    { id: 'ofc_b_cust_xyz', name: 'Spur to Customer XYZ', startNode: 'POP_B', endNode: 'CUST_XYZ', fiberCount: 12, fiberAllocations: [] },
    { id: 'ofc_b_cust_abc', name: 'Spur to Customer ABC', startNode: 'POP_B', endNode: 'CUST_ABC', fiberCount: 12, fiberAllocations: [] },
  ] as OFCCable[],
  systems: [
    { id: 'sys_101', name: 'P2P_Leased_Line_Unprotected', startNode: 'POP_A' },
    { id: 'sys_102', name: 'P2P_Backbone_Protected', startNode: 'POP_A' },
    { id: 'sys_103', name: 'METRO_RING_01', startNode: 'POP_A' },
    { id: 'sys_104', name: 'ACCESS_NETWORK_B', startNode: 'POP_A' },
  ] as NetworkSystem[],
};

// --- 3. REUSABLE PATH BUILDER COMPONENT ---
interface PathBuilderProps {
  path: FiberRoutePath[];
  onPathChange: (newPath: FiberRoutePath[]) => void;
  startNodeId: string;
  nodes: FiberNode[];
  cables: OFCCable[];
  allAllocatedFibers: Set<string>; // Format: "ofcId-fiberNumber"
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
    return lastCable.startNode === lastStep.nodeId ? lastCable.endNode : lastCable.startNode;
  }, [path, startNodeId, cables]);

  const availableCables = useMemo(() => cables.filter(c => c.startNode === lastNodeIdInPath || c.endNode === lastNodeIdInPath), [cables, lastNodeIdInPath]);

  const availableFibers = useMemo(() => {
    const cable = cables.find(c => c.id === nextCableId);
    if (!cable) return [];
    const available = [];
    for (let i = 1; i <= cable.fiberCount; i++) {
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
  const getNodeName = (id: string) => nodes.find(n => n.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-4">
      {path.filter((_, i) => i % 2 === 0).map((step, pairIndex) => {
        const fiber2 = path[pairIndex * 2 + 1];
        const cable = cables.find(c => c.id === step.ofcId);
        return (<div key={pairIndex} className="flex items-center bg-gray-50 p-2 rounded"><div className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-xs font-bold mr-3">{pairIndex + 1}</div><div className="flex-1 text-sm"><span className="font-medium">{getNodeName(step.nodeId)}</span><span className="text-gray-500 mx-1">→</span><span>{cable?.name}</span><span className="font-bold text-blue-600 ml-2">F{step.fiberNumber}/{fiber2.fiberNumber}</span><span className="ml-3 px-2 py-0.5 text-xs bg-gray-200 rounded-full">{step.action.replace('_', ' ')}</span></div>{pairIndex === Math.floor(path.length / 2) - 1 && (<button onClick={handleRemoveLastStep} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>)}</div>)
      })}
      {path.length === 0 && <p className="text-sm text-gray-500 text-center py-2">Path starts at <span className='font-semibold'>{getNodeName(startNodeId)}</span>.</p>}
      <div className="border-t pt-4">
        <p className="text-sm font-medium text-gray-600 mb-2">Add Step (from {getNodeName(lastNodeIdInPath!)})</p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"><div className="md:col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">OFC Cable</label><select value={nextCableId} onChange={e => { setNextCableId(e.target.value); setNextFiber1(''); setNextFiber2(''); }} className="w-full border border-gray-300 rounded-md p-2 text-sm"><option value="" disabled>Select cable...</option>{availableCables.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div><label className="block text-xs font-medium text-gray-700 mb-1">Fiber A (Tx)</label><select value={nextFiber1} onChange={e => setNextFiber1(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm" disabled={!nextCableId}><option value="" disabled>...</option>{availableFibers.filter(f => f.toString() !== nextFiber2).map(f => <option key={f} value={f}>{f}</option>)}</select></div><div><label className="block text-xs font-medium text-gray-700 mb-1">Fiber B (Rx)</label><select value={nextFiber2} onChange={e => setNextFiber2(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm" disabled={!nextCableId}><option value="" disabled>...</option>{availableFibers.filter(f => f.toString() !== nextFiber1).map(f => <option key={f} value={f}>{f}</option>)}</select></div><div><label className="block text-xs font-medium text-gray-700 mb-1">Action</label><select value={nextAction} onChange={e => setNextAction(e.target.value as 'pass_through' | 'terminate')} className="w-full border border-gray-300 rounded-md p-2 text-sm"><option value="pass_through">Pass Through</option><option value="terminate">Terminate</option></select></div></div><button onClick={handleAddStep} className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-dashed border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"><Plus className="h-4 w-4 mr-2" />Add Fiber Pair</button>
      </div>
    </div>
  );
}

// --- 4. THE MULTI-TOPOLOGY WIZARD MODAL ---
interface AdvancedAllocationModalProps { isOpen: boolean; onClose: () => void; onSave: (data: { systemId: string; topology: AllocationTopology; paths: { working: FiberRoutePath[], protection: FiberRoutePath[], taps: { [key: string]: FiberRoutePath[] } } }) => void; systems: NetworkSystem[]; nodes: FiberNode[]; cables: OFCCable[]; }

function AdvancedAllocationModal({ isOpen, onClose, onSave, systems, nodes, cables }: AdvancedAllocationModalProps) {
  const [step, setStep] = useState(1);
  const [selectedSystemId, setSelectedSystemId] = useState('');
  const [topology, setTopology] = useState<AllocationTopology>('p2p-unprotected');
  const [paths, setPaths] = useState<{ working: FiberRoutePath[], protection: FiberRoutePath[], taps: { [key: string]: FiberRoutePath[] } }>({ working: [], protection: [], taps: {} });
  const [error, setError] = useState<string | null>(null);

  const selectedSystem = useMemo(() => systems.find(s => s.id === selectedSystemId), [systems, selectedSystemId]);

  const allAllocatedFibers = useMemo(() => {
    const allocated = new Set<string>();
    cables.forEach(c => c.fiberAllocations.forEach(a => allocated.add(`${c.id}-${a.fiberNumber}`)));
    paths.working.forEach(p => allocated.add(`${p.ofcId}-${p.fiberNumber}`));
    paths.protection.forEach(p => allocated.add(`${p.ofcId}-${p.fiberNumber}`));
    Object.values(paths.taps).flat().forEach(p => allocated.add(`${p.ofcId}-${p.fiberNumber}`));
    return allocated;
  }, [cables, paths]);

  const resetState = () => {
    setStep(1); setSelectedSystemId(''); setTopology('p2p-unprotected'); setPaths({ working: [], protection: [], taps: {} }); setError(null);
  };

  const handleClose = () => { resetState(); onClose(); };

  const handleSave = () => {
    setError(null);
    // Add topology-specific validation
    if (topology.startsWith('p2p') && paths.working[paths.working.length - 1]?.action !== 'terminate') { setError("Working path must terminate."); return; }
    if (topology === 'p2p-protected' && paths.protection[paths.protection.length - 1]?.action !== 'terminate') { setError("Protection path must terminate."); return; }
    // More validation can be added for ring, tap, etc.
    onSave({ systemId: selectedSystemId, topology, paths });
    handleClose();
  };

  if (!isOpen) return null;
  const renderStep = () => {
    switch (step) {
      case 1: // System and Topology Selection
        return (<div className="space-y-6"><h3 className="text-lg font-medium text-gray-800">1. Basic Setup</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-sm font-medium text-gray-700 mb-1">Select System</label><select value={selectedSystemId} onChange={e => setSelectedSystemId(e.target.value)} className="w-full border border-gray-300 rounded-md p-2"><option value="" disabled>Choose a system...</option>{systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Select Allocation Topology</label><select value={topology} onChange={e => setTopology(e.target.value as AllocationTopology)} className="w-full border border-gray-300 rounded-md p-2"><option value="p2p-unprotected">Point-to-Point (Unprotected)</option><option value="p2p-protected">Point-to-Point (Protected)</option><option value="ring">Protected Ring</option><option value="tap-spur">Tap / Spur (Point-to-Multipoint)</option></select></div></div></div>);
      case 2: // Path Building
        return (<div className="space-y-6"><h3 className="text-lg font-medium text-gray-800">2. Build Fiber Paths</h3>
          { (topology === 'p2p-unprotected' || topology === 'p2p-protected') && <div className="border rounded-lg"><div className="p-3 bg-gray-50 border-b font-medium text-gray-700">Working Path</div><div className="p-4"><PathBuilder path={paths.working} onPathChange={p => setPaths(c => ({ ...c, working: p }))} startNodeId={selectedSystem!.startNode} {...{ nodes, cables, allAllocatedFibers }} /></div></div> }
          { topology === 'p2p-protected' && <div className="border rounded-lg"><div className="p-3 bg-gray-50 border-b font-medium text-gray-700">Protection Path (Diverse Route)</div><div className="p-4"><PathBuilder path={paths.protection} onPathChange={p => setPaths(c => ({ ...c, protection: p }))} startNodeId={selectedSystem!.startNode} {...{ nodes, cables, allAllocatedFibers }} /></div></div> }
          { topology === 'ring' && <div className="border rounded-lg"><div className="p-3 bg-gray-50 border-b font-medium text-gray-700">Ring Path (must start and end at {selectedSystem?.startNode})</div><div className="p-4"><PathBuilder path={paths.working} onPathChange={p => setPaths(c => ({ ...c, working: p }))} startNodeId={selectedSystem!.startNode} {...{ nodes, cables, allAllocatedFibers }} /></div></div> }
          { topology === 'tap-spur' && <div><div className="border rounded-lg mb-4"><div className="p-3 bg-gray-50 border-b font-medium text-gray-700">Trunk Path</div><div className="p-4"><PathBuilder path={paths.working} onPathChange={p => setPaths(c => ({ ...c, working: p }))} startNodeId={selectedSystem!.startNode} {...{ nodes, cables, allAllocatedFibers }} /></div></div><div className="text-center text-gray-500 text-sm">Tap/Spur path building is a complex feature for a future update.</div></div> }
        </div>);
      default: return null;
    }
  };

  return (<div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"><div className="flex justify-between items-center p-4 border-b"><div className="flex items-center"><GitBranch className="h-6 w-6 text-green-600 mr-3" /><h2 className="text-xl font-semibold text-gray-800">Multi-Topology Allocation Wizard (Step {step}/2)</h2></div><button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200"><X className="h-5 w-5 text-gray-500" /></button></div><div className="p-6 overflow-y-auto">{renderStep()}{error && <p className="mt-4 text-sm text-red-600 text-center animate-pulse">{error}</p>}</div><div className="flex justify-between items-center p-4 border-t bg-gray-50"><button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button><div className="space-x-3">{step > 1 && <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Back</button>}{step < 2 ? <button onClick={() => setStep(s => s + 1)} disabled={!selectedSystemId} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">Next</button> : <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Create Allocation</button>}</div></div></div></div>);
}

export default AdvancedAllocationModal;