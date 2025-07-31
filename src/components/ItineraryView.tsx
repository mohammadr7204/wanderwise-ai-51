import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
  Users,
  Edit,
  Trash2
} from 'lucide-react';

interface Trip {
  id: string;
  title: string;
  tier: string;
  status: string;
  form_data: any;
  price_paid: number;
}

// Updated interfaces to match actual data structure
interface DailyActivity {
  time: string;
  activity: string;
  venue?: string;
  cost?: string;
  duration?: string;
  bookingInfo?: string;
  bookingUrl?: string;
  weatherBackup?: string;
}

interface DailyItineraryItem {
  day: number;
  date?: string;
  theme?: string;
  morning?: DailyActivity;
  afternoon?: DailyActivity;
  evening?: DailyActivity;
}

interface Restaurant {
  name: string;
  cuisine: string;
  priceLevel?: string;
  priceRange?: string;
  rating: number | string;
  location?: string;
  address?: string;
  specialties?: string[];
  mealType?: string;
  bookingUrl?: string;
}

interface BudgetBreakdown {
  accommodation?: string;
  tripTotal?: string;
  dailyBudget?: string;
  activities?: string;
  meals?: string;
}

interface InsiderTip {
  category: string;
  tip: string;
  description: string;
}

interface Accommodation {
  name: string;
  type: string;
  address: string;
  priceRange: string;
  amenities: string[];
  whyPerfect: string;
  bookingTip: string;
  bookingUrl?: string;
  rating?: string;
  isPrimary?: boolean;
}

interface NewItineraryContent {
  destination?: string;
  destinationReason?: string;
  dailyItinerary?: DailyItineraryItem[];
  restaurantGuide?: Restaurant[];
  dailyRestaurantRecommendations?: Array<{
    day: number;
    breakfast?: Restaurant[];
    lunch?: Restaurant[];
    dinner?: Restaurant[];
  }>;
  localInsights?: string[];
  insiderTips?: InsiderTip[];
  accommodationRecommendations?: Accommodation[];
  budgetBreakdown?: BudgetBreakdown;
}

interface LegacyItineraryContent {
  days?: Array<{
    day: number;
    title: string;
    activities: Array<{
      time: string;
      title: string;
      description: string;
    }>;
  }>;
  restaurants?: Array<{
    name: string;
    cuisine: string;
    priceRange: string;
    rating: number;
  }>;
  tips?: string[];
}

interface Itinerary {
  id: string;
  content: NewItineraryContent & LegacyItineraryContent;
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
  const [activeTab, setActiveTab] = useState<string>("itinerary");

  // Helper functions to extract data from either new or legacy structure
  const getDays = () => {
    if (!itinerary?.content) return [];
    
    // Try new structure first
    if (itinerary.content.dailyItinerary) {
      return itinerary.content.dailyItinerary.map(day => ({
        day: day.day,
        title: day.theme || `Day ${day.day}`,
        date: day.date,
        activities: getActivitiesForDay(day)
      }));
    }
    
    // Fallback to legacy structure
    return itinerary.content.days || [];
  };

  const getActivitiesForDay = (day: DailyItineraryItem) => {
    const activities = [];
    
    if (day.morning) {
      activities.push({
        time: day.morning.time,
        title: day.morning.activity,
        description: [
          day.morning.venue && `📍 ${day.morning.venue}`,
          day.morning.cost && `💰 ${day.morning.cost}`,
          day.morning.duration && `⏱️ ${day.morning.duration}`,
          day.morning.bookingInfo && `🔗 ${day.morning.bookingInfo}`
        ].filter(Boolean).join(' • '),
        venue: day.morning.venue,
        cost: day.morning.cost,
        duration: day.morning.duration,
        bookingInfo: day.morning.bookingInfo
      });
    }
    
    if (day.afternoon) {
      activities.push({
        time: day.afternoon.time,
        title: day.afternoon.activity,
        description: [
          day.afternoon.venue && `📍 ${day.afternoon.venue}`,
          day.afternoon.cost && `💰 ${day.afternoon.cost}`,
          day.afternoon.duration && `⏱️ ${day.afternoon.duration}`,
          day.afternoon.bookingInfo && `🔗 ${day.afternoon.bookingInfo}`
        ].filter(Boolean).join(' • '),
        venue: day.afternoon.venue,
        cost: day.afternoon.cost,
        duration: day.afternoon.duration,
        bookingInfo: day.afternoon.bookingInfo
      });
    }
    
    if (day.evening) {
      activities.push({
        time: day.evening.time,
        title: day.evening.activity,
        description: [
          day.evening.venue && `📍 ${day.evening.venue}`,
          day.evening.cost && `💰 ${day.evening.cost}`,
          day.evening.duration && `⏱️ ${day.evening.duration}`,
          day.evening.bookingInfo && `🔗 ${day.evening.bookingInfo}`
        ].filter(Boolean).join(' • '),
        venue: day.evening.venue,
        cost: day.evening.cost,
        duration: day.evening.duration,
        bookingInfo: day.evening.bookingInfo
      });
    }
    
    return activities;
  };

  const getRestaurants = () => {
    if (!itinerary?.content) return [];
    
    console.log('Getting restaurants, content:', itinerary.content);
    console.log('Restaurant guide:', itinerary.content.restaurantGuide);
    console.log('Daily restaurant recommendations:', itinerary.content.dailyRestaurantRecommendations);
    console.log('Legacy restaurants:', itinerary.content.restaurants);
    
    let allRestaurants: any[] = [];
    
    // First check the new dailyRestaurantRecommendations structure (3 per meal per day)
    if (itinerary.content.dailyRestaurantRecommendations && Array.isArray(itinerary.content.dailyRestaurantRecommendations)) {
      console.log('Processing daily restaurant recommendations...');
      itinerary.content.dailyRestaurantRecommendations.forEach((dayRecs: any) => {
        if (dayRecs.breakfast) allRestaurants.push(...dayRecs.breakfast.map((r: any) => ({ ...r, mealType: 'breakfast' })));
        if (dayRecs.lunch) allRestaurants.push(...dayRecs.lunch.map((r: any) => ({ ...r, mealType: 'lunch' })));
        if (dayRecs.dinner) allRestaurants.push(...dayRecs.dinner.map((r: any) => ({ ...r, mealType: 'dinner' })));
      });
    }
    
    // Then check the existing restaurantGuide
    if (itinerary.content.restaurantGuide && Array.isArray(itinerary.content.restaurantGuide)) {
      const mappedRestaurants = itinerary.content.restaurantGuide.map(restaurant => ({
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        priceRange: restaurant.priceLevel || restaurant.priceRange || 'N/A',
        rating: restaurant.rating,
        location: restaurant.address || restaurant.location,
        specialties: restaurant.specialties,
        mealType: restaurant.mealType || 'general'
      }));
      allRestaurants.push(...mappedRestaurants);
      console.log('Mapped restaurants from restaurantGuide:', mappedRestaurants);
    }
    
    // Fallback to legacy structure
    if (itinerary.content.restaurants && Array.isArray(itinerary.content.restaurants)) {
      console.log('Using legacy restaurants:', itinerary.content.restaurants);
      allRestaurants.push(...itinerary.content.restaurants.map((r: any) => ({ ...r, mealType: 'general' })));
    }
    
    // Remove duplicates based on name
    const uniqueRestaurants = allRestaurants.filter((restaurant, index, self) => 
      index === self.findIndex(r => r.name === restaurant.name)
    );
    
    console.log('Final unique restaurants count:', uniqueRestaurants.length);
    return uniqueRestaurants;
  };

  const getTips = () => {
    if (!itinerary?.content) return [];
    
    console.log('Getting tips, content:', itinerary.content);
    console.log('Insider tips:', itinerary.content.insiderTips);
    console.log('Local insights:', itinerary.content.localInsights);
    console.log('Legacy tips:', itinerary.content.tips);
    
    // Try new structured insider tips first
    if (itinerary.content.insiderTips && Array.isArray(itinerary.content.insiderTips)) {
      console.log('Using structured insiderTips:', itinerary.content.insiderTips);
      return itinerary.content.insiderTips;
    }
    
    // Fallback to localInsights
    if (itinerary.content.localInsights && Array.isArray(itinerary.content.localInsights)) {
      console.log('Using localInsights:', itinerary.content.localInsights);
      return itinerary.content.localInsights.map(insight => ({ tip: insight, isLegacy: true }));
    }
    
    // Fallback to legacy structure
    if (itinerary.content.tips && Array.isArray(itinerary.content.tips)) {
      console.log('Using legacy tips:', itinerary.content.tips);
      return itinerary.content.tips.map(tip => ({ tip, isLegacy: true }));
    }
    
    console.log('No tips data found');
    return [];
  };

  const getTotalActivities = () => {
    const days = getDays();
    return days.reduce((acc, day) => acc + (day.activities?.length || 0), 0);
  };

  useEffect(() => {
    if (tripId && user) {
      fetchTripAndItinerary();
    }
  }, [tripId, user]);

  const fetchTripAndItinerary = async () => {
    try {
      console.log('Fetching trip and itinerary for tripId:', tripId);
      console.log('Current user:', user?.id);
      console.log('User authenticated:', !!user);
      
      // Check authentication first
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', !!session);
      
      // Fetch trip details
      console.log('Fetching trip data...');
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .eq('user_id', user?.id)
        .single();

      if (tripError) {
        console.error('Trip fetch error:', tripError);
        throw tripError;
      }
      
      console.log('Trip data fetched successfully:', tripData);
      setTrip(tripData);

      // Fetch itinerary with detailed error logging
      console.log('Fetching itinerary data...');
      const itineraryResponse = await supabase
        .from('itineraries')
        .select('*')
        .eq('trip_id', tripId);
        
      console.log('Itinerary response:', itineraryResponse);
      
      if (itineraryResponse.error) {
        console.error('Itinerary fetch error details:', {
          message: itineraryResponse.error.message,
          details: itineraryResponse.error.details,
          hint: itineraryResponse.error.hint,
          code: itineraryResponse.error.code
        });
        throw itineraryResponse.error;
      }
      
      if (!itineraryResponse.data || itineraryResponse.data.length === 0) {
        console.log('No itinerary found for trip:', tripId);
        throw new Error('No itinerary found for this trip');
      }
      
      console.log('Itinerary data fetched successfully:', itineraryResponse.data[0]);
      console.log('Itinerary content structure:', JSON.stringify(itineraryResponse.data[0].content, null, 2));
      console.log('Content type:', typeof itineraryResponse.data[0].content);
      console.log('Content keys:', Object.keys(itineraryResponse.data[0].content || {}));
      
      setItinerary({
        ...itineraryResponse.data[0],
        content: itineraryResponse.data[0].content as Itinerary['content']
      });

    } catch (error: any) {
      console.error('Detailed error information:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        status: error.status,
        statusText: error.statusText,
        fullError: error
      });
      
      let errorMessage = "Failed to load itinerary";
      if (error.code === 'PGRST116') {
        errorMessage = "No itinerary found for this trip";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
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

  const handleDeleteTrip = async () => {
    try {
      // Delete itinerary first
      const { error: itineraryError } = await supabase
        .from('itineraries')
        .delete()
        .eq('trip_id', tripId);

      if (itineraryError) throw itineraryError;

      // Delete trip
      const { error: tripError } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId)
        .eq('user_id', user?.id);

      if (tripError) throw tripError;

      toast({
        title: "Trip Deleted",
        description: "Your trip and itinerary have been successfully deleted.",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast({
        title: "Error",
        description: "Failed to delete trip. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditTrip = () => {
    // Navigate to edit mode - we'll implement this in CreateTrip component
    navigate(`/create-trip?edit=${tripId}`);
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
              <Button variant="outline" size="sm" onClick={handleEditTrip}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Trip
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Trip</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{trip.title}" and its itinerary? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteTrip}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete Trip
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
        {/* Destination Header */}
        {itinerary.content?.destination && (
          <div className="mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">{itinerary.content.destination}</h2>
                </div>
                {itinerary.content.destinationReason && (
                  <p className="text-gray-600">{itinerary.content.destinationReason}</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trip Overview */}
        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">Duration</span>
              </div>
              <p className="text-2xl font-bold">{getDays().length} Days</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-medium">Group Size</span>
              </div>
              <p className="text-2xl font-bold">{trip.form_data?.groupSize || 'N/A'}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="h-4 w-4 text-primary" />
                <span className="font-medium">Activities</span>
              </div>
              <p className="text-2xl font-bold">{getTotalActivities()}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Utensils className="h-4 w-4 text-primary" />
                <span className="font-medium">Restaurants</span>
              </div>
              <p className="text-2xl font-bold">{getRestaurants().length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Budget Breakdown */}
        {itinerary.content?.budgetBreakdown && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Budget Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {itinerary.content.budgetBreakdown.accommodation && (
                    <div>
                      <p className="text-sm text-gray-600">Accommodation</p>
                      <p className="font-semibold">{itinerary.content.budgetBreakdown.accommodation}</p>
                    </div>
                  )}
                  {itinerary.content.budgetBreakdown.tripTotal && (
                    <div>
                      <p className="text-sm text-gray-600">Trip Total</p>
                      <p className="font-semibold">{itinerary.content.budgetBreakdown.tripTotal}</p>
                    </div>
                  )}
                  {itinerary.content.budgetBreakdown.dailyBudget && (
                    <div>
                      <p className="text-sm text-gray-600">Daily Budget</p>
                      <p className="font-semibold">{itinerary.content.budgetBreakdown.dailyBudget}</p>
                    </div>
                  )}
                  {itinerary.content.budgetBreakdown.activities && (
                    <div>
                      <p className="text-sm text-gray-600">Activities</p>
                      <p className="font-semibold">{itinerary.content.budgetBreakdown.activities}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(value) => {
          console.log('Tab changed to:', value);
          setActiveTab(value);
        }} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="itinerary">Day-by-Day</TabsTrigger>
            <TabsTrigger value="accommodations">Where to Stay</TabsTrigger>
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
                    {getDays().map((day) => (
                      <Button
                        key={day.day}
                        variant={activeDay === day.day ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveDay(day.day)}
                      >
                        <div className="text-left">
                          <div className="font-medium">Day {day.day}</div>
                          {day.date && <div className="text-xs opacity-70">{day.date}</div>}
                        </div>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Day Content */}
              <div className="lg:col-span-3">
                {getDays().map((day) => (
                  activeDay === day.day && (
                    <Card key={day.day}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          {day.title}
                        </CardTitle>
                        {day.date && (
                          <CardDescription className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {day.date} • {day.activities?.length || 0} activities planned
                          </CardDescription>
                        )}
                        {!day.date && (
                          <CardDescription>
                            {day.activities?.length || 0} activities planned
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {day.activities?.map((activity, index) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex gap-4">
                              <div className="flex items-center gap-2 min-w-20">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium">{activity.time}</span>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium mb-1">{activity.title}</h4>
                                <p className="text-gray-600 text-sm mb-3">{activity.description}</p>
                                
                                {/* Enhanced activity details for new structure */}
                                {activity.venue && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{activity.venue}</span>
                                  </div>
                                )}
                                
                                <div className="flex flex-wrap gap-4 text-sm">
                                  {activity.cost && (
                                    <span className="text-green-600 font-medium">{activity.cost}</span>
                                  )}
                                  {activity.duration && (
                                    <span className="text-blue-600">{activity.duration}</span>
                                  )}
                                </div>
                                
                                {(activity.bookingInfo || activity.bookingUrl) && (
                                  <Button 
                                    variant="link" 
                                    size="sm" 
                                    className="h-auto p-0 mt-2"
                                    asChild
                                  >
                                    <a 
                                      href={activity.bookingUrl || (activity.bookingInfo?.includes('http') ? activity.bookingInfo : `https://www.google.com/search?q=${encodeURIComponent(activity.activity + ' ' + (activity.venue || ''))}`)} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                    >
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      {activity.bookingUrl || activity.bookingInfo?.includes('http') ? 'Book Online' : activity.bookingInfo}
                                    </a>
                                  </Button>
                                )}
                              </div>
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

          <TabsContent value="accommodations" className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Where to Stay</h2>
              <p className="text-gray-600">Carefully selected accommodation options for your trip</p>
            </div>
            {itinerary.content?.accommodationRecommendations && itinerary.content.accommodationRecommendations.length > 0 ? (
              <div className="space-y-6">
                {/* Primary recommendation first */}
                {itinerary.content.accommodationRecommendations
                  .filter(acc => acc.isPrimary)
                  .map((accommodation, index) => (
                    <Card key={`primary-${index}`} className="border-2 border-primary">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <MapPin className="h-5 w-5 text-primary" />
                              {accommodation.name}
                              <Badge variant="default" className="ml-2">Recommended</Badge>
                            </CardTitle>
                            <CardDescription>{accommodation.type}</CardDescription>
                          </div>
                          {accommodation.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="font-medium">{accommodation.rating}</span>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Location</h4>
                            <p className="text-sm text-muted-foreground">{accommodation.address}</p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Price Range</h4>
                            <p className="text-sm font-medium text-green-600">{accommodation.priceRange}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Amenities</h4>
                          <div className="flex flex-wrap gap-2">
                            {accommodation.amenities.map((amenity, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Why Perfect for You</h4>
                          <p className="text-sm text-muted-foreground">{accommodation.whyPerfect}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Booking Tip</h4>
                          <p className="text-sm text-muted-foreground">{accommodation.bookingTip}</p>
                        </div>
                        
                        <Button className="w-full" asChild>
                          <a 
                            href={accommodation.bookingUrl || `https://www.booking.com/search.html?ss=${encodeURIComponent(accommodation.name + ' ' + accommodation.address)}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Book Now
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                }
                
                {/* Alternative options */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Alternative Options</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {itinerary.content.accommodationRecommendations
                      .filter(acc => !acc.isPrimary)
                      .map((accommodation, index) => (
                        <Card key={`alt-${index}`}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="flex items-center gap-2">
                                  <MapPin className="h-5 w-5 text-primary" />
                                  {accommodation.name}
                                </CardTitle>
                                <CardDescription>{accommodation.type}</CardDescription>
                              </div>
                              {accommodation.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                  <span className="font-medium">{accommodation.rating}</span>
                                </div>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Price:</span>
                              <span className="font-medium text-green-600">{accommodation.priceRange}</span>
                            </div>
                            
                            <div>
                              <span className="text-sm text-muted-foreground">Amenities: </span>
                              <span className="text-sm">{accommodation.amenities.join(', ')}</span>
                            </div>
                            
                            <p className="text-sm text-muted-foreground">{accommodation.whyPerfect}</p>
                            
                            <Button variant="outline" className="w-full" asChild>
                              <a 
                                href={accommodation.bookingUrl || `https://www.booking.com/search.html?ss=${encodeURIComponent(accommodation.name + ' ' + accommodation.address)}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Details
                              </a>
                            </Button>
                          </CardContent>
                        </Card>
                      ))
                    }
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Accommodation Recommendations Found</h3>
                  <p className="text-gray-600 mb-4">
                    It looks like accommodation recommendations weren't generated for this itinerary. 
                    You can request a revision to add accommodation suggestions.
                  </p>
                  {canRequestRevision && (
                    <Button variant="outline" onClick={handleRequestRevision}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Request Accommodation Recommendations
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="restaurants" className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Restaurant Recommendations</h2>
              <p className="text-gray-600">Discover amazing dining options for your trip</p>
            </div>
            {getRestaurants().length > 0 ? (
              <div className="space-y-8">
                {/* Organize restaurants by meal type if available */}
                {['breakfast', 'lunch', 'dinner', 'general'].map(mealType => {
                  const mealRestaurants = getRestaurants().filter(r => r.mealType === mealType);
                  if (mealRestaurants.length === 0) return null;
                  
                  return (
                    <div key={mealType} className="space-y-4">
                      <h3 className="text-xl font-semibold capitalize">
                        {mealType === 'general' ? 'Additional Recommendations' : `${mealType} Options`}
                      </h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mealRestaurants.map((restaurant, index) => (
                          <Card key={`${mealType}-${index}`}>
                            <CardContent className="pt-6">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium">{restaurant.name}</h4>
                                <Badge variant="outline">{restaurant.priceRange || restaurant.priceLevel}</Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{restaurant.cuisine}</p>
                              {(restaurant.location || restaurant.address) && (
                                <div className="flex items-center gap-1 mb-2">
                                  <MapPin className="h-3 w-3 text-gray-500" />
                                  <span className="text-xs text-gray-500">{restaurant.location || restaurant.address}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1 mb-3">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className="text-sm font-medium">{restaurant.rating}</span>
                              </div>
                              {restaurant.specialties && restaurant.specialties.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs text-gray-500 mb-1">Specialties:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {restaurant.specialties.slice(0, 3).map((specialty, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {specialty}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <Button variant="outline" size="sm" className="w-full" asChild>
                                <a 
                                  href={restaurant.bookingUrl || `https://www.google.com/search?q=${encodeURIComponent(restaurant.name + ' restaurant ' + (restaurant.location || restaurant.address || ''))}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-3 w-3 mr-2" />
                                  View Details
                                </a>
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                {/* If no meal types found, show all restaurants in one grid */}
                {getRestaurants().every(r => !r.mealType || r.mealType === 'general') && (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getRestaurants().map((restaurant, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{restaurant.name}</h4>
                            <Badge variant="outline">{restaurant.priceRange || restaurant.priceLevel}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{restaurant.cuisine}</p>
                          {(restaurant.location || restaurant.address) && (
                            <div className="flex items-center gap-1 mb-2">
                              <MapPin className="h-3 w-3 text-gray-500" />
                              <span className="text-xs text-gray-500">{restaurant.location || restaurant.address}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 mb-3">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">{restaurant.rating}</span>
                          </div>
                          {restaurant.specialties && restaurant.specialties.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-500 mb-1">Specialties:</p>
                              <div className="flex flex-wrap gap-1">
                                {restaurant.specialties.slice(0, 3).map((specialty, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {specialty}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          <Button variant="outline" size="sm" className="w-full" asChild>
                            <a 
                              href={restaurant.bookingUrl || `https://www.google.com/search?q=${encodeURIComponent(restaurant.name + ' restaurant ' + (restaurant.location || restaurant.address || ''))}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3 w-3 mr-2" />
                              View Details
                            </a>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Restaurant Recommendations Found</h3>
                  <p className="text-gray-600 mb-4">
                    It looks like restaurant recommendations weren't generated for this itinerary. 
                    You can request a revision to add restaurant suggestions.
                  </p>
                  {canRequestRevision && (
                    <Button variant="outline" onClick={handleRequestRevision}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Request Restaurant Recommendations
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tips" className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Insider Tips & Local Insights</h2>
              <p className="text-gray-600">Essential local knowledge for your journey</p>
            </div>
            {getTips().length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Insider Tips & Local Insights
                  </CardTitle>
                  <CardDescription>
                    Local insights to make your trip unforgettable
                  </CardDescription>
                </CardHeader>
                 <CardContent>
                   <div className="space-y-4">
                     {getTips().map((tip, index) => (
                       <div key={index} className="p-6 border-l-4 border-l-primary bg-muted/50 rounded-lg">
                         {tip.category ? (
                           // New structured format
                           <div className="space-y-2">
                             <div className="flex items-center gap-2">
                               <Badge variant="secondary" className="text-xs">
                                 {tip.category}
                               </Badge>
                             </div>
                             <h4 className="font-semibold text-foreground">{tip.tip}</h4>
                             <p className="text-sm text-muted-foreground">{tip.description}</p>
                           </div>
                         ) : (
                           // Legacy format
                           <div className="flex gap-3">
                             <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                               {index + 1}
                             </div>
                             <p className="text-gray-800">{tip.tip || tip}</p>
                           </div>
                         )}
                       </div>
                     ))}
                   </div>
                 </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Insider Tips Found</h3>
                  <p className="text-gray-600 mb-4">
                    It looks like local insights weren't generated for this itinerary. 
                    You can request a revision to add insider tips and local recommendations.
                  </p>
                  {canRequestRevision && (
                    <Button variant="outline" onClick={handleRequestRevision}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Request Local Insights
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ItineraryView;