// components/system-details/SystemConnectionFormModal.tsx
'use client';

import { FC, useEffect, useMemo, useState, useRef } from 'react';
import {
  useForm,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldError,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  V_system_connections_completeRowSchema,
  V_systems_completeRowSchema,
  V_servicesRowSchema,
} from '@/schemas/zod-schemas';
import { useRpcRecord, useTableQuery } from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent, Input, Label } from '@/components/common/ui';
import {
  FormDateInput,
  FormInput,
  FormSearchableSelect,
  FormTextarea,
} from '@/components/common/form';
import { z } from 'zod';
import { Network, Settings, Activity } from 'lucide-react';
import { RpcFunctionArgs } from '@/hooks/database/queries-type-helpers';
import { formatIP } from '@/utils/formatters';
import Link from 'next/link';
import {
  useLookupTypeOptions,
  useSystemOptions,
  usePortOptions,
} from '@/hooks/data/useDropdownOptions';
import { BaseFormModal } from '@/components/common/form/BaseFormModal'; // IMPORT

const formSchema = z.object({
  system_id: z.uuid(),
  media_type_id: z.string().uuid('Media Type is required'),
  status: z.boolean(),
  commissioned_on: z.string().nullable().optional(),
  remark: z.string().nullable().optional(),
  service_name: z.string().min(1, 'Service Name / Customer is required'),
  link_type_id: z.uuid().nullable().optional(),
  bandwidth_allocated: z.string().nullable().optional(),
  vlan: z.string().nullable().optional(),
  lc_id: z.string().nullable().optional(),
  unique_id: z.string().nullable().optional(),
  existing_service_id: z.string().nullable().optional(),
  services_ip: z.string().nullable().optional(),
  services_interface: z.string().nullable().optional(),
  system_working_interface: z.string().min(1, 'Working Interface is required'),
  system_protection_interface: z.string().nullable().optional(),
  sn_id: z.string().nullable().optional(),
  en_id: z.string().nullable().optional(),
  sn_ip: z.string().nullable().optional(),
  en_ip: z.string().nullable().optional(),
  sn_interface: z.string().nullable().optional(),
  en_interface: z.string().nullable().optional(),
  en_protection_interface: z.string().nullable().optional(),
  bandwidth: z.string().nullable().optional(),
  stm_no: z.string().nullable().optional(),
  carrier: z.string().nullable().optional(),
  a_slot: z.string().nullable().optional(),
  a_customer: z.string().nullable().optional(),
  b_slot: z.string().nullable().optional(),
  b_customer: z.string().nullable().optional(),
});

export type SystemConnectionFormValues = z.infer<typeof formSchema>;
type ExtendedConnectionRow = V_system_connections_completeRowSchema & {
  services_ip?: unknown;
  services_interface?: string | null;
  customer_name?: string | null;
  en_protection_interface?: string | null;
};
type UpsertPayload = RpcFunctionArgs<'upsert_system_connection_with_details'>;

interface SystemConnectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentSystem?: V_systems_completeRowSchema | null;
  editingConnection: V_system_connections_completeRowSchema | null;
  onSubmit: (data: UpsertPayload) => void;
  isLoading: boolean;
}

const BandwidthInput = ({
  name,
  label,
  register,
  error,
  setValue,
  watch,
  placeholder,
}: {
  name: 'bandwidth' | 'bandwidth_allocated';
  label: string;
  register: UseFormRegister<SystemConnectionFormValues>;
  error?: FieldError;
  setValue: UseFormSetValue<SystemConnectionFormValues>;
  watch: UseFormWatch<SystemConnectionFormValues>;
  placeholder?: string;
}) => {
  const currentValue = watch(name);

  const appendUnit = (unit: string) => {
    const current = currentValue || '';
    const clean = current.replace(/\s*(Kbps|Mbps|Gbps|G|M|K)$/i, '').trim();

    if (clean) {
      setValue(name, `${clean} ${unit}`, { shouldValidate: true, shouldDirty: true });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <Label htmlFor={name}>{label}</Label>
        <div className="flex gap-1">
          {['Kbps', 'Mbps', 'Gbps'].map((unit) => (
            <button
              key={unit}
              type="button"
              onClick={() => appendUnit(unit)}
              className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-600 transition-colors"
              title={`Append ${unit}`}
            >
              {unit}
            </button>
          ))}
        </div>
      </div>
      <Input
        id={name}
        {...register(name)}
        error={typeof error?.message === 'string' ? error.message : undefined}
        placeholder={placeholder}
      />
    </div>
  );
};

export const SystemConnectionFormModal: FC<SystemConnectionFormModalProps> = ({
  isOpen,
  onClose,
  parentSystem = null,
  editingConnection,
  onSubmit,
  isLoading,
}) => {
  const supabase = createClient();
  const isEditMode = !!editingConnection;
  const [activeTab, setActiveTab] = useState('general');
  const [serviceMode, setServiceMode] = useState<'existing' | 'manual'>('existing');
  
  // FIX: Ref to track initialization state
  const hasInitialized = useRef(false);

  const derivedSystemId = parentSystem?.id ?? editingConnection?.system_id ?? null;
  const derivedSystemName = parentSystem?.system_name ?? editingConnection?.system_name ?? 'Unknown System';
  
  // Use derived ID for deps to ensure stability
  const parentSystemId = parentSystem?.id;

  const { data: pristineRecord, isLoading: isLoadingPristine } = useRpcRecord(
    supabase,
    'v_system_connections_complete',
    isEditMode ? editingConnection?.id || null : null,
    { enabled: isOpen && isEditMode }
  );

  const form = useForm<SystemConnectionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      system_id: derivedSystemId ?? '',
      status: true,
      media_type_id: '',
      service_name: '',
      link_type_id: '',
    },
  });

  const {
    control,
    register,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = form;

  const watchLinkTypeId = watch('link_type_id');
  const watchExistingServiceId = watch('existing_service_id');
  const watchSystemId = watch('system_id');
  const watchEnId = watch('en_id');
  const watchWorkingInterface = watch('system_working_interface');
  const watchProtectionInterface = watch('system_protection_interface');
  const watchSnInterface = watch('sn_interface');
  const watchEnInterface = watch('en_interface');
  const watchEnProtectionInterface = watch('en_protection_interface');
  const watchSnId = watch('sn_id');

  const { options: mediaTypeOptions } = useLookupTypeOptions('MEDIA_TYPES');
  const { options: linkTypeOptions } = useLookupTypeOptions('LINK_TYPES');
  const { data: systemsData, isLoading: systemsLoading } = useSystemOptions();

  const { data: servicesResult = { data: [] } } = useTableQuery(supabase, 'v_services', {
    columns:
      'id, name, link_type_id, link_type_name, bandwidth_allocated, vlan, lc_id, unique_id, node_name',
    filters: { status: true },
    orderBy: [{ column: 'name', ascending: true }],
    limit: 2000,
  });

  const servicesData = useMemo(
    () => (servicesResult?.data ? (servicesResult.data as unknown as V_servicesRowSchema[]) : []),
    [servicesResult.data]
  );

  const { data: mainSystemPorts, isLoading: mainPortsLoading } = usePortOptions(
    watchSystemId || null
  );
  const { data: snPorts, isLoading: snPortsLoading } = usePortOptions(watchSnId || null);
  const { data: enPorts, isLoading: enPortsLoading } = usePortOptions(watchEnId || null);

  const mapPortsToOptions = (
    portsData: { port: string | null; port_utilization: boolean | null }[] | undefined,
    currentValue?: string | null,
    excludePort?: string | null
  ) => {
    const options = (portsData || [])
      .filter((p) => p.port)
      .filter((p) => p.port !== excludePort)
      .map((p) => ({
        value: p.port!,
        label: `${p.port} ${p.port_utilization && p.port !== currentValue ? '(In Use)' : ''}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));

    if (currentValue && !options.find((o) => o.value === currentValue)) {
      options.unshift({ value: currentValue, label: `${currentValue} (Current)` });
    }

    return options;
  };

  const getPortTypeDisplay = (
    portInterface: string | null | undefined,
    portsList: typeof mainSystemPorts
  ) => {
    if (!portsList || !portInterface) return '';
    const port = portsList.find((p) => p.port === portInterface);
    if (!port) return 'Unknown';
    return port.port_type_code || port.port_type_name || 'Unknown';
  };

  const systemOptions = useMemo(
    () =>
      (systemsData || []).map((s) => {
        const loc = s.node_name ? ` @ ${s.node_name}` : '';
        const ip = s.ip_address ? ` [${formatIP(s.ip_address)}]` : '';
        const maan_id = s.maan_node_id ? ` (${s.maan_node_id})` : '';
        return { value: s.id!, label: `${s.system_name}${loc}${ip}${maan_id}` };
      }),
    [systemsData]
  );

  const serviceOptions = useMemo(() => {
    let filteredServices = servicesData;

    if (watchLinkTypeId) {
      filteredServices = filteredServices.filter((s) => s.link_type_id === watchLinkTypeId);
    }

    return filteredServices.map((s) => {
      const labelParts = [s.name];
      if (s.link_type_name) labelParts.push(`(${s.link_type_name})`);
      if (s.node_name) labelParts.push(`@ ${s.node_name}`);
      if (s.vlan) labelParts.push(`| VLAN:${s.vlan}`);
      if (s.unique_id) labelParts.push(`| UID:${s.unique_id}`);

      return {
        value: s.id!,
        label: labelParts.join(' '),
      };
    });
  }, [servicesData, watchLinkTypeId]);

  useEffect(() => {
    if (watchWorkingInterface && watchSnId === watchSystemId) {
      setValue('sn_interface', watchWorkingInterface);
    }
  }, [watchWorkingInterface, watchSnId, watchSystemId, setValue]);

  useEffect(() => {
    if (watchSnId && systemsData) {
      const sys = systemsData.find((s) => s.id === watchSnId);
      if (sys && sys.ip_address) setValue('sn_ip', formatIP(sys.ip_address));
      else setValue('sn_ip', '');
    }
  }, [watchSnId, systemsData, setValue]);

  useEffect(() => {
    if (watchEnId && systemsData) {
      const sys = systemsData.find((s) => s.id === watchEnId);
      if (sys && sys.ip_address) setValue('en_ip', formatIP(sys.ip_address));
      else setValue('en_ip', '');
    }
  }, [watchEnId, systemsData, setValue]);

  useEffect(() => {
    if (serviceMode === 'existing' && watchExistingServiceId) {
      const selectedService = servicesData.find((s) => s.id === watchExistingServiceId);
      if (selectedService) {
        setValue('service_name', selectedService.name!);
        if (selectedService.link_type_id) setValue('link_type_id', selectedService.link_type_id);
        if (selectedService.vlan) setValue('vlan', selectedService.vlan);
        if (selectedService.bandwidth_allocated)
          setValue('bandwidth_allocated', selectedService.bandwidth_allocated);
        if (selectedService.lc_id) setValue('lc_id', selectedService.lc_id);
        if (selectedService.unique_id) setValue('unique_id', selectedService.unique_id);
      }
    }
  }, [watchExistingServiceId, serviceMode, servicesData, setValue]);

  useEffect(() => {
    if (serviceMode === 'manual') {
      setValue('existing_service_id', null);
    }
  }, [serviceMode, setValue]);

  const workingPortType = getPortTypeDisplay(watchWorkingInterface, mainSystemPorts);
  const protectionPortType = getPortTypeDisplay(watchProtectionInterface, mainSystemPorts);
  const snPortType = getPortTypeDisplay(watchSnInterface, snPorts);
  const enPortType = getPortTypeDisplay(watchEnInterface, enPorts);
  const enProtectionPortType = getPortTypeDisplay(watchEnProtectionInterface, enPorts);

  // FIX: Reset initialized state when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasInitialized.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && pristineRecord) {
        if (!hasInitialized.current) {
          const extConnection = pristineRecord as ExtendedConnectionRow;
          const safeValue = (val: string | null | undefined) => val ?? '';
          const safeNull = (val: string | null | undefined) => val ?? null;
          const targetSystemId = derivedSystemId ?? extConnection.system_id ?? null;
          const isFlipped = targetSystemId ? extConnection.system_id !== targetSystemId : false;

          const startData = isFlipped
            ? {
                id: extConnection.en_id,
                ip: extConnection.en_ip,
                interface: extConnection.en_interface,
              }
            : {
                id: extConnection.sn_id,
                ip: extConnection.sn_ip,
                interface: extConnection.sn_interface,
              };

          const endData = isFlipped
            ? {
                id: extConnection.system_id,
                ip: extConnection.sn_ip || extConnection.services_ip,
                interface: extConnection.system_working_interface,
                protection_interface: extConnection.system_protection_interface,
              }
            : {
                id: extConnection.en_id,
                ip: extConnection.en_ip,
                interface: extConnection.en_interface,
                protection_interface: extConnection.en_protection_interface,
              };

          setServiceMode(extConnection.service_id ? 'existing' : 'manual');

          reset({
            system_id: targetSystemId ?? '',
            service_name: safeValue(extConnection.service_name ?? extConnection.customer_name),
            link_type_id: safeValue(extConnection.connected_link_type_id),
            vlan: safeValue(extConnection.vlan),
            bandwidth_allocated: safeValue(extConnection.bandwidth_allocated),
            lc_id: safeValue(extConnection.lc_id),
            unique_id: safeValue(extConnection.unique_id),
            existing_service_id: safeNull(extConnection.service_id),
            status: extConnection.status ?? true,
            media_type_id: safeValue(extConnection.media_type_id),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            services_ip: safeValue(String((extConnection as any).services_ip || '')),
            services_interface: safeValue(extConnection.services_interface),
            system_working_interface: safeValue(
              isFlipped ? extConnection.en_interface : extConnection.system_working_interface
            ),
            system_protection_interface: safeNull(
              isFlipped
                ? extConnection.en_protection_interface
                : extConnection.system_protection_interface
            ),
            sn_id: safeNull(startData.id),
            sn_interface: safeNull(startData.interface),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sn_ip: safeNull(formatIP(startData.ip as any)),
            en_id: safeNull(endData.id),
            en_interface: safeNull(endData.interface),
            en_protection_interface: safeNull(endData.protection_interface),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            en_ip: safeNull(formatIP(endData.ip as any)),
            commissioned_on: safeNull(extConnection.commissioned_on),
            remark: safeNull(extConnection.remark),
            bandwidth: safeNull(extConnection.bandwidth),
            stm_no: safeNull(extConnection.sdh_stm_no),
            carrier: safeNull(extConnection.sdh_carrier),
            a_slot: safeNull(extConnection.sdh_a_slot),
            a_customer: safeNull(extConnection.sdh_a_customer),
            b_slot: safeNull(extConnection.sdh_b_slot),
            b_customer: safeNull(extConnection.sdh_b_customer),
          });
          
          hasInitialized.current = true;
          setActiveTab('general');
        }
      } else if (!isEditMode && parentSystem) {
        if (!hasInitialized.current) {
          reset({
            system_id: parentSystem.id!,
            status: true,
            media_type_id: '',
            service_name: '',
            link_type_id: '',
            sn_id: parentSystem.id,
            sn_ip: formatIP(parentSystem.ip_address),
            sn_interface: '',
          });
          setServiceMode('existing');
          
          hasInitialized.current = true;
          setActiveTab('general');
        }
      }
    }
  }, [
    isOpen,
    isEditMode,
    pristineRecord,
    parentSystemId, // Use stable ID
    // parentSystem is used in logic but won't trigger re-render if ID is stable and guarded
    // eslint-disable-next-line react-hooks/exhaustive-deps
    reset,
    derivedSystemId,
  ]);

  const onValidSubmit = (formData: SystemConnectionFormValues) => {
    // Helper to return null if string is empty, else the value
    const nullIfEmpty = (val: string | null | undefined) => (val && val.trim() !== '' ? val : null);

    const payload: UpsertPayload & { p_en_protection_interface?: string | null } = {
      p_id: isEditMode && editingConnection?.id ? editingConnection.id : undefined,
      p_system_id: formData.system_id,
      p_service_name: formData.service_name,
      p_link_type_id: nullIfEmpty(formData.link_type_id) || undefined,
      p_bandwidth_allocated: nullIfEmpty(formData.bandwidth_allocated) || undefined,
      p_vlan: nullIfEmpty(formData.vlan) || undefined,
      p_lc_id: nullIfEmpty(formData.lc_id) || undefined,
      p_unique_id: nullIfEmpty(formData.unique_id) || undefined,
      p_services_ip: nullIfEmpty(formData.services_ip) || undefined,
      p_services_interface: nullIfEmpty(formData.services_interface) || undefined,
      p_media_type_id: formData.media_type_id,
      p_status: formData.status,
      p_bandwidth: nullIfEmpty(formData.bandwidth) || undefined,
      p_commissioned_on: nullIfEmpty(formData.commissioned_on) || undefined,
      p_remark: nullIfEmpty(formData.remark) || undefined,
      p_sn_id: nullIfEmpty(formData.sn_id) || undefined,
      p_en_id: nullIfEmpty(formData.en_id) || undefined,
      p_sn_ip: nullIfEmpty(formData.sn_ip) || undefined,
      p_en_ip: nullIfEmpty(formData.en_ip) || undefined,
      p_sn_interface: nullIfEmpty(formData.sn_interface) || undefined,
      p_en_interface: nullIfEmpty(formData.en_interface) || undefined,
      p_en_protection_interface: nullIfEmpty(formData.en_protection_interface) || undefined,
      p_system_working_interface: nullIfEmpty(formData.system_working_interface) || undefined,
      p_system_protection_interface: nullIfEmpty(formData.system_protection_interface) || undefined,
      p_stm_no: nullIfEmpty(formData.stm_no) || undefined,
      p_carrier: nullIfEmpty(formData.carrier) || undefined,
      p_a_slot: nullIfEmpty(formData.a_slot) || undefined,
      p_a_customer: nullIfEmpty(formData.a_customer) || undefined,
      p_b_slot: nullIfEmpty(formData.b_slot) || undefined,
      p_b_customer: nullIfEmpty(formData.b_customer) || undefined,
      p_service_id: nullIfEmpty(formData.existing_service_id) || undefined,
    };
    onSubmit(payload);
  };

  const effectiveLoading =
    isLoading ||
    (isEditMode && isLoadingPristine) ||
    systemsLoading ||
    mainPortsLoading ||
    snPortsLoading ||
    enPortsLoading;

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      // FIX: Remove "Edit"/"Add" prefix because BaseFormModal adds it automatically
      title="Service Connection"
      size="full"
      isEditMode={isEditMode}
      isLoading={effectiveLoading}
      form={form}
      onSubmit={onValidSubmit}
      subtitle={
        isEditMode && pristineRecord && derivedSystemId && pristineRecord.system_id !== derivedSystemId ? (
          <span className="inline-flex items-center gap-1 text-red-50 bg-red-600 rounded-md px-2 py-1 text-xs font-medium border border-red-500 shadow-xs">
            <span className="shrink-0">⚠️ Editing Physical Source:</span>
            <Link
              href={`/dashboard/systems/${pristineRecord.system_id}`}
              className="underline hover:text-white font-bold truncate max-w-[200px]"
              title={`Go to ${pristineRecord.system_name}`}
              target="_blank"
            >
              {pristineRecord.system_name}
            </Link>
          </span>
        ) : (
          `System: ${derivedSystemName}`
        )
      }
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
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
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
                  {isEditMode && serviceMode === 'manual' && (
                    <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded border border-orange-200">
                      ⚠️ Service unlinked or deleted
                    </span>
                  )}
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
                    <input type="hidden" {...register('service_name')} />
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

              <BandwidthInput
                name="bandwidth_allocated"
                label="Allocated BW"
                register={register}
                error={errors.bandwidth_allocated}
                setValue={setValue}
                watch={watch}
                placeholder="e.g. 100 Mbps"
              />

              <FormInput name="lc_id" label="LC ID" register={register} error={errors.lc_id} />
              <FormInput
                name="unique_id"
                label="Unique ID"
                register={register}
                error={errors.unique_id}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t dark:border-gray-700">
              <FormSearchableSelect
                name="media_type_id"
                label="Media/Port Type"
                control={control}
                options={mediaTypeOptions}
                error={errors.media_type_id}
                required
              />

              <BandwidthInput
                name="bandwidth"
                label="Physical Port Capacity"
                register={register}
                error={errors.bandwidth}
                setValue={setValue}
                watch={watch}
                placeholder="e.g. 10 Gbps"
              />

              <FormDateInput
                name="commissioned_on"
                label="Commissioned On"
                control={control}
                error={errors.commissioned_on}
              />

              <div className="md:col-span-2">
                <FormTextarea
                  name="remark"
                  label="Remarks"
                  control={control}
                  error={errors.remark}
                  placeholder="Add any additional notes about this connection..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 col-span-full md:col-span-1">
                <div className="col-span-2">
                  <FormSearchableSelect
                    name="system_working_interface"
                    label="Working Port *"
                    control={control}
                    options={mapPortsToOptions(
                      mainSystemPorts,
                      pristineRecord?.system_working_interface
                    )}
                    error={errors.system_working_interface}
                    placeholder="Select Working Port"
                    required
                    isLoading={mainPortsLoading}
                  />
                </div>
                <div className="col-span-1">
                  <Label disabled className="mb-1">
                    Type
                  </Label>
                  <Input
                    disabled
                    value={workingPortType}
                    className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 col-span-full md:col-span-1">
                <div className="col-span-2">
                  <FormSearchableSelect
                    name="system_protection_interface"
                    label="Protection Port"
                    control={control}
                    options={mapPortsToOptions(
                      mainSystemPorts,
                      pristineRecord?.system_protection_interface,
                      watchWorkingInterface
                    )}
                    error={errors.system_protection_interface}
                    placeholder="Select Protection Port"
                    clearable
                    isLoading={mainPortsLoading}
                  />
                </div>
                <div className="col-span-1">
                  <Label disabled className="mb-1">
                    Type
                  </Label>
                  <Input
                    disabled
                    value={protectionPortType}
                    className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="connectivity" className="space-y-6">
            <div className="p-4 border rounded dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 mb-6">
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-500">
                Service Endpoint Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  name="services_ip"
                  label="Service IP"
                  register={register}
                  error={errors.services_ip}
                  placeholder="x.x.x.x"
                />
                <FormInput
                  name="services_interface"
                  label="Service Interface / Port"
                  register={register}
                  error={errors.services_interface}
                  placeholder="e.g. Vlan100"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Node Panel */}
              <div className="p-4 border rounded dark:border-gray-700">
                <h3 className="font-semibold mb-3">Start Node (Side A)</h3>
                <FormSearchableSelect
                  name="sn_id"
                  label="Start System"
                  control={control}
                  options={systemOptions}
                  error={errors.sn_id}
                  isLoading={systemsLoading}
                />
                <div className="grid grid-cols-3 gap-3 mt-2">
                  <div className="col-span-2">
                    <FormSearchableSelect
                      name="sn_interface"
                      label="Interface"
                      control={control}
                      options={mapPortsToOptions(snPorts, pristineRecord?.sn_interface)}
                      error={errors.sn_interface}
                      placeholder={watchSnId ? 'Select Start Port' : 'Select System First'}
                      disabled={!watchSnId}
                      isLoading={snPortsLoading}
                    />
                  </div>
                  <div className="col-span-1">
                    <Label disabled className="mb-1">
                      Type
                    </Label>
                    <Input
                      disabled
                      value={snPortType}
                      className="bg-white dark:bg-gray-900 text-gray-500 font-mono text-xs h-[42px]"
                    />
                  </div>
                </div>
                <FormInput
                  name="sn_ip"
                  label="IP Address"
                  register={register}
                  error={errors.sn_ip}
                  className="mt-2"
                />
              </div>

              {/* End Node Panel */}
              <div className="p-4 border rounded dark:border-gray-700">
                <div className="flex justify-between border-b pb-2 dark:border-gray-600 mb-3">
                  <h3 className="font-semibold">End Node (Side B)</h3>
                </div>
                <FormSearchableSelect
                  name="en_id"
                  label="End System (If internal)"
                  control={control}
                  options={systemOptions}
                  error={errors.en_id}
                  isLoading={systemsLoading}
                />

                <div className="grid grid-cols-3 gap-3 mt-2">
                  <div className="col-span-2">
                    {watchEnId ? (
                      <FormSearchableSelect
                        name="en_interface"
                        label="Interface"
                        control={control}
                        options={mapPortsToOptions(enPorts, watchEnInterface)}
                        error={errors.en_interface}
                        placeholder="Select End Port"
                        isLoading={enPortsLoading}
                      />
                    ) : (
                      <FormInput
                        name="en_interface"
                        label="Interface / Port"
                        register={register}
                        placeholder="e.g. Port 1"
                      />
                    )}
                  </div>
                  <div className="col-span-1">
                    <Label disabled className="mb-1">
                      Type
                    </Label>
                    <Input
                      disabled
                      value={enPortType}
                      className="bg-white dark:bg-gray-900 text-gray-500 font-mono text-xs h-[42px]"
                    />
                  </div>
                </div>

                {watchEnId && (
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    <div className="col-span-2">
                      <FormSearchableSelect
                        name="en_protection_interface"
                        label="Protection Interface"
                        control={control}
                        options={mapPortsToOptions(
                          enPorts,
                          watchEnProtectionInterface,
                          watchEnInterface
                        )}
                        error={errors.en_protection_interface}
                        placeholder="Select Protection Port (Opt)"
                        clearable
                        isLoading={enPortsLoading}
                      />
                    </div>
                    <div className="col-span-1">
                      <Label disabled className="mb-1">
                        Type
                      </Label>
                      <Input
                        disabled
                        value={enProtectionPortType}
                        className="bg-white dark:bg-gray-900 text-gray-500 font-mono text-xs h-[42px]"
                      />
                    </div>
                  </div>
                )}

                <FormInput
                  name="en_ip"
                  label="IP Address"
                  register={register}
                  error={errors.en_ip}
                  className="mt-2"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sdh" className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Enter details here if this connection runs over an SDH, DWDM, or Legacy network.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                name="stm_no"
                label="STM Number / Hierarchy"
                register={register}
                error={errors.stm_no}
                placeholder="e.g. STM-16"
              />
              <FormInput
                name="carrier"
                label="Carrier / Operator"
                register={register}
                error={errors.carrier}
              />
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase">Side A Details</h4>
                <FormInput
                  name="a_slot"
                  label="Slot/Port"
                  register={register}
                  error={errors.a_slot}
                />
                <FormInput
                  name="a_customer"
                  label="Customer/Location"
                  register={register}
                  error={errors.a_customer}
                />
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase">Side B Details</h4>
                <FormInput
                  name="b_slot"
                  label="Slot/Port"
                  register={register}
                  error={errors.b_slot}
                />
                <FormInput
                  name="b_customer"
                  label="Customer/Location"
                  register={register}
                  error={errors.b_customer}
                />
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </BaseFormModal>
  );
};