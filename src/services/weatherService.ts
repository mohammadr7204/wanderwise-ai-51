import { supabase } from '@/integrations/supabase/client';

export interface WeatherForecast {
  date: string;
  temperature: {
    min: number;
    max: number;
    unit: string;
  };
  conditions: string;
  precipitation: {
    probability: number;
    type?: 'rain' | 'snow' | 'sleet';
  };
  humidity: number;
  windSpeed: number;
  uvIndex: number;
}

export interface WeatherData {
  current: WeatherForecast;
  forecast: WeatherForecast[];
  location: string;
  timezone: string;
}

export class WeatherService {
  static async getWeatherForecast(destination: string, startDate: string, endDate: string): Promise<WeatherData | null> {
    try {
      // Call our edge function to get weather data
      const { data, error } = await supabase.functions.invoke('get-weather-forecast', {
        body: {
          destination,
          startDate,
          endDate
        }
      });

      if (error) {
        console.error('Weather service error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      return null;
    }
  }

  static analyzeWeatherForPacking(forecast: WeatherForecast[]): {
    rainExpected: boolean;
    coldWeather: boolean;
    hotWeather: boolean;
    temperatureRange: { min: number; max: number };
    rainDays: number;
    maxUvIndex: number;
  } {
    const temperatures = forecast.flatMap(day => [day.temperature.min, day.temperature.max]);
    const rainDays = forecast.filter(day => day.precipitation.probability > 50).length;
    const maxUvIndex = Math.max(...forecast.map(day => day.uvIndex));
    
    return {
      rainExpected: rainDays > 0,
      coldWeather: Math.min(...temperatures) < 10, // Below 10°C
      hotWeather: Math.max(...temperatures) > 30, // Above 30°C
      temperatureRange: {
        min: Math.min(...temperatures),
        max: Math.max(...temperatures)
      },
      rainDays,
      maxUvIndex
    };
  }

  static generateWeatherBasedItems(weatherAnalysis: ReturnType<typeof WeatherService.analyzeWeatherForPacking>): Array<{
    id: string;
    name: string;
    category: string;
    essential: boolean;
    reason: string;
  }> {
    const items = [];

    if (weatherAnalysis.rainExpected) {
      items.push(
        { id: 'umbrella', name: 'Compact Umbrella', category: 'Weather Protection', essential: true, reason: `Rain expected ${weatherAnalysis.rainDays} days` },
        { id: 'waterproof-jacket', name: 'Waterproof Jacket', category: 'Weather Protection', essential: true, reason: 'Protection from rain' },
        { id: 'shoe-covers', name: 'Waterproof Shoe Covers', category: 'Weather Protection', essential: false, reason: 'Keep feet dry in rain' }
      );
    }

    if (weatherAnalysis.coldWeather) {
      const minTemp = weatherAnalysis.temperatureRange.min;
      items.push(
        { id: 'thermal-layers', name: 'Thermal Base Layers', category: 'Cold Weather', essential: minTemp < 5, reason: `Temperatures as low as ${minTemp}°C` },
        { id: 'insulated-gloves', name: 'Insulated Gloves', category: 'Cold Weather', essential: minTemp < 0, reason: `Sub-freezing temperatures expected` },
        { id: 'warm-hat', name: 'Warm Hat/Beanie', category: 'Cold Weather', essential: minTemp < 5, reason: 'Prevent heat loss from head' }
      );
    }

    if (weatherAnalysis.hotWeather) {
      const spfRecommendation = weatherAnalysis.maxUvIndex > 8 ? 'SPF 50+' : 'SPF 30+';
      items.push(
        { id: 'high-spf-sunscreen', name: `Sunscreen (${spfRecommendation})`, category: 'Sun Protection', essential: true, reason: `UV Index up to ${weatherAnalysis.maxUvIndex}` },
        { id: 'cooling-towel', name: 'Cooling Towel', category: 'Heat Management', essential: false, reason: `Temperatures up to ${weatherAnalysis.temperatureRange.max}°C` },
        { id: 'hydration-pack', name: 'Hydration Pack/Large Water Bottle', category: 'Heat Management', essential: weatherAnalysis.temperatureRange.max > 35, reason: 'Prevent dehydration in extreme heat' }
      );
    }

    return items;
  }
}