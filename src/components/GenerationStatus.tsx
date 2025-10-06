import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ErrorFallback, NetworkStatus } from '@/components/ui/error-fallback';
import { 
  MapPin, 
  Calendar, 
  Compass, 
  Sparkles, 
  CheckCircle,
  Clock
} from 'lucide-react';

const GENERATION_STEPS = [
  { id: 1, title: 'Researching flights...', description: 'Finding best flight options and prices for your dates' },
  { id: 2, title: 'Finding restaurants...', description: 'Discovering amazing dining experiences with dietary preferences' },
  { id: 3, title: 'Optimizing routes...', description: 'Creating efficient travel routes and realistic schedules' },
  { id: 4, title: 'Gathering local insights', description: 'Collecting insider tips and hidden gems from locals' },
  { id: 5, title: 'Personalizing recommendations', description: 'Matching venues to your exact preferences and budget' },
  { id: 6, title: 'Ready!', description: 'Your AI-powered itinerary is complete!' }
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
  form_data: any;
}

const GenerationStatus = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { trackItineraryGenerated, trackError } = useAnalytics();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [currentFact, setCurrentFact] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(240);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStepDescription, setCurrentStepDescription] = useState('Initializing AI research...');
  const [error, setError] = useState<string | null>(null);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (tripId && user) {
      fetchTrip();
    }
  }, [tripId, user]);

  useEffect(() => {
    // Check URL params for payment status
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      console.log('Payment successful, proceeding with generation');
      toast({
        title: "Payment Successful!",
        description: "Your payment was processed. Starting itinerary generation...",
      });
    } else if (paymentStatus === 'cancelled') {
      console.log('Payment cancelled, redirecting to quote');
      toast({
        title: "Payment Cancelled",
        description: "Payment was cancelled. Redirecting back to quote...",
        variant: "destructive"
      });
      setTimeout(() => {
        navigate(`/trip/${tripId}/quote`);
      }, 2000);
      return;
    }

    // Check if itinerary is already complete
    if (trip?.status === 'completed') {
      console.log('Trip already completed, redirecting to itinerary view');
      navigate(`/trip/${tripId}/itinerary`);
      return;
    }

    // Start real AI generation when trip is loaded and payment is successful
    if (trip && !isGenerating && (paymentStatus === 'success' || trip.status === 'quoted')) {
      console.log('Starting generation with conditions met:', { 
        tripLoaded: !!trip, 
        notGenerating: !isGenerating, 
        paymentSuccess: paymentStatus === 'success',
        tripQuoted: trip.status === 'quoted'
      });
      startRealGeneration();
    }

    // Update progress steps and estimates
    const interval = setInterval(() => {
      setProgress(prev => {
        const increment = isGenerating ? Math.random() * 1.5 : Math.random() * 0.5;
        const newProgress = Math.min(prev + increment, isGenerating ? 95 : 30);
        
        // Update current step based on progress
        if (newProgress >= 85) {
          setCurrentStep(6);
          setCurrentStepDescription('Finalizing your personalized itinerary...');
        } else if (newProgress >= 70) {
          setCurrentStep(5);
          setCurrentStepDescription('Quality checking recommendations against your budget...');
        } else if (newProgress >= 55) {
          setCurrentStep(4);
          setCurrentStepDescription('Optimizing travel times and logistics...');
        } else if (newProgress >= 35) {
          setCurrentStep(3);
          setCurrentStepDescription('Matching venues to your preferences...');
        } else if (newProgress >= 15) {
          setCurrentStep(2);
          setCurrentStepDescription('AI is researching your destination...');
        } else {
          setCurrentStep(1);
          setCurrentStepDescription('Gathering weather and event data...');
        }
        
        return newProgress;
      });
      
      if (isGenerating) {
        setEstimatedTime(prev => Math.max(0, prev - 1));
      }
    }, 2000);

    // Rotate travel facts every 8 seconds
    const factInterval = setInterval(() => {
      setCurrentFact(prev => (prev + 1) % TRAVEL_FACTS.length);
    }, 8000);

    return () => {
      clearInterval(interval);
      clearInterval(factInterval);
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [trip, isGenerating]);

  const fetchTrip = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('id, title, status, tier, form_data')
        .eq('id', tripId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setTrip(data);
      
      // Check if already completed
      if (data.status === 'completed') {
        navigate(`/trip/${tripId}/itinerary`);
      }
    } catch (error: any) {
      console.error('Error fetching trip:', error);
      const errorMessage = error?.message || "Failed to load trip details";
      setError(errorMessage);
      trackError(errorMessage, { context: 'fetch_trip', tripId });
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const startRealGeneration = async () => {
    if (!trip?.form_data || isGenerating) return;
    
    setIsGenerating(true);
    setGenerationStartTime(Date.now());
    setCurrentStepDescription('Initializing AI research with real-time data...');
    setError(null);
    
    try {
      console.log('Starting real AI generation for trip:', tripId);
      
      // Calculate trip duration
      const startDate = new Date(trip.form_data.startDate);
      const endDate = new Date(trip.form_data.endDate);
      const tripDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      setCurrentStepDescription('Starting background generation...');
      
      // Trigger background generation (returns immediately)
      const { data, error } = await supabase.functions.invoke('generate-itinerary', {
        body: {
          tripData: trip.form_data,
          tripDuration,
          userId: user?.id,
          tripId: trip.id
        }
      });

      if (error) {
        throw error;
      }

      console.log('Background generation started:', data);
      
      // Start polling for updates
      startPolling();
      
    } catch (error: any) {
      console.error('Error starting generation:', error);
      
      const errorMessage = error?.message || "Failed to start generation. Please try again.";
      setError(errorMessage);
      setIsGenerating(false);
      trackError(errorMessage, { context: 'generation_start', tripId });
      
      toast({
        title: "Generation Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const startPolling = () => {
    // Poll every 3 seconds for updates
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('trips')
          .select('status, itinerary_data')
          .eq('id', tripId)
          .single();

        if (error) throw error;

        console.log('Polling update:', data.status);

        // Update progress based on chunks completed
        const itineraryData = data.itinerary_data as any;
        if (itineraryData?.generationProgress) {
          const { percentComplete, chunksCompleted, totalChunks } = itineraryData.generationProgress;
          setProgress(percentComplete);
          setCurrentStepDescription(
            `Generating chunk ${chunksCompleted}/${totalChunks}...`
          );
        }

        if (data.status === 'completed') {
          // Generation complete!
          console.log('Generation completed, stopping polling');
          if (pollingInterval) clearInterval(pollingInterval);
          
          const generationDuration = generationStartTime ? Date.now() - generationStartTime : 0;
          trackItineraryGenerated(tripId!, trip!.tier, generationDuration);
          
          setProgress(100);
          setCurrentStep(6);
          setCurrentStepDescription('Generation complete! Redirecting...');
          
          setTimeout(() => {
            navigate(`/trip/${tripId}/itinerary`);
          }, 2000);
        } else if (data.status === 'error') {
          // Generation failed
          if (pollingInterval) clearInterval(pollingInterval);
          throw new Error('Generation failed in background');
        }
      } catch (error: any) {
        console.error('Polling error:', error);
        if (pollingInterval) clearInterval(pollingInterval);
        
        setError(error?.message || 'Generation failed');
        setIsGenerating(false);
      }
    }, 3000);

    setPollingInterval(interval);
  };

  const retryGeneration = () => {
    setError(null);
    setProgress(0);
    setCurrentStep(1);
    startRealGeneration();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorFallback
          title="Generation Failed"
          description={error}
          onRetry={retryGeneration}
          type="data"
        />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <NetworkStatus />
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
                <Badge variant={currentStep === 6 ? "default" : "secondary"}>
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
                    <p className="text-sm text-gray-600">
                      {step.id === currentStep ? currentStepDescription : step.description}
                    </p>
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
    </>
  );
};

export default GenerationStatus;