// components/ofc/OfcForm/hooks/useOfcFormData.ts
'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import isEqual from 'lodash.isequal';
import { Ofc_cablesRowSchema } from '@/schemas/zod-schemas';
import {
  Ofc_cablesInsertSchema,
  ofc_cablesInsertSchema,
} from '@/schemas/zod-schemas';

export const useOfcFormData = (ofcCable?: Ofc_cablesRowSchema) => {
  const isEdit = Boolean(ofcCable);

  const defaultValues = useMemo(
    () => ({
      sn_id: '',
      en_id: '',
      route_name: '',
      ofc_type_id: '',
      capacity: 0,
      current_rkm: null,
      transnet_rkm: null,
      transnet_id: null,
      asset_no: null,
      ofc_owner_id: '',
      maintenance_terminal_id: null,
      remark: null,
      status: true,
      commissioned_on: null, // Ensure this key exists
    }),
    []
  );

  const form = useForm<Ofc_cablesInsertSchema>({
    resolver: zodResolver(ofc_cablesInsertSchema),
    mode: 'onChange',
    defaultValues,
  });

  // Reset form when ofcCable changes or when switching from edit to create mode
  useEffect(() => {
    if (isEdit && ofcCable) {
      form.reset({
        sn_id: ofcCable.sn_id || '',
        en_id: ofcCable.en_id || '',
        route_name: ofcCable.route_name || '',
        ofc_type_id: ofcCable.ofc_type_id || '',
        capacity: ofcCable.capacity || 0,
        current_rkm: ofcCable.current_rkm || 0,
        transnet_rkm: ofcCable.transnet_rkm || 0,
        transnet_id: ofcCable.transnet_id || null,
        ofc_owner_id: ofcCable.ofc_owner_id || '',
        asset_no: ofcCable.asset_no || '',
        maintenance_terminal_id: ofcCable.maintenance_terminal_id || '',
        remark: ofcCable.remark || '',
        status: ofcCable.status ?? true,
        commissioned_on: ofcCable.commissioned_on || null,
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
      sn_id: ofcCable.sn_id || '',
      en_id: ofcCable.en_id || '',
      route_name: ofcCable.route_name || '',
      ofc_type_id: ofcCable.ofc_type_id || '',
      capacity: ofcCable.capacity || 0,
      current_rkm: ofcCable.current_rkm || 0,
      transnet_rkm: ofcCable.transnet_rkm || 0,
      transnet_id: ofcCable.transnet_id || null,
      asset_no: ofcCable.asset_no || '',
      ofc_owner_id: ofcCable.ofc_owner_id || '',
      maintenance_terminal_id: ofcCable.maintenance_terminal_id || '',
      remark: ofcCable.remark || '',
      status: ofcCable.status ?? true,
      commissioned_on: ofcCable.commissioned_on || null,
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
    if (
      isEqual(prevOfcCableData.current, ofcCableData) &&
      isEqual(prevDefaultValues.current, defaultValues)
    ) {
      return;
    }

    // Update refs
    prevOfcCableData.current = ofcCableData;
    prevDefaultValues.current = defaultValues;

    if (ofcCableData) {
      // In edit mode, use the existing data
      form.reset(
        {
          ...ofcCableData,
          route_name: ofcCable?.route_name || '',
        },
        {
          keepDirty: true,
          keepErrors: true,
        }
      );
    } else {
      // In add mode, use default values
      form.reset(
        {
          ...defaultValues,
          route_name: '',
        },
        {
          keepDirty: true,
          keepErrors: true,
        }
      );
    }
  }, [ofcCableData, form, defaultValues, ofcCable?.route_name, isEdit]);

  return { form, isEdit };
};