"use client";

import React, { useState, useMemo } from "react";
import { useAvailableFibers } from "@/hooks/database/path-queries";
import { useProvisionRingPath } from "@/hooks/database/path-mutations";
import { Button } from "../common/ui/Button";
import { toast } from "sonner";
import { FiZap } from "react-icons/fi";

interface Props {
  pathName: string;
  systemId: string;
  physicalPathId: string;
}

export function FiberProvisioning({ pathName, systemId, physicalPathId }: Props) {
  const [workingFiber, setWorkingFiber] = useState<string>("");
  const [protectionFiber, setProtectionFiber] = useState<string>("");
  
  const { data: availableFibers, isLoading, isError, error } = useAvailableFibers(physicalPathId);
  const provisionMutation = useProvisionRingPath();

  const fiberOptions = useMemo(() => {
    if (!Array.isArray(availableFibers)) return [];
    return availableFibers.map(fiber => (
      <option key={fiber.fiber_no} value={fiber.fiber_no}>
        Fiber #{fiber.fiber_no}
      </option>
    ));
  }, [availableFibers]);

  const protectionFiberOptions = useMemo(() => {
    if (!Array.isArray(availableFibers)) return [];
    return availableFibers
      .filter(f => f.fiber_no.toString() !== workingFiber)
      .map(fiber => (
        <option key={`p-${fiber.fiber_no}`} value={fiber.fiber_no}>
          Fiber #{fiber.fiber_no}
        </option>
      ));
  }, [availableFibers, workingFiber]);

  const handleProvision = () => {
    if (!workingFiber || !protectionFiber) {
      toast.error("Please select both a working and a protection fiber.");
      return;
    }
    if (workingFiber === protectionFiber) {
      toast.error("Working and protection fibers cannot be the same.");
      return;
    }
    
    provisionMutation.mutate({
      systemId: systemId,
      pathName: pathName,
      workingFiber: parseInt(workingFiber, 10),
      protectionFiber: parseInt(protectionFiber, 10),
      physicalPathId: physicalPathId,
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-sm text-gray-500 animate-pulse">Checking fiber continuity...</p>;
    }
    if (isError) {
      return <p className="text-sm text-red-500">Error checking available fibers: {error.message}</p>;
    }
    if (availableFibers && availableFibers.length >= 2) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Tx Fiber</label>
            <select
              value={workingFiber}
              onChange={(e) => setWorkingFiber(e.target.value)}
              className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="" disabled>Select fiber...</option>
              {fiberOptions}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Rx Fiber</label>
            <select
              value={protectionFiber}
              onChange={(e) => setProtectionFiber(e.target.value)}
              disabled={!workingFiber}
              className="w-full rounded-md border-gray-300 dark:bg-gray-700 disabled:opacity-50 dark:border-gray-600"
            >
              <option value="" disabled>Select fiber...</option>
              {protectionFiberOptions}
            </select>
          </div>
          <Button
            onClick={handleProvision}
            disabled={!workingFiber || !protectionFiber || provisionMutation.isPending}
          >
            {provisionMutation.isPending ? "Provisioning..." : "Provision Path"}
          </Button>
        </div>
      );
    }
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Not enough available fibers for a protected path. At least 2 continuous fibers are required.
      </p>
    );
  };

  return (
    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 border border-dashed dark:border-gray-700 rounded-lg">
      <h4 className="text-lg font-semibold flex items-center gap-2 mb-3 dark:text-white">
        <FiZap className="text-yellow-500" />
        Provision Ring Service
      </h4>
      {renderContent()}
    </div>
  );
}