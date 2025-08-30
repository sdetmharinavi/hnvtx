"use client";

import { Row } from "@/hooks/database";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "../common/ui/Button";
import { FiTrash2, FiMove } from "react-icons/fi";

interface SortableItemProps {
    segment: Row<'v_system_ring_paths_detailed'>;
    onDelete: () => void;
}

function SortableSegmentItem({ segment, onDelete }: SortableItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: segment.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <li ref={setNodeRef} style={style} className="mb-6 ml-6 flex items-center gap-4">
             <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full -left-4 ring-8 ring-white dark:ring-gray-800 dark:bg-blue-900">
                {segment.path_order}
            </span>
            <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                <h4 className="font-semibold text-gray-900 dark:text-white">{segment.route_name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {segment.start_node_name} → {segment.end_node_name}
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50">
                    <FiTrash2 />
                </Button>
                <Button variant="ghost" size="sm" {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                    <FiMove />
                </Button>
            </div>
        </li>
    );
}

interface ListProps {
    segments: Row<'v_system_ring_paths_detailed'>[];
    onDragEnd: (event: DragEndEvent) => void;
    onDelete: (id: string) => void;
}

export function PathSegmentList({ segments, onDragEnd, onDelete }: ListProps) {
    const sensors = useSensors(useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }));

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={segments.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-4">
                    {segments.map(segment => (
                        <SortableSegmentItem
                            key={segment.id}
                            segment={segment}
                            onDelete={() => onDelete(segment.id)}
                        />
                    ))}
                </ol>
            </SortableContext>
        </DndContext>
    );
}