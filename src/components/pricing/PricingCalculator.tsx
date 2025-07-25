import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, MapPin, Calendar, Users, Star } from 'lucide-react';

interface PricingBreakdown {
  basePrice: number;
  totalMultiplier: number;
  finalPrice: number;
  serviceTier: string;
  breakdown: {
    travelers: number;
    duration: number;
    destinations: number;
    luxuryLevel: string;
    activityLevel: string;
  };
}

interface TripDetails {
  serviceTier: 'essential' | 'premium' | 'luxury';
  travelerCount: number;
  duration: number;
  destinationCount: number;
  luxuryLevel: 'budget' | 'mid-range' | 'luxury' | 'ultra-luxury';
  activityLevel: 'relaxed' | 'moderate' | 'adventure' | 'exclusive';
}

const PricingCalculator = () => {
  const [tripDetails, setTripDetails] = useState<TripDetails>({
    serviceTier: 'premium',
    travelerCount: 2,
    duration: 7,
    destinationCount: 1,
    luxuryLevel: 'mid-range',
    activityLevel: 'moderate'
  });

  const [pricing, setPricing] = useState<PricingBreakdown | null>(null);

  const calculatePricing = (details: TripDetails): PricingBreakdown => {
    const basePrices = {
      essential: 39,
      premium: 89,
      luxury: 249
    };
    
    let basePrice = basePrices[details.serviceTier];
    let totalMultiplier = 1.0;
    
    // Traveler count multiplier
    const travelerMultipliers: { [key: number]: number } = {
      1: 1.0, 2: 1.3, 3: 1.6, 4: 1.6, 
      5: 2.0, 6: 2.0
    };
    totalMultiplier *= travelerMultipliers[Math.min(details.travelerCount, 6)] || 2.5;
    
    // Duration multiplier
    if (details.duration <= 3) totalMultiplier *= 1.0;
    else if (details.duration <= 7) totalMultiplier *= 1.2;
    else if (details.duration <= 14) totalMultiplier *= 1.5;
    else if (details.duration <= 21) totalMultiplier *= 2.0;
    else totalMultiplier *= 2.5;
    
    // Destination complexity
    if (details.destinationCount === 1) totalMultiplier *= 1.0;
    else if (details.destinationCount <= 3) totalMultiplier *= 1.3;
    else totalMultiplier *= 1.6;
    
    // Luxury level
    const luxuryMultipliers = {
      'budget': 1.0,
      'mid-range': 1.2,
      'luxury': 1.5,
      'ultra-luxury': 2.0
    };
    totalMultiplier *= luxuryMultipliers[details.luxuryLevel];
    
    // Activity level
    const activityMultipliers = {
      'relaxed': 1.0,
      'moderate': 1.1,
      'adventure': 1.3,
      'exclusive': 1.5
    };
    totalMultiplier *= activityMultipliers[details.activityLevel];
    
    const finalPrice = Math.round(basePrice * totalMultiplier);
    
    return {
      basePrice,
      totalMultiplier,
      finalPrice,
      serviceTier: details.serviceTier,
      breakdown: {
        travelers: details.travelerCount,
        duration: details.duration,
        destinations: details.destinationCount,
        luxuryLevel: details.luxuryLevel,
        activityLevel: details.activityLevel
      }
    };
  };

  useEffect(() => {
    setPricing(calculatePricing(tripDetails));
  }, [tripDetails]);

  const updateTripDetails = (updates: Partial<TripDetails>) => {
    setTripDetails(prev => ({ ...prev, ...updates }));
  };

  const getServiceFeatures = (tier: string) => {
    const features = {
      essential: [
        'Basic AI itinerary (up to 7 days)',
        'Activity & restaurant links',
        'Basic accommodation suggestions',
        'PDF itinerary export',
        'Email support'
      ],
      premium: [
        'Detailed AI itinerary (up to 14 days)',
        'Curated recommendations',
        'Booking assistance',
        '1 free revision',
        'Priority support'
      ],
      luxury: [
        'Unlimited duration & destinations',
        'Full-service booking',
        'Premium accommodations',
        'Personal travel concierge',
        '24/7 support & unlimited revisions'
      ]
    };
    return features[tier as keyof typeof features] || [];
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Get Your Custom Trip Quote
        </h2>
        <p className="text-lg text-gray-600">
          Answer a few quick questions to see your personalized pricing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calculator Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Trip Details
            </CardTitle>
            <CardDescription>
              Customize your trip preferences to see real-time pricing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Service Tier */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Service Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['essential', 'premium', 'luxury'].map((tier) => (
                  <Button
                    key={tier}
                    variant={tripDetails.serviceTier === tier ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateTripDetails({ serviceTier: tier as any })}
                    className="capitalize"
                  >
                    {tier}
                  </Button>
                ))}
              </div>
            </div>

            {/* Traveler Count */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Number of Travelers: {tripDetails.travelerCount}
              </label>
              <Slider
                value={[tripDetails.travelerCount]}
                onValueChange={([value]) => updateTripDetails({ travelerCount: value })}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 person</span>
                <span>10+ people</span>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Trip Duration: {tripDetails.duration} days
              </label>
              <Slider
                value={[tripDetails.duration]}
                onValueChange={([value]) => updateTripDetails({ duration: value })}
                max={30}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 day</span>
                <span>30+ days</span>
              </div>
            </div>

            {/* Destinations */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Number of Destinations: {tripDetails.destinationCount}
              </label>
              <Slider
                value={[tripDetails.destinationCount]}
                onValueChange={([value]) => updateTripDetails({ destinationCount: value })}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 city</span>
                <span>5+ destinations</span>
              </div>
            </div>

            {/* Luxury Level */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Budget Preference
              </label>
              <Select value={tripDetails.luxuryLevel} onValueChange={(value: any) => updateTripDetails({ luxuryLevel: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget">Budget-Friendly</SelectItem>
                  <SelectItem value="mid-range">Mid-Range</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="ultra-luxury">Ultra-Luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Activity Level */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Activity Level
              </label>
              <Select value={tripDetails.activityLevel} onValueChange={(value: any) => updateTripDetails({ activityLevel: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relaxed">Relaxed Sightseeing</SelectItem>
                  <SelectItem value="moderate">Moderate Activities</SelectItem>
                  <SelectItem value="adventure">Adventure & Sports</SelectItem>
                  <SelectItem value="exclusive">Exclusive Experiences</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Display */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Your Custom Quote
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {pricing && (
              <>
                {/* Price Display */}
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    ${pricing.finalPrice}
                  </div>
                  <div className="text-sm text-gray-600">
                    for {pricing.breakdown.travelers} traveler{pricing.breakdown.travelers > 1 ? 's' : ''} • {pricing.breakdown.duration} days
                  </div>
                  <Badge variant="secondary" className="mt-2 capitalize">
                    {pricing.serviceTier} Service
                  </Badge>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base {pricing.serviceTier} price:</span>
                    <span>${pricing.basePrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Complexity multiplier:</span>
                    <span>{pricing.totalMultiplier.toFixed(1)}x</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between font-medium">
                    <span>Total Price:</span>
                    <span>${pricing.finalPrice}</span>
                  </div>
                </div>

                {/* Features Included */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">What's included:</h4>
                  <ul className="space-y-1">
                    {getServiceFeatures(pricing.serviceTier).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <Button className="w-full" size="lg">
                  Start Planning Your Trip
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Full payment due upfront
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PricingCalculator;