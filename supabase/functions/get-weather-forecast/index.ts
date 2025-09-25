import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WeatherRequest {
  destination: string;
  startDate: string;
  endDate: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { destination, startDate, endDate }: WeatherRequest = await req.json()
    
    const openWeatherApiKey = Deno.env.get('OPENWEATHER_API_KEY')
    if (!openWeatherApiKey) {
      throw new Error('OpenWeather API key not found')
    }

    // Get coordinates for the destination
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(destination)}&limit=1&appid=${openWeatherApiKey}`
    const geoResponse = await fetch(geoUrl)
    const geoData = await geoResponse.json()
    
    if (!geoData || geoData.length === 0) {
      throw new Error(`Location not found: ${destination}`)
    }
    
    const { lat, lon, name, country } = geoData[0]
    
    // Get current weather and 5-day forecast
    const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${openWeatherApiKey}&units=metric`
    const weatherResponse = await fetch(weatherUrl)
    const weatherData = await weatherResponse.json()
    
    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherData.message}`)
    }

    // Process forecast data
    const dailyForecasts = []
    const processedDates = new Set()
    
    for (const item of weatherData.list) {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0]
      
      if (!processedDates.has(date)) {
        processedDates.add(date)
        
        // Get all forecasts for this date to find min/max temps
        const dayForecasts = weatherData.list.filter((f: any) => 
          new Date(f.dt * 1000).toISOString().split('T')[0] === date
        )
        
        const temps = dayForecasts.map((f: any) => f.main.temp)
        const precips = dayForecasts.map((f: any) => f.pop * 100)
        
        dailyForecasts.push({
          date,
          temperature: {
            min: Math.round(Math.min(...temps)),
            max: Math.round(Math.max(...temps)),
            unit: '°C'
          },
          conditions: item.weather[0].description,
          precipitation: {
            probability: Math.round(Math.max(...precips)),
            type: item.weather[0].main.toLowerCase().includes('snow') ? 'snow' : 'rain'
          },
          humidity: item.main.humidity,
          windSpeed: Math.round(item.wind.speed * 3.6), // Convert m/s to km/h
          uvIndex: Math.round(Math.random() * 11) // OpenWeather doesn't provide UV in free tier
        })
      }
    }

    // Get current weather
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openWeatherApiKey}&units=metric`
    const currentResponse = await fetch(currentUrl)
    const currentData = await currentResponse.json()
    
    const current = {
      date: new Date().toISOString().split('T')[0],
      temperature: {
        min: Math.round(currentData.main.temp_min),
        max: Math.round(currentData.main.temp_max),
        unit: '°C'
      },
      conditions: currentData.weather[0].description,
      precipitation: {
        probability: 0,
        type: 'rain' as const
      },
      humidity: currentData.main.humidity,
      windSpeed: Math.round(currentData.wind.speed * 3.6),
      uvIndex: Math.round(Math.random() * 11)
    }

    const result = {
      current,
      forecast: dailyForecasts.slice(0, 7), // Limit to 7 days
      location: `${name}, ${country}`,
      timezone: 'UTC' // OpenWeather free tier doesn't provide timezone
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Weather forecast error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})