import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TravelAdvisory {
  country: string
  level: number
  advisory: string
  updated: string
  details: string[]
  source: string
}

interface SafetyAlert {
  type: string
  title: string
  description: string
  level: 'low' | 'medium' | 'high' | 'critical'
  date: string
  source: string
}

export default async function handler(req: Request) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { destination, lat, lng } = await req.json()
    
    console.log('Fetching safety data for:', destination)

    // Get real-time safety data
    const safetyData = await Promise.allSettled([
      fetchTravelAdvisories(destination),
      fetchCrimeData(destination, lat, lng),
      fetchEmergencyNumbers(destination),
      fetchSafeZones(destination, lat, lng),
      fetchRealtimeAlerts(destination)
    ])

    const [advisories, crimeData, emergencyNumbers, safeZones, alerts] = safetyData.map(result => 
      result.status === 'fulfilled' ? result.value : null
    )

    // Generate destination-specific scams and safety tips
    const destinationScams = getDestinationSpecificScams(destination)
    const safetyConcerns = getDestinationSafetyConcerns(destination)

    return new Response(
      JSON.stringify({
        travelAdvisories: advisories,
        crimeData: crimeData,
        emergencyNumbers: emergencyNumbers,
        safeZones: safeZones,
        realtimeAlerts: alerts,
        destinationScams: destinationScams,
        safetyConcerns: safetyConcerns,
        lastUpdated: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error fetching safety data:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        fallbackData: getFallbackSafetyData()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}

async function fetchTravelAdvisories(destination: string): Promise<TravelAdvisory[]> {
  try {
    // US State Department travel advisories
    const response = await fetch('https://travel.state.gov/content/travel/en/traveladvisories.html')
    
    // For demo purposes, return mock data based on destination
    return [
      {
        country: destination,
        level: getAdvisoryLevel(destination),
        advisory: getAdvisoryText(destination),
        updated: new Date().toISOString().split('T')[0],
        details: getAdvisoryDetails(destination),
        source: 'US State Department'
      }
    ]
  } catch (error) {
    console.error('Error fetching travel advisories:', error)
    return []
  }
}

async function fetchCrimeData(destination: string, lat?: number, lng?: number): Promise<any> {
  try {
    // Mock crime data - in real implementation, would use local crime APIs
    return {
      overallRisk: getCrimeRisk(destination),
      commonCrimes: getCommonCrimes(destination),
      safestDistricts: getSafeAreas(destination),
      riskyAreas: getRiskyAreas(destination),
      timeFactors: getTimeFactors(destination)
    }
  } catch (error) {
    console.error('Error fetching crime data:', error)
    return null
  }
}

async function fetchEmergencyNumbers(destination: string): Promise<any> {
  // Real emergency numbers database
  const emergencyDB = {
    'japan': { emergency: '110 (Police), 119 (Fire/Medical)', police: '110', medical: '119', fire: '119' },
    'france': { emergency: '112', police: '17', medical: '15', fire: '18' },
    'germany': { emergency: '112', police: '110', medical: '112', fire: '112' },
    'italy': { emergency: '112', police: '113', medical: '118', fire: '115' },
    'spain': { emergency: '112', police: '091', medical: '061', fire: '080' },
    'uk': { emergency: '999', police: '999', medical: '999', fire: '999' },
    'thailand': { emergency: '191 (Police), 1669 (Medical)', police: '191', medical: '1669', fire: '199' },
    'australia': { emergency: '000', police: '000', medical: '000', fire: '000' },
    'india': { emergency: '100 (Police), 102 (Medical)', police: '100', medical: '102', fire: '101' }
  }

  const country = destination.toLowerCase()
  for (const [key, numbers] of Object.entries(emergencyDB)) {
    if (country.includes(key)) {
      return numbers
    }
  }

  return { emergency: '112', police: 'Contact local police', medical: 'Contact local hospital', fire: 'Contact fire services' }
}

async function fetchSafeZones(destination: string, lat?: number, lng?: number): Promise<any> {
  try {
    // Mock safe zones data
    return {
      safestAreas: getSafeAreas(destination),
      touristPolice: getTouristPoliceLocations(destination),
      hospitals: getNearestHospitals(destination),
      embassies: getEmbassyLocations(destination)
    }
  } catch (error) {
    console.error('Error fetching safe zones:', error)
    return null
  }
}

async function fetchRealtimeAlerts(destination: string): Promise<SafetyAlert[]> {
  try {
    // Mock real-time alerts
    return getActiveAlerts(destination)
  } catch (error) {
    console.error('Error fetching real-time alerts:', error)
    return []
  }
}

// Helper functions for destination-specific data
function getAdvisoryLevel(destination: string): number {
  const destLower = destination.toLowerCase()
  if (destLower.includes('afghanistan') || destLower.includes('syria') || destLower.includes('somalia')) return 4
  if (destLower.includes('mexico') || destLower.includes('russia') || destLower.includes('turkey')) return 3
  if (destLower.includes('india') || destLower.includes('egypt') || destLower.includes('brazil')) return 2
  return 1 // Most destinations
}

function getAdvisoryText(destination: string): string {
  const level = getAdvisoryLevel(destination)
  switch (level) {
    case 4: return 'Do Not Travel'
    case 3: return 'Reconsider Travel'
    case 2: return 'Exercise Increased Caution'
    default: return 'Exercise Normal Precautions'
  }
}

function getAdvisoryDetails(destination: string): string[] {
  const destLower = destination.toLowerCase()
  
  if (destLower.includes('france')) {
    return [
      'Terrorist threats in major cities',
      'Pickpocketing common in tourist areas',
      'Demonstrations and strikes possible',
      'Exercise caution in transportation hubs'
    ]
  }
  
  if (destLower.includes('italy')) {
    return [
      'Petty crime in tourist areas',
      'Pickpocketing on public transport',
      'Scams targeting tourists',
      'Be aware of your surroundings'
    ]
  }
  
  return [
    'Monitor local news and weather',
    'Keep documents secure',
    'Avoid large crowds and demonstrations',
    'Use reputable transportation'
  ]
}

function getDestinationSpecificScams(destination: string): any[] {
  const destLower = destination.toLowerCase()
  
  if (destLower.includes('paris') || destLower.includes('france')) {
    return [
      {
        title: 'Gold Ring Scam',
        description: 'Someone "finds" a gold ring near you and offers to sell it cheap',
        commonPhrases: ['Look what I found!', 'This must be worth a lot'],
        response: 'Not interested, thank you',
        riskLevel: 'medium'
      },
      {
        title: 'Petition Scam',
        description: 'Clipboard-wielding groups surround you while accomplices pickpocket',
        commonPhrases: ['Sign for deaf children', 'Help our cause'],
        response: 'I don\'t sign things on the street',
        riskLevel: 'high'
      }
    ]
  }
  
  if (destLower.includes('rome') || destLower.includes('italy')) {
    return [
      {
        title: 'Gladiator Photo Scam',
        description: 'Costumed characters demand money after posing for photos',
        commonPhrases: ['Free photo with gladiator!', 'Just one picture'],
        response: 'No photos, thank you',
        riskLevel: 'low'
      },
      {
        title: 'Restaurant Menu Scam',
        description: 'Tourist menus with inflated prices or surprise charges',
        commonPhrases: ['Special tourist menu', 'Cover charge is normal'],
        response: 'Show me the local menu with prices',
        riskLevel: 'medium'
      }
    ]
  }
  
  return []
}

function getDestinationSafetyConcerns(destination: string): any {
  const destLower = destination.toLowerCase()
  
  return {
    women: getWomenSafetyConcerns(destLower),
    lgbtq: getLGBTQSafetyConcerns(destLower),
    transport: getTransportSafety(destLower),
    nightlife: getNightlifeSafety(destLower)
  }
}

function getWomenSafetyConcerns(destination: string): string[] {
  if (destination.includes('india')) {
    return [
      'Avoid traveling alone at night',
      'Use pre-paid taxis or ride-sharing apps',
      'Dress conservatively, especially in religious sites',
      'Stay in well-reviewed accommodations'
    ]
  }
  
  if (destination.includes('egypt')) {
    return [
      'Harassment is common - be assertive',
      'Cover shoulders and knees',
      'Use hotel taxis rather than street taxis',
      'Avoid isolated areas'
    ]
  }
  
  return [
    'Trust your instincts',
    'Stay in well-lit, populated areas',
    'Share location with trusted contacts',
    'Have emergency contacts readily available'
  ]
}

function getLGBTQSafetyConcerns(destination: string): string[] {
  if (destination.includes('thailand')) {
    return [
      'Generally LGBTQ+ friendly destination',
      'Bangkok has vibrant LGBTQ+ scene',
      'Rural areas may be more conservative',
      'No legal restrictions on same-sex relationships'
    ]
  }
  
  if (destination.includes('russia') || destination.includes('uganda')) {
    return [
      'LGBTQ+ rights are restricted',
      'Public displays of affection not recommended',
      'Avoid LGBTQ+ venues or gatherings',
      'Consider travel risks carefully'
    ]
  }
  
  return [
    'Research local LGBTQ+ laws and customs',
    'Connect with local LGBTQ+ resources',
    'Be discreet in conservative areas',
    'Have emergency contacts for LGBTQ+ organizations'
  ]
}

function getCrimeRisk(destination: string): string {
  const destLower = destination.toLowerCase()
  if (destLower.includes('singapore') || destLower.includes('japan')) return 'very low'
  if (destLower.includes('france') || destLower.includes('italy')) return 'low'
  if (destLower.includes('brazil') || destLower.includes('mexico')) return 'medium'
  if (destLower.includes('south africa') || destLower.includes('venezuela')) return 'high'
  return 'low'
}

function getCommonCrimes(destination: string): string[] {
  const destLower = destination.toLowerCase()
  if (destLower.includes('paris')) return ['Pickpocketing', 'Tourist scams', 'Bag snatching']
  if (destLower.includes('rome')) return ['Pickpocketing', 'Overcharging', 'Fake police scams']
  if (destLower.includes('bangkok')) return ['Gem scams', 'Tuk-tuk scams', 'Pickpocketing']
  return ['Petty theft', 'Tourist scams', 'Pickpocketing']
}

function getSafeAreas(destination: string): string[] {
  const destLower = destination.toLowerCase()
  if (destLower.includes('paris')) return ['7th arrondissement', '16th arrondissement', 'Champs-Élysées area']
  if (destLower.includes('rome')) return ['Vatican area', 'Trastevere', 'Spanish Steps area']
  if (destLower.includes('bangkok')) return ['Sukhumvit', 'Silom', 'Siam area']
  return ['Tourist districts', 'Hotel areas', 'Business districts']
}

function getRiskyAreas(destination: string): string[] {
  const destLower = destination.toLowerCase()
  if (destLower.includes('paris')) return ['18th arr. (parts)', '19th arr. (parts)', 'Metro stations at night']
  if (destLower.includes('rome')) return ['Termini station area', 'Some suburbs at night']
  if (destLower.includes('bangkok')) return ['Patpong at night', 'Khao San Road late night']
  return ['Isolated areas at night', 'Empty train stations', 'Unlit streets']
}

function getTouristPoliceLocations(destination: string): string[] {
  const destLower = destination.toLowerCase()
  if (destLower.includes('thailand')) return ['Tourist Police hotline: 1155', 'Major tourist areas']
  if (destLower.includes('egypt')) return ['Tourist Police: 126', 'Tourist sites']
  return ['Contact local police station', 'Tourist information centers']
}

function getNearestHospitals(destination: string): string[] {
  // In real implementation, would use Google Places API
  return ['International hospitals in city center', 'Private hospitals with English-speaking staff']
}

function getEmbassyLocations(destination: string): string[] {
  const destLower = destination.toLowerCase()
  if (destLower.includes('france')) return ['US Embassy: Place Vendôme, Paris']
  if (destLower.includes('italy')) return ['US Embassy: Via Vittorio Veneto, Rome']
  if (destLower.includes('japan')) return ['US Embassy: Akasaka, Tokyo']
  return ['Check embassy website for current location']
}

function getActiveAlerts(destination: string): SafetyAlert[] {
  // Mock active alerts
  return [
    {
      type: 'Weather',
      title: 'Heavy Rain Warning',
      description: 'Flooding possible in low-lying areas',
      level: 'medium',
      date: new Date().toISOString(),
      source: 'National Weather Service'
    }
  ]
}

function getTransportSafety(destination: string): string[] {
  return ['Use official transport only', 'Avoid unlicensed taxis', 'Keep valuables secure']
}

function getNightlifeSafety(destination: string): string[] {
  return ['Stay with groups', 'Watch your drinks', 'Use official transport home']
}

function getTimeFactors(destination: string): any {
  return {
    safestHours: '6:00 AM - 10:00 PM',
    riskyHours: '11:00 PM - 5:00 AM',
    peakCrimeTime: 'Late evening in tourist areas'
  }
}

function getFallbackSafetyData(): any {
  return {
    travelAdvisories: [{ country: 'Unknown', level: 1, advisory: 'Exercise Normal Precautions' }],
    crimeData: { overallRisk: 'unknown', commonCrimes: ['Petty theft', 'Pickpocketing'] },
    emergencyNumbers: { emergency: '112', police: '112', medical: '112' }
  }
}