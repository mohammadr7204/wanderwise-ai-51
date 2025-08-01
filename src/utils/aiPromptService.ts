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
  // This would integrate with a real flight API in production
  // For now, return mock data
  return {
    cheapestDays: ['Tuesday', 'Wednesday', 'Thursday'],
    bestBookingTime: '6-8 weeks before departure',
    priceRange: '$400 - $800',
    directFlights: true,
    averageFlightTime: '8h 30m'
  };
};