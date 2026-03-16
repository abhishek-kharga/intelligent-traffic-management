import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeTraffic } from "@/hooks/use-realtime-traffic";
import { SignalIndicator } from "@/components/traffic/SignalIndicator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Activity,
  Radio,
  Car,
  Gauge,
  Clock,
  AlertTriangle,
  RefreshCw,
  Wifi,
} from "lucide-react";

const Monitoring = () => {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const {
    intersections,
    trafficData,
    aiSuggestions,
    loading,
    lastUpdate,
    getLatestTraffic,
    refetch,
  } = useRealtimeTraffic();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setAuthenticated(true);
      }
    });
  }, [navigate]);

  if (!authenticated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Connecting to live feed…</p>
        </div>
      </div>
    );
  }

  // Derived stats
  const totalVehicles = intersections.reduce((sum, i) => {
    const t = getLatestTraffic(i.id);
    return sum + (t?.vehicle_count ?? 0);
  }, 0);

  const avgSpeed =
    intersections.length > 0
      ? intersections.reduce((sum, i) => {
          const t = getLatestTraffic(i.id);
          return sum + (t?.average_speed ?? 0);
        }, 0) / intersections.length
      : 0;

  const pendingSuggestions = aiSuggestions.filter((s) => s.status === "pending").length;
  const congested = intersections.filter((i) => {
    const t = getLatestTraffic(i.id);
    return t && t.vehicle_count > 35;
  });

  // Recent activity feed – last 8 traffic data entries
  const recentActivity = trafficData.slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Radio className="h-6 w-6 text-primary animate-pulse" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Live Traffic Monitoring</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Wifi className="h-3 w-3 text-signal-green" />
                Realtime · Last update {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Activity className="h-3.5 w-3.5" />
                Intersections
              </div>
              <p className="text-2xl font-bold text-foreground">{intersections.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Car className="h-3.5 w-3.5" />
                Total Vehicles
              </div>
              <p className="text-2xl font-bold text-foreground">{totalVehicles}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Gauge className="h-3.5 w-3.5" />
                Avg Speed
              </div>
              <p className="text-2xl font-bold text-foreground">{avgSpeed.toFixed(1)} mph</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Congested
              </div>
              <p className="text-2xl font-bold text-destructive">{congested.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Live intersection grid */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary" />
              Live Intersection Status
            </CardTitle>
            <CardDescription>Real-time signal states and traffic density</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {intersections.map((intersection) => {
                const traffic = getLatestTraffic(intersection.id);
                const density = traffic ? Math.min((traffic.vehicle_count / 50) * 100, 100) : 0;
                const isCongested = density > 70;

                return (
                  <div
                    key={intersection.id}
                    className={`rounded-lg border p-4 transition-colors ${
                      isCongested ? "border-destructive/40 bg-destructive/5" : "bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <SignalIndicator state={intersection.current_signal_state} size="lg" />
                        <span className="font-medium text-sm text-foreground truncate max-w-[140px]">
                          {intersection.name}
                        </span>
                      </div>
                      <Badge variant={isCongested ? "destructive" : "secondary"} className="text-xs capitalize">
                        {intersection.current_signal_state}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Density</span>
                        <span>{density.toFixed(0)}%</span>
                      </div>
                      <Progress value={density} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Car className="h-3 w-3" />
                        <span className="text-foreground font-medium">
                          {traffic?.vehicle_count ?? 0}
                        </span>
                        vehicles
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Gauge className="h-3 w-3" />
                        <span className="text-foreground font-medium">
                          {traffic?.average_speed?.toFixed(1) ?? 0}
                        </span>
                        mph
                      </div>
                    </div>
                  </div>
                );
              })}

              {intersections.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No intersections configured yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed & Pending Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Feed */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Live Activity Feed
              </CardTitle>
              <CardDescription>Latest traffic data updates in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {recentActivity.map((entry) => {
                  const intersection = intersections.find((i) => i.id === entry.intersection_id);
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <SignalIndicator
                          state={intersection?.current_signal_state ?? "muted"}
                          size="sm"
                          pulse={false}
                        />
                        <span className="font-medium text-foreground truncate max-w-[160px]">
                          {intersection?.name ?? "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{entry.vehicle_count} vehicles</span>
                        <span>{entry.average_speed.toFixed(1)} mph</span>
                        <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  );
                })}
                {recentActivity.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground">No activity yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending AI Suggestions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                Pending Suggestions
                {pendingSuggestions > 0 && (
                  <Badge variant="default" className="ml-auto text-xs">
                    {pendingSuggestions}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>AI-recommended changes awaiting review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {aiSuggestions
                  .filter((s) => s.status === "pending")
                  .map((suggestion) => {
                    const intersection = intersections.find(
                      (i) => i.id === suggestion.intersection_id
                    );
                    return (
                      <div
                        key={suggestion.id}
                        className="rounded-md border px-3 py-2 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">
                            {suggestion.description}
                          </span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {suggestion.suggestion_type.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {intersection?.name ?? "Unknown intersection"}
                        </p>
                      </div>
                    );
                  })}
                {pendingSuggestions === 0 && (
                  <p className="text-center py-4 text-muted-foreground">All clear — no pending suggestions</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;
