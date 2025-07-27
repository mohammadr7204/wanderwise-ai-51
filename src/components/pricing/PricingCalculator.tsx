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
  serviceTier: 'essential' | 'premium' | 'executive';
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
      executive: 500 // Starting price for consultation
    };
    
    let basePrice = basePrices[details.serviceTier];
    let additionalCharges = 0;
    
    // For Executive tier, return consultation-based pricing without additions
    if (details.serviceTier === 'executive') {
      return {
        basePrice,
        totalMultiplier: 1.0,
        finalPrice: basePrice,
        serviceTier: details.serviceTier,
        breakdown: {
          travelers: details.travelerCount,
          duration: details.duration,
          destinations: details.destinationCount,
          luxuryLevel: details.luxuryLevel,
          activityLevel: details.activityLevel
        }
      };
    }
    
    // Group size: +$3 for each additional person, +$1 for each person after 5
    if (details.travelerCount > 1) {
      const additionalPeople = details.travelerCount - 1;
      if (additionalPeople <= 4) {
        additionalCharges += additionalPeople * 3; // $3 per person for people 2-5
      } else {
        additionalCharges += 4 * 3; // $3 for people 2-5
        additionalCharges += (additionalPeople - 4) * 1; // $1 for people 6+
      }
    }
    
    // Duration: +$2 for every 5 days
    const durationCharges = Math.floor(details.duration / 5) * 2;
    additionalCharges += durationCharges;
    
    // Destinations: +$5-10 for each additional destination
    if (details.destinationCount > 1) {
      const additionalDestinations = details.destinationCount - 1;
      // Average $7.5 per additional destination (between $5-10)
      additionalCharges += additionalDestinations * 7.5;
    }
    
    const finalPrice = Math.round(basePrice + additionalCharges);
    
    return {
      basePrice,
      totalMultiplier: (basePrice + additionalCharges) / basePrice,
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
        'Full AI-generated itinerary (unlimited duration)',
        'Restaurant and activity recommendations with booking links',
        'Accommodation suggestions with booking links',
        'PDF itinerary export',
        'Email support (48hr response)'
      ],
      premium: [
        'Everything in Essential (same AI quality)',
        'Human booking assistance for hotels & activities',
        'Flight booking guidance',
        '1 free revision with human review',
        'Priority email support (24hr response)'
      ],
      executive: [
        'One-on-one consultation call',
        'Complete booking service (flights, hotels, transport)',
        'Restaurant reservations & exclusive experiences',
        'Dedicated travel coordinator',
        '24/7 support during travel',
        'Unlimited revisions'
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
                {['essential', 'premium', 'executive'].map((tier) => (
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
                {pricing.serviceTier === 'executive' ? (
                  <Button 
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white" 
                    size="lg"
                    onClick={() => window.open('https://calendly.com/atlas-executive', '_blank')}
                  >
                    Book Consultation
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button className="w-full" size="lg">
                    Start Planning Your Trip
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}

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