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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tripData, tripDuration, userId, tripId } = await req.json();

    if (!anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    console.log(`Starting AI-powered itinerary generation for trip ${tripId}`);
    
    // Determine the destination for research
    const targetDestination = tripData.destinationType === 'specific' && tripData.specificDestinations?.length > 0
      ? tripData.specificDestinations[0]
      : null;

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

    // Create an enhanced AI prompt with real-time data integration
    const prompt = `Create a comprehensive ${tripDuration}-day travel itinerary using REAL-TIME DATA and deep personalization:

**TRIP OVERVIEW**
Title: ${tripData.title}
Duration: ${tripDuration} days
Travelers: ${tripData.groupSize} people
Budget: $${tripData.budgetMin.toLocaleString()} - $${tripData.budgetMax.toLocaleString()}
Travel Dates: ${tripData.startDate ? new Date(tripData.startDate).toLocaleDateString() : 'Flexible'} to ${tripData.endDate ? new Date(tripData.endDate).toLocaleDateString() : 'Flexible'}

**DESTINATION PREFERENCES**
${tripData.destinationType === 'surprise' ? 
  'SURPRISE DESTINATION: Research and select the perfect destination based on all preferences, weather, and seasonal factors' : 
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
- 5-day forecast: ${realTimeData.weather.forecast.map(f => 
  `${new Date(f.dt * 1000).toLocaleDateString()}: ${f.weather[0].description}, ${Math.round(f.main.temp)}°C`
).join(', ')}` : ''}

${realTimeData.attractions.length > 0 ? `
REAL ATTRACTIONS WITH RATINGS:
${realTimeData.attractions.map(a => 
  `- ${a.name} (${a.rating}/5 stars) at ${a.address}${a.priceLevel ? ` - Price level: ${a.priceLevel}/4` : ''}`
).join('\n')}` : ''}

${realTimeData.restaurants.length > 0 ? `
REAL RESTAURANTS WITH RATINGS:
${realTimeData.restaurants.map(r => 
  `- ${r.name} (${r.rating}/5 stars) at ${r.address}${r.priceLevel ? ` - Price level: ${r.priceLevel}/4` : ''}`
).join('\n')}` : ''}
 
${realTimeData.events.length > 0 ? `
CURRENT LOCAL EVENTS:
${realTimeData.events.map(e => 
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
    "accommodation": "$X per night",
    "meals": "$X per day",
    "activities": "$X per day",
    "transportation": "$X total",
    "dailyTotal": "$X",
    "tripTotal": "$X"
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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anthropicApiKey}`,
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 20000,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        system: `You are the world's most advanced AI travel planner with real-time access to current data. You have the thinking capabilities to deeply research and analyze:

1. CURRENT EVENTS: Research what's happening in destinations during travel dates
2. SEASONAL FACTORS: Consider weather, crowds, pricing variations, and seasonal attractions
3. CULTURAL IMMERSION: Find authentic local experiences beyond tourist traps
4. BUDGET OPTIMIZATION: Use real pricing data to maximize value within budget constraints
5. PERSONALIZATION DEPTH: Create itineraries that feel like they were crafted by someone who knows the traveler intimately
6. PRACTICAL EXCELLENCE: Ensure all recommendations are actionable with real contact info and booking details

Think step-by-step about each recommendation. Consider multiple factors:
- How does this activity align with their stated preferences?
- Is this the right time of year/weather for this activity?
- Does the price fit their budget range?
- Is this appropriate for their group size and accessibility needs?
- Are there authentic local alternatives to common tourist activities?

Return ONLY valid JSON. Do not include any text before or after the JSON object. Every recommendation must be backed by your research and reasoning about why it's perfect for this specific traveler.`
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const rawItinerary = data.content[0].text;

    console.log(`Generated itinerary for trip ${tripId} (${rawItinerary.length} characters)`);

    // Parse the JSON response from Claude
    let parsedItinerary;
    try {
      // Clean the response in case Claude added any extra text or markdown
      let cleanJson = rawItinerary;
      
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
      
      // Try to fix incomplete JSON by adding missing closing braces
      let braceCount = 0;
      for (let i = 0; i < cleanJson.length; i++) {
        if (cleanJson[i] === '{') braceCount++;
        if (cleanJson[i] === '}') braceCount--;
      }
      
      // Add missing closing braces
      while (braceCount > 0) {
        cleanJson += '}';
        braceCount--;
      }
      
      parsedItinerary = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw response length:', rawItinerary.length);
      console.error('Raw response preview:', rawItinerary.substring(0, 500));
      
      // Fallback: return the raw text
      parsedItinerary = {
        destination: tripData.destinationType === 'specific' ? tripData.specificDestinations[0] : 'AI-selected',
        rawContent: rawItinerary,
        error: 'Failed to parse structured response'
      };
    }

    // Store the complete itinerary in the database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
    } catch (dbError) {
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
      destination: parsedItinerary.destination || (tripData.destinationType === 'specific' ? tripData.specificDestinations[0] : 'AI-selected'),
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
  } catch (error) {
    console.error('Error in generate-itinerary function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});