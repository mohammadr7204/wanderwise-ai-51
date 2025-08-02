import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plane, Clock, DollarSign, ExternalLink, TrendingDown, AlertCircle } from 'lucide-react';
import { FlightData, FlightSearchParams, searchFlights } from '@/utils/aiPromptService';

interface FlightAnalysisProps {
  tripData: any;
}

const FlightAnalysis = ({ tripData }: FlightAnalysisProps) => {
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tripData?.form_data || tripData?.formData) {
      loadFlightData();
    }
  }, [tripData]);

  const loadFlightData = async () => {
    setLoading(true);
    try {
      // Get data from either form structure
      const formData = tripData?.form_data || tripData?.formData || {};
      const destinations = formData.specificDestinations || [];
      const destination = destinations[0] || formData.destination || '';
      
      const params: FlightSearchParams = {
        origin: formData.startingLocation || 'Your Location',
        destination: destination,
        departureDate: formData.startDate || '',
        returnDate: formData.endDate || '',
        passengers: parseInt(formData.groupSize) || 1,
        class: formData.flightClass || 'economy',
        directOnly: formData.directFlights || false
      };
      
      const data = await searchFlights(params);
      setFlightData(data);
    } catch (error) {
      console.error('Failed to load flight data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-24 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  const formData = tripData?.form_data || tripData?.formData || {};
  const destinations = formData.specificDestinations || [];
  const origin = formData.startingLocation || 'Your Location';
  const destination = destinations[0] || formData.destination || 'Your Destination';

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Flight Analysis</h2>
        <p className="text-muted-foreground">
          Smart insights for your journey from {origin} to {destination}
        </p>
      </div>

      {/* Flight Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-primary" />
            Flight Overview
          </CardTitle>
          <CardDescription>
            Based on your preferences and current market data
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Price Range</p>
            <p className="font-semibold">{flightData?.priceRange || '$400 - $800'}</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Flight Time</p>
            <p className="font-semibold">{flightData?.averageFlightTime || '8h 30m'}</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <TrendingDown className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Best Booking</p>
            <p className="font-semibold">{flightData?.bestBookingTime || '6-8 weeks ahead'}</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Plane className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Direct Flights</p>
            <p className="font-semibold">{flightData?.directFlights ? 'Available' : 'Connections'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Cheapest Days */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Cheapest Days to Fly
          </CardTitle>
          <CardDescription>
            Save money by choosing the right departure days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Based on historical pricing data, these days typically offer the best deals:
            </p>
            <div className="flex flex-wrap gap-2">
              {(flightData?.cheapestDays || ['Tuesday', 'Wednesday', 'Thursday']).map((day) => (
                <Badge key={day} variant="secondary" className="text-green-700 bg-green-50">
                  {day}
                </Badge>
              ))}
            </div>
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                <strong>Pro tip:</strong> Booking on Tuesday afternoons and flying mid-week can save you up to 30% on airfare.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flight Booking Options */}
      <Card>
        <CardHeader>
          <CardTitle>Find & Book Flights</CardTitle>
          <CardDescription>
            Compare prices across multiple platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4" asChild>
              <a 
                href={`https://www.google.com/flights?hl=en#flt=${encodeURIComponent(origin)}.${encodeURIComponent(destination)}.${formData.startDate || '2024-06-01'};c:${(formData.flightClass || 'economy').toUpperCase()};e:1;sd:1;t:f`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="text-center">
                  <ExternalLink className="h-5 w-5 mx-auto mb-2" />
                  <p className="font-medium">Google Flights</p>
                  <p className="text-xs text-muted-foreground">Best for comparison</p>
                </div>
              </a>
            </Button>
            
            <Button variant="outline" className="h-auto p-4" asChild>
              <a 
                href={`https://www.expedia.com/Flights-Search?trip=roundtrip&leg1=from:${encodeURIComponent(origin)},to:${encodeURIComponent(destination)},departure:${formData.startDate || '2024-06-01'}&leg2=from:${encodeURIComponent(destination)},to:${encodeURIComponent(origin)},departure:${formData.endDate || '2024-06-08'}&passengers=adults:${formData.groupSize || 1},children:0,infants:0,infantinlap:N&mode=search`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="text-center">
                  <ExternalLink className="h-5 w-5 mx-auto mb-2" />
                  <p className="font-medium">Expedia</p>
                  <p className="text-xs text-muted-foreground">Package deals</p>
                </div>
              </a>
            </Button>
            
            <Button variant="outline" className="h-auto p-4" asChild>
              <a 
                href={`https://www.kayak.com/flights/${encodeURIComponent(origin)}-${encodeURIComponent(destination)}/${formData.startDate || '2024-06-01'}/${formData.endDate || '2024-06-08'}?sort=bestflight_a`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="text-center">
                  <ExternalLink className="h-5 w-5 mx-auto mb-2" />
                  <p className="font-medium">Kayak</p>
                  <p className="text-xs text-muted-foreground">Price tracking</p>
                </div>
              </a>
            </Button>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Money-Saving Tips</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Set up price alerts on Google Flights</li>
              <li>• Consider nearby airports for better deals</li>
              <li>• Book round-trip tickets for international flights</li>
              <li>• Clear your browser cookies before booking</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FlightAnalysis;