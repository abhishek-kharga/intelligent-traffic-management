import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User } from '@supabase/supabase-js';
import { 
  ArrowLeft, 
  Settings as SettingsIcon, 
  Save, 
  Plus,
  Trash2,
  Clock,
  Users,
  TrendingUp
} from "lucide-react";

interface TrafficScenario {
  id: string;
  name: string;
  description: string;
  scenario_data: any;
  created_at: string;
}

const Settings = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [scenarios, setScenarios] = useState<TrafficScenario[]>([]);
  const [newScenario, setNewScenario] = useState({
    name: "",
    description: "",
    vehicleCount: "",
    peakHours: "",
    avgSpeed: ""
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
    fetchScenarios();
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

  const fetchScenarios = async () => {
    try {
      const { data, error } = await supabase
        .from('traffic_scenarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScenarios(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching scenarios",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      const scenarioData = {
        vehicle_count: parseInt(newScenario.vehicleCount) || 0,
        peak_hours: newScenario.peakHours,
        average_speed: parseFloat(newScenario.avgSpeed) || 0,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('traffic_scenarios')
        .insert({
          user_id: user.id,
          name: newScenario.name,
          description: newScenario.description,
          scenario_data: scenarioData
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Traffic scenario created successfully!",
      });

      setNewScenario({
        name: "",
        description: "",
        vehicleCount: "",
        peakHours: "",
        avgSpeed: ""
      });

      fetchScenarios();
    } catch (error: any) {
      toast({
        title: "Error creating scenario",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteScenario = async (scenarioId: string) => {
    try {
      const { error } = await supabase
        .from('traffic_scenarios')
        .delete()
        .eq('id', scenarioId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Scenario deleted successfully!",
      });

      fetchScenarios();
    } catch (error: any) {
      toast({
        title: "Error deleting scenario",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading settings...</p>
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
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground">Configure traffic scenarios and preferences</p>
            </div>
          </div>
          <SettingsIcon className="h-8 w-8 text-primary" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Create New Scenario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Create Traffic Scenario
            </CardTitle>
            <CardDescription>
              Define custom traffic scenarios for testing and optimization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateScenario} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scenarioName">Scenario Name</Label>
                  <Input
                    id="scenarioName"
                    placeholder="e.g., Rush Hour Traffic"
                    value={newScenario.name}
                    onChange={(e) => setNewScenario({ ...newScenario, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="peakHours">Peak Hours</Label>
                  <Select 
                    value={newScenario.peakHours} 
                    onValueChange={(value) => setNewScenario({ ...newScenario, peakHours: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select peak hours" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7:00-9:00">7:00 AM - 9:00 AM</SelectItem>
                      <SelectItem value="12:00-14:00">12:00 PM - 2:00 PM</SelectItem>
                      <SelectItem value="17:00-19:00">5:00 PM - 7:00 PM</SelectItem>
                      <SelectItem value="custom">Custom Hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleCount">Expected Vehicle Count</Label>
                  <Input
                    id="vehicleCount"
                    type="number"
                    placeholder="e.g., 150"
                    value={newScenario.vehicleCount}
                    onChange={(e) => setNewScenario({ ...newScenario, vehicleCount: e.target.value })}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avgSpeed">Average Speed (mph)</Label>
                  <Input
                    id="avgSpeed"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 25.5"
                    value={newScenario.avgSpeed}
                    onChange={(e) => setNewScenario({ ...newScenario, avgSpeed: e.target.value })}
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the traffic scenario conditions..."
                  value={newScenario.description}
                  onChange={(e) => setNewScenario({ ...newScenario, description: e.target.value })}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Scenario
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle>Saved Traffic Scenarios</CardTitle>
            <CardDescription>
              Manage your custom traffic scenarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scenarios.length > 0 ? (
              <div className="space-y-4">
                {scenarios.map((scenario) => (
                  <div key={scenario.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{scenario.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{scenario.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-primary" />
                            <span>Vehicles: {scenario.scenario_data?.vehicle_count || 0}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <span>Speed: {scenario.scenario_data?.average_speed || 0} mph</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>Peak: {scenario.scenario_data?.peak_hours || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteScenario(scenario.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No traffic scenarios created yet</p>
                <p className="text-sm text-muted-foreground">Create your first scenario above to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>
              Current system status and configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>User Email</Label>
                <Input value={user?.email || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Input value="Traffic Authority" disabled />
              </div>
              <div className="space-y-2">
                <Label>System Status</Label>
                <Input value="Active" disabled className="text-green-600" />
              </div>
              <div className="space-y-2">
                <Label>Last Login</Label>
                <Input value={new Date().toLocaleDateString()} disabled />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
