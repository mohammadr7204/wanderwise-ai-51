import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  MapPin, 
  Activity,
  Car,
  UtensilsCrossed,
  Sparkles,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import type { TripFormData } from '@/pages/CreateTrip';

interface ReviewAndCreateProps {
  formData: TripFormData;
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  onComplete: () => void;
}

export const ReviewAndCreate = ({ formData, isGenerating, setIsGenerating, onComplete }: ReviewAndCreateProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCreateTrip = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create your trip.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    console.log('Creating trip with form data:', formData);

    try {
      // Create trip record with form data
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert({
          user_id: user.id,
          title: formData.title,
          start_date: formData.startDate?.toISOString().split('T')[0],
          end_date: formData.endDate?.toISOString().split('T')[0],
          destination: formData.destinationType === 'specific' 
            ? formData.specificDestinations.join(', ') 
            : 'Surprise destination',
          group_size: formData.groupSize,
          budget_min: formData.budgetMin,
          budget_max: formData.budgetMax,
          status: 'draft',
          form_data: formData as any
        })
        .select()
        .single();

      if (tripError) {
        console.error('Trip creation error:', tripError);
        throw tripError;
      }

      console.log('Trip created successfully:', trip);

      // Save preferences
      const { error: prefError } = await supabase
        .from('preferences')
        .upsert({
          user_id: user.id,
          activity_types: formData.activityTypes,
          accommodation_type: formData.accommodationType,
          transport_preference: formData.transportPreferences.join(','),
          dietary_restrictions: formData.dietaryRestrictions,
          climate_preferences: formData.climatePreferences,
          travel_radius: formData.travelRadius,
          food_adventure_level: formData.foodAdventureLevel,
        });

      if (prefError) {
        console.error('Preferences save error:', prefError);
        // Don't throw here, preferences are optional
      }

      console.log('Navigating to quote page for trip:', trip.id);

      toast({
        title: "Trip Created!",
        description: "Redirecting to get your quote...",
        variant: "default"
      });

      // Navigate to quote page
      navigate(`/trip/${trip.id}/quote`);

    } catch (error) {
      console.error('Error creating trip:', error);
      setIsGenerating(false);
      toast({
        title: "Error",
        description: "Failed to create trip. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getActivityLabels = () => {
    const activityMap: { [key: string]: string } = {
      'adventure': 'Adventure',
      'cultural': 'Cultural',
      'relaxation': 'Relaxation',
      'nightlife': 'Nightlife',
      'food-drink': 'Food & Drink',
      'shopping': 'Shopping',
      'nature': 'Nature',
    };
    return formData.activityTypes.map(id => activityMap[id] || id);
  };

  const getAccommodationLabel = () => {
    const accommodationMap: { [key: string]: string } = {
      'luxury-hotels': 'Luxury Hotels',
      'mid-range-hotels': 'Mid-range Hotels',
      'boutique-stays': 'Boutique Stays',
      'vacation-rentals': 'Vacation Rentals',
      'hostels': 'Hostels',
      'camping': 'Camping',
    };
    return accommodationMap[formData.accommodationType] || formData.accommodationType;
  };


  return (
    <div className="space-y-6">
      {/* Trip Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Trip Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Trip Title</span>
              <p className="text-base font-medium">{formData.title}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Dates</span>
              <p className="text-base">
                {formData.startDate && formData.endDate 
                  ? `${format(formData.startDate, 'PPP')} - ${format(formData.endDate, 'PPP')}`
                  : 'Dates not set'
                }
              </p>
              {formData.startDate && formData.endDate && (
                <p className="text-sm text-gray-500">
                  {Math.ceil((formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-500">Group Size</span>
              <Badge variant="secondary">{formData.groupSize} {formData.groupSize === 1 ? 'traveler' : 'travelers'}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-500">Budget</span>
              <Badge variant="outline">${formData.budgetMin.toLocaleString()} - ${formData.budgetMax.toLocaleString()}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Destination & Activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Destination
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Type</span>
              <p className="text-base">
                {formData.destinationType === 'surprise' ? 'Surprise destination' : 'Specific destinations'}
              </p>
            </div>
            {formData.destinationType === 'specific' && formData.specificDestinations.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-500">Destinations</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.specificDestinations.map((dest) => (
                    <Badge key={dest} variant="secondary">{dest}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-gray-500">Travel Radius</span>
              <Badge variant="outline" className="ml-2">{formData.travelRadius}</Badge>
            </div>
            {formData.climatePreferences.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-500">Climate Preferences</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.climatePreferences.map((climate) => (
                    <Badge key={climate} variant="secondary">{climate}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Interests</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {getActivityLabels().map((activity) => (
                  <Badge key={activity} variant="secondary">{activity}</Badge>
                ))}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Accommodation</span>
              <p className="text-base">{getAccommodationLabel()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Travel Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Travel Preferences</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Car className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-500">Transportation</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {formData.transportPreferences.map((transport) => (
                <Badge key={transport} variant="outline">{transport}</Badge>
              ))}
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <UtensilsCrossed className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-500">Food</span>
            </div>
            <p className="text-sm">Adventure level: {formData.foodAdventureLevel}/10</p>
            {formData.dietaryRestrictions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.dietaryRestrictions.map((dietary) => (
                  <Badge key={dietary} variant="outline">{dietary}</Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <span className="text-sm font-medium text-gray-500">Special Notes</span>
            <p className="text-sm text-gray-700 mt-1">
              {formData.accessibilityNeeds || formData.specialRequests || 'None specified'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Generate Button */}
      <div className="text-center space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to See Your Quote?</h3>
          <p className="text-gray-600 mb-6">
            Get pricing and preview your personalized itinerary before you pay
          </p>
        </div>
        
        <Button 
          onClick={handleCreateTrip}
          disabled={isGenerating}
          size="lg"
          variant="adventure"
          className="px-8"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating Trip...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Get Quote & Preview
            </>
          )}
        </Button>
        
        {isGenerating && (
          <p className="text-sm text-gray-500">
            Creating your trip and preparing your quote...
          </p>
        )}
      </div>
    </div>
  );
};