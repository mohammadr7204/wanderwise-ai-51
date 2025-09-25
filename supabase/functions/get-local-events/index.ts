import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EventbriteEvent {
  name: { text: string }
  description: { text: string }
  start: { local: string }
  end: { local: string }
  url: string
  venue?: {
    name: string
    address: {
      localized_area_display: string
    }
  }
  ticket_availability: {
    minimum_ticket_price: {
      display: string
    }
  }
  category: {
    name: string
  }
}

export default async function handler(req: Request) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { destination, interests, startDate, endDate } = await req.json()

    const eventbriteToken = Deno.env.get('EVENTBRITE_API_KEY')
    if (!eventbriteToken) {
      throw new Error('Eventbrite API key not configured')
    }

    // Get location ID from destination name
    const locationResponse = await fetch(
      `https://www.eventbriteapi.com/v3/venues/search/?q=${encodeURIComponent(destination)}&token=${eventbriteToken}`
    )
    
    let locationId = null
    if (locationResponse.ok) {
      const locationData = await locationResponse.json()
      if (locationData.venues?.length > 0) {
        locationId = locationData.venues[0].address?.city
      }
    }

    // Search for events
    const searchParams = new URLSearchParams({
      'location.address': destination,
      'start_date.range_start': `${startDate}T00:00:00`,
      'start_date.range_end': `${endDate}T23:59:59`,
      'expand': 'venue,ticket_availability,category',
      'sort_by': 'best',
      'page_size': '50',
      'token': eventbriteToken
    })

    console.log('Fetching Eventbrite events for:', destination, startDate, endDate)
    
    const eventsResponse = await fetch(
      `https://www.eventbriteapi.com/v3/events/search/?${searchParams}`
    )

    if (!eventsResponse.ok) {
      console.error('Eventbrite API error:', eventsResponse.status, await eventsResponse.text())
      throw new Error('Failed to fetch events from Eventbrite')
    }

    const eventsData = await eventsResponse.json()
    console.log('Found', eventsData.events?.length || 0, 'events')

    // Process and filter events based on interests
    const processedEvents = eventsData.events?.map((event: EventbriteEvent) => ({
      id: event.url,
      title: event.name?.text || 'Untitled Event',
      description: event.description?.text?.substring(0, 200) + '...' || 'No description available',
      category: event.category?.name || 'General',
      location: event.venue?.name || event.venue?.address?.localized_area_display || destination,
      startTime: event.start?.local || '',
      endTime: event.end?.local || '',
      priceLevel: event.ticket_availability?.minimum_ticket_price?.display || 'Free',
      url: event.url,
      timeOfDay: getTimeOfDay(event.start?.local),
      isRecurring: false,
      tip: `Book in advance as this ${event.category?.name?.toLowerCase()} event might sell out!`
    })) || []

    // Filter events by user interests if provided
    const filteredEvents = interests && interests.length > 0 
      ? processedEvents.filter((event: any) => 
          interests.some((interest: string) => 
            event.title.toLowerCase().includes(interest.toLowerCase()) ||
            event.description.toLowerCase().includes(interest.toLowerCase()) ||
            event.category.toLowerCase().includes(interest.toLowerCase())
          )
        )
      : processedEvents

    // Add some curated local experiences based on destination
    const curatedExperiences = getCuratedExperiences(destination)
    
    const allExperiences = [...filteredEvents.slice(0, 10), ...curatedExperiences]

    return new Response(
      JSON.stringify({ 
        events: allExperiences,
        totalFound: eventsData.pagination?.object_count || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error fetching local events:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        events: getCuratedExperiences('') // Fallback to basic curated experiences
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}

function getTimeOfDay(dateString: string): string {
  if (!dateString) return 'anytime'
  
  const hour = new Date(dateString).getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 21) return 'evening'
  return 'night'
}

function getCuratedExperiences(destination: string) {
  const destinationLower = destination.toLowerCase()
  
  // Tokyo experiences
  if (destinationLower.includes('tokyo') || destinationLower.includes('japan')) {
    return [
      {
        id: 'tokyo-teamlab',
        title: 'teamLab Borderless Digital Art Museum',
        description: 'Immersive digital art experience with interactive installations',
        category: 'Art & Culture',
        location: 'Odaiba, Tokyo',
        timeOfDay: 'evening',
        priceLevel: '¥3,200',
        tip: 'Book tickets weeks in advance - they sell out quickly!',
        isRecurring: true,
        url: 'https://borderless.teamlab.art/'
      },
      {
        id: 'tokyo-onsen',
        title: 'Traditional Onsen Experience',
        description: 'Relax in natural hot springs following proper etiquette',
        category: 'Wellness',
        location: 'Hakone or Atami',
        timeOfDay: 'anytime',
        priceLevel: '¥800-2,000',
        tip: 'Shower thoroughly before entering the hot spring',
        isRecurring: true,
        url: '#'
      }
    ]
  }
  
  // Paris experiences
  if (destinationLower.includes('paris') || destinationLower.includes('france')) {
    return [
      {
        id: 'paris-marche',
        title: 'Marché des Enfants Rouges',
        description: "Paris's oldest covered market with authentic local food",
        category: 'Food & Drink',
        location: '39 Rue de Bretagne, 3rd arrondissement',
        timeOfDay: 'morning',
        priceLevel: '€5-15',
        tip: 'Visit Tuesday-Sunday mornings for the best selection',
        isRecurring: true,
        url: '#'
      },
      {
        id: 'paris-bistro',
        title: 'Local Bistros in the 11th',
        description: 'Authentic Parisian dining away from tourist areas',
        category: 'Food & Drink',
        location: '11th arrondissement',
        timeOfDay: 'evening',
        priceLevel: '€25-40',
        tip: 'Make reservations and embrace the slow dining culture',
        isRecurring: true,
        url: '#'
      }
    ]
  }
  
  // Bali experiences
  if (destinationLower.includes('bali') || destinationLower.includes('indonesia')) {
    return [
      {
        id: 'bali-ceremony',
        title: 'Purification Ceremony at Tirta Empul',
        description: 'Participate in traditional Balinese water blessing ritual',
        category: 'Cultural',
        location: 'Tampaksiring, Bali',
        timeOfDay: 'morning',
        priceLevel: 'Free (donations welcome)',
        tip: 'Wear modest clothing and bring a change of clothes',
        isRecurring: true,
        url: '#'
      },
      {
        id: 'bali-sunrise',
        title: 'Jatiluwih Rice Terraces Sunrise',
        description: 'Watch sunrise over UNESCO World Heritage rice terraces',
        category: 'Nature',
        location: 'Jatiluwih, Tabanan',
        timeOfDay: 'morning',
        priceLevel: 'Rp 40,000',
        tip: 'Start your journey at 4:30 AM to catch the sunrise',
        isRecurring: true,
        url: '#'
      }
    ]
  }
  
  // New York experiences
  if (destinationLower.includes('new york') || destinationLower.includes('nyc')) {
    return [
      {
        id: 'nyc-bodega',
        title: 'Authentic Bodega Culture Tour',
        description: 'Experience NYC corner store culture and grab a bacon egg and cheese',
        category: 'Cultural',
        location: 'Various neighborhoods',
        timeOfDay: 'morning',
        priceLevel: '$3-8',
        tip: 'Order a "baconeggncheese" and coffee for the full experience',
        isRecurring: true,
        url: '#'
      },
      {
        id: 'nyc-comedy',
        title: 'Comedy Cellar Underground Shows',
        description: 'Catch surprise appearances by famous comedians',
        category: 'Entertainment',
        location: 'Greenwich Village',
        timeOfDay: 'night',
        priceLevel: '$25-35',
        tip: 'Check their website for surprise guest lineups',
        isRecurring: true,
        url: '#'
      }
    ]
  }
  
  // Default experiences for other destinations
  return [
    {
      id: 'local-market',
      title: 'Local Market Exploration',
      description: 'Discover fresh produce, crafts, and local specialties',
      category: 'Cultural',
      location: 'City center',
      timeOfDay: 'morning',
      priceLevel: 'Free to browse',
      tip: 'Bring cash and a reusable bag for purchases',
      isRecurring: true,
      url: '#'
    }
  ]
}