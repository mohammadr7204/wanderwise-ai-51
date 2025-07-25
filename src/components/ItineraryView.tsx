import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  MapPin, 
  Clock, 
  Star, 
  Utensils,
  Camera,
  RefreshCw,
  ExternalLink,
  Calendar,
  Users
} from 'lucide-react';

interface Trip {
  id: string;
  title: string;
  tier: string;
  status: string;
  form_data: any;
  price_paid: number;
}

interface Itinerary {
  id: string;
  content: {
    days: Array<{
      day: number;
      title: string;
      activities: Array<{
        time: string;
        title: string;
        description: string;
      }>;
    }>;
    restaurants: Array<{
      name: string;
      cuisine: string;
      priceRange: string;
      rating: number;
    }>;
    tips: string[];
  };
  generated_at: string;
}

const ItineraryView = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);

  useEffect(() => {
    if (tripId && user) {
      fetchTripAndItinerary();
    }
  }, [tripId, user]);

  const fetchTripAndItinerary = async () => {
    try {
      // Fetch trip details
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .eq('user_id', user?.id)
        .single();

      if (tripError) throw tripError;
      setTrip(tripData);

      // Fetch itinerary
      const { data: itineraryData, error: itineraryError } = await supabase
        .from('itineraries')
        .select('*')
        .eq('trip_id', tripId)
        .single();

      if (itineraryError) throw itineraryError;
      setItinerary({
        ...itineraryData,
        content: itineraryData.content as Itinerary['content']
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load itinerary",
        variant: "destructive"
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${trip?.title} Itinerary`,
          text: `Check out my travel itinerary for ${trip?.title}!`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Itinerary link copied to clipboard!"
      });
    }
  };

  const handleDownloadPDF = () => {
    toast({
      title: "PDF Download",
      description: "PDF download functionality coming soon!"
    });
  };

  const handleRequestRevision = () => {
    toast({
      title: "Revision Request",
      description: "Revision request functionality coming soon!"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading your itinerary...</div>
      </div>
    );
  }

  if (!trip || !itinerary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Itinerary not found</div>
      </div>
    );
  }

  const canRequestRevision = trip.tier === 'premium' || trip.tier === 'luxury';
  const hasUnlimitedRevisions = trip.tier === 'luxury';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
              <div>
                <h1 className="text-lg font-semibold">{trip.title}</h1>
                <Badge variant="secondary" className="text-xs">
                  {trip.tier} Plan
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              {canRequestRevision && (
                <Button variant="outline" size="sm" onClick={handleRequestRevision}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {hasUnlimitedRevisions ? 'Request Revision' : 'Request Revision (1 left)'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trip Overview */}
        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">Duration</span>
              </div>
              <p className="text-2xl font-bold">{itinerary.content.days.length} Days</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-medium">Group Size</span>
              </div>
              <p className="text-2xl font-bold">{trip.form_data.groupSize}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="h-4 w-4 text-primary" />
                <span className="font-medium">Activities</span>
              </div>
              <p className="text-2xl font-bold">
                {itinerary.content.days.reduce((acc, day) => acc + day.activities.length, 0)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Utensils className="h-4 w-4 text-primary" />
                <span className="font-medium">Restaurants</span>
              </div>
              <p className="text-2xl font-bold">{itinerary.content.restaurants.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value="itinerary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="itinerary">Day-by-Day Itinerary</TabsTrigger>
            <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
            <TabsTrigger value="tips">Insider Tips</TabsTrigger>
          </TabsList>

          <TabsContent value="itinerary" className="space-y-6">
            <div className="grid lg:grid-cols-4 gap-6">
              {/* Day Navigation */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle className="text-sm">Days</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {itinerary.content.days.map((day) => (
                      <Button
                        key={day.day}
                        variant={activeDay === day.day ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveDay(day.day)}
                      >
                        Day {day.day}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Day Content */}
              <div className="lg:col-span-3">
                {itinerary.content.days.map((day) => (
                  activeDay === day.day && (
                    <Card key={day.day}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          {day.title}
                        </CardTitle>
                        <CardDescription>
                          {day.activities.length} activities planned
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {day.activities.map((activity, index) => (
                          <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 min-w-20">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium">{activity.time}</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium mb-1">{activity.title}</h4>
                              <p className="text-gray-600 text-sm">{activity.description}</p>
                              <Button variant="link" size="sm" className="h-auto p-0 mt-2">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Book now
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="restaurants" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {itinerary.content.restaurants.map((restaurant, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{restaurant.name}</h4>
                      <Badge variant="outline">{restaurant.priceRange}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{restaurant.cuisine}</p>
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{restaurant.rating}</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tips" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Insider Tips & Recommendations
                </CardTitle>
                <CardDescription>
                  Local insights to make your trip unforgettable
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {itinerary.content.tips.map((tip, index) => (
                    <div key={index} className="flex gap-3 p-4 bg-blue-50 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-gray-800">{tip}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ItineraryView;