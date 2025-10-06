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

// Destination pools and selection logic
interface DestinationOption {
  name: string;
  country: string;
  climate: string;
  bestMonths: number[];
  activities: string[];
  avgCost: number;
}

interface DestinationPools {
  [key: string]: DestinationOption[];
}

const DESTINATION_POOLS: DestinationPools = {
  adventure: [
    { name: 'Queenstown', country: 'New Zealand', climate: 'temperate', bestMonths: [1,2,3,11,12], activities: ['hiking', 'bungee jumping', 'skiing'], avgCost: 150 },
    { name: 'Interlaken', country: 'Switzerland', climate: 'alpine', bestMonths: [6,7,8,9], activities: ['hiking', 'paragliding', 'skiing'], avgCost: 200 },
    { name: 'Moab', country: 'USA', climate: 'desert', bestMonths: [3,4,5,9,10], activities: ['rock climbing', 'mountain biking', 'hiking'], avgCost: 120 },
  ],
  beach: [
    { name: 'Bali', country: 'Indonesia', climate: 'tropical', bestMonths: [4,5,6,7,8,9], activities: ['surfing', 'diving', 'yoga'], avgCost: 60 },
    { name: 'Maldives', country: 'Maldives', climate: 'tropical', bestMonths: [11,12,1,2,3,4], activities: ['diving', 'snorkeling', 'relaxation'], avgCost: 300 },
    { name: 'Santorini', country: 'Greece', climate: 'mediterranean', bestMonths: [5,6,9,10], activities: ['beach', 'sightseeing', 'dining'], avgCost: 180 },
  ],
  cultural: [
    { name: 'Kyoto', country: 'Japan', climate: 'temperate', bestMonths: [3,4,10,11], activities: ['temples', 'gardens', 'tea ceremony'], avgCost: 140 },
    { name: 'Rome', country: 'Italy', climate: 'mediterranean', bestMonths: [4,5,9,10], activities: ['museums', 'architecture', 'dining'], avgCost: 130 },
    { name: 'Marrakech', country: 'Morocco', climate: 'desert', bestMonths: [3,4,5,10,11], activities: ['markets', 'architecture', 'food tours'], avgCost: 70 },
  ],
  foodie: [
    { name: 'Bangkok', country: 'Thailand', climate: 'tropical', bestMonths: [11,12,1,2], activities: ['street food', 'cooking classes', 'markets'], avgCost: 50 },
    { name: 'San Sebastian', country: 'Spain', climate: 'oceanic', bestMonths: [6,7,8,9], activities: ['pintxos', 'michelin dining', 'wine'], avgCost: 150 },
    { name: 'Lima', country: 'Peru', climate: 'subtropical', bestMonths: [12,1,2,3], activities: ['ceviche', 'fine dining', 'markets'], avgCost: 80 },
  ],
  nature: [
    { name: 'Iceland', country: 'Iceland', climate: 'subarctic', bestMonths: [6,7,8], activities: ['glaciers', 'waterfalls', 'northern lights'], avgCost: 180 },
    { name: 'Costa Rica', country: 'Costa Rica', climate: 'tropical', bestMonths: [12,1,2,3,4], activities: ['wildlife', 'rainforest', 'beaches'], avgCost: 100 },
    { name: 'Patagonia', country: 'Argentina/Chile', climate: 'subarctic', bestMonths: [11,12,1,2,3], activities: ['hiking', 'glaciers', 'wildlife'], avgCost: 130 },
  ],
  cityExploration: [
    { name: 'Barcelona', country: 'Spain', climate: 'mediterranean', bestMonths: [4,5,6,9,10], activities: ['architecture', 'museums', 'nightlife'], avgCost: 120 },
    { name: 'Prague', country: 'Czech Republic', climate: 'temperate', bestMonths: [4,5,6,9,10], activities: ['architecture', 'beer', 'history'], avgCost: 80 },
    { name: 'Singapore', country: 'Singapore', climate: 'tropical', bestMonths: [2,3,4,11,12], activities: ['food', 'shopping', 'gardens'], avgCost: 160 },
  ],
};

async function selectOptimalDestination(tripData: any, userId: string, supabase: any, currentMonth: number): Promise<string> {
  const { travelPreferences, specificDestinations } = tripData;
  
  if (specificDestinations?.length > 0) {
    return specificDestinations[0];
  }
  
  let candidates: DestinationOption[] = [];
  
  if (travelPreferences?.length > 0) {
    travelPreferences.forEach((pref: string) => {
      const pool = DESTINATION_POOLS[pref];
      if (pool) {
        candidates.push(...pool);
      }
    });
  } else {
    Object.values(DESTINATION_POOLS).forEach(pool => {
      candidates.push(...pool.filter((_, i) => i < 2));
    });
  }
  
  const scoredDestinations = candidates.map(dest => {
    let score = 0;
    
    if (dest.bestMonths.includes(currentMonth)) {
      score += 50;
    }
    
    const budget = tripData.budgetLevel;
    if (budget === 'budget' && dest.avgCost < 80) score += 30;
    if (budget === 'moderate' && dest.avgCost >= 80 && dest.avgCost <= 150) score += 30;
    if (budget === 'luxury' && dest.avgCost > 150) score += 30;
    
    if (travelPreferences?.length > 0) {
      travelPreferences.forEach((pref: string) => {
        if (dest.activities.some(act => act.toLowerCase().includes(pref.toLowerCase()))) {
          score += 20;
        }
      });
    }
    
    return { ...dest, score };
  });
  
  scoredDestinations.sort((a, b) => b.score - a.score);
  
  if (scoredDestinations.length > 0) {
    const topCandidates = scoredDestinations.slice(0, 3);
    const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];
    
    return selected.name;
  }
  
  const fallbacks = ['Portugal', 'Thailand', 'Morocco', 'Costa Rica', 'Czech Republic'];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// Main handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tripData, tripDuration, userId, tripId } = await req.json();
    
    console.log('Request received with data:', {
      tripData: !!tripData,
      tripDuration,
      userId,
      tripId
    });
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Immediately update trip status to 'generating'
    await supabase
      .from('trips')
      .update({ 
        status: 'generating',
        updated_at: new Date().toISOString()
      })
      .eq('id', tripId);
    
    // Start background generation
    const backgroundGeneration = async () => {
      try {
        await generateItinerary(tripData, tripDuration, userId, tripId, supabase);
      } catch (error: any) {
        console.error('Background generation error:', error);
        await supabase
          .from('trips')
          .update({ 
            status: 'error',
            updated_at: new Date().toISOString()
          })
          .eq('id', tripId);
      }
    };
    
    // Use EdgeRuntime.waitUntil for background processing
    (globalThis as any).EdgeRuntime?.waitUntil(backgroundGeneration());
    
    // Return immediately
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Generation started in background',
      tripId,
      status: 'generating'
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

// Main generation function (runs in background)
async function generateItinerary(
  tripData: any,
  tripDuration: number,
  userId: string,
  tripId: string,
  supabase: any
) {
  console.log('Background generation started for trip:', tripId);
  
  // Determine the destination for research
  let targetDestination: string | null = null;
  
  if (tripData.destinationType === 'specific' && tripData.specificDestinations?.length > 0) {
    targetDestination = tripData.specificDestinations[0];
  } else if (tripData.destinationType === 'surprise') {
    const currentMonth = new Date().getMonth() + 1;
    targetDestination = await selectOptimalDestination(tripData, userId, supabase, currentMonth);
    console.log(`AI selected surprise destination: ${targetDestination}`);
  }

  // Gather real-time data
  console.log('Gathering real-time data...');
  const [weatherData, attractions, restaurants, events, currencyRates] = await Promise.allSettled([
    targetDestination ? getWeatherForecast(targetDestination, tripData.startDate, tripData.endDate) : null,
    targetDestination ? getGooglePlaces(targetDestination, 'tourist_attraction') : [],
    targetDestination ? getGooglePlaces(targetDestination, 'restaurant') : [],
    targetDestination ? getLocalEvents(targetDestination, tripData.startDate, tripData.endDate) : [],
    getCurrencyExchange()
  ]);

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
    'Tokyo': 1.8, 'Japan': 1.8, 'Switzerland': 1.9, 'Norway': 1.8, 'Iceland': 1.7,
    'Singapore': 1.6, 'Paris': 1.5, 'London': 1.6, 'New York': 1.7, 'Dubai': 1.5,
    'Barcelona': 1.2, 'Rome': 1.3, 'Amsterdam': 1.4, 'Berlin': 1.1, 'Prague': 0.9,
    'Thailand': 0.5, 'Vietnam': 0.4, 'India': 0.3, 'Nepal': 0.4, 'Mexico': 0.6,
  };

  function calculateDynamicBudget(destination: string | null, totalBudget: number, duration: number, groupSize: number): any {
    if (!destination) destination = 'Unknown';
    
    const costMultiplier = DESTINATION_COST_INDEX[destination] || 1.0;
    const perPersonBudget = totalBudget / groupSize;
    const dailyBudget = perPersonBudget / duration;
    
    const accommodationDaily = Math.round((dailyBudget * 0.35) * costMultiplier);
    const foodDaily = Math.round((dailyBudget * 0.30) * costMultiplier);
    const activitiesDaily = Math.round((dailyBudget * 0.25) * costMultiplier);
    const transportDaily = Math.round((dailyBudget * 0.10) * costMultiplier);
    
    const tripTotal = (accommodationDaily + foodDaily + activitiesDaily + transportDaily) * duration * groupSize;
    
    return {
      accommodationDaily,
      foodDaily,
      activitiesDaily,
      transportDaily,
      tripTotal,
      perPersonDaily: dailyBudget,
      maxBudget: totalBudget,
      exceedsLimit: tripTotal > totalBudget
    };
  }

  console.log('Calculating budget...');
  const budgetCalculation = calculateDynamicBudget(
    targetDestination,
    tripData.budget,
    tripDuration,
    tripData.groupSize || 1
  );

  console.log('Initial budget calculation:', {
    tripTotal: budgetCalculation.tripTotal,
    maxBudget: budgetCalculation.maxBudget,
    exceedsLimit: budgetCalculation.exceedsLimit
  });

  // Build comprehensive AI prompt
  const prompt = `Create a hyper-detailed, personalized ${tripDuration}-day travel itinerary. [Rest of prompt...]`;

  console.log('Starting chunked AI generation for maximum detail...');
  
  const chunkSize = Math.ceil(tripDuration / 2);
  const chunks = [];
  
  for (let i = 0; i < tripDuration; i += chunkSize) {
    const startDay = i + 1;
    const endDay = Math.min(i + chunkSize, tripDuration);
    chunks.push({ startDay, endDay });
  }
  
  console.log(`Generating itinerary in ${chunks.length} chunks:`, chunks);
  
  let combinedItinerary: any = null;
  
  // Generate each chunk sequentially with incremental saving
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex];
    console.log(`Generating chunk ${chunkIndex + 1}/${chunks.length}: Days ${chunk.startDay}-${chunk.endDay}`);
    
    const chunkPrompt = chunkIndex === 0 ? 
      `${prompt}\n\nGenerate a detailed itinerary for DAYS ${chunk.startDay}-${chunk.endDay} of this ${tripDuration}-day trip.` :
      `Continue the ${tripDuration}-day itinerary. Generate DAYS ${chunk.startDay}-${chunk.endDay}.`;

    try {
      console.log(`Calling Anthropic API for chunk ${chunkIndex + 1}...`);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 12000,
          temperature: 0.3,
          messages: [{ role: 'user', content: chunkPrompt }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const anthropicResponse = await response.json();
      let chunkText = anthropicResponse.content[0].text;
      chunkText = chunkText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const chunkData = JSON.parse(chunkText);
      
      // Merge chunks
      if (chunkIndex === 0) {
        combinedItinerary = chunkData;
      } else {
        if (chunkData.dailyItinerary && Array.isArray(chunkData.dailyItinerary)) {
          combinedItinerary.dailyItinerary = [
            ...(combinedItinerary.dailyItinerary || []),
            ...chunkData.dailyItinerary
          ];
        }
      }
      
      // Save progress after each chunk
      const partialItinerary = {
        ...combinedItinerary,
        generationProgress: {
          chunksCompleted: chunkIndex + 1,
          totalChunks: chunks.length,
          percentComplete: Math.round(((chunkIndex + 1) / chunks.length) * 100)
        }
      };
      
      await supabase
        .from('trips')
        .update({
          itinerary_data: partialItinerary,
          updated_at: new Date().toISOString()
        })
        .eq('id', tripId);
      
      console.log(`Chunk ${chunkIndex + 1}/${chunks.length} saved to database`);
      
    } catch (error: any) {
      console.error(`Error generating chunk ${chunkIndex + 1}:`, error);
      throw error;
    }
  }

  console.log(`All ${chunks.length} chunks generated successfully`);

  // Store final itinerary
  await supabase
    .from('trips')
    .update({
      status: 'completed',
      itinerary_data: combinedItinerary,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tripId);

  console.log('Itinerary generation completed successfully');
}
