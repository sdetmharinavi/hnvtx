// Main OfcForm component
import React, { useMemo } from "react";
import { TablesInsert } from "@/types/supabase-types";
import { Option } from "@/components/common/ui/select/SearchableSelect";
import { OfcCablesWithRelations } from "@/components/ofc/ofc-types";
import { usePagedNodesComplete, useTableQuery } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { Modal } from "@/components/common/ui";
import { FormCard } from "@/components/common/ui/form/FormCard";
import { useOfcFormData } from "./hooks/useOfcFormData";
import { OFC_FORM_CONFIG } from "@/components/ofc/OfcForm/constants/ofcFormConfig";
import { useRouteGeneration } from "@/components/ofc/OfcForm/hooks/useRouteGeneration";
import { useCapacityInference } from "@/components/ofc/OfcForm/hooks/useCapacityInference";
import { OfcCableFormData } from "@/schemas";
import LoadingOverlay from "@/components/ofc/OfcForm/LoadingOverlay";
import ExistingRoutesAlert from "@/components/ofc/OfcForm/ExistingRoutesAlert";
import RouteConfigurationSection from "@/components/ofc/OfcForm/RouteConfigurationSection";
import CableSpecificationsSection from "@/components/ofc/OfcForm/CableSpecificationsSection";
import MaintenanceSection from "@/components/ofc/OfcForm/MaintenanceSection";
import { PathValue } from "react-hook-form";


interface OfcFormProps {
  ofcCable?: OfcCablesWithRelations | null;
  onSubmit: (data: TablesInsert<"ofc_cables">) => void;
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
  const startingNodeId = watch("sn_id") || null;
  const endingNodeId = watch("en_id") || null;
  const routeName = watch("route_name") || "";
  const currentOfcTypeId = watch("ofc_type_id") || "";

  // Data fetching with optimized queries
  const { data: nodesData, isLoading: nodesLoading } = usePagedNodesComplete(
    supabase,
    {
      filters: {
        status: true,
        or: [
          `node_type_name IN ('${OFC_FORM_CONFIG.ALLOWED_NODE_TYPES.join(
            "','"
          )}')`,
        ],
      },
      limit: OFC_FORM_CONFIG.NODES_FETCH_LIMIT,
    }
  );

  const { data: ofcTypesData, isLoading: ofcTypesLoading } = useTableQuery(
    supabase,
    "lookup_types",
    {
      filters: {
        category: { operator: "eq", value: "OFC_TYPES" },
        name: { operator: "neq", value: "DEFAULT" },
      },
      orderBy: [{ column: "name", ascending: true }],
      columns: "id, name",
      staleTime: OFC_FORM_CONFIG.CACHE_TIME,
    }
  );

  const {
    data: maintenanceTerminalsData,
    isLoading: maintenanceTerminalsLoading,
  } = useTableQuery(supabase, "maintenance_areas", {
    filters: { status: true },
    orderBy: [{ column: "name", ascending: true }],
    columns: "id, name",
    staleTime: OFC_FORM_CONFIG.CACHE_TIME,
  });

  // Custom hooks for complex logic
  // Create a type-safe wrapper for setValue
  const setValueWithType = <K extends keyof OfcCableFormData>(
    name: K,
    value: OfcCableFormData[K],
    options?: { shouldValidate?: boolean }
  ) => {
    setValue(name, value as PathValue<OfcCableFormData, K>, options);
  };

  const { existingRoutes, isLoading: routeGenerationLoading } =
    useRouteGeneration<OfcCableFormData>({
      startingNodeId,
      endingNodeId,
      nodesData: nodesData ?? undefined,
      isEdit,
      setValue: setValueWithType,
    });

  const { isCapacityLocked } = useCapacityInference<OfcCableFormData>({
    currentOfcTypeId,
    ofcTypeOptions:
      ofcTypesData?.map((type) => ({ value: type.id, label: type.name })) || [],
    setValue: setValueWithType,
  });

  // Memoized options to prevent unnecessary re-renders
  const nodeOptions = useMemo(
    (): Option[] =>
      nodesData?.map((node) => ({
        value: String(node.id),
        label: node.name,
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

  // Loading state aggregation
  const isLoading =
    nodesLoading ||
    ofcTypesLoading ||
    maintenanceTerminalsLoading ||
    pageLoading ||
    routeGenerationLoading;

  const onValidSubmit = (data: OfcCableFormData) => {
    onSubmit(data as TablesInsert<"ofc_cables">);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      visible={false}
      className="h-screen w-screen transparent bg-gray-700 rounded-2xl"
    >
      <FormCard
        key={isEdit ? ofcCable?.id ?? "edit" : "new"}
        title={isEdit ? "Edit Optical Fiber Cable" : "Add Optical Fiber Cable"}
        subtitle={
          isEdit
            ? "Update the cable details below"
            : "Fill in the Optical Fiber Cable details below"
        }
        isLoading={isLoading}
        onCancel={onClose}
        onSubmit={handleSubmit(onValidSubmit)}
        submitText={
          isEdit ? "Update Optical Fiber Cable" : "Create Optical Fiber Cable"
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
