// components/ofc/FiberSpliceManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/common/ui';
import { Card, CardHeader, CardBody } from '@/components/common/ui';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

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
}

interface FiberSpliceManagerProps {
  junctionClosureId: string;
  junctionClosureName: string;
  onSpliceComplete?: () => void;
}

export const FiberSpliceManager = ({
  junctionClosureId,
  junctionClosureName,
  onSpliceComplete
}: FiberSpliceManagerProps) => {
  const [fiberSplices, setFiberSplices] = useState<FiberSplice[]>([]);
  const [spliceConfigurations, setSpliceConfigurations] = useState<SpliceConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadFiberSplices();
  }, [junctionClosureId]);

  const loadFiberSplices = async () => {
    // Don't load if no junction closure is selected
    if (!junctionClosureId || junctionClosureId === '') {
      setFiberSplices([]);
      return;
    }

    try {
      const { data, error: spliceError } = await supabase
        .from('fiber_splices')
        .select('*')
        .eq('jc_id', junctionClosureId)
        .order('incoming_fiber_no');

      if (spliceError) throw spliceError;
      setFiberSplices(data || []);
    } catch (err: any) {
      setError(err.message);
      toast.error(`Failed to load fiber splices: ${err.message}`);
    }
  };

  const handleSpliceTypeChange = (fiberNo: number, spliceType: 'straight' | 'cross') => {
    setSpliceConfigurations(prev => {
      const existing = prev.find(s => s.incoming_fiber_no === fiberNo);
      if (existing) {
        return prev.map(s =>
          s.incoming_fiber_no === fiberNo
            ? { ...s, splice_type: spliceType }
            : s
        );
      } else {
        return [...prev, {
          incoming_fiber_no: fiberNo,
          outgoing_fiber_no: spliceType === 'straight' ? fiberNo : fiberNo, // Will be updated by user
          splice_type: spliceType
        }];
      }
    });
  };

  const handleOutgoingFiberChange = (fiberNo: number, outgoingFiberNo: number) => {
    setSpliceConfigurations(prev =>
      prev.map(s =>
        s.incoming_fiber_no === fiberNo
          ? { ...s, outgoing_fiber_no: outgoingFiberNo }
          : s
      )
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
      // Update fiber splices in database
      for (const config of spliceConfigurations) {
        const existingSplice = fiberSplices.find(s => s.incoming_fiber_no === config.incoming_fiber_no);

        if (existingSplice) {
          const { error: updateError } = await supabase
            .from('fiber_splices')
            .update({
              outgoing_fiber_no: config.outgoing_fiber_no,
              splice_type: config.splice_type === 'straight' ? 'pass_through' : 'branch',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingSplice.id);

          if (updateError) throw updateError;
        } else {
          // Create new splice if it doesn't exist
          const { error: insertError } = await supabase
            .from('fiber_splices')
            .insert({
              jc_id: junctionClosureId,
              incoming_cable_id: fiberSplices[0]?.incoming_cable_id || '',
              incoming_fiber_no: config.incoming_fiber_no,
              outgoing_cable_id: fiberSplices[0]?.outgoing_cable_id || null,
              outgoing_fiber_no: config.outgoing_fiber_no,
              splice_type: config.splice_type === 'straight' ? 'pass_through' : 'branch',
              status: 'active'
            });

          if (insertError) throw insertError;
        }
      }

      toast.success('Splice configuration applied successfully');
      await loadFiberSplices();
      onSpliceComplete?.();
    } catch (err: any) {
      setError(err.message);
      toast.error(`Failed to apply splice configuration: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getMaxFiberCount = () => {
    const maxIncoming = Math.max(...fiberSplices.map(s => s.incoming_fiber_no), 0);
    const maxOutgoing = Math.max(...fiberSplices.map(s => s.outgoing_fiber_no || 0), 0);
    return Math.max(maxIncoming, maxOutgoing, 2); // Minimum 2 fibers
  };

  const maxFibers = getMaxFiberCount();

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
                Click on a junction closure (JC) in the Route Visualizer tab to manage its fiber splices.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Fiber Splice Configuration</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Junction Closure: {junctionClosureName}
          </p>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {/* Splice Configuration Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fiber #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Splice Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Outgoing Fiber
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {Array.from({ length: maxFibers }, (_, i) => i + 1).map(fiberNo => {
                    const splice = fiberSplices.find(s => s.incoming_fiber_no === fiberNo);
                    const config = spliceConfigurations.find(s => s.incoming_fiber_no === fiberNo);

                    return (
                      <tr key={fiberNo} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {fiberNo}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <select
                            value={config?.splice_type || (splice?.splice_type === 'pass_through' ? 'straight' : splice?.splice_type === 'branch' ? 'cross' : 'straight')}
                            onChange={(e) => handleSpliceTypeChange(fiberNo, e.target.value as 'straight' | 'cross')}
                            className="border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-1 text-xs"
                          >
                            <option value="straight">Straight</option>
                            <option value="cross">Cross</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <input
                            type="number"
                            min="1"
                            max={maxFibers}
                            value={config?.outgoing_fiber_no || splice?.outgoing_fiber_no || fiberNo}
                            onChange={(e) => handleOutgoingFiberChange(fiberNo, parseInt(e.target.value) || fiberNo)}
                            className="w-16 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-1 text-xs"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className={`px-2 py-1 rounded text-xs ${
                            splice?.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {splice?.status || 'Not Set'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Apply Button */}
            <div className="flex justify-end">
              <Button
                onClick={applySpliceConfiguration}
                disabled={isLoading || spliceConfigurations.length === 0}
                className="px-6 py-2"
              >
                {isLoading ? 'Applying...' : 'Apply Splice Configuration'}
              </Button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}; 
