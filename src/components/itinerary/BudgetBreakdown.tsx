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
  }, [tripData, totalBudget]);

  const calculateBudget = () => {
    const duration = getDuration();
    const groupSize = parseInt(tripData?.formData?.groupSize) || 1;
    const destination = tripData?.formData?.destination || '';
    
    // Adjust budget based on destination (rough estimates)
    let dailyRate = 100; // Base daily rate
    if (destination.includes('Japan') || destination.includes('Switzerland') || destination.includes('Norway')) {
      dailyRate = 200;
    } else if (destination.includes('Western Europe') || destination.includes('Australia')) {
      dailyRate = 150;
    } else if (destination.includes('Southeast Asia') || destination.includes('India')) {
      dailyRate = 60;
    }

    const estimatedBudget = dailyRate * duration * groupSize;
    if (totalBudget === 2000) { // Only set if still default
      setTotalBudget(estimatedBudget);
    }

    const items: BudgetItem[] = [
      {
        category: 'Flights',
        amount: Math.round(totalBudget * 0.35),
        percentage: 35,
        icon: <Plane className="h-4 w-4" />,
        color: 'bg-blue-500',
        tips: [
          'Book 6-8 weeks in advance for best prices',
          'Consider nearby airports',
          'Use incognito mode when searching'
        ]
      },
      {
        category: 'Accommodation',
        amount: Math.round(totalBudget * 0.25),
        percentage: 25,
        icon: <Home className="h-4 w-4" />,
        color: 'bg-green-500',
        tips: [
          'Book directly with hotels for perks',
          'Consider vacation rentals for groups',
          'Check cancellation policies'
        ]
      },
      {
        category: 'Food & Dining',
        amount: Math.round(totalBudget * 0.20),
        percentage: 20,
        icon: <Utensils className="h-4 w-4" />,
        color: 'bg-orange-500',
        tips: [
          'Mix restaurant meals with local markets',
          'Try lunch menus for better prices',
          'Ask locals for recommendations'
        ]
      },
      {
        category: 'Activities',
        amount: Math.round(totalBudget * 0.15),
        percentage: 15,
        icon: <Camera className="h-4 w-4" />,
        color: 'bg-purple-500',
        tips: [
          'Book attraction tickets online',
          'Look for combo deals',
          'Consider city tourist cards'
        ]
      },
      {
        category: 'Local Transport',
        amount: Math.round(totalBudget * 0.08),
        percentage: 8,
        icon: <Bus className="h-4 w-4" />,
        color: 'bg-yellow-500',
        tips: [
          'Use public transport passes',
          'Walk when possible',
          'Download transport apps'
        ]
      },
      {
        category: 'Emergency Fund',
        amount: Math.round(totalBudget * 0.10),
        percentage: 10,
        icon: <Shield className="h-4 w-4" />,
        color: 'bg-red-500',
        tips: [
          'Keep 10-15% for unexpected costs',
          'Separate from daily spending money',
          'Consider travel insurance'
        ]
      },
      {
        category: 'Splurge Moment',
        amount: Math.round(totalBudget * 0.07),
        percentage: 7,
        icon: <Sparkles className="h-4 w-4" />,
        color: 'bg-pink-500',
        tips: [
          'One special experience per trip',
          'Fine dining or unique activity',
          'Make memories worth the cost'
        ]
      }
    ];

    setBudgetItems(items);
  };

  const getDuration = () => {
    if (tripData?.formData?.startDate && tripData?.formData?.endDate) {
      const start = new Date(tripData.formData.startDate);
      const end = new Date(tripData.formData.endDate);
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }
    return 7; // Default
  };

  const getDailyBudget = () => {
    const duration = getDuration();
    return Math.round(totalBudget / duration);
  };

  const exportBudget = () => {
    const budgetData = {
      trip: tripData?.title || 'My Trip',
      destination: tripData?.formData?.destination,
      duration: getDuration(),
      totalBudget,
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
          Smart allocation for your {getDuration()}-day trip to optimize every dollar
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
            <p className="text-3xl font-bold">${totalBudget.toLocaleString()}</p>
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
            Based on destination pricing and travel best practices
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