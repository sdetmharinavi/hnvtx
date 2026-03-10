// app/dashboard/route-manager/page.tsx
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouteDetails } from '@/hooks/database/route-manager-hooks';
import { PageSpinner, ErrorDisplay } from '@/components/common/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/ui/tabs';
import RouteVisualization from '@/components/route-manager/ui/RouteVisualization';
import { FiberSpliceManager } from '@/components/route-manager/FiberSpliceManager';
import { JointBox } from '@/schemas/custom-schemas';
import RouteSelection from '@/components/route-manager/RouteSelection';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { FiDownload, FiRefreshCw, FiGitMerge, FiMap } from 'react-icons/fi';
import { Map } from 'lucide-react';
import { useExportRouteTopology } from '@/hooks/database/excel-queries/useRouteTopologyExcel';
import { ActionButton } from '@/components/common/page-header';
import { FancyEmptyState } from '@/components/common/ui/FancyEmptyState';
import { useDataSync } from '@/hooks/data/useDataSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export default function RouteManagerPage() {
  const[selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedJc, setSelectedJc] = useState<JointBox | null>(null);
  const [activeTab, setActiveTab] = useState('visualization');
  const supabase = createClient();

  const { sync: syncData, isSyncing: isSyncingData } = useDataSync();
  const isOnline = useOnlineStatus();

  const {
    data: routeDetails,
    isLoading: isLoadingRouteDetails,
    refetch: refetchRouteDetails,
    error: routeDetailsError,
    isError: routeDetailsIsError,
    isFetching: isFetchingRouteDetails,
  } = useRouteDetails(selectedRouteId as string);

  const { mutate: exportTopology, isPending: isExporting } = useExportRouteTopology(supabase);

  const allJointBoxesOnRoute = useMemo(() => routeDetails?.jointBoxes || [], [routeDetails]);
  const currentSegments = useMemo(() => routeDetails?.segments || [], [routeDetails]);

  const handleRouteChange = useCallback((routeId: string | null) => {
    setSelectedRouteId(routeId);
    setSelectedJc(null);
    setActiveTab('visualization');
  },[]);

  const handleExportClick = useCallback(() => {
    if (selectedRouteId && routeDetails?.route?.route_name) {
      exportTopology({ routeId: selectedRouteId, routeName: routeDetails.route.route_name });
    } else {
      toast.error('Please select a route to export.');
    }
  },[selectedRouteId, routeDetails?.route?.route_name, exportTopology]);

  const handleJcClick = useCallback((jc: JointBox) => {
    setSelectedJc(jc);
    setActiveTab('splicing');
  },[]);

  const isBusy = isLoadingRouteDetails || isSyncingData || isFetchingRouteDetails;

  const headerActions = useMemo((): ActionButton[] => {
    const actions: ActionButton[] =[
      {
        label: 'Refresh',
        onClick: async () => {
          if (isOnline) {
            await syncData([
              'ofc_cables',
              'v_ofc_cables_complete',
              'junction_closures',
              'v_junction_closures_complete',
              'cable_segments',
              'fiber_splices',
              'nodes',
              'v_nodes_complete',
            ]);
          }
          refetchRouteDetails();
          toast.success('Route details refreshed!');
        },
        variant: 'outline',
        leftIcon: <FiRefreshCw className={isBusy ? 'animate-spin' : ''} />,
        disabled: isBusy,
      },
      {
        label: isExporting ? 'Exporting...' : 'Export Topology',
        onClick: handleExportClick,
        variant: 'outline',
        leftIcon: <FiDownload />,
        disabled: isExporting || !selectedRouteId || isBusy,
        hideTextOnMobile: true,
      },
    ];
    return actions;
  },[
    isBusy,
    isExporting,
    selectedRouteId,
    refetchRouteDetails,
    handleExportClick,
    isOnline,
    syncData,
  ]);

  return (
    <div className='p-4 md:p-6 space-y-6 min-h-[calc(100vh-64px)] flex flex-col'>
      <RouteSelection
        selectedRouteId={selectedRouteId}
        onRouteChange={handleRouteChange}
        isLoadingRouteDetails={isBusy}
        actions={headerActions}
      />

      <div className='flex-1 flex flex-col'>
        {routeDetailsIsError ? (
          <ErrorDisplay
            error={routeDetailsError?.message}
            title='Failed to load route details'
            actions={[{ label: 'Retry', onClick: () => refetchRouteDetails(), variant: 'primary' }]}
          />
        ) : isLoadingRouteDetails ? (
          <div className='flex-1 flex items-center justify-center min-h-[400px]'>
            <PageSpinner text='Loading route topology...' />
          </div>
        ) : !selectedRouteId ? (
          <div className='flex-1 flex items-center justify-center min-h-[400px]'>
            <FancyEmptyState
              icon={Map}
              title='No Route Selected'
              description='Please select an Optical Fiber Cable route from the dropdown above to view its topology.'
            />
          </div>
        ) : (
          <div className='flex-1 flex flex-col space-y-4'>
            {!routeDetails ? (
              <ErrorDisplay error='Route data is empty or invalid.' />
            ) : (
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className='w-full flex-1 flex flex-col'
              >
                <div className='border-b border-gray-200 dark:border-gray-700 mb-4'>
                  <TabsList className='bg-transparent p-0'>
                    <TabsTrigger
                      value='visualization'
                      className='data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-4 py-2'
                    >
                      <FiMap className='mr-2' /> Route Visualization
                    </TabsTrigger>
                    <TabsTrigger
                      value='splicing'
                      disabled={!selectedJc}
                      className='data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-4 py-2 disabled:opacity-50'
                    >
                      <FiGitMerge className='mr-2' />
                      Splice Details {selectedJc && `(${selectedJc.node?.name || 'JC'})`}
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className='flex-1'>
                  <TabsContent
                    value='visualization'
                    className='h-full mt-0 focus-visible:outline-none'
                  >
                    <RouteVisualization
                      routeDetails={{
                        ...routeDetails,
                        jointBoxes: allJointBoxesOnRoute,
                        segments: currentSegments,
                      }}
                      onJcClick={handleJcClick}
                    />
                  </TabsContent>

                  <TabsContent value='splicing' className='h-full mt-0 focus-visible:outline-none'>
                    <FiberSpliceManager
                      junctionClosureId={selectedJc?.id ?? null}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            )}
          </div>
        )}
      </div>
    </div>
  );
}