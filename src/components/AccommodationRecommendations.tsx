import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, DollarSign, ExternalLink, Wifi, Car, Coffee, Utensils } from 'lucide-react';
import { AccommodationRecommendation } from '@/hooks/useAccommodationRecommendations';

interface AccommodationRecommendationsProps {
  accommodations: AccommodationRecommendation[];
  destination: string;
  startDate?: string;
  endDate?: string;
  groupSize?: number;
}

const AccommodationRecommendations: React.FC<AccommodationRecommendationsProps> = ({
  accommodations,
  destination,
  startDate,
  endDate,
  groupSize = 2
}) => {
  const getAmenityIcon = (amenity: string) => {
    const lowerAmenity = amenity.toLowerCase();
    if (lowerAmenity.includes('wifi') || lowerAmenity.includes('internet')) return <Wifi className="h-3 w-3" />;
    if (lowerAmenity.includes('parking') || lowerAmenity.includes('garage')) return <Car className="h-3 w-3" />;
    if (lowerAmenity.includes('coffee') || lowerAmenity.includes('breakfast')) return <Coffee className="h-3 w-3" />;
    if (lowerAmenity.includes('restaurant') || lowerAmenity.includes('dining')) return <Utensils className="h-3 w-3" />;
    return null;
  };

  const formatBookingUrl = (accommodation: AccommodationRecommendation, platform: 'booking' | 'airbnb' | 'hotels' | 'expedia') => {
    const checkIn = startDate || '';
    const checkOut = endDate || '';
    const guests = groupSize.toString();
    
    const query = `${accommodation.name} ${accommodation.address}`;
    
    switch (platform) {
      case 'booking':
        return `https://www.booking.com/search.html?ss=${encodeURIComponent(query)}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${guests}`;
      case 'airbnb':
        return `https://www.airbnb.com/s/${encodeURIComponent(accommodation.address)}/homes?adults=${guests}&checkin=${checkIn}&checkout=${checkOut}`;
      case 'hotels':
        return `https://www.hotels.com/search.do?q-destination=${encodeURIComponent(accommodation.address)}&q-check-in=${checkIn}&q-check-out=${checkOut}&q-rooms=1&q-room-0-adults=${guests}`;
      case 'expedia':
        return `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(accommodation.address)}&startDate=${checkIn}&endDate=${checkOut}&rooms=1&adults=${guests}`;
      default:
        return '#';
    }
  };

  if (accommodations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Accommodation Recommendations Found</h3>
            <p className="text-muted-foreground">
              It looks like accommodation recommendations weren't generated for this itinerary.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Accommodation Recommendations</h2>
        <p className="text-muted-foreground">
          Carefully selected accommodation options with live booking links
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {accommodations.map((accommodation, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold">
                    {accommodation.name}
                  </CardTitle>
                  <CardDescription>{accommodation.type}</CardDescription>
                </div>
                {accommodation.rating && (
                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-md">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{accommodation.rating}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{accommodation.address}</p>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium text-green-600">{accommodation.priceRange}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Amenities</p>
                <div className="flex flex-wrap gap-1">
                  {accommodation.amenities.map((amenity, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs flex items-center gap-1">
                      {getAmenityIcon(amenity)}
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Why Perfect for Your Trip</p>
                <p className="text-sm text-muted-foreground">{accommodation.whyPerfect}</p>
              </div>

              {accommodation.bookingTip && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Booking Tip</p>
                  <p className="text-sm text-muted-foreground">{accommodation.bookingTip}</p>
                </div>
              )}

              {accommodation.distanceToActivities && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Location Benefits</p>
                  <p className="text-sm text-muted-foreground">{accommodation.distanceToActivities}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  asChild
                >
                  <a
                    href={formatBookingUrl(accommodation, 'booking')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <div className="text-blue-600 font-semibold">Booking</div>
                  </a>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  asChild
                >
                  <a
                    href={formatBookingUrl(accommodation, 'airbnb')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <div className="text-red-500 font-semibold">Airbnb</div>
                  </a>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  asChild
                >
                  <a
                    href={formatBookingUrl(accommodation, 'hotels')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <div className="text-purple-600 font-semibold">Hotels.com</div>
                  </a>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  asChild
                >
                  <a
                    href={formatBookingUrl(accommodation, 'expedia')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <div className="text-orange-600 font-semibold">Expedia</div>
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AccommodationRecommendations;