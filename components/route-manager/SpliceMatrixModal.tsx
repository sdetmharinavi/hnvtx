'use client';

import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { Modal, PageSpinner } from '@/components/common/ui';
import { useJcSplicingDetails, useManageSplice, useAutoSplice, useCablesForJc } from '@/hooks/database/route-manager-hooks';
// THE FIX: Import the new/updated types
import { CableInJc, FiberInfo, JunctionClosure, SpliceMatrixModalProps } from '@/components/route-manager/types';
import { Button } from '../common/ui';
import { Link2Off, LogOut, PlusCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchableSelect } from '../common/ui/select/SearchableSelect';

// ... (FiberProps and Fiber component remain unchanged)
interface FiberProps {
  fiber: FiberInfo;
  isSelected: boolean;
  isPotentialTarget: boolean;
  onClick: () => void;
}

const Fiber: React.FC<FiberProps> = ({ fiber, isSelected, isPotentialTarget, onClick }) => {
    const getStatusClasses = () => {
        if (isSelected) return 'bg-yellow-400 dark:bg-yellow-600 ring-2 ring-yellow-500 shadow-md';
        if (isPotentialTarget) return 'bg-blue-100 dark:bg-blue-800 ring-2 ring-blue-500 animate-pulse';
        if (fiber.splice_id && !fiber.connected_to_cable) return 'bg-gray-300 dark:bg-gray-600 cursor-pointer hover:bg-gray-400'; // Terminated
        switch (fiber.status) {
          case 'available': return 'bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-800';
          case 'used_as_incoming':
          case 'used_as_outgoing':
            return 'bg-blue-100 dark:bg-blue-900/50 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800';
          default: return 'bg-gray-200 dark:bg-gray-700';
        }
      };

      const getTitle = () => {
        if (fiber.splice_id && !fiber.connected_to_cable) return `Fiber ${fiber.fiber_no} - Terminated. Click to manage.`;
        if (fiber.status !== 'available') return `Connected to ${fiber.connected_to_cable} (F${fiber.connected_to_fiber}) - Click to manage splice`;
        return `Fiber ${fiber.fiber_no} - Available`;
      }

      const renderConnectionInfo = () => {
        if (fiber.status === 'available') return null;

        const connectionText = fiber.connected_to_cable
          ? `→ ${fiber.connected_to_cable} (F${fiber.connected_to_fiber})`
          : 'TERMINATED';

        const textColor = fiber.connected_to_cable
          ? "text-blue-800 dark:text-blue-200"
          : "text-gray-600 dark:text-gray-400";

        return (
          <span className={cn("font-mono text-[10px] truncate", textColor)}>
            {connectionText}
          </span>
        );
      };

      return (
        <button
          onClick={onClick}
          className={cn(
            "w-full p-1.5 rounded-md text-left text-xs transition-all duration-150 flex items-center justify-between gap-1",
            getStatusClasses()
          )}
          title={getTitle()}
        >
          <span className="font-mono font-bold text-gray-800 dark:text-gray-100">F{fiber.fiber_no}</span>
          {renderConnectionInfo()}
        </button>
      );
};


export const SpliceMatrixModal: React.FC<SpliceMatrixModalProps> = ({ jc, isOpen, onClose }) => {
  const { data, isLoading, isError, error, refetch } = useJcSplicingDetails(jc?.id || null);
  const { data: addableCablesData, isLoading: isLoadingAddableCables } = useCablesForJc(jc?.id || null);
  const manageSpliceMutation = useManageSplice();
  const autoSpliceMutation = useAutoSplice();
  const [displayedCableIds, setDisplayedCableIds] = useState<Set<string>>(new Set());
  const [cableToAdd, setCableToAdd] = useState<string | null>(null);
  const [selectedFiber, setSelectedFiber] = useState<{ cableId: string; fiber: FiberInfo } | null>(null);

  useEffect(() => {
    if (data?.cables) {
      const initialIds = new Set<string>(data.cables.map(c => c.cable_id));
      // THE FIX: No 'as any' needed because JunctionClosure type is now correct
      if (jc?.ofc_cable_id) {
        initialIds.add(jc.ofc_cable_id);
      }
      setDisplayedCableIds(initialIds);
    } else if (jc?.ofc_cable_id) {
        setDisplayedCableIds(new Set([jc.ofc_cable_id]));
    }
  }, [data, jc]);

  const allCablesInMatrix = useMemo(() => {
    const cablesMap = new Map<string, CableInJc>();
    const allIdsToShow = new Set([...(data?.cables?.map(c => c.cable_id) || []), ...(jc?.ofc_cable_id ? [jc.ofc_cable_id] : []), ...displayedCableIds]);

    allIdsToShow.forEach(cableId => {
      if (!cableId) return;
      const existingCableData = data?.cables?.find(c => c.cable_id === cableId);
      if (existingCableData) {
        cablesMap.set(cableId, existingCableData);
        return;
      }
      const cableInfo = addableCablesData?.find(c => c.id === cableId);
      if (cableInfo) {
        // THE FIX: No 'as any' needed because OfcForSelection type now has capacity
        const capacity = cableInfo.capacity || 24;
        cablesMap.set(cableId, {
          cable_id: cableId, route_name: cableInfo.route_name, capacity: capacity,
          start_node: '...', end_node: '...',
          fibers: Array.from({ length: capacity }, (_, i) => ({
            fiber_no: i + 1, status: 'available', splice_id: null,
            connected_to_cable: null, connected_to_fiber: null
          }))
        });
      }
    });
    return Array.from(cablesMap.values());
  }, [data?.cables, displayedCableIds, addableCablesData, jc]);

  const addCableOptions = useMemo(() => {
    const currentIds = new Set(allCablesInMatrix.map(c => c.cable_id));
    return addableCablesData?.filter(c => !currentIds.has(c.id)).map(c => ({ value: c.id, label: c.route_name })) || [];
  }, [addableCablesData, allCablesInMatrix]);

  // ... (all other handlers remain the same)
  const handleAddCableToMatrix = () => {
    if (cableToAdd) {
      setDisplayedCableIds(prev => new Set(prev).add(cableToAdd));
      setCableToAdd(null);
    }
  }

  const handleFiberClick = (cableId: string, fiber: FiberInfo) => {
    const clickedFiber = { cableId, fiber };
    if (selectedFiber?.cableId === cableId && selectedFiber?.fiber.fiber_no === fiber.fiber_no) {
      setSelectedFiber(null); return;
    }
    if (!selectedFiber) {
      setSelectedFiber(clickedFiber); return;
    }
    if (selectedFiber.fiber.status === 'available' && fiber.status === 'available') {
      handleSplice(selectedFiber, clickedFiber);
    } else {
      setSelectedFiber(clickedFiber);
    }
  };

  const handleSplice = (incoming: { cableId: string; fiber: FiberInfo }, outgoing: { cableId: string; fiber: FiberInfo }) => {
    if (!jc) return;
    manageSpliceMutation.mutate({
      action: 'create', jcId: jc.id, incomingCableId: incoming.cableId,
      incomingFiberNo: incoming.fiber.fiber_no, outgoingCableId: outgoing.cableId,
      outgoingFiberNo: outgoing.fiber.fiber_no, spliceType: 'pass_through',
    }, {
      onSuccess: () => {
        toast.success(`Spliced F${incoming.fiber.fiber_no} to F${outgoing.fiber.fiber_no}`);
        setSelectedFiber(null); refetch();
      },
      onError: (err) => toast.error(`Splice Error: ${err.message}`),
    });
  };

  const handleTerminate = () => {
    if (!jc || !selectedFiber || selectedFiber.fiber.status !== 'available') {
        toast.warning("Please select an available fiber to terminate."); return;
    }
    manageSpliceMutation.mutate({
        action: 'create', jcId: jc.id, incomingCableId: selectedFiber.cableId,
        incomingFiberNo: selectedFiber.fiber.fiber_no, spliceType: 'termination',
    }, {
        onSuccess: () => {
            toast.success(`Fiber F${selectedFiber.fiber.fiber_no} terminated successfully.`);
            setSelectedFiber(null); refetch();
        },
        onError: (err) => toast.error(`Termination Error: ${err.message}`),
    });
  }

  const handleUnsplice = () => {
    if (!jc || !selectedFiber || selectedFiber.fiber.status === 'available' || !selectedFiber.fiber.splice_id) {
        toast.warning("Please select a used fiber to un-splice."); return;
    }
    manageSpliceMutation.mutate({
        action: 'delete', jcId: jc.id, spliceId: selectedFiber.fiber.splice_id,
    }, {
        onSuccess: () => {
            toast.success(`Splice for F${selectedFiber.fiber.fiber_no} has been removed.`);
            setSelectedFiber(null); refetch();
        },
        onError: (err) => toast.error(`Un-splice Error: ${err.message}`),
    });
  };

  const handleAutoSplice = () => {
    if (!jc || allCablesInMatrix.length !== 2) {
        toast.error("Auto-splice only works when exactly two cables are in the matrix."); return;
    }
    const cable1Id = allCablesInMatrix[0].cable_id;
    const cable2Id = allCablesInMatrix[1].cable_id;
    autoSpliceMutation.mutate({ jcId: jc.id, cable1Id, cable2Id }, {
        onSuccess: () => refetch()
    });
  };

  const renderContent = () => {
    if (isLoading) return <PageSpinner text="Loading Splicing Details..." />;
    if (isError) return <div className="text-red-500 p-4">Error: {error.message}</div>;

    const selectedCable = allCablesInMatrix.find(c => c.cable_id === selectedFiber?.cableId);

    return (
      <>
        <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between flex-wrap gap-4">
            <div>
                <h4 className="font-semibold text-gray-800 dark:text-white">Selection</h4>
                {selectedFiber ? (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        Selected: <span className="font-bold font-mono">{selectedCable?.route_name} / F{selectedFiber.fiber.fiber_no}</span>
                    </p>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Select a fiber to start an action.</p>
                )}
            </div>
            <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={handleAutoSplice} disabled={allCablesInMatrix.length !== 2 || autoSpliceMutation.isPending || manageSpliceMutation.isPending} title={allCablesInMatrix.length !== 2 ? "Only available for JCs with 2 cables" : "Auto-splice 1-to-1"}>
                    <Zap className="h-4 w-4 mr-2" /> Auto-Splice Straight
                </Button>
                <Button variant="outline" size="sm" onClick={handleTerminate} disabled={!selectedFiber || selectedFiber.fiber.status !== 'available' || manageSpliceMutation.isPending}>
                    <LogOut className="h-4 w-4 mr-2" /> Terminate
                </Button>
                <Button variant="danger" size="sm" onClick={handleUnsplice} disabled={!selectedFiber || selectedFiber.fiber.status === 'available' || manageSpliceMutation.isPending}>
                    <Link2Off className="h-4 w-4 mr-2" /> Un-Splice
                </Button>
            </div>
        </div>

        <div className="flex gap-4 overflow-x-auto p-4 bg-gray-100 dark:bg-gray-900 rounded-b-lg">
          {allCablesInMatrix.length > 0 ? (
            allCablesInMatrix.map((cable: CableInJc) => (
              <div key={cable.cable_id} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm min-w-[250px] flex-shrink-0">
                <div className="border-b dark:border-gray-600 pb-2 mb-2">
                    <h4 className="font-bold text-gray-800 dark:text-white truncate" title={cable.route_name}>{cable.route_name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{cable.start_node} ↔ {cable.end_node}</p>
                </div>
                <div className="space-y-1 max-h-[55vh] overflow-y-auto pr-1">
                  {cable.fibers.map(fiber => (
                    <Fiber
                      key={fiber.fiber_no} fiber={fiber}
                      isSelected={selectedFiber?.cableId === cable.cable_id && selectedFiber?.fiber.fiber_no === fiber.fiber_no}
                      isPotentialTarget={!!selectedFiber && selectedFiber.cableId !== cable.cable_id && selectedFiber.fiber.status === 'available' && fiber.status === 'available'}
                      onClick={() => handleFiberClick(cable.cable_id, fiber)}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="w-full text-center p-8 text-gray-500">
                No cables are currently associated with this JC. Use the &apos;Add Cable&apos; panel to begin splicing.
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm min-w-[220px] flex-shrink-0 flex flex-col justify-center items-center border-2 border-dashed dark:border-gray-600">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Add Cable to Matrix</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">Select a cable to add it to this view for splicing.</p>
                <SearchableSelect
                    options={addCableOptions}
                    value={cableToAdd || ""}
                    onChange={(value) => setCableToAdd(value)}
                    placeholder={isLoadingAddableCables ? 'Loading...' : 'Search for a cable...'}
                    className="w-full"
                    disabled={isLoadingAddableCables}
                    clearable
                />
                <Button size="sm" className="mt-3 w-full" onClick={handleAddCableToMatrix} disabled={!cableToAdd}>
                    <PlusCircle className="h-4 w-4 mr-2"/>
                    Add to View
                </Button>
          </div>
        </div>
      </>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Splice Matrix: ${data?.jc_details?.name || jc?.name || 'Loading...'}`}
      size="full"
      className="!p-0"
    >
      {renderContent()}
    </Modal>
  );
};