"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { Modal } from "@/components/common/ui/Modal";
import { createClient } from "@/utils/supabase/client";
import { Database, TablesInsert } from "@/types/supabase-types";
import {
  useTableInsert,
  useTableUpdate,
} from "@/hooks/database";
import { ofcConnectionFormSchema, type OfcConnectionFormData } from "@/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormCard } from "@/components/common/form/FormCard";
import {
  FormInput,
  FormTextarea,
  FormSwitch,
} from "@/components/common/form/FormControls";

export type OfcConnectionsRow = Database["public"]["Tables"]["ofc_connections"]["Row"];
export type OfcConnectionsInsert = TablesInsert<"ofc_connections">;



interface OfcConnectionsFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingOfcConnections?: OfcConnectionsRow | null;
  onCreated?: (ofcConnections: OfcConnectionsRow) => void;
  onUpdated?: (ofcConnections: OfcConnectionsRow) => void;
}

export function OfcConnectionsFormModal({
  isOpen,
  onClose,
  editingOfcConnections,
  onCreated,
  onUpdated,
}: OfcConnectionsFormModalProps) {

  console.log("editingOfcConnections", editingOfcConnections);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    setValue,
    watch,
  } = useForm<OfcConnectionFormData>({
    resolver: zodResolver(ofcConnectionFormSchema),
    defaultValues: {
      ofc_id: "",
      logical_path_id: null,
      system_id: null,
      fiber_role: "",
      fiber_no_sn: 1,
      fiber_no_en: 1,
      path_segment_order: null,
      connection_category: "",
      connection_type: "",
      source_port: null,
      destination_port: null,
      sn_dom: undefined,
      otdr_distance_sn_km: null,
      sn_power_dbm: null,
      en_dom: undefined,
      otdr_distance_en_km: null,
      en_power_dbm: null,
      route_loss_db: undefined,
      status: true,
      remark: null,
    },
  });

  const supabase = createClient();
  const { mutate: insertOfcConnections, isPending: creating } = useTableInsert(
    supabase,
    "ofc_connections"
  );
  const { mutate: updateOfcConnections, isPending: updating } = useTableUpdate(
    supabase,
    "ofc_connections"
  );

  const isEdit = useMemo(() => Boolean(editingOfcConnections), [editingOfcConnections]);

  // Connection types and categories (you might want to fetch these from lookup tables)
  const connectionTypes = [
    { value: "SPLICE", label: "Splice" },
    { value: "CONNECTOR", label: "Connector" },
    { value: "TERMINATION", label: "Termination" },
  ];

  const connectionCategories = [
    { value: "FIBER", label: "Fiber" },
    { value: "CABLE", label: "Cable" },
    { value: "PATH", label: "Path" },
  ];

  const fiberRoles = [
    { value: "WORKING", label: "Working" },
    { value: "PROTECTION", label: "Protection" },
  ];

  useEffect(() => {
    if (!isOpen) return;
    if (editingOfcConnections) {
      reset({
        ...editingOfcConnections,
        sn_dom: editingOfcConnections.sn_dom ? new Date(editingOfcConnections.sn_dom) : undefined,
        en_dom: editingOfcConnections.en_dom ? new Date(editingOfcConnections.en_dom) : undefined,
        en_power_dbm: editingOfcConnections.en_power_dbm ?? null,
        sn_power_dbm: editingOfcConnections.sn_power_dbm ?? null,
        otdr_distance_sn_km: editingOfcConnections.otdr_distance_sn_km ?? null,
        otdr_distance_en_km: editingOfcConnections.otdr_distance_en_km ?? null,
        route_loss_db: editingOfcConnections.route_loss_db ?? null,
      });
    } else {
      reset({
        ofc_id: "",
      logical_path_id: null,
      system_id: null,
      fiber_role: "",
      fiber_no_sn: 1,
      fiber_no_en: 1,
      path_segment_order: null,
      connection_category: "",
      connection_type: "",
      source_port: null,
      destination_port: null,
      sn_dom: undefined,
      otdr_distance_sn_km: null,
      sn_power_dbm: null,
      en_dom: undefined,
      otdr_distance_en_km: null,
      en_power_dbm: null,
      route_loss_db: undefined,
      status: true,
      remark: null,
      });
    }
  }, [isOpen, editingOfcConnections, reset]);

  const handleClose = useCallback(() => {
    if (creating || updating) return;
    onClose();
  }, [creating, updating, onClose]);

  const onValidSubmit = useCallback(
    (formData: OfcConnectionFormData) => {
      if (isEdit && editingOfcConnections) {
        updateOfcConnections(
          { id: editingOfcConnections.id, data: formData as Partial<OfcConnectionsInsert> },
          {
            onSuccess: (data: unknown) => {
              onUpdated?.(Array.isArray(data) ? data[0] : data);
              onClose();
            },
          }
        );
      } else {
        insertOfcConnections(formData as OfcConnectionsInsert, {
          onSuccess: (data: unknown) => {
            onCreated?.(Array.isArray(data) ? data[0] : data);
            onClose();
          },
        });
      }
    },
    [isEdit, editingOfcConnections, updateOfcConnections, insertOfcConnections, onUpdated, onCreated, onClose]
  );

  const submitting = creating || updating || isSubmitting;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? "Edit OFC Connection" : "Add OFC Connection"}
      size="full"
      visible={false}
      className="h-screen w-screen transparent bg-gray-700 rounded-2xl"
    >
      <FormCard
        title={isEdit ? "Edit OFC Connection" : "Add OFC Connection"}
        onSubmit={handleSubmit(onValidSubmit)}
        onCancel={handleClose}
        standalone
      >

        {/* Fiber Role */}
        {/* <FormSearchableSelect
          name="fiber_role"
          label="Fiber Role"
          control={control}
          options={fiberRoles}
          error={errors.fiber_role}
          disabled={submitting}
          
        /> */}

        {/* Fiber Numbers */}
        <FormInput
          name="fiber_no_sn"
          label="Start Node Fiber No. *"
          register={register}
          error={errors.fiber_no_sn}
          disabled={true}
          
        />

        <FormInput
          name="fiber_no_en"
          label="End Node Fiber No."
          register={register}
          error={errors.fiber_no_en}
          disabled={true}
          
        />

        {/* Path Segment Order */}
        <FormInput
          name="path_segment_order"
          label="Path Segment Order"
          register={register}
          error={errors.path_segment_order}
          disabled={submitting}
          
        />

        {/* Connection Category (Required) */}
        {/* <FormSearchableSelect
          name="connection_category"
          label="Connection Category *"
          control={control}
          options={connectionCategories}
          error={errors.connection_category}
          disabled={submitting}
          
        /> */}

        {/* Connection Type (Required) */}
        {/* <FormSearchableSelect
          name="connection_type"
          label="Connection Type *"
          control={control}
          options={connectionTypes}
          error={errors.connection_type}
          disabled={submitting}
          
        /> */}

        <FormInput
          name="otdr_distance_sn_km"
          label="OTDR Distance SN (km)"
          register={register}
          step="0.001"
          error={errors.otdr_distance_sn_km}
          disabled={submitting}
          
        />

        <FormInput
          name="sn_power_dbm"
          label="SN Power (dBm)"
          register={register}
          step="0.01"
          error={errors.sn_power_dbm}
          disabled={submitting}
          
        />

        <FormInput
          name="otdr_distance_en_km"
          label="OTDR Distance EN (km)"
          register={register}
          step="0.001"
          error={errors.otdr_distance_en_km}
          disabled={submitting}
          
        />

        <FormInput
          name="en_power_dbm"
          label="EN Power (dBm)"
          register={register}
          step="0.01"
          error={errors.en_power_dbm}
          disabled={submitting}
          
        />

        {/* Overall Measurements */}
        <FormInput
          name="route_loss_db"
          label="Route Loss (dB)"
          register={register}
          step="0.01"
          error={errors.route_loss_db}
          disabled={submitting}
          
        />

        {/* Status */}
        <div className="flex items-center">
          <FormSwitch
            name="status"
            label="Active"
            control={control}
            error={errors.status}
            disabled={submitting}
            className="my-2"
          />
        </div>

        {/* Remark */}
        <FormTextarea
          name="remark"
          label="Remark"
          control={control}
          error={errors.remark}
          disabled={submitting}
          
        />
      </FormCard>
    </Modal>
  );
}