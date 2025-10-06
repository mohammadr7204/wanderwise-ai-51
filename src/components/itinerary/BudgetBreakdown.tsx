import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  PieChart, 
  Plane, 
  Home, 
  Utensils, 
  Camera, 
  Bus, 
  Shield,
  Sparkles,
  Download,
  Calculator
} from 'lucide-react';

interface BudgetItem {
  category: string;
  amount: number;
  percentage: number;
  icon: React.ReactNode;
  color: string;
  tips: string[];
}

interface BudgetBreakdownProps {
  tripData: any;
  existingBudget?: any;
}

const BudgetBreakdown = ({ tripData, existingBudget }: BudgetBreakdownProps) => {
  const [totalBudget, setTotalBudget] = useState(2000);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);

  useEffect(() => {
    calculateBudget();
  }, [tripData, existingBudget]);

  const calculateBudget = () => {
    const duration = getDuration();
    const groupSize = parseInt(tripData?.form_data?.groupSize || tripData?.formData?.groupSize) || 1;
    
    // Use actual budget from form data if available
    const minBudget = tripData?.form_data?.budgetMin || tripData?.formData?.budgetMin || 1000;
    const maxBudget = tripData?.form_data?.budgetMax || tripData?.formData?.budgetMax || 5000;
    const averageBudget = Math.round((minBudget + maxBudget) / 2);
    
    // Determine current total budget
    let currentTotal = averageBudget;
    if (existingBudget?.tripTotal) {
      currentTotal = parseInt(existingBudget.tripTotal.replace(/[^0-9]/g, '')) || averageBudget;
    }

    // Get destination and trip preferences for more accurate budgeting
    const destinations = tripData?.form_data?.specificDestinations || tripData?.formData?.specificDestinations || [];
    const destination = destinations[0] || tripData?.form_data?.destination || tripData?.formData?.destination || '';
    const accommodationType = tripData?.form_data?.accommodationType || tripData?.formData?.accommodationType || 'hotel';
    const transportPreferences = tripData?.form_data?.transportPreferences || tripData?.formData?.transportPreferences || [];
    const activities = tripData?.form_data?.activityTypes || tripData?.formData?.activityTypes || [];
    const travelStyle = tripData?.form_data?.travelStyle || tripData?.formData?.travelStyle || 'balanced';
    
    console.log('Budget calculation inputs:', {
      destination,
      accommodationType,
      transportPreferences,
      activities,
      travelStyle,
      duration,
      groupSize,
      currentTotal
    });
    
    // Adjust budget percentages based on destination and preferences
    let flightPercentage = 0.35;
    let accommodationPercentage = 0.25;
    let foodPercentage = 0.20;
    let activitiesPercentage = 0.15;
    
    // Adjust for expensive destinations
    const expensiveDestinations = ['japan', 'switzerland', 'norway', 'iceland', 'denmark', 'singapore', 'new york', 'london', 'paris'];
    const budgetDestinations = ['thailand', 'vietnam', 'india', 'guatemala', 'bolivia', 'nepal', 'cambodia'];
    
    const destinationLower = destination.toLowerCase();
    const isExpensive = expensiveDestinations.some(exp => destinationLower.includes(exp));
    const isBudget = budgetDestinations.some(budget => destinationLower.includes(budget));
    
    if (isExpensive) {
      accommodationPercentage = 0.30;
      foodPercentage = 0.25;
      flightPercentage = 0.30;
      activitiesPercentage = 0.10;
    } else if (isBudget) {
      accommodationPercentage = 0.20;
      foodPercentage = 0.15;
      flightPercentage = 0.40;
      activitiesPercentage = 0.20;
    }
    
    // Adjust for accommodation type
    if (accommodationType === 'luxury-hotel' || accommodationType === 'resort') {
      accommodationPercentage = Math.min(0.40, accommodationPercentage + 0.10);
      foodPercentage = Math.min(0.30, foodPercentage + 0.05);
    } else if (accommodationType === 'hostel' || accommodationType === 'budget-hotel') {
      accommodationPercentage = Math.max(0.10, accommodationPercentage - 0.10);
      activitiesPercentage = Math.min(0.25, activitiesPercentage + 0.05);
    } else if (accommodationType === 'vacation-rental' || accommodationType === 'airbnb') {
      accommodationPercentage = Math.max(0.15, accommodationPercentage - 0.05);
      foodPercentage = Math.max(0.15, foodPercentage - 0.05); // Can cook own meals
    }

    // Adjust for travel style
    if (travelStyle === 'luxury') {
      accommodationPercentage = Math.min(0.45, accommodationPercentage + 0.15);
      foodPercentage = Math.min(0.30, foodPercentage + 0.10);
      activitiesPercentage = Math.min(0.20, activitiesPercentage + 0.05);
    } else if (travelStyle === 'budget') {
      accommodationPercentage = Math.max(0.10, accommodationPercentage - 0.10);
      foodPercentage = Math.max(0.10, foodPercentage - 0.10);
      activitiesPercentage = Math.max(0.10, activitiesPercentage - 0.05);
    }

    // Adjust for activity-heavy trips
    const adventureActivities = ['hiking', 'adventure', 'extreme-sports', 'water-sports'];
    const hasAdventureActivities = activities.some((activity: string) => 
      adventureActivities.some(adv => activity.includes(adv))
    );
    
    if (hasAdventureActivities) {
      activitiesPercentage = Math.min(0.25, activitiesPercentage + 0.10);
      accommodationPercentage = Math.max(0.15, accommodationPercentage - 0.05);
    }

    // Calculate transport, emergency, and splurge percentages
    const remainingPercentage = 1 - flightPercentage - accommodationPercentage - foodPercentage - activitiesPercentage;
    const transportPercentage = Math.max(0.05, Math.min(0.12, remainingPercentage * 0.5));
    const emergencyPercentage = Math.max(0.08, Math.min(0.15, remainingPercentage * 0.6));
    const splurgePercentage = Math.max(0.03, remainingPercentage - transportPercentage - emergencyPercentage);

    // CRITICAL: Normalize all percentages to ensure they sum to exactly 100%
    const totalPercentage = flightPercentage + accommodationPercentage + foodPercentage + 
                           activitiesPercentage + transportPercentage + emergencyPercentage + splurgePercentage;
    
    // Apply normalization factor
    const normalizationFactor = 1 / totalPercentage;
    const normalizedFlight = flightPercentage * normalizationFactor;
    const normalizedAccommodation = accommodationPercentage * normalizationFactor;
    const normalizedFood = foodPercentage * normalizationFactor;
    const normalizedActivities = activitiesPercentage * normalizationFactor;
    const normalizedTransport = transportPercentage * normalizationFactor;
    const normalizedEmergency = emergencyPercentage * normalizationFactor;
    const normalizedSplurge = splurgePercentage * normalizationFactor;

    console.log('Dynamic budget percentages:', {
      flight: normalizedFlight,
      accommodation: normalizedAccommodation,
      food: normalizedFood,
      activities: normalizedActivities,
      transport: normalizedTransport,
      emergency: normalizedEmergency,
      splurge: normalizedSplurge,
      total: normalizedFlight + normalizedAccommodation + normalizedFood + normalizedActivities + 
             normalizedTransport + normalizedEmergency + normalizedSplurge
    });

    // Set the total budget
    setTotalBudget(currentTotal);

    const items: BudgetItem[] = [
      {
        category: 'Flights',
        amount: Math.round(currentTotal * normalizedFlight),
        percentage: Math.round(normalizedFlight * 100),
        icon: <Plane className="h-4 w-4" />,
        color: 'bg-blue-500',
        tips: isExpensive ? [
          'Book 2-3 months in advance for expensive destinations',
          'Consider shoulder season travel',
          'Use airline miles or points if available'
        ] : isBudget ? [
          'Look for connecting flights to save money',
          'Book well in advance for best deals',
          'Consider budget airlines for short distances'
        ] : [
          'Book 6-8 weeks in advance for best prices',
          'Consider nearby airports',
          'Use incognito mode when searching'
        ]
      },
      {
        category: 'Accommodation',
        amount: Math.round(currentTotal * normalizedAccommodation),
        percentage: Math.round(normalizedAccommodation * 100),
        icon: <Home className="h-4 w-4" />,
        color: 'bg-green-500',
        tips: accommodationType === 'luxury-hotel' || accommodationType === 'resort' ? [
          'Book directly with hotels for room upgrades',
          'Join loyalty programs for perks',
          'Consider package deals with activities'
        ] : accommodationType === 'hostel' ? [
          'Book private rooms in advance',
          'Check kitchen access for meal savings',
          'Read recent reviews carefully'
        ] : accommodationType === 'vacation-rental' || accommodationType === 'airbnb' ? [
          'Book early for better selection',
          'Check kitchen facilities to save on food',
          'Read host reviews and house rules'
        ] : [
          'Book directly with hotels for perks',
          'Consider vacation rentals for groups',
          'Check cancellation policies'
        ]
      },
      {
        category: 'Food & Dining',
        amount: Math.round(currentTotal * normalizedFood),
        percentage: Math.round(normalizedFood * 100),
        icon: <Utensils className="h-4 w-4" />,
        color: 'bg-orange-500',
        tips: isExpensive ? [
          'Lunch menus offer better value than dinner',
          'Explore convenience stores for affordable meals',
          'Book restaurant reservations in advance'
        ] : isBudget ? [
          'Street food offers authentic and cheap meals',
          'Local markets are great for fresh, affordable food',
          'Cook some meals if you have kitchen access'
        ] : travelStyle === 'luxury' ? [
          'Make reservations at top restaurants in advance',
          'Try tasting menus for special experiences',
          'Consider food tours for local insights'
        ] : [
          'Mix restaurant meals with local markets',
          'Try lunch menus for better prices',
          'Ask locals for recommendations'
        ]
      },
      {
        category: 'Activities',
        amount: Math.round(currentTotal * normalizedActivities),
        percentage: Math.round(normalizedActivities * 100),
        icon: <Camera className="h-4 w-4" />,
        color: 'bg-purple-500',
        tips: hasAdventureActivities ? [
          'Book adventure activities in advance',
          'Check equipment rental vs buying',
          'Consider guided tours for safety'
        ] : [
          'Book attraction tickets online for discounts',
          'Look for combo deals and city passes',
          'Many museums have free days'
        ]
      },
      {
        category: 'Local Transport',
        amount: Math.round(currentTotal * normalizedTransport),
        percentage: Math.round(normalizedTransport * 100),
        icon: <Bus className="h-4 w-4" />,
        color: 'bg-yellow-500',
        tips: transportPreferences.includes('rental-car') ? [
          'Compare rental car prices across companies',
          'Check fuel costs and parking fees',
          'Consider insurance coverage options'
        ] : transportPreferences.includes('public-transport') ? [
          'Get unlimited travel passes for savings',
          'Download local transport apps',
          'Learn the public transport system early'
        ] : [
          'Use public transport passes for savings',
          'Download local transport apps',
          'Walk when distances are reasonable'
        ]
      },
      {
        category: 'Emergency Fund',
        amount: Math.round(currentTotal * normalizedEmergency),
        percentage: Math.round(normalizedEmergency * 100),
        icon: <Shield className="h-4 w-4" />,
        color: 'bg-red-500',
        tips: [
          `Keep ${Math.round(normalizedEmergency * 100)}% for unexpected costs`,
          'Separate from daily spending money',
          'Get comprehensive travel insurance'
        ]
      },
      {
        category: 'Splurge Experience',
        amount: Math.round(currentTotal * normalizedSplurge),
        percentage: Math.round(normalizedSplurge * 100),
        icon: <Sparkles className="h-4 w-4" />,
        color: 'bg-pink-500',
        tips: [
          'One memorable experience per trip',
          `Research must-do activities for ${destination}`,
          'Book signature experiences in advance'
        ]
      }
    ];

    setBudgetItems(items);
  };

  const getDuration = () => {
    if (tripData?.form_data?.startDate && tripData?.form_data?.endDate) {
      const start = new Date(tripData.form_data.startDate);
      const end = new Date(tripData.form_data.endDate);
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }
    if (tripData?.formData?.startDate && tripData?.formData?.endDate) {
      const start = new Date(tripData.formData.startDate);
      const end = new Date(tripData.formData.endDate);
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }
    return 7; // Default
  };

  const getDailyBudget = () => {
    const duration = getDuration();
    return Math.round((totalBudget || 2000) / duration);
  };

  const exportBudget = () => {
    const destinations = tripData?.form_data?.specificDestinations || tripData?.formData?.specificDestinations || [];
    const destination = destinations[0] || tripData?.form_data?.destination || tripData?.formData?.destination || 'Unknown';
    
    const budgetData = {
      trip: tripData?.title || 'My Trip',
      destination: destination,
      duration: getDuration(),
      totalBudget: totalBudget || 2000,
      dailyBudget: getDailyBudget(),
      breakdown: budgetItems.map(item => ({
        category: item.category,
        amount: item.amount,
        percentage: item.percentage
      }))
    };
    
    const dataStr = JSON.stringify(budgetData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'trip-budget.json';
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Budget Breakdown</h2>
        <p className="text-muted-foreground">
          Smart allocation for your {getDuration()}-day trip - personalized for your preferences and destination
        </p>
      </div>

      {/* Budget Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="font-medium">Total Budget</span>
            </div>
            <p className="text-3xl font-bold">${(totalBudget || 2000).toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Daily Budget</span>
            </div>
            <p className="text-3xl font-bold">${getDailyBudget()}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              <span className="font-medium">Categories</span>
            </div>
            <p className="text-3xl font-bold">{budgetItems.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Optimal Allocation</span>
            <Button variant="outline" size="sm" onClick={exportBudget}>
              <Download className="h-4 w-4 mr-2" />
              Export Budget
            </Button>
          </CardTitle>
          <CardDescription>
            Based on your destination, preferences, and current market pricing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {budgetItems.map((item, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.color} text-white`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-medium">{item.category}</p>
                    <p className="text-sm text-muted-foreground">{item.percentage}% of budget</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${item.amount.toLocaleString()}</p>
                  <Badge variant="secondary" className="text-xs">
                    ${Math.round(item.amount / getDuration())}/day
                  </Badge>
                </div>
              </div>
              <Progress value={item.percentage} className="h-2" />
              
              {/* Tips for this category */}
              <div className="ml-12 space-y-1">
                {item.tips.map((tip, tipIndex) => (
                  <p key={tipIndex} className="text-xs text-muted-foreground">
                    {tip}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Money-Saving Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Smart Spending Tips</CardTitle>
          <CardDescription>
            Maximize your travel budget with these proven strategies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-green-700">Before You Go</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Set up a separate travel savings account</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Notify your bank of travel dates</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Research local tipping customs</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Download currency conversion apps</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-blue-700">While Traveling</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Track daily expenses with an app</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Use local ATMs over currency exchange</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Eat lunch at dinner restaurants for lower prices</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Book activities day-of for potential discounts</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetBreakdown;