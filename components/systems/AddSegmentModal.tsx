"use client";

import { Modal } from "../common/ui/Modal";
import { useState} from "react";
import { Button } from "../common/ui/Button";
import { useTableInsert, useTableQuery } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Row } from "@/hooks/database";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  logicalPathId: string;
  currentSegments: Row<'v_system_ring_paths_detailed'>[];
  onSegmentAdded: () => void;
}

export function AddSegmentModal({ isOpen, onClose, logicalPathId, currentSegments, onSegmentAdded }: Props) {
  const [selectedCableId, setSelectedCableId] = useState<string | null>(null);
  const supabase = createClient();
  
  const lastSegment = currentSegments.length > 0 ? currentSegments[currentSegments.length - 1] : null;
  const nextNodeId = lastSegment ? lastSegment.end_node_id : null;

  const { data: availableCables, isLoading } = useTableQuery(supabase, 'ofc_cables', {
      columns: 'id, route_name, sn:sn_id(name), en:en_id(name)',
      filters: nextNodeId ? { or: `(sn_id.eq.${nextNodeId},en_id.eq.${nextNodeId})` } : {},
      enabled: !!nextNodeId
  });

  const { mutate: addSegment, isPending } = useTableInsert(supabase, 'logical_path_segments', {
    onSuccess: () => {
        toast.success("Segment added to path!");
        onSegmentAdded();
    },
    onError: (err) => toast.error(`Failed to add segment: ${err.message}`)
  });

  const handleAdd = () => {
    if (!selectedCableId) {
        toast.error("Please select a cable segment.");
        return;
    }
    addSegment({
        logical_path_id: logicalPathId,
        ofc_cable_id: selectedCableId,
        path_order: (currentSegments.length || 0) + 1,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Next Path Segment">
      <div className="space-y-4">
        <label htmlFor="cable-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Available Cables from {lastSegment?.end_node_name || "Start Node"}
        </label>
        {isLoading && <p>Loading available cables...</p>}
        {!isLoading && (!availableCables?.data || availableCables.data.length === 0) && (
            <p className="text-gray-500">No further connecting cables found.</p>
        )}
        {availableCables && availableCables.data.length > 0 && (
            <select
                id="cable-select"
                className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={selectedCableId || ""}
                onChange={(e) => setSelectedCableId(e.target.value)}
            >
                <option value="" disabled>Select a cable...</option>
                {availableCables?.data?.map((cable) => (
                    <option key={cable.id} value={cable.id}>
                        {cable.route_name}
                    </option>
                ))}
            </select>
        )}
        <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
            <Button onClick={handleAdd} disabled={isPending || !selectedCableId}>
                {isPending ? "Adding..." : "Add to Path"}
            </Button>
        </div>
      </div>
    </Modal>
  );
}