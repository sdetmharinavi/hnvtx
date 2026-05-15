// path: components/ofc/OfcForm/OfcForm.tsx
import React, { useCallback, useMemo } from 'react';
import { Button } from '@/components/common/ui';
import { useOfcFormData } from './hooks/useOfcFormData';
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
// REMOVED: useCrudManager and useNodesData imports
import {
  useLookupTypeOptions,
  useMaintenanceAreaOptions,
  useActiveNodeOptions,
} from '@/hooks/data/useDropdownOptions';
import { FormSearchableSelect } from '@/components/common/form';
import { BaseFormModal } from '@/components/common/form/BaseFormModal';

interface OfcFormProps {
  ofcCable?: Ofc_cablesRowSchema;
  onSubmit: (data: Ofc_cablesInsertSchema) => void;
  onClose: () => void;
  pageLoading: boolean;
  isOpen: boolean;
}

const OfcForm: React.FC<OfcFormProps> = ({ ofcCable, onSubmit, onClose, pageLoading, isOpen }) => {
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

  // --- DATA FETCHING ---

  // THE FIX: Use useActiveNodeOptions instead of useCrudManager.
  // useActiveNodeOptions has a hardcoded limit of 10,000, ignoring DEFAULTS.PAGE_SIZE.
  const {
    options: nodeOptions,
    originalData: nodesRaw,
    isLoading: nodesLoading,
  } = useActiveNodeOptions();

  // Cast raw data to correct type for internal logic usage
  const nodes = useMemo(() => (nodesRaw || []) as V_nodes_completeRowSchema[], [nodesRaw]);

  const { options: ofcTypeOptions, isLoading: ofcTypesLoading } = useLookupTypeOptions(
    'OFC_TYPES',
    'desc'
  );
  const { options: ownerOptions, isLoading: ownersLoading } = useLookupTypeOptions('OFC_OWNER');
  const { options: maintenanceTerminalOptions, isLoading: maintenanceTerminalsLoading } =
    useMaintenanceAreaOptions();

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

  const startingNodeName = useMemo(
    () => nodes.find((node) => node.id === startingNodeId)?.name || null,
    [nodes, startingNodeId]
  );
  const endingNodeName = useMemo(
    () => nodes.find((node) => node.id === endingNodeId)?.name || null,
    [nodes, endingNodeId]
  );

  const { existingRoutes, isLoading: routeGenerationLoading } =
    useRouteGeneration<Ofc_cablesRowSchema>({
      startingNodeId,
      endingNodeId,
      startingNodeName,
      endingNodeName,
      isEdit,
      setValue: setValueWithType,
    });

  const { isCapacityLocked } = useCapacityInference<Ofc_cablesInsertSchema>({
    currentOfcTypeId,
    ofcTypeOptions: ofcTypeOptions || [],
    setValue: setValueWithType,
  });

  const startingNodeOptions = useMemo(
    () => nodeOptions.filter((option) => option.value !== endingNodeId),
    [nodeOptions, endingNodeId]
  );

  const endingNodeOptions = useMemo(
    () => nodeOptions.filter((option) => option.value !== startingNodeId),
    [nodeOptions, startingNodeId]
  );

  const isLoading =
    nodesLoading ||
    ofcTypesLoading ||
    ownersLoading ||
    maintenanceTerminalsLoading ||
    pageLoading ||
    routeGenerationLoading;

  const onValidSubmit = (data: Ofc_cablesInsertSchema) => {
    onSubmit(data);
  };

  const onInvalidSubmit: SubmitErrorHandler<Ofc_cablesInsertSchema> = (errors, data) => {
    console.log('Invalid form submission', errors, data);
  };

  // Custom footer for this complex form
  const customFooter = (
    <div className="flex justify-end space-x-3 w-full">
      <Button type="button" onClick={onClose} disabled={isLoading} variant="secondary">
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={isLoading}
        onClick={handleSubmit(onValidSubmit, onInvalidSubmit)}
        variant="primary"
      >
        {isLoading ? 'Saving...' : isEdit ? 'Update Cable' : 'Create Cable'}
      </Button>
    </div>
  );

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Optical Fiber Cable"
      isEditMode={isEdit}
      isLoading={isLoading}
      form={form}
      onSubmit={onValidSubmit}
      size="full"
      // This class name is now accepted by BaseFormModal
      className="h-screen w-screen transparent bg-gray-700 rounded-2xl"
      footerContent={customFooter}
    >
      <div className="relative">
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
            isLoading={ownersLoading}
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
    </BaseFormModal>
  );
};

export default OfcForm;
