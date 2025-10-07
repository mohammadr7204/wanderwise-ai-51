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

    const avgBudget = (tripData.budgetMin + tripData.budgetMax) / 2;
    const budgetCalculation = calculateDynamicBudget(targetDestination, avgBudget, tripDuration, tripData.groupSize);

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

    // ========== CALL 1: Core Itinerary (Sonnet 4) ==========
    const corePrompt = `Create the CORE ITINERARY for a ${tripDuration}-day trip using REAL-TIME DATA:

**TRIP OVERVIEW**
Title: ${tripData.title}
Duration: ${tripDuration} days
Travelers: ${tripData.groupSize} people
Budget: $${tripData.budgetMin.toLocaleString()} - $${tripData.budgetMax.toLocaleString()}
Travel Dates: ${tripData.startDate ? new Date(tripData.startDate).toLocaleDateString() : 'Flexible'} to ${tripData.endDate ? new Date(tripData.endDate).toLocaleDateString() : 'Flexible'}

**DESTINATION**
${tripData.destinationType === 'surprise' ? 
  `SMART-SELECTED: ${targetDestination}` : 
  `TARGET: ${tripData.specificDestinations.join(', ')}`
}
Travel Radius: ${tripData.travelRadius}
Climate Preferences: ${tripData.climatePreferences.join(', ') || 'No preference'}

**PREFERENCES**
Activities: ${tripData.activityTypes.join(', ')}
Accommodation: ${tripData.accommodationType.replace('-', ' ')}
Amenities: ${tripData.accommodationAmenities.join(', ') || 'Standard'}
Transport: ${tripData.transportPreferences.join(', ')}
Dietary: ${tripData.dietaryRestrictions.join(', ') || 'None'}
Food Adventure: ${tripData.foodAdventureLevel}/10
Accessibility: ${tripData.accessibilityNeeds || 'None'}
Special Requests: ${tripData.specialRequests || 'None'}

**REAL-TIME DATA**
${realTimeData.weather ? `
WEATHER FORECAST:
Current: ${realTimeData.weather.current.weather[0].description}, ${Math.round(realTimeData.weather.current.main.temp)}°C
5-day: ${realTimeData.weather.forecast.map((f: any) => 
  `${new Date(f.dt * 1000).toLocaleDateString()}: ${f.weather[0].description}, ${Math.round(f.main.temp)}°C`
).join(', ')}` : ''}

${realTimeData.attractions.length > 0 ? `
ATTRACTIONS WITH RATINGS:
${realTimeData.attractions.map((a: any) => 
  `- ${a.name} (${a.rating}/5) at ${a.address}${a.priceLevel ? ` - Price: ${a.priceLevel}/4` : ''}`
).join('\n')}` : ''}

${realTimeData.restaurants.length > 0 ? `
RESTAURANTS WITH RATINGS:
${realTimeData.restaurants.map((r: any) => 
  `- ${r.name} (${r.rating}/5) at ${r.address}${r.priceLevel ? ` - Price: ${r.priceLevel}/4` : ''}`
).join('\n')}` : ''}
 
${realTimeData.events.length > 0 ? `
LOCAL EVENTS:
${realTimeData.events.map((e: any) => 
  `- ${e.name} on ${new Date(e.startDate).toLocaleDateString()} at ${e.venue}${e.isFree ? ' (FREE)' : ''}`
).join('\n')}` : ''}

**OUTPUT JSON STRUCTURE (CORE ONLY)**
{
  "destination": "Selected destination with explanation",
  "destinationReason": "Why this destination matches perfectly",
  "dailyItinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "Day theme",
      "weather": "Expected weather",
      "morning": {
        "time": "9:00 AM",
        "activity": "Activity name",
        "venue": "Exact venue and address",
        "duration": "2 hours",
        "cost": "$25",
        "whyRecommended": "Connection to preferences",
        "bookingInfo": "Website/phone",
        "bookingUrl": "https://actual-url.com",
        "weatherBackup": "Alternative if weather changes"
      },
      "afternoon": { /* same structure */ },
      "evening": { /* same structure */ }
    }
  ],
  "accommodationRecommendations": [
    {
      "name": "Primary hotel",
      "type": "Matches preference",
      "address": "Full address",
      "priceRange": "$150-200/night",
      "amenities": ["wifi", "pool"],
      "whyPerfect": "Why it matches",
      "bookingTip": "Best platform",
      "bookingUrl": "https://booking.com/...",
      "rating": "4.5/5",
      "isPrimary": true
    },
    { /* 2 more alternatives */ }
  ],
  "dailyRestaurantRecommendations": [
    {
      "day": 1,
      "breakfast": [
        {
          "name": "Restaurant name",
          "cuisine": "Type",
          "priceLevel": "$$",
          "rating": "4.5/5",
          "address": "Full address",
          "specialties": ["dish1", "dish2"],
          "dietaryOptions": "Accommodations",
          "reservationRequired": true,
          "bestTime": "When to visit",
          "mealType": "breakfast",
          "bookingUrl": "https://opentable.com/..."
        },
        { /* option 2 */ },
        { /* option 3 */ }
      ],
      "lunch": [ /* 3 options */ ],
      "dinner": [ /* 3 options */ ]
    }
  ]
}

Focus on personalized activities, accommodations, and restaurants. Provide EXACTLY 3 options per meal per day. Use real venues from data above and research additional ones.`;

    console.log('[CALL 1] Making core itinerary request to Sonnet 4 (12k tokens)...');
    
    const coreResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anthropicApiKey}`,
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 12000,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: corePrompt
          }
        ],
        system: `You are an expert travel planner. Create personalized, data-driven itineraries using real-time information. Return ONLY valid JSON. Every recommendation must connect to traveler preferences.`
      }),
    });

    if (!coreResponse.ok) {
      const errorText = await coreResponse.text();
      console.error('[CALL 1] Anthropic API error:', errorText);
      throw new Error(`Core itinerary failed: ${coreResponse.status} ${errorText}`);
    }

    const coreData = await coreResponse.json();
    const rawCoreItinerary = coreData.content[0].text;

    console.log(`[CALL 1] Core itinerary generated (${rawCoreItinerary.length} characters)`);

    // ========== CALL 2: Supplementary Data (Haiku for cost savings) ==========
    const supplementaryPrompt = `Generate SUPPLEMENTARY TRAVEL DATA for this trip:

**TRIP CONTEXT**
Destination: ${targetDestination || tripData.specificDestinations?.[0] || 'Unknown'}
Duration: ${tripDuration} days
Budget: $${tripData.budgetMin}-${tripData.budgetMax}
Group: ${tripData.groupSize} people
Climate: ${tripData.climatePreferences.join(', ') || 'Any'}
Activities: ${tripData.activityTypes.join(', ')}

**BUDGET CONTEXT**
Cost Multiplier: ${budgetCalculation.costMultiplier}x
Daily Accommodation: $${budgetCalculation.accommodationDaily}
Daily Food: $${budgetCalculation.foodDaily}
Daily Activities: $${budgetCalculation.activitiesDaily}
Total Transport: $${budgetCalculation.transportTotal}
Emergency Fund: $${budgetCalculation.emergencyFund}

**OUTPUT JSON STRUCTURE (SUPPLEMENTARY ONLY)**
{
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
      "prioritizeActivities": "Strategy based on budget level",
      "prioritizeComfort": "Balance advice",
      "localSavings": "How to save money locally",
      "splurgeWorthy": "Where to spend extra"
    }
  },
  "packingList": {
    "clothing": ["item1", "item2"],
    "electronics": ["item1", "item2"],
    "toiletries": ["item1", "item2"],
    "documents": ["item1", "item2"],
    "miscellaneous": ["item1", "item2"]
  },
  "insiderTips": [
    {
      "category": "Local Knowledge",
      "tip": "What locals do/avoid",
      "description": "Detailed info"
    },
    {
      "category": "Safety Tips",
      "tip": "Safety advice",
      "description": "Practical recommendations"
    },
    {
      "category": "Money Saving",
      "tip": "How to save",
      "description": "Cost-cutting advice"
    },
    {
      "category": "Cultural Etiquette",
      "tip": "Local customs",
      "description": "Respect local culture"
    }
  ],
  "emergencyInfo": {
    "localEmergency": "Emergency phone numbers",
    "nearestHospital": "Address and contact",
    "embassyInfo": "Embassy details if international",
    "localPolice": "Police contact info"
  }
}

Focus on practical, destination-specific information.`;

    console.log('[CALL 2] Making supplementary data request to Haiku (8k tokens)...');
    
    const suppResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anthropicApiKey}`,
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 8000,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: supplementaryPrompt
          }
        ],
        system: `You are a travel logistics expert. Generate budget breakdowns, packing lists, safety info, and insider tips. Return ONLY valid JSON.`
      }),
    });

    if (!suppResponse.ok) {
      const errorText = await suppResponse.text();
      console.error('[CALL 2] Anthropic API error:', errorText);
      throw new Error(`Supplementary data failed: ${suppResponse.status} ${errorText}`);
    }

    const suppData = await suppResponse.json();
    const rawSuppData = suppData.content[0].text;

    console.log(`[CALL 2] Supplementary data generated (${rawSuppData.length} characters)`);

    // Helper function to clean and parse JSON
    function parseAIResponse(rawResponse: string, callName: string): any {
      try {
        let cleanJson = rawResponse;
        
        // Remove markdown code blocks if present
        if (cleanJson.includes('```json')) {
          cleanJson = cleanJson.replace(/```json\s*/, '');
          cleanJson = cleanJson.replace(/\s*```\s*$/, '');
        }
        
        // Find the JSON object
        const jsonStart = cleanJson.indexOf('{');
        const jsonEnd = cleanJson.lastIndexOf('}') + 1;
        
        if (jsonStart === -1 || jsonEnd === 0) {
          throw new Error('No JSON object found in response');
        }
        
        cleanJson = cleanJson.substring(jsonStart, jsonEnd);
        
        // Try to fix incomplete JSON
        let braceCount = 0;
        let bracketCount = 0;
        let inString = false;
        let lastChar = '';
        
        for (let i = 0; i < cleanJson.length; i++) {
          const char = cleanJson[i];
          
          if (char === '"' && lastChar !== '\\') {
            inString = !inString;
          }
          
          if (!inString) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
            if (char === '[') bracketCount++;
            if (char === ']') bracketCount--;
          }
          
          lastChar = char;
        }
        
        cleanJson = cleanJson.trimEnd();
        if (cleanJson.endsWith(',')) {
          cleanJson = cleanJson.slice(0, -1);
        }
        
        while (bracketCount > 0) {
          cleanJson += ']';
          bracketCount--;
        }
        
        while (braceCount > 0) {
          cleanJson += '}';
          braceCount--;
        }
        
        return JSON.parse(cleanJson);
      } catch (parseError) {
        console.error(`[${callName}] Failed to parse JSON:`, parseError);
        console.error(`[${callName}] Raw length:`, rawResponse.length);
        console.error(`[${callName}] Preview:`, rawResponse.substring(0, 500));
        throw parseError;
      }
    }

    // Parse both responses
    let parsedCore, parsedSupplementary;
    
    try {
      parsedCore = parseAIResponse(rawCoreItinerary, 'CALL 1');
      console.log('[CALL 1] Successfully parsed core itinerary');
    } catch (error) {
      console.error('[CALL 1] Parse failed, using fallback');
      parsedCore = {
        destination: tripData.destinationType === 'specific' ? tripData.specificDestinations[0] : targetDestination || 'AI-selected',
        rawContent: rawCoreItinerary,
        error: 'Failed to parse core response'
      };
    }

    try {
      parsedSupplementary = parseAIResponse(rawSuppData, 'CALL 2');
      console.log('[CALL 2] Successfully parsed supplementary data');
    } catch (error) {
      console.error('[CALL 2] Parse failed, using defaults');
      parsedSupplementary = {
        budgetBreakdown: {},
        packingList: {},
        insiderTips: [],
        emergencyInfo: {}
      };
    }

    // Combine both responses into final itinerary
    const parsedItinerary = {
      ...parsedCore,
      budgetBreakdown: parsedSupplementary.budgetBreakdown || {},
      packingList: parsedSupplementary.packingList || {},
      insiderTips: parsedSupplementary.insiderTips || [],
      emergencyInfo: parsedSupplementary.emergencyInfo || {}
    };

    console.log('Combined itinerary created successfully');

    // Store the complete itinerary in the database
    try {
      console.log(`Attempting to store itinerary for trip ${tripId}`);
      console.log('Itinerary content preview:', JSON.stringify(parsedItinerary).substring(0, 200) + '...');
      console.log('Real-time data keys:', Object.keys(realTimeData));
      
      const itineraryResult = await supabase
        .from('itineraries')
        .upsert({
          trip_id: tripId,
          content: parsedItinerary,
          generated_at: new Date().toISOString(),
          real_time_data: realTimeData
        });
      
      if (itineraryResult.error) {
        console.error('Itinerary insertion error:', itineraryResult.error);
        throw new Error(`Failed to store itinerary: ${itineraryResult.error.message}`);
      }
      
      console.log('Itinerary stored successfully, now updating trip status...');
      
      // Update trip status
      const tripUpdateResult = await supabase
        .from('trips')
        .update({ status: 'completed' })
        .eq('id', tripId);
        
      if (tripUpdateResult.error) {
        console.error('Trip status update error:', tripUpdateResult.error);
        throw new Error(`Failed to update trip status: ${tripUpdateResult.error.message}`);
      }
        
      console.log(`Itinerary and trip status updated successfully for trip ${tripId}`);
    } catch (dbError: any) {
      console.error('Database storage error details:', {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code,
        tripId: tripId
      });
      throw dbError; // Re-throw to be caught by outer try-catch
    }

    return new Response(JSON.stringify({ 
      success: true,
      itinerary: parsedItinerary,
      destination: parsedItinerary.destination || targetDestination || (tripData.destinationType === 'specific' ? tripData.specificDestinations[0] : 'AI-selected'),
      duration: tripDuration,
      generatedAt: new Date().toISOString(),
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
      details: error.details,
      hint: error.hint,
      code: error.code,
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