import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RestaurantRequest {
  destination: string;
  startDate: string;
  endDate: string;
  groupSize: number;
  budget: number;
  dietaryRestrictions: string[];
  mealTypes: string[];
  travelStyle: string;
  preferences: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    const googlePlacesApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    
    if (!anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const requestData: RestaurantRequest = await req.json();
    console.log('Generating restaurant recommendations for:', requestData);

    const days = Math.ceil((new Date(requestData.endDate).getTime() - new Date(requestData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const dailyFoodBudget = (requestData.budget * 0.25) / days; // 25% of total budget for food per day
    
    // Get destination cost index for price adjustment
    const costMultiplier = getCostMultiplier(requestData.destination);
    const adjustedBudget = dailyFoodBudget * costMultiplier;

    const budgetBreakdown = {
      breakfast: Math.round(adjustedBudget * 0.2), // 20% for breakfast
      lunch: Math.round(adjustedBudget * 0.35),    // 35% for lunch
      dinner: Math.round(adjustedBudget * 0.45)    // 45% for dinner
    };

    const prompt = `Generate comprehensive restaurant recommendations for ${requestData.destination} that perfectly match these specifications:

TRIP DETAILS:
- Destination: ${requestData.destination}
- Dates: ${requestData.startDate} to ${requestData.endDate} (${days} days)
- Group size: ${requestData.groupSize} people
- Daily food budget: $${Math.round(adjustedBudget)}
- Breakfast budget: $${budgetBreakdown.breakfast}/person
- Lunch budget: $${budgetBreakdown.lunch}/person  
- Dinner budget: $${budgetBreakdown.dinner}/person
- Travel style: ${requestData.travelStyle}
- Dietary restrictions: ${requestData.dietaryRestrictions.join(', ') || 'None'}
- Meal preferences: ${requestData.preferences.join(', ') || 'None'}

CRITICAL REQUIREMENTS - FOLLOW EXACTLY:

1. MEAL TYPE STRUCTURE (3 restaurants per meal type):
   - BREAKFAST: Hotel restaurant (convenient), Local café (authentic), Bakery/market (budget)
   - LUNCH: Quick bite (fast), Sit-down restaurant (experience), Food market/street food (local)
   - DINNER: Local favorite (authentic), Special occasion (splurge), Casual dining (comfortable)

2. PRICE DIVERSITY (for each meal type):
   - Budget option: Under $${Math.round(budgetBreakdown.breakfast * 0.7)}-${Math.round(budgetBreakdown.lunch * 0.7)}-${Math.round(budgetBreakdown.dinner * 0.7)}/person
   - Mid-range: $${Math.round(budgetBreakdown.breakfast * 0.8)}-${Math.round(budgetBreakdown.lunch * 0.8)}-${Math.round(budgetBreakdown.dinner * 0.8)} to $${Math.round(budgetBreakdown.breakfast * 1.2)}-${Math.round(budgetBreakdown.lunch * 1.2)}-${Math.round(budgetBreakdown.dinner * 1.2)}/person
   - Splurge: $${Math.round(budgetBreakdown.breakfast * 1.3)}-${Math.round(budgetBreakdown.lunch * 1.3)}-${Math.round(budgetBreakdown.dinner * 1.3)}+/person

3. DIETARY ACCOMMODATIONS:
${requestData.dietaryRestrictions.map(restriction => 
  `   - ${restriction.toUpperCase()}: Include specific menu options, preparation notes, and local language phrases`
).join('\n')}
   - Include allergen warnings for common allergens (nuts, gluten, dairy, shellfish)
   - Provide dietary request phrases in local language

4. BOOKING & PRACTICAL INFO:
   - Google Maps coordinates for navigation
   - Phone numbers for reservations
   - Average wait times for walk-ins
   - Best times to visit (least crowded)
   - Reservation requirements and tips

For each restaurant, provide this EXACT JSON structure:
{
  "name": "Restaurant Name",
  "mealType": "breakfast|lunch|dinner",
  "subcategory": "hotel restaurant|local café|bakery|quick bite|sit-down|food market|local favorite|special occasion|casual dining",
  "cuisine": "Local cuisine type",
  "address": "Full street address",
  "coordinates": {"lat": 40.7128, "lng": -74.0060},
  "priceRange": "budget|mid-range|splurge",
  "avgCostPerPerson": 25,
  "rating": 4.3,
  "phoneNumber": "+1-555-123-4567",
  "description": "50-60 words about atmosphere, specialties, why perfect for this meal",
  "signature_dishes": ["Dish 1", "Dish 2", "Dish 3"],
  "dietary_options": {
    "vegetarian": ["Menu items available"],
    "vegan": ["Menu items available"], 
    "gluten_free": ["Menu items available"],
    "halal": ["Menu items available"],
    "kosher": ["Menu items available"]
  },
  "allergen_warnings": ["Contains nuts", "May contain traces of gluten"],
  "booking_info": {
    "reservations_required": true,
    "avg_wait_time": "15-20 minutes",
    "best_time_to_visit": "11:30 AM before lunch rush",
    "booking_tip": "Call ahead or use OpenTable"
  },
  "local_phrases": {
    "dietary_request": "I have dietary restrictions - [local language]",
    "recommendation": "What do you recommend? - [local language]",
    "thank_you": "Thank you - [local language]"
  },
  "google_maps_url": "https://maps.google.com/?q=restaurant+name+address",
  "why_perfect": "Specific reason why this fits their trip style and meal needs"
}

Generate exactly 9 restaurants total (3 for each meal type). Make recommendations feel authentic with:
- Real local neighborhood knowledge
- Seasonal menu considerations for travel dates
- Cultural dining customs and etiquette tips
- Realistic pricing for the destination
- Actual local phrases and pronunciation guides

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
    let restaurants;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        restaurants = JSON.parse(jsonMatch[0]);
      } else {
        restaurants = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Content that failed to parse:', content);
      throw new Error('Failed to parse restaurant recommendations');
    }

    // Validate the structure
    if (!Array.isArray(restaurants)) {
      throw new Error('Invalid response format: expected array');
    }

    console.log('Generated restaurants:', restaurants.length);

    return new Response(JSON.stringify({ restaurants }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-restaurant-recommendations:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to generate restaurant recommendations'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function getCostMultiplier(destination: string): number {
  const destLower = destination.toLowerCase();
  
  // High cost destinations
  if (destLower.includes('switzerland') || destLower.includes('norway') || 
      destLower.includes('iceland') || destLower.includes('singapore') ||
      destLower.includes('monaco') || destLower.includes('denmark')) {
    return 1.8;
  }
  
  // Expensive cities
  if (destLower.includes('tokyo') || destLower.includes('london') || 
      destLower.includes('paris') || destLower.includes('new york') ||
      destLower.includes('san francisco') || destLower.includes('zurich')) {
    return 1.5;
  }
  
  // Moderate cost
  if (destLower.includes('germany') || destLower.includes('australia') || 
      destLower.includes('canada') || destLower.includes('netherlands') ||
      destLower.includes('italy') || destLower.includes('spain')) {
    return 1.2;
  }
  
  // Lower cost destinations
  if (destLower.includes('thailand') || destLower.includes('vietnam') || 
      destLower.includes('india') || destLower.includes('nepal') ||
      destLower.includes('guatemala') || destLower.includes('laos')) {
    return 0.4;
  }
  
  // Budget destinations
  if (destLower.includes('cambodia') || destLower.includes('bangladesh') || 
      destLower.includes('bolivia') || destLower.includes('myanmar')) {
    return 0.3;
  }
  
  // Default moderate pricing
  return 1.0;
}