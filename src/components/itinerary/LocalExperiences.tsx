import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  MapPin, 
  Coffee, 
  Utensils, 
  Music, 
  Calendar,
  ExternalLink,
  Star,
  Clock,
  DollarSign,
  Languages,
  ShoppingBag,
  Camera,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LocalExperience {
  id: string;
  category: string;
  title: string;
  description: string;
  location: string;
  priceLevel: string;
  timeOfDay: string;
  localPhrase?: string;
  tip: string;
  icon?: React.ReactNode;
  searchUrl?: string;
  url?: string;
  startTime?: string;
  endTime?: string;
  isRecurring?: boolean;
}

interface LocalExperiencesProps {
  tripData: any;
}

const LocalExperiences = ({ tripData }: LocalExperiencesProps) => {
  const [experiences, setExperiences] = useState<LocalExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEventsFound, setTotalEventsFound] = useState(0);

  useEffect(() => {
    fetchLocalEvents();
  }, [tripData]);

  const fetchLocalEvents = async () => {
    setLoading(true);
    const formData = tripData?.form_data || tripData?.formData || {};
    const destinations = formData.specificDestinations || [];
    const destination = destinations[0] || formData.destination || '';
    const interests = formData.activityTypes || formData.interests || [];
    const startDate = formData.startDate || new Date().toISOString().split('T')[0];
    const endDate = formData.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      const { data, error } = await supabase.functions.invoke('get-local-events', {
        body: {
          destination,
          interests,
          startDate,
          endDate
        }
      });

      if (error) {
        console.error('Error fetching local events:', error);
        setExperiences(getFallbackExperiences(destination, interests));
      } else {
        setExperiences(data.events || []);
        setTotalEventsFound(data.totalFound || 0);
      }
    } catch (error) {
      console.error('Error fetching local events:', error);
      setExperiences(getFallbackExperiences(destination, interests));
    } finally {
      setLoading(false);
    }
  };

  const getFallbackExperiences = (destination: string, interests: string[]): LocalExperience[] => {
    // Fallback to static experiences if API fails
    return [
      {
        id: 'local-coffee',
        category: 'Food & Drink',
        title: 'Morning Coffee with Locals',
        description: 'Skip the tourist cafes and find where locals actually start their day.',
        location: 'Local neighborhoods',
        priceLevel: '$',
        timeOfDay: 'Morning (7-9 AM)',
        localPhrase: 'Can I have your recommendation?',
        tip: 'Arrive early, observe what locals order, and don\'t be afraid to point at what looks good.',
        icon: <Coffee className="h-4 w-4" />,
        searchUrl: `https://www.google.com/maps/search/local+coffee+shops+${encodeURIComponent(destination)}`
      },
      {
        id: 'neighborhood-market',
        category: 'Shopping',
        title: 'Neighborhood Market Shopping',
        description: 'Visit local markets where residents do their daily shopping.',
        location: 'Residential areas',
        priceLevel: '$',
        timeOfDay: 'Morning (8-11 AM)',
        localPhrase: 'What do you recommend?',
        tip: 'Bring small bills, learn basic numbers in the local language.',
        icon: <ShoppingBag className="h-4 w-4" />,
        searchUrl: `https://www.google.com/maps/search/local+market+${encodeURIComponent(destination)}`
      }
    ];
  };

  const getPriceIcon = (priceLevel: string) => {
    switch (priceLevel) {
      case 'Free': return <span className="text-green-600 font-bold">FREE</span>;
      case '$': return <span className="text-green-600">$</span>;
      case '$$': return <span className="text-yellow-600">$$</span>;
      case '$$$': return <span className="text-red-600">$$$</span>;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Food & Drink': return 'bg-orange-100 text-orange-800';
      case 'Shopping': return 'bg-purple-100 text-purple-800';
      case 'Nightlife': return 'bg-blue-100 text-blue-800';
      case 'Sightseeing': return 'bg-green-100 text-green-800';
      case 'Culture': return 'bg-pink-100 text-pink-800';
      case 'Nature': return 'bg-emerald-100 text-emerald-800';
      case 'Art & Culture': return 'bg-pink-100 text-pink-800';
      case 'Entertainment': return 'bg-blue-100 text-blue-800';
      case 'Wellness': return 'bg-green-100 text-green-800';
      case 'Cultural': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLanguagePhrases = (destination: string) => {
    const destLower = destination.toLowerCase();
    let phrases = [];

    // Language-specific phrases based on destination
    if (destLower.includes('spain') || destLower.includes('spanish') || destLower.includes('mexico') || destLower.includes('argentina') || destLower.includes('colombia')) {
      phrases = [
        { english: "Hello / Good morning", local: "Hola / Buenos días", pronunciation: "OH-lah / BWAY-nohs DEE-ahs" },
        { english: "Thank you", local: "Gracias", pronunciation: "GRAH-thee-ahs" },
        { english: "Excuse me", local: "Disculpe", pronunciation: "dees-KOOL-peh" },
        { english: "Where do locals eat?", local: "¿Dónde comen los locales?", pronunciation: "DON-deh KOH-men lohs loh-KAH-lehs" },
        { english: "What do you recommend?", local: "¿Qué recomienda?", pronunciation: "keh reh-koh-mee-EN-dah" },
        { english: "The check, please", local: "La cuenta, por favor", pronunciation: "lah KWEN-tah por fah-VOR" }
      ];
    } else if (destLower.includes('france') || destLower.includes('french') || destLower.includes('paris')) {
      phrases = [
        { english: "Hello / Good morning", local: "Bonjour", pronunciation: "bon-ZHOOR" },
        { english: "Thank you", local: "Merci", pronunciation: "mer-SEE" },
        { english: "Excuse me", local: "Excusez-moi", pronunciation: "eks-kü-zay-MWAH" },
        { english: "Where do locals eat?", local: "Où mangent les habitants?", pronunciation: "oo mahn-ZHAHN lay zah-bee-TAHN" },
        { english: "What do you recommend?", local: "Que recommandez-vous?", pronunciation: "kuh ruh-koh-mahn-day VOO" },
        { english: "The check, please", local: "L'addition, s'il vous plaît", pronunciation: "lah-dee-see-OHN seel voo PLAY" }
      ];
    } else if (destLower.includes('italy') || destLower.includes('italian') || destLower.includes('rome') || destLower.includes('florence')) {
      phrases = [
        { english: "Hello / Good morning", local: "Ciao / Buongiorno", pronunciation: "chah-oh / bwohn-JOR-noh" },
        { english: "Thank you", local: "Grazie", pronunciation: "GRAH-tsee-eh" },
        { english: "Excuse me", local: "Mi scusi", pronunciation: "mee SKOO-zee" },
        { english: "Where do locals eat?", local: "Dove mangiano gli abitanti?", pronunciation: "DOH-veh mahn-JAH-noh lyee ah-bee-TAHN-tee" },
        { english: "What do you recommend?", local: "Cosa mi consiglia?", pronunciation: "KOH-zah mee kohn-SEE-lyah" },
        { english: "The check, please", local: "Il conto, per favore", pronunciation: "eel KOHN-toh per fah-VOH-reh" }
      ];
    } else if (destLower.includes('germany') || destLower.includes('german') || destLower.includes('berlin') || destLower.includes('munich')) {
      phrases = [
        { english: "Hello / Good morning", local: "Hallo / Guten Morgen", pronunciation: "HAH-loh / GOO-ten MOR-gen" },
        { english: "Thank you", local: "Danke", pronunciation: "DAHN-keh" },
        { english: "Excuse me", local: "Entschuldigung", pronunciation: "ent-SHOOL-dee-goong" },
        { english: "Where do locals eat?", local: "Wo essen die Einheimischen?", pronunciation: "voh ES-sen dee INE-high-mish-en" },
        { english: "What do you recommend?", local: "Was empfehlen Sie?", pronunciation: "vahs em-PFAY-len zee" },
        { english: "The check, please", local: "Die Rechnung, bitte", pronunciation: "dee REKH-noong BIT-teh" }
      ];
    } else if (destLower.includes('japan') || destLower.includes('japanese') || destLower.includes('tokyo') || destLower.includes('kyoto')) {
      phrases = [
        { english: "Hello / Good morning", local: "こんにちは / おはようございます", pronunciation: "kon-nee-chee-wah / oh-HAH-yoh goh-ZAH-ee-mahs" },
        { english: "Thank you", local: "ありがとうございます", pronunciation: "ah-ree-GAH-toh goh-ZAH-ee-mahs" },
        { english: "Excuse me", local: "すみません", pronunciation: "soo-mee-mah-sen" },
        { english: "Where do locals eat?", local: "地元の人はどこで食べますか？", pronunciation: "jee-moh-toh no hee-toh wah doh-koh deh tah-beh-mahs-kah" },
        { english: "What do you recommend?", local: "何がおすすめですか？", pronunciation: "nah-nee gah oh-soo-soo-meh deh-soo-kah" },
        { english: "The check, please", local: "お会計をお願いします", pronunciation: "oh-kai-keh oh oh-neh-GAH-ee shee-mahs" }
      ];
    } else if (destLower.includes('portugal') || destLower.includes('portuguese') || destLower.includes('lisbon') || destLower.includes('porto')) {
      phrases = [
        { english: "Hello / Good morning", local: "Olá / Bom dia", pronunciation: "oh-LAH / bohm DEE-ah" },
        { english: "Thank you", local: "Obrigado/a", pronunciation: "oh-bree-GAH-doh/dah" },
        { english: "Excuse me", local: "Com licença", pronunciation: "kohm lee-SEN-sah" },
        { english: "Where do locals eat?", local: "Onde comem os locais?", pronunciation: "OHN-deh KOH-men ohs loh-KICE" },
        { english: "What do you recommend?", local: "O que recomenda?", pronunciation: "oh keh reh-koh-MEN-dah" },
        { english: "The check, please", local: "A conta, por favor", pronunciation: "ah KOHN-tah por fah-VOR" }
      ];
    } else {
      // Default universal phrases
      phrases = [
        { english: "Hello / Good morning", local: "Hello / Good morning", pronunciation: "Universal greeting" },
        { english: "Thank you", local: "Thank you", pronunciation: "Shows appreciation" },
        { english: "Excuse me", local: "Excuse me", pronunciation: "Polite attention getter" },
        { english: "Where do locals eat?", local: "Where do locals eat?", pronunciation: "Gets authentic recommendations" },
        { english: "What do you recommend?", local: "What do you recommend?", pronunciation: "Personal recommendations" },
        { english: "I'm sorry, I don't speak [language]", local: "I'm sorry, I don't speak [language]", pronunciation: "Honest communication" }
      ];
    }

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {phrases.map((phrase, index) => (
          <div key={index} className="p-3 bg-muted/50 rounded-lg">
            <p className="font-medium">{phrase.english}</p>
            <p className="text-lg font-semibold text-primary">{phrase.local}</p>
            <p className="text-sm text-muted-foreground italic">{phrase.pronunciation}</p>
          </div>
        ))}
      </div>
    );
  };

  const categories = [...new Set(experiences.map(exp => exp.category))];
  const formData = tripData?.form_data || tripData?.formData || {};
  const destinations = formData.specificDestinations || [];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Local Experiences</h2>
            <p className="text-muted-foreground">
              Authentic local life in {destinations[0] || formData.destination || 'your destination'} - where tourists don't go
            </p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Finding local events...</span>
            </div>
          )}
          {!loading && totalEventsFound > 0 && (
            <Badge variant="secondary">
              {totalEventsFound} live events found
            </Badge>
          )}
        </div>
      </div>

      {/* Essential Local Phrases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            Essential Local Phrases for {destinations[0] || formData.destination || 'Your Destination'}
          </CardTitle>
          <CardDescription>
            Key phrases to connect with locals and show respect for the culture
          </CardDescription>
        </CardHeader>
        <CardContent>
          {getLanguagePhrases(destinations[0] || formData.destination || '')}
        </CardContent>
      </Card>

      {/* Time-Sensitive Opportunities */}
      {experiences.some(exp => exp.startTime) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Happening During Your Visit
            </CardTitle>
            <CardDescription>
              Live events and time-sensitive opportunities matched to your travel dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {experiences
                .filter(exp => exp.startTime)
                .slice(0, 5)
                .map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg">
                    <div>
                      <h4 className="font-medium">{event.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{new Date(event.startTime!).toLocaleDateString()}</span>
                        <span>{new Date(event.startTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>{event.location}</span>
                      </div>
                    </div>
                    {event.url && (
                      <Button 
                        size="sm" 
                        onClick={() => window.open(event.url, '_blank')}
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Local Experiences by Category */}
      {categories.map((category) => {
        const categoryExperiences = experiences.filter(exp => exp.category === category);
        
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {categoryExperiences[0]?.icon || <Music className="h-4 w-4" />}
                {category}
                <Badge className={getCategoryColor(category)}>
                  {categoryExperiences.length} experiences
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryExperiences.map((experience) => (
                  <div key={experience.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{experience.title}</h4>
                          {experience.isRecurring && (
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              Regular
                            </Badge>
                          )}
                          {experience.startTime && (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Live Event
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {experience.location}
                          </span>
                          {experience.startTime ? (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(experience.startTime).toLocaleDateString()} at{' '}
                              {new Date(experience.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {experience.timeOfDay}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            {getPriceIcon(experience.priceLevel)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {(experience.url || experience.searchUrl) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(experience.url || experience.searchUrl, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {experience.url ? 'Event Page' : 'Find It'}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{experience.description}</p>
                    
                    {experience.localPhrase && (
                      <div className="bg-primary/5 p-3 rounded mb-3">
                        <p className="text-sm">
                          <span className="font-medium">Try saying:</span> "{experience.localPhrase}"
                        </p>
                      </div>
                    )}
                    
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-sm">
                        <span className="font-medium text-blue-700">Local Tip:</span> {experience.tip}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Cultural Etiquette Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Cultural Etiquette</CardTitle>
          <CardDescription>
            Respect local customs and make a great impression
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-green-700">Do's</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Learn basic greetings in the local language</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Observe how locals interact and follow suit</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Show genuine interest in their culture and traditions</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Be patient and smile - it's universal</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-red-700">Don'ts</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Don't speak loudly or assume everyone speaks English</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Don't take photos of people without permission</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Don't complain or compare everything to home</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Don't stick to tourist areas only</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocalExperiences;