import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Compass, Plus, MapPin, Calendar, Users, DollarSign, LogOut, Settings, Crown, Eye, Edit, Trash2, CreditCard, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget_min: number;
  budget_max: number;
  group_size: number;
  status: string;
  tier: string;
  price_paid: number;
  created_at: string;
}

interface Profile {
  first_name: string;
  last_name: string;
  subscription_tier: string;
}

const Dashboard = () => {
  const { user, signOut, loading, subscriptionInfo } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  // Redirect if not authenticated - moved AFTER all hooks
  if (!user && !loading) {
    return <Navigate to="/auth" replace />;
  }

  const fetchUserData = async () => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, subscription_tier')
        .eq('user_id', user?.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setProfile(profileData);
      }

      // Fetch user trips
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (tripsError) {
        console.error('Error fetching trips:', tripsError);
      } else {
        setTrips(tripsData || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewTrip = (trip: Trip) => {
    // Check if trip is paid and completed, then redirect accordingly
    if (trip.status === 'completed') {
      navigate(`/trip/${trip.id}/itinerary`);
    } else if (trip.price_paid && trip.price_paid > 0) {
      // If paid but not completed, redirect to generation status
      navigate(`/trip/${trip.id}/generating`);
    } else {
      // If not paid, redirect to payment
      navigate(`/trip/${trip.id}/quote`);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Update local state
      setTrips(trips.filter(trip => trip.id !== tripId));
      
      toast({
        title: "Trip Deleted",
        description: "Trip has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast({
        title: "Error",
        description: "Failed to delete trip. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditTrip = (tripId: string) => {
    // For now, redirect to create trip with the trip ID (we'll handle editing in create trip page)
    navigate(`/create-trip?edit=${tripId}`);
  };

  const getTripActionLabel = (trip: Trip) => {
    if (trip.status === 'completed') return 'View Itinerary';
    if (trip.price_paid && trip.price_paid > 0) return 'View Progress';
    return 'Complete Payment';
  };

  const getTripActionIcon = (trip: Trip) => {
    if (trip.status === 'completed') return <Eye className="h-4 w-4" />;
    if (trip.price_paid && trip.price_paid > 0) return <Eye className="h-4 w-4" />;
    return <CreditCard className="h-4 w-4" />;
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'generating': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'luxury': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      case 'premium': return 'bg-gradient-to-r from-purple-400 to-pink-500 text-white';
      case 'basic': return 'bg-gradient-to-r from-blue-400 to-teal-500 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
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
            <div className="flex items-center gap-2">
              <Compass className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold font-heading text-primary">Atlas</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <Badge className={`text-xs ${getTierColor(subscriptionInfo?.subscription_tier || profile?.subscription_tier || 'free')}`}>
                  {(subscriptionInfo?.subscription_tier || profile?.subscription_tier || 'free').toUpperCase()}
                  {subscriptionInfo?.subscription_tier === 'luxury' && <Crown className="h-3 w-3 ml-1" />}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/pricing'}>
                <Crown className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.first_name}! 🌟
          </h1>
          <p className="text-gray-600">Ready to plan your next adventure?</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Trips</p>
                  <p className="text-2xl font-bold text-gray-900">{trips.length}</p>
                </div>
                <MapPin className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Trips</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {trips.filter(trip => trip.status === 'completed').length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Budget</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${trips.reduce((total, trip) => total + (trip.budget_max || 0), 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upgrade Tier Prompt */}
        {trips.length > 0 && trips.some(trip => trip.tier === 'basic' || trip.tier === 'essential') ? (
          <Card className="mb-8 bg-gradient-to-r from-amber-400 to-orange-500">
            <CardContent className="p-8">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    <Crown className="h-6 w-6" />
                    Upgrade Your Travel Experience
                  </h2>
                  <p className="text-white/90 mb-4">
                    Unlock premium features like luxury accommodations, exclusive experiences, and concierge-level planning
                  </p>
                </div>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="bg-white text-orange-600 hover:bg-gray-100"
                  onClick={() => window.location.href = '/create-trip'}
                >
                  <Crown className="h-5 w-5 mr-2" />
                  Upgrade Next Trip
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8 bg-gradient-to-r from-adventure-blue to-adventure-teal">
            <CardContent className="p-8">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Plan Your Next Adventure</h2>
                  <p className="text-white/80 mb-4">
                    Create a personalized itinerary with our expert travel curation
                  </p>
                </div>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="bg-white text-adventure-blue hover:bg-gray-100"
                  onClick={() => window.location.href = '/create-trip'}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Trip
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Trips */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Trips</h2>
            {trips.length > 0 && (
              <Button variant="outline">View All</Button>
            )}
          </div>

          {trips.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips yet</h3>
                <p className="text-gray-600 mb-6">
                  Start planning your first adventure with Atlas
                </p>
                <Button 
                  variant="adventure"
                  onClick={() => window.location.href = '/create-trip'}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Plan Your First Trip
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <Card key={trip.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{trip.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-4 w-4" />
                          {trip.destination}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(trip.status)}>
                          {trip.status}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewTrip(trip)}>
                              {getTripActionIcon(trip)}
                              <span className="ml-2">{getTripActionLabel(trip)}</span>
                            </DropdownMenuItem>
                            {trip.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleEditTrip(trip.id)}>
                                <Edit className="h-4 w-4" />
                                <span className="ml-2">Edit Trip</span>
                              </DropdownMenuItem>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  className="text-red-600 focus:text-red-600"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="ml-2">Delete Trip</span>
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Trip</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{trip.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteTrip(trip.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {trip.start_date && trip.end_date ? (
                          `${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}`
                        ) : (
                          'Dates not set'
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        {trip.group_size} {trip.group_size === 1 ? 'traveler' : 'travelers'}
                      </div>
                      {trip.budget_min && trip.budget_max && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          ${trip.budget_min.toLocaleString()} - ${trip.budget_max.toLocaleString()}
                        </div>
                      )}
                      {trip.tier && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Crown className="h-4 w-4" />
                          {trip.tier} tier
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Created {formatDate(trip.created_at)}
                      </p>
                      <Button 
                        size="sm" 
                        onClick={() => handleViewTrip(trip)}
                        className="ml-auto"
                      >
                        {getTripActionIcon(trip)}
                        <span className="ml-2">{getTripActionLabel(trip)}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;