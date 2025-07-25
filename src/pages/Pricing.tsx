import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { 
  Check, 
  Compass, 
  Star, 
  Crown, 
  Sparkles,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface SubscriptionInfo {
  subscribed: boolean;
  subscription_tier: string;
  subscription_end?: string;
}

const Pricing = () => {
  const { user, loading } = useAuth();
  
  // Redirect if not authenticated - moved before other hooks
  if (!user && !loading) {
    return <Navigate to="/auth" replace />;
  }
  
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingTier, setProcessingTier] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      checkSubscription();
    }
  }, [user]);

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscriptionInfo(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (tier: string) => {
    setProcessingTier(tier);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier }
      });
      
      if (error) throw error;
      
      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingTier(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open subscription management. Please try again.",
        variant: "destructive",
      });
    }
  };

  const pricingTiers = [
    {
      id: 'basic',
      name: 'Basic Itinerary',
      price: 29,
      description: 'Perfect for simple trips',
      icon: Compass,
      features: [
        '1 destination',
        '7 days maximum',
        'Expert-crafted itinerary',
        'Basic recommendations',
        'Email support'
      ],
      limitations: [
        'Single destination only',
        'Limited to 1 week',
        'No revisions'
      ]
    },
    {
      id: 'premium',
      name: 'Premium Itinerary',
      price: 59,
      description: 'Most popular choice',
      icon: Star,
      popular: true,
      features: [
        'Multiple destinations',
        '14 days maximum',
        'Advanced expert planning',
        'Restaurant recommendations',
        'Transportation planning',
        '2 free revisions',
        'Priority support'
      ],
      limitations: [
        'Limited to 2 weeks',
        'Maximum 2 revisions'
      ]
    },
    {
      id: 'luxury',
      name: 'Luxury Package',
      price: 149,
      description: 'Ultimate travel experience',
      icon: Crown,
      features: [
        'Unlimited destinations',
        'Unlimited duration',
        'Premium travel concierge',
        'Fine dining recommendations',
        'Luxury accommodation focus',
        'Unlimited revisions',
        'Booking assistance',
        '24/7 concierge support',
        'Exclusive experiences'
      ],
      limitations: []
    }
  ];

  const isCurrentPlan = (tierId: string) => {
    return subscriptionInfo?.subscription_tier === tierId;
  };

  const canUpgrade = (tierId: string) => {
    const currentTier = subscriptionInfo?.subscription_tier || 'free';
    const tierOrder = ['free', 'basic', 'premium', 'luxury'];
    const currentIndex = tierOrder.indexOf(currentTier);
    const targetIndex = tierOrder.indexOf(tierId);
    return targetIndex > currentIndex;
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <Compass className="h-8 w-8 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Compass className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold text-primary">Atlas</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              {subscriptionInfo?.subscribed && (
                <Button variant="outline" onClick={handleManageSubscription}>
                  Manage Subscription
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Adventure Plan
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Unlock expertly curated travel planning tailored to your needs
          </p>
          
          {subscriptionInfo?.subscribed && (
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
              <Check className="h-4 w-4" />
              Currently on {subscriptionInfo.subscription_tier.charAt(0).toUpperCase() + subscriptionInfo.subscription_tier.slice(1)} Plan
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {pricingTiers.map((tier) => {
            const IconComponent = tier.icon;
            const isCurrent = isCurrentPlan(tier.id);
            const canUpgradeToThis = canUpgrade(tier.id);
            
            return (
              <Card 
                key={tier.id} 
                className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
                  tier.popular ? 'ring-2 ring-primary shadow-lg scale-105' : ''
                } ${isCurrent ? 'ring-2 ring-green-500' : ''}`}
              >
                {tier.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-primary text-white text-center py-2 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                
                {isCurrent && (
                  <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-center py-2 text-sm font-medium">
                    Your Current Plan
                  </div>
                )}

                <CardHeader className={tier.popular || isCurrent ? 'pt-12' : ''}>
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle className="text-xl">{tier.name}</CardTitle>
                      <CardDescription>{tier.description}</CardDescription>
                    </div>
                  </div>
                  
                  <div className="text-center mt-6">
                    <div className="text-4xl font-bold text-gray-900">
                      ${tier.price}
                      <span className="text-lg font-normal text-gray-500">/month</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">What's included:</h4>
                    <ul className="space-y-2">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <div className="pt-4">
                    {isCurrent ? (
                      <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : canUpgradeToThis ? (
                      <Button 
                        variant={tier.popular ? "adventure" : "outline"} 
                        className="w-full"
                        onClick={() => handleUpgrade(tier.id)}
                        disabled={processingTier === tier.id}
                      >
                        {processingTier === tier.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Upgrade to {tier.name}
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full" disabled>
                        Lower Tier
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Comparison */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Compare Plans
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Features</th>
                  <th className="text-center py-3 px-4">Basic</th>
                  <th className="text-center py-3 px-4">Premium</th>
                  <th className="text-center py-3 px-4">Luxury</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Destinations</td>
                  <td className="text-center py-3 px-4">1</td>
                  <td className="text-center py-3 px-4">Multiple</td>
                  <td className="text-center py-3 px-4">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Trip Duration</td>
                  <td className="text-center py-3 px-4">7 days max</td>
                  <td className="text-center py-3 px-4">14 days max</td>
                  <td className="text-center py-3 px-4">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Itinerary Revisions</td>
                  <td className="text-center py-3 px-4">None</td>
                  <td className="text-center py-3 px-4">2 free</td>
                  <td className="text-center py-3 px-4">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Booking Assistance</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">24/7 Support</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">Can I change my plan anytime?</h3>
                <p className="text-sm text-gray-600">Yes, you can upgrade or downgrade your plan at any time through your dashboard.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">What happens if I cancel?</h3>
                <p className="text-sm text-gray-600">You'll retain access to your current plan until the end of your billing period.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">Are there any hidden fees?</h3>
                <p className="text-sm text-gray-600">No hidden fees. The price you see is what you pay monthly.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Do you offer refunds?</h3>
                <p className="text-sm text-gray-600">We offer a 30-day money-back guarantee on all plans.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;