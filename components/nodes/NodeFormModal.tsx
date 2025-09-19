'use client';

import React, { useCallback, useEffect, useMemo } from 'react';
import { Modal } from '@/components/common/ui/Modal';
import { createClient } from '@/utils/supabase/client';
import {
  useTableInsert,
  useTableUpdate,
  useTableQuery,
} from '@/hooks/database';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormCard } from '@/components/common/form/FormCard';
import {
  FormInput,
  FormSearchableSelect,
  FormSwitch,
  FormTextarea,
} from '@/components/common/form/FormControls';
import { Option } from '@/components/common/ui/select/SearchableSelect';
import {
  NodesInsertSchema,
  nodesInsertSchema,
  NodesRowSchema,
  NodesUpdateSchema,
} from '@/schemas/zod-schemas';

interface NodeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingNode?: NodesRowSchema | null;
  onCreated?: (node: NodesRowSchema) => void;
  onUpdated?: (node: NodesRowSchema) => void;
}

export function NodeFormModal({
  isOpen,
  onClose,
  editingNode,
  onCreated,
  onUpdated,
}: NodeFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
  } = useForm({
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
  const { mutate: insertNode, isPending: creating } = useTableInsert(
    supabase,
    'nodes'
  );
  const { mutate: updateNode, isPending: updating } = useTableUpdate(
    supabase,
    'nodes'
  );

  const isEdit = useMemo(() => Boolean(editingNode), [editingNode]);

  // Fetch node types, rings, and maintenance areas
  const { data: nodeTypes = [] } = useTableQuery(supabase, 'lookup_types', {
    filters: {
      category: { operator: 'eq', value: 'NODE_TYPES' },
      name: { operator: 'neq', value: 'DEFAULT' },
    },
    orderBy: [{ column: 'name', ascending: true }],
  });
  const { data: maintenanceAreas = [] } = useTableQuery(
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
        remark:
          typeof editingNode.remark === 'string' ? editingNode.remark : null,
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

  const handleClose = useCallback(() => {
    if (creating || updating) return;
    onClose();
  }, [creating, updating, onClose]);

  const onValidSubmit = useCallback(
    (formData: NodesInsertSchema) => {
      const cleanNumber = (val: unknown) =>
        typeof val === 'number' && !Number.isNaN(val) ? val : null;

      const submitData = {
        name: formData.name.trim(),
        node_type_id: formData.node_type_id,
        latitude: cleanNumber(formData.latitude),
        longitude: cleanNumber(formData.longitude),
        maintenance_terminal_id: formData.maintenance_terminal_id,
        remark: formData.remark,
        status: formData.status,
      };

      if (isEdit && editingNode) {
        updateNode(
          {
            id: editingNode.id,
            data: submitData as Partial<NodesUpdateSchema>,
          },
          {
            onSuccess: (data: unknown) => {
              onUpdated?.(Array.isArray(data) ? data[0] : data);
              onClose();
            },
          }
        );
      } else {
        insertNode(submitData as NodesInsertSchema, {
          onSuccess: (data: unknown) => {
            onCreated?.(Array.isArray(data) ? data[0] : data);
            onClose();
          },
        });
      }
    },
    [isEdit, editingNode, updateNode, insertNode, onUpdated, onCreated, onClose]
  );

  const submitting = creating || updating || isSubmitting;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={''}
      size="full"
      visible={false}
      className="h-screen w-screen transparent bg-gray-700 rounded-2xl"
    >
      <FormCard
        title={isEdit ? 'Edit Node' : 'Add Node'}
        onSubmit={handleSubmit(onValidSubmit)}
        onCancel={handleClose}
        standalone
      >
        {/* Name */}
        <FormInput
          name="name"
          label="Node Name"
          register={register}
          error={errors.name}
          disabled={submitting}
          className="dark:bg-gray-900 dark:text-gray-100"
        />

        {/* Node Type */}
        <FormSearchableSelect
          name="node_type_id"
          label="Node Type"
          control={control}
          options={nodeTypes.map(
            (type) =>
              ({
                value: type.id,
                label: type.name,
              } as Option)
          )}
          error={errors.node_type_id}
          disabled={submitting}
          className="dark:bg-gray-900 dark:text-gray-100"
        />

        {/* Maintenance Terminal */}
        <FormSearchableSelect
          name="maintenance_terminal_id"
          label="Maintenance Terminal"
          control={control}
          options={maintenanceAreas.map(
            (mt) =>
              ({
                value: mt.id,
                label: mt.name,
              } as Option)
          )}
          error={errors.maintenance_terminal_id}
          disabled={submitting}
          className="dark:bg-gray-900 dark:text-gray-100"
        />

        {/* Coordinates */}
        <FormInput
          name="latitude"
          label="Latitude"
          register={register}
          error={errors.latitude}
          disabled={submitting}
          type="number"
          className="dark:bg-gray-900 dark:text-gray-100"
        />

        <FormInput
          name="longitude"
          label="Longitude"
          register={register}
          error={errors.longitude}
          disabled={submitting}
          type="number"
          className="dark:bg-gray-900 dark:text-gray-100"
        />

        {/* Remark */}
        <FormTextarea
          name="remark"
          label="Remark"
          control={control}
          error={errors.remark}
          disabled={submitting}
          className="dark:bg-gray-900 dark:text-gray-100"
        />

        {/* Status */}
        <FormSwitch
          name="status"
          label="Status"
          control={control}
          error={errors.status}
          className="dark:bg-gray-900 dark:text-gray-100"
        />
      </FormCard>
    </Modal>
  );
}
