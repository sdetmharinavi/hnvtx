// path: components/systems/FiberProvisioning.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAvailableFibers, useProvisionedFibers } from "@/hooks/database/path-queries";
import { useProvisionRingPath, useDeprovisionPath } from "@/hooks/database/path-mutations";
import { Button, SearchableSelect } from "../common/ui";
import { toast } from "sonner";
import { FiZap, FiZapOff, FiEdit, FiSave, FiX } from "react-icons/fi";
import { Row } from "@/hooks/database";
import { Option } from "@/components/common/ui/select/SearchableSelect";

interface Props {
  path: Row<'logical_fiber_paths'>;
  pathName: string;
  systemId: string;
  physicalPathId: string;
  validationStatus: 'valid_ring' | 'open_path' | 'broken' | 'empty';
}

export function FiberProvisioning({ path, pathName, systemId, physicalPathId, validationStatus }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [workingFiber, setWorkingFiber] = useState<string | null>(null);
  const [protectionFiber, setProtectionFiber] = useState<string | null>(null);

  const { data: availableFibersData, isLoading: isLoadingAvailable, refetch: refetchAvailable } = useAvailableFibers(physicalPathId);
  const { data: provisionedFibers, isLoading: isLoadingProvisioned, refetch: refetchProvisioned } = useProvisionedFibers(path.id);

  const provisionMutation = useProvisionRingPath();
  const deprovisionMutation = useDeprovisionPath();

  const isProvisioned = !!path.operational_status_id;

  useEffect(() => {
    if (isProvisioned && provisionedFibers) {
      setWorkingFiber(provisionedFibers.working?.toString() || null);
      setProtectionFiber(provisionedFibers.protection?.toString() || null);
      setEditMode(false);
    } else {
      setWorkingFiber(null);
      setProtectionFiber(null);
      setEditMode(true);
    }
  }, [isProvisioned, provisionedFibers]);

  const allContinuouslyAvailableFibers = useMemo(() => {
    const available = availableFibersData || [];
    if (isProvisioned && provisionedFibers?.working) {
      if (!available.some(f => f.fiber_no === provisionedFibers.working)) {
        available.push({ fiber_no: provisionedFibers.working });
      }
    }
    if (isProvisioned && provisionedFibers?.protection) {
      if (!available.some(f => f.fiber_no === provisionedFibers.protection)) {
        available.push({ fiber_no: provisionedFibers.protection });
      }
    }
    return [...new Map(available.map(item => [item.fiber_no, item])).values()].sort((a,b) => a.fiber_no - b.fiber_no);
  }, [availableFibersData, isProvisioned, provisionedFibers]);

  const fiberOptions: Option[] = useMemo(() => 
    allContinuouslyAvailableFibers.map(f => ({ value: f.fiber_no.toString(), label: `Fiber #${f.fiber_no}` })), 
  [allContinuouslyAvailableFibers]);

  const title = validationStatus === 'valid_ring' ? "Provision Protected Ring Service" : "Provision Protected Path Service";

  const handleSave = () => {
    if (!workingFiber || !protectionFiber) {
      toast.error("Please select both a working and a protection fiber.");
      return;
    }
    provisionMutation.mutate({
      systemId, pathName, physicalPathId,
      workingFiber: parseInt(workingFiber),
      protectionFiber: parseInt(protectionFiber),
    }, { onSuccess: () => { refetchProvisioned(); refetchAvailable(); setEditMode(false); }});
  };

  const handleDeprovision = () => {
    if (window.confirm("Are you sure you want to de-provision this path? This will free up the fibers.")) {
      deprovisionMutation.mutate({ pathId: path.id }, {
        onSuccess: () => {
          setWorkingFiber(null);
          setProtectionFiber(null);
          refetchAvailable();
          refetchProvisioned();
        }
      });
    }
  };
  
  if (isLoadingAvailable || isLoadingProvisioned) {
    return <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"><p className="text-sm text-gray-500 animate-pulse">Loading Fiber Details...</p></div>;
  }
  
  return (
    <div className={`mt-6 p-4 rounded-lg border ${isProvisioned && !editMode ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' : 'bg-gray-50 dark:bg-gray-800/50 border-dashed dark:border-gray-700'}`}>
      <div className="flex justify-between items-start mb-3">
        <h4 className={`text-lg font-semibold flex items-center gap-2 ${isProvisioned && !editMode ? 'text-green-800 dark:text-green-300' : 'dark:text-white'}`}>
          <FiZap className={isProvisioned && !editMode ? '' : 'text-yellow-500'} />
          {isProvisioned && !editMode ? 'Path is Provisioned' : title}
        </h4>
        {isProvisioned && !editMode && (
           <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditMode(true)} leftIcon={<FiEdit />}>Change</Button>
                <Button variant="danger" size="sm" onClick={handleDeprovision} disabled={deprovisionMutation.isPending} leftIcon={<FiZapOff />}>
                    {deprovisionMutation.isPending ? "..." : "De-provision"}
                </Button>
            </div>
        )}
      </div>
      
      {editMode ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Working Fiber</label>
            <SearchableSelect
                options={fiberOptions}
                value={workingFiber}
                onChange={setWorkingFiber}
                placeholder="Select fiber..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Protection Fiber</label>
            <SearchableSelect
                options={fiberOptions.filter(f => f.value !== workingFiber)}
                value={protectionFiber}
                onChange={setProtectionFiber}
                placeholder="Select fiber..."
                disabled={!workingFiber}
            />
          </div>
          <div className="flex gap-2">
            {isProvisioned && <Button variant="secondary" onClick={() => setEditMode(false)} leftIcon={<FiX />}>Cancel</Button>}
            <Button onClick={handleSave} disabled={!workingFiber || !protectionFiber || provisionMutation.isPending} leftIcon={<FiSave />}>
              {provisionMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      ) : isProvisioned ? (
        <div className="flex gap-6 text-sm text-gray-700 dark:text-gray-200">
          <p>Working Fiber: <span className="font-bold text-base ml-1">#{provisionedFibers?.working}</span></p>
          <p>Protection Fiber: <span className="font-bold text-base ml-1">#{provisionedFibers?.protection}</span></p>
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
            Not enough available fibers for a protected path. At least 2 continuous fibers are required.
        </p>
      )}
    </div>
  );
}