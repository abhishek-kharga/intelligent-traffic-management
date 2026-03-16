import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export interface Intersection {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  current_signal_state: string;
  created_at: string;
}

export interface TrafficData {
  id: string;
  intersection_id: string;
  vehicle_count: number;
  average_speed: number;
  timestamp: string;
}

export interface AiSuggestion {
  id: string;
  intersection_id: string;
  suggestion_type: string;
  description: string;
  data: any;
  status: string;
  created_at: string;
}

export function useRealtimeTraffic() {
  const [intersections, setIntersections] = useState<Intersection[]>([]);
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchAll = useCallback(async () => {
    const [intersectionsRes, trafficRes, suggestionsRes] = await Promise.all([
      supabase.from("intersections").select("*"),
      supabase.from("traffic_data").select("*").order("timestamp", { ascending: false }).limit(100),
      supabase.from("ai_suggestions").select("*").order("created_at", { ascending: false }).limit(50),
    ]);

    if (intersectionsRes.data) setIntersections(intersectionsRes.data);
    if (trafficRes.data) setTrafficData(trafficRes.data);
    if (suggestionsRes.data) setAiSuggestions(suggestionsRes.data);
    setLoading(false);
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel("realtime-traffic")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "traffic_data" },
        (payload: RealtimePostgresChangesPayload<TrafficData>) => {
          if (payload.eventType === "INSERT") {
            setTrafficData((prev) => [payload.new as TrafficData, ...prev].slice(0, 100));
          } else if (payload.eventType === "UPDATE") {
            setTrafficData((prev) =>
              prev.map((d) => (d.id === (payload.new as TrafficData).id ? (payload.new as TrafficData) : d))
            );
          }
          setLastUpdate(new Date());
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "intersections" },
        (payload: RealtimePostgresChangesPayload<Intersection>) => {
          if (payload.eventType === "INSERT") {
            setIntersections((prev) => [...prev, payload.new as Intersection]);
          } else if (payload.eventType === "UPDATE") {
            setIntersections((prev) =>
              prev.map((i) => (i.id === (payload.new as Intersection).id ? (payload.new as Intersection) : i))
            );
          }
          setLastUpdate(new Date());
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_suggestions" },
        (payload: RealtimePostgresChangesPayload<AiSuggestion>) => {
          if (payload.eventType === "INSERT") {
            setAiSuggestions((prev) => [payload.new as AiSuggestion, ...prev].slice(0, 50));
          } else if (payload.eventType === "UPDATE") {
            setAiSuggestions((prev) =>
              prev.map((s) => (s.id === (payload.new as AiSuggestion).id ? (payload.new as AiSuggestion) : s))
            );
          }
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  const getLatestTraffic = useCallback(
    (intersectionId: string) => trafficData.find((d) => d.intersection_id === intersectionId),
    [trafficData]
  );

  return {
    intersections,
    trafficData,
    aiSuggestions,
    loading,
    lastUpdate,
    getLatestTraffic,
    refetch: fetchAll,
    setAiSuggestions,
  };
}
