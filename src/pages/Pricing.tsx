import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import PricingCalculator from '@/components/pricing/PricingCalculator';
import { 
  Check, 
  Compass, 
  Star, 
  Crown, 
  X,
  ArrowRight,
  DollarSign,
  Clock,
  Users,
  MapPin,
  Headphones,
  Shield
} from 'lucide-react';

const Pricing = () => {
  const { user } = useAuth();

  const serviceTiers = [
    {
      id: 'essential',
      name: 'Essential Plan',
      price: 39,
      description: 'Perfect for independent travelers',
      icon: Compass,
      features: [
        'Full AI-generated itinerary (unlimited duration)',
        'Restaurant and activity recommendations with booking links',
        'Accommodation suggestions with booking links',
        'Transportation recommendations',
        'PDF itinerary export',
        'Email support (48hr response)',
        'Self-service booking through provided links'
      ],
      limitations: [
        'Self-service booking only',
        'No revisions included',
        'Email support only'
      ]
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: 89,
      description: 'Most popular - with booking assistance',
      icon: Star,
      popular: true,
      features: [
        'Everything in Essential (same AI quality)',
        'Human booking assistance for hotels & activities',
        'Flight booking guidance',
        'Multiple destination planning',
        '1 free revision with human review',
        'Priority email support (24hr response)'
      ],
      limitations: [
        'Limited to 1 revision',
        'Email support only',
        'No restaurant reservations'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Compass className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold text-primary">Atlas</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/about">
                <Button variant="ghost">About</Button>
              </Link>
              {user ? (
                <Link to="/dashboard">
                  <Button variant="outline">Dashboard</Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button variant="outline">Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Per-Trip Travel Planning
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Pay only for what you need. No subscriptions, no commitments.
          </p>
          <p className="text-lg text-gray-500">
            Dynamic pricing based on your trip complexity and service level
          </p>
        </div>

        {/* Service Tiers Overview */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Choose Your Service Level
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {serviceTiers.map((tier) => {
              const IconComponent = tier.icon;
              
              return (
                <Card 
                  key={tier.id} 
                  className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
                    tier.popular ? 'ring-2 ring-primary shadow-lg scale-105' : ''
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute top-0 left-0 right-0 bg-primary text-white text-center py-2 text-sm font-medium">
                      Most Popular
                    </div>
                  )}

                  <CardHeader className={tier.popular ? 'pt-12' : ''}>
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle className="text-xl">{tier.name}</CardTitle>
                        <CardDescription>{tier.description}</CardDescription>
                      </div>
                    </div>
                    
                    <div className="text-center mt-6">
                      <div className="text-4xl font-bold text-gray-900">
                        ${tier.price}+
                        <span className="text-lg font-normal text-gray-500">/trip</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Starting price</p>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Features */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">What's included:</h4>
                      <ul className="space-y-2">
                        {tier.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Limitations */}
                    {tier.limitations.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">Service boundaries:</h4>
                        <ul className="space-y-2">
                          {tier.limitations.map((limitation, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <X className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-gray-500">{limitation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* CTA Button */}
                    <div className="pt-4">
                      <Link to="/create-trip">
                        <Button 
                          variant={tier.popular ? "default" : "outline"} 
                          className="w-full"
                        >
                          Start Planning with {tier.name}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Executive Concierge */}
            <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-lg border-2 border-amber-500 bg-gradient-to-br from-amber-50 to-amber-100">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Crown className="h-8 w-8 text-amber-600" />
                  <div>
                    <CardTitle className="text-xl text-amber-800">Executive Concierge</CardTitle>
                    <CardDescription className="text-amber-700">White-glove travel planning service</CardDescription>
                  </div>
                </div>
                
                <div className="text-center mt-6">
                  <div className="text-4xl font-bold text-amber-800">
                    Consultation Required
                  </div>
                  <p className="text-sm text-amber-600 mt-1">Starting at $500</p>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features */}
                <div>
                  <h4 className="font-medium text-amber-900 mb-3">What's included:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-amber-800">One-on-one consultation call</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-amber-800">Complete booking service (flights, hotels, transport)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-amber-800">Restaurant reservations & exclusive experiences</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-amber-800">Dedicated travel coordinator</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-amber-800">24/7 support during travel</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-amber-800">Unlimited revisions</span>
                    </li>
                  </ul>
                </div>

                {/* CTA Button */}
                <div className="pt-4">
                  <Button 
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => window.open('https://calendly.com/atlas-executive', '_blank')}
                  >
                    Book Consultation
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Value messaging */}
          <div className="mt-12 text-center">
            <p className="text-lg text-gray-600 mb-4">
              <strong>Same AI Quality for All Tiers</strong> - Our differentiation is based on human service levels, not AI output quality.
            </p>
            <p className="text-gray-500">
              Essential and Premium plans receive identical AI-generated itineraries. The difference is in booking assistance and support.
            </p>
          </div>
        </div>

        {/* Pricing Calculator */}
        <div className="mb-16">
          <PricingCalculator />
        </div>

        {/* Pricing Factors */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            How Pricing Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="text-center">
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Group Size</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-sm text-gray-600">
                <p>1 person: Base price</p>
                <p>2 people: +30%</p>
                <p>3-4 people: +60%</p>
                <p>5+ people: +100%+</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Duration</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-sm text-gray-600">
                <p>1-3 days: Base price</p>
                <p>4-7 days: +20%</p>
                <p>8-14 days: +50%</p>
                <p>15+ days: +100%+</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Destinations</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-sm text-gray-600">
                <p>Single city: Base price</p>
                <p>Multiple cities: +30%</p>
                <p>Multiple countries: +60%</p>
                <p>Remote locations: +80%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Luxury Level</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-sm text-gray-600">
                <p>Budget: Base price</p>
                <p>Mid-range: +20%</p>
                <p>Luxury: +50%</p>
                <p>Ultra-luxury: +100%</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Comparison */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Service Comparison
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Feature</th>
                  <th className="text-center py-3 px-4">Essential</th>
                  <th className="text-center py-3 px-4">Premium</th>
                  <th className="text-center py-3 px-4">Executive</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">AI Itinerary Quality</td>
                  <td className="text-center py-3 px-4">✅ Full</td>
                  <td className="text-center py-3 px-4">✅ Full</td>
                  <td className="text-center py-3 px-4">✅ Full</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Trip Duration</td>
                  <td className="text-center py-3 px-4">Unlimited</td>
                  <td className="text-center py-3 px-4">Unlimited</td>
                  <td className="text-center py-3 px-4">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Booking Assistance</td>
                  <td className="text-center py-3 px-4">Self-service</td>
                  <td className="text-center py-3 px-4">Human help</td>
                  <td className="text-center py-3 px-4">Full service</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Revisions</td>
                  <td className="text-center py-3 px-4">None</td>
                  <td className="text-center py-3 px-4">1 included</td>
                  <td className="text-center py-3 px-4">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Support</td>
                  <td className="text-center py-3 px-4">Email</td>
                  <td className="text-center py-3 px-4">Priority email</td>
                  <td className="text-center py-3 px-4">24/7 phone + email</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Process */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Simple Payment Process
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Quote</h3>
              <p className="text-gray-600">Use our calculator to get instant pricing for your trip</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Pay Upfront</h3>
              <p className="text-gray-600">Pay full amount upfront to start the planning process</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Receive Itinerary</h3>
              <p className="text-gray-600">Get your completed travel plan within 24-48 hours</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">How does per-trip pricing work?</h3>
                <p className="text-sm text-gray-600">You pay only for each trip you plan. No monthly subscriptions or hidden fees.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Can I get a refund?</h3>
                <p className="text-sm text-gray-600">Yes, we offer a satisfaction guarantee. If you're not happy with your itinerary, we'll refund your deposit.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">What if I need changes?</h3>
                <p className="text-sm text-gray-600">Revisions are included based on your service tier. Premium gets 1 free revision, Luxury gets unlimited.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">How quickly can you plan my trip?</h3>
                <p className="text-sm text-gray-600">Most itineraries are completed within 24-48 hours. Rush orders (under 48 hours) include a 25% surcharge.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Do you handle bookings?</h3>
                <p className="text-sm text-gray-600">Depends on your service tier. Essential provides links, Premium assists with booking, Luxury handles everything.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Is there a minimum trip length?</h3>
                <p className="text-sm text-gray-600">No minimum! We can plan anything from a day trip to a multi-month adventure.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;