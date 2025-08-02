export const AI_PROMPTS = {
  flightFinder: (origin: string, destination: string, dates: string) =>
    `Flying ${origin} to ${destination} during ${dates}. Find the cheapest days to fly and best booking time.`,
  
  packingList: (duration: string, climate: string, activities: string) =>
    `${duration} trip to ${climate} doing ${activities}. Create a packing list that fits in carry-on but handles every situation.`,
  
  scamPrevention: (destination: string) =>
    `Common tourist scams in ${destination}? Include exact phrases scammers use and how to shut them down politely.`,
  
  emergencyPlan: (destination: string) =>
    `If something goes wrong in ${destination}, who do I call? What do I say? Where do I go? Create a wallet card with critical info.`,
  
  budgetBreakdown: (destination: string, days: number, budget: number) =>
    `Trip to ${destination} for ${days} with a budget of $${budget}. Allocate every dollar optimally, including emergency fund and splurge moment.`,
  
  experienceFinder: (destination: string) =>
    `Going to ${destination}. Skip the tourist traps. Find where locals actually eat, drink, and hang out. Include phrases to order in the local language.`,
  
  itineraryOptimizer: (attractions: string[], city: string) =>
    `Want to see ${attractions.join(', ')} in ${city}. Map the most efficient route considering opening hours, crowds, and energy levels. Include bathroom stops.`,
  
  dietaryFood: (restriction: string, country: string) =>
    `I'm ${restriction} visiting ${country}. Which local dishes are safe? Key phrases to communicate needs? Restaurant recommendations?`
};

export interface FlightData {
  cheapestDays: string[];
  bestBookingTime: string;
  priceRange: string;
  directFlights: boolean;
  averageFlightTime: string;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  class: string;
  directOnly: boolean;
}

export const searchFlights = async (params: FlightSearchParams): Promise<FlightData> => {
  // Generate dynamic flight data based on route distance and destination
  const getRouteData = (origin: string, destination: string) => {
    // Simple distance estimation for price/time calculation
    const isInternational = origin.toLowerCase().includes('us') && !destination.toLowerCase().includes('us');
    const isLongHaul = isInternational || destination.toLowerCase().includes('europe') || destination.toLowerCase().includes('asia');
    
    let basePrice = 200;
    let flightTime = '2h 30m';
    let bookingWeeks = '3-4 weeks';
    
    if (isLongHaul) {
      basePrice = 600;
      flightTime = '8h 30m';
      bookingWeeks = '6-8 weeks';
    } else if (isInternational) {
      basePrice = 400;
      flightTime = '5h 15m';
      bookingWeeks = '4-6 weeks';
    }
    
    // Add seasonal variation
    const currentMonth = new Date().getMonth();
    const isHighSeason = [5, 6, 7, 11].includes(currentMonth); // June, July, August, December
    if (isHighSeason) basePrice *= 1.4;
    
    return {
      priceRange: `$${Math.round(basePrice * 0.8)} - $${Math.round(basePrice * 1.3)}`,
      averageFlightTime: flightTime,
      bestBookingTime: `${bookingWeeks} before departure`,
      directFlights: !isLongHaul || destination.toLowerCase().includes('major city'),
      cheapestDays: isLongHaul ? ['Tuesday', 'Wednesday', 'Thursday'] : ['Tuesday', 'Wednesday', 'Saturday']
    };
  };
  
  const routeData = getRouteData(params.origin, params.destination);
  
  return {
    cheapestDays: routeData.cheapestDays,
    bestBookingTime: routeData.bestBookingTime,
    priceRange: routeData.priceRange,
    directFlights: routeData.directFlights,
    averageFlightTime: routeData.averageFlightTime
  };
};