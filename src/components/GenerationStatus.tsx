import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Calendar, 
  Compass, 
  Sparkles, 
  CheckCircle,
  Clock
} from 'lucide-react';

const GENERATION_STEPS = [
  { id: 1, title: 'Analyzing preferences', description: 'Understanding your travel style and needs' },
  { id: 2, title: 'Finding destinations', description: 'Discovering perfect locations for your trip' },
  { id: 3, title: 'Creating itinerary', description: 'Crafting your personalized day-by-day plan' },
  { id: 4, title: 'Adding final touches', description: 'Including insider tips and recommendations' },
  { id: 5, title: 'Ready!', description: 'Your itinerary is complete and ready to view' }
];

const TRAVEL_FACTS = [
  "Did you know? The word 'travel' comes from the French word 'travail', meaning work!",
  "Fun fact: There are more possible ways to arrange a deck of cards than there are atoms on Earth!",
  "Amazing! The Great Wall of China isn't visible from space with the naked eye.",
  "Cool trivia: Finland has more saunas than cars - about 2 million saunas for 5.5 million people!",
  "Interesting: The shortest flight in the world lasts only 47 seconds in Scotland.",
  "Wow! Iceland runs almost entirely on renewable energy from geothermal and hydroelectric sources.",
  "Fascinating: In Japan, slurping your soup is considered a compliment to the chef!",
  "Amazing fact: Norway has the world's longest road tunnel at 15.2 miles long!"
];

interface Trip {
  id: string;
  title: string;
  status: string;
  tier: string;
}

const GenerationStatus = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [currentFact, setCurrentFact] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(180); // 3 minutes in seconds

  useEffect(() => {
    if (tripId && user) {
      fetchTrip();
    }
  }, [tripId, user]);

  useEffect(() => {
    // Check if itinerary is already complete
    if (trip?.status === 'completed') {
      navigate(`/trip/${tripId}/itinerary`);
      return;
    }

    // Simulate generation progress
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 2;
        
        // Update current step based on progress
        if (newProgress >= 90) setCurrentStep(5);
        else if (newProgress >= 70) setCurrentStep(4);
        else if (newProgress >= 50) setCurrentStep(3);
        else if (newProgress >= 20) setCurrentStep(2);
        
        if (newProgress >= 100) {
          clearInterval(interval);
          // Simulate completion and redirect
          setTimeout(() => {
            completeGeneration();
          }, 2000);
          return 100;
        }
        
        return newProgress;
      });
      
      setEstimatedTime(prev => Math.max(0, prev - 1));
    }, 1000);

    // Rotate travel facts every 8 seconds
    const factInterval = setInterval(() => {
      setCurrentFact(prev => (prev + 1) % TRAVEL_FACTS.length);
    }, 8000);

    return () => {
      clearInterval(interval);
      clearInterval(factInterval);
    };
  }, [trip]);

  const fetchTrip = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('id, title, status, tier')
        .eq('id', tripId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setTrip(data);
      
      // Check if already completed
      if (data.status === 'completed') {
        navigate(`/trip/${tripId}/itinerary`);
      }
    } catch (error) {
      console.error('Error fetching trip:', error);
      toast({
        title: "Error",
        description: "Failed to load trip details",
        variant: "destructive"
      });
      navigate('/dashboard');
    }
  };

  const completeGeneration = async () => {
    try {
      // Update trip status to completed
      await supabase
        .from('trips')
        .update({ status: 'completed' })
        .eq('id', tripId);

      // Create mock itinerary data
      const mockItinerary = {
        days: Array.from({ length: 7 }, (_, i) => ({
          day: i + 1,
          title: `Day ${i + 1}`,
          activities: [
            { time: '9:00 AM', title: 'Morning Activity', description: 'Explore local attractions' },
            { time: '1:00 PM', title: 'Lunch', description: 'Local restaurant recommendation' },
            { time: '3:00 PM', title: 'Afternoon Experience', description: 'Cultural activity' },
            { time: '7:00 PM', title: 'Dinner', description: 'Evening dining experience' }
          ]
        })),
        restaurants: Array.from({ length: 10 }, (_, i) => ({
          name: `Restaurant ${i + 1}`,
          cuisine: 'Local',
          priceRange: '$$',
          rating: 4.5
        })),
        tips: [
          'Book restaurants in advance',
          'Carry cash for local vendors',
          'Learn basic local phrases'
        ]
      };

      // Store itinerary
      await supabase
        .from('itineraries')
        .insert({
          trip_id: tripId,
          content: mockItinerary
        });

      navigate(`/trip/${tripId}/itinerary`);
    } catch (error) {
      console.error('Error completing generation:', error);
      toast({
        title: "Error",
        description: "Failed to complete itinerary generation",
        variant: "destructive"
      });
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Creating Your Perfect Itinerary
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            We're crafting something amazing for <span className="font-semibold">{trip.title}</span>
          </p>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Estimated time remaining: {formatTime(estimatedTime)}</span>
          </div>
        </div>

        {/* Progress Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-primary" />
              Generation Progress
            </CardTitle>
            <CardDescription>
              Step {currentStep} of {GENERATION_STEPS.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{Math.round(progress)}% Complete</span>
                <Badge variant={currentStep === 5 ? "default" : "secondary"}>
                  {GENERATION_STEPS[currentStep - 1]?.title}
                </Badge>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            <div className="space-y-3">
              {GENERATION_STEPS.map((step) => (
                <div 
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    step.id === currentStep 
                      ? 'bg-primary/10 border border-primary/20' 
                      : step.id < currentStep
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  {step.id < currentStep ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : step.id === currentStep ? (
                    <div className="h-5 w-5 border-2 border-primary rounded-full animate-pulse" />
                  ) : (
                    <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                  )}
                  <div>
                    <h4 className={`font-medium ${
                      step.id === currentStep ? 'text-primary' : 
                      step.id < currentStep ? 'text-green-700' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fun Facts Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Did You Know?
            </CardTitle>
            <CardDescription>Fun travel facts while you wait</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <p className="text-lg text-gray-700 font-medium">
                {TRAVEL_FACTS[currentFact]}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GenerationStatus;