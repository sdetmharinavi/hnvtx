// components/rings/LogPowerReadingsModal.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { usePagedData } from '@/hooks/database';
import { useLogPowerReadings, useLatestSystemsPowerReadings } from '@/hooks/data/usePowerReadings';
import { V_ring_nodesRowSchema, V_ports_management_completeRowSchema } from '@/schemas/zod-schemas';
import { Server, Activity, Zap, Clock } from 'lucide-react';
import { Modal, Button, PageSpinner } from '@/components/common/ui';
import { toast } from 'sonner';
import { formatDate } from '@/utils/formatters';

interface LogPowerReadingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ringId: string;
}

const isElectricalPort = (portTypeCode: string | null | undefined, portName: string | null | undefined): boolean => {
  if (!portTypeCode && !portName) return false;
  const code = (portTypeCode || '').toUpperCase();
  const name = (portName || '').toUpperCase();
  return (
    code.includes('E1') ||
    code.includes('FE') ||
    code.includes('STM') ||
    code.includes('GE(E)') ||
    code.includes('GE_ELECTRICAL') ||
    code.includes('NMS') ||
    name.includes('NMS') ||
    name.includes('STM') ||
    name.includes('E1')
  );
};

export const LogPowerReadingsModal: React.FC<LogPowerReadingsModalProps> = ({
  isOpen,
  onClose,
  ringId,
}) => {
  const supabase = createClient();
  const logReadingsMutation = useLogPowerReadings();

  // Local state for input grid tracking
  // Key format: "systemId_port" -> { tx_power: string, rx_power: string, remark: string }
  const [formState, setFormState] = useState<Record<string, { tx_power: string; rx_power: string; remark: string }>>({});

  // Reset form state cleanly on close
  useEffect(() => {
    if (!isOpen) {
      setFormState({});
    }
  }, [isOpen]);

  // 1. Fetch Systems in Ring
  const { data: systemsResult, isLoading: loadingSystems } = usePagedData<V_ring_nodesRowSchema>(
    supabase,
    'v_ring_nodes',
    {
      filters: { ring_id: ringId },
      limit: 1000,
    },
    { enabled: isOpen }
  );

  const systems = useMemo(() => systemsResult?.data || [], [systemsResult]);
  const systemIds = useMemo(() => systems.map((s) => s.id).filter(Boolean) as string[], [systems]);

  // 2. Fetch Ports for Systems in Ring
  const portsFilters = useMemo(() => ({ system_id: systemIds }), [systemIds]);

  const { data: portsResult, isLoading: loadingPorts } = usePagedData<V_ports_management_completeRowSchema>(
    supabase,
    'v_ports_management_complete',
    {
      filters: portsFilters,
      limit: 3000,
      orderBy: 'port',
    },
    { enabled: isOpen && systemIds.length > 0 }
  );

  // Filter out electrical ports immediately from local data
  const ports = useMemo(() => {
    const rawPorts = portsResult?.data || [];
    return rawPorts.filter((p) => !isElectricalPort(p.port_type_code, p.port));
  }, [portsResult]);

  // 3. Fetch Latest Historical Readings
  const { data: powerData = {}, isLoading: loadingPowerData } = useLatestSystemsPowerReadings(systemIds);

  // Group ports under systems for a structured list view
  const groupedData = useMemo(() => {
    return systems.map((sys) => {
      const sysPorts = ports.filter((p) => p.system_id === sys.id);
      return {
        system: {
          id: sys.id,
          system_name: sys.system_node_name || sys.name || 'Unknown System',
          ip_address: sys.ip
        },
        ports: sysPorts,
      };
    }).filter(group => group.ports.length > 0);
  }, [systems, ports]);

  // Initialize input state without wiping existing user inputs during background refetches
  useEffect(() => {
    if (isOpen && ports.length > 0) {
      setFormState((prev) => {
        const next = { ...prev };
        let changed = false;
        ports.forEach((p) => {
          if (p.system_id && p.port) {
            const key = `${p.system_id}_${p.port}`;
            if (!next[key]) {
              next[key] = { tx_power: '', rx_power: '', remark: '' };
              changed = true;
            }
          }
        });
        return changed ? next : prev;
      });
    }
  }, [isOpen, ports]);

  const handleInputChange = (systemId: string, port: string, field: 'tx_power' | 'rx_power' | 'remark', value: string) => {
    const key = `${systemId}_${port}`;
    setFormState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    const readings = Object.entries(formState)
      .map(([key, value]) => {
        const [system_id, port] = key.split('_');
        return {
          system_id,
          port,
          tx_power: value.tx_power,
          rx_power: value.rx_power,
          remark: value.remark,
        };
      })
      .filter((r) => r.tx_power !== '' || r.rx_power !== ''); // Send only lines with user input

    if (readings.length === 0) {
      toast.error('Please enter at least one Tx or Rx reading.');
      return;
    }

    logReadingsMutation.mutate({ ringId, readings }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  const isLoading = loadingSystems || loadingPorts || loadingPowerData;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Fiber Power Levels (Tx/Rx)" size="full">
      {isLoading ? (
        <PageSpinner text="Loading ring interface configs & history..." />
      ) : groupedData.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          No optical ports managed on the systems in this ring. Configure system optical ports first.
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Scrollable Entry form */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-6 custom-scrollbar px-4">
            {groupedData.map(({ system, ports: sysPorts }) => (
              <div key={system.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                  <Server size={16} className="text-blue-500" />
                  <span className="font-bold text-sm text-gray-800 dark:text-gray-200">
                    {system.system_name} {system.ip_address ? `(${system.ip_address})` : ''}
                  </span>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {sysPorts.map((p) => {
                    const key = `${p.system_id}_${p.port}`;
                    const current = formState[key] || { tx_power: '', rx_power: '', remark: '' };
                    
                    // Retrieve historical data for this specific port
                    const safeSysId = String(p.system_id).toLowerCase().trim();
                    const safePort = String(p.port).toLowerCase().trim();
                    const powerKey = `${safeSysId}_${safePort}`;
                    const lastReading = powerData[powerKey];

                    return (
                      <div key={p.id} className="p-3 grid grid-cols-1 md:grid-cols-[1fr_120px_120px_200px] gap-3 items-start hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                        
                        {/* Port Info & Last Log Date */}
                        <div className="min-w-0 pt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-sm font-bold text-gray-700 dark:text-gray-300">
                              {p.port}
                            </span>
                            <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 px-1.5 py-0.5 rounded uppercase font-medium">
                              {p.port_type_code || 'Port'}
                            </span>
                          </div>
                          {lastReading?.reading_date ? (
                            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>Last: {formatDate(lastReading.reading_date, { format: 'dd MMM yyyy' })}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-400 dark:text-gray-500 italic">
                              <Clock className="w-3 h-3" />
                              <span>Never logged</span>
                            </div>
                          )}
                        </div>

                        {/* Tx Power Input */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-1 sm:hidden">
                            <Zap className="w-3.5 h-3.5 text-orange-500" />
                            <span className="text-xs text-gray-500 font-semibold uppercase">Tx (dBm)</span>
                          </div>
                          <input
                            type="text"
                            inputMode="text"
                            placeholder="New Tx"
                            value={current.tx_power}
                            onChange={(e) => handleInputChange(p.system_id!, p.port!, 'tx_power', e.target.value)}
                            className="w-full text-sm font-mono border border-gray-300 dark:border-gray-600 rounded p-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 truncate">
                            Prev: {lastReading?.tx_power != null ? <span className="font-medium text-orange-600 dark:text-orange-400">{lastReading.tx_power} dBm</span> : 'N/A'}
                          </div>
                        </div>

                        {/* Rx Power Input */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-1 sm:hidden">
                            <Activity className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-xs text-gray-500 font-semibold uppercase">Rx (dBm)</span>
                          </div>
                          <input
                            type="text"
                            inputMode="text"
                            placeholder="New Rx"
                            value={current.rx_power}
                            onChange={(e) => handleInputChange(p.system_id!, p.port!, 'rx_power', e.target.value)}
                            className="w-full text-sm font-mono border border-gray-300 dark:border-gray-600 rounded p-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 truncate">
                            Prev: {lastReading?.rx_power != null ? <span className="font-medium text-green-600 dark:text-green-400">{lastReading.rx_power} dBm</span> : 'N/A'}
                          </div>
                        </div>

                        {/* Remark Input */}
                        <div>
                          <input
                            type="text"
                            placeholder="Add remark..."
                            value={current.remark}
                            onChange={(e) => handleInputChange(p.system_id!, p.port!, 'remark', e.target.value)}
                            className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          {lastReading?.remark && (
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 truncate" title={String(lastReading.remark)}>
                              Prev: {String(lastReading.remark)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Action Footer */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <Button variant="outline" onClick={onClose} disabled={logReadingsMutation.isPending}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={logReadingsMutation.isPending}
              variant="primary"
            >
              {logReadingsMutation.isPending ? 'Saving...' : 'Save & Close'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};