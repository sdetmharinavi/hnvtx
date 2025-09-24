// components/ofc/CableSegmentationManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/common/ui';
import { Card, CardHeader, CardBody } from '@/components/common/ui';
import { useCableSegmentation, JunctionClosure, CableSegment, SpliceConfiguration } from '@/hooks/ofc/useCableSegmentation';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

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
    updateFiberConnections,
  } = useCableSegmentation();

  // Load existing junction closures and segments
  useEffect(() => {
    loadExistingData();
  }, [cableId]);

  const loadExistingData = async () => {
    try {
      // Load junction closures
      const { data, error: insertError } = await supabase
        .rpc('add_junction_closure', {
          p_ofc_cable_id: cableId,
          p_position_km: newJCData.position_km,
          p_name: newJCData.name
        });
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
    } catch (err: any) {
      toast.error(`Failed to load data: ${err.message}`);
    }
  };

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

    await updateFiberConnections(
      segment.end_node_id,
      segmentId,
      nextSegment.id,
      spliceConfig
    );

    toast.success('Splice configuration applied successfully');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Cable Segmentation Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Cable: {cableName} ({cableId})
          </p>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {/* Add JC Button */}
            <Button
              onClick={() => setShowAddJCForm(!showAddJCForm)}
              disabled={isLoading}
              className="w-full"
            >
              {showAddJCForm ? 'Cancel' : 'Add Junction Closure'}
            </Button>

            {/* Add JC Form */}
            {showAddJCForm && (
              <Card className="border-2 border-dashed">
                <CardBody className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Junction Closure Name
                      </label>
                      <input
                        type="text"
                        value={newJCData.name}
                        onChange={(e) => setNewJCData({ ...newJCData, name: e.target.value })}
                        placeholder="JC-001"
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Position (km from start)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={newJCData.position_km || ''}
                        onChange={(e) => setNewJCData({ ...newJCData, position_km: parseFloat(e.target.value) || 0 })}
                        placeholder="5.5"
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    <Button
                      onClick={handleAddJunctionClosure}
                      disabled={isLoading || !newJCData.name || newJCData.position_km <= 0}
                      className="w-full"
                    >
                      {isLoading ? 'Adding...' : 'Add Junction Closure'}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Existing Junction Closures */}
            {junctionClosures.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Junction Closures</h3>
                <div className="space-y-2">
                  {junctionClosures.map((jc) => (
                    <Card key={jc.node_id}>
                      <CardBody className="pt-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{jc.name}</h4>
                            <p className="text-sm text-gray-600">
                              Position: {jc.position_km} km
                            </p>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(jc.created_at).toLocaleDateString()}
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
                <h3 className="text-lg font-semibold mb-3">Cable Segments</h3>
                <div className="space-y-2">
                  {cableSegments.map((segment) => (
                    <Card key={segment.id}>
                      <CardBody className="pt-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">Segment #{segment.segment_order}</h4>
                            <p className="text-sm text-gray-600">
                              {segment.start_node_type === 'node' ? 'Node' : 'JC'} →
                              {segment.end_node_type === 'node' ? 'Node' : 'JC'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Distance: {segment.distance_km} km, Fibers: {segment.fiber_count}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleApplySplices(segment.id, [])}
                            disabled={isLoading}
                          >
                            Configure Splices
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            )}

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
