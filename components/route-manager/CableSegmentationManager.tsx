// components/ofc/CableSegmentationManager.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/common/ui';
import { Card, CardHeader, CardBody } from '@/components/common/ui';
import { useCableSegmentation, JunctionClosure, CableSegment, SpliceConfiguration } from '@/hooks/ofc/useCableSegmentation';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { AlertCircle, Check, Info, Link, Loader2, MapPin, Plus, Settings, X } from 'lucide-react';

interface CableSegmentationManagerProps {
  cableId: string;
  cableName: string;
  onSegmentationComplete?: () => void;
}

export const CableSegmentationManager = ({
  cableId,
  cableName,
  onSegmentationComplete
}: CableSegmentationManagerProps) => {
  const [junctionClosures, setJunctionClosures] = useState<JunctionClosure[]>([]);
  const [cableSegments, setCableSegments] = useState<CableSegment[]>([]);
  const [showAddJCForm, setShowAddJCForm] = useState(false);
  const [newJCData, setNewJCData] = useState({
    name: '',
    position_km: 0,
  });

  const supabase = createClient();
  const {
    isLoading,
    error,
    addJunctionClosure,
    createCableSegments,
    createInitialFiberConnections,
  } = useCableSegmentation();

  const loadExistingData = useCallback(async () => {
    // Don't load if no cable is selected
    if (!cableId || cableId === '') {
      setJunctionClosures([]);
      setCableSegments([]);
      return;
    }
  
    try {
      // Load junction closures
      const { data: jcData, error: jcError } = await supabase
        .from('junction_closures')
        .select('*')
        .eq('ofc_cable_id', cableId)
        .order('position_km');
  
      if (jcError) throw jcError;
      setJunctionClosures(jcData || []);
  
      // Load cable segments
      const { data: segmentData, error: segmentError } = await supabase
        .from('cable_segments')
        .select('*')
        .eq('original_cable_id', cableId)
        .order('segment_order');
  
      if (segmentError) throw segmentError;
      setCableSegments(segmentData || []);
    } catch (err) {
      if (err instanceof Error) {
        toast.error(`Failed to load data: ${err.message}`);
      } else {
        toast.error(`Failed to load data: Unknown error`);
      }
    }
  }, [cableId, supabase]);



  // Load existing junction closures and segments
  useEffect(() => {
    loadExistingData();
  }, [cableId, loadExistingData]);



  const handleAddJunctionClosure = async () => {
    if (!newJCData.name || newJCData.position_km <= 0) {
      toast.error('Please provide valid JC name and position');
      return;
    }

    console.log('=== CABLE SEGMENTATION JC ADD DEBUG ===');
    console.log('cableId:', cableId);
    console.log('newJCData:', newJCData);

    try {
      const jc = await addJunctionClosure(cableId, newJCData.position_km, newJCData.name);
      if (jc) {
        console.log('JC created:', jc);

        // Create cable segments (this will recreate all segments for the cable)
        const segments = await createCableSegments(jc.id, cableId);
        console.log('Segments created:', segments);

        if (segments.length > 0) {
          // Create initial fiber connections for each segment
          for (const segment of segments) {
            await createInitialFiberConnections(segment.id);
          }

          await loadExistingData();
          setShowAddJCForm(false);
          setNewJCData({ name: '', position_km: 0 });
          onSegmentationComplete?.();
        } else {
          console.warn('No segments were created');
          toast.error('No cable segments were created. Please check the cable configuration.');
        }
      }
    } catch (error) {
      console.error('Error in handleAddJunctionClosure:', error);
      toast.error(`Failed to add junction closure: ${error}`);
    }
  };

  const handleApplySplices = async (segmentId: string, spliceConfig: SpliceConfiguration[]) => {
    // Find the junction closure between segments
    const segment = cableSegments.find(s => s.id === segmentId);
    if (!segment || segment.end_node_type !== 'jc') return;

    const nextSegment = cableSegments.find(s =>
      s.original_cable_id === segment.original_cable_id &&
      s.segment_order === segment.segment_order + 1
    );

    if (!nextSegment) return;

    toast.success('Splice configuration applied successfully');
  };

    // Don't render if no cable is selected
    if (!cableId || cableId === '') {
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Cable Segmentation Management</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please select a cable first
              </p>
            </CardHeader>
            <CardBody>
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  Select an OFC route above to manage its cable segmentation.
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
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Cable Segmentation Management</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Cable: <span className="font-medium">{cableName}</span> (<span className="font-mono">{cableId}</span>)
      </p>
    </CardHeader>
    
    <CardBody className="pt-4">
      <div className="space-y-6">
        {/* Add JC Button */}
        <Button
          onClick={() => setShowAddJCForm(!showAddJCForm)}
          disabled={isLoading}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
        >
          {showAddJCForm ? (
            <span className="flex items-center justify-center">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <Plus className="w-4 h-4 mr-2" />
              Add Junction Closure
            </span>
          )}
        </Button>

        {/* Add JC Form */}
        {showAddJCForm && (
          <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50">
            <CardBody className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Junction Closure Name
                  </label>
                  <input
                    type="text"
                    value={newJCData.name}
                    onChange={(e) => setNewJCData({ ...newJCData, name: e.target.value })}
                    placeholder="JC-001"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Position (km from start)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={newJCData.position_km || ''}
                    onChange={(e) => setNewJCData({ ...newJCData, position_km: parseFloat(e.target.value) || 0 })}
                    placeholder="5.5"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <Button
                  onClick={handleAddJunctionClosure}
                  disabled={isLoading || !newJCData.name || newJCData.position_km <= 0}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Check className="w-4 h-4 mr-2" />
                      Add Junction Closure
                    </span>
                  )}
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Existing Junction Closures */}
        {junctionClosures.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-blue-500" />
              Junction Closures ({junctionClosures.length})
            </h3>
            <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1">
              {junctionClosures.map((jc) => (
                <Card key={jc.node_id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
                  <CardBody className="p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">{jc.name}</h4>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            {jc.position_km} km
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Created: {new Date(jc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded-md">
                        ID: {jc.node_id.slice(0, 8)}...
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Cable Segments */}
        {cableSegments.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Link className="w-5 h-5 mr-2 text-green-500" />
              Cable Segments ({cableSegments.length})
            </h3>
            <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
              {cableSegments.map((segment) => (
                <Card key={segment.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
                  <CardBody className="p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            Segment #{segment.segment_order}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {segment.start_node_type === 'node' ? 'Node' : 'JC'} → {segment.end_node_type === 'node' ? 'Node' : 'JC'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <p>Distance: <span className="font-medium">{segment.distance_km} km</span></p>
                            <p>Fibers: <span className="font-medium">{segment.fiber_count}</span></p>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleApplySplices(segment.id, [])}
                        disabled={isLoading}
                        className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Configure Splices
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty States */}
        {junctionClosures.length === 0 && cableSegments.length === 0 && !showAddJCForm && (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <Info className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No segments yet</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Start by adding a junction closure to create your first cable segment.
            </p>
          </div>
        )}

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
