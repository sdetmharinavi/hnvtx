"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { Modal } from "@/components/common/ui/Modal";
import { createClient } from "@/utils/supabase/client";
import { Database, TablesInsert } from "@/types/supabase-types";
import {
  useTableInsert,
  useTableUpdate,
  useTableQuery,
} from "@/hooks/database";
import { nodeFormSchema, type NodeFormData } from "@/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormCard } from "@/components/common/ui/form/FormCard";
import {
  FormInput,
  FormSearchableSelect,
  FormTextarea,
} from "@/components/common/ui/form/FormControls";
import { Option } from "@/components/common/ui/select/SearchableSelect";

export type NodeRow = Database["public"]["Tables"]["nodes"]["Row"];
export type NodeInsert = TablesInsert<"nodes">;

interface NodeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingNode?: NodeRow | null;
  onCreated?: (node: NodeRow) => void;
  onUpdated?: (node: NodeRow) => void;
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
    resolver: zodResolver(nodeFormSchema),
    defaultValues: {
      name: "",
      node_type_id: null,
      ip_address: null,
      latitude: 0.0,
      longitude: 0.0,
      vlan: null,
      site_id: null,
      builtup: null,
      maintenance_terminal_id: null,
      ring_id: null,
      order_in_ring: null,
      ring_status: "ACTIVE",
      east_port: null,
      west_port: null,
      remark: null,
      status: true,
    },
  });

  const supabase = createClient();
  const { mutate: insertNode, isPending: creating } = useTableInsert(
    supabase,
    "nodes"
  );
  const { mutate: updateNode, isPending: updating } = useTableUpdate(
    supabase,
    "nodes"
  );

  const isEdit = useMemo(() => Boolean(editingNode), [editingNode]);

  // Fetch node types, rings, and maintenance areas
  const { data: nodeTypes = [] } = useTableQuery(
    supabase,
    "lookup_types",
    {
      filters: {
        category: { operator: "eq", value: "NODE_TYPES" },
        name: { operator: "neq", value: "DEFAULT" },
      },
      orderBy: [{ column: "name", ascending: true }],
    }
  );
  const { data: rings = [] } = useTableQuery(
    supabase,
    "rings",
    {
      filters: { status: { operator: "eq", value: true } },
      orderBy: [{ column: "name", ascending: true }],
    }
  );
  const { data: maintenanceAreas = [] } =
    useTableQuery(supabase, "maintenance_areas", {
      filters: { status: { operator: "eq", value: true } },
      orderBy: [{ column: "name", ascending: true }],
    });

  useEffect(() => {
    if (!isOpen) return;
    if (editingNode) {
      reset({
        name: editingNode.name ?? "",
        node_type_id: editingNode.node_type_id ?? null,
        ip_address:
          typeof editingNode.ip_address === "string"
            ? editingNode.ip_address
            : null,
        latitude: editingNode.latitude ?? 0.0,
        longitude: editingNode.longitude ?? 0.0,
        vlan: typeof editingNode.vlan === "string" ? editingNode.vlan : null,
        site_id:
          typeof editingNode.site_id === "string" ? editingNode.site_id : null,
        builtup:
          typeof editingNode.builtup === "string" ? editingNode.builtup : null,
        maintenance_terminal_id: editingNode.maintenance_terminal_id ?? null,
        ring_id: editingNode.ring_id ?? null,
        order_in_ring: editingNode.order_in_ring ?? null,
        ring_status:
          typeof editingNode.ring_status === "string"
            ? editingNode.ring_status
            : "ACTIVE",
        east_port:
          typeof editingNode.east_port === "string"
            ? editingNode.east_port
            : null,
        west_port:
          typeof editingNode.west_port === "string"
            ? editingNode.west_port
            : null,
        remark:
          typeof editingNode.remark === "string" ? editingNode.remark : null,
        status: editingNode.status ?? true,
      });
    } else {
      reset({
        name: "",
        node_type_id: null,
        ip_address: null,
        latitude: 0.0,
        longitude: 0.0,
        vlan: null,
        site_id: null,
        builtup: null,
        maintenance_terminal_id: null,
        ring_id: null,
        order_in_ring: null,
        ring_status: "ACTIVE",
        east_port: null,
        west_port: null,
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
    (formData: NodeFormData) => {
      const submitData = {
        name: formData.name.trim(),
        node_type_id: formData.node_type_id,
        ip_address: formData.ip_address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        vlan: formData.vlan,
        site_id: formData.site_id,
        builtup: formData.builtup,
        maintenance_terminal_id: formData.maintenance_terminal_id,
        ring_id: formData.ring_id,
        order_in_ring: formData.order_in_ring,
        ring_status: formData.ring_status,
        east_port: formData.east_port,
        west_port: formData.west_port,
        remark: formData.remark,
        status: formData.status,
      };

      if (isEdit && editingNode) {
        updateNode(
          { id: editingNode.id, data: submitData as Partial<NodeInsert> },
          {
            onSuccess: (data: unknown) => {
              onUpdated?.(Array.isArray(data) ? data[0] : data);
              onClose();
            },
          }
        );
      } else {
        insertNode(submitData as NodeInsert, {
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
      title={""}
      size="full"
      visible={false}
      className="h-screen w-screen transparent bg-gray-700 rounded-2xl"
    >
      <FormCard
        title={isEdit ? "Edit Node" : "Add Node"}
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

        {/* IP Address */}
        <FormInput
          name="ip_address"
          label="IP Address"
          register={register}
          error={errors.ip_address}
          disabled={submitting}
          className="dark:bg-gray-900 dark:text-gray-100"
        />

        {/* Ring ID */}
        <FormSearchableSelect
          name="ring_id"
          label="Ring"
          control={control}
          options={rings.map(
            (ring) =>
              ({
                value: ring.id,
                label: ring.name,
              } as Option)
          )}
          error={errors.ring_id}
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

        {/* Ring Status */}
        <FormSearchableSelect
          name="ring_status"
          label="Ring Status"
          control={control}
          options={[
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Inactive" },
            { value: "MAINTENANCE", label: "Maintenance" },
          ]}
          error={errors.ring_status}
          disabled={submitting}
          className="dark:bg-gray-900 dark:text-gray-100"
        />

        {/* Site */}
        <FormInput
          name="site_id"
          label="Site"
          register={register}
          error={errors.site_id}
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
          className="dark:bg-gray-900 dark:text-gray-100"
        />

        <FormInput
          name="longitude"
          label="Longitude"
          register={register}
          error={errors.longitude}
          disabled={submitting}
          className="dark:bg-gray-900 dark:text-gray-100"
        />

        {/* Order in Ring */}
        <FormInput
          name="order_in_ring"
          label="Order in Ring"
          register={register}
          error={errors.order_in_ring}
          disabled={submitting}
          className="dark:bg-gray-900 dark:text-gray-100"
        />

        {/* VLAN */}
        <FormInput
          name="vlan"
          label="VLAN"
          register={register}
          error={errors.vlan}
          disabled={submitting}
          className="dark:bg-gray-900 dark:text-gray-100"
        />

        {/* Builtup */}
        <FormTextarea
          name="builtup"
          label="Builtup Area"
          control={control}
          error={errors.builtup}
          disabled={submitting}
          className="dark:bg-gray-900 dark:text-gray-100"
        />

        {/* Ports */}
        <FormInput
          name="east_port"
          label="East Port"
          register={register}
          error={errors.east_port}
          disabled={submitting}
          className="dark:bg-gray-900 dark:text-gray-100"
        />

        <FormInput
          name="west_port"
          label="West Port"
          register={register}
          error={errors.west_port}
          disabled={submitting}
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
        <FormInput
          name="status"
          label="Status"
          register={register}
          error={errors.status}
          disabled={submitting}
          className="dark:bg-gray-900 dark:text-gray-100"
        />
      </FormCard>
    </Modal>
  );
}
