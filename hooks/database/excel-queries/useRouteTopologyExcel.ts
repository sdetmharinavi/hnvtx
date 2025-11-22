// hooks/database/excel-queries/useRouteTopologyExcel.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import * as ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { Database, Json } from '@/types/supabase-types';
import { Cable_segmentsInsertSchema, Fiber_splicesInsertSchema,  Junction_closuresInsertSchema } from '@/schemas/zod-schemas';

interface TopologyData {
  junction_closures: Junction_closuresInsertSchema[];
  cable_segments: Cable_segmentsInsertSchema[];
  fiber_splices: Fiber_splicesInsertSchema[];
}

// Hook for exporting the entire route topology
export function useExportRouteTopology(supabase: SupabaseClient<Database>) {
  return useMutation<void, Error, { routeId: string; routeName: string }>({
    mutationFn: async ({ routeId, routeName }) => {
      // 1. Fetch all topology data from the RPC
      const { data, error } = await supabase.rpc('get_route_topology_for_export', { p_route_id: routeId });
      if (error) throw new Error(`Failed to fetch topology data: ${error.message}`);
      
      const topology = data as unknown as TopologyData;

      // 2. Create a new Excel workbook
      const workbook = new ExcelJS.Workbook();
      
      // 3. Create and populate each sheet
      const jcSheet = workbook.addWorksheet('Junction Closures');
      // THE FIX: Changed header and key from 'jc_id' to 'id'.
      jcSheet.columns = [
        { header: 'id', key: 'id', width: 38 },
        { header: 'node_id', key: 'node_id', width: 38 },
        { header: 'node_name', key: 'node_name', width: 30 },
        { header: 'position_km', key: 'position_km', width: 15 },
      ];
      jcSheet.addRows(topology.junction_closures);

      const segmentsSheet = workbook.addWorksheet('Cable Segments');
      segmentsSheet.columns = [
        { header: 'id', key: 'id', width: 38 },
        { header: 'segment_order', key: 'segment_order', width: 15 },
        { header: 'start_node_id', key: 'start_node_id', width: 38 },
        { header: 'end_node_id', key: 'end_node_id', width: 38 },
        { header: 'start_node_type', key: 'start_node_type', width: 15 },
        { header: 'end_node_type', key: 'end_node_type', width: 15 },
        { header: 'distance_km', key: 'distance_km', width: 15 },
        { header: 'fiber_count', key: 'fiber_count', width: 15 },
      ];
      segmentsSheet.addRows(topology.cable_segments);

      const splicesSheet = workbook.addWorksheet('Fiber Splices');
      splicesSheet.columns = [
        { header: 'id', key: 'id', width: 38 },
        { header: 'jc_id', key: 'jc_id', width: 38 },
        { header: 'incoming_segment_id', key: 'incoming_segment_id', width: 38 },
        { header: 'incoming_fiber_no', key: 'incoming_fiber_no', width: 15 },
        { header: 'outgoing_segment_id', key: 'outgoing_segment_id', width: 38 },
        { header: 'outgoing_fiber_no', key: 'outgoing_fiber_no', width: 15 },
        { header: 'splice_type_id', key: 'splice_type_id', width: 38 },
        { header: 'loss_db', key: 'loss_db', width: 10 },
      ];
      splicesSheet.addRows(topology.fiber_splices);

      // 4. Generate and download the file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `topology_${routeName}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
    },
    onSuccess: () => toast.success('Route topology exported successfully!'),
    onError: (err) => toast.error(`Export failed: ${err.message}`),
  });
}

// Hook for importing the entire route topology
export function useImportRouteTopology(supabase: SupabaseClient<Database>) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { routeId: string; file: File }>({
    mutationFn: async ({ routeId, file }) => {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      
      const getSheetData = (sheetName: string): Json => {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) throw new Error(`Sheet "${sheetName}" not found in the Excel file.`);
        return XLSX.utils.sheet_to_json(worksheet, { defval: null }) as Json;
      };
      
      const payload = {
        p_route_id: routeId,
        p_junction_closures: getSheetData('Junction Closures'),
        p_cable_segments: getSheetData('Cable Segments'),
        p_fiber_splices: getSheetData('Fiber Splices'),
      };

      const { error } = await supabase.rpc('upsert_route_topology_from_excel', payload);
      if (error) throw error;
    },
    onSuccess: (_, { routeId }) => {
      toast.success('Route topology imported successfully! Refreshing data...');
      queryClient.invalidateQueries({ queryKey: ['route-details', routeId] });
    },
    onError: (err) => toast.error(`Import failed: ${err.message}`),
  });
}