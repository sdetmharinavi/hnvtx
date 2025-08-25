"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/common/ui/Button";
import { Input } from "@/components/common/ui/Input";
import { Modal } from "@/components/common/ui/Modal";
import { SearchableSelect, Option } from "@/components/common/SearchableSelect";
import { createClient } from "@/utils/supabase/client";
import { Database, TablesInsert } from "@/types/supabase-types";
import { useTableInsert, useTableUpdate, useTableQuery } from "@/hooks/database";
import { nodeFormSchema, type NodeFormData } from "@/schemas";;
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export type NodeRow = Database["public"]["Tables"]["nodes"]["Row"];
export type NodeInsert = TablesInsert<"nodes">;

interface NodeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingNode?: NodeRow | null;
  onCreated?: (node: NodeRow) => void;
  onUpdated?: (node: NodeRow) => void;
}

export function NodeFormModal({ isOpen, onClose, editingNode, onCreated, onUpdated }: NodeFormModalProps) {

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
      ip_address: "",
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
  const { mutate: insertNode, isPending: creating } = useTableInsert(supabase, "nodes");
  const { mutate: updateNode, isPending: updating } = useTableUpdate(supabase, "nodes");

  const isEdit = useMemo(() => Boolean(editingNode), [editingNode]);

  // Fetch node types, rings, and maintenance areas
  const { data: nodeTypes = [], isLoading: nodeTypesLoading } = useTableQuery(supabase, "lookup_types", {
    filters: { category: { operator: "eq", value: "NODE_TYPES" }, name: { operator: "neq", value: "DEFAULT" } },
    orderBy: [{ column: "name", ascending: true }],
  });
  const { data: rings = [], isLoading: ringsLoading } = useTableQuery(supabase, "rings", {
    filters: { status: { operator: "eq", value: true } },
    orderBy: [{ column: "name", ascending: true }],
  });
  const { data: maintenanceAreas = [], isLoading: areasLoading } = useTableQuery(supabase, "maintenance_areas", {
    filters: { status: { operator: "eq", value: true } },
    orderBy: [{ column: "name", ascending: true }],
  });

  useEffect(() => {
    if (!isOpen) return;
    if (editingNode) {
      reset({
        name: editingNode.name ?? "",
        node_type_id: editingNode.node_type_id ?? null,
        ip_address: typeof editingNode.ip_address === 'string' ? editingNode.ip_address : "",
        latitude: editingNode.latitude ?? 0.0,
        longitude: editingNode.longitude ?? 0.0,
        vlan: typeof editingNode.vlan === 'string' ? editingNode.vlan : null,
        site_id: typeof editingNode.site_id === 'string' ? editingNode.site_id : null,
        builtup: typeof editingNode.builtup === 'string' ? editingNode.builtup : null,
        maintenance_terminal_id: editingNode.maintenance_terminal_id ?? null,
        ring_id: editingNode.ring_id ?? null,
        order_in_ring: editingNode.order_in_ring ?? null,
        ring_status: typeof editingNode.ring_status === 'string' ? editingNode.ring_status : "ACTIVE",
        east_port: typeof editingNode.east_port === 'string' ? editingNode.east_port : null,
        west_port: typeof editingNode.west_port === 'string' ? editingNode.west_port : null,
        remark: typeof editingNode.remark === 'string' ? editingNode.remark : null,
        status: editingNode.status ?? true,
      });
    } else {
      reset({
        name: "",
        node_type_id: null,
        ip_address: "",
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

  const onValidSubmit = useCallback((formData: NodeFormData) => {
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
      insertNode(
        submitData as NodeInsert,
        {
          onSuccess: (data: unknown) => {
            onCreated?.(Array.isArray(data) ? data[0] : data);
            onClose();
          },
        }
      );
    }
  }, [isEdit, editingNode, updateNode, insertNode, onUpdated, onCreated, onClose]);

  const submitting = creating || updating || isSubmitting;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? "Edit Node" : "Add Node"} size="full">
      <form onSubmit={handleSubmit(onValidSubmit)} className="flex flex-col h-full">
        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Node Name *
                </label>
                <Input
                  {...register("name")}
                  placeholder="Node Name"
                  disabled={submitting}
                  className="dark:bg-gray-800 dark:text-gray-100"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
              </div>

              {/* IP Address */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  IP Address
                </label>
                <Input
                  {...register("ip_address")}
                  placeholder="e.g., 192.168.1.1"
                  disabled={submitting}
                  className="dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              {/* Ring ID */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ring
                </label>
                <Controller
                  name="ring_id"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      options={rings.map((ring) => ({ 
                        value: ring.id,
                        label: ring.name
                      } as Option))}
                      value={field.value ?? ""}
                      onChange={(value) => field.onChange(value || null)}
                      placeholder="Select ring"
                      searchPlaceholder="Search rings..."
                      clearable={true}
                      className="w-full"
                      disabled={submitting || ringsLoading}
                    />
                  )}
                />
              </div>

              {/* Node Type */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Node Type
                </label>
                <Controller
                  name="node_type_id"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      options={nodeTypes.map((type) => ({ 
                        value: type.id,
                        label: type.name
                      } as Option))}
                      value={field.value ?? ""}
                      onChange={(value) => field.onChange(value || null)}
                      placeholder="Select node type"
                      searchPlaceholder="Search node types..."
                      clearable={true}
                      className="w-full"
                      disabled={submitting || nodeTypesLoading}
                    />
                  )}
                />
              </div>

              {/* Maintenance Terminal */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Maintenance Terminal
                </label>
                <Controller
                  name="maintenance_terminal_id"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      options={maintenanceAreas.map((mt) => ({ 
                        value: mt.id,
                        label: mt.name
                      } as Option))}
                      value={field.value ?? ""}
                      onChange={(value) => field.onChange(value || null)}
                      placeholder="Select maintenance terminal"
                      searchPlaceholder="Search maintenance terminals..."
                      clearable={true}
                      className="w-full"
                      disabled={submitting || areasLoading}
                    />
                  )}
                />
              </div>

              {/* Ring Status */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ring Status
                </label>
                <Controller
                  name="ring_status"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      options={[
                        { value: "ACTIVE", label: "Active" },
                        { value: "INACTIVE", label: "Inactive" },
                        { value: "MAINTENANCE", label: "Maintenance" },
                      ]}
                      value={field.value ?? ""}
                      onChange={(value) => field.onChange(value || null)}
                      placeholder="Select ring status"
                      className="w-full"
                      disabled={submitting}
                    />
                  )}
                />
              </div>

              {/* Site */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Site
                </label>
                <Input
                  {...register("site_id")}
                  placeholder="Site ID"
                  disabled={submitting}
                  className="dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              {/* Coordinates */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Latitude
                </label>
                <Input
                  {...register("latitude", { valueAsNumber: true })}
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  disabled={submitting}
                  className="dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Longitude
                </label>
                <Input
                  {...register("longitude", { valueAsNumber: true })}
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  disabled={submitting}
                  className="dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              {/* Order in Ring */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Order in Ring
                </label>
                <Input
                  {...register("order_in_ring", { valueAsNumber: true })}
                  type="number"
                  placeholder="Order"
                  disabled={submitting}
                  className="dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              {/* VLAN */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  VLAN
                </label>
                <Input
                  {...register("vlan")}
                  placeholder="VLAN ID"
                  disabled={submitting}
                  className="dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              {/* Builtup */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Builtup Area
                </label>
                <Input
                  {...register("builtup")}
                  placeholder="e.g., Rack 5, Unit 10"
                  disabled={submitting}
                  className="dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              {/* Ports */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  East Port
                </label>
                <Input
                  {...register("east_port")}
                  placeholder="East Port"
                  disabled={submitting}
                  className="dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  West Port
                </label>
                <Input
                  {...register("west_port")}
                  placeholder="West Port"
                  disabled={submitting}
                  className="dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              {/* Remark */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Remark
                </label>
                <textarea
                  {...register("remark")}
                  rows={3}
                  placeholder="Remarks..."
                  disabled={submitting}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Status */}
              <div className="flex items-center space-x-3 pt-2 md:col-span-2">
                <input
                  id="status"
                  type="checkbox"
                  {...register("status")}
                  disabled={submitting}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800">
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting} className="dark:border-gray-600 dark:hover:bg-gray-700">
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {isEdit ? "Save Changes" : "Create Node"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
