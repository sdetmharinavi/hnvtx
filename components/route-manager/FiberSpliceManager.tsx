"use client";

import { useMemo, useState } from 'react';
import { useJcSplicingDetails, useManageSplice, useAutoSplice } from '@/hooks/database/route-manager-hooks';
import { PageSpinner, Button } from '@/components/common/ui';
import { FiLink, FiX, FiZap } from 'react-icons/fi';

// --- Local Type Definitions for this component ---
// These types define the clean, validated data structure the component will work with internally.
type FiberStatus = 'available' | 'used_as_incoming' | 'used_as_outgoing' | 'terminated';

interface FiberAtSegment {
    fiber_no: number;
    status: FiberStatus;
    connected_to_segment: string | null;
    connected_to_fiber: number | null;
    splice_id: string | null;
}

interface SegmentAtJc {
    segment_id: string;
    segment_name: string;
    fiber_count: number;
    fibers: FiberAtSegment[];
}

interface SplicingDetails {
    junction_closure: { id: string; name: string; };
    segments_at_jc: SegmentAtJc[];
}

interface FiberSpliceManagerProps {
    junctionClosureId: string | null;
}

// --- Data Normalization Hook ---
// This custom hook takes the raw, potentially messy data from the RPC and transforms it
// into the clean, reliable SplicingDetails type, preventing crashes.
const useNormalizedSplicingDetails = (junctionClosureId: string | null): { normalizedData: SplicingDetails | null; isLoading: boolean; isError: boolean; error: Error | null } => {
    const { data: rawData, isLoading, isError, error } = useJcSplicingDetails(junctionClosureId);

    const normalizedData = useMemo((): SplicingDetails | null => {
        if (!rawData || typeof rawData !== 'object' || !('junction_closure' in rawData)) {
            return null;
        }

        const rawDetails = rawData as any; // Cast to any to safely access potentially missing properties

        const segments = Array.isArray(rawDetails.segments_at_jc) ? rawDetails.segments_at_jc : [];

        return {
            junction_closure: rawDetails.junction_closure,
            segments_at_jc: segments.map((segment: any) => {
                const fibers = Array.isArray(segment.fibers) ? segment.fibers : [];
                return {
                    segment_id: String(segment.segment_id || ''),
                    segment_name: String(segment.segment_name || 'Unnamed Segment'),
                    fiber_count: Number(segment.fiber_count || 0),
                    fibers: fibers
                        .map((fiber: any) => {
                            const fiberNo = Number(fiber?.fiber_no);
                            if (isNaN(fiberNo)) return null;

                            return {
                                fiber_no: fiberNo,
                                status: fiber?.status || 'available',
                                connected_to_segment: fiber?.connected_to_segment || null,
                                connected_to_fiber: fiber?.connected_to_fiber || null,
                                splice_id: fiber?.splice_id || null,
                            };
                        })
                        .filter((f): f is FiberAtSegment => f !== null),
                };
            }),
        };
    }, [rawData]);

    return { normalizedData, isLoading, isError, error };
};


export const FiberSpliceManager: React.FC<FiberSpliceManagerProps> = ({ junctionClosureId }) => {
    const { normalizedData: spliceDetails, isLoading, isError, error } = useNormalizedSplicingDetails(junctionClosureId);
    
    const manageSpliceMutation = useManageSplice();
    const autoSpliceMutation = useAutoSplice();

    const [selectedFiber, setSelectedFiber] = useState<{ segmentId: string; fiberNo: number } | null>(null);

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
        manageSpliceMutation.mutate({
            action: 'create',
            jcId: junctionClosureId,
            incomingSegmentId: selectedFiber.segmentId,
            incomingFiberNo: selectedFiber.fiberNo,
            outgoingSegmentId: targetSegmentId,
            outgoingFiberNo: targetFiberNo,
            spliceType: 'pass_through'
        });
        setSelectedFiber(null);
    };

    const handleRemoveSplice = (spliceId: string) => {
        if (window.confirm("Are you sure?") && junctionClosureId) {
            manageSpliceMutation.mutate({ action: 'delete', jcId: junctionClosureId, spliceId });
            setSelectedFiber(null);
        }
    };
    
    const handleAutoSplice = (segment1Id: string, segment2Id: string) => {
        if (junctionClosureId) {
            autoSpliceMutation.mutate({ jcId: junctionClosureId, segment1Id, segment2Id } as any);
        }
    };

    if (isLoading) return <PageSpinner text="Loading splice details..." />;
    if (isError) return <div className="p-4 text-red-500">Error: {error.message}</div>;
    if (!spliceDetails?.junction_closure) {
        return <div className="p-4 text-gray-500">Select a Junction Closure to manage its splices.</div>;
    }

    const { junction_closure, segments_at_jc } = spliceDetails;

    const renderFiber = (fiber: FiberAtSegment, segmentId: string) => {
        const isSelected = selectedFiber?.segmentId === segmentId && selectedFiber.fiberNo === fiber.fiber_no;
        const isTargetable = Boolean(selectedFiber) && selectedFiber?.segmentId !== segmentId && fiber.status === 'available';

        const statusClasses: Record<FiberStatus, string> = {
            available: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
            used_as_incoming: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
            used_as_outgoing: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
            terminated: 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
        };

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
                    <span className="text-xs truncate" title={fiber.connected_to_segment ? `→ F${fiber.connected_to_fiber ?? ''} on ${fiber.connected_to_segment}` : fiber.status.replace(/_/g, ' ')}>
                        {fiber.connected_to_segment ? `→ F${fiber.connected_to_fiber ?? ''} on ${fiber.connected_to_segment}` : fiber.status.replace(/_/g, ' ')}
                    </span>
                </div>
                {fiber.splice_id && (
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
            
            <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${Math.max(1, segments_at_jc.length)}, minmax(0, 1fr))` }}>
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
        </div>
    );
};