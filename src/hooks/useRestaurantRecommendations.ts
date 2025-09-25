import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RestaurantRecommendation {
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  subcategory: string;
  cuisine: string;
  address: string;
  coordinates: { lat: number; lng: number };
  priceRange: 'budget' | 'mid-range' | 'splurge';
  avgCostPerPerson: number;
  rating: number;
  phoneNumber: string;
  description: string;
  signature_dishes: string[];
  dietary_options: {
    vegetarian: string[];
    vegan: string[];
    gluten_free: string[];
    halal: string[];
    kosher: string[];
  };
  allergen_warnings: string[];
  booking_info: {
    reservations_required: boolean;
    avg_wait_time: string;
    best_time_to_visit: string;
    booking_tip: string;
  };
  local_phrases: {
    dietary_request: string;
    recommendation: string;
    thank_you: string;
  };
  google_maps_url: string;
  why_perfect: string;
}

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

export const useRestaurantRecommendations = () => {
  const [loading, setLoading] = useState(false);
  const [restaurants, setRestaurants] = useState<RestaurantRecommendation[]>([]);

  const generateRecommendations = async (requestData: RestaurantRequest) => {
    setLoading(true);
    try {
      console.log('Generating restaurant recommendations with:', requestData);

      const { data, error } = await supabase.functions.invoke('generate-restaurant-recommendations', {
        body: requestData
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data?.restaurants) {
        throw new Error('No restaurant data received');
      }

      console.log('Received restaurants:', data.restaurants);
      setRestaurants(data.restaurants);
      
      toast.success(`Generated ${data.restaurants.length} restaurant recommendations`);
      return data.restaurants;

    } catch (error) {
      console.error('Error generating restaurant recommendations:', error);
      toast.error('Failed to generate restaurant recommendations');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    restaurants,
    generateRecommendations,
    setRestaurants
  };
};