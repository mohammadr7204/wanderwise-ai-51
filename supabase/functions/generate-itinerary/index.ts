import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Create a detailed prompt for Claude
    const prompt = `Create a comprehensive ${tripDuration}-day travel itinerary based on these preferences:

**TRIP OVERVIEW**
Title: ${tripData.title}
Duration: ${tripDuration} days
Travelers: ${tripData.groupSize} people
Budget: $${tripData.budgetMin.toLocaleString()} - $${tripData.budgetMax.toLocaleString()}
Travel Dates: ${tripData.startDate ? new Date(tripData.startDate).toLocaleDateString() : 'Flexible'} to ${tripData.endDate ? new Date(tripData.endDate).toLocaleDateString() : 'Flexible'}

**DESTINATION PREFERENCES**
${tripData.destinationType === 'surprise' ? 
  'SURPRISE DESTINATION: Select the perfect destination based on all preferences below' : 
  `TARGET DESTINATIONS: ${tripData.specificDestinations.join(', ')}`
}
Travel Radius: ${tripData.travelRadius}
Climate Preferences: ${tripData.climatePreferences.length > 0 ? tripData.climatePreferences.join(', ') : 'No specific preference'}

**ACTIVITY INTERESTS**
Preferred Activities: ${tripData.activityTypes.join(', ')}
Accommodation Style: ${tripData.accommodationType.replace('-', ' ')}
Desired Amenities: ${tripData.accommodationAmenities.length > 0 ? tripData.accommodationAmenities.join(', ') : 'Standard amenities'}

**TRAVEL LOGISTICS**
Transportation: ${tripData.transportPreferences.join(', ')}
Dietary Requirements: ${tripData.dietaryRestrictions.length > 0 ? tripData.dietaryRestrictions.join(', ') : 'No restrictions'}
Food Adventure Level: ${tripData.foodAdventureLevel}/10 (1=familiar foods, 10=try everything)
Accessibility Needs: ${tripData.accessibilityNeeds || 'None specified'}
Special Requests: ${tripData.specialRequests || 'None'}

**DELIVERABLE REQUIREMENTS**
Please provide a complete travel guide including:

1. **DESTINATION CHOICE** (if surprise): Select and explain the perfect destination
2. **DAILY ITINERARY**: Hour-by-hour schedule for each day
3. **ACCOMMODATION**: Specific hotel/lodging recommendations with addresses
4. **DINING**: Restaurant suggestions for all meals with cuisine types and price ranges
5. **TRANSPORTATION**: Detailed getting-around instructions
6. **BUDGET BREAKDOWN**: Estimated costs for activities, meals, accommodation
7. **PRACTICAL INFO**: Packing tips, local customs, weather considerations
8. **BACKUP PLANS**: Alternative activities for different weather/circumstances

Make this feel like a personalized travel guide from an expert who knows the traveler's preferences intimately. Include specific addresses, websites, and insider tips. Be detailed but engaging!`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anthropicApiKey}`,
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        system: 'You are an expert travel planner with extensive knowledge of destinations worldwide. Create detailed, personalized itineraries that are practical, exciting, and perfectly tailored to each traveler\'s preferences and budget. Be specific with recommendations and include helpful local insights. Write in an engaging, enthusiastic tone that makes travelers excited about their upcoming adventure.'
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedItinerary = data.content[0].text;

    console.log(`Generated itinerary for trip ${tripId} (${generatedItinerary.length} characters)`);

    return new Response(JSON.stringify({ 
      itinerary: generatedItinerary,
      destination: tripData.destinationType === 'specific' ? tripData.specificDestinations[0] : 'AI-selected',
      duration: tripDuration,
      generatedAt: new Date().toISOString()
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