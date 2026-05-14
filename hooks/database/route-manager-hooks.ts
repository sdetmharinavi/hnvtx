// hooks/database/route-manager-hooks.ts
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { z } from "zod";
import {
  jcSplicingDetailsSchema,
  JcSplicingDetails,
  ofcForSelectionSchema,
  OfcForSelection,
  routeDetailsPayloadSchema,
  RouteDetailsPayload,
  JointBox,
} from "@/schemas/custom-schemas";
import { localDb } from "@/hooks/data/localDb";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

const supabase = createClient();

export function useOfcRoutesForSelection() {
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: ["ofc-routes-for-selection"],
    queryFn: async (): Promise<OfcForSelection[]> => {
      if (isOnline) {
        try {
          const { data, error } = await supabase
            .from("ofc_cables")
            .select("id, route_name, capacity, ofc_connections(id)")
            .order("route_name", { ascending: true })
            .limit(5000);

          if (error) throw error;
          const parsed = z.array(ofcForSelectionSchema).safeParse(data);
          if (parsed.success) return parsed.data;
        } catch (err) {
          console.warn(
            "Online route fetch failed, falling back to local:",
            err,
          );
        }
      }

      const cables = await localDb.ofc_cables.orderBy("route_name").toArray();
      return cables.map((c) => ({
        id: c.id,
        route_name: c.route_name,
        capacity: c.capacity,
        ofc_connections: [],
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRouteDetails(routeId: string | null) {
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: ["route-details", routeId],
    queryFn: async (): Promise<RouteDetailsPayload | null> => {
      if (!routeId) return null;

      if (isOnline) {
        try {
          const res = await fetch(`/api/route/${routeId}`, {
            cache: "no-store",
          });
          if (res.ok) {
            const data = await res.json();
            const parsed = routeDetailsPayloadSchema.safeParse(data);
            if (parsed.success) return parsed.data;
          }
        } catch (err) {
          console.warn(
            "API route details fetch failed, falling back to local:",
            err,
          );
        }
      }

      try {
        const routeData = await localDb.v_ofc_cables_complete.get(routeId);
        if (!routeData) return null;

        const jcData = await localDb.junction_closures
          .where("ofc_cable_id")
          .equals(routeId)
          .toArray();
        const nodesData = await localDb.nodes.toArray();
        const nodeMap = new Map(nodesData.map((n) => [n.id, n]));

        const segmentsData = await localDb.cable_segments
          .where("original_cable_id")
          .equals(routeId)
          .sortBy("segment_order");

        const jointBoxes: JointBox[] = jcData.map((jc) => {
          const node = nodeMap.get(jc.node_id);
          return {
            ...jc,
            created_at: jc.created_at || null,
            updated_at: jc.updated_at || null,
            node: { name: node?.name || "Unknown Node" },
            status: "existing",
            attributes: {
              position_on_route:
                ((jc.position_km || 0) / (routeData.current_rkm || 1)) * 100,
              name: node?.name || undefined,
            },
          };
        });

        const evolutionStatus =
          segmentsData.length > 1
            ? "fully_segmented"
            : jointBoxes.length > 0
              ? "with_jcs"
              : "simple";

        return {
          route: {
            ...routeData,
            start_site: { id: routeData.sn_id, name: routeData.sn_name },
            end_site: { id: routeData.en_id, name: routeData.en_name },
            evolution_status: evolutionStatus as
              | "simple"
              | "with_jcs"
              | "fully_segmented",
          },
          jointBoxes,
          segments: segmentsData,
          splices: [],
        };
      } catch (err) {
        console.error("Local DB fetch failed for route details:", err);
        return null;
      }
    },
    enabled: !!routeId,
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });
}

export function useJcSplicingDetails(jcId: string | null) {
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: ["jc-splicing-details", jcId],
    queryFn: async (): Promise<JcSplicingDetails | null> => {
      if (!jcId) return null;

      if (isOnline) {
        try {
          const { data, error } = await supabase.rpc(
            "get_jc_splicing_details",
            { p_jc_id: jcId },
          );
          if (!error && data) {
            const parsed = jcSplicingDetailsSchema.safeParse(data);
            if (parsed.success) return parsed.data;
          }
        } catch (err) {
          console.warn(
            "RPC splicing details fetch failed, falling back to local:",
            err,
          );
        }
      }

      try {
        const jc = await localDb.junction_closures.get(jcId);
        if (!jc) return null;

        const jcNode = await localDb.nodes.get(jc.node_id);
        if (!jcNode) return null;

        const allSegments = await localDb.cable_segments.toArray();
        const connectedSegments = allSegments.filter(
          (s) => s.start_node_id === jc.node_id || s.end_node_id === jc.node_id,
        );

        const cableIds = [
          ...new Set(connectedSegments.map((s) => s.original_cable_id)),
        ];
        const cables = await localDb.ofc_cables
          .where("id")
          .anyOf(cableIds)
          .toArray();
        const cableMap = new Map(cables.map((c) => [c.id, c]));

        const splices = await localDb.fiber_splices
          .where("jc_id")
          .equals(jcId)
          .toArray();

        const segmentsPayload: any[] = connectedSegments.map((seg) => {
          const cable = cableMap.get(seg.original_cable_id);
          const segName = cable
            ? `${cable.route_name} (Seg ${seg.segment_order})`
            : `Segment ${seg.id}`;

          const fibers = [];
          for (let i = 1; i <= seg.fiber_count; i++) {
            const spliceAsIncoming = splices.find(
              (s) =>
                s.incoming_segment_id === seg.id && s.incoming_fiber_no === i,
            );
            const spliceAsOutgoing = splices.find(
              (s) =>
                s.outgoing_segment_id === seg.id && s.outgoing_fiber_no === i,
            );

            let status = "available";
            let spliceId = null;
            let connectedToSeg = null;
            let connectedToFib = null;
            let loss = null;

            if (spliceAsIncoming) {
              status = "used_as_incoming";
              spliceId = spliceAsIncoming.id;
              const otherSeg = allSegments.find(
                (s) => s.id === spliceAsIncoming.outgoing_segment_id,
              );
              const otherCable = otherSeg
                ? cableMap.get(otherSeg.original_cable_id)
                : null;
              connectedToSeg = otherCable
                ? `${otherCable.route_name} (Seg ${otherSeg?.segment_order})`
                : "Unknown";
              connectedToFib = spliceAsIncoming.outgoing_fiber_no;
              loss = spliceAsIncoming.loss_db;
            } else if (spliceAsOutgoing) {
              status = "used_as_outgoing";
              spliceId = spliceAsOutgoing.id;
              const otherSeg = allSegments.find(
                (s) => s.id === spliceAsOutgoing.incoming_segment_id,
              );
              const otherCable = otherSeg
                ? cableMap.get(otherSeg.original_cable_id)
                : null;
              connectedToSeg = otherCable
                ? `${otherCable.route_name} (Seg ${otherSeg?.segment_order})`
                : "Unknown";
              connectedToFib = spliceAsOutgoing.incoming_fiber_no;
              loss = spliceAsOutgoing.loss_db;
            }

            fibers.push({
              fiber_no: i,
              status,
              splice_id: spliceId,
              connected_to_segment: connectedToSeg,
              connected_to_fiber: connectedToFib,
              loss_db: loss,
            });
          }

          return {
            segment_id: seg.id,
            segment_name: segName,
            fiber_count: seg.fiber_count,
            distance_km: seg.distance_km,
            fibers: fibers,
          };
        });

        return {
          junction_closure: { id: jc.id, name: jcNode.name },
          segments_at_jc: segmentsPayload,
        };
      } catch (err) {
        console.error("Local DB splicing details build failed:", err);
        return null;
      }
    },
    enabled: !!jcId,
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });
}
