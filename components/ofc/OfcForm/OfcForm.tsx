// Main OfcForm component
import React, { useEffect, useMemo, useState } from 'react';
import { Option } from '@/components/common/ui/select/SearchableSelect';
import { useTableQuery } from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';
import { Modal } from '@/components/common/ui';
import { FormCard } from '@/components/common/form/FormCard';
import { useOfcFormData } from './hooks/useOfcFormData';
import { OFC_FORM_CONFIG } from '@/components/ofc/OfcForm/constants/ofcFormConfig';
import { useRouteGeneration } from '@/components/ofc/OfcForm/hooks/useRouteGeneration';
import { useCapacityInference } from '@/components/ofc/OfcForm/hooks/useCapacityInference';
import { useNodeSearch } from './hooks/useNodeSearch';
import LoadingOverlay from '@/components/ofc/OfcForm/LoadingOverlay';
import ExistingRoutesAlert from '@/components/ofc/OfcForm/ExistingRoutesAlert';
import RouteConfigurationSection from '@/components/ofc/OfcForm/RouteConfigurationSection';
import CableSpecificationsSection from '@/components/ofc/OfcForm/CableSpecificationsSection';
import MaintenanceSection from '@/components/ofc/OfcForm/MaintenanceSection';
import { PathValue, FieldErrors } from 'react-hook-form';
import { OfcCablesWithRelations } from '@/app/dashboard/ofc/page';
import {
  Ofc_cablesInsertSchema,
  Ofc_cablesRowSchema,
} from '@/schemas/zod-schemas';
import { toast } from 'sonner';

interface OfcFormProps {
  ofcCable?: OfcCablesWithRelations;
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

  const [nodeSearchTerm, setNodeSearchTerm] = useState('');
  const { data: searchedNodes, isLoading: isNodeSearchLoading } = useNodeSearch(nodeSearchTerm);
  
  const startingNodeId = watch('sn_id');
  const endingNodeId = watch('en_id');
  const routeName = watch('route_name');
  const currentOfcTypeId = watch('ofc_type_id');

  const { data: ofcTypesData, isLoading: ofcTypesLoading } = useTableQuery(supabase, 'lookup_types', {
    filters: { category: { operator: 'eq', value: 'OFC_TYPES' }, name: { operator: 'neq', value: 'DEFAULT' } },
    orderBy: [{ column: 'name', ascending: true }], columns: 'id, name', staleTime: OFC_FORM_CONFIG.CACHE_TIME,
  });
  
  const { data: ofcOwnersData, isLoading: ofcOwnersLoading } = useTableQuery(supabase, 'lookup_types', {
    filters: { category: { operator: 'eq', value: 'OFC_OWNERS' }, name: { operator: 'neq', value: 'DEFAULT' } },
    orderBy: [{ column: 'name', ascending: true }], columns: 'id, name', staleTime: OFC_FORM_CONFIG.CACHE_TIME,
  });

  const { data: maintenanceTerminalsData, isLoading: maintenanceTerminalsLoading } = useTableQuery(supabase, 'maintenance_areas', {
    filters: { status: true }, orderBy: [{ column: 'name', ascending: true }], columns: 'id, name', staleTime: OFC_FORM_CONFIG.CACHE_TIME,
  });

  const allKnownNodes = useMemo(() => {
    const nodeMap = new Map<string, { id: string; name: string }>();
    if (ofcCable) {
      if (ofcCable.sn_id && ofcCable.sn_name) nodeMap.set(ofcCable.sn_id, { id: ofcCable.sn_id, name: ofcCable.sn_name });
      if (ofcCable.en_id && ofcCable.en_name) nodeMap.set(ofcCable.en_id, { id: ofcCable.en_id, name: ofcCable.en_name });
    }
    if (searchedNodes) {
      searchedNodes.forEach((node: Option) => nodeMap.set(node.value, { id: node.value, name: node.label }));
    }
    return Array.from(nodeMap.values());
  }, [ofcCable, searchedNodes]);

  const startingNodeName = useMemo(() => allKnownNodes.find(n => n.id === startingNodeId)?.name || null, [allKnownNodes, startingNodeId]);
  const endingNodeName = useMemo(() => allKnownNodes.find(n => n.id === endingNodeId)?.name || null, [allKnownNodes, endingNodeId]);

  const setValueWithType = <K extends keyof Ofc_cablesInsertSchema>(name: K, value: Ofc_cablesInsertSchema[K], options?: { shouldValidate?: boolean }) => {
    setValue(name, value as PathValue<Ofc_cablesInsertSchema, K>, options);
  };

  const { existingRoutes, isLoading: routeGenerationLoading, generatedRouteName } =
    useRouteGeneration<Ofc_cablesRowSchema>({
      startingNodeId, endingNodeId, startingNodeName, endingNodeName, isEdit, setValue: setValueWithType,
    });
    
  useEffect(() => {
    if (generatedRouteName !== null) {
      setValue('route_name', generatedRouteName, { shouldValidate: true, shouldDirty: true });
    }
  }, [generatedRouteName, setValue]);
  
  const { isCapacityLocked } = useCapacityInference<Ofc_cablesInsertSchema>({
    currentOfcTypeId,
    ofcTypeOptions: ofcTypesData?.map((type) => ({ value: type.id, label: type.name })) || [],
    setValue: setValueWithType,
  });

  const nodeOptions = useMemo((): Option[] => searchedNodes || [], [searchedNodes]);
  const startingNodeOptions = useMemo(() => nodeOptions.filter((option) => option.value !== endingNodeId), [nodeOptions, endingNodeId]);
  const endingNodeOptions = useMemo(() => nodeOptions.filter((option) => option.value !== startingNodeId), [nodeOptions, startingNodeId]);
  const ofcTypeOptions = useMemo((): Option[] => ofcTypesData?.map((type) => ({ value: type.id, label: type.name })) || [], [ofcTypesData]);
  const ofcOwnerOptions = useMemo((): Option[] => ofcOwnersData?.map((owner) => ({ value: owner.id, label: owner.name })) || [], [ofcOwnersData]);
  const maintenanceTerminalOptions = useMemo((): Option[] => maintenanceTerminalsData?.map((terminal) => ({ value: terminal.id, label: terminal.name })) || [], [maintenanceTerminalsData]);

  const isLoading = ofcTypesLoading || maintenanceTerminalsLoading || pageLoading || routeGenerationLoading || ofcOwnersLoading;

  const onValidSubmit = (data: Ofc_cablesInsertSchema) => { onSubmit(data as Ofc_cablesInsertSchema); };
  
  const onInvalidSubmit = (errors: FieldErrors<Ofc_cablesInsertSchema>) => {
    toast.error("Validation failed. Please check the highlighted fields.");
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      const element = document.getElementsByName(firstErrorField)[0];
      element?.focus({ preventScroll: true });
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} visible={false} className="h-screen w-screen transparent bg-gray-700 rounded-2xl">
      <FormCard
        key={isEdit ? ofcCable?.id ?? 'edit' : 'new'}
        title={isEdit ? 'Edit Optical Fiber Cable' : 'Add Optical Fiber Cable'}
        subtitle={isEdit ? 'Update the cable details below' : 'Fill in the Optical Fiber Cable details below'}
        isLoading={isLoading}
        onCancel={onClose}
        onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}
        submitText={isEdit ? 'Update Optical Fiber Cable' : 'Create Optical Fiber Cable'}
        standalone
      >
        <div className="p-6 relative">
          {(isLoading || isNodeSearchLoading) && <LoadingOverlay />}
          <ExistingRoutesAlert routes={existingRoutes} />
          <div className="space-y-8">
            <RouteConfigurationSection
              control={control}
              errors={errors}
              startingNodeOptions={startingNodeOptions}
              endingNodeOptions={endingNodeOptions}
              routeName={routeName}
              onNodeSearch={setNodeSearchTerm}
              isNodeSearchLoading={isNodeSearchLoading}
            />
            <CableSpecificationsSection
              control={control}
              register={register}
              errors={errors}
              setValue={setValue}
              watch={watch}
              ofcTypeOptions={ofcTypeOptions}
              ofcOwnerOptions={ofcOwnerOptions}
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