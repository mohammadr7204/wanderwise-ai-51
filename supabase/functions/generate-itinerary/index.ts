import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
const googlePlacesApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
const openWeatherApiKey = Deno.env.get('OPENWEATHER_API_KEY');
const eventbriteApiKey = Deno.env.get('EVENTBRITE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Real-time data gathering functions
async function getWeatherForecast(location: string, startDate: string, endDate: string) {
  if (!openWeatherApiKey) return null;
  
  try {
    // Get coordinates first
    const geoResponse = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${openWeatherApiKey}`
    );
    const geoData = await geoResponse.json();
    
    if (!geoData.length) return null;
    
    const { lat, lon } = geoData[0];
    
    // Get current weather and forecast
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${openWeatherApiKey}&units=metric`
    );
    const weatherData = await weatherResponse.json();
    
    return {
      current: weatherData.list[0],
      forecast: weatherData.list.slice(0, 8), // Next 5 days
      location: geoData[0].name
    };
  } catch (error) {
    console.error('Weather API error:', error);
    return null;
  }
}

async function getGooglePlaces(location: string, type: string = 'tourist_attraction') {
  if (!googlePlacesApiKey) return [];
  
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(location + ' ' + type)}&key=${googlePlacesApiKey}`
    );
    const data = await response.json();
    
    return data.results?.slice(0, 10).map((place: any) => ({
      name: place.name,
      rating: place.rating,
      address: place.formatted_address,
      priceLevel: place.price_level,
      types: place.types,
      photoReference: place.photos?.[0]?.photo_reference,
      placeId: place.place_id
    })) || [];
  } catch (error) {
    console.error('Google Places API error:', error);
    return [];
  }
}

async function getLocalEvents(location: string, startDate: string, endDate: string) {
  if (!eventbriteApiKey) return [];
  
  try {
    const response = await fetch(
      `https://www.eventbriteapi.com/v3/events/search/?location.address=${encodeURIComponent(location)}&start_date.range_start=${startDate}&start_date.range_end=${endDate}&expand=venue`,
      {
        headers: {
          'Authorization': `Bearer ${eventbriteApiKey}`
        }
      }
    );
    const data = await response.json();
    
    return data.events?.slice(0, 5).map((event: any) => ({
      name: event.name.text,
      description: event.description?.text?.substring(0, 200),
      startDate: event.start.local,
      endDate: event.end.local,
      venue: event.venue?.name,
      url: event.url,
      isFree: event.is_free
    })) || [];
  } catch (error) {
    console.error('Eventbrite API error:', error);
    return [];
  }
}

async function getCurrencyExchange(baseCurrency: string = 'USD') {
  try {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.error('Currency API error:', error);
    return null;
  }
}

// Types for destination data
interface DestinationOption {
  name: string;
  continent: string;
  bestMonths: number[];
  budget: string;
  groupSize: string;
}

interface DestinationPools {
  [category: string]: {
    [subCategory: string]: DestinationOption[];
  };
}

// Comprehensive destination database with variety factors
const DESTINATION_POOLS: DestinationPools = {
  adventure: {
    cold: [
      { name: 'Iceland', continent: 'Europe', bestMonths: [1,2,3,11,12], budget: 'high', groupSize: 'any' },
      { name: 'Norway', continent: 'Europe', bestMonths: [1,2,3,11,12], budget: 'high', groupSize: 'any' },
      { name: 'Alaska, USA', continent: 'North America', bestMonths: [1,2,3,11,12], budget: 'medium', groupSize: 'any' },
      { name: 'Patagonia, Chile', continent: 'South America', bestMonths: [1,2,3,11,12], budget: 'medium', groupSize: 'small' },
      { name: 'Canadian Rockies', continent: 'North America', bestMonths: [1,2,3,11,12], budget: 'medium', groupSize: 'any' }
    ],
    temperate: [
      { name: 'New Zealand', continent: 'Oceania', bestMonths: [3,4,5,9,10,11], budget: 'high', groupSize: 'any' },
      { name: 'Scotland', continent: 'Europe', bestMonths: [4,5,6,7,8,9], budget: 'medium', groupSize: 'any' },
      { name: 'Nepal', continent: 'Asia', bestMonths: [3,4,5,9,10,11], budget: 'low', groupSize: 'small' },
      { name: 'Peru', continent: 'South America', bestMonths: [4,5,6,7,8,9], budget: 'medium', groupSize: 'any' }
    ],
    hot: [
      { name: 'Costa Rica', continent: 'Central America', bestMonths: [6,7,8], budget: 'medium', groupSize: 'any' },
      { name: 'Jordan', continent: 'Middle East', bestMonths: [3,4,5,9,10,11], budget: 'medium', groupSize: 'any' },
      { name: 'Madagascar', continent: 'Africa', bestMonths: [4,5,6,7,8,9], budget: 'medium', groupSize: 'small' }
    ]
  },
  beach: {
    tropical: [
      { name: 'Maldives', continent: 'Asia', bestMonths: [1,2,3,4,11,12], budget: 'high', groupSize: 'couples' },
      { name: 'Bali, Indonesia', continent: 'Asia', bestMonths: [4,5,6,7,8,9], budget: 'medium', groupSize: 'any' },
      { name: 'Seychelles', continent: 'Africa', bestMonths: [4,5,6,7,8,9], budget: 'high', groupSize: 'couples' },
      { name: 'Turks and Caicos', continent: 'Caribbean', bestMonths: [1,2,3,4,11,12], budget: 'high', groupSize: 'any' },
      { name: 'Greek Islands', continent: 'Europe', bestMonths: [5,6,7,8,9], budget: 'medium', groupSize: 'any' },
      { name: 'Zanzibar, Tanzania', continent: 'Africa', bestMonths: [6,7,8,9,10], budget: 'medium', groupSize: 'any' }
    ],
    temperate: [
      { name: 'California Coast, USA', continent: 'North America', bestMonths: [4,5,6,7,8,9], budget: 'high', groupSize: 'any' },
      { name: 'Portuguese Coast', continent: 'Europe', bestMonths: [5,6,7,8,9], budget: 'medium', groupSize: 'any' },
      { name: 'Croatian Coast', continent: 'Europe', bestMonths: [5,6,7,8,9], budget: 'medium', groupSize: 'any' }
    ]
  },
  cultural: {
    ancient: [
      { name: 'Egypt', continent: 'Africa', bestMonths: [10,11,12,1,2,3], budget: 'medium', groupSize: 'any' },
      { name: 'Jordan', continent: 'Middle East', bestMonths: [3,4,5,9,10,11], budget: 'medium', groupSize: 'any' },
      { name: 'Cambodia', continent: 'Asia', bestMonths: [11,12,1,2,3], budget: 'low', groupSize: 'any' },
      { name: 'Peru', continent: 'South America', bestMonths: [4,5,6,7,8,9], budget: 'medium', groupSize: 'any' }
    ],
    modern: [
      { name: 'Japan', continent: 'Asia', bestMonths: [3,4,5,9,10,11], budget: 'high', groupSize: 'any' },
      { name: 'South Korea', continent: 'Asia', bestMonths: [3,4,5,9,10,11], budget: 'medium', groupSize: 'any' },
      { name: 'Morocco', continent: 'Africa', bestMonths: [3,4,5,9,10,11], budget: 'medium', groupSize: 'any' },
      { name: 'India', continent: 'Asia', bestMonths: [10,11,12,1,2,3], budget: 'low', groupSize: 'any' }
    ]
  },
  city: {
    europe: [
      { name: 'Paris, France', continent: 'Europe', bestMonths: [4,5,6,7,8,9], budget: 'high', groupSize: 'any' },
      { name: 'Prague, Czech Republic', continent: 'Europe', bestMonths: [4,5,6,7,8,9], budget: 'low', groupSize: 'any' },
      { name: 'Amsterdam, Netherlands', continent: 'Europe', bestMonths: [4,5,6,7,8], budget: 'high', groupSize: 'any' },
      { name: 'Budapest, Hungary', continent: 'Europe', bestMonths: [4,5,6,7,8,9], budget: 'low', groupSize: 'any' }
    ],
    asia: [
      { name: 'Tokyo, Japan', continent: 'Asia', bestMonths: [3,4,5,9,10,11], budget: 'high', groupSize: 'any' },
      { name: 'Singapore', continent: 'Asia', bestMonths: [1,2,3,4,11,12], budget: 'high', groupSize: 'any' },
      { name: 'Bangkok, Thailand', continent: 'Asia', bestMonths: [11,12,1,2], budget: 'low', groupSize: 'any' },
      { name: 'Dubai, UAE', continent: 'Middle East', bestMonths: [10,11,12,1,2,3], budget: 'high', groupSize: 'any' }
    ],
    americas: [
      { name: 'New York, USA', continent: 'North America', bestMonths: [4,5,6,7,8,9], budget: 'high', groupSize: 'any' },
      { name: 'Buenos Aires, Argentina', continent: 'South America', bestMonths: [3,4,5,9,10,11], budget: 'medium', groupSize: 'any' },
      { name: 'Mexico City, Mexico', continent: 'North America', bestMonths: [3,4,5,9,10,11], budget: 'low', groupSize: 'any' }
    ]
  },
  nature: {
    safari: [
      { name: 'Serengeti, Tanzania', continent: 'Africa', bestMonths: [6,7,8,9,10], budget: 'high', groupSize: 'small' },
      { name: 'Kruger, South Africa', continent: 'Africa', bestMonths: [4,5,6,7,8,9], budget: 'medium', groupSize: 'any' },
      { name: 'Masai Mara, Kenya', continent: 'Africa', bestMonths: [7,8,9,10], budget: 'high', groupSize: 'small' }
    ],
    wilderness: [
      { name: 'Amazon Rainforest, Brazil', continent: 'South America', bestMonths: [6,7,8,9], budget: 'medium', groupSize: 'small' },
      { name: 'Yellowstone, USA', continent: 'North America', bestMonths: [6,7,8,9], budget: 'medium', groupSize: 'any' },
      { name: 'Galapagos Islands', continent: 'South America', bestMonths: [1,2,3,4,11,12], budget: 'high', groupSize: 'small' }
    ]
  },
  budget: {
    europe: [
      { name: 'Portugal', continent: 'Europe', bestMonths: [4,5,6,7,8,9], budget: 'low', groupSize: 'any' },
      { name: 'Poland', continent: 'Europe', bestMonths: [4,5,6,7,8,9], budget: 'low', groupSize: 'any' },
      { name: 'Estonia', continent: 'Europe', bestMonths: [5,6,7,8], budget: 'low', groupSize: 'any' }
    ],
    asia: [
      { name: 'Vietnam', continent: 'Asia', bestMonths: [11,12,1,2,3], budget: 'low', groupSize: 'any' },
      { name: 'Thailand', continent: 'Asia', bestMonths: [11,12,1,2], budget: 'low', groupSize: 'any' },
      { name: 'Nepal', continent: 'Asia', bestMonths: [3,4,5,9,10,11], budget: 'low', groupSize: 'any' }
    ],
    americas: [
      { name: 'Guatemala', continent: 'Central America', bestMonths: [11,12,1,2,3,4], budget: 'low', groupSize: 'any' },
      { name: 'Bolivia', continent: 'South America', bestMonths: [4,5,6,7,8,9], budget: 'low', groupSize: 'any' }
    ]
  }
};

// Smart destination selection algorithm
async function selectOptimalDestination(tripData: any, userId: string, supabase: any, currentMonth: number): Promise<string> {
  // Get user's recent destination history
  const { data: history } = await supabase
    .from('destination_history')
    .select('*')
    .eq('user_id', userId)
    .order('suggested_at', { ascending: false })
    .limit(10);

  const recentCategories = history?.map((h: any) => h.destination_category) || [];
  const recentContinents = history?.map((h: any) => h.continent) || [];
  
  // Determine budget level
  const avgBudget = (tripData.budgetMin + tripData.budgetMax) / 2;
  const budgetLevel = avgBudget < 1500 ? 'low' : avgBudget < 3000 ? 'medium' : 'high';
  
  // Determine group size category
  const groupSizeCategory = tripData.groupSize <= 2 ? 'couples' : tripData.groupSize <= 4 ? 'small' : 'large';
  
  // Build candidate pools based on preferences
  let candidates: any[] = [];
  
  // Map activity types to destination categories
  const activityMapping: { [key: string]: string[] } = {
    'adventure': ['adventure'],
    'beach-relaxation': ['beach'],
    'cultural': ['cultural'],
    'urban-exploration': ['city'],
    'nature-wildlife': ['nature'],
    'culinary': ['cultural', 'city'],
    'photography': ['nature', 'cultural'],
    'wellness': ['beach', 'nature']
  };
  
  // Get relevant destination pools
  for (const activity of tripData.activityTypes) {
    const categories = activityMapping[activity] || ['cultural'];
    for (const category of categories) {
      if (DESTINATION_POOLS[category]) {
        Object.values(DESTINATION_POOLS[category]).forEach((pool: DestinationOption[]) => {
          candidates.push(...pool.map(dest => ({ ...dest, category, subCategory: category })));
        });
      }
    }
  }
  
  // If budget-conscious, add budget destinations
  if (budgetLevel === 'low') {
    Object.values(DESTINATION_POOLS.budget).forEach((pool: DestinationOption[]) => {
      candidates.push(...pool.map(dest => ({ ...dest, category: 'budget', subCategory: 'budget' })));
    });
  }
  
  // Filter candidates based on criteria
  candidates = candidates.filter(dest => {
    // Budget compatibility
    if (dest.budget === 'high' && budgetLevel === 'low') return false;
    if (dest.budget === 'low' && budgetLevel === 'high') return Math.random() < 0.3; // Sometimes include for variety
    
    // Group size compatibility
    if (dest.groupSize === 'couples' && tripData.groupSize > 2) return false;
    if (dest.groupSize === 'small' && tripData.groupSize > 6) return false;
    
    // Climate preferences
    if (tripData.climatePreferences.length > 0) {
      const climateMap: { [key: string]: string[] } = {
        'tropical': ['tropical'],
        'temperate': ['temperate'],
        'cold': ['cold'],
        'dry': ['temperate', 'hot'],
        'humid': ['tropical']
      };
      
      const destClimate = dest.subCategory || 'temperate';
      const matchesClimate = tripData.climatePreferences.some((pref: string) => 
        climateMap[pref]?.includes(destClimate) || destClimate.includes(pref)
      );
      if (!matchesClimate) return false;
    }
    
    // Seasonal appropriateness
    if (!dest.bestMonths.includes(currentMonth)) return false;
    
    return true;
  });
  
  // Apply variety logic - avoid recent categories and continents
  const scoredCandidates = candidates.map(dest => {
    let score = Math.random(); // Base randomness
    
    // Penalize recently suggested categories
    if (recentCategories.includes(dest.category)) score -= 0.5;
    if (recentCategories.slice(0, 3).includes(dest.category)) score -= 0.3;
    
    // Penalize recently suggested continents
    if (recentContinents.includes(dest.continent)) score -= 0.3;
    if (recentContinents.slice(0, 2).includes(dest.continent)) score -= 0.2;
    
    // Boost score for perfect budget match
    if (dest.budget === budgetLevel) score += 0.2;
    
    // Boost score for perfect timing (current month is optimal)
    if (dest.bestMonths.includes(currentMonth)) score += 0.15;
    
    return { ...dest, score };
  });
  
  // Sort by score and pick top candidate
  scoredCandidates.sort((a, b) => b.score - a.score);
  const selected = scoredCandidates[0];
  
  if (selected) {
    // Store this selection in history
    await supabase
      .from('destination_history')
      .insert({
        user_id: userId,
        suggested_destination: selected.name,
        destination_category: selected.category,
        climate_type: selected.subCategory,
        travel_style: tripData.activityTypes[0] || 'cultural',
        continent: selected.continent
      });
    
    return selected.name;
  }
  
  // Fallback to a random destination if no candidates
  const fallbacks = ['Portugal', 'Thailand', 'Morocco', 'Costa Rica', 'Czech Republic'];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tripData, tripDuration, userId, tripId } = await req.json();

    console.log('Request received with data:', { tripData: !!tripData, tripDuration, userId, tripId });
    console.log('API keys available:', { 
      anthropic: !!anthropicApiKey, 
      google: !!googlePlacesApiKey, 
      weather: !!openWeatherApiKey,
      eventbrite: !!eventbriteApiKey 
    });

    if (!anthropicApiKey) {
      console.error('Anthropic API key not configured');
      throw new Error('Anthropic API key not configured');
    }

    console.log(`Starting AI-powered itinerary generation for trip ${tripId}`);
    
    // Initialize Supabase client for destination selection
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Determine the destination for research
    let targetDestination: string | null = null;
    
    if (tripData.destinationType === 'specific' && tripData.specificDestinations?.length > 0) {
      targetDestination = tripData.specificDestinations[0];
    } else if (tripData.destinationType === 'surprise') {
      const currentMonth = new Date().getMonth() + 1; // 1-12
      targetDestination = await selectOptimalDestination(tripData, userId, supabase, currentMonth);
      console.log(`AI selected surprise destination: ${targetDestination}`);
    }

    // Gather real-time data in parallel
    console.log('Gathering real-time data...');
    const [weatherData, attractions, restaurants, events, currencyRates] = await Promise.allSettled([
      targetDestination ? getWeatherForecast(targetDestination, tripData.startDate, tripData.endDate) : null,
      targetDestination ? getGooglePlaces(targetDestination, 'tourist_attraction') : [],
      targetDestination ? getGooglePlaces(targetDestination, 'restaurant') : [],
      targetDestination ? getLocalEvents(targetDestination, tripData.startDate, tripData.endDate) : [],
      getCurrencyExchange()
    ]);

    // Extract fulfilled values
    const realTimeData = {
      weather: weatherData.status === 'fulfilled' ? weatherData.value : null,
      attractions: attractions.status === 'fulfilled' ? attractions.value : [],
      restaurants: restaurants.status === 'fulfilled' ? restaurants.value : [],
      events: events.status === 'fulfilled' ? events.value : [],
      exchangeRates: currencyRates.status === 'fulfilled' ? currencyRates.value : null
    };

    console.log('Real-time data gathered:', {
      weather: !!realTimeData.weather,
      attractionCount: realTimeData.attractions.length,
      restaurantCount: realTimeData.restaurants.length,
      eventCount: realTimeData.events.length,
      hasExchangeRates: !!realTimeData.exchangeRates
    });

    // Destination cost indexes (relative to base cost of 1.0)
    const DESTINATION_COST_INDEX: { [key: string]: number } = {
      // Expensive destinations (1.5x - 2.0x)
      'Tokyo': 1.8, 'Japan': 1.8, 'Switzerland': 1.9, 'Norway': 1.8, 'Iceland': 1.7,
      'Singapore': 1.6, 'Paris': 1.5, 'London': 1.6, 'New York': 1.7, 'Dubai': 1.5,
      'Sydney': 1.6, 'Hong Kong': 1.6, 'Monaco': 2.0, 'Zurich': 1.9, 'Oslo': 1.8,
      'Copenhagen': 1.7, 'Stockholm': 1.6, 'San Francisco': 1.8, 'Los Angeles': 1.5,
      
      // Moderate destinations (0.8x - 1.4x)
      'Barcelona': 1.2, 'Rome': 1.3, 'Amsterdam': 1.4, 'Berlin': 1.1, 'Prague': 0.9,
      'Seoul': 1.2, 'Taiwan': 1.0, 'China': 0.8, 'South Korea': 1.2, 'Costa Rica': 1.1,
      'Chile': 1.0, 'Argentina': 0.9, 'Greece': 1.1, 'Portugal': 0.9, 'Spain': 1.1,
      'Italy': 1.2, 'Germany': 1.2, 'Austria': 1.3, 'Czech Republic': 0.9, 'Croatia': 1.0,
      
      // Budget destinations (0.3x - 0.7x)
      'Thailand': 0.5, 'Vietnam': 0.4, 'India': 0.3, 'Nepal': 0.4, 'Cambodia': 0.4,
      'Bangladesh': 0.3, 'Laos': 0.4, 'Bolivia': 0.5, 'Guatemala': 0.5, 'Peru': 0.6,
      'Mexico': 0.6, 'Egypt': 0.5, 'Morocco': 0.5, 'Indonesia': 0.5, 'Philippines': 0.5,
      'Turkey': 0.6, 'Poland': 0.7, 'Hungary': 0.7, 'Romania': 0.6, 'Bulgaria': 0.5,
      'Sri Lanka': 0.4, 'Pakistan': 0.3, 'Myanmar': 0.4, 'Madagascar': 0.5
    };

    // Calculate dynamic budget breakdown
    function calculateDynamicBudget(destination: string | null, totalBudget: number, duration: number, groupSize: number): any {
      if (!destination) destination = 'Unknown';
      
      const directMatch = DESTINATION_COST_INDEX[destination];
      const partialMatch = Object.keys(DESTINATION_COST_INDEX).find(key => 
        destination.toLowerCase().includes(key.toLowerCase())
      );
      const costMultiplier = directMatch || (partialMatch ? DESTINATION_COST_INDEX[partialMatch] : 1.0);
      
      const dailyBudget = totalBudget / duration;
      
      // Base allocation percentages based on budget range
      let allocations;
      if (totalBudget < 1000) {
        allocations = { accommodation: 0.40, food: 0.30, activities: 0.20, transport: 0.10 };
      } else if (totalBudget <= 3000) {
        allocations = { accommodation: 0.35, food: 0.25, activities: 0.30, transport: 0.10 };
      } else {
        allocations = { accommodation: 0.30, food: 0.25, activities: 0.35, transport: 0.10 };
      }
      
      // Adjust for trip duration (longer trips need more accommodation allocation)
      if (duration > 10) {
        allocations.accommodation += 0.05;
        allocations.activities -= 0.05;
      }
      
      // Adjust for group size (larger groups can share accommodation costs)
      if (groupSize > 4) {
        allocations.accommodation -= 0.05;
        allocations.activities += 0.05;
      }
      
      // Apply destination cost multiplier
      const accommodationDaily = Math.round(dailyBudget * allocations.accommodation * costMultiplier);
      const foodDaily = Math.round(dailyBudget * allocations.food * costMultiplier);
      const activitiesDaily = Math.round(dailyBudget * allocations.activities * costMultiplier);
      const transportTotal = Math.round(totalBudget * allocations.transport * costMultiplier);
      
      // Emergency fund calculation (5-10% based on destination risk)
      const riskMultiplier = costMultiplier > 1.5 ? 0.10 : costMultiplier < 0.7 ? 0.05 : 0.08;
      const emergencyFund = Math.round(totalBudget * riskMultiplier);
      
      // Splurge recommendations (10% budget stretch)
      const splurgeAmount = Math.round(totalBudget * 0.10);
      
      return {
        accommodationDaily,
        foodDaily,
        activitiesDaily,
        transportTotal,
        emergencyFund,
        splurgeAmount,
        costMultiplier,
        allocations,
        tripTotal: Math.round(accommodationDaily * duration + foodDaily * duration + activitiesDaily * duration + transportTotal)
      };
    }

    console.log('Calculating budget...');
    const avgBudget = (tripData.budgetMin + tripData.budgetMax) / 2;
    const maxBudget = tripData.budgetMax; // Never exceed this
    let budgetCalculation = calculateDynamicBudget(targetDestination, avgBudget, tripDuration, tripData.groupSize);
    
    console.log('Initial budget calculation:', {
      tripTotal: budgetCalculation.tripTotal,
      maxBudget,
      exceedsLimit: budgetCalculation.tripTotal > maxBudget
    });
    
    // CRITICAL: Ensure tripTotal never exceeds user's max budget
    if (budgetCalculation.tripTotal > maxBudget) {
      console.log('Budget exceeds max, recalculating...');
      // Recalculate with max budget instead to stay within constraints
      budgetCalculation = calculateDynamicBudget(targetDestination, maxBudget * 0.9, tripDuration, tripData.groupSize);
      console.log('Recalculated budget:', budgetCalculation.tripTotal);
    }

    // Smart budget optimization recommendations
    const budgetOptimizationTips = [];
    if (avgBudget < 1500) {
      budgetOptimizationTips.push(
        "Focus on budget accommodations (hostels, guesthouses) to maximize activity funds",
        "Use local transport and street food to save money",
        "Look for free walking tours and public spaces"
      );
    } else if (avgBudget > 3000) {
      budgetOptimizationTips.push(
        "Consider upgrading accommodation for comfort",
        "Include unique premium experiences",
        "Budget for occasional fine dining experiences"
      );
    }

    // Create an enhanced AI prompt with real-time data integration
    const prompt = `Create a comprehensive ${tripDuration}-day travel itinerary using REAL-TIME DATA and deep personalization:

**TRIP OVERVIEW**
Title: ${tripData.title}
Duration: ${tripDuration} days
Travelers: ${tripData.groupSize} people
Budget: $${tripData.budgetMin.toLocaleString()} - $${tripData.budgetMax.toLocaleString()}
Travel Dates: ${tripData.startDate ? new Date(tripData.startDate).toLocaleDateString() : 'Flexible'} to ${tripData.endDate ? new Date(tripData.endDate).toLocaleDateString() : 'Flexible'}

**DESTINATION COST ANALYSIS FOR ${(targetDestination || 'Unknown Destination').toUpperCase()}**
Cost Multiplier: ${budgetCalculation.costMultiplier}x (1.0 = global average)
${budgetCalculation.costMultiplier > 1.5 ? '⚠️ HIGH COST DESTINATION - Budget carefully' : ''}
${budgetCalculation.costMultiplier < 0.7 ? '💰 BUDGET-FRIENDLY DESTINATION - Great value for money' : ''}

**DYNAMIC BUDGET BREAKDOWN**
- Accommodation: $${budgetCalculation.accommodationDaily}/day (${Math.round(budgetCalculation.allocations.accommodation * 100)}% of budget)
- Food & Dining: $${budgetCalculation.foodDaily}/day (${Math.round(budgetCalculation.allocations.food * 100)}% of budget)
- Activities & Experiences: $${budgetCalculation.activitiesDaily}/day (${Math.round(budgetCalculation.allocations.activities * 100)}% of budget)
- Transportation: $${budgetCalculation.transportTotal} total (${Math.round(budgetCalculation.allocations.transport * 100)}% of budget)
- Emergency Fund: $${budgetCalculation.emergencyFund} (recommended safety buffer)
- Splurge Budget: $${budgetCalculation.splurgeAmount} (10% stretch for special experiences)

**BUDGET OPTIMIZATION STRATEGY**
${budgetOptimizationTips.map(tip => `- ${tip}`).join('\n')}
${budgetCalculation.costMultiplier > 1.3 ? '- Consider staying slightly outside city center for better accommodation value\n- Mix expensive experiences with free/low-cost activities' : ''}
${budgetCalculation.costMultiplier < 0.8 ? '- Take advantage of low costs to upgrade experiences\n- Try multiple local cuisines and premium activities' : ''}

**DESTINATION PREFERENCES**
${tripData.destinationType === 'surprise' ? 
  `SMART-SELECTED DESTINATION: ${targetDestination} - Chosen using advanced algorithms considering seasonality, user preferences, budget, and variety from past suggestions` : 
  `TARGET DESTINATIONS: ${tripData.specificDestinations.join(', ')}`
}
Travel Radius: ${tripData.travelRadius}
Climate Preferences: ${tripData.climatePreferences.length > 0 ? tripData.climatePreferences.join(', ') : 'No specific preference'}

**PERSONALIZATION DETAILS**
Preferred Activities: ${tripData.activityTypes.join(', ')}
Accommodation Style: ${tripData.accommodationType.replace('-', ' ')}
Desired Amenities: ${tripData.accommodationAmenities.length > 0 ? tripData.accommodationAmenities.join(', ') : 'Standard amenities'}
Transportation: ${tripData.transportPreferences.join(', ')}
Dietary Requirements: ${tripData.dietaryRestrictions.length > 0 ? tripData.dietaryRestrictions.join(', ') : 'No restrictions'}
Food Adventure Level: ${tripData.foodAdventureLevel}/10 (1=familiar foods, 10=try everything)
Accessibility Needs: ${tripData.accessibilityNeeds || 'None specified'}
Special Requests: ${tripData.specialRequests || 'None'}

**REAL-TIME DATA TO INTEGRATE**
${realTimeData.weather ? `
CURRENT WEATHER & FORECAST:
- Current conditions: ${realTimeData.weather.current.weather[0].description}, ${Math.round(realTimeData.weather.current.main.temp)}°C
- 5-day forecast: ${realTimeData.weather.forecast.map((f: any) => 
  `${new Date(f.dt * 1000).toLocaleDateString()}: ${f.weather[0].description}, ${Math.round(f.main.temp)}°C`
).join(', ')}` : ''}

${realTimeData.attractions.length > 0 ? `
REAL ATTRACTIONS WITH RATINGS:
${realTimeData.attractions.map((a: any) => 
  `- ${a.name} (${a.rating}/5 stars) at ${a.address}${a.priceLevel ? ` - Price level: ${a.priceLevel}/4` : ''}`
).join('\n')}` : ''}

${realTimeData.restaurants.length > 0 ? `
REAL RESTAURANTS WITH RATINGS:
${realTimeData.restaurants.map((r: any) => 
  `- ${r.name} (${r.rating}/5 stars) at ${r.address}${r.priceLevel ? ` - Price level: ${r.priceLevel}/4` : ''}`
).join('\n')}` : ''}
 
${realTimeData.events.length > 0 ? `
CURRENT LOCAL EVENTS:
${realTimeData.events.map((e: any) => 
  `- ${e.name} on ${new Date(e.startDate).toLocaleDateString()} at ${e.venue}${e.isFree ? ' (FREE)' : ''}`
).join('\n')}` : ''}

**RESTAURANT REQUIREMENTS**
CRITICAL: Provide exactly 3 restaurant options for each meal (breakfast, lunch, dinner) for each day of the trip. This means if it's a 5-day trip, you need 45 total restaurant recommendations (3 breakfast + 3 lunch + 3 dinner × 5 days). Mix the real restaurants from the data above with additional researched options to reach this requirement.

**ADVANCED REQUIREMENTS**
1. **WEATHER-ADAPTIVE PLANNING**: Use the real weather forecast to suggest appropriate activities for each day
2. **REAL VENUE INTEGRATION**: Incorporate the actual rated attractions and restaurants from the data above
3. **EVENT SYNCHRONIZATION**: Include any local events that align with travel dates and interests
4. **BUDGET PRECISION**: Use real price levels and current exchange rates for accurate budget calculations
5. **PERSONALIZATION DEPTH**: Every recommendation must clearly connect to the specified preferences
6. **INSIDER KNOWLEDGE**: Research current local trends, seasonal highlights, and hidden gems
7. **PRACTICAL LOGISTICS**: Include real operating hours, booking requirements, and transportation times
8. **BACKUP STRATEGIES**: Provide weather-dependent alternatives and Plan B options
9. **FUNCTIONAL BOOKING LINKS**: Generate REAL, WORKING booking URLs for all activities, accommodations, and restaurants. Use services like Viator, Booking.com, OpenTable, or create proper Google search URLs with encoded parameters

**OUTPUT STRUCTURE**
Return a detailed JSON object with:
{
  "destination": "Selected destination with explanation",
  "destinationReason": "Why this destination perfectly matches the traveler",
  "dailyItinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "Day theme",
      "weather": "Expected weather",
      "morning": {
        "time": "9:00 AM",
        "activity": "Specific activity name",
        "venue": "Exact venue name and address",
        "duration": "2 hours",
        "cost": "$25",
        "whyRecommended": "How this connects to their preferences",
        "bookingInfo": "Website or phone number",
        "bookingUrl": "https://actual-booking-url.com or search URL",
        "weatherBackup": "Alternative if weather changes"
      },
      "afternoon": { /* same structure */ },
      "evening": { /* same structure */ }
    }
  ],
  "accommodationRecommendations": [
    {
      "name": "Primary hotel recommendation",
      "type": "Matches their accommodation preference",
      "address": "Full address",
      "priceRange": "$150-200/night",
      "amenities": ["wifi", "pool"],
      "whyPerfect": "Why it matches their style perfectly",
      "bookingTip": "Best booking platform or time",
      "bookingUrl": "https://booking.com/search-url or direct hotel website",
      "rating": "4.5/5",
      "isPrimary": true
    },
    {
      "name": "Alternative option 1",
      "type": "Alternative accommodation type",
      "address": "Full address",
      "priceRange": "$120-150/night",
      "amenities": ["wifi", "gym"],
      "whyPerfect": "Alternative benefits",
      "bookingTip": "Booking advice",
      "bookingUrl": "https://booking.com/search-url or direct hotel website",
      "rating": "4.3/5",
      "isPrimary": false
    },
    {
      "name": "Alternative option 2",
      "type": "Budget/luxury alternative",
      "address": "Full address",
      "priceRange": "$200-250/night",
      "amenities": ["spa", "restaurant"],
      "whyPerfect": "Different value proposition",
      "bookingTip": "Booking strategy",
      "bookingUrl": "https://booking.com/search-url or direct hotel website",
      "rating": "4.7/5",
      "isPrimary": false
    }
  ],
   "restaurantGuide": [
     {
       "name": "Restaurant name from real data",
       "cuisine": "Cuisine type",
       "priceLevel": "$ to $$$$",
       "rating": "4.5/5",
       "address": "Full address",
       "specialties": ["dish1", "dish2"],
       "dietaryOptions": "Accommodates their restrictions",
       "reservationRequired": true,
       "bestTime": "When to visit",
       "mealType": "breakfast/lunch/dinner",
       "bookingUrl": "https://www.opentable.com/search-url or Google search URL"
     }
   ],
   "dailyRestaurantRecommendations": [
     {
       "day": 1,
       "breakfast": [
         { /* 3 restaurant options with same structure as restaurantGuide */ },
         { /* restaurant option 2 */ },
         { /* restaurant option 3 */ }
       ],
       "lunch": [
         { /* 3 restaurant options */ },
         { /* restaurant option 2 */ },
         { /* restaurant option 3 */ }
       ],
       "dinner": [
         { /* 3 restaurant options */ },
         { /* restaurant option 2 */ },
         { /* restaurant option 3 */ }
       ]
     }
   ],
   "budgetBreakdown": {
     "accommodation": "$${budgetCalculation.accommodationDaily} per day",
     "meals": "$${budgetCalculation.foodDaily} per day", 
     "activities": "$${budgetCalculation.activitiesDaily} per day",
     "transportation": "$${budgetCalculation.transportTotal} total",
     "emergencyFund": "$${budgetCalculation.emergencyFund}",
     "splurgeRecommendations": "$${budgetCalculation.splurgeAmount}",
     "dailyTotal": "$${budgetCalculation.accommodationDaily + budgetCalculation.foodDaily + budgetCalculation.activitiesDaily}",
     "tripTotal": "$${budgetCalculation.tripTotal}",
     "costMultiplier": "${budgetCalculation.costMultiplier}x",
     "budgetOptimization": {
       "prioritizeActivities": ${avgBudget < 1500 ? '"Choose budget accommodations to maximize activity funds"' : '"Balance comfort with experiences"'},
       "prioritizeComfort": ${avgBudget > 3000 ? '"Upgrade accommodations and include premium experiences"' : '"Focus on value for money options"'},
       "localSavings": "Use local transport, eat at local establishments, look for free activities",
       "splurgeWorthy": "Reserve splurge budget for unique destination-specific experiences"
     }
   },
   "insiderTips": [
     {
       "category": "Local Knowledge",
       "tip": "What locals actually do/avoid",
       "description": "Detailed insider information"
     },
     {
       "category": "Safety Tips",
       "tip": "Specific safety advice for this destination",
       "description": "Practical safety recommendations"
     },
     {
       "category": "Fun Enhancers",
       "tip": "Things that make the trip more enjoyable",
       "description": "Activities or experiences that add joy"
     },
     {
       "category": "Traveler Secrets",
       "tip": "What previous travelers wish they knew",
       "description": "Lessons learned from other visitors"
     },
     {
       "category": "Money Saving",
       "tip": "How to save money like a local",
       "description": "Practical cost-cutting advice"
     },
     {
       "category": "Cultural Etiquette",
       "tip": "Local customs and manners",
       "description": "How to respect local culture"
     }
   ],
  "packingList": ["Weather-appropriate items based on forecast"],
  "emergencyInfo": {
    "localEmergency": "Phone numbers",
    "nearestHospital": "Address and contact",
    "embassyInfo": "If international travel"
  }
}

Make this the most personalized, data-driven itinerary possible. Every single recommendation should feel intentional and perfectly matched to this specific traveler's preferences, group size, budget, and travel dates.`;

    console.log('Starting chunked AI generation for maximum detail...');
    
    // Split generation into chunks to avoid timeout while maximizing detail
    const chunkSize = Math.ceil(tripDuration / 2); // Split into 2 chunks for trips up to 14 days
    const chunks = [];
    
    for (let i = 0; i < tripDuration; i += chunkSize) {
      const startDay = i + 1;
      const endDay = Math.min(i + chunkSize, tripDuration);
      chunks.push({ startDay, endDay });
    }
    
    console.log(`Generating itinerary in ${chunks.length} chunks:`, chunks);
    
    let combinedItinerary: any = null;
    
    // Generate each chunk sequentially
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      console.log(`Generating chunk ${chunkIndex + 1}/${chunks.length}: Days ${chunk.startDay}-${chunk.endDay}`);
      
      const chunkPrompt = chunkIndex === 0 ? 
        // First chunk includes all metadata
        `${prompt}

Generate a detailed itinerary for DAYS ${chunk.startDay}-${chunk.endDay} of this ${tripDuration}-day trip. ${chunks.length > 1 ? `This is part 1 of ${chunks.length}. Focus on the opening days with arrival logistics and initial experiences.` : ''}

Return the complete JSON structure but only populate the dailyItinerary array for days ${chunk.startDay}-${chunk.endDay}. For other sections (destination, overview, accommodationGuide, restaurantGuide, budgetBreakdown, insiderTips, packingList, safetyGuide), provide ${chunkIndex === 0 ? 'COMPLETE' : 'minimal'} details.` :
        // Subsequent chunks focus on daily itinerary only
        `Continue the ${tripDuration}-day itinerary for ${targetDestination || tripData.specificDestinations[0]}. 

Generate DAYS ${chunk.startDay}-${chunk.endDay} (part ${chunkIndex + 1} of ${chunks.length}).

Budget context: $${budgetCalculation.accommodationDaily}/day accommodation, $${budgetCalculation.foodDaily}/day food, $${budgetCalculation.activitiesDaily}/day activities.

Return ONLY the dailyItinerary array for days ${chunk.startDay}-${chunk.endDay}. Make each day incredibly detailed with:
- 4-6 activities with specific timing, costs, booking info
- 3 meal recommendations per day with authentic local options
- Insider tips and local secrets
- Transportation between activities with estimated times and costs
- Weather-appropriate adjustments

Return format: { "dailyItinerary": [day ${chunk.startDay} object, day ${chunk.startDay + 1} object, ...] }`;

      let response;
      let controller: AbortController | null = null;
      let timeoutId: number | null = null;
      
      try {
        controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 45000); // 45s per chunk
        
        console.log(`Calling Anthropic API for chunk ${chunkIndex + 1}...`);
        
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01',
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 12000, // Much higher per chunk for maximum detail
            temperature: 0.3,
            messages: [
              {
                role: 'user',
                content: chunkPrompt
              }
            ],
          }),
        });
        
        if (timeoutId) clearTimeout(timeoutId);
        console.log(`Chunk ${chunkIndex + 1} API response status:`, response.status);
      } catch (fetchError: any) {
        if (timeoutId) clearTimeout(timeoutId);
        console.error(`Chunk ${chunkIndex + 1} API fetch error:`, {
          name: fetchError.name,
          message: fetchError.message,
        });
        throw new Error(`Failed to generate chunk ${chunkIndex + 1}: ${fetchError.message}`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Anthropic API error for chunk ${chunkIndex + 1}:`, response.status, errorText);
        throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
      }

      const anthropicResponse = await response.json();
      console.log(`Chunk ${chunkIndex + 1} response received, parsing...`);

      let chunkText = anthropicResponse.content[0].text;
      chunkText = chunkText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      let chunkData;
      try {
        chunkData = JSON.parse(chunkText);
        console.log(`Chunk ${chunkIndex + 1} parsed successfully`);
      } catch (parseError) {
        console.error(`Failed to parse chunk ${chunkIndex + 1} JSON:`, parseError);
        throw new Error(`Invalid JSON in chunk ${chunkIndex + 1}`);
      }

      // Merge chunks
      if (chunkIndex === 0) {
        combinedItinerary = chunkData;
      } else {
        // Append daily itinerary from this chunk
        if (chunkData.dailyItinerary && Array.isArray(chunkData.dailyItinerary)) {
          combinedItinerary.dailyItinerary = [
            ...(combinedItinerary.dailyItinerary || []),
            ...chunkData.dailyItinerary
          ];
        }
      }
    }

    console.log(`All ${chunks.length} chunks generated and combined successfully`);

    const itineraryData = combinedItinerary;

    // Store the generated itinerary (reuse existing supabase client)
    try {
      const { error: updateError } = await supabase
        .from('trips')
        .update({
          status: 'completed',
          itinerary_data: itineraryData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tripId);

      if (updateError) {
        console.error('Error updating trip with itinerary:', updateError);
        throw updateError;
      }

      console.log('Chunked itinerary generation completed successfully');
    } catch (dbError: any) {
      console.error('Database storage error:', {
        message: dbError.message,
        tripId: tripId
      });
      throw dbError;
    }

    return new Response(JSON.stringify({ 
      success: true,
      itinerary: itineraryData,
      destination: itineraryData.destination || targetDestination || (tripData.destinationType === 'specific' ? tripData.specificDestinations[0] : 'AI-selected'),
      duration: tripDuration,
      generatedAt: new Date().toISOString(),
      chunksGenerated: chunks.length,
      realTimeDataUsed: {
        weather: !!realTimeData.weather,
        attractions: realTimeData.attractions.length,
        restaurants: realTimeData.restaurants.length,
        events: realTimeData.events.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in generate-itinerary function:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.details || 'No additional details available'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});