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
  Car
} from 'lucide-react';

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

  useEffect(() => {
    generateEmergencyPlan();
  }, [tripData]);

  const generateEmergencyPlan = () => {
    const destination = tripData?.formData?.destination || '';
    const isInternational = !destination.toLowerCase().includes('usa') && !destination.toLowerCase().includes('united states');

    // Emergency contacts (these would be customized based on destination)
    const contacts: EmergencyContact[] = [
      {
        service: 'Emergency Services',
        number: isInternational ? '112 (EU) / 911' : '911',
        description: 'Police, Fire, Medical Emergency',
        icon: <AlertTriangle className="h-4 w-4" />,
        priority: 'critical'
      },
      {
        service: 'Police',
        number: isInternational ? 'Local police number' : '911',
        description: 'Crime, theft, assault',
        icon: <Shield className="h-4 w-4" />,
        priority: 'critical'
      },
      {
        service: 'Medical Emergency',
        number: isInternational ? 'Local ambulance' : '911',
        description: 'Ambulance, hospital emergency',
        icon: <Heart className="h-4 w-4" />,
        priority: 'critical'
      },
      {
        service: 'US Embassy/Consulate',
        number: '+1-xxx-xxx-xxxx',
        description: 'Lost passport, legal issues, major emergencies',
        icon: <Building className="h-4 w-4" />,
        priority: 'important'
      },
      {
        service: 'Travel Insurance',
        number: 'Your insurance number',
        description: 'Medical coverage, trip assistance',
        icon: <FileText className="h-4 w-4" />,
        priority: 'important'
      },
      {
        service: 'Credit Card Company',
        number: 'Card company emergency line',
        description: 'Lost/stolen cards, fraud protection',
        icon: <CreditCard className="h-4 w-4" />,
        priority: 'important'
      }
    ];

    // Emergency information and procedures
    const info: EmergencyInfo[] = [
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

    setEmergencyContacts(contacts);
    setEmergencyInfo(info);
    generateWalletCard();
  };

  const generateWalletCard = () => {
    const destination = tripData?.formData?.destination || 'Destination';
    const dates = tripData?.formData?.startDate && tripData?.formData?.endDate 
      ? `${tripData.formData.startDate} to ${tripData.formData.endDate}`
      : 'Travel dates';

    const cardData = `EMERGENCY WALLET CARD - ${destination}
${dates}

🚨 CRITICAL NUMBERS:
Emergency: 112 / 911
Police: [Local police number]
Medical: [Local ambulance]
US Embassy: [Embassy number]

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
"Help" - [Local language]
"Police" - [Local language]
"Hospital" - [Local language]
"I need help" - [Local language]

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

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Emergency Plan</h2>
        <p className="text-muted-foreground">
          Essential emergency contacts and procedures for {tripData?.formData?.destination || 'your destination'}
        </p>
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