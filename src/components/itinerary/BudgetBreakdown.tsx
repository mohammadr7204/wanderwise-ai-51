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
    
    // Use existing budget breakdown if available
    if (existingBudget?.tripTotal) {
      const total = parseInt(existingBudget.tripTotal.replace(/[^0-9]/g, '')) || averageBudget;
      setTotalBudget(total);
    } else {
      setTotalBudget(averageBudget);
    }

    // Get destination and trip preferences for more accurate budgeting
    const destinations = tripData?.form_data?.specificDestinations || tripData?.formData?.specificDestinations || [];
    const destination = destinations[0] || tripData?.form_data?.destination || tripData?.formData?.destination || '';
    const accommodationType = tripData?.form_data?.accommodationType || tripData?.formData?.accommodationType || 'hotel';
    const transportPreferences = tripData?.form_data?.transportPreferences || tripData?.formData?.transportPreferences || [];
    
    // Adjust budget percentages based on destination and preferences
    let flightPercentage = 0.35;
    let accommodationPercentage = 0.25;
    let foodPercentage = 0.20;
    
    // Adjust for expensive destinations
    const expensiveDestinations = ['japan', 'switzerland', 'norway', 'iceland', 'denmark', 'singapore'];
    const isExpensive = expensiveDestinations.some(exp => destination.toLowerCase().includes(exp));
    
    if (isExpensive) {
      accommodationPercentage = 0.30;
      foodPercentage = 0.25;
      flightPercentage = 0.30;
    }
    
    // Adjust for accommodation type
    if (accommodationType === 'luxury-hotel') {
      accommodationPercentage = 0.35;
      foodPercentage = 0.25;
    } else if (accommodationType === 'hostel' || accommodationType === 'budget-hotel') {
      accommodationPercentage = 0.15;
      foodPercentage = 0.25;
    }

    const currentTotal = totalBudget || averageBudget;

    const items: BudgetItem[] = [
      {
        category: 'Flights',
        amount: Math.round(currentTotal * flightPercentage),
        percentage: Math.round(flightPercentage * 100),
        icon: <Plane className="h-4 w-4" />,
        color: 'bg-blue-500',
        tips: isExpensive ? [
          'Book 2-3 months in advance for expensive destinations',
          'Consider shoulder season travel',
          'Use airline miles or points if available'
        ] : [
          'Book 6-8 weeks in advance for best prices',
          'Consider nearby airports',
          'Use incognito mode when searching'
        ]
      },
      {
        category: 'Accommodation',
        amount: Math.round(currentTotal * accommodationPercentage),
        percentage: Math.round(accommodationPercentage * 100),
        icon: <Home className="h-4 w-4" />,
        color: 'bg-green-500',
        tips: accommodationType === 'luxury-hotel' ? [
          'Book directly with hotels for room upgrades',
          'Join loyalty programs for perks',
          'Consider package deals with activities'
        ] : accommodationType === 'hostel' ? [
          'Book private rooms in advance',
          'Check kitchen access for meal savings',
          'Read recent reviews carefully'
        ] : [
          'Book directly with hotels for perks',
          'Consider vacation rentals for groups',
          'Check cancellation policies'
        ]
      },
      {
        category: 'Food & Dining',
        amount: Math.round(currentTotal * foodPercentage),
        percentage: Math.round(foodPercentage * 100),
        icon: <Utensils className="h-4 w-4" />,
        color: 'bg-orange-500',
        tips: isExpensive ? [
          'Lunch menus offer better value than dinner',
          'Explore convenience stores for affordable meals',
          'Book restaurant reservations in advance'
        ] : [
          'Mix restaurant meals with local markets',
          'Try lunch menus for better prices',
          'Ask locals for recommendations'
        ]
      },
      {
        category: 'Activities',
        amount: Math.round(currentTotal * 0.15),
        percentage: 15,
        icon: <Camera className="h-4 w-4" />,
        color: 'bg-purple-500',
        tips: [
          'Book attraction tickets online for discounts',
          'Look for combo deals and city passes',
          'Many museums have free days'
        ]
      },
      {
        category: 'Local Transport',
        amount: Math.round(currentTotal * 0.08),
        percentage: 8,
        icon: <Bus className="h-4 w-4" />,
        color: 'bg-yellow-500',
        tips: transportPreferences.includes('rental-car') ? [
          'Compare rental car prices across companies',
          'Check fuel costs and parking fees',
          'Consider insurance coverage options'
        ] : [
          'Use public transport passes for savings',
          'Download local transport apps',
          'Walk when distances are reasonable'
        ]
      },
      {
        category: 'Emergency Fund',
        amount: Math.round(currentTotal * 0.10),
        percentage: 10,
        icon: <Shield className="h-4 w-4" />,
        color: 'bg-red-500',
        tips: [
          'Keep 10-15% for unexpected costs',
          'Separate from daily spending money',
          'Get comprehensive travel insurance'
        ]
      },
      {
        category: 'Splurge Experience',
        amount: Math.round(currentTotal * 0.07),
        percentage: 7,
        icon: <Sparkles className="h-4 w-4" />,
        color: 'bg-pink-500',
        tips: [
          'One memorable experience per trip',
          'Research must-do activities for your destination',
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