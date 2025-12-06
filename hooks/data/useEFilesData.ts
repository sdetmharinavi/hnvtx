"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { 
  InitiateFilePayload, 
  ForwardFilePayload,
  v_e_files_extendedRowSchema,
  v_file_movements_extendedRowSchema
} from "@/schemas/efile-schemas";
import { z } from "zod";
import { useTableQuery } from "@/hooks/database";

const supabase = createClient();

// --- TYPES ---
export interface UpdateFilePayload {
  file_id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
}

// List Hook
export function useEFiles(filters?: { status?: string; }) {
  return useQuery({
    queryKey: ['e-files', filters],
    queryFn: async () => {
      const rpcFilters: Record<string, unknown> = {};
      if (filters?.status) rpcFilters.status = filters.status;

      const { data, error } = await supabase.rpc('get_paged_data', {
        p_view_name: 'v_e_files_extended',
        p_limit: 2000, // Increased limit for better list view
        p_offset: 0,
        p_filters: rpcFilters,
        p_order_by: 'updated_at',
        p_order_dir: 'desc'
      });

      if (error) throw error;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = (data as any)?.data || [];
      
      const safeParse = z.array(v_e_files_extendedRowSchema).safeParse(rows);
      if (!safeParse.success) {
          console.error("E-File schema mismatch", safeParse.error);
          return rows as z.infer<typeof v_e_files_extendedRowSchema>[];
      }
      return safeParse.data;
    }
  });
}

// Details Hook
export function useEFileDetails(fileId: string) {
  return useQuery({
    queryKey: ['e-file-details', fileId],
    queryFn: async () => {
      const { data: fileResult, error: fileError } = await supabase.rpc('get_paged_data', {
        p_view_name: 'v_e_files_extended',
        p_filters: { id: fileId },
        p_limit: 1,
        p_offset: 0
      });

      if (fileError) throw fileError;

      const { data: historyResult, error: historyError } = await supabase.rpc('get_paged_data', {
        p_view_name: 'v_file_movements_extended',
        p_filters: { file_id: fileId },
        p_limit: 100,
        p_offset: 0,
        p_order_by: 'created_at',
        p_order_dir: 'desc'
      });

      if (historyError) throw historyError;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fileRow = (fileResult as any)?.data?.[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const historyRows = (historyResult as any)?.data || [];

      if (!fileRow) {
        throw new Error("File not found");
      }

      return {
        file: v_e_files_extendedRowSchema.parse(fileRow),
        history: z.array(v_file_movements_extendedRowSchema).parse(historyRows)
      };
    }
  });
}

// --- MUTATIONS ---

export function useInitiateFile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: InitiateFilePayload) => {
      const { data, error } = await supabase.rpc('initiate_e_file', {
        p_file_number: payload.file_number,
        p_subject: payload.subject,
        p_description: payload.description || '',
        p_category: payload.category,
        p_priority: payload.priority,
        p_remarks: payload.remarks || 'File initiated',
        p_initiator_employee_id: payload.initiator_employee_id
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("E-File initiated successfully!");
      queryClient.invalidateQueries({ queryKey: ['e-files'] });
    },
    onError: (err) => toast.error(`Failed: ${err.message}`)
  });
}

export function useUpdateFileDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateFilePayload) => {
      const { error } = await supabase.rpc('update_e_file_details', {
        p_file_id: payload.file_id,
        p_subject: payload.subject,
        p_description: payload.description,
        p_category: payload.category,
        p_priority: payload.priority,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success("File details updated!");
      queryClient.invalidateQueries({ queryKey: ['e-files'] });
      queryClient.invalidateQueries({ queryKey: ['e-file-details', vars.file_id] });
    },
    onError: (err) => toast.error(`Update failed: ${err.message}`)
  });
}

export function useForwardFile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: ForwardFilePayload) => {
      const { error } = await supabase.rpc('forward_e_file', {
        p_file_id: payload.file_id,
        p_to_employee_id: payload.to_employee_id,
        p_remarks: payload.remarks,
        p_action_type: payload.action_type
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(`File ${vars.action_type} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['e-files'] });
      queryClient.invalidateQueries({ queryKey: ['e-file-details', vars.file_id] });
    },
    onError: (err) => toast.error(`Failed: ${err.message}`)
  });
}

export function useCloseFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileId, remarks }: { fileId: string; remarks: string }) => {
      const { error } = await supabase.rpc('close_e_file', {
        p_file_id: fileId,
        p_remarks: remarks
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success("File closed successfully!");
      queryClient.invalidateQueries({ queryKey: ['e-files'] });
      queryClient.invalidateQueries({ queryKey: ['e-file-details', vars.fileId] });
    },
    onError: (err) => toast.error(`Failed: ${err.message}`)
  });
}

// THE FIX: Use RPC for deletion to bypass RLS/Table permission issues
export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileId: string) => {
      const { error } = await supabase.rpc('delete_e_file_record', { p_file_id: fileId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("File deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['e-files'] });
    },
    onError: (err) => toast.error(`Failed to delete file: ${err.message}`)
  });
}

// Helper hook for dropdowns
export function useEmployeeOptions() {
  const supabase = createClient();
  return useTableQuery(supabase, 'v_employees', {
    columns: 'id, employee_name, employee_designation_name, maintenance_area_name',
    filters: { status: true },
    orderBy: [{ column: 'employee_name', ascending: true }],
    limit: 1000
  });
}