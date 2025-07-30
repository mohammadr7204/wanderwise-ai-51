import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  CheckCircle, 
  Clock,
  ArrowLeft,
  CreditCard,
  Shield,
  Star
} from 'lucide-react';
import { calculateTripPricing, SERVICE_TIERS, formatPrice, getTripDuration } from '@/utils/pricing';
import { TripFormData } from '@/pages/CreateTrip';

interface Trip {
  id: string;
  title: string;
  form_data: any; // JSON from Supabase
  tier: string;
  status: string;
  user_id: string;
}

const QuoteAndPreview = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [selectedTier, setSelectedTier] = useState<'essential' | 'premium' | 'executive'>('premium');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (tripId && user) {
      fetchTrip();
    }
  }, [tripId, user]);

  const fetchTrip = async () => {
    console.log('Fetching trip with ID:', tripId, 'for user:', user?.id);
    
    if (!tripId || !user) {
      console.error('Missing tripId or user:', { tripId, userId: user?.id });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .eq('user_id', user?.id)
        .single();

      console.log('Trip fetch result:', { data, error });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      if (!data) {
        console.error('No trip data found');
        throw new Error('Trip not found');
      }

      console.log('Setting trip data:', data);
      setTrip({
        ...data,
        form_data: data.form_data as unknown as TripFormData
      });
    } catch (error) {
      console.error('Error fetching trip:', error);
      toast({
        title: "Error",
        description: `Failed to load trip details: ${error.message}`,
        variant: "destructive"
      });
      // Don't navigate away immediately, let user see the error
      setTimeout(() => navigate('/dashboard'), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!trip || !user) {
      console.error('Payment failed: Missing trip or user data', { trip: !!trip, user: !!user });
      toast({
        title: "Payment Error",
        description: "Missing required data. Please refresh and try again.",
        variant: "destructive"
      });
      return;
    }
    
    setProcessing(true);
    
    try {
      console.log('Starting payment process for:', {
        tripId: trip.id,
        userId: user.id,
        selectedTier,
        userEmail: user.email
      });

      const pricing = calculateTripPricing(trip.form_data, selectedTier);
      const tierName = SERVICE_TIERS.find(t => t.id === selectedTier)?.name;
      
      if (!tierName) {
        throw new Error(`Invalid tier selected: ${selectedTier}`);
      }

      console.log('Calculated pricing:', {
        basePrice: pricing.basePrice,
        total: pricing.total,
        tierName,
        pricingBreakdown: pricing
      });
      
      const updateData = {
        tier: selectedTier,
        price_paid: Number(pricing.total),
        status: 'quoted'
      };
      
      console.log('Updating trip with values:', updateData);
      
      // Update trip with selected tier and pricing
      const { error: updateError } = await supabase
        .from('trips')
        .update(updateData)
        .eq('id', trip.id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Trip update error:', updateError);
        throw new Error(`Failed to update trip: ${updateError.message}`);
      }

      console.log('Trip updated successfully, creating Stripe checkout...');

      // Validate required environment - check by calling a function that will validate
      const checkoutPayload = {
        tripId: trip.id,
        amount: pricing.total,
        tierName: tierName
      };

      console.log('Calling create-checkout with payload:', checkoutPayload);

      // Create Stripe checkout session with enhanced error handling
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: checkoutPayload
      });

      console.log('Stripe checkout response:', { data, error });

      if (error) {
        console.error('Stripe checkout error:', error);
        
        // Enhanced error messages based on common issues
        let userMessage = "Failed to create payment session. Please try again.";
        
        if (error.message?.includes('STRIPE_SECRET_KEY')) {
          userMessage = "Payment system configuration error. Please contact support.";
        } else if (error.message?.includes('authentication')) {
          userMessage = "Authentication error. Please sign out and sign back in.";
        } else if (error.message?.includes('Missing required parameters')) {
          userMessage = "Invalid payment data. Please refresh and try again.";
        }
        
        throw new Error(userMessage);
      }

      if (!data?.url) {
        console.error('No checkout URL returned:', data);
        throw new Error("Invalid payment session created. Please try again.");
      }

      console.log('Redirecting to Stripe checkout:', data.url);
      
      // Notify user before redirect
      toast({
        title: "Redirecting to Payment",
        description: "Opening Stripe checkout in a new tab...",
      });
      
      // Small delay to show the toast
      setTimeout(() => {
        // Redirect to Stripe checkout
        window.open(data.url, '_blank');
      }, 500);
      
    } catch (error) {
      console.error('Payment process error:', error);
      
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive"
      });

      // Reset trip status if payment setup failed
      try {
        await supabase
          .from('trips')
          .update({ status: 'draft' })
          .eq('id', trip.id)
          .eq('user_id', user.id);
      } catch (resetError) {
        console.error('Failed to reset trip status:', resetError);
      }
      
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Trip not found</div>
      </div>
    );
  }

  const pricing = calculateTripPricing(trip.form_data, selectedTier);
  const duration = trip.form_data.startDate && trip.form_data.endDate 
    ? getTripDuration(
        new Date(trip.form_data.startDate), 
        new Date(trip.form_data.endDate)
      )
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-lg font-semibold">Trip Quote & Preview</h1>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Trip Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {trip.title}
                </CardTitle>
                <CardDescription>Trip Summary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {duration} day{duration !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {trip.form_data.groupSize} traveler{trip.form_data.groupSize !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Destination Type</h4>
                  <Badge variant="outline">
                    {trip.form_data.destinationType === 'surprise' ? 'Surprise Me!' : 'Specific Destinations'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Budget Range</h4>
                  <p className="text-sm text-gray-600">
                    {formatPrice(trip.form_data.budgetMin)} - {formatPrice(trip.form_data.budgetMax)}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Activity Preferences</h4>
                  <div className="flex flex-wrap gap-1">
                    {trip.form_data.activityTypes.map((activity, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {activity}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced AI-Powered Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Your AI-Powered Itinerary Preview
                </CardTitle>
                <CardDescription>Personalized recommendations based on your preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-l-4 border-primary">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Your {duration}-day {trip.form_data.destinationType === 'surprise' ? 'AI-selected adventure' : trip.title} will feature:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-medium">Real-time verified venues</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium">Weather-adaptive planning</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="font-medium">Budget-optimized recommendations</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-primary" />
                        <span className="font-medium">{Math.ceil(duration * 2.5)} curated experiences</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="font-medium">Optimized for {trip.form_data.groupSize} traveler{trip.form_data.groupSize !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span className="font-medium">Real ratings & current hours</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personalized Sample Day */}
                <div className="border-l-4 border-green-500 pl-4 bg-green-50 p-4 rounded-r-lg">
                  <h5 className="font-medium mb-3 text-green-900">Sample Day Based on Your Preferences:</h5>
                  
                  {trip.form_data.activityTypes.includes('adventure') && (
                    <div className="mb-3">
                      <p className="text-sm text-green-800 mb-1">
                        <span className="font-medium">Morning Adventure:</span> Outdoor activity matching your love for adventure sports
                      </p>
                      <p className="text-xs text-green-600">• Real local guides with current availability</p>
                    </div>
                  )}
                  
                  {trip.form_data.activityTypes.includes('cultural') && (
                    <div className="mb-3">
                      <p className="text-sm text-green-800 mb-1">
                        <span className="font-medium">Cultural Immersion:</span> Authentic local experiences beyond tourist traps
                      </p>
                      <p className="text-xs text-green-600">• Verified hours and seasonal availability</p>
                    </div>
                  )}
                  
                  {trip.form_data.foodAdventureLevel > 5 && (
                    <div className="mb-3">
                      <p className="text-sm text-green-800 mb-1">
                        <span className="font-medium">Culinary Adventure:</span> Local specialties matching your adventurous palate
                      </p>
                      <p className="text-xs text-green-600">• Real restaurants with current ratings and dietary options</p>
                    </div>
                  )}
                  
                  <div className="mt-3 p-2 bg-white rounded border border-green-200">
                    <p className="text-xs text-gray-600">
                      💡 <strong>AI Personalization:</strong> Every recommendation will be specifically chosen based on your 
                      preferences for {trip.form_data.activityTypes.join(', ').toLowerCase()}, 
                      dietary needs, and budget range.
                    </p>
                  </div>
                </div>

                {/* What Makes This Different */}
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h5 className="font-medium text-yellow-900 mb-2">What makes this AI-powered:</h5>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Live weather data influences daily activity planning</li>
                    <li>• Real restaurant ratings and current operating hours</li>
                    <li>• Local events happening during your specific travel dates</li>
                    <li>• Budget calculations using real current pricing</li>
                    <li>• Transportation times based on actual traffic patterns</li>
                  </ul>
                </div>

                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">AI-Powered Personalization Guarantee</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pricing & Payment */}
          <div className="space-y-6">
            {/* Service Tier Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Service Tier</CardTitle>
                <CardDescription>Select the level of service that's right for you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {SERVICE_TIERS.map((tier) => (
                  <div 
                    key={tier.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedTier === tier.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTier(tier.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{tier.name}</h4>
                        <p className="text-sm text-gray-600">{tier.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold">
                          {formatPrice(calculateTripPricing(trip.form_data, tier.id).total)}
                        </span>
                      </div>
                    </div>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Pricing Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Pricing Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Base price ({SERVICE_TIERS.find(t => t.id === selectedTier)?.name})</span>
                  <span>{formatPrice(pricing.basePrice)}</span>
                </div>
                {pricing.groupSizeMultiplier > 1 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Group size adjustment ({trip.form_data.groupSize} travelers)</span>
                    <span>+{Math.round((pricing.groupSizeMultiplier - 1) * 100)}%</span>
                  </div>
                )}
                {pricing.durationMultiplier > 1 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Duration adjustment ({duration} days)</span>
                    <span>+{Math.round((pricing.durationMultiplier - 1) * 100)}%</span>
                  </div>
                )}
                {pricing.destinationMultiplier > 1 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Destination complexity</span>
                    <span>+{Math.round((pricing.destinationMultiplier - 1) * 100)}%</span>
                  </div>
                )}
                {pricing.rushMultiplier > 1 && (
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>Rush order (trip starts soon)</span>
                    <span>+{Math.round((pricing.rushMultiplier - 1) * 100)}%</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(pricing.total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Button */}
            <Card>
              <CardContent className="pt-6">
                <Button 
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay {formatPrice(pricing.total)} & Generate Itinerary
                    </>
                  )}
                </Button>
                
                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
                  <Shield className="h-4 w-4" />
                  <span>Secure payment powered by Stripe</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteAndPreview;