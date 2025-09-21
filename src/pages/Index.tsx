import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Car, Shield, BarChart3, Settings, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Car className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">SmartTraffic AI</h1>
          </div>
          <Button onClick={() => navigate("/auth")}>
            Get Started
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Intelligent Traffic
            <span className="text-primary block">Management</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            AI-powered traffic signal optimization for smarter cities. 
            Reduce commute times and improve traffic flow with data-driven decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              <Shield className="h-5 w-5 mr-2" />
              Authority Login
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Car className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Real-Time Monitoring</CardTitle>
              <CardDescription>
                Monitor traffic conditions across city intersections with live data updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Vehicle count tracking</li>
                <li>• Average speed monitoring</li>
                <li>• Signal state visualization</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-primary mb-4" />
              <CardTitle>AI Optimization</CardTitle>
              <CardDescription>
                AI-powered suggestions for optimal signal timing and traffic flow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Intelligent timing adjustments</li>
                <li>• Commute time reduction</li>
                <li>• Traffic pattern analysis</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Settings className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Custom Scenarios</CardTitle>
              <CardDescription>
                Create and test custom traffic scenarios for different conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Rush hour simulations</li>
                <li>• Event traffic planning</li>
                <li>• Weather impact modeling</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Optimize Your City's Traffic?</h3>
            <p className="mb-6 opacity-90">
              Join traffic authorities already using SmartTraffic AI to improve urban mobility
            </p>
            <Button variant="secondary" size="lg" onClick={() => navigate("/auth")}>
              <Shield className="h-5 w-5 mr-2" />
              Access Authority Portal
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;
