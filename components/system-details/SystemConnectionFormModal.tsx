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
import { Modal, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/common/ui";
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
    // Validation: Customer Name and Interface are now mandatory
    customer_name: z.string().min(1, "Customer / Link Name is required"),
    system_working_interface: z.string().min(1, "Working Interface is required"),
    media_type_id: z.string().uuid("Media Type is required"),
  });

export type SystemConnectionFormValues = z.infer<typeof formSchema>;

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
    },
  });

  // Watch fields to trigger dynamic fetches
  const watchSystemId = watch("system_id");
  const watchSnId = watch("sn_id");
  const watchEnId = watch("en_id");

  // --- Data Fetching ---
  
  // 1. Systems List
  const { data: systemsResult = { data: [] } } = useTableQuery(supabase, "systems", {
    columns: "id, system_name, ip_address, node_name, system_type:system_type_id(code)",
  });
  
  // 2. Lookups
  const { data: mediaTypes = { data: [] } } = useTableQuery(supabase, "lookup_types", {
    columns: "id, name",
    filters: { category: "MEDIA_TYPES", name: { operator: "neq", value: "DEFAULT" } },
  });
  
  const { data: linkTypes = { data: [] } } = useTableQuery(supabase, "lookup_types", {
    columns: "id, name",
    filters: { category: "LINK_TYPES", name: { operator: "neq", value: "DEFAULT" } },
  });

  // 3. Fetch Ports for Main System
  const { data: mainSystemPorts } = useTableQuery(supabase, "ports_management", {
    columns: "port, port_utilization",
    filters: { system_id: watchSystemId || '' },
    limit: 1000,
    // Only fetch if system ID is present
    enabled: !!watchSystemId,
  });

  // 4. Fetch Ports for Start Node (SN)
  const { data: snPorts } = useTableQuery(supabase, "ports_management", {
    columns: "port, port_utilization",
    filters: { system_id: watchSnId || '' },
    limit: 1000,
    enabled: !!watchSnId,
  });

  // 5. Fetch Ports for End Node (EN)
  const { data: enPorts } = useTableQuery(supabase, "ports_management", {
    columns: "port, port_utilization",
    filters: { system_id: watchEnId || '' },
    limit: 1000,
    enabled: !!watchEnId,
  });

  // --- Options Processing ---

  const systems = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => (systemsResult.data as any[]) ?? [],
    [systemsResult.data]
  );

  const systemOptions = useMemo(
    () =>
      systems
        .filter((s) => s.id !== parentSystem.id) 
        .map((s) => {
          const loc = s.node_name ? ` @ ${s.node_name}` : "";
          const ip = s.ip_address ? ` [${s.ip_address}]` : "";
          const label = `${s.system_name}${loc}${ip}`;
          return { value: s.id, label };
        }),
    [systems, parentSystem.id]
  );

  const mediaTypeOptions = useMemo(
    () => mediaTypes.data.map((t) => ({ value: t.id, label: t.name })),
    [mediaTypes]
  );
  
  const linkTypeOptions = useMemo(
    () => linkTypes.data.map((t) => ({ value: t.id, label: t.name })),
    [linkTypes]
  );

  // Helper to map ports to options
  const mapPortsToOptions = (
    portsData: { port: string | null, port_utilization: boolean | null }[] | undefined, 
    currentValue?: string | null
  ) => {
    const options = (portsData || [])
      .filter(p => p.port)
      .map(p => ({
        value: p.port!,
        label: `${p.port} ${p.port_utilization ? '(In Use)' : ''}`,
        // Optional: disable if in use, but allow if it's the current value (editing)
        // disabled: p.port_utilization && p.port !== currentValue 
      }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));

    // If editing and the current value isn't in the list (legacy or manual entry), add it
    if (currentValue && !options.find(o => o.value === currentValue)) {
      options.unshift({ value: currentValue, label: `${currentValue} (Current)` });
    }

    return options;
  };

  // --- Reset Logic ---
  useEffect(() => {
    if (isOpen) {
      setActiveTab("general");
      if (isEditMode && editingConnection) {
        reset({
          system_id: editingConnection.system_id ?? parentSystem.id ?? "",
          
          // General
          customer_name: editingConnection.customer_name ?? "",
          media_type_id: editingConnection.media_type_id ?? "",
          system_working_interface: editingConnection.system_working_interface ?? "",
          system_protection_interface: editingConnection.system_protection_interface ?? null,
          status: editingConnection.status ?? true,
          commissioned_on: editingConnection.commissioned_on ?? null,
          remark: editingConnection.remark ?? null,
          
          // Specs
          bandwidth: editingConnection.bandwidth ?? null,
          bandwidth_allocated: editingConnection.bandwidth_allocated ?? null,
          vlan: editingConnection.vlan ?? null,
          connected_link_type_id: editingConnection.connected_link_type_id ?? null,

          // Connectivity
          sn_id: editingConnection.sn_id ?? null,
          en_id: editingConnection.en_id ?? null,
          sn_interface: editingConnection.sn_interface ?? null,
          en_interface: editingConnection.en_interface ?? null,
          sn_ip: (editingConnection.sn_ip as string) ?? null,
          en_ip: (editingConnection.en_ip as string) ?? null,

          // SDH
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
        });
      }
    }
  }, [isOpen, isEditMode, editingConnection, parentSystem, reset]);

  const onValidSubmit = useCallback(
    (formData: SystemConnectionFormValues) => {
      onSubmit(formData);
    },
    [onSubmit]
  );

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
                <div className="col-span-full md:col-span-2">
                   <FormInput
                    name="customer_name"
                    label="Customer / Link Name"
                    placeholder="e.g. SBI-Link-01"
                    register={register}
                    error={errors.customer_name}
                    required
                  />
                </div>
                
                <FormSearchableSelect
                  name="system_working_interface"
                  label="Working Port (Interface)"
                  control={control}
                  options={mapPortsToOptions(mainSystemPorts?.data, editingConnection?.system_working_interface)}
                  error={errors.system_working_interface}
                  placeholder="Select Working Port"
                  searchPlaceholder="Search ports..."
                  required
                />
                
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
                <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide border-b pb-2 dark:border-gray-600">Start Node (Side A)</h3>
                  <FormSearchableSelect
                    name="sn_id"
                    label="Start System"
                    control={control}
                    options={systemOptions}
                    error={errors.sn_id}
                  />
                  
                  {/* Dynamically fetch ports based on sn_id */}
                  <FormSearchableSelect
                    name="sn_interface"
                    label="Interface"
                    control={control}
                    options={mapPortsToOptions(snPorts?.data, editingConnection?.sn_interface)}
                    error={errors.sn_interface}
                    placeholder={watchSnId ? "Select Start Port" : "Select System First"}
                    disabled={!watchSnId}
                  />

                  <FormInput
                    name="sn_ip"
                    label="IP Address"
                    register={register}
                    error={errors.sn_ip}
                  />
                </div>

                <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide border-b pb-2 dark:border-gray-600">End Node (Side B)</h3>
                  <FormSearchableSelect
                    name="en_id"
                    label="End System"
                    control={control}
                    options={systemOptions}
                    error={errors.en_id}
                  />

                  {/* Dynamically fetch ports based on en_id */}
                  <FormSearchableSelect
                    name="en_interface"
                    label="Interface"
                    control={control}
                    options={mapPortsToOptions(enPorts?.data, editingConnection?.en_interface)}
                    error={errors.en_interface}
                    placeholder={watchEnId ? "Select End Port" : "Select System First"}
                    disabled={!watchEnId}
                  />

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