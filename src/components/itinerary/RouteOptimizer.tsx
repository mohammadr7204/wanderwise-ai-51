import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, 
  Clock, 
  Users, 
  Zap, 
  Navigation, 
  Coffee,
  Utensils,
  Camera,
  AlertTriangle,
  Download,
  RefreshCw,
  Route,
  Timer,
  Gauge,
  Car,
  Train,
  Footprints
} from 'lucide-react';

interface Activity {
  id: string;
  name: string;
  location: string;
  coordinates?: [number, number];
  openingHours: string;
  estimatedDuration: number; // in minutes
  category: 'attraction' | 'restaurant' | 'activity' | 'transport';
  crowdLevel: 'low' | 'medium' | 'high';
  energyRequired: 'low' | 'medium' | 'high';
  weatherDependent: boolean;
  priority: number; // 1-5, 5 being highest
  travelTimes?: number[];
  suggestedTimes?: string[];
  notes?: string;
}

interface RouteOptimization {
  optimizedOrder: Activity[];
  totalWalkingTime: number;
  totalDuration: number;
  energyDistribution: string;
  suggestions: string[];
  breaks: BreakSuggestion[];
  transportationOptions?: TransportationOption[];
  realTravelTimes?: boolean;
}

interface TransportationOption {
  from: string;
  to: string;
  mode: 'walking' | 'transit' | 'rideshare';
  duration?: string;
  distance?: string;
  estimatedCost?: string;
  instructions?: string[];
  note?: string;
}

interface BreakSuggestion {
  time: string;
  type: 'rest' | 'food' | 'bathroom';
  location: string;
  reason: string;
  duration?: number;
}

interface RouteOptimizerProps {
  tripData: any;
  dayActivities?: Activity[];
}

const RouteOptimizer = ({ tripData, dayActivities = [] }: RouteOptimizerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [activities, setActivities] = useState<Activity[]>(dayActivities);
  const [optimization, setOptimization] = useState<RouteOptimization | null>(null);
  const [startTime, setStartTime] = useState('09:00');
  const [energyLevel, setEnergyLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [includeBreaks, setIncludeBreaks] = useState(true);
  const [weatherBackup, setWeatherBackup] = useState(true);
  const [mapboxToken, setMapboxToken] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize with activities from itinerary data if available
    if (activities.length === 0) {
      loadActivitiesFromItinerary();
    }
  }, [tripData]);

  const loadActivitiesFromItinerary = () => {
    const formData = tripData?.form_data || tripData?.formData || {};
    const destinations = formData.specificDestinations || [];
    const destination = destinations[0] || formData.destination || '';
    const interests = formData.interests || formData.activityTypes || [];
    
    // Create activities based on actual trip preferences
    const generatedActivities: Activity[] = [];
    
    // Add activities based on user interests
    if (interests.includes('cultural')) {
      generatedActivities.push({
        id: '1',
        name: `${destination} Historical Center`,
        location: 'City Center',
        openingHours: '09:00-17:00',
        estimatedDuration: 120,
        category: 'attraction',
        crowdLevel: 'medium',
        energyRequired: 'low',
        weatherDependent: false,
        priority: 1
      });
      
      generatedActivities.push({
        id: '2',
        name: `${destination} Local Market`,
        location: 'Market District',
        openingHours: '08:00-14:00',
        estimatedDuration: 90,
        category: 'attraction',
        crowdLevel: 'high',
        energyRequired: 'medium',
        weatherDependent: false,
        priority: 2
      });
    }
    
    if (interests.includes('nature') || interests.includes('adventure')) {
      generatedActivities.push({
        id: '3',
        name: `${destination} Nature Trail`,
        location: 'Natural Area',
        openingHours: '06:00-18:00',
        estimatedDuration: 180,
        category: 'activity',
        crowdLevel: 'low',
        energyRequired: 'high',
        weatherDependent: true,
        priority: 1
      });
      
      generatedActivities.push({
        id: '4',
        name: `${destination} Scenic Viewpoint`,
        location: 'Elevated Area',
        openingHours: '06:00-20:00',
        estimatedDuration: 60,
        category: 'attraction',
        crowdLevel: 'medium',
        energyRequired: 'medium',
        weatherDependent: true,
        priority: 1
      });
    }
    
    if (interests.includes('food') || interests.includes('culinary')) {
      generatedActivities.push({
        id: '5',
        name: `${destination} Food District`,
        location: 'Culinary Quarter',
        openingHours: '11:00-22:00',
        estimatedDuration: 120,
        category: 'restaurant',
        crowdLevel: 'high',
        energyRequired: 'low',
        weatherDependent: false,
        priority: 1
      });
    }
    
    // Default activities if no specific interests
    if (generatedActivities.length === 0) {
      generatedActivities.push(
        {
          id: '1',
          name: `${destination} Main Attraction`,
          location: 'City Center',
          openingHours: '09:00-17:00',
          estimatedDuration: 120,
          category: 'attraction',
          crowdLevel: 'medium',
          energyRequired: 'low',
          weatherDependent: false,
          priority: 1
        },
        {
          id: '2',
          name: `${destination} Walking Area`,
          location: 'Historic District',
          openingHours: '08:00-20:00',
          estimatedDuration: 90,
          category: 'activity',
          crowdLevel: 'medium',
          energyRequired: 'medium',
          weatherDependent: false,
          priority: 2
        }
      );
    }
    
    setActivities(generatedActivities);
  };

  const optimizeRoute = async () => {
    setLoading(true);
    
    try {
      const formData = tripData?.form_data || tripData?.formData || {};
      const destinations = formData.specificDestinations || [];
      const destination = destinations[0] || formData.destination || '';
      const tripStartDate = new Date(formData.startDate || Date.now());
      const tripDay = Math.ceil((Date.now() - tripStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const { data, error } = await supabase.functions.invoke('get-route-optimization', {
        body: {
          activities,
          startTime,
          energyLevel,
          includeBreaks,
          weatherBackup,
          destination,
          tripDay
        }
      });

      if (error) {
        console.error('Route optimization error:', error);
        // Fallback to local optimization
        const optimized = performRouteOptimization();
        setOptimization(optimized);
      } else {
        setOptimization(data);
      }
    } catch (error) {
      console.error('Failed to optimize route:', error);
      // Fallback to local optimization
      const optimized = performRouteOptimization();
      setOptimization(optimized);
    } finally {
      setLoading(false);
    }
  };

  const performRouteOptimization = (): RouteOptimization => {
    // Sort activities by priority and optimize based on constraints
    let optimizedActivities = [...activities];
    
    // Algorithm considerations:
    // 1. Opening hours constraints
    // 2. Energy level distribution
    // 3. Crowd avoidance
    // 4. Geographic proximity
    // 5. Weather dependency
    
    // Sort by priority first, then apply constraints
    optimizedActivities.sort((a, b) => {
      // Morning: prioritize weather-dependent and crowd-sensitive activities
      if (a.weatherDependent && !b.weatherDependent) return -1;
      if (!a.weatherDependent && b.weatherDependent) return 1;
      
      // Prefer low-crowd activities early
      if (a.crowdLevel === 'low' && b.crowdLevel !== 'low') return -1;
      if (a.crowdLevel !== 'low' && b.crowdLevel === 'low') return 1;
      
      return b.priority - a.priority;
    });

    // Calculate metrics
    const totalWalkingTime = optimizedActivities.length * 15; // Estimate 15 min between activities
    const totalDuration = optimizedActivities.reduce((sum, act) => sum + act.estimatedDuration, 0);
    
    // Generate break suggestions
    const breaks: BreakSuggestion[] = [];
    let currentTime = new Date(`2024-01-01 ${startTime}`);
    
    optimizedActivities.forEach((activity, index) => {
      currentTime.setMinutes(currentTime.getMinutes() + activity.estimatedDuration);
      
      // Suggest breaks every 3 hours or after high-energy activities
      if (index > 0 && (index % 2 === 0 || activity.energyRequired === 'high')) {
        breaks.push({
          time: currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          type: index % 3 === 0 ? 'food' : 'rest',
          location: 'Nearby cafe or rest area',
          reason: activity.energyRequired === 'high' ? 'After high-energy activity' : 'Regular break interval'
        });
      }
      
      currentTime.setMinutes(currentTime.getMinutes() + 15); // Travel time
    });

    const suggestions = [
      'Start early to avoid crowds at popular attractions',
      'Visit outdoor activities first in case of weather changes',
      'Schedule meals during restaurant opening hours',
      'Keep high-energy activities for when you\'re fresh',
      'Have backup indoor options for weather-dependent activities'
    ];

    return {
      optimizedOrder: optimizedActivities,
      totalWalkingTime,
      totalDuration,
      energyDistribution: getEnergyDistribution(optimizedActivities),
      suggestions,
      breaks
    };
  };

  const getEnergyDistribution = (activities: Activity[]): string => {
    const energyCounts = activities.reduce((acc, act) => {
      acc[act.energyRequired] = (acc[act.energyRequired] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return `${energyCounts.high || 0} high, ${energyCounts.medium || 0} medium, ${energyCounts.low || 0} low energy activities`;
  };

  const getCrowdColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEnergyColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportOptimizedRoute = () => {
    if (!optimization) return;
    
    const routeData = {
      date: new Date().toLocaleDateString(),
      startTime,
      activities: optimization.optimizedOrder.map((activity, index) => ({
        order: index + 1,
        time: calculateActivityTime(index),
        name: activity.name,
        location: activity.location,
        duration: `${activity.estimatedDuration} minutes`,
        notes: activity.weatherDependent ? 'Weather dependent' : ''
      })),
      breaks: optimization.breaks,
      totalTime: `${Math.floor(optimization.totalDuration / 60)}h ${optimization.totalDuration % 60}m`,
      walkingTime: `${optimization.totalWalkingTime} minutes`
    };
    
    const blob = new Blob([JSON.stringify(routeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'optimized-route.json';
    link.click();
  };

  const calculateActivityTime = (index: number): string => {
    let totalMinutes = 0;
    const [hours, minutes] = startTime.split(':').map(Number);
    totalMinutes = hours * 60 + minutes;
    
    if (optimization) {
      for (let i = 0; i < index; i++) {
        totalMinutes += optimization.optimizedOrder[i].estimatedDuration + 15; // 15 min travel
      }
    }
    
    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  };

  const formData = tripData?.form_data || tripData?.formData || {};
  const destinations = formData.specificDestinations || [];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Route Optimizer</h2>
        <p className="text-muted-foreground">
          Intelligent route planning for {destinations[0] || formData.destination || 'your destination'} considering opening hours, crowds, energy levels, and weather
        </p>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            Optimization Settings
          </CardTitle>
          <CardDescription>
            Configure your preferences for the best route planning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="energy-level">Your Energy Level</Label>
              <Select value={energyLevel} onValueChange={(value: any) => setEnergyLevel(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Energy Day</SelectItem>
                  <SelectItem value="medium">Medium Energy Day</SelectItem>
                  <SelectItem value="high">High Energy Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="include-breaks"
                checked={includeBreaks}
                onCheckedChange={setIncludeBreaks}
              />
              <Label htmlFor="include-breaks">Include rest breaks</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="weather-backup"
                checked={weatherBackup}
                onCheckedChange={setWeatherBackup}
              />
              <Label htmlFor="weather-backup">Weather backup plans</Label>
            </div>
          </div>
          
          <Button onClick={optimizeRoute} disabled={loading} className="w-full">
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Optimizing Route...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-2" />
                Optimize Route
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <CardTitle>Activities to Optimize</CardTitle>
          <CardDescription>
            {activities.length} activities ready for optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {activities.map((activity) => (
              <div key={activity.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">{activity.name}</h4>
                  <Badge variant="outline">{activity.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {activity.location}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {activity.openingHours}
                  </span>
                  <span className="flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    {activity.estimatedDuration}m
                  </span>
                </div>
                <div className="flex gap-2">
                  <Badge className={getCrowdColor(activity.crowdLevel)}>
                    {activity.crowdLevel} crowd
                  </Badge>
                  <Badge className={getEnergyColor(activity.energyRequired)}>
                    {activity.energyRequired} energy
                  </Badge>
                  {activity.weatherDependent && (
                    <Badge variant="outline" className="text-xs">
                      Weather dependent
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optimization Results */}
      {optimization && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-green-600" />
                Optimized Route
              </span>
              <Button variant="outline" size="sm" onClick={exportOptimizedRoute}>
                <Download className="h-4 w-4 mr-2" />
                Export Route
              </Button>
            </CardTitle>
            <CardDescription>
              Optimized for efficiency, energy, and enjoyment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Route Metrics */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Total Time</p>
                <p className="font-semibold">{Math.floor(optimization.totalDuration / 60)}h {optimization.totalDuration % 60}m</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <Navigation className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Walking Time</p>
                <p className="font-semibold">{optimization.totalWalkingTime} min</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <Zap className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Energy Distribution</p>
                <p className="font-semibold text-xs">{optimization.energyDistribution}</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <Coffee className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Suggested Breaks</p>
                <p className="font-semibold">{optimization.breaks.length}</p>
              </div>
            </div>

            {/* Optimized Schedule */}
            <div>
              <h4 className="font-medium mb-3">Optimized Schedule</h4>
              <div className="space-y-3">
                {optimization.optimizedOrder.map((activity, index) => (
                  <div key={activity.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-primary">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h5 className="font-medium">{activity.name}</h5>
                        <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {calculateActivityTime(index)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.location}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getCrowdColor(activity.crowdLevel)}>
                          {activity.crowdLevel}
                        </Badge>
                        <Badge className={getEnergyColor(activity.energyRequired)}>
                          {activity.energyRequired}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {activity.estimatedDuration} min
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Break Suggestions */}
            {optimization.breaks.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Suggested Breaks</h4>
                <div className="space-y-2">
                  {optimization.breaks.map((breakSug, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                      <div className="text-blue-600">
                        {breakSug.type === 'food' && <Utensils className="h-4 w-4" />}
                        {breakSug.type === 'rest' && <Coffee className="h-4 w-4" />}
                        {breakSug.type === 'bathroom' && <MapPin className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {breakSug.time} - {breakSug.type.charAt(0).toUpperCase() + breakSug.type.slice(1)} break
                        </p>
                        <p className="text-xs text-muted-foreground">{breakSug.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transportation Options */}
            {optimization.transportationOptions && optimization.transportationOptions.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Transportation Options</h4>
                <div className="space-y-3">
                  {optimization.transportationOptions.map((option, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {option.mode === 'walking' && <Footprints className="h-4 w-4 text-green-600" />}
                        {option.mode === 'transit' && <Train className="h-4 w-4 text-blue-600" />}
                        {option.mode === 'rideshare' && <Car className="h-4 w-4 text-purple-600" />}
                        <span className="font-medium text-sm">
                          {option.from} → {option.to}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {option.mode}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {option.duration && <p>Duration: {option.duration}</p>}
                        {option.distance && <p>Distance: {option.distance}</p>}
                        {option.estimatedCost && <p>Cost: {option.estimatedCost}</p>}
                        {option.note && <p className="text-xs">{option.note}</p>}
                        {option.instructions && option.instructions.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium">Instructions:</p>
                            <ul className="text-xs space-y-1 ml-2">
                              {option.instructions.map((instruction, i) => (
                                <li key={i} dangerouslySetInnerHTML={{ __html: instruction }} />
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real-time Travel Times Indicator */}
            {optimization.realTravelTimes && (
              <Alert>
                <Navigation className="h-4 w-4" />
                <AlertDescription>
                  Route optimized with real-time travel times using Google Maps data
                </AlertDescription>
              </Alert>
            )}

            {/* Optimization Tips */}
            <div>
              <h4 className="font-medium mb-3">Optimization Tips</h4>
              <div className="space-y-2">
                {optimization.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weather Backup Plans */}
      {weatherBackup && optimization && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Weather Backup Plans
            </CardTitle>
            <CardDescription>
              Alternative indoor options if weather doesn't cooperate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Weather-dependent activities in your route: {optimization.optimizedOrder.filter(a => a.weatherDependent).length} activities.
                Consider these backup options for indoor alternatives.
              </AlertDescription>
            </Alert>
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <h5 className="font-medium mb-2">Indoor Museums & Galleries</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Local art gallery (2-3 hours)</li>
                  <li>• Science museum (2-4 hours)</li>
                  <li>• Cultural heritage center (1-2 hours)</li>
                </ul>
              </div>
              <div className="p-3 border rounded-lg">
                <h5 className="font-medium mb-2">Shopping & Markets</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Covered market halls (1-2 hours)</li>
                  <li>• Shopping districts (2-3 hours)</li>
                  <li>• Local craft workshops (1-2 hours)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RouteOptimizer;