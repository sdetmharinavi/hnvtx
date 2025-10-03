// path: components/route-manager/FiberSpliceManager.tsx
"use client";

import { useMemo, useState, useEffect } from 'react';
import { useJcSplicingDetails, useManageSplice, useAutoSplice } from '@/hooks/database/route-manager-hooks';
import { PageSpinner, Button } from '@/components/common/ui';
import { FiLink, FiX, FiZap } from 'react-icons/fi';
import { JcSplicingDetails } from '@/schemas/custom-schemas';
import { SpliceVisualizationModal } from '@/components/route-manager/ui/SpliceVisualizationModal';

// --- Local Type Definitions (Inferred from imported Zod schemas for clarity) ---
type FiberStatus = JcSplicingDetails['segments_at_jc'][0]['fibers'][0]['status'];
type FiberAtSegment = JcSplicingDetails['segments_at_jc'][0]['fibers'][0];

interface FiberSpliceManagerProps {
    junctionClosureId: string | null;
}

interface SpliceAction {
    type: 'manual' | 'auto';
    manualData?: {
        incomingSegmentId: string;
        incomingFiberNo: number;
        outgoingSegmentId: string;
        outgoingFiberNo: number;
    };
    autoData?: {
        segment1Id: string;
        segment2Id: string;
        segment1Name: string;
        segment2Name: string;
    };
}

interface AutoSplicePair {
    fiber1No: number;
    fiber2No: number;
    lossDb: string;
}

const useNormalizedSplicingDetails = (junctionClosureId: string | null): { 
  normalizedData: JcSplicingDetails | null; 
  isLoading: boolean; 
  isError: boolean; 
  error: Error | null 
} => {
    const { data: rawData, isLoading, isError, error } = useJcSplicingDetails(junctionClosureId);

    const normalizedData = useMemo((): JcSplicingDetails | null => {
        if (!rawData || typeof rawData !== 'object' || !('junction_closure' in rawData)) {
            return null;
        }
        return rawData;
    }, [rawData]);

    return { normalizedData, isLoading, isError, error };
};

export const FiberSpliceManager: React.FC<FiberSpliceManagerProps> = ({ junctionClosureId }) => {

    const { normalizedData: spliceDetails, isLoading, isError, error } = useNormalizedSplicingDetails(junctionClosureId);
    
    const manageSpliceMutation = useManageSplice();
    const autoSpliceMutation = useAutoSplice();

    const [selectedFiber, setSelectedFiber] = useState<{ segmentId: string; fiberNo: number } | null>(null);
    const [showLossModal, setShowLossModal] = useState(false);
    const [lossDbValue, setLossDbValue] = useState('0.3');
    const [pendingSpliceAction, setPendingSpliceAction] = useState<SpliceAction | null>(null);
    const [autoSpliceMode, setAutoSpliceMode] = useState<'uniform' | 'individual'>('uniform');
    const [autoSplicePairs, setAutoSplicePairs] = useState<AutoSplicePair[]>([]);
    const [showVisualizationModal, setShowVisualizationModal] = useState(false);

    // Calculate available fiber pairs for auto-splice
    useEffect(() => {
        if (pendingSpliceAction?.type === 'auto' && pendingSpliceAction.autoData && spliceDetails) {
            const { segment1Id, segment2Id } = pendingSpliceAction.autoData;
            const segment1 = spliceDetails.segments_at_jc.find(s => s.segment_id === segment1Id);
            const segment2 = spliceDetails.segments_at_jc.find(s => s.segment_id === segment2Id);

            if (segment1 && segment2) {
                const availableFibers1 = segment1.fibers.filter(f => f.status === 'available').map(f => f.fiber_no);
                const availableFibers2 = segment2.fibers.filter(f => f.status === 'available').map(f => f.fiber_no);
                
                const pairs: AutoSplicePair[] = [];
                const maxPairs = Math.min(availableFibers1.length, availableFibers2.length);
                
                for (let i = 0; i < maxPairs; i++) {
                    pairs.push({
                        fiber1No: availableFibers1[i],
                        fiber2No: availableFibers2[i],
                        lossDb: '0.3'
                    });
                }
                
                setAutoSplicePairs(pairs);
            }
        }
    }, [pendingSpliceAction, spliceDetails]);

    const handleFiberClick = (segmentId: string, fiberNo: number, status: FiberStatus) => {
        if (status === 'used_as_outgoing') return;
        if (selectedFiber && selectedFiber.segmentId === segmentId && selectedFiber.fiberNo === fiberNo) {
            setSelectedFiber(null);
        } else {
            setSelectedFiber({ segmentId, fiberNo });
        }
    };

    const handleTargetFiberClick = (targetSegmentId: string, targetFiberNo: number) => {
        if (!selectedFiber || !junctionClosureId) return;
        
        setPendingSpliceAction({
            type: 'manual',
            manualData: {
                incomingSegmentId: selectedFiber.segmentId,
                incomingFiberNo: selectedFiber.fiberNo,
                outgoingSegmentId: targetSegmentId,
                outgoingFiberNo: targetFiberNo,
            }
        });
        setShowLossModal(true);
    };

    const handleAutoSplice = (segment1Id: string, segment2Id: string) => {
        if (!junctionClosureId || !spliceDetails) return;
        
        const segment1 = spliceDetails.segments_at_jc.find(s => s.segment_id === segment1Id);
        const segment2 = spliceDetails.segments_at_jc.find(s => s.segment_id === segment2Id);
        
        setPendingSpliceAction({
            type: 'auto',
            autoData: {
                segment1Id,
                segment2Id,
                segment1Name: segment1?.segment_name || 'Segment 1',
                segment2Name: segment2?.segment_name || 'Segment 2',
            }
        });
        setShowLossModal(true);
    };

    const applyUniformLoss = () => {
        const uniform = lossDbValue;
        setAutoSplicePairs(pairs => pairs.map(p => ({ ...p, lossDb: uniform })));
    };

    const confirmSplice = async () => {
        if (!pendingSpliceAction || !junctionClosureId) return;

        if (pendingSpliceAction.type === 'manual' && pendingSpliceAction.manualData) {
            const lossDb = parseFloat(lossDbValue) || 0;
            const { incomingSegmentId, incomingFiberNo, outgoingSegmentId, outgoingFiberNo } = pendingSpliceAction.manualData;
            manageSpliceMutation.mutate({
                action: 'create',
                jcId: junctionClosureId,
                incomingSegmentId,
                incomingFiberNo,
                outgoingSegmentId,
                outgoingFiberNo,
                spliceType: 'pass_through',
                lossDb,
            });
            setSelectedFiber(null);
            resetModal();
        } else if (pendingSpliceAction.type === 'auto' && pendingSpliceAction.autoData) {
            const { segment1Id, segment2Id } = pendingSpliceAction.autoData;
            
            if (autoSpliceMode === 'uniform') {
                const lossDb = parseFloat(lossDbValue) || 0;
                autoSpliceMutation.mutate({
                    jcId: junctionClosureId,
                    segment1Id,
                    segment2Id,
                    lossDb,
                });
                resetModal();
            } else {
                // Individual mode: create splices one by one with individual loss values
                for (const pair of autoSplicePairs) {
                    const lossDb = parseFloat(pair.lossDb) || 0;
                    await manageSpliceMutation.mutateAsync({
                        action: 'create',
                        jcId: junctionClosureId,
                        incomingSegmentId: segment1Id,
                        incomingFiberNo: pair.fiber1No,
                        outgoingSegmentId: segment2Id,
                        outgoingFiberNo: pair.fiber2No,
                        spliceType: 'pass_through',
                        lossDb,
                    });
                }
                resetModal();
            }
        }
    };

    const resetModal = () => {
        setShowLossModal(false);
        setPendingSpliceAction(null);
        setLossDbValue('0.3');
        setAutoSpliceMode('uniform');
        setAutoSplicePairs([]);
    };

    const handleRemoveSplice = (spliceId: string) => {
        if (window.confirm("Are you sure you want to remove this splice?") && junctionClosureId) {
            manageSpliceMutation.mutate({ action: 'delete', jcId: junctionClosureId, spliceId });
            setSelectedFiber(null);
        }
    };

    if (isLoading) return <PageSpinner text="Loading splice details..." />;
    if (isError) return <div className="p-4 text-red-500">Error: {error?.message}</div>;
    if (!spliceDetails?.junction_closure) {
        return <div className="p-4 text-gray-500">Select a Junction Closure to manage its splices.</div>;
    }

    const { junction_closure, segments_at_jc } = spliceDetails;

    const gridTemplateColumns = `repeat(${Math.max(1, segments_at_jc.length)}, minmax(0, 1fr))`;

    const renderFiber = (fiber: FiberAtSegment, segmentId: string) => {
        const isSelected = selectedFiber?.segmentId === segmentId && selectedFiber.fiberNo === fiber.fiber_no;
        const isTargetable = Boolean(selectedFiber) && selectedFiber?.segmentId !== segmentId && fiber.status === 'available';

        const statusClasses: Record<FiberStatus, string> = {
            available: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
            used_as_incoming: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
            used_as_outgoing: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
            terminated: 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
        };

        const titleText = fiber.connected_to_segment 
          ? `-> F${fiber.connected_to_fiber ?? ''} on ${fiber.connected_to_segment}` 
          : fiber.status.replace(/_/g, ' ');

        return (
            <div
                key={fiber.fiber_no}
                onClick={() => isTargetable ? handleTargetFiberClick(segmentId, fiber.fiber_no) : handleFiberClick(segmentId, fiber.fiber_no, fiber.status)}
                className={`flex items-center justify-between p-2 rounded-md transition-all duration-200 ${
                    isSelected ? 'ring-2 ring-yellow-500 bg-yellow-100 dark:bg-yellow-900/40' :
                    isTargetable ? 'cursor-pointer hover:bg-green-200 dark:hover:bg-green-800/50' :
                    fiber.status === 'used_as_outgoing' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                } ${statusClasses[fiber.status] || ''}`}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs font-bold w-6 text-center">{fiber.fiber_no}</span>
                    {fiber.status !== 'available' && <FiLink className="w-3 h-3 flex-shrink-0" />}
                    <span className="text-xs truncate" title={titleText}>
                        {titleText}
                    </span>
                </div>
                {fiber.splice_id && fiber.status === 'used_as_incoming' && (
                    <button onClick={(e) => { e.stopPropagation(); handleRemoveSplice(fiber.splice_id!); }} className="p-1 rounded-full hover:bg-red-200 dark:hover:bg-red-800 text-red-500">
                        <FiX className="w-3 h-3" />
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-4">Splice Manager: {junction_closure.name}</h3>

            {selectedFiber && (
                <div className="p-3 mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg text-center">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Selected Fiber #{selectedFiber.fiberNo} from {segments_at_jc.find(s => s.segment_id === selectedFiber.segmentId)?.segment_name}. Click an available fiber to create a splice.
                    </p>
                </div>
            )}
            
            <div className="grid gap-4" style={{ gridTemplateColumns }}>
                {segments_at_jc.map((segment, index) => (
                    <div key={segment.segment_id} className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border dark:border-gray-700">
                        <h4 className="font-bold text-sm mb-2 truncate" title={segment.segment_name}>{segment.segment_name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Fibers: {segment.fiber_count}</p>
                        
                        {index < segments_at_jc.length - 1 && (
                             <Button size="xs" onClick={() => handleAutoSplice(segment.segment_id, segments_at_jc[index + 1].segment_id)} className="w-full mb-3" variant="outline">
                                <FiZap className="w-3 h-3 mr-1"/> Auto-Splice
                            </Button>
                        )}

                        <div className="space-y-1 max-h-96 overflow-y-auto">
                            {segment.fibers.map((fiber) => renderFiber(fiber, segment.segment_id))}
                        </div>
                    </div>
                ))}
            </div>
            <Button size="xs" onClick={() => setShowVisualizationModal(true)} className="w-full mb-3" variant="outline">
                <FiZap className="w-3 h-3 mr-1"/> Show Splices
            </Button>
            <SpliceVisualizationModal isOpen={showVisualizationModal} onClose={() => setShowVisualizationModal(false)} junctionClosureId={junctionClosureId} />

            {/* Loss dB Modal */}
            {showLossModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">
                            {pendingSpliceAction?.type === 'auto' ? 'Auto-Splice Configuration' : 'Configure Splice Loss'}
                        </h3>
                        
                        {pendingSpliceAction?.type === 'auto' ? (
                            <>
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        Splicing between: <strong>{pendingSpliceAction.autoData?.segment1Name}</strong> ↔ <strong>{pendingSpliceAction.autoData?.segment2Name}</strong>
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {autoSplicePairs.length} fiber pair{autoSplicePairs.length !== 1 ? 's' : ''} will be spliced
                                    </p>
                                </div>

                                <div className="mb-4 space-y-3">
                                    <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <input
                                            type="radio"
                                            name="spliceMode"
                                            value="uniform"
                                            checked={autoSpliceMode === 'uniform'}
                                            onChange={(e) => setAutoSpliceMode(e.target.value as 'uniform' | 'individual')}
                                            className="mt-1"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">Uniform Loss</div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">Apply same loss to all splices</div>
                                        </div>
                                    </label>
                                    
                                    <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <input
                                            type="radio"
                                            name="spliceMode"
                                            value="individual"
                                            checked={autoSpliceMode === 'individual'}
                                            onChange={(e) => setAutoSpliceMode(e.target.value as 'uniform' | 'individual')}
                                            className="mt-1"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">Individual Loss</div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">Set different loss for each splice</div>
                                        </div>
                                    </label>
                                </div>

                                {autoSpliceMode === 'uniform' ? (
                                    <div className="mb-6">
                                        <label htmlFor="lossDb" className="block text-sm font-medium mb-2">
                                            Loss (dB) for all splices
                                        </label>
                                        <input
                                            id="lossDb"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="10"
                                            value={lossDbValue}
                                            onChange={(e) => setLossDbValue(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                            autoFocus
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Typical splice loss: 0.1 - 0.5 dB
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="10"
                                                value={lossDbValue}
                                                onChange={(e) => setLossDbValue(e.target.value)}
                                                className="w-32 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                                placeholder="0.3"
                                            />
                                            <Button size="xs" onClick={applyUniformLoss} variant="outline">
                                                Apply to All
                                            </Button>
                                        </div>
                                        
                                        <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                                            <div className="bg-gray-100 dark:bg-gray-900 px-3 py-2 grid grid-cols-3 gap-2 text-xs font-semibold">
                                                <div>Fiber 1</div>
                                                <div>Fiber 2</div>
                                                <div>Loss (dB)</div>
                                            </div>
                                            <div className="max-h-64 overflow-y-auto">
                                                {autoSplicePairs.map((pair, idx) => (
                                                    <div key={idx} className="px-3 py-2 grid grid-cols-3 gap-2 items-center border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                        <div className="text-sm font-mono">#{pair.fiber1No}</div>
                                                        <div className="text-sm font-mono">#{pair.fiber2No}</div>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            max="10"
                                                            value={pair.lossDb}
                                                            onChange={(e) => {
                                                                const newPairs = [...autoSplicePairs];
                                                                newPairs[idx].lossDb = e.target.value;
                                                                setAutoSplicePairs(newPairs);
                                                            }}
                                                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Enter the splice loss in dB for this connection:
                                </p>
                                <div className="mb-6">
                                    <label htmlFor="lossDb" className="block text-sm font-medium mb-2">
                                        Loss (dB)
                                    </label>
                                    <input
                                        id="lossDb"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="10"
                                        value={lossDbValue}
                                        onChange={(e) => setLossDbValue(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                        autoFocus
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Typical splice loss: 0.1 - 0.5 dB
                                    </p>
                                </div>
                            </>
                        )}
                        
                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={resetModal}>
                                Cancel
                            </Button>
                            <Button onClick={confirmSplice} disabled={manageSpliceMutation.isPending || autoSpliceMutation.isPending}>
                                {manageSpliceMutation.isPending || autoSpliceMutation.isPending ? 'Creating...' : 
                                    pendingSpliceAction?.type === 'auto' 
                                        ? `Create ${autoSplicePairs.length} Splice${autoSplicePairs.length !== 1 ? 's' : ''}` 
                                        : 'Confirm Splice'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};