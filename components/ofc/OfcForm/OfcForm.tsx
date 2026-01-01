// path: components/ofc/OfcForm/OfcForm.tsx
// Main OfcForm component
import React, { useCallback, useMemo } from 'react';
import { Option } from '@/components/common/ui/select/SearchableSelect';
import { Modal } from '@/components/common/ui';
import { FormCard } from '@/components/common/form/FormCard';
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
import { useCrudManager } from '@/hooks/useCrudManager';
import { useNodesData } from '@/hooks/data/useNodesData';
// THIS IS THE FIX: Import the correct hooks for dropdown data
import { useLookupTypeOptions, useMaintenanceAreaOptions } from '@/hooks/data/useDropdownOptions';
import { FormSearchableSelect } from '@/components/common/form';

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
    formState: { errors, isDirty },
  } = form;

  // Watch critical form values
  const startingNodeId = watch('sn_id');
  const endingNodeId = watch('en_id');
  const routeName = watch('route_name');
  const currentOfcTypeId = watch('ofc_type_id');

  // --- DATA FETCHING (REFACTORED) ---

  // 1. Fetch Nodes using the existing useCrudManager setup
  const { data: nodesData, isLoading: nodesLoading } = useCrudManager<
    'nodes',
    V_nodes_completeRowSchema
  >({
    tableName: 'nodes',
    dataQueryHook: useNodesData,
  }).queryResult;

  // 2. THIS IS THE FIX: Use centralized hooks that are offline-first
  // Request descending order for OFC Types
  const { options: ofcTypeOptions, isLoading: ofcTypesLoading } = useLookupTypeOptions(
    'OFC_TYPES',
    'desc'
  );
  const { options: ownerOptions, isLoading: ownersLoading } = useLookupTypeOptions('OFC_OWNER');
  const { options: maintenanceTerminalOptions, isLoading: maintenanceTerminalsLoading } =
    useMaintenanceAreaOptions();

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodes = useMemo(() => (nodesData as any)?.data || [], [nodesData]);

  const startingNodeName = useMemo(
    () => nodes.find((node: V_nodes_completeRowSchema) => node.id === startingNodeId)?.name || null,
    [nodes, startingNodeId]
  );
  const endingNodeName = useMemo(
    () => nodes.find((node: V_nodes_completeRowSchema) => node.id === endingNodeId)?.name || null,
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

  // Memoized options to prevent unnecessary re-renders
  const nodeOptions = useMemo(
    (): Option[] =>
      nodes.map((node: V_nodes_completeRowSchema) => ({
        value: String(node.id),
        label: node.name || `Node ${node.id}`,
      })),
    [nodes]
  );

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
    ownersLoading || // Added owner loading state
    maintenanceTerminalsLoading ||
    pageLoading ||
    routeGenerationLoading;

  const onValidSubmit = (data: Ofc_cablesInsertSchema) => {
    onSubmit(data as Ofc_cablesInsertSchema);
  };

  const onInvalidSubmit: SubmitErrorHandler<Ofc_cablesInsertSchema> = (errors, data) => {
    console.log('Invalid form submission', errors, 'Invalid form submission', data);
  };

  const handleClose = useCallback(() => {
    if (isDirty) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirmClose) return;
    }
    onClose();
  }, [onClose, isDirty]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      visible={false}
      className="h-screen w-screen transparent bg-gray-700 rounded-2xl"
      closeOnOverlayClick={false}
      closeOnEscape={!isDirty}
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
        onCancel={handleClose}
        onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}
        submitText={isEdit ? 'Update Optical Fiber Cable' : 'Create Optical Fiber Cable'}
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
              options={ownerOptions} // Use the new hook data
              isLoading={ownersLoading} // Add loading state
            />

            <CableSpecificationsSection
              control={control}
              register={register}
              errors={errors}
              setValue={setValue}
              watch={watch}
              ofcTypeOptions={ofcTypeOptions} // Use the new hook data
              isCapacityLocked={isCapacityLocked}
            />

            <MaintenanceSection
              control={control}
              errors={errors}
              maintenanceTerminalOptions={maintenanceTerminalOptions} // Use the new hook data
            />
          </div>
        </div>
      </FormCard>
    </Modal>
  );
};

export default OfcForm;
