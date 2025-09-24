
- **Now, Let us see what we want to implement/achieve.**

Suppose We are having a cable A-B of capacity 4 fiber and distance 2.4 Km. Then its ofc connections can be as in below picture.

![wo_jc_cable](wo_jc_cable.png)

Initially ofc connections will have a default segment path and initial starting and ending node as ofc cable.
Now if JC is added in-between, then fibers(ofc connections) will breaks at that JC and two new segments will be created with parent segment as initial one. Initial fiber length for the segments will also get updated

![JC1](JC1.png)

- Now lets see cases of splicing

- Case 1: Straight joint to all fibers at JC. This will result in no change in connection_sn,connection_en and Fiber numbers of the ofc_connections as shown below

![JC1_straight](JC1_straight.png)

- Case 2: Cross joint between fibers at JC. This will result in no change in connection_sn,connection_en but change in Fiber numbers of the ofc_connections as shown below

![JC1_crossed](JC1_crossed.png)

Here end to end fiber numbers in ofc_connections table will change as

|  connection_sn Fiber Number |  connection_en fiber number |
|---|---|
|  1 |  2 |
|  2 |  3 |
|  3 |  1 |
|  4 |  4 |

- Case 3: If same JC introduced on another cable, then two segments will be created for that also. For example, say there are two cables X-Y (capacity 4) and A-B (capacity 2). then segments will be

![JC1_unspliced_two_cables](JC1_unspliced_two_cables.png)

Lets assume that splicing is as below:

![JC1_spliced_two_cables](JC1_spliced_two_cables.png)

so, here will be end to end fiber numbers in ofc_connections tables

ofc connections table for X-Y

|  connection_sn |  connection_sn fiber number |  connection_en |  connection_en fiber number |
|---|---|---|---|
|  X |  1 |  A |  1 |
|  X |  2 |  B |  2 |
|  X |  3 |  Y |  1 |
|  X |  4 |  Y |  4 |
|   |   |  Y |  3 |

ofc connections table for A-B

|  connection_sn |  connection_sn fiber number |  connection_en |  connection_en fiber number |
|---|---|---|---|
|  A |  1 |  X |  1 |
|  A |  2 |   |   |
|  Y |  2 |  B |  1 |
|  X |  2 |  B |  2 |

I have shown only on JC, there can be many JCs with different situations.

![many_JCs](many_JCs.png)

Planned change (concise)

Segment discovery at JC
Query all cable_segments where start_node_type = 'jc' AND start_node_id IN (related JC ids) OR end_node_type = 'jc' AND end_node_id IN (related JC ids).
Build segmentOptions = [{id, label: <cable name> • Seg <segment_order>, fiber_count}].
UI
Two dropdowns: Incoming Segment, Outgoing Segment.
Rows = min(incomingSegment.fiber_count, outgoingSegment.fiber_count). Capacity checks use the selected segments.
For each row: Splice Type (straight/cross) + Outgoing Fiber number.
Remove cable-level controls (keep only as fallback when segments are not discoverable).
Save logic
Use existing RPC already in your code: update_fiber_connections(jcId, incomingSegmentId, outgoingSegmentId, spliceConfig[]) from 
useCableSegmentation
.
Build spliceConfig[] from table rows: {incoming_fiber_no, outgoing_fiber_no, splice_type}.
Validation
Clamp outgoing fiber number to outgoing segment’s fiber_count.
Prevent duplicate outgoing fiber mappings within the same JC + outgoing segment.
What this changes in code

components/route-manager/FiberSpliceManager.tsx
Replace cable-based selectors with segment-based selectors.
Compute maxFibers from selected segments.
On Apply, call updateFiberConnections(junctionClosureId, incomingSegmentId, outgoingSegmentId, spliceConfig).
No DB migration required (we’re reusing your stored procedure and cable_segments).

Splicing should be defined between cable segments meeting at a JC, not between whole cables. I will refactor FiberSpliceManager to be segment-based. Because the change is broader, I’ll implement it in small, safe steps to avoid timeouts.

Planned refactor (segment-based splicing)

Data
Build segment options at the selected JC:
Query cable_segments where:
start_node_type = 'jc' AND start_node_id IN related JC ids
OR end_node_type = 'jc' AND end_node_id IN related JC ids
Produce segmentOptions: [{ id, label: " • Seg <segment_order>", fiber_count, original_cable_id }]
UI
Add two dropdowns:
Incoming Segment
Outgoing Segment
Rows = min(incoming.fiber_count, outgoing.fiber_count)
Per-row:
Splice type: straight/cross
Outgoing fiber number
Validation:
Clamp outgoing fiber to outgoing segment’s fiber_count
Prevent duplicate outgoing fiber reuse on same JC + outgoing segment
Save
Use existing RPC from useCableSegmentation: update_fiber_connections(jcId, incomingSegmentId, outgoingSegmentId, spliceConfig[])
spliceConfig[] = per-row {incoming_fiber_no, outgoing_fiber_no, splice_type}
Next steps I’ll take now

Add segment discovery and segment selectors in FiberSpliceManager.tsx
Compute rows from selected segments
Wire “Apply” to update_fiber_connections
Keep the UI simple and focused on segments (remove the cable pickers you’ve seen earlier)

