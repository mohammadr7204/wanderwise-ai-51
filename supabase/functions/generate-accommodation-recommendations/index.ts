import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AccommodationRequest {
  destination: string;
  startDate: string;
  endDate: string;
  groupSize: number;
  budget: number;
  travelStyle: string;
  accommodationType: string;
  familyFriendly?: boolean;
  businessTravel?: boolean;
  activities: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const requestData: AccommodationRequest = await req.json();
    console.log('Generating accommodation recommendations for:', requestData);

    const nights = Math.ceil((new Date(requestData.endDate).getTime() - new Date(requestData.startDate).getTime()) / (1000 * 60 * 60 * 24));
    const accommodationBudget = requestData.budget * 0.3; // 30% of total budget for accommodation
    const perNightBudget = accommodationBudget / nights;

    const prompt = `Generate 3-4 accommodation recommendations for ${requestData.destination} that perfectly match these specifications:

TRIP DETAILS:
- Destination: ${requestData.destination}
- Dates: ${requestData.startDate} to ${requestData.endDate} (${nights} nights)
- Group size: ${requestData.groupSize} people
- Budget per night: $${Math.round(perNightBudget)}
- Travel style: ${requestData.travelStyle}
- Accommodation type preference: ${requestData.accommodationType}
- Family friendly needed: ${requestData.familyFriendly ? 'Yes' : 'No'}
- Business travel: ${requestData.businessTravel ? 'Yes' : 'No'}
- Planned activities: ${requestData.activities.join(', ')}

REQUIREMENTS:
1. Include both hotels AND Airbnb options when relevant
2. Consider location proximity to planned activities
3. Match the travel style and accommodation preferences
4. Factor in family/business needs
5. Stay within budget while maximizing value

For each recommendation, provide:
- name (realistic hotel/property name)
- type ("Boutique Hotel", "Luxury Resort", "Modern Apartment", "Historic B&B", etc.)
- address (specific neighborhood/area in the destination)
- rating (4.1-4.9 stars, realistic for the price point)
- priceRange (actual $ amount per night range)
- amenities (6-8 relevant amenities)
- whyPerfect (50-60 words explaining why this is perfect for their trip)
- bookingTip (practical tip for booking or staying here)
- distanceToActivities (how it relates to their planned activities)

Make recommendations feel authentic and location-specific. Consider:
- Local neighborhood character
- Seasonal factors affecting pricing
- Cultural preferences in that destination
- Realistic amenities for the price point
- Actual travel patterns and logistics

Return ONLY valid JSON array with no additional text:`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anthropicApiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    console.log('Raw LLM response:', content);

    // Parse the JSON response
    let accommodations;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        accommodations = JSON.parse(jsonMatch[0]);
      } else {
        accommodations = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Content that failed to parse:', content);
      throw new Error('Failed to parse accommodation recommendations');
    }

    // Validate the structure
    if (!Array.isArray(accommodations)) {
      throw new Error('Invalid response format: expected array');
    }

    console.log('Generated accommodations:', accommodations.length);

    return new Response(JSON.stringify({ accommodations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-accommodation-recommendations:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to generate accommodation recommendations'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});