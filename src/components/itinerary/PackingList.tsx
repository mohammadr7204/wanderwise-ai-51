import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Luggage, 
  Shirt, 
  Smartphone, 
  FileText, 
  Droplets, 
  Sun, 
  Cloud, 
  Snowflake,
  Download,
  Check,
  X,
  Package
} from 'lucide-react';

interface PackingItem {
  id: string;
  name: string;
  category: string;
  essential: boolean;
  weatherDependent: boolean;
  activitySpecific?: string;
  checked: boolean;
}

interface PackingListProps {
  tripData: any;
}

const PackingList = ({ tripData }: PackingListProps) => {
  const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    generatePackingList();
  }, [tripData]);

  const generatePackingList = () => {
    const duration = getDuration();
    const destination = tripData?.formData?.destination || '';
    const activities = tripData?.formData?.interests || [];
    const climate = getClimateFromDestination(destination);

    const baseItems: PackingItem[] = [
      // Clothing
      { id: 'underwear', name: `Underwear (${duration + 2} pairs)`, category: 'Clothing', essential: true, weatherDependent: false, checked: false },
      { id: 'socks', name: `Socks (${duration + 2} pairs)`, category: 'Clothing', essential: true, weatherDependent: false, checked: false },
      { id: 'shirts', name: `T-shirts/Shirts (${Math.ceil(duration / 2)} pieces)`, category: 'Clothing', essential: true, weatherDependent: false, checked: false },
      { id: 'pants', name: `Pants/Trousers (${Math.ceil(duration / 3)} pairs)`, category: 'Clothing', essential: true, weatherDependent: false, checked: false },
      { id: 'sleepwear', name: 'Pajamas/Sleepwear', category: 'Clothing', essential: true, weatherDependent: false, checked: false },
      
      // Documents
      { id: 'passport', name: 'Passport', category: 'Documents', essential: true, weatherDependent: false, checked: false },
      { id: 'id', name: 'Driver\'s License/ID', category: 'Documents', essential: true, weatherDependent: false, checked: false },
      { id: 'tickets', name: 'Flight Tickets/Boarding Passes', category: 'Documents', essential: true, weatherDependent: false, checked: false },
      { id: 'insurance', name: 'Travel Insurance Documents', category: 'Documents', essential: true, weatherDependent: false, checked: false },
      { id: 'itinerary', name: 'Hotel Confirmations', category: 'Documents', essential: true, weatherDependent: false, checked: false },
      
      // Electronics
      { id: 'phone', name: 'Smartphone', category: 'Electronics', essential: true, weatherDependent: false, checked: false },
      { id: 'charger', name: 'Phone Charger', category: 'Electronics', essential: true, weatherDependent: false, checked: false },
      { id: 'adapter', name: 'Power Adapter/Converter', category: 'Electronics', essential: true, weatherDependent: false, checked: false },
      { id: 'powerbank', name: 'Portable Charger', category: 'Electronics', essential: false, weatherDependent: false, checked: false },
      
      // Personal Care
      { id: 'toothbrush', name: 'Toothbrush', category: 'Personal Care', essential: true, weatherDependent: false, checked: false },
      { id: 'toothpaste', name: 'Toothpaste (travel size)', category: 'Personal Care', essential: true, weatherDependent: false, checked: false },
      { id: 'shampoo', name: 'Shampoo (travel size)', category: 'Personal Care', essential: true, weatherDependent: false, checked: false },
      { id: 'soap', name: 'Body Wash/Soap', category: 'Personal Care', essential: true, weatherDependent: false, checked: false },
      { id: 'medications', name: 'Prescription Medications', category: 'Personal Care', essential: true, weatherDependent: false, checked: false },
      
      // Weather-specific items
      ...(climate === 'warm' ? [
        { id: 'sunscreen', name: 'Sunscreen (SPF 30+)', category: 'Weather Items', essential: true, weatherDependent: true, checked: false },
        { id: 'hat', name: 'Sun Hat/Cap', category: 'Weather Items', essential: false, weatherDependent: true, checked: false },
        { id: 'sunglasses', name: 'Sunglasses', category: 'Weather Items', essential: false, weatherDependent: true, checked: false },
        { id: 'swimwear', name: 'Swimwear', category: 'Weather Items', essential: false, weatherDependent: true, checked: false },
      ] : []),
      
      ...(climate === 'cold' ? [
        { id: 'jacket', name: 'Warm Jacket/Coat', category: 'Weather Items', essential: true, weatherDependent: true, checked: false },
        { id: 'scarf', name: 'Scarf', category: 'Weather Items', essential: false, weatherDependent: true, checked: false },
        { id: 'gloves', name: 'Gloves', category: 'Weather Items', essential: false, weatherDependent: true, checked: false },
        { id: 'thermals', name: 'Thermal Underwear', category: 'Weather Items', essential: false, weatherDependent: true, checked: false },
      ] : []),
      
      ...(climate === 'rainy' ? [
        { id: 'raincoat', name: 'Rain Jacket/Poncho', category: 'Weather Items', essential: true, weatherDependent: true, checked: false },
        { id: 'umbrella', name: 'Compact Umbrella', category: 'Weather Items', essential: false, weatherDependent: true, checked: false },
        { id: 'waterproof', name: 'Waterproof Shoes', category: 'Weather Items', essential: false, weatherDependent: true, checked: false },
      ] : []),
    ];

    // Add activity-specific items
    const activityItems: PackingItem[] = [];
    if (activities.includes('hiking') || activities.includes('adventure')) {
      activityItems.push(
        { id: 'hiking-boots', name: 'Hiking Boots', category: 'Activity Gear', essential: false, weatherDependent: false, activitySpecific: 'hiking', checked: false },
        { id: 'backpack', name: 'Day Backpack', category: 'Activity Gear', essential: false, weatherDependent: false, activitySpecific: 'hiking', checked: false },
        { id: 'water-bottle', name: 'Water Bottle', category: 'Activity Gear', essential: false, weatherDependent: false, activitySpecific: 'hiking', checked: false }
      );
    }
    
    if (activities.includes('business')) {
      activityItems.push(
        { id: 'business-attire', name: 'Business Suit/Formal Wear', category: 'Activity Gear', essential: true, weatherDependent: false, activitySpecific: 'business', checked: false },
        { id: 'dress-shoes', name: 'Dress Shoes', category: 'Activity Gear', essential: true, weatherDependent: false, activitySpecific: 'business', checked: false },
        { id: 'laptop', name: 'Laptop', category: 'Activity Gear', essential: true, weatherDependent: false, activitySpecific: 'business', checked: false }
      );
    }

    setPackingItems([...baseItems, ...activityItems]);
  };

  const getDuration = () => {
    if (tripData?.formData?.startDate && tripData?.formData?.endDate) {
      const start = new Date(tripData.formData.startDate);
      const end = new Date(tripData.formData.endDate);
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }
    return 7;
  };

  const getClimateFromDestination = (destination: string): string => {
    const dest = destination.toLowerCase();
    if (dest.includes('tropical') || dest.includes('beach') || dest.includes('hawaii') || dest.includes('thailand')) {
      return 'warm';
    } else if (dest.includes('cold') || dest.includes('winter') || dest.includes('snow') || dest.includes('iceland')) {
      return 'cold';
    } else if (dest.includes('rain') || dest.includes('monsoon') || dest.includes('seattle')) {
      return 'rainy';
    }
    return 'temperate';
  };

  const toggleItem = (itemId: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const exportPackingList = () => {
    const listData = {
      trip: tripData?.title || 'My Trip',
      destination: tripData?.formData?.destination,
      duration: getDuration(),
      items: packingItems.map(item => ({
        name: item.name,
        category: item.category,
        essential: item.essential,
        checked: checkedItems.has(item.id)
      }))
    };
    
    const text = `PACKING LIST - ${listData.trip}\n` +
      `Destination: ${listData.destination}\n` +
      `Duration: ${listData.duration} days\n\n` +
      packingItems.map(item => 
        `${checkedItems.has(item.id) ? '✓' : '☐'} ${item.name} (${item.category})`
      ).join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'packing-list.txt';
    link.click();
  };

  const getPackingProgress = () => {
    return Math.round((checkedItems.size / packingItems.length) * 100);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Clothing': return <Shirt className="h-4 w-4" />;
      case 'Electronics': return <Smartphone className="h-4 w-4" />;
      case 'Documents': return <FileText className="h-4 w-4" />;
      case 'Personal Care': return <Droplets className="h-4 w-4" />;
      case 'Weather Items': return <Sun className="h-4 w-4" />;
      case 'Activity Gear': return <Package className="h-4 w-4" />;
      default: return <Luggage className="h-4 w-4" />;
    }
  };

  const categories = [...new Set(packingItems.map(item => item.category))];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Smart Packing List</h2>
        <p className="text-muted-foreground">
          Optimized for carry-on travel to {tripData?.formData?.destination || 'your destination'}
        </p>
      </div>

      {/* Packing Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Luggage className="h-5 w-5 text-primary" />
              Packing Progress
            </span>
            <Button variant="outline" size="sm" onClick={exportPackingList}>
              <Download className="h-4 w-4 mr-2" />
              Export List
            </Button>
          </CardTitle>
          <CardDescription>
            {checkedItems.size} of {packingItems.length} items packed ({getPackingProgress()}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-muted rounded-full h-3">
            <div 
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${getPackingProgress()}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Packing Categories */}
      {categories.map((category) => {
        const categoryItems = packingItems.filter(item => item.category === category);
        const checkedInCategory = categoryItems.filter(item => checkedItems.has(item.id)).length;
        
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getCategoryIcon(category)}
                {category}
                <Badge variant="secondary" className="ml-auto">
                  {checkedInCategory}/{categoryItems.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={item.id}
                      checked={checkedItems.has(item.id)}
                      onCheckedChange={() => toggleItem(item.id)}
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor={item.id}
                        className={`text-sm font-medium cursor-pointer ${
                          checkedItems.has(item.id) ? 'line-through text-muted-foreground' : ''
                        }`}
                      >
                        {item.name}
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        {item.essential && (
                          <Badge variant="destructive" className="text-xs">
                            Essential
                          </Badge>
                        )}
                        {item.weatherDependent && (
                          <Badge variant="outline" className="text-xs">
                            Weather
                          </Badge>
                        )}
                        {item.activitySpecific && (
                          <Badge variant="secondary" className="text-xs">
                            {item.activitySpecific}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {checkedItems.has(item.id) ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Carry-on Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Carry-on Optimization Tips</CardTitle>
          <CardDescription>
            Pack smart to fit everything in your carry-on
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-green-700">Packing Hacks</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Roll clothes instead of folding to save 30% space</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Wear your heaviest items (boots, coat) on the plane</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Use packing cubes to compress and organize</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Pack chargers in carry-on (electronics can fail)</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-blue-700">TSA Rules</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Liquids: 3-1-1 rule (3.4oz containers, 1 quart bag)</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Electronics larger than phone must be separate</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Medications in original containers</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Keep important docs easily accessible</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PackingList;