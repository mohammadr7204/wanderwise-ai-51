import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AccommodationRecommendation {
  name: string;
  type: string;
  address: string;
  rating: number;
  priceRange: string;
  amenities: string[];
  whyPerfect: string;
  bookingTip: string;
  distanceToActivities?: string;
}

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

export const useAccommodationRecommendations = () => {
  const [loading, setLoading] = useState(false);
  const [accommodations, setAccommodations] = useState<AccommodationRecommendation[]>([]);

  const generateRecommendations = async (requestData: AccommodationRequest) => {
    setLoading(true);
    try {
      console.log('Generating accommodation recommendations with:', requestData);

      const { data, error } = await supabase.functions.invoke('generate-accommodation-recommendations', {
        body: requestData
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data?.accommodations) {
        throw new Error('No accommodations data received');
      }

      console.log('Received accommodations:', data.accommodations);
      setAccommodations(data.accommodations);
      
      toast.success(`Generated ${data.accommodations.length} accommodation recommendations`);
      return data.accommodations;

    } catch (error) {
      console.error('Error generating accommodation recommendations:', error);
      toast.error('Failed to generate accommodation recommendations');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    accommodations,
    generateRecommendations,
    setAccommodations
  };
};