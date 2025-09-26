"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useTableQuery } from "@/hooks/database";
import { Button } from "@/components/common/ui/Button";
import { FiPlus } from "react-icons/fi";
import { Row } from "@/hooks/database";
import { useSystemPath } from "@/hooks/database/path-queries";
import { useDeletePathSegment, useReorderPathSegments } from "@/hooks/database/path-mutations";
import { DragEndEvent } from "@dnd-kit/core";

// Import all child components
import { CreatePathModal } from "./CreatePathModal";
import { AddSegmentModal } from "./AddSegmentModal";
import { PathSegmentList } from "./PathSegmentList";
import { FiberProvisioning } from "./FiberProvisioning";
import { LoadingSpinner } from "../common/ui/LoadingSpinner";

interface Props {
  system: Row<'systems'> & { node: Row<'nodes'> | null };
}

export function SystemRingPath({ system }: Props) {
  const supabase = createClient();
  const [isAddSegmentModalOpen, setIsAddSegmentModalOpen] = useState(false);
  const [isCreatePathModalOpen, setIsCreatePathModalOpen] = useState(false);

  // --- Data Fetching ---
  const { data: logicalPathData, refetch: refetchLogicalPath, isLoading: isLoadingPath } = useTableQuery(supabase, 'logical_fiber_paths', {
    filters: { source_system_id: system.id },
    limit: 1
  });
  const path = logicalPathData?.[0];

  const { data: pathSegments, isLoading: isLoadingSegments, refetch: refetchSegments } = useSystemPath(path?.id || null);

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

  // --- Render Logic ---
  if (isLoadingPath) {
    return <div className="p-4 text-center"><LoadingSpinner text="Loading path information..." /></div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">
      <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-xl font-semibold">Ring Path Builder</h3>
        {!path ? (
            <Button onClick={() => setIsCreatePathModalOpen(true)}>Initialize Path</Button>
        ) : (
            <Button onClick={() => setIsAddSegmentModalOpen(true)} leftIcon={<FiPlus />}>Add Segment</Button>
        )}
      </div>

      <div className="p-4">
        {isLoadingSegments ? (
          <p>Loading path segments...</p>
        ) : (!pathSegments || pathSegments.length === 0) ? (
            <p className="text-gray-500 text-center py-8">
                {path ? "No segments defined. Click 'Add Segment' to begin building the physical path." : "Initialize a logical path to start."}
            </p>
        ) : (
          <PathSegmentList
            segments={pathSegments}
            onDragEnd={handleDragEnd}
            onDelete={handleDeleteSegment}
          />
        )}
      </div>

      {/* Provisioning Section - Renders only when there is a path AND segments */}
      {path && pathSegments && pathSegments.length > 0 && (
        <FiberProvisioning
          pathName={path.path_name ?? ""}
          systemId={system.id}
          physicalPathId={path.id}
        />
      )}
      
      {/* Modals */}
      {isAddSegmentModalOpen && path && system.node && (
        <AddSegmentModal
          isOpen={isAddSegmentModalOpen}
          onClose={() => setIsAddSegmentModalOpen(false)}
          logicalPathId={path.id}
          sourceNodeId={system.node.id}
          currentSegments={pathSegments || []}
          onSegmentAdded={() => {
            refetchSegments();
            setIsAddSegmentModalOpen(false);
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