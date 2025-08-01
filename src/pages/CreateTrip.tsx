import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Compass, Crown } from 'lucide-react';
import { TripBasics } from '@/components/trip-wizard/TripBasics';
import { DestinationPreferences } from '@/components/trip-wizard/DestinationPreferences';
import { ActivityPreferences } from '@/components/trip-wizard/ActivityPreferences';
import { TravelDetails } from '@/components/trip-wizard/TravelDetails';
import { ReviewAndCreate } from '@/components/trip-wizard/ReviewAndCreate';

export interface TripFormData {
  // Basic trip info
  title: string;
  startingLocation: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  groupSize: number;
  budgetMin: number;
  budgetMax: number;
  
  // Destination preferences
  destinationType: 'surprise' | 'specific';
  specificDestinations: string[];
  travelRadius: 'local' | 'national' | 'international';
  climatePreferences: string[];
  
  // Flight analysis preferences
  includeFlightAnalysis: boolean;
  preferredDepartureTime: 'early-morning' | 'morning' | 'afternoon' | 'evening' | 'late-night' | 'flexible';
  flightClass: 'economy' | 'premium-economy' | 'business' | 'first';
  directFlightsOnly: boolean;
  
  // Activity preferences
  activityTypes: string[];
  accommodationType: string;
  accommodationAmenities: string[];
  
  // Travel details
  transportPreferences: string[];
  dietaryRestrictions: string[];
  foodAdventureLevel: number;
  accessibilityNeeds: string;
  specialRequests: string;
}

const CreateTrip = () => {
  const { user, loading, subscriptionInfo } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const editTripId = searchParams.get('edit');
  const isEditMode = Boolean(editTripId);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingTrip, setIsLoadingTrip] = useState(isEditMode);
  const [formData, setFormData] = useState<TripFormData>({
    title: '',
    startingLocation: '',
    startDate: undefined,
    endDate: undefined,
    groupSize: 1,
    budgetMin: 1000,
    budgetMax: 5000,
    destinationType: 'surprise',
    specificDestinations: [],
    travelRadius: 'national',
    climatePreferences: [],
    includeFlightAnalysis: true,
    preferredDepartureTime: 'flexible',
    flightClass: 'economy',
    directFlightsOnly: false,
    activityTypes: [],
    accommodationType: 'mid-range-hotels',
    accommodationAmenities: [],
    transportPreferences: [],
    dietaryRestrictions: [],
    foodAdventureLevel: 5,
    accessibilityNeeds: '',
    specialRequests: '',
  });

  // Load existing trip data if in edit mode
  useEffect(() => {
    if (isEditMode && editTripId && user) {
      loadTripForEditing();
    }
  }, [isEditMode, editTripId, user]);

  const loadTripForEditing = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', editTripId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (data && data.form_data) {
        const tripFormData = data.form_data as unknown as TripFormData;
        setFormData({
          ...tripFormData,
          startDate: tripFormData.startDate ? new Date(tripFormData.startDate) : undefined,
          endDate: tripFormData.endDate ? new Date(tripFormData.endDate) : undefined,
        });
      }
    } catch (error) {
      console.error('Error loading trip for editing:', error);
      toast({
        title: "Error",
        description: "Failed to load trip data for editing.",
        variant: "destructive",
      });
      navigate('/dashboard');
    } finally {
      setIsLoadingTrip(false);
    }
  };

  // Handle loading and authentication states
  if (loading || isLoadingTrip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <Compass className="h-8 w-8 text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const updateFormData = (updates: Partial<TripFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.title.trim() && formData.startingLocation.trim() && formData.startDate && formData.endDate;
      case 2:
        if (formData.destinationType === 'surprise') return true;
        if (formData.destinationType === 'specific') {
          return formData.specificDestinations.length > 0;
        }
        return false;
      case 3:
        return formData.activityTypes.length > 0;
      case 4:
        return formData.transportPreferences.length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Trip Basics';
      case 2: return 'Destination Preferences';
      case 3: return 'Activity Preferences';
      case 4: return 'Travel Details';
      case 5: return 'Review & Generate';
      default: return 'Create Trip';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return 'Let\'s start with the basics of your trip';
      case 2: return 'Where would you like to go?';
      case 3: return 'What would you like to do?';
      case 4: return 'Tell us about your travel preferences';
      case 5: return 'Review your preferences and generate your itinerary';
      default: return 'Plan your perfect adventure';
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <TripBasics formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <DestinationPreferences formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <ActivityPreferences formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <TravelDetails formData={formData} updateFormData={updateFormData} />;
      case 5:
        return (
          <ReviewAndCreate 
            formData={formData} 
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            onComplete={() => navigate('/dashboard')}
            editTripId={editTripId}
            isEditMode={isEditMode}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Compass className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold text-primary">Atlas</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{getStepTitle()}</h1>
              <p className="text-gray-600">{getStepDescription()}</p>
            </div>
            <div className="text-sm text-gray-500">
              Step {currentStep} of {totalSteps}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Form Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-primary" />
              {getStepTitle()}
            </CardTitle>
            <CardDescription>
              {getStepDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {renderCurrentStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        {currentStep < 5 && (
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button 
              variant="adventure"
              onClick={nextStep}
              disabled={!isStepValid() || currentStep === totalSteps}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default CreateTrip;