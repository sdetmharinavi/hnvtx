"use client"

// components/ofc/OfcForm/hooks/useOfcFormData.ts
import { useEffect, useMemo, useRef } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OfcCableFormData, ofcCableFormSchema } from "@/schemas";
import { OfcCablesWithRelations } from "@/components/ofc/ofc-types";
import isEqual from "lodash.isequal";

export const useOfcFormData = (ofcCable?: OfcCablesWithRelations | null) => {
  const isEdit = Boolean(ofcCable);
  
  const defaultValues = useMemo(() => ({
    sn_id: undefined,
    en_id: undefined,
    route_name: "",
    ofc_type_id: "",
    capacity: 0,
    current_rkm: 0,
    transnet_rkm: 0,
    transnet_id: "",
    asset_no: "",
    maintenance_terminal_id: "",
    remark: "",
    status: true,
  }), []);

  const form = useForm<OfcCableFormData>({
    resolver: zodResolver(ofcCableFormSchema) as Resolver<OfcCableFormData>,
    mode: "onChange",
    defaultValues,
  });

  // Reset form when ofcCable changes or when switching from edit to create mode
useEffect(() => {
  if (isEdit && ofcCable) {
    form.reset({
      sn_id: ofcCable.sn_id ? String(ofcCable.sn_id) : undefined,
      en_id: ofcCable.en_id ? String(ofcCable.en_id) : undefined,
      route_name: ofcCable.route_name || "",
      ofc_type_id: ofcCable.ofc_type_id || "",
      capacity: ofcCable.capacity || 0,
      current_rkm: ofcCable.current_rkm || 0,
      transnet_rkm: ofcCable.transnet_rkm || 0,
      transnet_id: ofcCable.transnet_id || "",
      asset_no: ofcCable.asset_no || "",
      maintenance_terminal_id: ofcCable.maintenance_terminal_id || "",
      remark: ofcCable.remark || "",
      status: ofcCable.status ?? true,
    });
  } else if (!isEdit) {
    // Reset to default values when not in edit mode
    form.reset(defaultValues);
  }
}, [isEdit, ofcCable, form, defaultValues]);

  // Create a stable reference to the ofcCable data
  const ofcCableData = useMemo(() => {
    if (!isEdit || !ofcCable) return null;
    const data = {
      sn_id: ofcCable.sn_id ? String(ofcCable.sn_id) : undefined,
      en_id: ofcCable.en_id ? String(ofcCable.en_id) : undefined,
      route_name: ofcCable.route_name || "",
      ofc_type_id: ofcCable.ofc_type_id || "",
      capacity: ofcCable.capacity || 0,
      current_rkm: ofcCable.current_rkm || 0,
      transnet_rkm: ofcCable.transnet_rkm || 0,
      transnet_id: ofcCable.transnet_id || "",
      asset_no: ofcCable.asset_no || "",
      maintenance_terminal_id: ofcCable.maintenance_terminal_id || "",
      remark: ofcCable.remark || "",
      status: ofcCable.status ?? true,
    };
    return data;
  }, [isEdit, ofcCable]);

  // Track previous data to prevent unnecessary resets
  const prevOfcCableData = useRef(ofcCableData);
  const prevDefaultValues = useRef(defaultValues);
  const isInitialMount = useRef(true);

  // Reset form when ofcCable changes
  useEffect(() => {
    // Skip if this is the initial mount and we're in edit mode
    if (isInitialMount.current && isEdit) {
      isInitialMount.current = false;
      return;
    }

    // Skip if nothing has changed
    if (isEqual(prevOfcCableData.current, ofcCableData) && 
        isEqual(prevDefaultValues.current, defaultValues)) {
      return;
    }

    // Update refs
    prevOfcCableData.current = ofcCableData;
    prevDefaultValues.current = defaultValues;

    if (ofcCableData) {
      // In edit mode, use the existing data
      form.reset({
        ...ofcCableData,
        route_name: ofcCable?.route_name || ""
      }, {
        keepDirty: true,
        keepErrors: true,
      });
    } else {
      // In add mode, use default values
      form.reset({
        ...defaultValues,
        route_name: ""
      }, {
        keepDirty: true,
        keepErrors: true,
      });
    }
  }, [ofcCableData, form, defaultValues, ofcCable?.route_name, isEdit]);

  return { form, isEdit };
};