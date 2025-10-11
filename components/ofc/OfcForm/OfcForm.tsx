// Main OfcForm component
import React, { useCallback, useMemo } from 'react';
import { Option } from '@/components/common/ui/select/SearchableSelect';
import { usePagedData, useTableQuery } from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';
import { Modal } from '@/components/common/ui';
import { FormCard } from '@/components/common/form/FormCard';
import { useOfcFormData } from './hooks/useOfcFormData';
import { OFC_FORM_CONFIG } from '@/constants/ofcFormConfig';
import { useRouteGeneration } from '@/components/ofc/OfcForm/hooks/useRouteGeneration';
import { useCapacityInference } from '@/components/ofc/OfcForm/hooks/useCapacityInference';
import LoadingOverlay from '@/components/ofc/OfcForm/LoadingOverlay';
import ExistingRoutesAlert from '@/components/ofc/OfcForm/ExistingRoutesAlert';
import RouteConfigurationSection from '@/components/ofc/OfcForm/RouteConfigurationSection';
import CableSpecificationsSection from '@/components/ofc/OfcForm/CableSpecificationsSection';
import MaintenanceSection from '@/components/ofc/OfcForm/MaintenanceSection';
import { PathValue, SubmitErrorHandler } from 'react-hook-form';
import {
  Ofc_cablesInsertSchema,
  Ofc_cablesRowSchema,
  V_nodes_completeRowSchema,
} from '@/schemas/zod-schemas';
import { FormSearchableSelect } from '@/components/common/form';

interface OfcFormProps {
  ofcCable?: Ofc_cablesRowSchema;
  onSubmit: (data: Ofc_cablesInsertSchema) => void;
  onClose: () => void;
  pageLoading: boolean;
  isOpen: boolean;
}

const OfcForm: React.FC<OfcFormProps> = ({
  ofcCable,
  onSubmit,
  onClose,
  pageLoading,
  isOpen,
}) => {
  const supabase = createClient();
  const { form, isEdit } = useOfcFormData(ofcCable);
  const {
    handleSubmit,
    control,
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  // Watch critical form values
  const startingNodeId = watch('sn_id');
  const endingNodeId = watch('en_id');
  const routeName = watch('route_name');
  const currentOfcTypeId = watch('ofc_type_id');

  // Data fetching with optimized queries
  const { data: nodesData, isLoading: nodesLoading } = usePagedData<V_nodes_completeRowSchema>(
    supabase,
    'v_nodes_complete',
    {
      filters: {
        status: true,
        node_type_name: {
          operator: 'in',
          value: OFC_FORM_CONFIG.ALLOWED_NODE_TYPES,
        },
      },
      limit: OFC_FORM_CONFIG.NODES_FETCH_LIMIT,
    }
  );

  const { data: ofcTypesResult, isLoading: ofcTypesLoading } = useTableQuery(
    supabase,
    'lookup_types',
    {
      filters: {
        category: { operator: 'eq', value: 'OFC_TYPES' },
        name: { operator: 'neq', value: 'DEFAULT' },
      },
      orderBy: [{ column: 'name', ascending: true }],
      columns: 'id, name',
      staleTime: OFC_FORM_CONFIG.CACHE_TIME,
    }
  );
  const ofcTypesData = ofcTypesResult?.data;

  const {
    data: maintenanceTerminalsResult,
    isLoading: maintenanceTerminalsLoading,
  } = useTableQuery(supabase, 'maintenance_areas', {
    filters: { status: true },
    orderBy: [{ column: 'name', ascending: true }],
    columns: 'id, name',
    staleTime: OFC_FORM_CONFIG.CACHE_TIME,
  });
  const maintenanceTerminalsData = maintenanceTerminalsResult?.data;

  // Custom hooks for complex logic
  const setValueWithType = useCallback(
    <K extends keyof Ofc_cablesInsertSchema>(
      name: K,
      value: Ofc_cablesInsertSchema[K],
      options?: { shouldValidate?: boolean }
    ) => {
      setValue(name, value as PathValue<Ofc_cablesInsertSchema, K>, options);
    },
    [setValue]
  );

  const startingNodeName = useMemo(() => nodesData?.data.find(node => node.id === startingNodeId)?.name || null, [nodesData, startingNodeId]);
  const endingNodeName = useMemo(() => nodesData?.data.find(node => node.id === endingNodeId)?.name || null, [nodesData, endingNodeId]);

  const { existingRoutes, isLoading: routeGenerationLoading } =
    useRouteGeneration<Ofc_cablesRowSchema>({
      startingNodeId, endingNodeId, startingNodeName, endingNodeName, isEdit, setValue: setValueWithType,
    });

  const { isCapacityLocked } = useCapacityInference<Ofc_cablesInsertSchema>({
    currentOfcTypeId,
    ofcTypeOptions:
      ofcTypesData?.map((type) => ({ value: type.id, label: type.name })) || [],
    setValue: setValueWithType,
  });

  // Memoized options to prevent unnecessary re-renders
  const nodeOptions = useMemo(
    (): Option[] =>
      nodesData?.data.map((node: V_nodes_completeRowSchema) => ({
        value: String(node.id),
        label: node.name || `Node ${node.id}`,
      })) || [],
    [nodesData]
  );

  const startingNodeOptions = useMemo(
    () => nodeOptions.filter((option) => option.value !== endingNodeId),
    [nodeOptions, endingNodeId]
  );

  const endingNodeOptions = useMemo(
    () => nodeOptions.filter((option) => option.value !== startingNodeId),
    [nodeOptions, startingNodeId]
  );

  const ofcTypeOptions = useMemo(
    (): Option[] =>
      ofcTypesData?.map((type) => ({ value: type.id, label: type.name })) || [],
    [ofcTypesData]
  );

  const maintenanceTerminalOptions = useMemo(
    (): Option[] =>
      maintenanceTerminalsData?.map((terminal) => ({
        value: terminal.id,
        label: terminal.name,
      })) || [],
    [maintenanceTerminalsData]
  );

  const {
    data: lookupTypesResult,
    isLoading: lookupLoading,
  } = useTableQuery(supabase, "lookup_types", {
    orderBy: [{ column: "name", ascending: true }],
    filters: {
      name: { operator: "neq", value: "DEFAULT" },
      category: { operator: "eq", value: "OFC_OWNER" },
    }
  });
  const lookupTypes = lookupTypesResult?.data;

  const ownerOptions = useMemo(
    (): Option[] =>
      lookupTypes?.map((owner) => ({ value: owner.id, label: owner.name })) || [],
    [lookupTypes, lookupLoading]
  );

  const isLoading =
    nodesLoading ||
    ofcTypesLoading ||
    maintenanceTerminalsLoading ||
    pageLoading ||
    routeGenerationLoading;

  const onValidSubmit = (data: Ofc_cablesInsertSchema) => {
    onSubmit(data as Ofc_cablesInsertSchema);
  };

  const onInvalidSubmit: SubmitErrorHandler<Ofc_cablesInsertSchema> = (errors, data) => {
    console.log('Invalid form submission', errors, "Invalid form submission", data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      visible={false}
      className="h-screen w-screen transparent bg-gray-700 rounded-2xl"
    >
      <FormCard
        key={isEdit ? ofcCable?.id ?? 'edit' : 'new'}
        title={isEdit ? 'Edit Optical Fiber Cable' : 'Add Optical Fiber Cable'}
        subtitle={
          isEdit
            ? 'Update the cable details below'
            : 'Fill in the Optical Fiber Cable details below'
        }
        isLoading={isLoading}
        onCancel={onClose}
        onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}
        submitText={
          isEdit ? 'Update Optical Fiber Cable' : 'Create Optical Fiber Cable'
        }
        standalone
      >
        <div className="p-6 relative">
          {isLoading && <LoadingOverlay />}

          <ExistingRoutesAlert routes={existingRoutes} />

          <div className="space-y-8">
            <RouteConfigurationSection
              control={control}
              errors={errors}
              startingNodeOptions={startingNodeOptions}
              endingNodeOptions={endingNodeOptions}
              routeName={routeName}
            />
            <FormSearchableSelect
              control={control}
              name="ofc_owner_id"
              label="Owner"
              options={ownerOptions}
            />

            <CableSpecificationsSection
              control={control}
              register={register}
              errors={errors}
              setValue={setValue}
              watch={watch}
              ofcTypeOptions={ofcTypeOptions}
              isCapacityLocked={isCapacityLocked}
            />

            <MaintenanceSection
              control={control}
              errors={errors}
              maintenanceTerminalOptions={maintenanceTerminalOptions}
            />
          </div>
        </div>
      </FormCard>
    </Modal>
  );
};

export default OfcForm;