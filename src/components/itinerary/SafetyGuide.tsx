import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  DollarSign, 
  Phone, 
  MapPin, 
  Eye,
  Users,
  Car,
  Wifi,
  Lock,
  CreditCard,
  Camera,
  MessageSquare,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ScamWarning {
  id: string;
  title: string;
  description: string;
  commonPhrases: string[];
  politeResponse: string;
  redFlags: string[];
  category: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface SafetyTip {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  importance: 'low' | 'medium' | 'high';
}

interface SafetyGuideProps {
  tripData: any;
}

const SafetyGuide = ({ tripData }: SafetyGuideProps) => {
  const [scamWarnings, setScamWarnings] = useState<ScamWarning[]>([]);
  const [safetyTips, setSafetyTips] = useState<SafetyTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [safetyData, setSafetyData] = useState<any>(null);

  useEffect(() => {
    fetchSafetyData();
  }, [tripData]);

  const fetchSafetyData = async () => {
    setLoading(true);
    const formData = tripData?.form_data || tripData?.formData || {};
    const destinations = formData.specificDestinations || [];
    const destination = destinations[0] || formData.destination || '';

    try {
      const { data, error } = await supabase.functions.invoke('get-safety-data', {
        body: {
          destination,
          lat: formData.lat,
          lng: formData.lng
        }
      });

      if (error) {
        console.error('Error fetching safety data:', error);
        generateFallbackContent(destination);
      } else {
        setSafetyData(data);
        generateSafetyContent(data, destination);
      }
    } catch (error) {
      console.error('Error fetching safety data:', error);
      generateFallbackContent(destination);
    } finally {
      setLoading(false);
    }
  };

  const generateSafetyContent = (data: any, destination: string) => {
    // Use real-time data or fallback to static content
    const destinationScams = data?.destinationScams || [];
    const commonScams = getCommonScams(destination);
    const combinedScams = [...destinationScams, ...commonScams];

    setScamWarnings(combinedScams);
    setSafetyTips(getGeneralSafetyTips());
  };

  const generateFallbackContent = (destination: string) => {
    setScamWarnings(getCommonScams(destination));
    setSafetyTips(getGeneralSafetyTips());
  };

  const getCommonScams = (destination: string): ScamWarning[] => {
    // Common tourist scams (these are universal but we can customize based on destination)
    return [
      {
        id: 'fake-police',
        title: 'Fake Police Check',
        description: 'Someone in uniform or plain clothes claims to be police and wants to check your wallet for "counterfeit money".',
        commonPhrases: [
          'Police, show me your passport and wallet',
          'We need to check for fake bills',
          'There are counterfeit euros/dollars in the area'
        ],
        politeResponse: 'I\'d like to see your ID first. Can we go to the nearest police station?',
        redFlags: [
          'Asking to see your wallet or money',
          'No visible badge or patrol car nearby',
          'Pressure to act quickly',
          'Working alone in tourist areas'
        ],
        category: 'Authority Scam',
        riskLevel: 'high'
      },
      {
        id: 'distraction-theft',
        title: 'Distraction & Pickpocketing',
        description: 'Groups work together - one distracts you while others steal. Common on public transport and crowded areas.',
        commonPhrases: [
          'Excuse me, can you help me?',
          'You dropped something!',
          'Can you take our photo?'
        ],
        politeResponse: 'Sorry, I\'m in a hurry. Maybe ask someone else.',
        redFlags: [
          'Multiple people approaching at once',
          'Unnecessary physical contact',
          'Crowded spaces with pushing',
          'Someone pointing behind you'
        ],
        category: 'Theft',
        riskLevel: 'high'
      },
      {
        id: 'overpriced-taxi',
        title: 'Taxi Overcharge',
        description: 'Driver claims meter is broken, quotes inflated prices, or takes longer routes.',
        commonPhrases: [
          'Meter is broken, but I give you good price',
          'For tourists, special rate',
          'Traffic today, need to go different way'
        ],
        politeResponse: 'Please use the meter, or I\'ll find another taxi.',
        redFlags: [
          'Refusing to use meter',
          'Quote seems too high',
          'Taking unfamiliar routes',
          'No taxi identification visible'
        ],
        category: 'Transport',
        riskLevel: 'medium'
      }
    ];
  };

  const getGeneralSafetyTips = (): SafetyTip[] => {
    return [
      {
        id: 'money-safety',
        category: 'Money & Documents',
        title: 'Secure Your Valuables',
        description: 'Keep passport, main credit cards, and cash in different places. Use hotel safe for originals, carry photocopies.',
        icon: <Lock className="h-4 w-4" />,
        importance: 'high'
      },
      {
        id: 'atm-safety',
        category: 'Money & Documents',
        title: 'ATM Security',
        description: 'Use ATMs inside banks or hotels. Cover your PIN, check for card skimmers, and avoid standalone machines in dark areas.',
        icon: <CreditCard className="h-4 w-4" />,
        importance: 'high'
      },
      {
        id: 'transport-safety',
        category: 'Transportation',
        title: 'Safe Transportation',
        description: 'Use official taxis or ride-sharing apps. Note the license plate and share your trip details with someone.',
        icon: <Car className="h-4 w-4" />,
        importance: 'medium'
      },
      {
        id: 'area-awareness',
        category: 'Situational Awareness',
        title: 'Know Safe vs Unsafe Areas',
        description: 'Research neighborhoods before visiting. Avoid empty areas at night and trust your instincts if something feels wrong.',
        icon: <MapPin className="h-4 w-4" />,
        importance: 'high'
      },
      {
        id: 'communication',
        category: 'Communication',
        title: 'Stay Connected',
        description: 'Share your itinerary with someone at home. Check in regularly and have offline maps downloaded.',
        icon: <Phone className="h-4 w-4" />,
        importance: 'medium'
      },
      {
        id: 'appearance',
        category: 'Personal Safety',
        title: 'Blend In',
        description: 'Avoid flashy jewelry, expensive electronics in plain sight, and obvious tourist behaviors that make you a target.',
        icon: <Eye className="h-4 w-4" />,
        importance: 'medium'
      }
    ];
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const categories = [...new Set(safetyTips.map(tip => tip.category))];
  const formData = tripData?.form_data || tripData?.formData || {};
  const destinations = formData.specificDestinations || [];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Safety & Scam Prevention</h2>
            <p className="text-muted-foreground">
              Stay safe and avoid common tourist traps in {destinations[0] || formData.destination || 'your destination'}
            </p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading safety data...</span>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Travel Advisories */}
      {safetyData?.travelAdvisories && safetyData.travelAdvisories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Current Travel Advisories
            </CardTitle>
            <CardDescription>
              Official government travel advisories for your destination
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {safetyData.travelAdvisories.map((advisory: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{advisory.country}</h4>
                  <Badge variant={advisory.level > 2 ? 'destructive' : advisory.level > 1 ? 'secondary' : 'outline'}>
                    Level {advisory.level}: {advisory.advisory}
                  </Badge>
                </div>
                <ul className="space-y-1">
                  {advisory.details?.map((detail: string, idx: number) => (
                    <li key={idx} className="text-sm text-muted-foreground">• {detail}</li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Source: {advisory.source} | Updated: {new Date(advisory.updated).toLocaleDateString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Real-time Safety Alerts */}
      {safetyData?.realtimeAlerts && safetyData.realtimeAlerts.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Current Safety Alerts:</strong>
            {safetyData.realtimeAlerts.map((alert: any, index: number) => (
              <div key={index} className="mt-1">
                <strong>{alert.title}:</strong> {alert.description}
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Emergency Alert */}
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>In case of emergency:</strong> Contact local emergency services first, then your embassy. 
          Keep emergency numbers saved in your phone and written down separately.
          {safetyData?.emergencyNumbers && (
            <span> Emergency: {safetyData.emergencyNumbers.emergency}</span>
          )}
        </AlertDescription>
      </Alert>

      {/* Common Tourist Scams */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Common Tourist Scams
          </CardTitle>
          <CardDescription>
            Know these scams to recognize and avoid them
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {scamWarnings.map((scam) => (
            <div key={scam.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-lg">{scam.title}</h4>
                  <Badge variant={getRiskColor(scam.riskLevel)} className="mt-1">
                    {scam.riskLevel.toUpperCase()} RISK
                  </Badge>
                </div>
                <Badge variant="outline">{scam.category}</Badge>
              </div>
              
              <p className="text-sm text-muted-foreground">{scam.description}</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-red-700 mb-2">What they might say:</h5>
                  <ul className="space-y-1">
                    {scam.commonPhrases.map((phrase, index) => (
                      <li key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        "{phrase}"
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium text-green-700 mb-2">How to respond:</h5>
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                    "{scam.politeResponse}"
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-orange-700 mb-2">Red flags to watch for:</h5>
                <div className="flex flex-wrap gap-2">
                  {scam.redFlags.map((flag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {flag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Destination-Specific Safety Information */}
      {safetyData?.safetyConcerns && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Specific Safety Considerations
            </CardTitle>
            <CardDescription>
              Important safety information for your destination and profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {safetyData.safetyConcerns.women && (
              <div>
                <h4 className="font-medium text-purple-700 mb-2">Women's Safety</h4>
                <ul className="space-y-1">
                  {safetyData.safetyConcerns.women.map((tip: string, index: number) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {safetyData.safetyConcerns.lgbtq && (
              <div>
                <h4 className="font-medium text-rainbow-700 mb-2">LGBTQ+ Safety</h4>
                <ul className="space-y-1">
                  {safetyData.safetyConcerns.lgbtq.map((tip: string, index: number) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Crime Data and Safe Zones */}
      {safetyData?.crimeData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Local Crime Information
            </CardTitle>
            <CardDescription>
              Crime statistics and safe areas for your destination
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-green-700 mb-2">Safest Areas</h4>
                <ul className="space-y-1">
                  {safetyData.crimeData.safestDistricts?.map((area: string, index: number) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-red-700 mb-2">Areas to Avoid</h4>
                <ul className="space-y-1">
                  {safetyData.crimeData.riskyAreas?.map((area: string, index: number) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-orange-700 mb-2">Common Crimes in This Area</h4>
              <div className="flex flex-wrap gap-2">
                {safetyData.crimeData.commonCrimes?.map((crime: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {crime}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Safety Tips by Category */}
      {categories.map((category) => {
        const categoryTips = safetyTips.filter(tip => tip.category === category);
        
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                {category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryTips.map((tip) => (
                  <div key={tip.id} className={`p-4 border rounded-lg ${getImportanceColor(tip.importance)}`}>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white rounded">
                        {tip.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{tip.title}</h4>
                        <p className="text-sm mt-1">{tip.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {tip.importance.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Digital Safety */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-blue-600" />
            Digital Safety
          </CardTitle>
          <CardDescription>
            Protect your digital information while traveling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-green-700">Safe Practices</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Use VPN on public WiFi networks</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Turn off auto-connect to WiFi</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Use two-factor authentication</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Keep software updated</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-red-700">Avoid</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Banking on public computers</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Sharing personal info on social media</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Using USB charging stations</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Clicking unknown links</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Safety Reminders</CardTitle>
          <CardDescription>
            Print this or save as a photo for quick reference
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h5 className="font-medium text-blue-800 mb-2">Trust Your Gut</h5>
              <p className="text-blue-700">If something feels wrong, leave immediately. Your safety is more important than being polite.</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <h5 className="font-medium text-green-800 mb-2">Stay Alert</h5>
              <p className="text-green-700">Avoid headphones in crowded areas. Stay aware of your surroundings and people around you.</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <h5 className="font-medium text-purple-800 mb-2">Firm but Polite</h5>
              <p className="text-purple-700">Say "No, thank you" firmly and keep walking. Don't feel obligated to explain or justify.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SafetyGuide;