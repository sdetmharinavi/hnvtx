"use client";

import { useAvailablePathSegments } from "@/hooks/database/path-queries";
import { Modal } from "../common/ui/Modal";
import { useState } from "react";
import { Button } from "../common/ui/Button";
import { useTableInsert } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Row } from "@/hooks/database";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  logicalPathId: string;
  sourceNodeId: string;
  currentSegments: Row<'v_system_ring_paths_detailed'>[];
  onSegmentAdded: () => void;
}

export function AddSegmentModal({ isOpen, onClose, logicalPathId, sourceNodeId, currentSegments, onSegmentAdded }: Props) {
  const [selectedCableId, setSelectedCableId] = useState<string | null>(null);
  const supabase = createClient();
  
  const { data: availableCables, isLoading } = useAvailablePathSegments(sourceNodeId, currentSegments);

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
          Available Cables
        </label>
        {isLoading && <p>Loading available cables...</p>}
        {!isLoading && (!availableCables || availableCables.length === 0) && (
            <p className="text-gray-500">No further connecting cables found from the last node in the path.</p>
        )}
        {availableCables && availableCables.length > 0 && (
            <select
                id="cable-select"
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={selectedCableId || ""}
                onChange={(e) => setSelectedCableId(e.target.value)}
            >
                <option value="" disabled>Select a cable...</option>
                {availableCables.map((cable: any) => (
                    <option key={cable.id} value={cable.id}>
                        {cable.route_name} ({cable.sn.name} → {cable.en.name})
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