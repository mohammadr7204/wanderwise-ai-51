import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plane, Clock, DollarSign, ExternalLink, TrendingDown, AlertCircle, MapPin, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FlightOption {
  id: string;
  price: string;
  currency: string;
  airline: string;
  flightNumber: string;
  departure: {
    airport: string;
    time: string;
    date: string;
  };
  arrival: {
    airport: string;
    time: string;
    date: string;
  };
  duration: string;
  stops: number;
  layovers: string[];
  cabin: string;
  baggageIncluded: number;
}

interface FlightSearchResult {
  success: boolean;
  priceAnalysis: {
    priceRange: string;
    averagePrice: number;
    cheapestPrice: number;
    mostExpensivePrice: number;
  };
  cheapestDays: string[];
  bestBookingTime: string;
  priceCalendar: Array<{
    day: string;
    price: number;
    savings: number;
  }>;
  alternativeAirports: {
    origin: string[];
    destination: string[];
  };
  flightOptions: FlightOption[];
  bookingUrls: {
    googleFlights: string;
    kayak: string;
    expedia: string;
    skyscanner: string;
  };
  priceTrends: {
    direction: string;
    confidence: string;
    recommendation: string;
    seasonalFactors: string;
  };
  insights: {
    directFlightsAvailable: boolean;
    averageFlightTime: string;
    popularAirlines: string[];
    tips: string[];
  };
}

interface FlightAnalysisProps {
  tripData: any;
}

const FlightAnalysis = ({ tripData }: FlightAnalysisProps) => {
  const [flightData, setFlightData] = useState<FlightSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tripData?.form_data || tripData?.formData) {
      loadFlightData();
    }
  }, [tripData]);

  const loadFlightData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get data from either form structure
      const formData = tripData?.form_data || tripData?.formData || {};
      const destinations = formData.specificDestinations || [];
      const destination = destinations[0] || formData.destination || '';
      
      const params = {
        origin: formData.startingLocation || 'New York',
        destination: destination,
        departureDate: formData.startDate || new Date().toISOString().split('T')[0],
        returnDate: formData.endDate || '',
        passengers: parseInt(formData.groupSize) || 1,
        class: formData.flightClass || 'economy',
        directOnly: formData.directFlights || false
      };
      
      console.log('Searching flights with params:', params);
      
      const { data, error: functionError } = await supabase.functions.invoke('search-flights', {
        body: params
      });
      
      if (functionError) {
        throw new Error(functionError.message);
      }
      
      if (data.success) {
        setFlightData(data);
      } else {
        throw new Error(data.error || 'Flight search failed');
      }
    } catch (error: any) {
      console.error('Failed to load flight data:', error);
      setError(error.message);
      // Set fallback data
      setFlightData({
        success: false,
        priceAnalysis: {
          priceRange: '$300 - $800',
          averagePrice: 550,
          cheapestPrice: 300,
          mostExpensivePrice: 800
        },
        cheapestDays: ['Tuesday', 'Wednesday', 'Thursday'],
        bestBookingTime: '4-6 weeks ahead',
        priceCalendar: [],
        alternativeAirports: { origin: [], destination: [] },
        flightOptions: [],
        bookingUrls: {
          googleFlights: '#',
          kayak: '#',
          expedia: '#',
          skyscanner: '#'
        },
        priceTrends: {
          direction: 'stable',
          confidence: 'medium',
          recommendation: 'Monitor prices for better deals',
          seasonalFactors: 'Off-peak season'
        },
        insights: {
          directFlightsAvailable: true,
          averageFlightTime: 'Calculating...',
          popularAirlines: [],
          tips: [
            'Use flight comparison websites for best deals',
            'Consider flexible dates for cheaper options'
          ]
        }
      });
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
            <p className="font-semibold">{flightData?.priceAnalysis?.priceRange || 'Loading...'}</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Flight Time</p>
            <p className="font-semibold">{flightData?.insights?.averageFlightTime || 'Calculating...'}</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <TrendingDown className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Best Booking</p>
            <p className="font-semibold">{flightData?.bestBookingTime || 'Analyzing...'}</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Plane className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Direct Flights</p>
            <p className="font-semibold">{flightData?.insights?.directFlightsAvailable ? 'Available' : 'Connections'}</p>
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
              {(flightData?.cheapestDays || []).map((day) => (
                <Badge key={day} variant="secondary" className="text-green-700 bg-green-50">
                  {day}
                </Badge>
              ))}
            </div>
            
            {/* Price Calendar */}
            {flightData?.priceCalendar && flightData.priceCalendar.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Price by Day of Week</h4>
                <div className="grid grid-cols-7 gap-2 text-sm">
                  {flightData.priceCalendar.map((dayData) => (
                    <div key={dayData.day} className="text-center p-2 rounded border">
                      <div className="font-medium text-xs">{dayData.day.slice(0, 3)}</div>
                      <div className="text-lg">${dayData.price}</div>
                      {dayData.savings > 0 && (
                        <div className="text-green-600 text-xs">Save ${dayData.savings}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                <strong>Pro tip:</strong> {flightData?.priceTrends?.recommendation || 'Booking on Tuesday afternoons and flying mid-week can save you up to 30% on airfare.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real Flight Options */}
      {flightData?.flightOptions && flightData.flightOptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-primary" />
              Available Flights
            </CardTitle>
            <CardDescription>
              Live flight data with real prices and schedules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {flightData.flightOptions.slice(0, 3).map((flight) => (
              <div key={flight.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-lg">{flight.price}</div>
                    <div className="text-sm text-muted-foreground">{flight.airline} {flight.flightNumber}</div>
                  </div>
                  <Badge variant={flight.stops === 0 ? "default" : "secondary"}>
                    {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Departure</div>
                    <div>{flight.departure.time} from {flight.departure.airport}</div>
                    <div className="text-muted-foreground">{flight.departure.date}</div>
                  </div>
                  <div>
                    <div className="font-medium">Arrival</div>
                    <div>{flight.arrival.time} at {flight.arrival.airport}</div>
                    <div className="text-muted-foreground">{flight.arrival.date}</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span>Duration: {flight.duration}</span>
                  <span>Cabin: {flight.cabin}</span>
                  <span>Baggage: {flight.baggageIncluded} bags</span>
                </div>
                
                {flight.layovers.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Layovers: {flight.layovers.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Alternative Airports */}
      {flightData?.alternativeAirports && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Alternative Airports
            </CardTitle>
            <CardDescription>
              Consider these airports for potentially better deals
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Near {origin}</h4>
              <ul className="space-y-1 text-sm">
                {flightData.alternativeAirports.origin.map((airport, index) => (
                  <li key={index} className="text-muted-foreground">{airport}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Near {destination}</h4>
              <ul className="space-y-1 text-sm">
                {flightData.alternativeAirports.destination.map((airport, index) => (
                  <li key={index} className="text-muted-foreground">{airport}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flight Booking Options */}
      <Card>
        <CardHeader>
          <CardTitle>Find & Book Flights</CardTitle>
          <CardDescription>
            Compare prices across multiple platforms with real search parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Using fallback booking links. {error}
              </p>
            </div>
          )}
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4" asChild>
              <a 
                href={flightData?.bookingUrls?.googleFlights || `https://www.google.com/flights?hl=en#flt=${encodeURIComponent(origin)}.${encodeURIComponent(destination)}.${formData.startDate || '2024-06-01'};c:${(formData.flightClass || 'economy').toUpperCase()};e:1;sd:1;t:f`}
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
                href={flightData?.bookingUrls?.kayak || `https://www.kayak.com/flights/${encodeURIComponent(origin)}-${encodeURIComponent(destination)}/${formData.startDate || '2024-06-01'}/${formData.endDate || '2024-06-08'}?sort=bestflight_a`}
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
            
            <Button variant="outline" className="h-auto p-4" asChild>
              <a 
                href={flightData?.bookingUrls?.expedia || `https://www.expedia.com/Flights-Search?trip=roundtrip&leg1=from:${encodeURIComponent(origin)},to:${encodeURIComponent(destination)},departure:${formData.startDate || '2024-06-01'}&leg2=from:${encodeURIComponent(destination)},to:${encodeURIComponent(origin)},departure:${formData.endDate || '2024-06-08'}&passengers=adults:${formData.groupSize || 1},children:0,infants:0,infantinlap:N&mode=search`}
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
                href={flightData?.bookingUrls?.skyscanner || `https://www.skyscanner.com/transport/flights/${encodeURIComponent(origin.toLowerCase())}/${encodeURIComponent(destination.toLowerCase())}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="text-center">
                  <ExternalLink className="h-5 w-5 mx-auto mb-2" />
                  <p className="font-medium">Skyscanner</p>
                  <p className="text-xs text-muted-foreground">Best deals</p>
                </div>
              </a>
            </Button>
          </div>
          
          <div className="space-y-3">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Smart Money-Saving Tips</h4>
              <ul className="text-sm text-green-700 space-y-1">
                {flightData?.insights?.tips?.map((tip, index) => (
                  <li key={index}>• {tip}</li>
                )) || [
                  '• Set up price alerts on multiple platforms',
                  '• Consider nearby airports for better deals',
                  '• Book round-trip tickets for international flights',
                  '• Clear your browser cookies before booking'
                ]}
              </ul>
            </div>
            
            {flightData?.priceTrends && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Price Trend Analysis</h4>
                <p className="text-sm text-blue-700 mb-2">
                  <strong>Direction:</strong> Prices are {flightData.priceTrends.direction}
                </p>
                <p className="text-sm text-blue-700 mb-2">
                  <strong>Seasonal factor:</strong> {flightData.priceTrends.seasonalFactors}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Recommendation:</strong> {flightData.priceTrends.recommendation}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FlightAnalysis;