// path: app/dashboard/ring-paths/[ringId]/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiRefreshCw, FiGitBranch, FiEdit2, FiZap } from 'react-icons/fi';

import { PageHeader } from '@/components/common/page-header';
import { DataTable, TableAction } from '@/components/table';
import { PageSpinner, ErrorDisplay, Button } from '@/components/common/ui';
import {
  useRingConnectionPaths,
  useGenerateRingPaths,
} from '@/hooks/database/ring-provisioning-hooks';
import { useTableRecord } from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';
import { RingPathManagerModal } from '@/components/rings/RingPathManagerModal';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { useUser } from '@/providers/UserProvider';
import { UserRole } from '@/types/user-roles';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';

// Define the shape of the data returned by useRingConnectionPaths
interface LogicalPathData {
  id: string;
  name: string;
  status: string | null;
  start_node_id: string | null;
  end_node_id: string | null;
  source_system_id: string | null;
  destination_system_id: string | null;
  source_port: string | null;
  destination_port: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined fields
  start_node?: { name: string } | null;
  end_node?: { name: string } | null;
  source_system?: { system_name: string } | null;
  destination_system?: { system_name: string } | null;
}

export default function RingPathsPage() {
  const params = useParams();
  const router = useRouter();
  const ringId = params.ringId as string;
  const supabase = createClient();
  const { isSuperAdmin, role } = useUser();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<LogicalPathData | null>(null);

  // --- PERMISSIONS ---
  const canEdit =
    !!isSuperAdmin ||
    role === UserRole.ADMIN ||
    role === UserRole.ADMINPRO ||
    role === UserRole.MAANADMIN ||
    role === UserRole.CPANADMIN;

  // 1. Fetch Ring Details (for header)
  const { data: ringData, isLoading: isLoadingRing } = useTableRecord<'v_rings'>(
    supabase,
    'v_rings',
    ringId
  );

  // 2. Fetch Paths
  const {
    data: paths = [],
    isLoading: isLoadingPaths,
    isFetching,
    refetch,
  } = useRingConnectionPaths(ringId);

  // 3. Mutation to Generate Paths
  const generateMutation = useGenerateRingPaths();

  // --- HANDLERS ---

  // THE FIX: Simplified handler. Side effects (invalidation) are now inside the hook.
  const handleGeneratePaths = () => {
    generateMutation.mutate(ringId);
  };

  const handleEditPath = (path: LogicalPathData) => {
    setSelectedPath(path);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setSelectedPath(null);
    refetch(); // Refresh list to show new system assignments
  };

  // --- COLUMNS ---
  const columns = useMemo(
    (): Column<LogicalPathData>[] => [
      {
        key: 'name',
        title: 'Path Name',
        dataIndex: 'name',
        sortable: true,
        width: 250,
        render: (val) => (
          <span className="font-semibold text-gray-800 dark:text-gray-200">{val as string}</span>
        ),
      },
      {
        key: 'topology',
        title: 'Topology',
        dataIndex: 'start_node',
        width: 200,
        render: (_, record) => (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {record.start_node?.name || 'Unknown'}
            </span>
            <span className="text-gray-400">→</span>
            <span className="text-gray-600 dark:text-gray-400">
              {record.end_node?.name || 'Unknown'}
            </span>
          </div>
        ),
      },
      {
        key: 'source_config',
        title: 'Source System',
        dataIndex: 'source_system_id',
        width: 220,
        render: (_, record) => (
          <div className="flex flex-col">
            {record.source_system ? (
              <>
                <TruncateTooltip
                  text={record.source_system.system_name}
                  className="font-medium text-blue-700 dark:text-blue-300"
                />
                <span className="text-xs text-gray-500 font-mono">
                  {record.source_port || 'No Port'}
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-400 italic">Not Configured</span>
            )}
          </div>
        ),
      },
      {
        key: 'dest_config',
        title: 'Destination System',
        dataIndex: 'destination_system_id',
        width: 220,
        render: (_, record) => (
          <div className="flex flex-col">
            {record.destination_system ? (
              <>
                <TruncateTooltip
                  text={record.destination_system.system_name}
                  className="font-medium text-purple-700 dark:text-purple-300"
                />
                <span className="text-xs text-gray-500 font-mono">
                  {record.destination_port || 'No Port'}
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-400 italic">Not Configured</span>
            )}
          </div>
        ),
      },
      {
        key: 'status',
        title: 'Status',
        dataIndex: 'status',
        width: 120,
        render: (val) => {
          const status = (val as string) || 'unprovisioned';
          let color = 'bg-gray-100 text-gray-600';
          if (status === 'configured') color = 'bg-blue-100 text-blue-700';
          if (status === 'provisioned') color = 'bg-green-100 text-green-700';

          return (
            <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${color}`}>
              {status}
            </span>
          );
        },
      },
    ],
    []
  );

  const tableActions = useMemo(
    (): TableAction<'logical_paths'>[] => [
      {
        key: 'edit',
        label: 'Configure Endpoints',
        icon: <FiEdit2 />,
        onClick: (record) => handleEditPath(record as unknown as LogicalPathData),
        variant: 'secondary',
        disabled: !canEdit,
      },
    ],
    [canEdit]
  );

  const customHeaderActions = [
    {
      label: 'Refresh',
      onClick: () => refetch(),
      variant: 'outline' as const,
      leftIcon: <FiRefreshCw className={isFetching ? 'animate-spin' : ''} />,
    },
    ...(canEdit
      ? [
          {
            label: generateMutation.isPending ? 'Generating...' : 'Generate Paths',
            onClick: handleGeneratePaths,
            variant: 'primary' as const,
            leftIcon: <FiZap />,
            disabled: generateMutation.isPending || isLoadingPaths,
          },
        ]
      : []),
    {
      label: 'Back',
      onClick: () => router.back(),
      variant: 'outline' as const,
      leftIcon: <FiArrowLeft />,
    },
  ];

  const headerStats = [
    { value: paths.length, label: 'Total Paths' },
    {
      value: paths.filter((p) => p.status === 'configured' || p.status === 'provisioned').length,
      label: 'Configured',
      color: 'success' as const,
    },
    {
      value: paths.filter((p) => !p.source_system_id && !p.destination_system_id).length,
      label: 'Unassigned',
      color: 'warning' as const,
    },
  ];

  if (isLoadingRing) return <PageSpinner text="Loading Ring Context..." />;
  if (!ringData) return <ErrorDisplay error="Ring not found." />;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title={`Logical Paths: ${ringData.name}`}
        description="Manage logical connectivity between ring nodes. Generate paths based on topology and assign systems."
        icon={<FiGitBranch />}
        stats={headerStats}
        actions={customHeaderActions}
        isLoading={isLoadingPaths && paths.length === 0}
        isFetching={isFetching}
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {paths.length === 0 && !isLoadingPaths ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-full mb-4">
              <FiZap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Logical Paths Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
              It seems this ring doesn&apos;t have any logical paths defined yet. Click{' '}
              <strong>Generate Paths</strong> to automatically create paths between all adjacent
              nodes in the ring.
            </p>
            {canEdit && (
              <Button
                onClick={handleGeneratePaths}
                disabled={generateMutation.isPending}
                leftIcon={<FiZap />}
              >
                {generateMutation.isPending ? 'Generating...' : 'Generate Paths'}
              </Button>
            )}
          </div>
        ) : (
          <DataTable
            autoHideEmptyColumns={true}
            tableName="logical_paths"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data={paths as any}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            columns={columns as any}
            actions={tableActions}
            loading={isLoadingPaths}
            isFetching={isFetching || generateMutation.isPending}
            searchable={true}
            pagination={{
              current: 1,
              pageSize: 50,
              total: paths.length,
              onChange: () => {},
            }}
          />
        )}
      </div>

      {selectedPath && (
        <RingPathManagerModal
          isOpen={isEditModalOpen}
          onClose={handleCloseModal}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          path={selectedPath as any}
        />
      )}
    </div>
  );
}
