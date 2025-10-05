import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  Phone, 
  MapPin, 
  Heart,
  Building,
  Download,
  Copy,
  CreditCard,
  FileText,
  Shield,
  Plane,
  Hospital,
  Car,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EmergencyContact {
  service: string;
  number: string;
  description: string;
  icon: React.ReactNode;
  priority: 'critical' | 'important' | 'useful';
}

interface EmergencyInfo {
  category: string;
  title: string;
  content: string;
  icon: React.ReactNode;
}

interface EmergencyPlanProps {
  tripData: any;
}

const EmergencyPlan = ({ tripData }: EmergencyPlanProps) => {
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [emergencyInfo, setEmergencyInfo] = useState<EmergencyInfo[]>([]);
  const [walletCardData, setWalletCardData] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [emergencyData, setEmergencyData] = useState<any>(null);

  useEffect(() => {
    const formData = tripData?.form_data || tripData?.formData || {};
    const destinations = formData.specificDestinations || [];
    const destination = destinations[0] || formData.destination || '';
    
    // Show fallback content immediately
    generateFallbackEmergencyPlan(destination);
    
    // Then fetch real-time data in background
    fetchEmergencyData(destination, formData);
  }, [tripData]);

  const fetchEmergencyData = async (destination: string, formData: any) => {
    console.log('EmergencyPlan: Fetching real-time emergency data in background...');

    try {
      const { data, error } = await supabase.functions.invoke('get-emergency-data', {
        body: {
          destination,
          lat: formData.lat,
          lng: formData.lng
        }
      });

      if (!error && data) {
        console.log('EmergencyPlan: Successfully fetched real-time emergency data');
        setEmergencyData(data);
        generateEmergencyPlan(data, destination);
      }
    } catch (error) {
      console.error('EmergencyPlan: Error fetching real-time emergency data:', error);
      // Keep fallback content on error
    } finally {
      setLoading(false);
    }
  };

  const generateEmergencyPlan = (data: any, destination: string) => {
    // Use real-time emergency data
    const contacts = data?.emergencyNumbers || [];
    const formattedContacts = contacts.map((contact: any) => ({
      service: contact.service,
      number: contact.number,
      description: contact.description,
      icon: getServiceIcon(contact.service),
      priority: contact.priority
    }));

    setEmergencyContacts(formattedContacts);
    setEmergencyInfo(getEmergencyProcedures());
    generateWalletCard(data, destination);
  };

  const generateFallbackEmergencyPlan = (destination: string) => {
    const fallbackContacts = getFallbackContacts(destination);
    setEmergencyContacts(fallbackContacts);
    setEmergencyInfo(getEmergencyProcedures());
    generateWalletCard(null, destination);
  };

  const getServiceIcon = (service: string) => {
    switch (service.toLowerCase()) {
      case 'emergency services': return <AlertTriangle className="h-4 w-4" />;
      case 'police': return <Shield className="h-4 w-4" />;
      case 'medical emergency': return <Heart className="h-4 w-4" />;
      case 'fire department': return <AlertTriangle className="h-4 w-4" />;
      case 'us embassy/consulate': return <Building className="h-4 w-4" />;
      case 'tourist police': return <Shield className="h-4 w-4" />;
      default: return <Phone className="h-4 w-4" />;
    }
  };

  const getFallbackContacts = (destination: string): EmergencyContact[] => {
    const isInternational = !destination.toLowerCase().includes('usa') && !destination.toLowerCase().includes('united states');
    
    return [
      {
        service: 'Emergency Services',
        number: isInternational ? '112' : '911',
        description: 'Police, Fire, Medical Emergency',
        icon: <AlertTriangle className="h-4 w-4" />,
        priority: 'critical'
      },
      {
        service: 'US Embassy/Consulate',
        number: 'Search "US Embassy ' + destination + '"',
        description: 'Lost passport, legal issues, major emergencies',
        icon: <Building className="h-4 w-4" />,
        priority: 'important'
      }
    ];
  };

  const getEmergencyProcedures = (): EmergencyInfo[] => {
    return [
      {
        category: 'Lost Passport',
        title: 'Steps to Replace Lost/Stolen Passport',
        content: '1. Report to local police and get a police report\n2. Contact nearest US embassy/consulate\n3. Complete Form DS-11 and DS-64\n4. Provide proof of citizenship and identity\n5. Pay replacement fees\n6. Get temporary travel document if needed',
        icon: <Plane className="h-4 w-4" />
      },
      {
        category: 'Medical Emergency',
        title: 'Medical Emergency Protocol',
        content: '1. Call local emergency number immediately\n2. Contact travel insurance provider\n3. Notify embassy if serious\n4. Keep all medical receipts\n5. Contact family/emergency contact\n6. Get medical records translated if needed',
        icon: <Hospital className="h-4 w-4" />
      },
      {
        category: 'Theft/Crime',
        title: 'If You\'re Robbed or Scammed',
        content: '1. Don\'t resist if threatened\n2. Report to police immediately\n3. Get police report number\n4. Cancel all cards and accounts\n5. Contact insurance company\n6. Report to embassy if serious\n7. Monitor accounts for fraud',
        icon: <Shield className="h-4 w-4" />
      },
      {
        category: 'Transportation',
        title: 'Transportation Emergencies',
        content: '1. Contact local transport authorities\n2. Keep all documentation\n3. Know alternative routes\n4. Have backup transportation apps\n5. Keep emergency cash separate\n6. Know how to contact taxi/rideshare',
        icon: <Car className="h-4 w-4" />
      }
    ];
  };

  const generateWalletCard = (data: any, destination: string) => {
    const formData = tripData?.form_data || tripData?.formData || {};
    const destinations = formData.specificDestinations || [];
    const dest = destinations[0] || formData.destination || 'Destination';
    const dates = formData.startDate && formData.endDate 
      ? `${formData.startDate} to ${formData.endDate}`
      : 'Travel dates';

    const emergencyNumber = data?.emergencyNumbers?.[0]?.number || '112';
    const phrases = data?.emergencyPhrases || {};

    const cardData = `EMERGENCY WALLET CARD - ${dest}
${dates}

🚨 CRITICAL NUMBERS:
Emergency: ${emergencyNumber}
Police: ${data?.emergencyNumbers?.find((c: any) => c.service === 'Police')?.number || 'Contact local police'}
Medical: ${data?.emergencyNumbers?.find((c: any) => c.service === 'Medical Emergency')?.number || 'Contact local hospital'}
US Embassy: ${data?.embassies?.[0]?.phone || 'Check embassy website'}

💳 MONEY EMERGENCIES:
[Your bank name]: [Emergency number]
[Credit card company]: [Emergency number]
Travel Insurance: [Your policy number]

🏥 MEDICAL INFO:
Blood Type: [Your blood type]
Allergies: [Your allergies]
Medications: [Current medications]
Emergency Contact: [Name & number]

📍 ACCOMMODATION:
Hotel: [Hotel name & address]
Phone: [Hotel phone number]

💡 KEY PHRASES:
${phrases['Help!'] ? `"Help" - ${phrases['Help!'].phrase} (${phrases['Help!'].pronunciation})` : '"Help" - [Local language]'}
${phrases['Call the police!'] ? `"Police" - ${phrases['Call the police!'].phrase} (${phrases['Call the police!'].pronunciation})` : '"Police" - [Local language]'}
${phrases['I need a doctor'] ? `"Doctor" - ${phrases['I need a doctor'].phrase} (${phrases['I need a doctor'].pronunciation})` : '"Doctor" - [Local language]'}

Keep this card separate from wallet/phone.`;

    setWalletCardData(cardData);
  };


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadWalletCard = () => {
    const blob = new Blob([walletCardData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'emergency-wallet-card.txt';
    link.click();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'important': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'useful': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formData = tripData?.form_data || tripData?.formData || {};
  const destinations = formData.specificDestinations || [];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Emergency Plan</h2>
            <p className="text-muted-foreground">
              Essential emergency contacts and procedures for {destinations[0] || formData.destination || 'your destination'}
            </p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading emergency data...</span>
            </div>
          )}
        </div>
      </div>

      {/* Critical Alert */}
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Save these numbers in your phone NOW</strong> and keep a written copy separate from your phone. 
          In emergencies, your phone might be dead, stolen, or broken.
        </AlertDescription>
      </Alert>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-red-600" />
            Emergency Contacts
          </CardTitle>
          <CardDescription>
            Save these numbers in your phone and write them down separately
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {emergencyContacts.map((contact, index) => (
            <div key={index} className={`p-4 border rounded-lg ${getPriorityColor(contact.priority)}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded">
                    {contact.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold">{contact.service}</h4>
                    <p className="text-lg font-mono font-bold text-blue-600">{contact.number}</p>
                    <p className="text-sm text-muted-foreground">{contact.description}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge variant="outline" className="text-xs">
                    {contact.priority.toUpperCase()}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(contact.number)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Real Hospitals Near You */}
      {emergencyData?.hospitals && emergencyData.hospitals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hospital className="h-5 w-5 text-red-600" />
              Nearest Hospitals
            </CardTitle>
            <CardDescription>
              Hospitals and medical facilities near your destination
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {emergencyData.hospitals.map((hospital: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{hospital.name}</h4>
                    <p className="text-sm text-muted-foreground">{hospital.address}</p>
                    <div className="flex items-center gap-4 mt-2">
                      {hospital.emergency && (
                        <Badge variant="destructive" className="text-xs">24/7 Emergency</Badge>
                      )}
                      {hospital.englishSpeaking && (
                        <Badge variant="outline" className="text-xs">English Speaking</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(hospital.phone)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {hospital.phone}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(hospital.name + ' ' + hospital.address)}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Directions
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Embassy Information */}
      {emergencyData?.embassies && emergencyData.embassies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              US Embassy/Consulate
            </CardTitle>
            <CardDescription>
              Official US government assistance and services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {emergencyData.embassies.map((embassy: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{embassy.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{embassy.address}</p>
                    <p className="text-sm"><strong>Hours:</strong> {embassy.hours}</p>
                    <div className="mt-2">
                      <h5 className="text-sm font-medium">Services Available:</h5>
                      <ul className="text-xs text-muted-foreground mt-1">
                        {embassy.services?.map((service: string, idx: number) => (
                          <li key={idx}>• {service}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(embassy.phone)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Main: {embassy.phone}
                    </Button>
                    {embassy.emergencyPhone && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => copyToClipboard(embassy.emergencyPhone)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Emergency: {embassy.emergencyPhone}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Emergency Procedures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Emergency Procedures
          </CardTitle>
          <CardDescription>
            Step-by-step guides for common emergency situations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {emergencyInfo.map((info, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center gap-2">
                {info.icon}
                <h4 className="font-semibold">{info.title}</h4>
              </div>
              <div className="pl-6">
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
                  {info.content}
                </pre>
              </div>
              {index < emergencyInfo.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Downloadable Wallet Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              Emergency Wallet Card
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(walletCardData)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={downloadWalletCard}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Print this card and keep it in your wallet, separate from your phone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <pre className="text-xs font-mono whitespace-pre-wrap">
              {walletCardData}
            </pre>
          </div>
          
          {/* Emergency Phrases */}
          {emergencyData?.emergencyPhrases && (
            <div className="mt-4">
              <h4 className="font-medium mb-3">Essential Emergency Phrases:</h4>
              <div className="grid md:grid-cols-2 gap-3">
                {Object.entries(emergencyData.emergencyPhrases).map(([english, data]: [string, any]) => (
                  <div key={english} className="p-2 bg-blue-50 rounded">
                    <p className="text-xs font-medium">{english}</p>
                    <p className="text-sm font-semibold text-blue-700">{data.phrase}</p>
                    <p className="text-xs text-blue-600 italic">({data.pronunciation})</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trusted Transport */}
          {emergencyData?.trustedTransport && (
            <div className="mt-4">
              <h4 className="font-medium mb-3">Trusted Emergency Transport:</h4>
              <div className="space-y-2">
                {emergencyData.trustedTransport.rideshare && (
                  <div>
                    <p className="text-sm font-medium">Ride-sharing:</p>
                    <p className="text-xs text-muted-foreground">
                      {emergencyData.trustedTransport.rideshare.join(', ')}
                    </p>
                  </div>
                )}
                {emergencyData.trustedTransport.taxi && (
                  <div>
                    <p className="text-sm font-medium">Taxis:</p>
                    <p className="text-xs text-muted-foreground">
                      {emergencyData.trustedTransport.taxi.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Offline Maps */}
          {emergencyData?.offlineMapLinks && (
            <div className="mt-4">
              <h4 className="font-medium mb-3">Download Offline Maps:</h4>
              <div className="flex flex-wrap gap-2">
                {emergencyData.offlineMapLinks.googleMaps && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(emergencyData.offlineMapLinks.googleMaps, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Google Maps
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://osmand.net/', '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  OsmAnd
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://maps.me/', '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Maps.me
                </Button>
              </div>
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-3">
            <strong>Instructions:</strong> Fill in the blanks with your actual information, 
            print this card, and keep it in your wallet separate from your phone and passport.
            Consider laminating it for durability.
          </p>
        </CardContent>
      </Card>

      {/* Before You Go Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Before You Go - Emergency Prep Checklist</CardTitle>
          <CardDescription>
            Complete these steps before departure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-blue-700">Documents & Info</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Copy passport, visas, insurance cards</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Share itinerary with emergency contact</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Research embassy/consulate locations</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Get travel insurance policy details</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-green-700">Contacts & Access</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Save all emergency numbers in phone</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Set up international phone plan</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Download offline maps and translation apps</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Notify banks and credit card companies</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions in Emergency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-700">In Case of Emergency - Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-red-50 rounded-lg text-center">
              <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <h5 className="font-medium text-red-800">1. Stay Calm</h5>
              <p className="text-red-700">Take deep breaths and assess the situation</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg text-center">
              <Phone className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <h5 className="font-medium text-orange-800">2. Call for Help</h5>
              <p className="text-orange-700">Use emergency numbers from your wallet card</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <MapPin className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <h5 className="font-medium text-blue-800">3. Share Location</h5>
              <p className="text-blue-700">Tell responders exactly where you are</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <Shield className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <h5 className="font-medium text-green-800">4. Stay Safe</h5>
              <p className="text-green-700">Move to a safe location and wait for help</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyPlan;