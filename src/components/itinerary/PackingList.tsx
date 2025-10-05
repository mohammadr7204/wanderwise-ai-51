import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Luggage, 
  Shirt, 
  Smartphone, 
  FileText, 
  Droplets, 
  Sun, 
  Cloud, 
  Snowflake,
  Download,
  Check,
  X,
  Package,
  MapPin,
  Calendar,
  Users,
  Thermometer,
  CloudRain,
  Shield,
  Zap,
  Camera,
  Plane,
  Heart,
  AlertTriangle
} from 'lucide-react';
import { WeatherService, WeatherData } from '@/services/weatherService';
import { DestinationIntelligence } from '@/services/destinationIntelligence';
import { SmartPackingCalculator, TripContext } from '@/services/smartPackingCalculator';

interface PackingItem {
  id: string;
  name: string;
  category: string;
  essential: boolean;
  weatherDependent: boolean;
  activitySpecific?: string;
  checked: boolean;
  quantity?: number;
  size?: string;
  reason?: string;
  shareableInGroup?: boolean;
}

interface PackingListProps {
  tripData: any;
}

const PackingList = ({ tripData }: PackingListProps) => {
  const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [tripContext, setTripContext] = useState<TripContext | null>(null);

  useEffect(() => {
    if (tripData) {
      initializeTrip();
    }
  }, [tripData]);

  const initializeTrip = async () => {
    setIsLoadingWeather(true);
    
    // Set up trip context
    const context: TripContext = {
      duration: getDuration(),
      groupSize: tripData?.formData?.groupSize || 1,
      accommodationType: tripData?.formData?.accommodationType || 'hotel',
      transportType: tripData?.formData?.transportType || 'carry-on',
      laundryAvailable: tripData?.formData?.accommodationType !== 'camping',
      budget: tripData?.formData?.budgetRange || 'mid-range'
    };
    setTripContext(context);

    // Fetch weather data
    const destination = tripData?.formData?.destination || '';
    const startDate = tripData?.formData?.startDate;
    const endDate = tripData?.formData?.endDate;
    
    if (destination && startDate && endDate) {
      try {
        const weather = await WeatherService.getWeatherForecast(destination, startDate, endDate);
        setWeatherData(weather);
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      }
    }
    
    setIsLoadingWeather(false);
    generateSmartPackingList(context);
  };

  const generateSmartPackingList = (context: TripContext) => {
    const destination = tripData?.formData?.specificDestinations?.[0] || 
                       tripData?.formData?.destination || 
                       tripData?.destination || '';
    const activities = tripData?.formData?.activityTypes || 
                      tripData?.formData?.interests || [];
    
    // Get destination intelligence
    const countryInfo = DestinationIntelligence.getCountryInfo(destination);
    
    // Base clothing calculations
    const clothingQuantities = SmartPackingCalculator.calculateClothingQuantities(
      context.duration, 
      context.laundryAvailable
    );
    
    // Toiletry size calculations
    const toiletryQuantities = SmartPackingCalculator.calculateToiletrySizes(
      context.duration,
      context.transportType
    );

    const baseItems: PackingItem[] = [
      // Smart clothing quantities
      ...clothingQuantities.map(item => ({
        id: item.item.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: `${item.item} (${item.quantity} ${item.quantity === 1 ? 'piece' : 'pieces'})`,
        category: 'Clothing',
        essential: true,
        weatherDependent: false,
        checked: false,
        quantity: item.quantity,
        reason: item.reason,
        shareableInGroup: item.shareableInGroup
      })),
      
      // Smart toiletry sizes
      ...toiletryQuantities.map(item => ({
        id: item.item.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: `${item.item} ${item.size ? `(${item.size})` : ''}`,
        category: 'Personal Care',
        essential: true,
        weatherDependent: false,
        checked: false,
        size: item.size,
        reason: item.reason,
        shareableInGroup: item.shareableInGroup
      })),
      
      // Essential documents
      { id: 'passport', name: 'Passport', category: 'Documents', essential: true, weatherDependent: false, checked: false },
      { id: 'id', name: 'Driver\'s License/ID', category: 'Documents', essential: true, weatherDependent: false, checked: false },
      { id: 'tickets', name: 'Flight Tickets/Boarding Passes', category: 'Documents', essential: true, weatherDependent: false, checked: false },
      { id: 'insurance', name: 'Travel Insurance Documents', category: 'Documents', essential: true, weatherDependent: false, checked: false },
      { id: 'accommodations', name: 'Hotel/Accommodation Confirmations', category: 'Documents', essential: true, weatherDependent: false, checked: false },
      
      // Electronics with power adapter specifics
      { id: 'phone', name: 'Smartphone', category: 'Electronics', essential: true, weatherDependent: false, checked: false },
      { id: 'charger', name: 'Phone Charger', category: 'Electronics', essential: true, weatherDependent: false, checked: false },
      { id: 'powerbank', name: 'Portable Charger', category: 'Electronics', essential: false, weatherDependent: false, checked: false },
      
      // Basic health items
      { id: 'medications', name: 'Prescription Medications', category: 'Health', essential: true, weatherDependent: false, checked: false },
      { id: 'first-aid', name: 'Basic First Aid Kit', category: 'Health', essential: false, weatherDependent: false, checked: false, shareableInGroup: true }
    ];

    let allItems = [...baseItems];

    // Add weather-based items if weather data is available
    if (weatherData?.forecast) {
      const weatherAnalysis = WeatherService.analyzeWeatherForPacking(weatherData.forecast);
      const weatherItems = WeatherService.generateWeatherBasedItems(weatherAnalysis);
      
      allItems.push(...weatherItems.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        essential: item.essential,
        weatherDependent: true,
        checked: false,
        reason: item.reason
      })));
    }

    // Add destination-specific items
    if (countryInfo) {
      const destinationItems = DestinationIntelligence.generateDestinationSpecificItems(countryInfo);
      allItems.push(...destinationItems.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        essential: item.essential,
        weatherDependent: false,
        checked: false,
        reason: item.reason
      })));
    }

    // Add activity-specific items
    if (activities.length > 0) {
      const activityRequirements = DestinationIntelligence.getActivityRequirements(activities);
      activityRequirements.forEach((requirement, index) => {
        allItems.push({
          id: `activity-${index}`,
          name: requirement,
          category: 'Activity Gear',
          essential: false,
          weatherDependent: false,
          activitySpecific: activities.join(', '),
          checked: false
        });
      });
    }

    setPackingItems(allItems);
  };

  const getDuration = () => {
    if (tripData?.formData?.startDate && tripData?.formData?.endDate) {
      const start = new Date(tripData.formData.startDate);
      const end = new Date(tripData.formData.endDate);
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }
    return 7;
  };

  const toggleItem = (itemId: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const exportPackingList = () => {
    const listData = {
      trip: tripData?.title || 'My Trip',
      destination: tripData?.formData?.destination,
      duration: getDuration(),
      items: packingItems.map(item => ({
        name: item.name,
        category: item.category,
        essential: item.essential,
        checked: checkedItems.has(item.id)
      }))
    };
    
    const text = `PACKING LIST - ${listData.trip}\n` +
      `Destination: ${listData.destination}\n` +
      `Duration: ${listData.duration} days\n\n` +
      packingItems.map(item => 
        `${checkedItems.has(item.id) ? '✓' : '☐'} ${item.name} (${item.category})`
      ).join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'packing-list.txt';
    link.click();
  };

  const getPackingProgress = () => {
    return Math.round((checkedItems.size / packingItems.length) * 100);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Clothing': return <Shirt className="h-4 w-4" />;
      case 'Electronics': return <Smartphone className="h-4 w-4" />;
      case 'Documents': return <FileText className="h-4 w-4" />;
      case 'Personal Care': return <Droplets className="h-4 w-4" />;
      case 'Health': return <Heart className="h-4 w-4" />;
      case 'Weather Protection': return <CloudRain className="h-4 w-4" />;
      case 'Cold Weather': return <Snowflake className="h-4 w-4" />;
      case 'Sun Protection': return <Sun className="h-4 w-4" />;
      case 'Heat Management': return <Thermometer className="h-4 w-4" />;
      case 'Cultural Requirements': return <Heart className="h-4 w-4" />;
      case 'Activity Gear': return <Package className="h-4 w-4" />;
      default: return <Luggage className="h-4 w-4" />;
    }
  };

  const categories = [...new Set(packingItems.map(item => item.category))];

  if (isLoadingWeather) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Smart Packing List</h2>
          <p className="text-muted-foreground">
            Analyzing weather and destination data...
          </p>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(j => (
                    <Skeleton key={j} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Luggage className="h-6 w-6 text-primary" />
          AI-Powered Packing List
        </h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{tripData?.formData?.destination || 'Unknown destination'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{getDuration()} days</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{tripContext?.groupSize || 1} {tripContext?.groupSize === 1 ? 'traveler' : 'travelers'}</span>
          </div>
        </div>
        {weatherData && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              Weather Forecast
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>Temperature: {Math.min(...weatherData.forecast.map(f => f.temperature.min))}°C to {Math.max(...weatherData.forecast.map(f => f.temperature.max))}°C</div>
              <div>Rain chance: {Math.max(...weatherData.forecast.map(f => f.precipitation.probability))}%</div>
              <div>Location: {weatherData.location}</div>
            </div>
          </div>
        )}
      </div>

      {/* Packing Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Luggage className="h-5 w-5 text-primary" />
              Packing Progress
            </span>
            <Button variant="outline" size="sm" onClick={exportPackingList}>
              <Download className="h-4 w-4 mr-2" />
              Export List
            </Button>
          </CardTitle>
          <CardDescription>
            {checkedItems.size} of {packingItems.length} items packed ({getPackingProgress()}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-muted rounded-full h-3">
            <div 
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${getPackingProgress()}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Packing Categories */}
      {categories.map((category) => {
        const categoryItems = packingItems.filter(item => item.category === category);
        const checkedInCategory = categoryItems.filter(item => checkedItems.has(item.id)).length;
        
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getCategoryIcon(category)}
                {category}
                <Badge variant="secondary" className="ml-auto">
                  {checkedInCategory}/{categoryItems.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={item.id}
                      checked={checkedItems.has(item.id)}
                      onCheckedChange={() => toggleItem(item.id)}
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor={item.id}
                        className={`text-sm font-medium cursor-pointer ${
                          checkedItems.has(item.id) ? 'line-through text-muted-foreground' : ''
                        }`}
                      >
                        {item.name}
                      </label>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {item.essential && (
                          <Badge variant="destructive" className="text-xs">
                            Essential
                          </Badge>
                        )}
                        {item.weatherDependent && (
                          <Badge variant="outline" className="text-xs">
                            <CloudRain className="h-3 w-3 mr-1" />
                            Weather
                          </Badge>
                        )}
                        {item.activitySpecific && (
                          <Badge variant="secondary" className="text-xs">
                            {item.activitySpecific}
                          </Badge>
                        )}
                        {item.shareableInGroup && tripContext && tripContext.groupSize > 1 && (
                          <Badge variant="outline" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            Shareable
                          </Badge>
                        )}
                        {item.reason && (
                          <span className="text-xs text-muted-foreground italic">
                            {item.reason}
                          </span>
                        )}
                      </div>
                    </div>
                    {checkedItems.has(item.id) ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Group Optimizations */}
      {tripContext && tripContext.groupSize > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Group Travel Optimizations
            </CardTitle>
            <CardDescription>
              Save space and weight by sharing these items among your group
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {SmartPackingCalculator.calculateGroupOptimizations(tripContext.groupSize).map((opt, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg">
                  <div className="font-medium text-sm">{opt.item}</div>
                  <div className="text-xs text-muted-foreground">
                    {opt.sharedQuantity} instead of {opt.individualQuantity} • {opt.savings}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Smart Packing Tips */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-accent" />
              Space Optimization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {SmartPackingCalculator.calculateSpaceOptimization(
                packingItems.map(i => i.name),
                tripContext?.transportType || 'carry-on'
              ).map((tip, index) => (
                <div key={index} className="space-y-1">
                  <div className="font-medium text-sm">{tip.technique}</div>
                  <div className="text-xs text-muted-foreground">{tip.spaceSaved}</div>
                  <div className="text-xs text-muted-foreground">{tip.items.join(', ')}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {tripContext?.transportType === 'carry-on' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-primary" />
                TSA/Airport Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {SmartPackingCalculator.generateCarryOnTips('carry-on').map((tip, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{tip}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Destination Cultural Notes */}
      {tripContext && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-secondary" />
              Cultural & Health Considerations
            </CardTitle>
            <CardDescription>
              Important information for {tripData?.formData?.destination}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const destination = tripData?.formData?.specificDestinations?.[0] || 
                                tripData?.formData?.destination || 
                                tripData?.destination || '';
              const countryInfo = DestinationIntelligence.getCountryInfo(destination);
              
              if (!countryInfo) {
                return (
                  <div className="text-muted-foreground">
                    <p>Destination information for "{destination}" will be added soon.</p>
                    <p className="text-xs mt-2">General travel essentials have been included in your packing list.</p>
                  </div>
                );
              }
              
              return (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Essential Info</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <span><strong>Power:</strong> {countryInfo.powerPlugType.join('/')} plugs, {countryInfo.voltage}</span>
                      </div>
                      <div><strong>Currency:</strong> {countryInfo.currency}</div>
                      <div><strong>Driving:</strong> {countryInfo.drivesSide} side</div>
                      <div><strong>Languages:</strong> {countryInfo.languages.join(', ')}</div>
                    </div>
                  </div>
                  
                  {countryInfo.culturalNotes.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Cultural Notes</h4>
                      <ul className="space-y-1 text-sm">
                        {countryInfo.culturalNotes.map((note, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PackingList;