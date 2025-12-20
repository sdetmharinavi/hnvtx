// path: components/ofc-details/FiberAssignmentModal.tsx
"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/common/ui/Modal";
import { FormCard, FormSearchableSelect } from "@/components/common/form";
import { V_ofc_connections_completeRowSchema, V_system_connections_completeRowSchema } from "@/schemas/zod-schemas";
import { useAssignFiberToConnection } from "@/hooks/database/fiber-assignment-hooks";
import { createClient } from "@/utils/supabase/client";
import { useMemo } from "react";
import { ArrowRight, GitMerge, Radio } from "lucide-react";
// THE FIX: Import offline query hooks and local DB
import { useOfflineQuery } from "@/hooks/data/useOfflineQuery";
import { localDb } from "@/hooks/data/localDb";

interface FiberAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  fiber: V_ofc_connections_completeRowSchema | null;
}

const formSchema = z.object({
  connection_id: z.string().min(1, "Service selection is required"),
  role: z.enum(['working', 'protection']),
  direction: z.enum(['tx', 'rx']),
});

type FormValues = z.infer<typeof formSchema>;

export const FiberAssignmentModal: React.FC<FiberAssignmentModalProps> = ({
  isOpen,
  onClose,
  fiber,
}) => {
  const supabase = createClient();
  const { mutate: assignFiber, isPending } = useAssignFiberToConnection();

  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: 'working',
      direction: 'tx'
    }
  });

  // THE FIX: Use useOfflineQuery instead of useTableQuery.
  // This fetches from IndexedDB first (fast), then Supabase (fresh).
  const { data: connectionsData, isLoading: isLoadingConnections } = useOfflineQuery<V_system_connections_completeRowSchema[]>(
    ['active-system-connections-list'],
    // Online Fetcher
    async () => {
      const { data, error } = await supabase
        .from('v_system_connections_complete')
        .select('id, service_name, system_name, connected_system_name, link_type_name, status')
        .eq('status', true)
        .order('service_name', { ascending: true })
        .limit(2000); // Reasonable limit for dropdowns
      
      if (error) throw error;
      return data || [];
    },
    // Offline Fetcher (Dexie)
    async () => {
      return await localDb.v_system_connections_complete
        .filter(c => c.status === true)
        .toArray();
    }
  );

  const connectionOptions = useMemo(() => {
    return (connectionsData || []).map(conn => ({
      value: conn.id!,
      // Display: Service Name (or System A -> System B fallback)
      label: conn.service_name 
        ? `${conn.service_name} (${conn.system_name || '?'})`
        : `${conn.system_name || '?'} → ${conn.connected_system_name || '?'}`
    }));
  }, [connectionsData]);

  const onSubmit = (data: FormValues) => {
    if (!fiber?.id) return;

    assignFiber({
      fiber_id: fiber.id,
      connection_id: data.connection_id,
      role: data.role,
      direction: data.direction
    }, {
      onSuccess: () => {
        reset();
        onClose();
      }
    });
  };

  // Watch values for UI logic if needed
  // const currentRole = watch('role');

  if (!fiber) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Fiber #${fiber.fiber_no_sn}`} size="md">
      <FormCard
        title="Link to Service"
        subtitle={`Assign Fiber ${fiber.fiber_no_sn} to a System Connection`}
        onSubmit={handleSubmit(onSubmit)}
        onCancel={onClose}
        isLoading={isPending}
        submitText="Link Fiber"
        standalone={false} // Embedded in Modal
      >
        <div className="space-y-6">
          
          {/* Connection Selection */}
          <FormSearchableSelect 
             name="connection_id"
             label="Select Service / Circuit"
             control={control}
             options={connectionOptions}
             placeholder={isLoadingConnections ? "Loading services..." : "Search by Service Name or System..."}
             error={errors.connection_id}
             isLoading={isLoadingConnections}
             className="z-50" // Ensure dropdown renders above other elements if needed
          />

          {/* Configuration Grid */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            
            {/* Role Selection */}
            <div className="space-y-3">
               <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Path Role</label>
               <Controller
                 name="role"
                 control={control}
                 render={({ field }) => (
                   <div className="flex flex-col gap-2">
                     <button
                        type="button"
                        onClick={() => field.onChange('working')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm border transition-all ${
                          field.value === 'working' 
                            ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' 
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400'
                        }`}
                     >
                       <GitMerge className="w-4 h-4" /> Working
                     </button>
                     <button
                        type="button"
                        onClick={() => field.onChange('protection')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm border transition-all ${
                          field.value === 'protection' 
                            ? 'bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200' 
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400'
                        }`}
                     >
                       <Radio className="w-4 h-4" /> Protection
                     </button>
                   </div>
                 )}
               />
            </div>

            {/* Direction Selection */}
            <div className="space-y-3">
               <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Direction</label>
               <Controller
                 name="direction"
                 control={control}
                 render={({ field }) => (
                   <div className="flex flex-col gap-2">
                     <button
                        type="button"
                        onClick={() => field.onChange('tx')}
                        className={`flex items-center justify-between px-3 py-2 rounded-md text-sm border transition-all ${
                          field.value === 'tx' 
                            ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/40 dark:text-green-200' 
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400'
                        }`}
                     >
                       <span>Tx (Transmit)</span>
                       <ArrowRight className="w-3 h-3" />
                     </button>
                     <button
                        type="button"
                        onClick={() => field.onChange('rx')}
                        className={`flex items-center justify-between px-3 py-2 rounded-md text-sm border transition-all ${
                          field.value === 'rx' 
                            ? 'bg-orange-100 border-orange-500 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200' 
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400'
                        }`}
                     >
                        <span>Rx (Receive)</span>
                        <ArrowRight className="w-3 h-3 rotate-180" />
                     </button>
                   </div>
                 )}
               />
            </div>

          </div>
        </div>
      </FormCard>
    </Modal>
  );
};