import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOfflineMode } from '@/hooks/useOfflineMode';
import { useExportFeatures } from '@/hooks/useExportFeatures';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { ErrorFallback, NetworkStatus } from '@/components/ui/error-fallback';
import { MobileOptimizedTabs, MobileTabsList, MobileTabsTrigger, MobileTabsContent } from '@/components/ui/mobile-optimized-tabs';
import { FeedbackCollector } from '@/components/ui/feedback-collector';
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
  Trash2,
  Plane,
  Home,
  Luggage,
  Shield,
  AlertTriangle
} from 'lucide-react';
import FlightAnalysis from './itinerary/FlightAnalysis';
import BudgetBreakdown from './itinerary/BudgetBreakdown';
import PackingList from './itinerary/PackingList';
import LocalExperiences from './itinerary/LocalExperiences';
import SafetyGuide from './itinerary/SafetyGuide';
import EmergencyPlan from './itinerary/EmergencyPlan';
import RouteOptimizer from './itinerary/RouteOptimizer';

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
  const { isOnline, getOfflineTrip, getOfflineItinerary, saveForOffline } = useOfflineMode();
  const { isExporting, generatePDF, generateCalendarFile, shareItinerary } = useExportFeatures();
  const { trackRecommendationClicked, trackExportAction, trackFeatureUsage } = useAnalytics();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [activeTab, setActiveTab] = useState<string>("itinerary");

  // Helper functions to extract data from either new or legacy structure
  const getDays = () => {
    if (!itinerary?.content) {
      console.log('No itinerary content found');
      return [];
    }
    
    console.log('Full itinerary content:', itinerary.content);
    console.log('Daily itinerary:', itinerary.content.dailyItinerary);
    
    // Try new structure first
    if (itinerary.content.dailyItinerary && Array.isArray(itinerary.content.dailyItinerary)) {
      console.log('Using new dailyItinerary structure, found', itinerary.content.dailyItinerary.length, 'days');
      return itinerary.content.dailyItinerary.map(day => ({
        day: day.day,
        title: day.theme || `Day ${day.day}`,
        date: day.date,
        activities: getActivitiesForDay(day)
      }));
    }
    
    // Fallback to legacy structure
    if (itinerary.content.days && Array.isArray(itinerary.content.days)) {
      console.log('Using legacy days structure');
      return itinerary.content.days;
    }
    
    console.log('No valid days data found');
    return [];
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
    if (!itinerary?.content) {
      console.log('No itinerary content for tips');
      return [];
    }
    
    const content = itinerary.content as any; // Use any for dynamic property access
    console.log('Getting tips, content keys:', Object.keys(content));
    console.log('Insider tips:', content.insiderTips);
    console.log('Local insights:', content.localInsights);
    console.log('Cultural insights:', content.culturalInsights);
    console.log('Travel tips:', content.travelTips);
    console.log('Legacy tips:', content.tips);
    
    let allTips: any[] = [];
    
    // Try new structured insider tips first
    if (content.insiderTips && Array.isArray(content.insiderTips)) {
      console.log('Using structured insiderTips:', content.insiderTips);
      allTips.push(...content.insiderTips);
    }
    
    // Check for cultural insights
    if (content.culturalInsights && Array.isArray(content.culturalInsights)) {
      console.log('Using culturalInsights:', content.culturalInsights);
      allTips.push(...content.culturalInsights.map((insight: any) => ({ tip: insight, category: 'cultural' })));
    }
    
    // Check for travel tips
    if (content.travelTips && Array.isArray(content.travelTips)) {
      console.log('Using travelTips:', content.travelTips);
      allTips.push(...content.travelTips.map((tip: any) => ({ tip, category: 'travel' })));
    }
    
    // Fallback to localInsights
    if (content.localInsights && Array.isArray(content.localInsights)) {
      console.log('Using localInsights:', content.localInsights);
      allTips.push(...content.localInsights.map((insight: any) => ({ tip: insight, category: 'local' })));
    }
    
    // Fallback to legacy structure
    if (content.tips && Array.isArray(content.tips)) {
      console.log('Using legacy tips:', content.tips);
      allTips.push(...content.tips.map((tip: any) => ({ tip, category: 'general' })));
    }
    
    console.log('Final tips count:', allTips.length);
    return allTips;
  };

  const getTotalActivities = () => {
    const days = getDays();
    return days.reduce((acc, day) => acc + (day.activities?.length || 0), 0);
  };

  const getFlightData = () => {
    if (!itinerary?.content) {
      console.log('No itinerary content for flight data');
      return null;
    }
    
    const content = itinerary.content as any;
    console.log('Flight analysis:', content.flightAnalysis);
    console.log('Flight recommendations:', content.flightRecommendations);
    console.log('Transportation guide:', content.transportationGuide);
    
    return content.flightAnalysis || content.flightRecommendations || content.transportationGuide || null;
  };

  const getPackingList = () => {
    if (!itinerary?.content) {
      console.log('No itinerary content for packing list');
      return [];
    }
    
    const content = itinerary.content as any;
    console.log('Packing list:', content.packingList);
    console.log('Smart packing guide:', content.smartPackingGuide);
    
    return content.packingList || content.smartPackingGuide || [];
  };

  const getSafetyData = () => {
    if (!itinerary?.content) {
      console.log('No itinerary content for safety data');
      return null;
    }
    
    const content = itinerary.content as any;
    console.log('Safety guide:', content.safetyGuide);
    console.log('Safety information:', content.safetyInformation);
    console.log('Travel safety:', content.travelSafety);
    
    return content.safetyGuide || content.safetyInformation || content.travelSafety || null;
  };

  const getEmergencyData = () => {
    if (!itinerary?.content) {
      console.log('No itinerary content for emergency data');
      return null;
    }
    
    const content = itinerary.content as any;
    console.log('Emergency plan:', content.emergencyPlan);
    console.log('Emergency information:', content.emergencyInformation);
    console.log('Emergency contacts:', content.emergencyContacts);
    
    return content.emergencyPlan || content.emergencyInformation || content.emergencyContacts || null;
  };

  const getAccommodations = () => {
    if (!itinerary?.content) {
      console.log('No itinerary content for accommodations');
      return [];
    }
    
    const content = itinerary.content as any;
    console.log('Accommodation recommendations:', content.accommodationRecommendations);
    console.log('Accommodations:', content.accommodations);
    console.log('Hotels:', content.hotels);
    
    return content.accommodationRecommendations || content.accommodations || content.hotels || [];
  };

  useEffect(() => {
    if (tripId && user) {
      fetchTripAndItinerary();
    }
  }, [tripId, user]);

  const fetchTripAndItinerary = async () => {
    try {
      console.log('Fetching trip and itinerary for tripId:', tripId);
      
      // Try offline first if not online
      if (!isOnline) {
        const offlineTrip = getOfflineTrip(tripId!);
        const offlineItinerary = getOfflineItinerary(tripId!);
        
        if (offlineTrip && offlineItinerary) {
          setTrip(offlineTrip);
          setItinerary(offlineItinerary);
          setLoading(false);
          toast({
            title: "Offline Mode",
            description: "Viewing cached itinerary. Some features may be limited."
          });
          return;
        }
      }
      
      // Check authentication first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }
      
      // Fetch trip details
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
      
      setTrip(tripData);

      // Fetch itinerary
      const itineraryResponse = await supabase
        .from('itineraries')
        .select('*')
        .eq('trip_id', tripId);
      
      if (itineraryResponse.error) {
        throw itineraryResponse.error;
      }
      
      if (!itineraryResponse.data || itineraryResponse.data.length === 0) {
        throw new Error('No itinerary found for this trip');
      }
      
      const itineraryData = {
        ...itineraryResponse.data[0],
        content: itineraryResponse.data[0].content as Itinerary['content']
      };
      
      setItinerary(itineraryData);

      // Debug: Log the structure of the loaded itinerary
      console.log('=== ITINERARY LOADED DEBUG ===');
      console.log('Full itinerary object:', itineraryData);
      console.log('Content keys:', Object.keys(itineraryData.content || {}));
      console.log('Sample of content:', itineraryData.content);
      console.log('Days data test:', getDays());
      console.log('Restaurants test:', getRestaurants());
      console.log('Tips test:', getTips());
      console.log('Accommodations test:', getAccommodations());
      console.log('=== END DEBUG ===');

      // Save for offline use
      if (isOnline) {
        saveForOffline({
          trips: [tripData],
          itineraries: [itineraryData]
        });
      }

    } catch (error: any) {
      console.error('Error fetching data:', error);
      const errorMessage = error?.message || "Failed to load itinerary";
      setError(errorMessage);
      
      if (!isOnline) {
        toast({
          title: "Offline Error",
          description: "No cached data available. Please connect to the internet.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const retryFetch = () => {
    setError(null);
    setLoading(true);
    fetchTripAndItinerary();
  };

  const handleShare = async () => {
    if (trip) {
      trackExportAction(trip.id, 'share');
      await shareItinerary(trip.id, trip.title);
    }
  };

  const handleDownloadPDF = async () => {
    if (trip && itinerary) {
      trackExportAction(trip.id, 'pdf');
      await generatePDF({ trip, itinerary });
    }
  };

  const handleDownloadCalendar = async () => {
    if (trip && itinerary) {
      trackExportAction(trip.id, 'calendar');
      await generateCalendarFile({ trip, itinerary });
    }
  };

  const handleRecommendationClick = (type: 'accommodation' | 'restaurant' | 'activity', name: string, url?: string) => {
    trackRecommendationClicked(type, name, url);
    if (url) {
      window.open(url, '_blank');
    }
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorFallback
          title="Failed to Load Itinerary"
          description={error}
          onRetry={retryFetch}
          type="data"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NetworkStatus />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <LoadingSkeleton type="card" count={1} className="h-32" />
          </div>
          <div className="space-y-6">
            <LoadingSkeleton type="activity" count={4} />
          </div>
        </div>
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

        {/* Enhanced Budget Overview */}
        <div className="mb-8">
          <BudgetBreakdown tripData={trip} existingBudget={itinerary.content?.budgetBreakdown} />
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(value) => {
          console.log('Tab changed to:', value);
          setActiveTab(value);
        }} className="space-y-6">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="itinerary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className="hidden sm:inline">Day-by-Day</span>
            </TabsTrigger>
            <TabsTrigger value="routes" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="hidden sm:inline">Routes</span>
            </TabsTrigger>
            <TabsTrigger value="flights" className="flex items-center gap-1">
              <Plane className="h-3 w-3" />
              <span className="hidden sm:inline">Flights</span>
            </TabsTrigger>
            <TabsTrigger value="accommodations" className="flex items-center gap-1">
              <Home className="h-3 w-3" />
              <span className="hidden sm:inline">Stay</span>
            </TabsTrigger>
            <TabsTrigger value="restaurants" className="flex items-center gap-1">
              <Utensils className="h-3 w-3" />
              <span className="hidden sm:inline">Food</span>
            </TabsTrigger>
            <TabsTrigger value="packing" className="flex items-center gap-1">
              <Luggage className="h-3 w-3" />
              <span className="hidden sm:inline">Packing</span>
            </TabsTrigger>
            <TabsTrigger value="experiences" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span className="hidden sm:inline">Local Life</span>
            </TabsTrigger>
            <TabsTrigger value="safety" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span className="hidden sm:inline">Safety</span>
            </TabsTrigger>
            <TabsTrigger value="emergency" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              <span className="hidden sm:inline">Emergency</span>
            </TabsTrigger>
          </TabsList>

          <MobileTabsContent value="itinerary" className="space-y-6">
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
          </MobileTabsContent>

          <MobileTabsContent value="routes" className="space-y-6">
            <RouteOptimizer tripData={trip} />
          </MobileTabsContent>

          <TabsContent value="flights" className="space-y-6">
            <FlightAnalysis tripData={trip} />
          </TabsContent>

          <TabsContent value="accommodations" className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Where to Stay</h2>
              <p className="text-muted-foreground">Carefully selected accommodation options with live booking links</p>
            </div>
            {getAccommodations().length > 0 ? (
              <div className="space-y-6">
                {/* Primary recommendation first */}
                {getAccommodations()
                  .filter((acc: any) => acc.isPrimary)
                  .map((accommodation: any, index: number) => (
                    <Card key={`primary-${index}`} className="border-2 border-primary">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <MapPin className="h-5 w-5 text-primary" />
                              {accommodation.name}
                              <Badge variant="default" className="ml-2">Top Pick</Badge>
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
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="outline" className="text-xs">
                                🚶 Walkable
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                🛡️ Safe Area
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                📍 Central
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Price Range</h4>
                            <p className="text-sm font-medium text-green-600">{accommodation.priceRange}</p>
                            <p className="text-xs text-muted-foreground mt-1">Compare prices below</p>
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
                        
                        {/* Live Booking Links */}
                        <div>
                          <h4 className="font-medium mb-3">Book Now - Compare Prices</h4>
                          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <Button variant="outline" className="h-auto p-3" asChild>
                              <a 
                                href={`https://www.booking.com/search.html?ss=${encodeURIComponent(accommodation.name + ' ' + accommodation.address)}&checkin=${trip?.form_data?.startDate || ''}&checkout=${trip?.form_data?.endDate || ''}&group_adults=${trip?.form_data?.groupSize || 2}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <div className="text-center">
                                  <div className="text-blue-600 font-semibold">Booking.com</div>
                                  <div className="text-xs text-muted-foreground">Free cancellation</div>
                                </div>
                              </a>
                            </Button>
                            
                            <Button variant="outline" className="h-auto p-3" asChild>
                              <a 
                                href={`https://www.airbnb.com/s/${encodeURIComponent(accommodation.address)}/homes?adults=${trip?.form_data?.groupSize || 2}&checkin=${trip?.form_data?.startDate || ''}&checkout=${trip?.form_data?.endDate || ''}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <div className="text-center">
                                  <div className="text-red-500 font-semibold">Airbnb</div>
                                  <div className="text-xs text-muted-foreground">Unique stays</div>
                                </div>
                              </a>
                            </Button>
                            
                            <Button variant="outline" className="h-auto p-3" asChild>
                              <a 
                                href={`https://www.hotels.com/search.do?q-destination=${encodeURIComponent(accommodation.address)}&q-check-in=${trip?.form_data?.startDate || ''}&q-check-out=${trip?.form_data?.endDate || ''}&q-rooms=1&q-room-0-adults=${trip?.form_data?.groupSize || 2}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <div className="text-center">
                                  <div className="text-purple-600 font-semibold">Hotels.com</div>
                                  <div className="text-xs text-muted-foreground">Earn rewards</div>
                                </div>
                              </a>
                            </Button>
                            
                            <Button variant="outline" className="h-auto p-3" asChild>
                              <a 
                                href={`https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(accommodation.address)}&startDate=${trip?.form_data?.startDate || ''}&endDate=${trip?.form_data?.endDate || ''}&rooms=1&adults=${trip?.form_data?.groupSize || 2}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <div className="text-center">
                                  <div className="text-orange-600 font-semibold">Expedia</div>
                                  <div className="text-xs text-muted-foreground">Package deals</div>
                                </div>
                              </a>
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            💡 Tip: Check all platforms - prices can vary by $50+ per night
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                }
                
                {/* Alternative options */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Alternative Options</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {getAccommodations()
                      .filter((acc: any) => !acc.isPrimary)
                      .map((accommodation: any, index: number) => (
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
                            
                            <div className="grid grid-cols-2 gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <a 
                                  href={`https://www.booking.com/search.html?ss=${encodeURIComponent(accommodation.name)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Booking.com
                                </a>
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <a 
                                  href={`https://www.airbnb.com/s/${encodeURIComponent(accommodation.address)}/homes`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Airbnb
                                </a>
                              </Button>
                            </div>
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
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Accommodation Recommendations Found</h3>
                  <p className="text-muted-foreground mb-4">
                    It looks like accommodation recommendations weren't generated for this itinerary.
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
              <h2 className="text-2xl font-bold">Restaurant Guide</h2>
              <p className="text-muted-foreground">Curated dining recommendations with dietary options and booking links</p>
            </div>

            {/* Dietary Restrictions Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-primary" />
                  Dietary Preferences & Safety Guide
                </CardTitle>
                <CardDescription>
                  Filter restaurants and get local dining tips for your dietary needs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg border">
                    <h4 className="font-medium text-green-800 mb-2">🌱 Vegetarian</h4>
                    <p className="text-sm text-green-700 mb-2">Key phrases:</p>
                    <ul className="text-xs text-green-600 space-y-1">
                      <li>"No meat, please"</li>
                      <li>"I don't eat meat or fish"</li>
                      <li>"Vegetarian options?"</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border">
                    <h4 className="font-medium text-blue-800 mb-2">🌿 Vegan</h4>
                    <p className="text-sm text-blue-700 mb-2">Key phrases:</p>
                    <ul className="text-xs text-blue-600 space-y-1">
                      <li>"No animal products"</li>
                      <li>"No dairy, eggs, meat"</li>
                      <li>"Plant-based only"</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg border">
                    <h4 className="font-medium text-orange-800 mb-2">🌾 Gluten-Free</h4>
                    <p className="text-sm text-orange-700 mb-2">Key phrases:</p>
                    <ul className="text-xs text-orange-600 space-y-1">
                      <li>"No wheat or gluten"</li>
                      <li>"Celiac disease"</li>
                      <li>"Gluten allergy"</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border">
                    <h4 className="font-medium text-purple-800 mb-2">🥩 Halal/Kosher</h4>
                    <p className="text-sm text-purple-700 mb-2">Key phrases:</p>
                    <ul className="text-xs text-purple-600 space-y-1">
                      <li>"Halal food only"</li>
                      <li>"Kosher restaurant?"</li>
                      <li>"Religious dietary laws"</li>
                    </ul>
                  </div>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">⚠️ Important Safety Tips</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Always carry a dietary restriction card written in the local language</li>
                    <li>• Ask about ingredients in sauces and cooking oils</li>
                    <li>• Learn the word for "allergy" in the local language - it's taken more seriously</li>
                    <li>• Consider bringing safe snacks as backup options</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
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
                              
                              {/* Multiple booking options */}
                              <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" size="sm" asChild>
                                  <a 
                                    href={`https://www.opentable.com/s/?q=${encodeURIComponent(restaurant.name + ' ' + (restaurant.location || ''))}&covers=${trip?.form_data?.groupSize || 2}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    OpenTable
                                  </a>
                                </Button>
                                <Button variant="outline" size="sm" asChild>
                                  <a 
                                    href={`https://www.yelp.com/search?find_desc=${encodeURIComponent(restaurant.name)}&find_loc=${encodeURIComponent(restaurant.location || trip?.form_data?.destination || '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Reviews
                                  </a>
                                </Button>
                              </div>
                              
                              <Button size="sm" className="w-full" asChild>
                                <a 
                                  href={`https://www.google.com/maps/search/${encodeURIComponent(restaurant.name + ' ' + (restaurant.location || trip?.form_data?.destination || ''))}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <MapPin className="h-3 w-3 mr-1" />
                                  Get Directions
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
                
                {/* Local Dining Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle>Local Dining Etiquette & Tips</CardTitle>
                    <CardDescription>
                      Cultural dining customs to enhance your experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-medium text-green-700">Do's</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Make reservations for dinner, especially weekends</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Try lunch menus - often same quality, lower prices</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Ask locals for their favorite neighborhood spots</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Learn basic food words in the local language</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-medium text-red-700">Don'ts</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Don't eat at restaurants with no locals inside</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Don't order the same cuisine as your home country</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Don't assume tipping customs are the same as home</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Don't be afraid to ask about ingredients</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Utensils className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Restaurant Recommendations Found</h3>
                  <p className="text-muted-foreground mb-4">
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

          <TabsContent value="packing" className="space-y-6">
            <PackingList tripData={trip} />
          </TabsContent>

          <TabsContent value="experiences" className="space-y-6">
            <LocalExperiences tripData={trip} />
          </TabsContent>

          <TabsContent value="safety" className="space-y-6">
            <SafetyGuide tripData={trip} />
          </TabsContent>

          <TabsContent value="emergency" className="space-y-6">
            <EmergencyPlan tripData={trip} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ItineraryView;