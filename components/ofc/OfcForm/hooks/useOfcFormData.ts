"use client"

// components/ofc/OfcForm/hooks/useOfcFormData.ts
import { useEffect, useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OfcCableFormData, ofcCableFormSchema } from "@/schemas";
import { OfcCablesWithRelations } from "@/components/ofc/ofc-types";

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

  // Reset form when ofcCable changes
  useEffect(() => {
    if (isEdit && ofcCable) {
      const resetData = {
        sn_id: ofcCable?.sn_id ? String(ofcCable.sn_id) : undefined,
        en_id: ofcCable?.en_id ? String(ofcCable.en_id) : undefined,
        route_name: ofcCable?.route_name || "",
        ofc_type_id: ofcCable?.ofc_type_id || "",
        capacity: ofcCable?.capacity || 0,
        current_rkm: ofcCable?.current_rkm || 0,
        transnet_rkm: ofcCable?.transnet_rkm || 0,
        transnet_id: ofcCable?.transnet_id || "",
        asset_no: ofcCable?.asset_no || "",
        maintenance_terminal_id: ofcCable?.maintenance_terminal_id || "",
        remark: ofcCable?.remark || "",
        status: ofcCable?.status ?? true,
      };
      form.reset(resetData);
    } else {
      form.reset(defaultValues);
    }
  }, [isEdit, ofcCable, form, defaultValues]);

  return { form, isEdit };
};