import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmergencyContact {
  service: string
  number: string
  description: string
  priority: 'critical' | 'important' | 'useful'
  available24h: boolean
}

interface Hospital {
  name: string
  address: string
  phone: string
  emergency: boolean
  englishSpeaking: boolean
  distance: string
}

interface Embassy {
  name: string
  address: string
  phone: string
  emergencyPhone: string
  hours: string
  services: string[]
}

export default async function handler(req: Request) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { destination, lat, lng } = await req.json()
    const googlePlacesApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    
    console.log('Fetching emergency data for:', destination)

    // Get emergency data
    const emergencyData = await Promise.allSettled([
      fetchEmergencyNumbers(destination),
      fetchNearestHospitals(destination, lat, lng, googlePlacesApiKey),
      fetchEmbassyContacts(destination),
      fetchLocalEmergencyPhrases(destination),
      fetchTrustedTransport(destination),
      fetchOfflineMapLinks(destination)
    ])

    const [emergencyNumbers, hospitals, embassies, phrases, transport, mapLinks] = emergencyData.map(result => 
      result.status === 'fulfilled' ? result.value : null
    )

    return new Response(
      JSON.stringify({
        emergencyNumbers: emergencyNumbers,
        hospitals: hospitals,
        embassies: embassies,
        emergencyPhrases: phrases,
        trustedTransport: transport,
        offlineMapLinks: mapLinks,
        insuranceInfo: getInsuranceInfo(),
        lastUpdated: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error fetching emergency data:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        fallbackData: getFallbackEmergencyData()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}

async function fetchEmergencyNumbers(destination: string): Promise<EmergencyContact[]> {
  const emergencyDB = getEmergencyDatabase()
  const country = getCountryFromDestination(destination)
  const countryData = emergencyDB[country] || emergencyDB['default']
  
  return [
    {
      service: 'Emergency Services',
      number: countryData.emergency,
      description: 'Police, Fire, Medical Emergency',
      priority: 'critical',
      available24h: true
    },
    {
      service: 'Police',
      number: countryData.police,
      description: 'Crime, theft, assault, urgent police matters',
      priority: 'critical',
      available24h: true
    },
    {
      service: 'Medical Emergency',
      number: countryData.medical,
      description: 'Ambulance, hospital emergency, life-threatening situations',
      priority: 'critical',
      available24h: true
    },
    {
      service: 'Fire Department',
      number: countryData.fire,
      description: 'Fire, explosion, rescue operations',
      priority: 'critical',
      available24h: true
    },
    {
      service: 'Tourist Police',
      number: countryData.touristPolice || 'Contact regular police',
      description: 'Tourist-specific issues, scams, guidance',
      priority: 'important',
      available24h: countryData.touristPolice ? true : false
    }
  ]
}

async function fetchNearestHospitals(destination: string, lat?: number, lng?: number, apiKey?: string): Promise<Hospital[]> {
  if (!apiKey || !lat || !lng) {
    console.log('No Google Places API key or coordinates, using mock hospitals')
    return getMockHospitals(destination)
  }

  try {
    // Search for hospitals near the location
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=hospital&rankby=prominence&key=${apiKey}`
    )
    
    if (!response.ok) {
      console.error('Google Places API error:', response.status)
      return getMockHospitals(destination)
    }
    
    const data = await response.json()
    
    if (!data.results || data.results.length === 0) {
      console.log('No hospitals found, using mock data')
      return getMockHospitals(destination)
    }

    // Get details for each hospital including phone numbers
    const hospitalsWithDetails = await Promise.all(
      data.results.slice(0, 5).map(async (hospital: any) => {
        try {
          const detailsResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${hospital.place_id}&fields=name,formatted_address,formatted_phone_number,opening_hours&key=${apiKey}`
          )
          const details = await detailsResponse.json()
          
          return {
            name: hospital.name,
            address: hospital.vicinity || details.result?.formatted_address || 'Address not available',
            phone: details.result?.formatted_phone_number || 'Call local directory',
            emergency: true,
            englishSpeaking: isInternationalLocation(destination),
            distance: 'Nearby'
          }
        } catch (error) {
          console.error('Error fetching hospital details:', error)
          return {
            name: hospital.name,
            address: hospital.vicinity,
            phone: 'Call local directory',
            emergency: true,
            englishSpeaking: isInternationalLocation(destination),
            distance: 'Nearby'
          }
        }
      })
    )
    
    return hospitalsWithDetails
    
  } catch (error) {
    console.error('Error fetching hospitals:', error)
    return getMockHospitals(destination)
  }
}

async function fetchEmbassyContacts(destination: string): Promise<Embassy[]> {
  // Database of major embassy contacts
  const embassyDB = getEmbassyDatabase()
  const country = getCountryFromDestination(destination)
  
  return embassyDB[country] || [
    {
      name: 'US Embassy/Consulate',
      address: 'Check embassy website for current address',
      phone: 'Check embassy website',
      emergencyPhone: 'Check embassy website for emergency line',
      hours: 'Monday-Friday 8:00-17:00 (varies)',
      services: ['Lost passport replacement', 'Emergency assistance', 'Legal aid', 'Citizen services']
    }
  ]
}

async function fetchLocalEmergencyPhrases(destination: string): Promise<any> {
  const country = getCountryFromDestination(destination)
  const phrasesDB = getEmergencyPhrasesDatabase()
  
  return phrasesDB[country] || phrasesDB['english']
}

async function fetchTrustedTransport(destination: string): Promise<any> {
  const country = getCountryFromDestination(destination)
  const transportDB = getTrustedTransportDatabase()
  
  return transportDB[country] || {
    rideshare: ['Check local ride-sharing apps'],
    taxi: ['Use hotel taxis', 'Airport official taxis'],
    emergency: ['Contact emergency services for transport'],
    tips: ['Always check driver identification', 'Share trip details with someone']
  }
}

async function fetchOfflineMapLinks(destination: string): Promise<any> {
  return {
    googleMaps: `https://www.google.com/maps/search/${encodeURIComponent(destination)}`,
    osmand: 'https://osmand.net/',
    mapsMe: 'https://maps.me/',
    citymapper: 'https://citymapper.com/',
    instructions: [
      'Download maps before traveling',
      'Download offline translation apps',
      'Save important locations offline',
      'Screenshot critical information'
    ]
  }
}

function getEmergencyDatabase(): any {
  return {
    'france': {
      emergency: '112',
      police: '17',
      medical: '15',
      fire: '18',
      touristPolice: '17'
    },
    'italy': {
      emergency: '112',
      police: '113',
      medical: '118',
      fire: '115',
      touristPolice: '113'
    },
    'spain': {
      emergency: '112',
      police: '091',
      medical: '061',
      fire: '080',
      touristPolice: '091'
    },
    'germany': {
      emergency: '112',
      police: '110',
      medical: '112',
      fire: '112'
    },
    'japan': {
      emergency: '110 (Police) / 119 (Fire/Medical)',
      police: '110',
      medical: '119',
      fire: '119'
    },
    'thailand': {
      emergency: '191 (Police) / 1669 (Medical)',
      police: '191',
      medical: '1669',
      fire: '199',
      touristPolice: '1155'
    },
    'india': {
      emergency: '100 (Police) / 102 (Medical)',
      police: '100',
      medical: '102',
      fire: '101'
    },
    'uk': {
      emergency: '999',
      police: '999',
      medical: '999',
      fire: '999'
    },
    'australia': {
      emergency: '000',
      police: '000',
      medical: '000',
      fire: '000'
    },
    'default': {
      emergency: '112',
      police: 'Contact local police',
      medical: 'Contact local hospital',
      fire: 'Contact fire services'
    }
  }
}

function getEmbassyDatabase(): any {
  return {
    'france': [
      {
        name: 'US Embassy Paris',
        address: '2 Avenue Gabriel, 75008 Paris, France',
        phone: '+33-1-43-12-22-22',
        emergencyPhone: '+33-1-43-12-22-22',
        hours: 'Monday-Friday 8:30-17:00',
        services: ['Emergency citizen services', 'Passport replacement', 'Consular services']
      }
    ],
    'italy': [
      {
        name: 'US Embassy Rome',
        address: 'Via Vittorio Veneto 121, 00187 Roma, Italy',
        phone: '+39-06-46741',
        emergencyPhone: '+39-06-46741',
        hours: 'Monday-Friday 8:30-17:30',
        services: ['Emergency citizen services', 'Passport replacement', 'Consular services']
      }
    ],
    'japan': [
      {
        name: 'US Embassy Tokyo',
        address: '1-10-5 Akasaka, Minato-ku, Tokyo 107-8420, Japan',
        phone: '+81-3-3224-5000',
        emergencyPhone: '+81-3-3224-5000',
        hours: 'Monday-Friday 8:30-17:30',
        services: ['Emergency citizen services', 'Passport replacement', 'Consular services']
      }
    ],
    'thailand': [
      {
        name: 'US Embassy Bangkok',
        address: '95 Wireless Road, Bangkok 10330, Thailand',
        phone: '+66-2-205-4000',
        emergencyPhone: '+66-2-205-4000',
        hours: 'Monday-Friday 7:00-16:00',
        services: ['Emergency citizen services', 'Passport replacement', 'Consular services']
      }
    ]
  }
}

function getEmergencyPhrasesDatabase(): any {
  return {
    'france': {
      'Help!': { phrase: 'Au secours!', pronunciation: 'oh-SKOOR' },
      'Call the police!': { phrase: 'Appelez la police!', pronunciation: 'ah-play lah po-LEES' },
      'I need a doctor': { phrase: 'J\'ai besoin d\'un médecin', pronunciation: 'zhay buh-ZWAN dun may-DSAN' },
      'Fire!': { phrase: 'Au feu!', pronunciation: 'oh FUH' },
      'Emergency!': { phrase: 'Urgence!', pronunciation: 'ur-ZHAHNSS' },
      'I don\'t speak French': { phrase: 'Je ne parle pas français', pronunciation: 'zhuh nuh parl pah frahn-SAY' },
      'Where is the hospital?': { phrase: 'Où est l\'hôpital?', pronunciation: 'oo ay loh-pee-TAHL' }
    },
    'italy': {
      'Help!': { phrase: 'Aiuto!', pronunciation: 'ah-YOO-toh' },
      'Call the police!': { phrase: 'Chiamate la polizia!', pronunciation: 'kee-ah-MAH-teh lah po-lee-TSEE-ah' },
      'I need a doctor': { phrase: 'Ho bisogno di un medico', pronunciation: 'oh bee-ZOHN-yoh dee oon MEH-dee-koh' },
      'Fire!': { phrase: 'Fuoco!', pronunciation: 'foo-OH-koh' },
      'Emergency!': { phrase: 'Emergenza!', pronunciation: 'eh-mer-JEN-tsah' },
      'I don\'t speak Italian': { phrase: 'Non parlo italiano', pronunciation: 'nohn PAR-loh ee-tah-lee-AH-noh' },
      'Where is the hospital?': { phrase: 'Dov\'è l\'ospedale?', pronunciation: 'doh-VEH loh-speh-DAH-leh' }
    },
    'spain': {
      'Help!': { phrase: '¡Ayuda!', pronunciation: 'ah-YOO-dah' },
      'Call the police!': { phrase: '¡Llamen a la policía!', pronunciation: 'YAH-men ah lah po-lee-SEE-ah' },
      'I need a doctor': { phrase: 'Necesito un médico', pronunciation: 'neh-seh-SEE-toh oon MEH-dee-koh' },
      'Fire!': { phrase: '¡Fuego!', pronunciation: 'foo-EH-goh' },
      'Emergency!': { phrase: '¡Emergencia!', pronunciation: 'eh-mer-HEN-see-ah' },
      'I don\'t speak Spanish': { phrase: 'No hablo español', pronunciation: 'noh AH-bloh es-pah-NYOHL' },
      'Where is the hospital?': { phrase: '¿Dónde está el hospital?', pronunciation: 'DOHN-deh es-TAH el oh-spee-TAHL' }
    },
    'japan': {
      'Help!': { phrase: '助けて！', pronunciation: 'tas-keh-teh' },
      'Call the police!': { phrase: '警察を呼んで！', pronunciation: 'kay-sats-su oh yon-deh' },
      'I need a doctor': { phrase: '医者が必要です', pronunciation: 'ee-sha gah hits-you dess' },
      'Fire!': { phrase: '火事！', pronunciation: 'ka-jee' },
      'Emergency!': { phrase: '緊急事態！', pronunciation: 'kin-kyuu jee-tai' },
      'I don\'t speak Japanese': { phrase: '日本語が話せません', pronunciation: 'nee-hon-go gah hana-seh-mah-sen' },
      'Where is the hospital?': { phrase: '病院はどこですか？', pronunciation: 'byou-in wah doko dess ka' }
    },
    'english': {
      'Help!': { phrase: 'Help!', pronunciation: 'Universal' },
      'Call the police!': { phrase: 'Call the police!', pronunciation: 'Call 911 or local emergency' },
      'I need a doctor': { phrase: 'I need a doctor', pronunciation: 'Point to yourself, say "doctor"' },
      'Fire!': { phrase: 'Fire!', pronunciation: 'Point and shout' },
      'Emergency!': { phrase: 'Emergency!', pronunciation: 'Use gestures' },
      'I don\'t speak [language]': { phrase: 'I don\'t speak [language]', pronunciation: 'Use translation app' },
      'Where is the hospital?': { phrase: 'Where is the hospital?', pronunciation: 'Use maps or gestures' }
    }
  }
}

function getTrustedTransportDatabase(): any {
  return {
    'france': {
      rideshare: ['Uber', 'Bolt', 'Kapten'],
      taxi: ['G7 Taxis: 3607', 'Airport official taxis', 'Hotel recommended taxis'],
      emergency: ['SAMU: 15', 'Pompiers: 18'],
      tips: ['Use official taxi stands', 'Check taxi has meter', 'Keep receipt']
    },
    'italy': {
      rideshare: ['Uber (limited cities)', 'MyTaxi', 'TaxiClick'],
      taxi: ['Radio Taxi: 06-3570', 'Airport official taxis', 'Hotel taxis'],
      emergency: ['Ambulanza: 118', 'Vigili del Fuoco: 115'],
      tips: ['Agree on price beforehand', 'Use official taxi stands', 'Ask for receipt']
    },
    'japan': {
      rideshare: ['Limited ride-sharing', 'JapanTaxi app'],
      taxi: ['JR stations taxi stands', 'Hotel taxis', 'Call: local taxi companies'],
      emergency: ['Fire/Ambulance: 119', 'Police: 110'],
      tips: ['Taxis are very safe', 'Limited English', 'Have destination written in Japanese']
    },
    'thailand': {
      rideshare: ['Grab', 'Bolt'],
      taxi: ['Meter taxis only', 'Airport official taxis'],
      emergency: ['Tourist Police: 1155', 'Medical: 1669'],
      tips: ['Insist on meter', 'Avoid tuk-tuks for long distances', 'Use Grab for safety']
    }
  }
}

function getMockHospitals(destination: string): Hospital[] {
  return [
    {
      name: 'International Hospital',
      address: 'City Center',
      phone: 'Check local directory',
      emergency: true,
      englishSpeaking: isInternationalLocation(destination),
      distance: 'Central location'
    },
    {
      name: 'Regional Medical Center',
      address: 'Medical District',
      phone: 'Check local directory',
      emergency: true,
      englishSpeaking: isInternationalLocation(destination),
      distance: 'Secondary location'
    }
  ]
}

function getCountryFromDestination(destination: string): string {
  const destLower = destination.toLowerCase()
  
  if (destLower.includes('france') || destLower.includes('paris')) return 'france'
  if (destLower.includes('italy') || destLower.includes('rome') || destLower.includes('milan')) return 'italy'
  if (destLower.includes('spain') || destLower.includes('madrid') || destLower.includes('barcelona')) return 'spain'
  if (destLower.includes('germany') || destLower.includes('berlin') || destLower.includes('munich')) return 'germany'
  if (destLower.includes('japan') || destLower.includes('tokyo') || destLower.includes('kyoto')) return 'japan'
  if (destLower.includes('thailand') || destLower.includes('bangkok') || destLower.includes('phuket')) return 'thailand'
  if (destLower.includes('india') || destLower.includes('mumbai') || destLower.includes('delhi')) return 'india'
  if (destLower.includes('uk') || destLower.includes('london') || destLower.includes('england')) return 'uk'
  if (destLower.includes('australia') || destLower.includes('sydney') || destLower.includes('melbourne')) return 'australia'
  
  return 'default'
}

function isInternationalLocation(destination: string): boolean {
  const international = ['japan', 'france', 'italy', 'spain', 'germany', 'uk', 'australia', 'singapore']
  return international.some(country => destination.toLowerCase().includes(country))
}

function getInsuranceInfo(): any {
  return {
    claimProcess: [
      'Contact insurance provider immediately',
      'Keep all receipts and documentation',
      'Get police reports for theft/accidents',
      'Take photos of any damage',
      'Get medical reports translated if needed',
      'Submit claims within required timeframe'
    ],
    requiredDocuments: [
      'Police reports',
      'Medical receipts and reports',
      'Proof of travel (tickets, bookings)',
      'Photos of incidents/damage',
      'Witness statements if available'
    ],
    majorInsurers: [
      'World Nomads: +1-512-677-9997',
      'Allianz Travel: +1-866-884-3556',
      'Travel Guard: +1-877-216-4279',
      'IMG Global: +1-317-655-4500'
    ]
  }
}

function getFallbackEmergencyData(): any {
  return {
    emergencyNumbers: [
      { service: 'Emergency', number: '112', description: 'Universal emergency number', priority: 'critical' }
    ],
    hospitals: getMockHospitals('Unknown'),
    embassies: [{ name: 'US Embassy', address: 'Check embassy website', phone: 'Check embassy website' }]
  }
}