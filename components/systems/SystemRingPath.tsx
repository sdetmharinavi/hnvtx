"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useTableQuery } from "@/hooks/database";
import { useSystemPath } from "@/hooks/database/path-queries";
import { Button } from "@/components/common/ui/Button";
import { FiPlus } from "react-icons/fi";
import { AddSegmentModal } from "./AddSegmentModal";
import { toast } from "sonner";
import { Row } from "@/hooks/database";
import { CreatePathModal } from "./CreatePathModal";
import { useDeletePathSegment, useReorderPathSegments } from "@/hooks/database/path-mutations";
import { DragEndEvent } from '@dnd-kit/core';
import { PathSegmentList } from "./PathSegmentList";

interface Props {
  system: Row<'systems'> & { node: Row<'nodes'> | null };
}

export function SystemRingPath({ system }: Props) {
  const supabase = createClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatePathModalOpen, setIsCreatePathModalOpen] = useState(false);

  const { data: logicalPath, refetch: refetchLogicalPath } = useTableQuery(supabase, 'logical_fiber_paths', {
    filters: { source_system_id: system.id },
    limit: 1
  });
  const path = logicalPath?.[0];

  const { data: pathSegments, isLoading, refetch: refetchSegments } = useSystemPath(path?.id || null);

  const deleteSegmentMutation = useDeletePathSegment();
  const reorderSegmentsMutation = useReorderPathSegments();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && pathSegments && path) {
      const oldIndex = pathSegments.findIndex(s => s.id === active.id);
      const newIndex = pathSegments.findIndex(s => s.id === over.id);

      const reorderedSegments = Array.from(pathSegments);
      const [movedItem] = reorderedSegments.splice(oldIndex, 1);
      reorderedSegments.splice(newIndex, 0, movedItem);

      const newSegmentIds = reorderedSegments.map(s => s.id);
      reorderSegmentsMutation.mutate({ pathId: path.id, segmentIds: newSegmentIds });
    }
  };

  const handleDeleteSegment = (segmentId: string) => {
    if (window.confirm("Are you sure you want to remove this segment from the path?") && path) {
      deleteSegmentMutation.mutate({ segmentId, pathId: path.id });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">
      <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-xl font-semibold">Ring Path Builder</h3>
        {!path ? (
            <Button onClick={() => setIsCreatePathModalOpen(true)}>Initialize Path</Button>
        ) : (
            <Button onClick={() => setIsModalOpen(true)} leftIcon={<FiPlus />}>Add Segment</Button>
        )}
      </div>

      <div className="p-4">
        {isLoading && <p>Loading path...</p>}
        {!isLoading && (!pathSegments || pathSegments.length === 0) && (
            <p className="text-gray-500 text-center py-8">
                {path ? "No segments defined for this path. Click 'Add Segment' to begin." : "Initialize the path to start building."}
            </p>
        )}
        {pathSegments && pathSegments.length > 0 && (
          <PathSegmentList
            segments={pathSegments}
            onDragEnd={handleDragEnd}
            onDelete={handleDeleteSegment}
          />
        )}
      </div>

      {isModalOpen && path && system.node && (
        <AddSegmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          logicalPathId={path.id}
          sourceNodeId={system.node.id}
          currentSegments={pathSegments || []}
          onSegmentAdded={() => {
            refetchSegments();
            setIsModalOpen(false);
          }}
        />
      )}
      {isCreatePathModalOpen && (
          <CreatePathModal 
            isOpen={isCreatePathModalOpen}
            onClose={() => setIsCreatePathModalOpen(false)}
            system={system}
            onPathCreated={refetchLogicalPath}
          />
      )}
    </div>
  );
}