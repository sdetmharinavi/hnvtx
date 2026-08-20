// components/nodes/NodeInfrastructureModal.tsx

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, PageSpinner } from '@/components/common/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/common/ui/tabs';
import { DataTable } from '@/components/table';
import { createClient } from '@/utils/supabase/client';
import { usePagedData, Row } from '@/hooks/database';
import { 
  V_nodes_completeRowSchema, 
  V_systems_completeRowSchema, 
  V_system_connections_completeRowSchema 
} from '@/schemas/zod-schemas';
import { FiServer, FiGitBranch } from 'react-icons/fi';
import { SystemsTableColumns } from '@/config/table-columns/SystemsTableColumns';
import { SystemConnectionsTableColumns } from '@/config/table-columns/SystemConnectionsTableColumns';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';

interface NodeInfrastructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: V_nodes_completeRowSchema | null;
}

export function NodeInfrastructureModal({ isOpen, onClose, node }: NodeInfrastructureModalProps) {
  const supabase = createClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('systems');

  // Query 1: Fetch all Systems registered at this Node
  const { data: systemsData, isLoading: isLoadingSystems } = usePagedData<V_systems_completeRowSchema>(
    supabase,
    'v_systems_complete',
    { 
      filters: node?.id ? { node_id: node.id } : {}, 
      limit: 1000 
    },
    { enabled: isOpen && !!node?.id && activeTab === 'systems' }
  );

  // Query 2: Fetch all System Connections originating, terminating, or logically routed via this Node
  const { data: connectionsData, isLoading: isLoadingConnections } = usePagedData<V_system_connections_completeRowSchema>(
    supabase,
    'v_system_connections_complete',
    { 
      // THE FIX: Included service_node_id and service_end_node_id to catch logical service routing
      filters: node?.id ? { 
        or: `sn_node_id = '${node.id}' OR en_node_id = '${node.id}' OR service_node_id = '${node.id}' OR service_end_node_id = '${node.id}'` 
      } : {}, 
      limit: 1000 
    },
    { enabled: isOpen && !!node?.id && activeTab === 'connections' }
  );

  // Configure Columns for Systems
  const systemsColumns = SystemsTableColumns(systemsData?.data || []);
  const orderedSystemsColumns = useOrderedColumns(
    systemsColumns, 
    ['system_name', 'system_type_code', 'ip_address', 'status']
  );

  // Configure Columns for Connections 
  // THE FIX: Pass `true` as the second argument to show the System Name context
  const connectionsColumns = SystemConnectionsTableColumns(connectionsData?.data || [], true);
  const orderedConnectionsColumns = useOrderedColumns(
    connectionsColumns, 
    [
      'system_name',             // Put System Name first
      'system_working_interface', // Then Port
      'service_name', 
      'bandwidth_allocated', 
      'connected_link_type_name', 
      'service_end_node_name', 
      'status'
    ]
  );

  if (!node) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Infrastructure: ${node.name}`} 
      size="full"
      className="bg-gray-50 dark:bg-gray-900 w-[95vw] h-[90vh] max-w-[1600px]"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-4 shrink-0">
          <TabsTrigger value="systems" className="flex items-center gap-2">
            <FiServer className="w-4 h-4" /> Systems ({systemsData?.total_count || 0})
          </TabsTrigger>
          <TabsTrigger value="connections" className="flex items-center gap-2">
            <FiGitBranch className="w-4 h-4" /> Connections ({connectionsData?.total_count || 0})
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <TabsContent value="systems" className="h-full m-0 outline-none">
            {isLoadingSystems ? (
              <PageSpinner text="Loading systems..." />
            ) : (
              <DataTable<'v_systems_complete'>
                tableName="v_systems_complete"
                data={systemsData?.data || []}
                columns={orderedSystemsColumns as Column<Row<"v_systems_complete">>[]}
                actions={[{
                  key: 'view',
                  label: 'Manage System',
                  icon: <FiServer />,
                  onClick: (rec) => router.push(`/dashboard/systems/${rec.id}`),
                  variant: 'primary'
                }]}
                searchable={true}
                filterable={false}
                autoHideEmptyColumns={true}
                pagination={{ current: 1, pageSize: 50, total: systemsData?.total_count || 0, onChange: () => {} }}
              />
            )}
          </TabsContent>

          <TabsContent value="connections" className="h-full m-0 outline-none">
            {isLoadingConnections ? (
              <PageSpinner text="Loading connections..." />
            ) : (
              <DataTable<'v_system_connections_complete'>
                tableName="v_system_connections_complete"
                data={connectionsData?.data || []}
                columns={orderedConnectionsColumns as Column<Row<"v_system_connections_complete">>[]}
                actions={[{
                  key: 'view',
                  label: 'Go to System',
                  icon: <FiServer />,
                  onClick: (rec) => router.push(`/dashboard/systems/${rec.system_id}`),
                  variant: 'primary'
                }]}
                searchable={true}
                filterable={false}
                autoHideEmptyColumns={true}
                pagination={{ current: 1, pageSize: 50, total: connectionsData?.total_count || 0, onChange: () => {} }}
              />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </Modal>
  );
}