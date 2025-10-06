import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, 
  MapPin, 
  DollarSign, 
  ExternalLink, 
  Phone, 
  Clock, 
  Utensils,
  Coffee,
  Sunset,
  Users,
  AlertTriangle,
  Languages,
  Bookmark
} from 'lucide-react';
import { RestaurantRecommendation } from '@/hooks/useRestaurantRecommendations';

interface RestaurantRecommendationsProps {
  restaurants: RestaurantRecommendation[];
  destination: string;
  groupSize?: number;
}

const RestaurantRecommendations: React.FC<RestaurantRecommendationsProps> = ({
  restaurants,
  destination,
  groupSize = 2
}) => {
  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return <Coffee className="h-4 w-4" />;
      case 'lunch': return <Utensils className="h-4 w-4" />;
      case 'dinner': return <Sunset className="h-4 w-4" />;
      default: return <Utensils className="h-4 w-4" />;
    }
  };

  const getPriceRangeColor = (priceRange: string) => {
    switch (priceRange) {
      case 'budget': return 'bg-green-100 text-green-800';
      case 'mid-range': return 'bg-yellow-100 text-yellow-800';
      case 'splurge': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubcategoryBadge = (subcategory: string) => {
    const colors = {
      'hotel restaurant': 'bg-blue-100 text-blue-800',
      'local café': 'bg-orange-100 text-orange-800',
      'bakery': 'bg-amber-100 text-amber-800',
      'quick bite': 'bg-green-100 text-green-800',
      'sit-down': 'bg-purple-100 text-purple-800',
      'food market': 'bg-pink-100 text-pink-800',
      'local favorite': 'bg-emerald-100 text-emerald-800',
      'special occasion': 'bg-red-100 text-red-800',
      'casual dining': 'bg-indigo-100 text-indigo-800'
    };
    return colors[subcategory as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const groupByMealType = (restaurants: RestaurantRecommendation[]) => {
    return restaurants.reduce((acc, restaurant) => {
      if (!acc[restaurant.mealType]) {
        acc[restaurant.mealType] = [];
      }
      acc[restaurant.mealType].push(restaurant);
      return acc;
    }, {} as Record<string, RestaurantRecommendation[]>);
  };

  if (restaurants.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Restaurant Recommendations Found</h3>
            <p className="text-muted-foreground">
              It looks like restaurant recommendations weren't generated for this itinerary.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mealTypes = ['breakfast', 'lunch', 'dinner'];
  const groupedRestaurants = groupByMealType(restaurants);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Restaurant Guide</h2>
        <p className="text-muted-foreground">
          Curated dining recommendations with dietary options and booking information
        </p>
      </div>

      <Tabs defaultValue="breakfast" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {mealTypes.map((mealType) => (
            <TabsTrigger 
              key={mealType} 
              value={mealType}
              className="flex items-center gap-2"
            >
              {getMealIcon(mealType)}
              {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              <Badge variant="secondary" className="ml-1">
                {groupedRestaurants[mealType]?.length || 0}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {mealTypes.map((mealType) => (
          <TabsContent key={mealType} value={mealType} className="space-y-4">
            {groupedRestaurants[mealType]?.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {groupedRestaurants[mealType].map((restaurant, index) => (
                  <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold line-clamp-1">
                            {restaurant.name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Badge className={getSubcategoryBadge(restaurant.subcategory)}>
                              {restaurant.subcategory}
                            </Badge>
                            <span>•</span>
                            <span>{restaurant.cuisine}</span>
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {restaurant.rating && (
                            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-md">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">{restaurant.rating}</span>
                            </div>
                          )}
                          <Badge className={getPriceRangeColor(restaurant.priceRange)}>
                            ${restaurant.avgCostPerPerson}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                      </div>

                      <p className="text-sm">{restaurant.description}</p>

                      {restaurant.signature_dishes.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium flex items-center gap-1">
                            <Bookmark className="h-3 w-3" />
                            Signature Dishes
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {restaurant.signature_dishes.slice(0, 3).map((dish, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {dish}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Dietary Options */}
                      {Object.entries(restaurant.dietary_options).some(([_, options]) => options.length > 0) && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Dietary Options</p>
                          <div className="space-y-1">
                            {Object.entries(restaurant.dietary_options)
                              .filter(([_, options]) => options.length > 0)
                              .map(([type, options]) => (
                                <div key={type} className="text-xs">
                                  <span className="font-medium capitalize">{type.replace('_', ' ')}: </span>
                                  <span className="text-muted-foreground">{options.slice(0, 2).join(', ')}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Allergen Warnings */}
                      {restaurant.allergen_warnings.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-orange-700 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Allergen Warnings
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {restaurant.allergen_warnings.map((warning, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                {warning}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Booking Information */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Booking Info
                        </p>
                        <div className="text-xs space-y-1">
                          <div>
                            <span className="font-medium">Best time: </span>
                            <span className="text-muted-foreground">{restaurant.booking_info.best_time_to_visit}</span>
                          </div>
                          <div>
                            <span className="font-medium">Wait time: </span>
                            <span className="text-muted-foreground">{restaurant.booking_info.avg_wait_time}</span>
                          </div>
                          <div>
                            <span className="font-medium">Tip: </span>
                            <span className="text-muted-foreground">{restaurant.booking_info.booking_tip}</span>
                          </div>
                        </div>
                      </div>

                      {/* Local Phrases */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium flex items-center gap-1">
                          <Languages className="h-3 w-3" />
                          Useful Phrases
                        </p>
                        <div className="text-xs space-y-1">
                          <div>
                            <span className="font-medium">Ask for recommendation: </span>
                            <span className="text-muted-foreground italic">{restaurant.local_phrases.recommendation}</span>
                          </div>
                          {Object.entries(restaurant.dietary_options).some(([_, options]) => options.length > 0) && (
                            <div>
                              <span className="font-medium">Dietary needs: </span>
                              <span className="text-muted-foreground italic">{restaurant.local_phrases.dietary_request}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          asChild
                        >
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <MapPin className="h-3 w-3" />
                            Get Directions
                          </a>
                        </Button>
                        
                        <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                          <span className="font-medium">Why perfect: </span>
                          {restaurant.why_perfect}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No {mealType} recommendations available for this destination.
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default RestaurantRecommendations;