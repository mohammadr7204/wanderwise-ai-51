import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create a detailed prompt for the AI
    const prompt = `
Create a detailed ${tripDuration}-day travel itinerary based on the following preferences:

**Trip Details:**
- Title: ${tripData.title}
- Duration: ${tripDuration} days
- Group Size: ${tripData.groupSize} travelers
- Budget: $${tripData.budgetMin.toLocaleString()} - $${tripData.budgetMax.toLocaleString()}
- Dates: ${tripData.startDate ? new Date(tripData.startDate).toLocaleDateString() : 'Flexible'} to ${tripData.endDate ? new Date(tripData.endDate).toLocaleDateString() : 'Flexible'}

**Destination Preferences:**
- Type: ${tripData.destinationType === 'surprise' ? 'Surprise me with the perfect destination based on my preferences' : `Specific destinations: ${tripData.specificDestinations.join(', ')}`}
- Travel Radius: ${tripData.travelRadius}
- Climate Preferences: ${tripData.climatePreferences.length > 0 ? tripData.climatePreferences.join(', ') : 'No specific preference'}

**Activity Interests:**
- Activities: ${tripData.activityTypes.join(', ')}
- Accommodation: ${tripData.accommodationType.replace('-', ' ')}
- Accommodation Amenities: ${tripData.accommodationAmenities.length > 0 ? tripData.accommodationAmenities.join(', ') : 'Standard amenities'}

**Travel Preferences:**
- Transportation: ${tripData.transportPreferences.join(', ')}
- Dietary Restrictions: ${tripData.dietaryRestrictions.length > 0 ? tripData.dietaryRestrictions.join(', ') : 'No restrictions'}
- Food Adventure Level: ${tripData.foodAdventureLevel}/10
- Accessibility Needs: ${tripData.accessibilityNeeds || 'None specified'}
- Special Requests: ${tripData.specialRequests || 'None'}

Please create a comprehensive itinerary that includes:

1. **Destination Selection** (if surprise option chosen): Choose the perfect destination based on the preferences
2. **Day-by-Day Schedule**: Detailed activities for each day with timing
3. **Accommodation Recommendations**: Specific hotels/stays that match preferences and budget
4. **Restaurant Suggestions**: Meals for breakfast, lunch, and dinner with local specialties
5. **Transportation**: How to get around and between locations
6. **Budget Breakdown**: Estimated costs for activities, meals, and accommodation
7. **Travel Tips**: Local customs, weather considerations, and packing suggestions
8. **Alternative Options**: Backup plans for weather or other contingencies

Format the response in a clear, engaging way that feels like a personalized travel guide. Include specific addresses, websites, and contact information where possible. Make it feel adventurous and exciting while being practical and informative.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert travel planner with extensive knowledge of destinations worldwide. Create detailed, personalized itineraries that are practical, exciting, and perfectly tailored to each traveler\'s preferences and budget. Be specific with recommendations and include helpful local insights.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedItinerary = data.choices[0].message.content;

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