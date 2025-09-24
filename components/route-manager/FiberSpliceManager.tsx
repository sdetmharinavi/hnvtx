// components/ofc/FiberSpliceManager.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/common/ui';
import { Card, CardHeader, CardBody } from '@/components/common/ui';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { useCableSegmentation } from '@/hooks/ofc/useCableSegmentation';
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle,
  Clock,
  Info,
  Loader2,
  RefreshCw,
  Split,
} from 'lucide-react';

interface FiberSplice {
  id: string;
  jc_id: string;
  incoming_cable_id: string;
  incoming_fiber_no: number;
  outgoing_cable_id: string | null;
  outgoing_fiber_no: number | null;
  splice_type: 'pass_through' | 'branch' | 'termination';
  status: 'active' | 'faulty' | 'reserved';
  logical_path_id?: string | null;
  loss_db?: number | null;
  otdr_length_km?: number | null;
  created_at?: string;
  updated_at?: string;
}

interface SpliceConfiguration {
  incoming_fiber_no: number;
  outgoing_fiber_no: number;
  splice_type: 'straight' | 'cross';
  outgoing_cable_id?: string | null;
}

interface FiberSpliceManagerProps {
  junctionClosureId: string;
  junctionClosureName: string;
  onSpliceComplete?: () => void;
  capacity?: number;
}

export const FiberSpliceManager = ({
  junctionClosureId,
  junctionClosureName,
  onSpliceComplete,
  capacity,
}: FiberSpliceManagerProps) => {
  const [fiberSplices, setFiberSplices] = useState<FiberSplice[]>([]);
  const [spliceConfigurations, setSpliceConfigurations] = useState<SpliceConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cableOptions, setCableOptions] = useState<
    { id: string; label: string; capacity: number | null }[]
  >([]);
  const [incomingCableId, setIncomingCableId] = useState<string>('');

  const supabase = createClient();
  const { updateFiberConnections } = useCableSegmentation();

  // Segment-based selection
  interface SegmentOption {
    id: string;
    label: string;
    fiber_count: number;
    original_cable_id: string;
    segment_order: number;
  }
  const [segmentOptions, setSegmentOptions] = useState<SegmentOption[]>([]);
  const [incomingSegmentId, setIncomingSegmentId] = useState<string>('');
  const [outgoingSegmentId, setOutgoingSegmentId] = useState<string>('');

  const loadFiberSplices = useCallback(async () => {
    // Don't load if no junction closure is selected
    if (!junctionClosureId || junctionClosureId === '') {
      setFiberSplices([]);
      return;
    }

    try {
      // Step 1: Find the node_id of the selected JC
      const { data: jcRow, error: jcFetchError } = await supabase
        .from('junction_closures')
        .select('node_id')
        .eq('id', junctionClosureId)
        .maybeSingle();

      if (jcFetchError) throw jcFetchError;

      // If we cannot find the node_id, fallback to the original single-JC behavior
      if (!jcRow?.node_id) {
        const { data, error: spliceError } = await supabase
          .from('fiber_splices')
          .select('*')
          .eq('jc_id', junctionClosureId)
          .order('incoming_fiber_no');

        if (spliceError) throw spliceError;
        setFiberSplices(data || []);
        return;
      }
      // Step 2: Get all JC IDs that share this node_id (i.e., the same physical JC across cables)
      const { data: relatedJcs, error: relatedJcsError } = await supabase
        .from('junction_closures')
        .select('id, ofc_cable_id')
        .eq('node_id', jcRow.node_id);

      if (relatedJcsError) throw relatedJcsError;

      const jcIds = (relatedJcs || []).map((r) => r.id).filter(Boolean);
      const jcCableIds = Array.from(
        new Set((relatedJcs || []).map((r) => r.ofc_cable_id).filter(Boolean) as string[])
      );

      // Safety: if for some reason we didn't get a list, fallback to current JC only
      const targetJcIds = jcIds.length > 0 ? jcIds : [junctionClosureId];

      // Step 3: Fetch all fiber_splices for any of those JC IDs
      const { data, error: spliceError } = await supabase
        .from('fiber_splices')
        .select('*')
        .in('jc_id', targetJcIds)
        .order('incoming_fiber_no');

      if (spliceError) throw spliceError;
      setFiberSplices(data || []);
      // Discover connected segments via JC view (jc_id column is node_id)
      type SegRow = {
        id: string;
        original_cable_id: string;
        segment_order: number;
        fiber_count: number;
        jc_id: string;
      };
      const { data: segView, error: segViewErr } = await supabase
        .from('v_cable_segments_at_jc')
        .select('id, original_cable_id, segment_order, fiber_count, jc_id')
        .eq('jc_id', jcRow.node_id);
      if (segViewErr) throw segViewErr;
      const segs: SegRow[] = (segView as SegRow[] | null) || [];
      // Deduplicate segments that appear for multiple JC ids (e.g., both endpoints included)
      const segsUnique: SegRow[] = Array.from(new Map(segs.map((s) => [s.id, s])).values());
      const cableIds = Array.from(
        new Set(
          segsUnique.map((s) => s.original_cable_id).filter((id): id is string => Boolean(id))
        )
      );
      // Ensure we include cables directly on the JC rows as well
      for (const id of jcCableIds) {
        if (!cableIds.includes(id)) cableIds.push(id);
      }

      let options: { id: string; label: string; capacity: number | null }[] = cableIds.map(
        (id) => ({ id, label: id, capacity: null })
      );
      if (cableIds.length > 0) {
        const { data: cables, error: cablesErr } = await supabase
          .from('ofc_cables')
          .select('id, route_name, capacity')
          .in('id', cableIds);
        if (!cablesErr && cables) {
          const m = new Map(
            (cables as { id: string; route_name: string | null; capacity: number | null }[]).map(
              (c) => [c.id, { name: c.route_name || c.id, capacity: c.capacity ?? null }]
            )
          );
          options = cableIds.map((id) => {
            const info = m.get(id);
            const base = info?.name || id;
            const cap = info?.capacity ?? null;
            return { id, label: cap ? `${base} (${cap}F)` : base, capacity: cap };
          });
        }
      }
      setCableOptions(options);
      // Build segment options with cable label
      const labelMap = new Map(options.map((o) => [o.id, o.label]));
      const segOpts: SegmentOption[] = segsUnique.map((s) => ({
        id: s.id,
        label: `${labelMap.get(s.original_cable_id) || s.original_cable_id} • Seg ${
          s.segment_order
        }`,
        fiber_count: s.fiber_count || 0,
        original_cable_id: s.original_cable_id,
        segment_order: s.segment_order || 0,
      }));
      setSegmentOptions(segOpts);
      const existingIncoming = (data || []).find((s) => s.incoming_cable_id)?.incoming_cable_id as
        | string
        | undefined;
      setIncomingCableId(existingIncoming || options[0]?.id || '');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error(`Failed to load fiber splices: ${message}`);
    }
  }, [junctionClosureId, supabase]);

  // Set sensible defaults for segments after options load
  useEffect(() => {
    if (segmentOptions.length === 0) return;
    if (!incomingSegmentId && segmentOptions[0]?.id) {
      setIncomingSegmentId(segmentOptions[0].id);
    }
    if (!outgoingSegmentId && (segmentOptions[1]?.id || segmentOptions[0]?.id)) {
      setOutgoingSegmentId(segmentOptions[1]?.id || segmentOptions[0]!.id);
    }
  }, [segmentOptions, incomingSegmentId, outgoingSegmentId]);

  useEffect(() => {
    loadFiberSplices();
  }, [loadFiberSplices]);

  const handleSpliceTypeChange = (fiberNo: number, spliceType: 'straight' | 'cross') => {
    setSpliceConfigurations((prev) => {
      const existing = prev.find((s) => s.incoming_fiber_no === fiberNo);
      if (existing) {
        return prev.map((s) =>
          s.incoming_fiber_no === fiberNo ? { ...s, splice_type: spliceType } : s
        );
      } else {
        return [
          ...prev,
          {
            incoming_fiber_no: fiberNo,
            outgoing_fiber_no: spliceType === 'straight' ? fiberNo : fiberNo, // Will be updated by user
            splice_type: spliceType,
          },
        ];
      }
    });
  };

  const handleOutgoingCableChange = (fiberNo: number, outgoingCableId: string) => {
    setSpliceConfigurations((prev) => {
      const existing = prev.find((s) => s.incoming_fiber_no === fiberNo);
      if (existing) {
        return prev.map((s) =>
          s.incoming_fiber_no === fiberNo ? { ...s, outgoing_cable_id: outgoingCableId } : s
        );
      }
      return [
        ...prev,
        {
          incoming_fiber_no: fiberNo,
          outgoing_fiber_no: fiberNo,
          splice_type: 'straight',
          outgoing_cable_id: outgoingCableId,
        },
      ];
    });
  };

  const handleOutgoingFiberChange = (
    fiberNo: number,
    outgoingFiberNo: number,
    currentOutgoingCableId: string
  ) => {
    // Determine if segment-based splicing is active (both segments selected)
    const selectedOutgoingSegment = segmentOptions.find((s) => s.id === outgoingSegmentId) || null;

    // Capacity clamp: prefer segment fiber_count if segment mode, else fall back to cable capacity
    let safeMax = maxFibers;
    if (selectedOutgoingSegment) {
      safeMax = Math.max(1, Number(selectedOutgoingSegment.fiber_count) || maxFibers);
    } else {
      const capMap = new Map(cableOptions.map((o) => [o.id, o.capacity]));
      const cap = capMap.get(currentOutgoingCableId) || null;
      safeMax = cap && cap > 0 ? cap : maxFibers;
    }
    const clamped = Math.max(1, Math.min(outgoingFiberNo, safeMax));

    // Uniqueness: if segment mode, only ensure uniqueness within the selected outgoing segment
    if (selectedOutgoingSegment) {
      const takenNumbers = new Set<number>(
        spliceConfigurations
          .filter((sc) => sc.incoming_fiber_no !== fiberNo && sc.outgoing_fiber_no != null)
          .map((sc) => Number(sc.outgoing_fiber_no))
      );
      if (takenNumbers.has(clamped)) {
        toast.error('This outgoing fiber number is already selected in the outgoing segment');
        return;
      }
    } else {
      // Legacy cable-based uniqueness check when not in segment mode
      const takenKeys = new Set([
        // Existing persisted splices at this JC (by outgoing cable id + fiber no)
        ...fiberSplices
          .filter((s) => s.outgoing_cable_id && s.outgoing_fiber_no != null)
          .map((s) => `${s.outgoing_cable_id}:${s.outgoing_fiber_no}`),
        // Also consider current, unsaved selections in this UI session
        ...spliceConfigurations
          .filter((sc) => sc.outgoing_fiber_no != null && Boolean(sc.outgoing_cable_id))
          .map((sc) => `${sc.outgoing_cable_id}:${sc.outgoing_fiber_no}`),
      ]);
      const candidateKey = `${currentOutgoingCableId}:${clamped}`;
      if (takenKeys.has(candidateKey)) {
        toast.error('This outgoing fiber is already mapped at this JC');
        return;
      }
    }

    setSpliceConfigurations((prev) =>
      prev.map((s) => (s.incoming_fiber_no === fiberNo ? { ...s, outgoing_fiber_no: clamped } : s))
    );
  };

  const applySpliceConfiguration = async () => {
    if (spliceConfigurations.length === 0) {
      toast.error('No splice configurations to apply');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (incomingSegmentId && outgoingSegmentId) {
        const rpcPayload = spliceConfigurations.map((sc) => ({
          incoming_fiber_no: sc.incoming_fiber_no,
          outgoing_fiber_no: sc.outgoing_fiber_no,
          splice_type: sc.splice_type,
        }));
        await updateFiberConnections(
          junctionClosureId,
          incomingSegmentId,
          outgoingSegmentId,
          rpcPayload
        );
        toast.success('Splice configuration applied successfully');
        await loadFiberSplices();
        onSpliceComplete?.();
        return;
      }
      // Update fiber splices in database
      for (const config of spliceConfigurations) {
        const existingSplice = fiberSplices.find(
          (s) =>
            s.incoming_fiber_no === config.incoming_fiber_no &&
            (!incomingCableId || s.incoming_cable_id === incomingCableId)
        );

        if (existingSplice) {
          const { error: updateError } = await supabase
            .from('fiber_splices')
            .update({
              outgoing_fiber_no: config.outgoing_fiber_no,
              splice_type: config.splice_type === 'straight' ? 'pass_through' : 'branch',
              outgoing_cable_id: config.outgoing_cable_id ?? existingSplice.outgoing_cable_id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingSplice.id);

          if (updateError) throw updateError;
        } else {
          // Create new splice if it doesn't exist
          const { error: insertError } = await supabase.from('fiber_splices').insert({
            jc_id: junctionClosureId,
            incoming_cable_id: incomingCableId || fiberSplices[0]?.incoming_cable_id || '',
            incoming_fiber_no: config.incoming_fiber_no,
            outgoing_cable_id:
              config.outgoing_cable_id ?? (fiberSplices[0]?.outgoing_cable_id || null),
            outgoing_fiber_no: config.outgoing_fiber_no,
            splice_type: config.splice_type === 'straight' ? 'pass_through' : 'branch',
            status: 'active',
          });

          if (insertError) throw insertError;
        }
      }

      toast.success('Splice configuration applied successfully');
      await loadFiberSplices();
      onSpliceComplete?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error(`Failed to apply splice configuration: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getMaxFiberCount = () => {
    const maxIncoming = Math.max(...fiberSplices.map((s) => s.incoming_fiber_no), 0);
    const maxOutgoing = Math.max(...fiberSplices.map((s) => s.outgoing_fiber_no || 0), 0);
    return Math.max(maxIncoming, maxOutgoing, 2); // Minimum 2 fibers
  };

  const incomingSeg = segmentOptions.find((s) => s.id === incomingSegmentId);
  const outgoingSeg = segmentOptions.find((s) => s.id === outgoingSegmentId);
  const segmentBasedMax =
    incomingSeg && outgoingSeg ? Math.min(incomingSeg.fiber_count, outgoingSeg.fiber_count) : null;
  const maxFibers =
    segmentBasedMax && segmentBasedMax > 0
      ? segmentBasedMax
      : capacity && capacity > 0
      ? capacity
      : getMaxFiberCount();

  // Don't render if no junction closure is selected
  if (!junctionClosureId || junctionClosureId === '') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Fiber Splice Configuration</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please select a junction closure first
            </p>
          </CardHeader>
          <CardBody>
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Click on a junction closure (JC) in the Route Visualizer tab to manage its fiber
                splices.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="pb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Split className="w-5 h-5 text-blue-500" />
            Fiber Splice Configuration
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Junction Closure:{' '}
            <span className="font-medium text-gray-900 dark:text-white">{junctionClosureName}</span>
          </p>
        </CardHeader>

        <CardBody className="pt-4">
          <div className="space-y-6">
            {/* Segment Info */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                Segments at JC: {segmentOptions.length}
              </span>
            </div>

            {/* Segment Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <ArrowDownCircle className="w-4 h-4 text-green-500" />
                  Incoming Segment
                </label>
                <select
                  value={incomingSegmentId}
                  onChange={(e) => setIncomingSegmentId(e.target.value)}
                  disabled={segmentOptions.length === 0}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="" disabled className="text-gray-500">
                    {segmentOptions.length ? 'Select segment' : 'No segments found at this JC'}
                  </option>
                  {segmentOptions.map((opt) => (
                    <option key={opt.id} value={opt.id} className="text-gray-900 dark:text-white">
                      {opt.label} • {opt.fiber_count}F
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <ArrowUpCircle className="w-4 h-4 text-blue-500" />
                  Outgoing Segment
                </label>
                <select
                  value={outgoingSegmentId}
                  onChange={(e) => setOutgoingSegmentId(e.target.value)}
                  disabled={segmentOptions.length === 0}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="" disabled className="text-gray-500">
                    {segmentOptions.length ? 'Select segment' : 'No segments found at this JC'}
                  </option>
                  {segmentOptions.map((opt) => (
                    <option key={opt.id} value={opt.id} className="text-gray-900 dark:text-white">
                      {opt.label} • {opt.fiber_count}F
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end">
              <Button
                onClick={() => loadFiberSplices()}
                disabled={isLoading}
                className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Reloading…' : 'Reload Segments'}
              </Button>
            </div>

            {/* Cable Selection (Fallback) */}
            {segmentOptions.length === 0 && cableOptions.length > 0 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Incoming Cable (Fallback)
                  </label>
                  <select
                    value={incomingCableId}
                    onChange={(e) => setIncomingCableId(e.target.value)}
                    className="w-full p-3 border border-amber-300 dark:border-amber-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  >
                    {cableOptions.map((opt) => (
                      <option key={opt.id} value={opt.id} className="text-gray-900 dark:text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Splice Configuration Table */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Fiber #
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Splice Type
                      </th>
                      {segmentOptions.length === 0 && (
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Outgoing Cable
                        </th>
                      )}
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Outgoing Fiber
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {Array.from({ length: maxFibers }, (_, i) => i + 1).map((fiberNo) => {
                      const splice = fiberSplices.find(
                        (s) =>
                          s.incoming_fiber_no === fiberNo &&
                          (!incomingCableId || s.incoming_cable_id === incomingCableId)
                      );
                      const config = spliceConfigurations.find(
                        (s) => s.incoming_fiber_no === fiberNo
                      );
                      const nonIncoming = cableOptions.filter((opt) => opt.id !== incomingCableId);
                      const outgoingOptions = nonIncoming.length > 0 ? nonIncoming : cableOptions;
                      const defaultOutgoingCable = outgoingOptions[0]?.id || incomingCableId || '';
                      const currentOutgoingCable = (config?.outgoing_cable_id ??
                        splice?.outgoing_cable_id ??
                        defaultOutgoingCable) as string;

                      return (
                        <tr
                          key={fiberNo}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                              {fiberNo}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={
                                config?.splice_type ||
                                (splice?.splice_type === 'pass_through'
                                  ? 'straight'
                                  : splice?.splice_type === 'branch'
                                  ? 'cross'
                                  : 'straight')
                              }
                              onChange={(e) =>
                                handleSpliceTypeChange(
                                  fiberNo,
                                  e.target.value as 'straight' | 'cross'
                                )
                              }
                              className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            >
                              <option value="straight" className="text-gray-900 dark:text-white">
                                Straight
                              </option>
                              <option value="cross" className="text-gray-900 dark:text-white">
                                Cross
                              </option>
                            </select>
                          </td>
                          {segmentOptions.length === 0 && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={currentOutgoingCable}
                                onChange={(e) => handleOutgoingCableChange(fiberNo, e.target.value)}
                                className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-w-[120px]"
                              >
                                {outgoingOptions.map((opt) => (
                                  <option
                                    key={opt.id}
                                    value={opt.id}
                                    className="text-gray-900 dark:text-white"
                                  >
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              min="1"
                              max={maxFibers}
                              value={
                                config?.outgoing_fiber_no || splice?.outgoing_fiber_no || fiberNo
                              }
                              onChange={(e) =>
                                handleOutgoingFiberChange(
                                  fiberNo,
                                  parseInt(e.target.value) || fiberNo,
                                  currentOutgoingCable
                                )
                              }
                              className="w-20 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-2 text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                splice?.status === 'active'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {splice?.status === 'active' ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : (
                                <Clock className="w-3 h-3 mr-1" />
                              )}
                              {splice?.status || 'Not Set'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Apply Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={applySpliceConfiguration}
                disabled={isLoading || spliceConfigurations.length === 0}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {isLoading ? 'Applying...' : 'Apply Splice Configuration'}
              </Button>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <p className="text-red-800 dark:text-red-300 font-medium">Error</p>
                </div>
                <p className="text-red-700 dark:text-red-400 mt-1 text-sm">{error}</p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
