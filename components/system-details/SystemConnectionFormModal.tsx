// path: components/system-details/SystemConnectionFormModal.tsx
"use client";

import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useForm, SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  system_connectionsInsertSchema,
  sdh_connectionsInsertSchema,
  V_system_connections_completeRowSchema,
  V_systems_completeRowSchema,
} from "@/schemas/zod-schemas";
import { useTableQuery } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { Modal, Tabs, TabsList, TabsTrigger, TabsContent, Input, Label } from "@/components/common/ui";
import {
  FormCard,
  FormDateInput,
  FormInput,
  FormSearchableSelect,
  FormSwitch,
  FormTextarea,
} from "@/components/common/form";
import { z } from "zod";
import { toast } from "sonner";
import { Network, Settings, Activity } from "lucide-react";

// --- Custom Schema: Enforce Requirements ---
const formSchema = system_connectionsInsertSchema
  .omit({
    working_fiber_in_ids: true,
    working_fiber_out_ids: true,
    protection_fiber_in_ids: true,
    protection_fiber_out_ids: true,
    created_at: true,
    updated_at: true,
    id: true
  })
  .extend(sdh_connectionsInsertSchema.omit({ system_connection_id: true }).shape)
  .extend({
    customer_name: z.string().min(1, "Customer / Link Name is required"),
    // THE FIX: Made system_working_interface optional
    system_working_interface: z.string().nullable().optional(),
    media_type_id: z.string().uuid("Media Type is required"),
    lc_id: z.string().nullable().optional(),
    unique_id: z.string().nullable().optional(),
  });

export type SystemConnectionFormValues = z.infer<typeof formSchema>;

type ExtendedConnectionRow = V_system_connections_completeRowSchema & { lc_id?: string | null; unique_id?: string | null };

interface SystemConnectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentSystem: V_systems_completeRowSchema;
  editingConnection: V_system_connections_completeRowSchema | null;
  onSubmit: (data: SystemConnectionFormValues) => void;
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

  // --- Form Setup ---
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
    reset,
    watch,
  } = useForm<SystemConnectionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      system_id: parentSystem.id ?? "",
      status: true,
      media_type_id: "",
      system_working_interface: "",
      customer_name: "",
      lc_id: "",
      unique_id: "",
    },
  });

  const watchSystemId = watch("system_id");
  const watchSnId = watch("sn_id");
  const watchEnId = watch("en_id");
  const watchWorkingInterface = watch("system_working_interface");
  const watchProtectionInterface = watch("system_protection_interface");
  const watchSnInterface = watch("sn_interface");
  const watchEnInterface = watch("en_interface");

  // --- Data Fetching ---
  
  const { data: systemsResult = { data: [] } } = useTableQuery(supabase, "v_systems_complete", {
    columns: "id, system_name, ip_address, node_name",
    limit: 5000,
    orderBy: [{ column: "system_name", ascending: true }]
  });
  
  const { data: mediaTypes = { data: [] } } = useTableQuery(supabase, "lookup_types", {
    columns: "id, name",
    filters: { category: "MEDIA_TYPES", name: { operator: "neq", value: "DEFAULT" } },
  });
  
  const { data: linkTypes = { data: [] } } = useTableQuery(supabase, "lookup_types", {
    columns: "id, name",
    filters: { category: "LINK_TYPES", name: { operator: "neq", value: "DEFAULT" } },
  });

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
        // THE FIX: Removed the filter that hid the parent system.
        // Now all systems, including the current one, are available for selection.
        .map((s) => {
          const loc = s.node_name ? ` @ ${s.node_name}` : "";
          const ip = s.ip_address ? ` [${s.ip_address.split('/')[0]}]` : "";
          const label = `${s.system_name}${loc}${ip}`;
          return { value: s.id!, label };
        }),
    [systemsResult.data]
  );

  const mediaTypeOptions = useMemo(() => mediaTypes.data.map((t) => ({ value: t.id, label: t.name })), [mediaTypes]);
  const linkTypeOptions = useMemo(() => linkTypes.data.map((t) => ({ value: t.id, label: t.name })), [linkTypes]);

  // --- Computed Values for Display ---
  
  const workingPortType = getPortTypeDisplay(watchWorkingInterface, mainSystemPorts);
  const protectionPortType = getPortTypeDisplay(watchProtectionInterface, mainSystemPorts);
  
  const snPortType = getPortTypeDisplay(watchSnInterface, snPorts);
  const enPortType = getPortTypeDisplay(watchEnInterface, enPorts);

  // --- Reset Logic ---
  useEffect(() => {
    if (isOpen) {
      setActiveTab("general");
      if (isEditMode && editingConnection) {
        const extConnection = editingConnection as ExtendedConnectionRow;
        reset({
          system_id: editingConnection.system_id ?? parentSystem.id ?? "",
          customer_name: editingConnection.customer_name ?? "",
          media_type_id: editingConnection.media_type_id ?? "",
          system_working_interface: editingConnection.system_working_interface ?? "",
          system_protection_interface: editingConnection.system_protection_interface ?? null,
          status: editingConnection.status ?? true,
          commissioned_on: editingConnection.commissioned_on ?? null,
          remark: editingConnection.remark ?? null,
          bandwidth: editingConnection.bandwidth ?? null,
          bandwidth_allocated: editingConnection.bandwidth_allocated ?? null,
          vlan: editingConnection.vlan ?? null,
          lc_id: extConnection.lc_id ?? null,
          unique_id: extConnection.unique_id ?? null,
          connected_link_type_id: editingConnection.connected_link_type_id ?? null,
          sn_id: editingConnection.sn_id ?? null,
          en_id: editingConnection.en_id ?? null,
          sn_interface: editingConnection.sn_interface ?? null,
          en_interface: editingConnection.en_interface ?? null,
          sn_ip: (editingConnection.sn_ip as string) ?? null,
          en_ip: (editingConnection.en_ip as string) ?? null,
          stm_no: editingConnection.sdh_stm_no ?? null,
          carrier: editingConnection.sdh_carrier ?? null,
          a_slot: editingConnection.sdh_a_slot ?? null,
          a_customer: editingConnection.sdh_a_customer ?? null,
          b_slot: editingConnection.sdh_b_slot ?? null,
          b_customer: editingConnection.sdh_b_customer ?? null,
        });
      } else {
        reset({
          system_id: parentSystem.id!,
          status: true,
          media_type_id: "",
          system_working_interface: "",
          customer_name: "",
          lc_id: "",
          unique_id: "",
        });
      }
    }
  }, [isOpen, isEditMode, editingConnection, parentSystem, reset]);

  const onValidSubmit = useCallback((formData: SystemConnectionFormValues) => onSubmit(formData), [onSubmit]);
  const onInvalidSubmit: SubmitErrorHandler<SystemConnectionFormValues> = (errors) => {
    console.error("Form Errors:", errors);
    toast.error("Please fill in all required fields (marked with *).");
  };

  const modalTitle = isEditMode ? "Edit Connection" : "New Connection";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="full"
      className="w-0 h-0 transparent"
    >
      <FormCard
        onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}
        onCancel={onClose}
        isLoading={isLoading}
        title={modalTitle}
        subtitle={`For System: ${parentSystem.system_name}`}
        standalone
        widthClass="w-full max-w-full"
        heightClass="h-auto max-h-[90vh]"
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
            {/* --- TAB 1: GENERAL --- */}
            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="col-span-full md:col-span-1">
                   <FormInput
                    name="customer_name"
                    label="Customer / Link Name"
                    placeholder="e.g. SBI-Link-01"
                    register={register}
                    error={errors.customer_name}
                    required
                  />
                </div>
                
                {/* New fields */}
                <FormInput
                  name="lc_id"
                  label="LC ID / Circuit ID"
                  placeholder="e.g. 12345"
                  register={register}
                  error={errors.lc_id}
                />
                <FormInput
                  name="unique_id"
                  label="Unique ID"
                  placeholder="e.g. UID-001"
                  register={register}
                  error={errors.unique_id}
                />

                <div className="grid grid-cols-3 gap-4 col-span-full md:col-span-2">
                   <div className="col-span-2">
                     <FormSearchableSelect
                      name="system_working_interface"
                      label="Working Port (Interface)"
                      control={control}
                      options={mapPortsToOptions(mainSystemPorts?.data, editingConnection?.system_working_interface)}
                      error={errors.system_working_interface}
                      placeholder="Select Working Port"
                      searchPlaceholder="Search ports..."
                      // THE FIX: Removed `required` prop from UI component
                    />
                  </div>
                  <div className="col-span-1">
                    <Label disabled className="mb-1">Type</Label>
                    <Input disabled value={workingPortType} className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 font-mono text-sm" />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 col-span-full md:col-span-2">
                  <div className="col-span-2">
                    <FormSearchableSelect
                      name="system_protection_interface"
                      label="Protection Port (Optional)"
                      control={control}
                      options={mapPortsToOptions(mainSystemPorts?.data, editingConnection?.system_protection_interface)}
                      error={errors.system_protection_interface}
                      placeholder="Select Protection Port"
                      searchPlaceholder="Search ports..."
                      clearable
                    />
                  </div>
                  <div className="col-span-1">
                    <Label disabled className="mb-1">Type</Label>
                    <Input disabled value={protectionPortType} className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 font-mono text-sm" />
                  </div>
                </div>

                <FormSearchableSelect
                  name="media_type_id"
                  label="Media Type"
                  control={control}
                  options={mediaTypeOptions}
                  error={errors.media_type_id}
                  placeholder="Select Media"
                  required
                />
                
                <FormSearchableSelect
                  name="connected_link_type_id"
                  label="Link Type"
                  control={control}
                  options={linkTypeOptions}
                  error={errors.connected_link_type_id}
                  placeholder="e.g. MPLS, ILL"
                />

                <FormInput
                  name="bandwidth"
                  label="Bandwidth Capacity"
                  register={register}
                  placeholder="e.g. 1000"
                  error={errors.bandwidth}
                />
                
                <FormInput
                  name="bandwidth_allocated"
                  label="Allocated Bandwidth"
                  register={register}
                  error={errors.bandwidth_allocated}
                />

                <FormInput
                  name="vlan"
                  label="VLAN ID"
                  register={register}
                  error={errors.vlan}
                  placeholder="e.g. 100"
                />
                
                <FormDateInput
                  name="commissioned_on"
                  label="Commissioned Date"
                  control={control}
                  error={errors.commissioned_on}
                />
              </div>
              
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center border-t pt-4 dark:border-gray-700">
                 <FormSwitch 
                    name="status" 
                    label="Connection Status" 
                    description="Toggle to activate/deactivate this service."
                    control={control} 
                    error={errors.status} 
                 />
                 <FormTextarea 
                    name="remark" 
                    label="Remarks" 
                    control={control} 
                    error={errors.remark} 
                    rows={1}
                 />
               </div>
            </TabsContent>

            {/* --- TAB 2: CONNECTIVITY --- */}
            <TabsContent value="connectivity" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start Node Panel */}
                <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide border-b pb-2 dark:border-gray-600">Start Node (Side A)</h3>
                  <FormSearchableSelect
                    name="sn_id"
                    label="Start System"
                    control={control}
                    options={systemOptions}
                    error={errors.sn_id}
                  />
                  
                  <div className="grid grid-cols-3 gap-3">
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

                  <FormInput
                    name="sn_ip"
                    label="IP Address"
                    register={register}
                    error={errors.sn_ip}
                  />
                </div>

                {/* End Node Panel */}
                <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide border-b pb-2 dark:border-gray-600">End Node (Side B)</h3>
                  <FormSearchableSelect
                    name="en_id"
                    label="End System"
                    control={control}
                    options={systemOptions}
                    error={errors.en_id}
                  />

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <FormSearchableSelect
                        name="en_interface"
                        label="Interface"
                        control={control}
                        options={mapPortsToOptions(enPorts?.data, editingConnection?.en_interface)}
                        error={errors.en_interface}
                        placeholder={watchEnId ? "Select End Port" : "Select System First"}
                        disabled={!watchEnId}
                      />
                    </div>
                    <div className="col-span-1">
                       <Label disabled className="mb-1">Type</Label>
                       <Input disabled value={enPortType} className="bg-white dark:bg-gray-900 text-gray-500 font-mono text-xs h-[42px]" />
                    </div>
                  </div>

                   <FormInput
                    name="en_ip"
                    label="IP Address"
                    register={register}
                    error={errors.en_ip}
                  />
                </div>
              </div>
            </TabsContent>

            {/* --- TAB 3: SDH DETAILS --- */}
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