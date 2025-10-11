'use client';

import React, { useCallback, useEffect, useMemo } from 'react';
import { Modal } from '@/components/common/ui/Modal';
import { useTableQuery } from '@/hooks/database';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormCard } from '@/components/common/form/FormCard';
import {
  FormInput,
  FormSearchableSelect,
  FormSwitch,
  FormTextarea,
} from '@/components/common/form/FormControls';
import {
  NodesInsertSchema,
  nodesInsertSchema,
  NodesRowSchema,
} from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';

interface NodeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingNode?: NodesRowSchema | null;
  onSubmit: (data: NodesInsertSchema) => void;
  isLoading: boolean;
}

export function NodeFormModal({
  isOpen,
  onClose,
  editingNode,
  onSubmit,
  isLoading,
}: NodeFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<NodesInsertSchema>({
    resolver: zodResolver(nodesInsertSchema),
    defaultValues: {
      name: '',
      node_type_id: null,
      latitude: null,
      longitude: null,
      maintenance_terminal_id: null,
      remark: null,
      status: true,
    },
  });

  const supabase = createClient();
  const isEdit = useMemo(() => Boolean(editingNode), [editingNode]);

  const { data: nodeTypes = { data: [] } } = useTableQuery(supabase, 'lookup_types', {
    filters: {
      category: { operator: 'eq', value: 'NODE_TYPES' },
      name: { operator: 'neq', value: 'DEFAULT' },
    },
    orderBy: [{ column: 'name', ascending: true }],
  });
  const { data: maintenanceAreas = { data: [] } } = useTableQuery(
    supabase,
    'maintenance_areas',
    {
      filters: { status: { operator: 'eq', value: true } },
      orderBy: [{ column: 'name', ascending: true }],
    }
  );

  useEffect(() => {
    if (!isOpen) return;
    if (editingNode) {
      reset({
        name: editingNode.name ?? '',
        node_type_id: editingNode.node_type_id ?? null,
        latitude: editingNode.latitude,
        longitude: editingNode.longitude,
        maintenance_terminal_id: editingNode.maintenance_terminal_id ?? null,
        remark: typeof editingNode.remark === 'string' ? editingNode.remark : null,
        status: editingNode.status ?? true,
      });
    } else {
      reset({
        name: '',
        node_type_id: null,
        latitude: null,
        longitude: null,
        maintenance_terminal_id: null,
        remark: null,
        status: true,
      });
    }
  }, [isOpen, editingNode, reset]);

  const onValidSubmit = useCallback(
    (formData: NodesInsertSchema) => {
      onSubmit(formData);
    },
    [onSubmit]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={''}
      size="full"
      visible={false}
      className="h-screen w-screen transparent bg-gray-700 rounded-2xl"
    >
      <div className="h-full w-full overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4 sm:p-6 md:p-8">
          <div className="w-full max-w-5xl">
            <FormCard
              title={isEdit ? 'Edit Node' : 'Add Node'}
              onSubmit={handleSubmit(onValidSubmit)}
              onCancel={onClose}
              isLoading={isLoading}
              standalone
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="md:col-span-2">
                      <FormInput name="name" label="Node Name" register={register} error={errors.name} disabled={isLoading} placeholder="Enter node name" />
                    </div>
                    {/* THE FIX: Access the .data property before mapping */}
                    <FormSearchableSelect name="node_type_id" label="Node Type" control={control} options={nodeTypes.data.map(type => ({ value: type.id, label: type.name }))} error={errors.node_type_id} disabled={isLoading} placeholder="Select node type" />
                    {/* THE FIX: Access the .data property before mapping */}
                    <FormSearchableSelect name="maintenance_terminal_id" label="Maintenance Terminal" control={control} options={maintenanceAreas.data.map(mt => ({ value: mt.id, label: mt.name }))} error={errors.maintenance_terminal_id} disabled={isLoading} placeholder="Select maintenance terminal" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                    Location Coordinates
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    <FormInput name="latitude" label="Latitude" register={register} error={errors.latitude} disabled={isLoading} type="number" step="any" placeholder="e.g., 22.5726" />
                    <FormInput name="longitude" label="Longitude" register={register} error={errors.longitude} disabled={isLoading} type="number" step="any" placeholder="e.g., 88.3639" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                    Additional Information
                  </h3>
                  <div className="space-y-4 md:space-y-6">
                    <FormTextarea name="remark" label="Remark" control={control} error={errors.remark} disabled={isLoading} placeholder="Add any additional notes or remarks" rows={4} />
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Node Status</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enable or disable this node</p>
                      </div>
                      <FormSwitch name="status" label="" control={control} error={errors.status} />
                    </div>
                  </div>
                </div>
              </div>
            </FormCard>
          </div>
        </div>
      </div>
    </Modal>
  );
}