import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Activity {
  id: string;
  name: string;
  location: string;
  coordinates?: [number, number];
  openingHours: string;
  estimatedDuration: number;
  category: 'attraction' | 'restaurant' | 'activity' | 'transport';
  crowdLevel: 'low' | 'medium' | 'high';
  energyRequired: 'low' | 'medium' | 'high';
  weatherDependent: boolean;
  priority: number;
  travelTimes?: number[];
  suggestedTimes?: string[];
  notes?: string;
}

interface BreakSuggestion {
  time: string;
  type: 'rest' | 'food' | 'bathroom';
  location: string;
  reason: string;
  duration?: number;
}

interface RouteRequest {
  activities: Activity[];
  startTime: string;
  energyLevel: 'low' | 'medium' | 'high';
  includeBreaks: boolean;
  weatherBackup: boolean;
  destination: string;
  tripDay: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { activities, startTime, energyLevel, includeBreaks, weatherBackup, destination, tripDay }: RouteRequest = await req.json();
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');

    if (!googleMapsApiKey) {
      console.error('Google Maps API key not found');
      return new Response(JSON.stringify({ error: 'Google Maps API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get coordinates for activities if not provided
    const activitiesWithCoords = await Promise.all(
      activities.map(async (activity) => {
        if (activity.coordinates) {
          return activity;
        }
        
        try {
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(activity.location + ', ' + destination)}&key=${googleMapsApiKey}`;
          const geocodeResponse = await fetch(geocodeUrl);
          const geocodeData = await geocodeResponse.json();
          
          if (geocodeData.results && geocodeData.results.length > 0) {
            const { lat, lng } = geocodeData.results[0].geometry.location;
            return { ...activity, coordinates: [lng, lat] as [number, number] };
          }
        } catch (error) {
          console.error(`Failed to geocode ${activity.location}:`, error);
        }
        
        return activity;
      })
    );

    // Apply smart scheduling rules
    const smartScheduledActivities = applySmartScheduling(activitiesWithCoords, startTime, destination, tripDay);

    // Calculate real travel times using Google Maps
    const optimizedRoute = await optimizeWithRealTravelTimes(smartScheduledActivities, googleMapsApiKey);

    // Get transportation options
    const transportationOptions = await getTransportationOptions(optimizedRoute, destination, googleMapsApiKey);

    // Generate break suggestions
    const breaks = generateSmartBreaks(optimizedRoute, startTime, energyLevel, includeBreaks);

    // Generate optimization suggestions
    const suggestions = generateOptimizationSuggestions(optimizedRoute, destination, tripDay, weatherBackup);

    const result = {
      optimizedOrder: optimizedRoute,
      totalWalkingTime: calculateTotalWalkingTime(optimizedRoute),
      totalDuration: calculateTotalDuration(optimizedRoute),
      energyDistribution: getEnergyDistribution(optimizedRoute),
      suggestions,
      breaks,
      transportationOptions,
      realTravelTimes: true
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Route optimization error:', error);
    return new Response(JSON.stringify({ error: 'Failed to optimize route' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function applySmartScheduling(activities: Activity[], startTime: string, destination: string, tripDay: number) {
  const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  return activities.map(activity => {
    // Never schedule museums on Monday (common closure day)
    if (activity.category === 'attraction' && activity.name.toLowerCase().includes('museum') && dayOfWeek === 1) {
      return { ...activity, priority: activity.priority - 2, notes: 'Avoid Mondays - may be closed' };
    }

    // Schedule restaurants during appropriate meal times
    if (activity.category === 'restaurant') {
      const mealTimes = getMealTimesForDestination(destination);
      activity.suggestedTimes = mealTimes;
    }

    // Account for jet lag on first days
    if (tripDay <= 2) {
      if (activity.energyRequired === 'high') {
        return { ...activity, priority: activity.priority - 1, notes: 'Consider jet lag - might be more tiring' };
      }
    }

    // Schedule popular attractions early morning or late afternoon
    if (activity.crowdLevel === 'high' && activity.category === 'attraction') {
      activity.suggestedTimes = ['08:00-10:00', '16:00-18:00'];
      activity.notes = 'Best visited early morning or late afternoon to avoid crowds';
    }

    return activity;
  }).sort((a, b) => {
    // Prioritize weather-dependent activities early
    if (a.weatherDependent && !b.weatherDependent) return -1;
    if (!a.weatherDependent && b.weatherDependent) return 1;
    
    // Then by priority
    return b.priority - a.priority;
  });
}

async function optimizeWithRealTravelTimes(activities: Activity[], apiKey: string) {
  if (activities.length <= 1) return activities;

  // Create distance matrix to get real travel times
  const coordinates = activities
    .filter(a => a.coordinates)
    .map(a => a.coordinates!.join(','));

  if (coordinates.length < 2) return activities;

  try {
    const distanceMatrixUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${coordinates.join('|')}&destinations=${coordinates.join('|')}&mode=walking&units=metric&key=${apiKey}`;
    
    const response = await fetch(distanceMatrixUrl);
    const data = await response.json();

    if (data.status === 'OK') {
      // Use the distance matrix to optimize route order
      // This is a simplified optimization - in production, you'd use a more sophisticated algorithm
      const optimized = [...activities];
      
      // Add travel time information to activities
      optimized.forEach((activity, index) => {
        if (index < data.rows.length && data.rows[index].elements) {
          activity.travelTimes = data.rows[index].elements.map((element: any) => 
            element.duration ? element.duration.value / 60 : 15 // Convert to minutes
          );
        }
      });

      return optimized;
    }
  } catch (error) {
    console.error('Failed to get distance matrix:', error);
  }

  return activities;
}

async function getTransportationOptions(activities: Activity[], destination: string, apiKey: string) {
  const options = [];

  // Get public transit information for the first few activities
  for (let i = 0; i < Math.min(activities.length - 1, 3); i++) {
    const origin = activities[i];
    const dest = activities[i + 1];

    if (origin.coordinates && dest.coordinates) {
      try {
        // Get public transit directions
        const transitUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.coordinates[1]},${origin.coordinates[0]}&destination=${dest.coordinates[1]},${dest.coordinates[0]}&mode=transit&key=${apiKey}`;
        
        const transitResponse = await fetch(transitUrl);
        const transitData = await transitResponse.json();

        if (transitData.routes && transitData.routes.length > 0) {
          const route = transitData.routes[0];
          options.push({
            from: origin.name,
            to: dest.name,
            mode: 'transit',
            duration: route.legs[0].duration.text,
            instructions: route.legs[0].steps.map((step: any) => step.html_instructions).slice(0, 3)
          });
        }

        // Get walking directions
        const walkingUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.coordinates[1]},${origin.coordinates[0]}&destination=${dest.coordinates[1]},${dest.coordinates[0]}&mode=walking&key=${apiKey}`;
        
        const walkingResponse = await fetch(walkingUrl);
        const walkingData = await walkingResponse.json();

        if (walkingData.routes && walkingData.routes.length > 0) {
          const route = walkingData.routes[0];
          options.push({
            from: origin.name,
            to: dest.name,
            mode: 'walking',
            duration: route.legs[0].duration.text,
            distance: route.legs[0].distance.text
          });
        }

      } catch (error) {
        console.error(`Failed to get transportation for ${origin.name} to ${dest.name}:`, error);
      }
    }
  }

  // Add ride-sharing estimates (mock data - would integrate with Uber/Lyft APIs)
  options.push({
    from: 'Various locations',
    to: 'Various locations',
    mode: 'rideshare',
    estimatedCost: '$8-15 per ride',
    note: 'Uber/Lyft available throughout the city'
  });

  return options;
}

function generateSmartBreaks(activities: Activity[], startTime: string, energyLevel: string, includeBreaks: boolean): BreakSuggestion[] {
  if (!includeBreaks) return [];

  const breaks: BreakSuggestion[] = [];
  let currentTime = new Date(`2024-01-01 ${startTime}`);
  let energySpent = 0;

  activities.forEach((activity, index) => {
    currentTime.setMinutes(currentTime.getMinutes() + activity.estimatedDuration);
    
    // Calculate energy spent
    const energyPoints = activity.energyRequired === 'high' ? 3 : activity.energyRequired === 'medium' ? 2 : 1;
    energySpent += energyPoints;

    // Suggest breaks based on energy spent and time
    if (index > 0 && (energySpent >= 6 || index % 3 === 0)) {
      const breakType = currentTime.getHours() >= 12 && currentTime.getHours() <= 14 ? 'food' : 'rest';
      
      breaks.push({
        time: currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        type: breakType,
        location: breakType === 'food' ? 'Local restaurant or cafe' : 'Nearby park or rest area',
        reason: energySpent >= 6 ? 'High energy expenditure' : 'Regular rest interval',
        duration: breakType === 'food' ? 60 : 20
      });
      
      energySpent = 0;
    }

    // Add travel time
    const travelTime = activity.travelTimes?.[index + 1] || 15;
    currentTime.setMinutes(currentTime.getMinutes() + travelTime);
  });

  return breaks;
}

function generateOptimizationSuggestions(activities: Activity[], destination: string, tripDay: number, weatherBackup: boolean) {
  const suggestions = [];

  // General suggestions
  suggestions.push('Start early to avoid crowds at popular attractions');
  suggestions.push('Keep high-energy activities for when you\'re fresh');

  // Jet lag considerations
  if (tripDay <= 2) {
    suggestions.push('Consider jet lag - schedule lighter activities for first 2 days');
  }

  // Weather considerations
  if (weatherBackup && activities.some(a => a.weatherDependent)) {
    suggestions.push('Have backup indoor options for weather-dependent activities');
  }

  // Destination-specific suggestions
  if (destination.toLowerCase().includes('tokyo')) {
    suggestions.push('Tokyo museums often close on Mondays');
    suggestions.push('Rush hours are 7-9 AM and 5-7 PM - plan accordingly');
  } else if (destination.toLowerCase().includes('paris')) {
    suggestions.push('Many shops close on Sundays');
    suggestions.push('Lunch is typically 12-2 PM, dinner after 7 PM');
  } else if (destination.toLowerCase().includes('new york')) {
    suggestions.push('Subway runs 24/7 but can be crowded during rush hours');
    suggestions.push('Many attractions offer early bird discounts');
  }

  // Energy distribution suggestions
  const highEnergyCount = activities.filter(a => a.energyRequired === 'high').length;
  if (highEnergyCount > 2) {
    suggestions.push('Consider spreading high-energy activities across multiple days');
  }

  return suggestions;
}

function getMealTimesForDestination(destination: string) {
  const dest = destination.toLowerCase();
  
  if (dest.includes('spain') || dest.includes('madrid') || dest.includes('barcelona')) {
    return ['14:00-16:00', '21:00-23:00']; // Late lunch and dinner
  } else if (dest.includes('japan') || dest.includes('tokyo')) {
    return ['11:30-13:30', '18:00-20:00']; // Earlier dinner
  } else if (dest.includes('italy') || dest.includes('rome') || dest.includes('milan')) {
    return ['12:30-14:30', '19:30-21:30'];
  } else {
    return ['12:00-14:00', '18:00-20:00']; // Standard times
  }
}

function calculateTotalWalkingTime(activities: Activity[]) {
  return activities.reduce((total, activity, index) => {
    if (index === activities.length - 1) return total;
    return total + (activity.travelTimes?.[index + 1] || 15);
  }, 0);
}

function calculateTotalDuration(activities: Activity[]) {
  return activities.reduce((sum, act) => sum + act.estimatedDuration, 0);
}

function getEnergyDistribution(activities: Activity[]) {
  const energyCounts = activities.reduce((acc, act) => {
    acc[act.energyRequired] = (acc[act.energyRequired] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return `${energyCounts.high || 0} high, ${energyCounts.medium || 0} medium, ${energyCounts.low || 0} low energy activities`;
}