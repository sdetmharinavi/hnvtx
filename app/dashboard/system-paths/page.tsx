// path: app/dashboard/systems/[id]/page.tsx

"use client";

import { useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useTableRecord } from '@/hooks/database';
import { PageSpinner, Button, SearchableSelect, ConfirmModal } from '@/components/common/ui';
import { PageHeader } from '@/components/common/page-header';
import { GitBranch, ChevronsRight, RefreshCw, ZapOff } from 'lucide-react';
import { useRingsForSelection, useRingConnectionPaths, useGenerateRingPaths, useDeprovisionPath } from '@/hooks/database/ring-provisioning-hooks';
import { RingProvisioningModal } from '@/components/systems/RingProvisioningModal';
import { toast } from 'sonner';
import { Logical_pathsRowSchema } from '@/schemas/zod-schemas';

type PathWithNodes = Logical_pathsRowSchema & { start_node: { name: string } | null, end_node: { name: string } | null };

export default function SystemConnectionsPage() {
  const params = useParams();
  const router = useRouter();
  const systemId = params.id as string;
  const [selectedRingId, setSelectedRingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<PathWithNodes | null>(null);

  // State for the deprovision confirmation modal
  const [isDeprovisionModalOpen, setDeprovisionModalOpen] = useState(false);
  const [pathToDeprovision, setPathToDeprovision] = useState<PathWithNodes | null>(null);

  const { data: system, isLoading: isLoadingSystem } = useTableRecord(createClient(), 'systems', systemId);
  const { data: rings = [], isLoading: isLoadingRings } = useRingsForSelection();
  const { data: paths = [], refetch: refetchPaths, isLoading: isLoadingPaths } = useRingConnectionPaths(selectedRingId);
  const generatePathsMutation = useGenerateRingPaths();
  const deprovisionMutation = useDeprovisionPath();

  const ringOptions = useMemo(() => rings.map(r => ({ value: r.id, label: r.name })), [rings]);

  const handleGeneratePaths = useCallback(() => {
    if (!selectedRingId) {
      toast.error("Please select a ring first.");
      return;
    }
    generatePathsMutation.mutate(selectedRingId);
  }, [selectedRingId, generatePathsMutation]);

  const handleProvisionClick = useCallback((path: PathWithNodes) => {
    setSelectedPath(path);
    setIsModalOpen(true);
  }, []);

  const handleDeprovisionClick = useCallback((path: PathWithNodes) => {
    setPathToDeprovision(path);
    setDeprovisionModalOpen(true);
  }, []);

  const handleConfirmDeprovision = useCallback(() => {
    if (!pathToDeprovision) return;
    // THE FIX: The payload now correctly passes only the logical path ID.
    deprovisionMutation.mutate({ logicalPathId: pathToDeprovision.id }, {
      onSuccess: () => {
        setDeprovisionModalOpen(false);
        setPathToDeprovision(null);
        refetchPaths();
      }
    });
  }, [pathToDeprovision, deprovisionMutation, refetchPaths]);

  const isLoading = isLoadingSystem || isLoadingRings;
  if (isLoading) return <PageSpinner text="Loading provisioning details..." />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Ring Path Provisioning"
        description={`Configure fiber paths for system: ${system?.system_name || '...'}`}
        icon={<GitBranch />}
        actions={[
          { label: "Back to Systems", onClick: () => router.push('/dashboard/systems'), variant: 'outline' }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">1. Select Ring</h3>
          <SearchableSelect
            options={ringOptions}
            value={selectedRingId}
            onChange={setSelectedRingId}
            placeholder="Select a ring..."
            clearable
          />
          <Button onClick={handleGeneratePaths} disabled={!selectedRingId || generatePathsMutation.isPending} className="w-full">
            {generatePathsMutation.isPending ? 'Generating...' : 'Generate/Refresh Paths'}
          </Button>
        </div>

        <div className="md:col-span-2 space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">2. Provision Paths</h3>
            <Button onClick={() => refetchPaths()} variant="ghost" size="sm" disabled={!selectedRingId || isLoadingPaths}>
              <RefreshCw className={`w-4 h-4 ${isLoadingPaths ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="border rounded-lg max-h-[60vh] overflow-y-auto">
            {isLoadingPaths ? <PageSpinner text="Loading paths..."/> : paths.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <p>{selectedRingId ? "No paths found or generated. Click the button to generate." : "Select a ring to see connection paths."}</p>
              </div>
            ) : (
              (paths as PathWithNodes[]).map(path => (
                <div key={path.id} className="flex items-center justify-between p-4 border-b dark:border-gray-700 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{path.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      {path.start_node?.name} <ChevronsRight className="inline mx-2 h-4 w-4" /> {path.end_node?.name}
                    </p>
                  </div>
                  {path.status === 'provisioned' ? (
                    <Button variant="danger" onClick={() => handleDeprovisionClick(path)} leftIcon={<ZapOff className="w-4 h-4" />}>
                        Deprovision
                    </Button>
                  ) : (
                    <Button variant="primary" onClick={() => handleProvisionClick(path)}>
                        Provision
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {systemId && (
        <RingProvisioningModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          logicalPath={selectedPath}
          systemId={systemId}
        />
      )}

      <ConfirmModal
        isOpen={isDeprovisionModalOpen}
        onConfirm={handleConfirmDeprovision}
        onCancel={() => setDeprovisionModalOpen(false)}
        title="Confirm De-provisioning"
        message={`Are you sure you want to de-provision the system from path "${pathToDeprovision?.name}"? All fibers assigned to this system will be released.`}
        type="danger"
        loading={deprovisionMutation.isPending}
      />
    </div>
  );
}