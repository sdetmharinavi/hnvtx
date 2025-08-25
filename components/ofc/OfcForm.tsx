import { useEffect, useState } from "react";
import { Tables, TablesInsert } from "@/types/supabase-types";
import { SearchableSelect, Option } from "@/components/common/SearchableSelect";
import { OfcCablesWithRelations } from "./ofc-types";
import { Switch } from "@/components/common/ui/switch/Switch";
import { Label } from "@/components/common/ui/label/Label";
import { Input } from "@/components/common/ui/Input";
import { Textarea } from "@/components/common/ui/textarea/Textarea";
import { Button } from "@/components/common/ui/Button";
import { ButtonSpinner } from "../common/ui/LoadingSpinner";
import { usePagedNodesComplete, useTableQuery } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { FormCard } from "../common/ui/form/FormCard";
import SectionCard from "../common/ui/form/SectionCard";
import { zodResolver } from "@hookform/resolvers/zod";
import { OfcCable, ofcCableSchema } from "@/schemas";
import { useForm, SubmitHandler, type Resolver } from "react-hook-form";
import { z } from "zod";
import { FormDateInput, FormInput, FormSearchableSelect, FormTextarea } from "../common/FormControls";

interface OfcFormProps {
  ofcCable?: OfcCablesWithRelations | null;
  onSubmit: (data: TablesInsert<"ofc_cables">) => void;
  onCancel: () => void;
  pageLoading: boolean;
}

const formSchema = ofcCableSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

type OfcFormValues = z.infer<typeof formSchema>;

const OfcForm = ({ ofcCable, onSubmit, onCancel, pageLoading }: OfcFormProps) => {
  // Remove redundant local state for node IDs; use RHF values instead
  const [existingRoutes, setExistingRoutes] = useState<string[] | null>(null);
  const [isCapacityLocked, setIsCapacityLocked] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [routeNumber, setRouteNumber] = useState<number>(1);
  const isEdit = Boolean(ofcCable);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<OfcFormValues, any, OfcFormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<OfcFormValues>,
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: {
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
    },
  });

  // Watch form values
  const watchedValues = watch();
  const currentStatus = watch("status");
  const startingNodeId = watch("sn_id") || null;
  const endingNodeId = watch("en_id") || null;

  const supabase = createClient();

  // Fallback: If editing but IDs are missing on the view row, fetch from base table
  useEffect(() => {
    const needsFallback = Boolean(ofcCable?.id && (!ofcCable.sn_id || !ofcCable.en_id));
    if (!needsFallback) return;

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("ofc_cables").select("sn_id, en_id, ofc_type_id, asset_no, capacity, commissioned_on, current_rkm, maintenance_terminal_id, status, remark").eq("id", ofcCable!.id).single();

      if (cancelled || error || !data) return;

      const sId = data.sn_id ? String(data.sn_id) : null;
      const eId = data.en_id ? String(data.en_id) : null;

      // Set only the form values; no local state needed
      setValue("sn_id", sId || "");
      setValue("en_id", eId || "");
    })();

    return () => {
      cancelled = true;
    };
  }, [ofcCable?.id, ofcCable?.sn_id, ofcCable?.en_id, supabase, setValue]);

  // Clear node validation errors when IDs become available (e.g., after edit prefill)
  useEffect(() => {
    if ((startingNodeId && validationErrors.sn_id) || (endingNodeId && validationErrors.en_id)) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        if (startingNodeId) delete next.sn_id;
        if (endingNodeId) delete next.en_id;
        return next;
      });
    }
  }, [startingNodeId, endingNodeId, validationErrors]);

  // Clear previous existing routes immediately when node pair changes to avoid flicker
  useEffect(() => {
    setExistingRoutes(null);
    setRouteNumber(1);
  }, [startingNodeId, endingNodeId]);

  // Auto-generate route_name only in ADD mode when both nodes (and route number) are available
  useEffect(() => {
    if (isEdit) return; // preserve existing route name in edit mode
    if (startingNodeId && endingNodeId) {
      const startingNodeName = nodesData?.find((node) => node.id === startingNodeId)?.name;
      const endingNodeName = nodesData?.find((node) => node.id === endingNodeId)?.name;
      setValue("route_name", `${startingNodeName}⇔${endingNodeName}_${routeNumber}`);
    } else {
      setValue("route_name", ofcCable?.route_name || "");
    }
  }, [startingNodeId, endingNodeId, routeNumber, isEdit, setValue, ofcCable?.route_name]);

  const onValidSubmit: SubmitHandler<OfcFormValues> = (data) => {
    onSubmit(data as TablesInsert<"ofc_cables">);
  };

  // Data fetching via the specialized RPC hook
  const {
    data: nodesData,
    isLoading: nodesLoading,
    refetch: refetchNodes,
  } = usePagedNodesComplete(supabase, {
    filters: {
      status: true,
      // Include both Terminal Nodes and Joint / Splice Points
      // The RPC filter supports a special 'or' key that accepts a raw SQL condition as the first array item
      or: ["node_type_name IN ('Terminal Node','Joint / Splice Point','Base Transceiver Station','Backhaul Hub / Block HQ','Customer Premises','Gram Panchayat')"],
    },
    limit: 1000,
  });

  // nodes dropdown options
  const baseNodeOptions: Option[] =
    nodesData?.map((node) => ({
      value: String(node.id),
      label: node.name,
    })) || [];

  // Ensure currently selected IDs are present in options even if not fetched/filtered
  const ensureOption = (options: Option[], value: string | null, label?: string): Option[] => {
    if (!value) return options;
    if (!options.some((o) => o.value === value)) {
      return [{ value, label: label || value }, ...options];
    }
    return options;
  };

  const nodesOptions: Option[] = baseNodeOptions;

  const endingNodeBase = nodesOptions.filter((option) => option.value !== startingNodeId);
  const startingNodeBase = nodesOptions.filter((option) => option.value !== endingNodeId);

  const startingNodeLabel = nodesData?.find((n) => n.id === startingNodeId)?.name || startingNodeId || undefined;
  const endingNodeLabel = nodesData?.find((n) => n.id === endingNodeId)?.name || endingNodeId || undefined;

  const endingNodeOptions: Option[] = ensureOption(endingNodeBase, endingNodeId, endingNodeLabel);
  const startingNodeOptions: Option[] = ensureOption(startingNodeBase, startingNodeId, startingNodeLabel);

  // Data fetching for ofc types
  const {
    data: ofcTypesData,
    isLoading: ofcTypesLoading,
    refetch: refetchOfcTypes,
  } = useTableQuery(supabase, "lookup_types", {
    filters: {
      category: { operator: "eq", value: "OFC_TYPES" },
      name: { operator: "neq", value: "DEFAULT" },
    },
    orderBy: [{ column: "name", ascending: true }],
    columns: "id, name",
  });

  const ofcTypeOptions: Option[] =
    ofcTypesData?.map((type) => ({
      value: type.id,
      label: type.name,
    })) || [];

  // Auto-set capacity from selected OFC type name and lock the selector if found
  // watch OFC type selection
  const currentOfcTypeId = watch("ofc_type_id");
  const capacityOptions: Option[] = [
    { value: "2", label: "2" },
    { value: "4", label: "4" },
    { value: "6", label: "6" },
    { value: "12", label: "12" },
    { value: "24", label: "24" },
    { value: "48", label: "48" },
    { value: "96", label: "96" },
    { value: "144", label: "144" },
    { value: "288", label: "288" },
    { value: "576", label: "576" },
    { value: "864", label: "864" },
    { value: "1728", label: "1728" },
  ];

  useEffect(() => {
    if (currentOfcTypeId) {
      const selectedOption = ofcTypeOptions.find((opt) => opt.value === currentOfcTypeId);
      // console.log("selectedOption", selectedOption);

      if (selectedOption) {
        const match = selectedOption.label.match(/(\d+)\s*F/i);
        if (match) {
          const inferredCapacity = match[1]; // "24"
          const matchingCapacityOption = capacityOptions.find((opt) => opt.value === inferredCapacity);
          // console.log("matchingCapacityOption", matchingCapacityOption);

          if (matchingCapacityOption) {
            setValue("capacity", Number(matchingCapacityOption.value), { shouldValidate: true });
            setIsCapacityLocked(true);
            return;
          }
        }
      }
    }

    setIsCapacityLocked(false);
  }, [currentOfcTypeId, setValue]);

  // Data fetching for maintenance terminals
  const { data: maintenanceTerminalsData, isLoading: maintenanceTerminalsLoading } = useTableQuery(supabase, "maintenance_areas", {
    filters: {
      status: true,
    },
    orderBy: [{ column: "name", ascending: true }],
    columns: "id, name",
  });

  const maintenanceTerminalOptions: Option[] =
    maintenanceTerminalsData?.map((terminal) => ({
      value: terminal.id,
      label: terminal.name,
    })) || [];

  // Check if any route already exists between starting and ending nodes
  const { data: existingRoute, isLoading: existingRouteLoading } = useTableQuery(supabase, "ofc_cables", {
    filters:
      startingNodeId && endingNodeId
        ? {
            $or: {
              operator: "or",
              value: `and(sn_id.eq.${startingNodeId},en_id.eq.${endingNodeId}),and(sn_id.eq.${endingNodeId},en_id.eq.${startingNodeId})`,
            },
          }
        : {},
    columns: "id, route_name",
    includeCount: true,
    enabled: Boolean(startingNodeId && endingNodeId),
    staleTime: 0,
    refetchOnMount: "always",
  });

  // Update route number based on existing routes
  useEffect(() => {
    const count = Array.isArray(existingRoute) ? (typeof existingRoute[0] === "object" && existingRoute[0] !== null && "total_count" in (existingRoute[0] as any) ? ((existingRoute[0] as any).total_count as number) : existingRoute.length) : 0;

    if (count > 0) {
      setRouteNumber(count + 1);
    } else {
      setRouteNumber(1);
    }
    setExistingRoutes(existingRoute?.map((route) => route.route_name) ?? null);
  }, [existingRoute]);

  const isLoading = nodesLoading || ofcTypesLoading || maintenanceTerminalsLoading || pageLoading || existingRouteLoading;

  return (
    <FormCard
      key={isEdit ? ofcCable?.id ?? "edit" : "new"}
      title={isEdit ? "Edit Optical Fiber Cable" : "Add Optical Fiber Cable"}
      subtitle={isEdit ? "Update the cable details below" : "Fill in the Optical Fiber Cable details below"}
      isLoading={isLoading}
      onCancel={onCancel}
      onSubmit={handleSubmit(onValidSubmit)}
      submitText={isEdit ? "Update Optical Fiber Cable" : "Create Optical Fiber Cable"}>
      <div className='p-6'>
        {/* Loading Overlay */}
        {isLoading && (
          <div className='absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg'>
            <div className='flex items-center space-x-3 bg-white dark:bg-gray-800 rounded-lg px-6 py-4 shadow-lg border dark:border-gray-700'>
              <ButtonSpinner size='sm' />
              <span className='text-gray-600 dark:text-gray-300'>Loading form data...</span>
            </div>
          </div>
        )}

        {/* Existing Routes Alert */}
        {existingRoutes && existingRoutes.length > 0 && (
          <div className='mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4'>
            <div className='flex items-start space-x-3'>
              <div className='flex-shrink-0'>
                <svg className='w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='flex-1'>
                <h4 className='text-sm font-medium text-amber-800 dark:text-amber-200'>Existing Routes Found</h4>
                <p className='text-sm text-amber-700 dark:text-amber-300 mt-1'>
                  {existingRoutes.length} cable route{existingRoutes.length > 1 ? "s" : ""} already exist between these nodes:
                </p>
                <ul className='mt-2 space-y-1'>
                  {existingRoutes.map((route, index) => (
                    <li key={index} className='text-sm text-amber-700 dark:text-amber-300 flex items-center space-x-2'>
                      <span className='w-1.5 h-1.5 bg-amber-400 rounded-full'></span>
                      <span className='font-mono'>{route}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Form Fields */}
        <div className='space-y-8'>
          {/* Route Configuration Section */}
          <div className='bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border dark:border-gray-700'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2'>
              <svg className='w-5 h-5 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
              </svg>
              <span>Route Configuration</span>
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Starting Node */}
              <div className='space-y-2'>
                <FormSearchableSelect name='sn_id' label='Starting Node' control={control} options={startingNodeOptions} error={errors.sn_id} placeholder='Select starting node' searchPlaceholder='Search starting nodes...' />
              </div>

              {/* Ending Node */}
              <div className='space-y-2'>
                <FormSearchableSelect name='en_id' label='Ending Node' control={control} options={endingNodeOptions} error={errors.en_id} placeholder='Select ending node' searchPlaceholder='Search ending nodes...' />
              </div>
            </div>

            {/* Generated Route Name (Read-only display) */}
            {watchedValues.route_name && (
              <div className='mt-6 space-y-2'>
                <Label className='text-gray-700 dark:text-gray-300 font-medium'>Generated Route Name</Label>
                <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md px-3 py-2'>
                  <span className='text-blue-900 dark:text-blue-100 font-mono text-sm'>{watchedValues.route_name}</span>
                </div>
              </div>
            )}
          </div>

          {/* Cable Details Section */}
          <div className='bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border dark:border-gray-700'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2'>
              <svg className='w-5 h-5 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
              </svg>
              <span>Cable Specifications</span>
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {/* Asset Number */}
              <div className='space-y-2'>
                <FormInput name='asset_no' label='Asset Number' register={register} error={errors.asset_no} placeholder='Enter asset number' />
              </div>

              {/* OFC Type */}
              <div className='space-y-2'>
                <FormSearchableSelect name='ofc_type_id' label='OFC Type' control={control} options={ofcTypeOptions} error={errors.ofc_type_id} placeholder='Select OFC type' searchPlaceholder='Search OFC types...' />
              </div>

              {/* Capacity */}
              <div className='space-y-2'>
                <FormSearchableSelect
                  name='capacity'
                  control={control}
                  label='Capacity'
                  error={errors.capacity}
                  placeholder='Select capacity'
                  searchPlaceholder='Search capacities...'
                  options={capacityOptions}
                  disabled={isCapacityLocked} // 🔒 lock if inferred from OFC type
                />
                {isCapacityLocked && <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>Capacity inferred from selected OFC type and locked.</p>}
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-6'>
              {/* Current RKM */}
              <div className='space-y-2'>
                <FormInput name='current_rkm' label='Current RKM (km)' register={register} error={errors.current_rkm} placeholder='Enter current RKM' type='number' step='0.01' />
              </div>

              {/* Transnet RKM */}
              <div className='space-y-2'>
                <FormInput name='transnet_rkm' label='Transnet RKM (km)' register={register} error={errors.transnet_rkm} placeholder='Enter transnet RKM' type='number' step='0.01' />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-6'>
              {/* Transnet ID */}
              <div className='space-y-2'>
                <FormInput name='transnet_id' label='Transnet ID' register={register} error={errors.transnet_id} placeholder='Enter transnet ID' />
              </div>

              {/* Commissioned On */}
              <div className='space-y-2'>
                <FormDateInput name='commissioned_on' label='Commissioned Date' control={control} error={errors.commissioned_on} placeholder='Select commissioned date' />
              </div>
            </div>

            {/* Status Switch */}
            <div className='flex items-center space-x-3 pt-6'>
              <Switch id='status' checked={currentStatus ?? true} onChange={(checked: boolean) => setValue("status", checked)} className='dark:bg-gray-600' />
              <Label htmlFor='status' className='text-gray-700 dark:text-gray-300 font-medium'>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    currentStatus ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                  }`}>
                  {currentStatus ? "Active" : "Inactive"}
                </span>
              </Label>
            </div>
          </div>

          {/* Maintenance Section */}
          <div className='bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border dark:border-gray-700'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2'>
              <svg className='w-5 h-5 text-orange-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                />
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
              </svg>
              <span>Maintenance Information</span>
            </h3>

            <div className='grid grid-cols-1 gap-6'>
              {/* Maintenance Terminal */}
              <div className='space-y-2'>
                <FormSearchableSelect
                  name='maintenance_terminal_id'
                  label='Maintenance Terminal'
                  control={control}
                  options={maintenanceTerminalOptions}
                  error={errors.maintenance_terminal_id}
                  placeholder='Select maintenance terminal'
                  searchPlaceholder='Search maintenance terminals...'
                />
              </div>

              {/* Remarks */}
              <div className='space-y-2'>
                <FormTextarea name='remark' label='Additional Notes' register={register} error={errors.remark} placeholder='Enter any maintenance notes, installation details, or other relevant information...' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </FormCard>
  );
};

export default OfcForm;
