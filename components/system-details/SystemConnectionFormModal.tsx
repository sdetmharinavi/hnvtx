"use client";

import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useForm, SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ServicesRowSchema,
  V_system_connections_completeRowSchema,
  V_systems_completeRowSchema,
} from "@/schemas/zod-schemas";
import { useTableQuery, PublicTableName } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { Modal, Tabs, TabsList, TabsTrigger, TabsContent, Input, Label } from "@/components/common/ui";
import {
  FormCard,
  FormDateInput,
  FormInput,
  FormSearchableSelect,
} from "@/components/common/form";
import { z } from "zod";
import { toast } from "sonner";
import { Network, Settings, Activity } from "lucide-react";
import { RpcFunctionArgs } from "@/hooks/database/queries-type-helpers";

// --- 1. Strict Zod Schema ---
const formSchema = z.object({
  // Connection Keys
  system_id: z.string().uuid(),
  media_type_id: z.string().uuid("Media Type is required"),
  status: z.boolean(),
  commissioned_on: z.string().nullable().optional(),
  remark: z.string().nullable().optional(),
  
  // Service Keys (Merged from Services Table)
  service_name: z.string().min(1, "Service Name / Customer is required"),
  link_type_id: z.string().uuid().nullable().optional(),
  bandwidth_allocated: z.string().nullable().optional(),
  vlan: z.string().nullable().optional(),
  lc_id: z.string().nullable().optional(),
  unique_id: z.string().nullable().optional(),
  
  // Connectivity
  system_working_interface: z.string().nullable().optional(),
  system_protection_interface: z.string().nullable().optional(),
  sn_id: z.string().nullable().optional(),
  en_id: z.string().nullable().optional(),
  sn_ip: z.string().nullable().optional(),
  en_ip: z.string().nullable().optional(),
  sn_interface: z.string().nullable().optional(),
  en_interface: z.string().nullable().optional(),
  bandwidth: z.string().nullable().optional(),
  
  // SDH
  stm_no: z.string().nullable().optional(),
  carrier: z.string().nullable().optional(),
  a_slot: z.string().nullable().optional(),
  a_customer: z.string().nullable().optional(),
  b_slot: z.string().nullable().optional(),
  b_customer: z.string().nullable().optional(),
  
  // UI Helper
  existing_service_id: z.string().nullable().optional(),
});

export type SystemConnectionFormValues = z.infer<typeof formSchema>;

// --- 2. Extended Types for Legacy/Migration Support ---
// Use Omit to remove the property if it exists in the base type, then re-add it as optional
// This prevents conflicts if V_system_connections_completeRowSchema changes
type ExtendedConnectionRow = Omit<V_system_connections_completeRowSchema, 'customer_name'> & { 
    lc_id?: string | null; 
    unique_id?: string | null;
    service_id?: string | null; 
    // Explicitly define both possible name fields
    service_name?: string | null;
    customer_name?: string | null;
};

// Helper Type for the RPC Payload
type UpsertPayload = RpcFunctionArgs<'upsert_system_connection_with_details'>;

interface SystemConnectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentSystem: V_systems_completeRowSchema;
  editingConnection: V_system_connections_completeRowSchema | null;
  onSubmit: (data: UpsertPayload) => void; 
  isLoading: boolean;
}

export const SystemConnectionFormModal: FC<SystemConnectionFormModalProps> = ({
  isOpen,
  onClose,
  parentSystem,
  editingConnection,
  onSubmit,
  isLoading,
}) => {
  const supabase = createClient();
  const isEditMode = !!editingConnection;
  const [activeTab, setActiveTab] = useState("general");
  const [serviceMode, setServiceMode] = useState<'existing' | 'manual'>('existing');

  // --- Form Setup ---
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<SystemConnectionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      system_id: parentSystem.id ?? "",
      status: true,
      media_type_id: "",
      service_name: "",
      link_type_id: "",
    },
  });

  // Watchers
  const watchLinkTypeId = watch("link_type_id");
  const watchExistingServiceId = watch("existing_service_id");
  const watchSystemId = watch("system_id");
  const watchEnId = watch("en_id");
  // const watchWorkingInterface = watch("system_working_interface");
  // const watchProtectionInterface = watch("system_protection_interface");
  const watchSnInterface = watch("sn_interface");
  const watchEnInterface = watch("en_interface");
  const watchSnId = watch("sn_id");
  
  // --- Data Fetching ---
  
  const { data: systemsResult = { data: [] } } = useTableQuery(supabase, "v_systems_complete", {
    columns: "id, system_name, ip_address, node_name",
    limit: 5000,
  });
  
  const { data: mediaTypes = { data: [] } } = useTableQuery(supabase, "lookup_types", {
    columns: "id, name",
    filters: { category: "MEDIA_TYPES", name: { operator: "neq", value: "DEFAULT" } },
  });
  
  const { data: linkTypes = { data: [] } } = useTableQuery(supabase, "lookup_types", {
    columns: "id, name",
    filters: { category: "LINK_TYPES", name: { operator: "neq", value: "DEFAULT" } },
  });

  // Fetch Services
  const { data: servicesResult = { data: [] } } = useTableQuery(supabase, "services" as PublicTableName, {
      columns: "id, name, link_type_id, services_ip, services_interface, bandwidth_allocated, vlan, lc_id, unique_id",
      filters: { status: true }, 
      orderBy: [{ column: "name", ascending: true }],
      limit: 2000
  });
  
  const servicesData = useMemo(
    () => ((servicesResult?.data || []) as unknown as ServicesRowSchema[]),
    [servicesResult?.data]
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: mainSystemPorts } = useTableQuery(supabase, "v_ports_management_complete", {
    columns: "port, port_utilization, port_type_name, port_type_code",
    filters: { 
      system_id: watchSystemId || '',
      port_admin_status: true 
    },
    limit: 1000,
    enabled: !!watchSystemId,
  });

  const { data: snPorts } = useTableQuery(supabase, "v_ports_management_complete", {
    columns: "port, port_utilization, port_type_name, port_type_code",
    filters: { 
      system_id: watchSnId || '',
      port_admin_status: true 
    },
    limit: 1000,
    enabled: !!watchSnId,
  });

  const { data: enPorts } = useTableQuery(supabase, "v_ports_management_complete", {
    columns: "port, port_utilization, port_type_name, port_type_code",
    filters: { 
      system_id: watchEnId || '',
      port_admin_status: true
    },
    limit: 1000,
    enabled: !!watchEnId,
  });

  // --- Helper Functions ---

  const mapPortsToOptions = (
    portsData: { port: string | null, port_utilization: boolean | null }[] | undefined, 
    currentValue?: string | null
  ) => {
    const options = (portsData || [])
      .filter(p => p.port)
      .map(p => ({
        value: p.port!,
        label: `${p.port} ${p.port_utilization ? '(In Use)' : ''}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));

    if (currentValue && !options.find(o => o.value === currentValue)) {
      options.unshift({ value: currentValue, label: `${currentValue} (Current)` });
    }

    return options;
  };

  const getPortTypeDisplay = useCallback((portInterface: string | null | undefined, portsList: typeof mainSystemPorts) => {
    if (!portsList?.data || !portInterface) return "";
    const port = portsList.data.find(p => p.port === portInterface);
    if (!port) return "Unknown";
    return port.port_type_code || port.port_type_name || "Unknown";
  }, []);

  // --- Options Processing ---

  const systemOptions = useMemo(
    () =>
      (systemsResult.data || [])
        .map((s) => {
          const loc = s.node_name ? ` @ ${s.node_name}` : "";
          const ip = s.ip_address ? ` [${s.ip_address.split('/')[0]}]` : "";
          const label = `${s.system_name}${loc}${ip}`;
          return { value: s.id!, label };
        }),
    [systemsResult.data]
  );

  const mediaTypeOptions = useMemo(() => mediaTypes.data.map((t) => ({ value: t.id, label: t.name })), [mediaTypes.data]);
  const linkTypeOptions = useMemo(() => linkTypes.data.map((t) => ({ value: t.id, label: t.name })), [linkTypes.data]);

  // Filter services based on selected Link Type
  const serviceOptions = useMemo(() => {
      let filteredServices = servicesData;
      if (watchLinkTypeId) {
          filteredServices = filteredServices.filter(s => s.link_type_id === watchLinkTypeId);
      }
      return filteredServices.map(s => ({ value: s.id, label: s.name }));
  }, [servicesData, watchLinkTypeId]);

  // --- Effects: Service Logic ---
  
  // Auto-fill when an existing service is selected
  useEffect(() => {
      if (!watchExistingServiceId) return;
      
      const selectedService = servicesData.find(s => s.id === watchExistingServiceId);
      if (selectedService) {
          setValue("service_name", selectedService.name);
          if(selectedService.link_type_id) setValue("link_type_id", selectedService.link_type_id);
          if(selectedService.vlan) setValue("vlan", selectedService.vlan);
          if(selectedService.bandwidth_allocated) setValue("bandwidth_allocated", selectedService.bandwidth_allocated);
          if(selectedService.lc_id) setValue("lc_id", selectedService.lc_id);
          if(selectedService.unique_id) setValue("unique_id", selectedService.unique_id);

          // Logic to auto-fill End B if currently empty
          if (selectedService.services_ip) {
             const ip = selectedService.services_ip.split('/')[0];
             setValue("en_ip", ip, { shouldDirty: true }); 
          }
          
          if (selectedService.services_interface) {
             setValue("en_interface", selectedService.services_interface, { shouldDirty: true });
          }
      }
  }, [watchExistingServiceId, servicesData, setValue, watch]);

  useEffect(() => {
    if (serviceMode === 'manual') {
      setValue("existing_service_id", null);
    }
  }, [serviceMode, setValue]);

  // --- Computed Values for Display ---
  
  // const workingPortType = getPortTypeDisplay(watchWorkingInterface, mainSystemPorts);
  // const protectionPortType = getPortTypeDisplay(watchProtectionInterface, mainSystemPorts);
  const snPortType = getPortTypeDisplay(watchSnInterface, snPorts);
  const enPortType = getPortTypeDisplay(watchEnInterface, enPorts);

  // --- Reset Logic ---
  useEffect(() => {
    if (isOpen) {
      setActiveTab("general");
      if (isEditMode && editingConnection) {
        // Safe cast to our extended type which handles potentially missing fields
        const extConnection = editingConnection as unknown as ExtendedConnectionRow;
        
        const safeValue = (val: string | null | undefined) => val ?? "";
        const safeNull = (val: string | null | undefined) => val ?? null;

        setServiceMode(extConnection.service_id ? 'existing' : 'manual');

        reset({
          system_id: extConnection.system_id ?? parentSystem.id ?? "",
          
          // Handle name change: prefer service_name, fallback to customer_name
          service_name: safeValue(extConnection.service_name ?? extConnection.customer_name), 
          
          link_type_id: safeValue(extConnection.connected_link_type_id),
          vlan: safeValue(extConnection.vlan),
          bandwidth_allocated: safeValue(extConnection.bandwidth_allocated),
          lc_id: safeValue(extConnection.lc_id),
          unique_id: safeValue(extConnection.unique_id),
          existing_service_id: safeNull(extConnection.service_id),

          // Connection Fields
          status: extConnection.status ?? true,
          media_type_id: safeValue(extConnection.media_type_id),
          system_working_interface: safeValue(extConnection.system_working_interface),
          system_protection_interface: safeNull(extConnection.system_protection_interface),
          commissioned_on: safeNull(extConnection.commissioned_on),
          remark: safeNull(extConnection.remark),
          bandwidth: safeNull(extConnection.bandwidth),
          
          sn_id: safeNull(extConnection.sn_id),
          en_id: safeNull(extConnection.en_id),
          sn_interface: safeNull(extConnection.sn_interface),
          en_interface: safeNull(extConnection.en_interface),
          sn_ip: safeNull(extConnection.sn_ip as string),
          en_ip: safeNull(extConnection.en_ip as string),
          
          stm_no: safeNull(extConnection.sdh_stm_no),
          carrier: safeNull(extConnection.sdh_carrier),
          a_slot: safeNull(extConnection.sdh_a_slot),
          a_customer: safeNull(extConnection.sdh_a_customer),
          b_slot: safeNull(extConnection.sdh_b_slot),
          b_customer: safeNull(extConnection.sdh_b_customer),
        });
      } else {
        reset({
          system_id: parentSystem.id!,
          status: true,
          media_type_id: "",
          service_name: "",
          link_type_id: "",
        });
        setServiceMode('existing');
      }
    }
  }, [isOpen, isEditMode, editingConnection, parentSystem, reset]);

  const onValidSubmit = useCallback((formData: SystemConnectionFormValues) => {
      const payload: UpsertPayload = {
          p_id: isEditMode && editingConnection?.id ? editingConnection.id : undefined,
          p_system_id: formData.system_id,
          p_service_name: formData.service_name,
          p_link_type_id: formData.link_type_id || undefined,
          p_bandwidth_allocated: formData.bandwidth_allocated || undefined,
          p_vlan: formData.vlan || undefined,
          p_lc_id: formData.lc_id || undefined,
          p_unique_id: formData.unique_id || undefined,
          p_services_ip: formData.en_ip || undefined, 
          p_services_interface: formData.en_interface || undefined,
          p_media_type_id: formData.media_type_id,
          p_status: formData.status,
          p_bandwidth: formData.bandwidth || undefined,
          p_commissioned_on: formData.commissioned_on || undefined,
          p_remark: formData.remark || undefined,
          p_sn_id: formData.sn_id || undefined,
          p_en_id: formData.en_id || undefined,
          p_sn_ip: formData.sn_ip || undefined,
          p_en_ip: formData.en_ip || undefined,
          p_sn_interface: formData.sn_interface || undefined,
          p_en_interface: formData.en_interface || undefined,
          p_system_working_interface: formData.system_working_interface || undefined,
          p_system_protection_interface: formData.system_protection_interface || undefined,
          p_stm_no: formData.stm_no || undefined,
          p_carrier: formData.carrier || undefined,
          p_a_slot: formData.a_slot || undefined,
          p_a_customer: formData.a_customer || undefined,
          p_b_slot: formData.b_slot || undefined,
          p_b_customer: formData.b_customer || undefined,
      };
      
      onSubmit(payload);
  }, [onSubmit, isEditMode, editingConnection]);

  const onInvalidSubmit: SubmitErrorHandler<SystemConnectionFormValues> = (errors) => {
    console.error("Form Errors:", errors);
    toast.error("Please check the form for errors.");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? "Edit Service Connection" : "New Service Connection"} size="full">
      <FormCard
        onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}
        onCancel={onClose}
        isLoading={isLoading}
        title={isEditMode ? "Edit Service Connection" : "New Service Connection"}
        subtitle={`System: ${parentSystem.system_name}`}
        standalone
      >
         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="general" className="flex items-center gap-2">
                    <Activity className="w-4 h-4" /> General
                </TabsTrigger>
                <TabsTrigger value="connectivity" className="flex items-center gap-2">
                    <Network className="w-4 h-4" /> Connectivity
                </TabsTrigger>
                <TabsTrigger value="sdh" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" /> SDH / Legacy
                </TabsTrigger>
            </TabsList>
            
            <div className="mt-4 min-h-[350px] overflow-y-auto px-1">
                {/* TAB 1: GENERAL */}
                <TabsContent value="general" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormSearchableSelect
                            name="link_type_id"
                            label="Link Type"
                            control={control}
                            options={linkTypeOptions}
                            error={errors.link_type_id}
                            placeholder="Select Type (e.g. MPLS)"
                        />
                        
                        <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-4 mb-2">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input 
                                        type="radio" 
                                        checked={serviceMode === 'existing'} 
                                        onChange={() => setServiceMode('existing')}
                                        className="text-blue-600"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300">Select Existing</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input 
                                        type="radio" 
                                        checked={serviceMode === 'manual'} 
                                        onChange={() => setServiceMode('manual')}
                                        className="text-blue-600"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300">Create/Manual</span>
                                </label>
                            </div>

                            {serviceMode === 'existing' ? (
                                <div className="space-y-2">
                                    <FormSearchableSelect
                                        name="existing_service_id"
                                        label="Select Service"
                                        control={control}
                                        options={serviceOptions}
                                        error={errors.existing_service_id}
                                        placeholder="Search services..."
                                        clearable
                                    />
                                    {/* Hidden input to actually submit the name populated by effect */}
                                    <input type="hidden" {...register("service_name")} />
                                    {errors.service_name && (
                                        <p className="text-xs text-red-500">{errors.service_name.message}</p>
                                    )}
                                </div>
                            ) : (
                                <FormInput 
                                    name="service_name"
                                    label="New Service Name / Customer"
                                    register={register}
                                    error={errors.service_name}
                                    placeholder="e.g. SBI-Kolkata-Main"
                                    required
                                />
                            )}
                        </div>

                        <FormInput name="vlan" label="VLAN" register={register} error={errors.vlan} />
                        <FormInput name="bandwidth_allocated" label="Allocated BW" register={register} error={errors.bandwidth_allocated} />
                        <FormInput name="lc_id" label="LC ID" register={register} error={errors.lc_id} />
                        <FormInput name="unique_id" label="Unique ID" register={register} error={errors.unique_id} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t dark:border-gray-700">
                        <FormSearchableSelect name="media_type_id" label="Media Type" control={control} options={mediaTypeOptions} error={errors.media_type_id} required />
                        <FormInput name="bandwidth" label="Physical Port Capacity" register={register} error={errors.bandwidth} placeholder="e.g. 1G" />
                        <FormDateInput name="commissioned_on" label="Commissioned On" control={control} error={errors.commissioned_on} />
                        <FormInput name="system_working_interface" label="Local Interface" register={register} error={errors.system_working_interface} placeholder="e.g. Gi0/0/1" />
                    </div>
                </TabsContent>
                
                {/* TAB 2: CONNECTIVITY */}
                <TabsContent value="connectivity" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Start Node Panel */}
                        <div className="p-4 border rounded dark:border-gray-700">
                            <h3 className="font-semibold mb-3">Start Node (Side A)</h3>
                            <FormSearchableSelect name="sn_id" label="Start System" control={control} options={systemOptions} error={errors.sn_id} />
                            
                            <div className="grid grid-cols-3 gap-3 mt-2">
                                <div className="col-span-2">
                                    <FormSearchableSelect
                                        name="sn_interface"
                                        label="Interface"
                                        control={control}
                                        options={mapPortsToOptions(snPorts?.data, editingConnection?.sn_interface)}
                                        error={errors.sn_interface}
                                        placeholder={watchSnId ? "Select Start Port" : "Select System First"}
                                        disabled={!watchSnId}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Label disabled className="mb-1">Type</Label>
                                    <Input disabled value={snPortType} className="bg-white dark:bg-gray-900 text-gray-500 font-mono text-xs h-[42px]" />
                                </div>
                            </div>

                            <FormInput name="sn_ip" label="IP Address" register={register} error={errors.sn_ip} className="mt-2" />
                        </div>

                        {/* End Node Panel */}
                        <div className="p-4 border rounded dark:border-gray-700">
                            <div className="flex justify-between border-b pb-2 dark:border-gray-600 mb-3">
                                <h3 className="font-semibold">End Node (Side B)</h3>
                                {watchExistingServiceId && <span className="text-xs text-blue-600 bg-blue-50 px-2 rounded">Auto-filled from Service</span>}
                            </div>
                            <FormSearchableSelect name="en_id" label="End System (If internal)" control={control} options={systemOptions} error={errors.en_id} />
                            
                            <div className="grid grid-cols-3 gap-3 mt-2">
                                <div className="col-span-2">
                                    {watchEnId ? (
                                        <FormSearchableSelect
                                            name="en_interface"
                                            label="Interface"
                                            control={control}
                                            options={mapPortsToOptions(enPorts?.data, editingConnection?.en_interface)}
                                            error={errors.en_interface}
                                            placeholder="Select End Port"
                                        />
                                    ) : (
                                        <FormInput 
                                            name="en_interface" 
                                            label="Interface / Port" 
                                            register={register} 
                                            placeholder={watchExistingServiceId ? "Auto-filled" : "e.g. Port 1"} 
                                        />
                                    )}
                                </div>
                                <div className="col-span-1">
                                    <Label disabled className="mb-1">Type</Label>
                                    <Input disabled value={enPortType} className="bg-white dark:bg-gray-900 text-gray-500 font-mono text-xs h-[42px]" />
                                </div>
                            </div>
                            
                            <FormInput name="en_ip" label="IP Address" register={register} error={errors.en_ip} className="mt-2" />
                        </div>
                    </div>
                </TabsContent>
                
                {/* TAB 3: SDH */}
                <TabsContent value="sdh" className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                    Enter details here if this connection runs over an SDH, DWDM, or Legacy network.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput name="stm_no" label="STM Number / Hierarchy" register={register} error={errors.stm_no} placeholder="e.g. STM-16" />
                    <FormInput name="carrier" label="Carrier / Operator" register={register} error={errors.carrier} />
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase">Side A Details</h4>
                        <FormInput name="a_slot" label="Slot/Port" register={register} error={errors.a_slot} />
                        <FormInput name="a_customer" label="Customer/Location" register={register} error={errors.a_customer} />
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase">Side B Details</h4>
                        <FormInput name="b_slot" label="Slot/Port" register={register} error={errors.b_slot} />
                        <FormInput name="b_customer" label="Customer/Location" register={register} error={errors.b_customer} />
                    </div>
                </div>
                </TabsContent>
            </div>
        </Tabs>
      </FormCard>
    </Modal>
  );
};