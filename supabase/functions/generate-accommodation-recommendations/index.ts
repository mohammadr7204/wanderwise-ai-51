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

SMART FILTERING REQUIREMENTS:
${requestData.familyFriendly ? '- FAMILY: connecting rooms, kids club, pool, cribs available, family restaurants' : ''}
${requestData.businessTravel ? '- BUSINESS: workspace/desk, fast wifi, business center, meeting rooms, quiet zones' : ''}
${requestData.travelStyle === 'romantic' ? '- COUPLES: romantic settings, spa, adults-only areas, private dining' : ''}
${perNightBudget < 100 ? '- BUDGET: hostels, homestays, shared facilities, camping options, budget chains' : ''}
${perNightBudget > 300 ? '- LUXURY: premium amenities, concierge, fine dining, premium locations' : ''}

LOCATION INTELLIGENCE REQUIREMENTS:
1. Calculate realistic walking/driving times to planned activities
2. Include neighborhood safety score (1-10) with brief explanation
3. List 3-4 nearby restaurants/cafes within walking distance
4. Public transport accessibility score (1-10) with nearest stations
5. Mention nearby convenience stores, pharmacies, attractions

REALISTIC DETAILS REQUIRED:
1. Actual current market pricing for these specific dates
2. Recent guest review highlights (positive/negative)
3. Real amenities that match the price point and location
4. Specific room types available for group size
5. Seasonal considerations affecting availability/pricing
6. Local booking patterns and tips

For each recommendation, provide this EXACT JSON structure:
{
  "name": "realistic hotel/property name",
  "type": "Boutique Hotel/Luxury Resort/Modern Apartment/etc",
  "address": "specific street address or detailed area in ${requestData.destination}",
  "rating": 4.2, // realistic rating 3.8-4.9 based on price
  "priceRange": "$120-145/night", // actual market rates for dates
  "amenities": ["Free WiFi", "Pool", "Gym", "Restaurant", "Parking", "Spa"],
  "whyPerfect": "50-60 words explaining perfect match for their specific trip",
  "bookingTip": "practical tip for booking or staying here",
  "distanceToActivities": "specific distances/times to their planned activities",
  "locationIntelligence": {
    "safetyScore": 8,
    "safetyNotes": "well-lit streets, regular police patrols",
    "transportScore": 9,
    "transportDetails": "2-min walk to Metro Red Line, bus stops nearby",
    "nearbyDining": ["Cafe Luna (50m)", "Giuseppe's Pizza (100m)", "Corner Deli (75m)"],
    "conveniences": ["24h pharmacy across street", "Supermarket 200m", "ATM in lobby"]
  },
  "guestInsights": {
    "recentReviews": "Guests love the rooftop pool and central location. Some mention street noise on weekends.",
    "seasonalNotes": "High demand in ${new Date(requestData.startDate).toLocaleDateString('en-US', { month: 'long' })} - book early",
    "roomAvailability": "Standard doubles and family rooms available for your dates"
  }
}

Make it feel like real, researched recommendations with authentic local knowledge. Factor in:
- Current seasonal pricing and demand
- Real neighborhood characteristics
- Authentic local dining and transport options
- Genuine guest experience insights
- Practical booking considerations

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