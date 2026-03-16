import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { User } from '@supabase/supabase-js';
import { 
  Navigation, 
  Settings, 
  LogOut, 
  MapPin, 
  Car, 
  Timer, 
  CheckCircle, 
  XCircle,
  Clock,
  TrendingUp,
  Radio
} from "lucide-react";

interface Intersection {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  current_signal_state: string;
}

interface TrafficData {
  id: string;
  intersection_id: string;
  vehicle_count: number;
  average_speed: number;
  timestamp: string;
}

interface AiSuggestion {
  id: string;
  intersection_id: string;
  suggestion_type: string;
  description: string;
  data: any;
  status: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [intersections, setIntersections] = useState<Intersection[]>([]);
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Sample commute time data for chart
  const commuteData = [
    { name: 'Main St & Oak Ave', before: 120, after: 95 },
    { name: 'Broadway & 5th St', before: 150, after: 110 },
    { name: 'Park Ave & Central', before: 90, after: 75 },
    { name: 'Elm St & Maple Ave', before: 110, after: 85 },
    { name: 'River Rd & Hill St', before: 135, after: 100 },
  ];

  useEffect(() => {
    checkUser();
    fetchData();
    generateSampleTrafficData();
    generateSampleAiSuggestions();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    setLoading(false);
  };

  const fetchData = async () => {
    try {
      // Fetch intersections
      const { data: intersectionsData, error: intersectionsError } = await supabase
        .from('intersections')
        .select('*');

      if (intersectionsError) throw intersectionsError;
      setIntersections(intersectionsData || []);

      // Fetch latest traffic data for each intersection
      const { data: trafficDataResult, error: trafficError } = await supabase
        .from('traffic_data')
        .select('*')
        .order('timestamp', { ascending: false });

      if (trafficError) throw trafficError;
      setTrafficData(trafficDataResult || []);

    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const generateSampleTrafficData = async () => {
    try {
      const { data: intersectionsData } = await supabase
        .from('intersections')
        .select('id');

      if (intersectionsData) {
        for (const intersection of intersectionsData) {
          const randomVehicleCount = Math.floor(Math.random() * 50) + 10;
          const randomSpeed = (Math.random() * 20 + 25).toFixed(2);

          await supabase
            .from('traffic_data')
            .insert({
              intersection_id: intersection.id,
              vehicle_count: randomVehicleCount,
              average_speed: parseFloat(randomSpeed),
            });
        }
      }
      fetchData();
    } catch (error: any) {
      console.error('Error generating sample data:', error);
    }
  };

  const generateSampleAiSuggestions = async () => {
    try {
      const { data: intersectionsData } = await supabase
        .from('intersections')
        .select('id, name');

      if (intersectionsData && intersectionsData.length > 0) {
        const sampleSuggestions = [
          {
            intersection_id: intersectionsData[0].id,
            suggestion_type: 'signal_timing',
            description: 'Extend green light by 10 seconds during rush hour',
            data: { duration: 10, time_period: 'rush_hour' },
            status: 'pending'
          },
          {
            intersection_id: intersectionsData[1].id,
            suggestion_type: 'signal_timing',
            description: 'Reduce red light duration by 5 seconds',
            data: { duration: -5, signal: 'red' },
            status: 'pending'
          }
        ];

        for (const suggestion of sampleSuggestions) {
          await supabase
            .from('ai_suggestions')
            .insert(suggestion);
        }

        const { data: suggestionsData } = await supabase
          .from('ai_suggestions')
          .select('*')
          .eq('status', 'pending');

        setAiSuggestions(suggestionsData || []);
      }
    } catch (error: any) {
      console.error('Error generating AI suggestions:', error);
    }
  };

  const handleSuggestionAction = async (suggestionId: string, action: 'approve' | 'reject') => {
    try {
      const status = action === 'approve' ? 'approved' : 'rejected';
      
      const { error } = await supabase
        .from('ai_suggestions')
        .update({ status })
        .eq('id', suggestionId);

      if (error) throw error;

      setAiSuggestions(prev => 
        prev.map(s => s.id === suggestionId ? { ...s, status } : s)
      );

      toast({
        title: `Suggestion ${action}d`,
        description: `AI suggestion has been ${action}d successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getLatestTrafficForIntersection = (intersectionId: string) => {
    return trafficData.find(data => data.intersection_id === intersectionId);
  };

  const getSignalColor = (state: string) => {
    switch (state) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Navigation className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">SmartTraffic AI</h1>
              <p className="text-sm text-muted-foreground">Traffic Management Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate("/settings")}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Map Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              City Traffic Overview
            </CardTitle>
            <CardDescription>
              Live view of traffic intersections across the city
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-8 text-center">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium">Interactive Traffic Map</p>
              <p className="text-muted-foreground mb-4">
                5 monitored intersections across the city
              </p>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
                {intersections.map((intersection) => (
                  <div key={intersection.id} className="bg-background rounded-lg p-3 border">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-3 h-3 rounded-full ${getSignalColor(intersection.current_signal_state)}`}></div>
                      <Badge variant="outline" className="text-xs">
                        {intersection.current_signal_state}
                      </Badge>
                    </div>
                    <p className="text-xs font-medium truncate">{intersection.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Traffic Data Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Car className="h-5 w-5 mr-2" />
              Real-Time Traffic Data
            </CardTitle>
            <CardDescription>
              Current vehicle count and average speed at each intersection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Intersection</TableHead>
                  <TableHead>Signal State</TableHead>
                  <TableHead>Vehicle Count</TableHead>
                  <TableHead>Avg Speed (mph)</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {intersections.map((intersection) => {
                  const traffic = getLatestTrafficForIntersection(intersection.id);
                  return (
                    <TableRow key={intersection.id}>
                      <TableCell className="font-medium">{intersection.name}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={intersection.current_signal_state === 'green' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {intersection.current_signal_state}
                        </Badge>
                      </TableCell>
                      <TableCell>{traffic?.vehicle_count || 0}</TableCell>
                      <TableCell>{traffic?.average_speed || 0}</TableCell>
                      <TableCell>
                        {traffic ? new Date(traffic.timestamp).toLocaleTimeString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Charts and AI Suggestions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Commute Time Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Commute Time Comparison
              </CardTitle>
              <CardDescription>
                Before and after AI optimization (seconds)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={commuteData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      fontSize={12}
                      tick={{ fontSize: 10 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="before" fill="hsl(var(--muted-foreground))" name="Before" />
                    <Bar dataKey="after" fill="hsl(var(--primary))" name="After AI" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                AI Suggestions
              </CardTitle>
              <CardDescription>
                AI-recommended signal timing adjustments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiSuggestions.length > 0 ? (
                aiSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{suggestion.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Type: {suggestion.suggestion_type}
                        </p>
                      </div>
                      <Badge 
                        variant={suggestion.status === 'pending' ? 'default' : 'secondary'}
                        className="ml-2"
                      >
                        {suggestion.status}
                      </Badge>
                    </div>
                    {suggestion.status === 'pending' && (
                      <div className="flex space-x-2 mt-3">
                        <Button 
                          size="sm" 
                          onClick={() => handleSuggestionAction(suggestion.id, 'approve')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSuggestionAction(suggestion.id, 'reject')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No AI suggestions available
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;