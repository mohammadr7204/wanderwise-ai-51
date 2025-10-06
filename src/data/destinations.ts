export interface Destination {
  name: string;
  type: 'city' | 'country';
  country?: string;
  region: string;
  searchTerms: string[];
}

export const destinations: Destination[] = [
  // North America - United States
  { name: "New York", type: "city", country: "United States", region: "North America", searchTerms: ["nyc", "manhattan", "big apple"] },
  { name: "Los Angeles", type: "city", country: "United States", region: "North America", searchTerms: ["la", "hollywood", "california"] },
  { name: "Chicago", type: "city", country: "United States", region: "North America", searchTerms: ["windy city", "illinois"] },
  { name: "Miami", type: "city", country: "United States", region: "North America", searchTerms: ["florida", "south beach"] },
  { name: "San Francisco", type: "city", country: "United States", region: "North America", searchTerms: ["sf", "bay area", "california"] },
  { name: "Las Vegas", type: "city", country: "United States", region: "North America", searchTerms: ["vegas", "nevada", "sin city"] },
  { name: "Seattle", type: "city", country: "United States", region: "North America", searchTerms: ["washington", "emerald city"] },
  { name: "Boston", type: "city", country: "United States", region: "North America", searchTerms: ["massachusetts"] },
  { name: "Washington DC", type: "city", country: "United States", region: "North America", searchTerms: ["dc", "capital"] },
  { name: "United States", type: "country", region: "North America", searchTerms: ["usa", "america"] },
  
  // North America - Canada
  { name: "Toronto", type: "city", country: "Canada", region: "North America", searchTerms: ["ontario"] },
  { name: "Vancouver", type: "city", country: "Canada", region: "North America", searchTerms: ["british columbia", "bc"] },
  { name: "Montreal", type: "city", country: "Canada", region: "North America", searchTerms: ["quebec"] },
  { name: "Canada", type: "country", region: "North America", searchTerms: [] },
  
  // North America - Mexico
  { name: "Mexico City", type: "city", country: "Mexico", region: "North America", searchTerms: ["cdmx"] },
  { name: "Cancun", type: "city", country: "Mexico", region: "North America", searchTerms: ["quintana roo", "riviera maya"] },
  { name: "Playa del Carmen", type: "city", country: "Mexico", region: "North America", searchTerms: ["riviera maya"] },
  { name: "Mexico", type: "country", region: "North America", searchTerms: [] },
  
  // Europe - United Kingdom
  { name: "London", type: "city", country: "United Kingdom", region: "Europe", searchTerms: ["england", "uk"] },
  { name: "Edinburgh", type: "city", country: "United Kingdom", region: "Europe", searchTerms: ["scotland"] },
  { name: "Manchester", type: "city", country: "United Kingdom", region: "Europe", searchTerms: ["england"] },
  { name: "United Kingdom", type: "country", region: "Europe", searchTerms: ["uk", "britain", "great britain"] },
  
  // Europe - France
  { name: "Paris", type: "city", country: "France", region: "Europe", searchTerms: ["city of light"] },
  { name: "Nice", type: "city", country: "France", region: "Europe", searchTerms: ["french riviera", "cote d'azur"] },
  { name: "Lyon", type: "city", country: "France", region: "Europe", searchTerms: [] },
  { name: "France", type: "country", region: "Europe", searchTerms: [] },
  
  // Europe - Italy
  { name: "Rome", type: "city", country: "Italy", region: "Europe", searchTerms: ["eternal city"] },
  { name: "Venice", type: "city", country: "Italy", region: "Europe", searchTerms: ["venezia"] },
  { name: "Florence", type: "city", country: "Italy", region: "Europe", searchTerms: ["firenze", "tuscany"] },
  { name: "Milan", type: "city", country: "Italy", region: "Europe", searchTerms: ["milano"] },
  { name: "Italy", type: "country", region: "Europe", searchTerms: [] },
  
  // Europe - Spain
  { name: "Barcelona", type: "city", country: "Spain", region: "Europe", searchTerms: ["catalonia"] },
  { name: "Madrid", type: "city", country: "Spain", region: "Europe", searchTerms: [] },
  { name: "Seville", type: "city", country: "Spain", region: "Europe", searchTerms: ["sevilla", "andalusia"] },
  { name: "Spain", type: "country", region: "Europe", searchTerms: [] },
  
  // Europe - Germany
  { name: "Berlin", type: "city", country: "Germany", region: "Europe", searchTerms: [] },
  { name: "Munich", type: "city", country: "Germany", region: "Europe", searchTerms: ["bavaria"] },
  { name: "Hamburg", type: "city", country: "Germany", region: "Europe", searchTerms: [] },
  { name: "Germany", type: "country", region: "Europe", searchTerms: [] },
  
  // Europe - Other
  { name: "Amsterdam", type: "city", country: "Netherlands", region: "Europe", searchTerms: ["holland"] },
  { name: "Netherlands", type: "country", region: "Europe", searchTerms: ["holland"] },
  { name: "Brussels", type: "city", country: "Belgium", region: "Europe", searchTerms: [] },
  { name: "Belgium", type: "country", region: "Europe", searchTerms: [] },
  { name: "Vienna", type: "city", country: "Austria", region: "Europe", searchTerms: ["wien"] },
  { name: "Austria", type: "country", region: "Europe", searchTerms: [] },
  { name: "Prague", type: "city", country: "Czech Republic", region: "Europe", searchTerms: ["praha"] },
  { name: "Czech Republic", type: "country", region: "Europe", searchTerms: ["czechia"] },
  { name: "Copenhagen", type: "city", country: "Denmark", region: "Europe", searchTerms: [] },
  { name: "Denmark", type: "country", region: "Europe", searchTerms: [] },
  { name: "Stockholm", type: "city", country: "Sweden", region: "Europe", searchTerms: [] },
  { name: "Sweden", type: "country", region: "Europe", searchTerms: [] },
  { name: "Oslo", type: "city", country: "Norway", region: "Europe", searchTerms: [] },
  { name: "Norway", type: "country", region: "Europe", searchTerms: [] },
  { name: "Helsinki", type: "city", country: "Finland", region: "Europe", searchTerms: [] },
  { name: "Finland", type: "country", region: "Europe", searchTerms: [] },
  { name: "Zurich", type: "city", country: "Switzerland", region: "Europe", searchTerms: [] },
  { name: "Switzerland", type: "country", region: "Europe", searchTerms: [] },
  { name: "Lisbon", type: "city", country: "Portugal", region: "Europe", searchTerms: ["lisboa"] },
  { name: "Portugal", type: "country", region: "Europe", searchTerms: [] },
  { name: "Athens", type: "city", country: "Greece", region: "Europe", searchTerms: [] },
  { name: "Greece", type: "country", region: "Europe", searchTerms: [] },
  { name: "Dublin", type: "city", country: "Ireland", region: "Europe", searchTerms: [] },
  { name: "Ireland", type: "country", region: "Europe", searchTerms: [] },
  { name: "Warsaw", type: "city", country: "Poland", region: "Europe", searchTerms: ["warszawa"] },
  { name: "Poland", type: "country", region: "Europe", searchTerms: [] },
  { name: "Budapest", type: "city", country: "Hungary", region: "Europe", searchTerms: [] },
  { name: "Hungary", type: "country", region: "Europe", searchTerms: [] },
  { name: "Iceland", type: "country", region: "Europe", searchTerms: ["reykjavik"] },
  
  // Asia - Japan
  { name: "Tokyo", type: "city", country: "Japan", region: "Asia", searchTerms: [] },
  { name: "Kyoto", type: "city", country: "Japan", region: "Asia", searchTerms: [] },
  { name: "Osaka", type: "city", country: "Japan", region: "Asia", searchTerms: [] },
  { name: "Japan", type: "country", region: "Asia", searchTerms: [] },
  
  // Asia - China
  { name: "Beijing", type: "city", country: "China", region: "Asia", searchTerms: [] },
  { name: "Shanghai", type: "city", country: "China", region: "Asia", searchTerms: [] },
  { name: "Hong Kong", type: "city", country: "China", region: "Asia", searchTerms: [] },
  { name: "China", type: "country", region: "Asia", searchTerms: [] },
  
  // Asia - Southeast Asia
  { name: "Bangkok", type: "city", country: "Thailand", region: "Asia", searchTerms: [] },
  { name: "Phuket", type: "city", country: "Thailand", region: "Asia", searchTerms: [] },
  { name: "Thailand", type: "country", region: "Asia", searchTerms: [] },
  { name: "Singapore", type: "country", region: "Asia", searchTerms: [] },
  { name: "Bali", type: "city", country: "Indonesia", region: "Asia", searchTerms: ["denpasar"] },
  { name: "Jakarta", type: "city", country: "Indonesia", region: "Asia", searchTerms: [] },
  { name: "Indonesia", type: "country", region: "Asia", searchTerms: [] },
  { name: "Ho Chi Minh City", type: "city", country: "Vietnam", region: "Asia", searchTerms: ["saigon"] },
  { name: "Hanoi", type: "city", country: "Vietnam", region: "Asia", searchTerms: [] },
  { name: "Vietnam", type: "country", region: "Asia", searchTerms: [] },
  { name: "Kuala Lumpur", type: "city", country: "Malaysia", region: "Asia", searchTerms: ["kl"] },
  { name: "Malaysia", type: "country", region: "Asia", searchTerms: [] },
  { name: "Manila", type: "city", country: "Philippines", region: "Asia", searchTerms: [] },
  { name: "Philippines", type: "country", region: "Asia", searchTerms: [] },
  
  // Asia - South Asia
  { name: "Mumbai", type: "city", country: "India", region: "Asia", searchTerms: ["bombay"] },
  { name: "Delhi", type: "city", country: "India", region: "Asia", searchTerms: ["new delhi"] },
  { name: "Bangalore", type: "city", country: "India", region: "Asia", searchTerms: ["bengaluru"] },
  { name: "India", type: "country", region: "Asia", searchTerms: [] },
  { name: "Dubai", type: "city", country: "United Arab Emirates", region: "Asia", searchTerms: ["uae"] },
  { name: "United Arab Emirates", type: "country", region: "Asia", searchTerms: ["uae", "emirates"] },
  { name: "Istanbul", type: "city", country: "Turkey", region: "Asia", searchTerms: [] },
  { name: "Turkey", type: "country", region: "Asia", searchTerms: [] },
  
  // Asia - Other
  { name: "Seoul", type: "city", country: "South Korea", region: "Asia", searchTerms: [] },
  { name: "South Korea", type: "country", region: "Asia", searchTerms: ["korea"] },
  { name: "Taipei", type: "city", country: "Taiwan", region: "Asia", searchTerms: [] },
  { name: "Taiwan", type: "country", region: "Asia", searchTerms: [] },
  
  // Oceania
  { name: "Sydney", type: "city", country: "Australia", region: "Oceania", searchTerms: [] },
  { name: "Melbourne", type: "city", country: "Australia", region: "Oceania", searchTerms: [] },
  { name: "Brisbane", type: "city", country: "Australia", region: "Oceania", searchTerms: [] },
  { name: "Australia", type: "country", region: "Oceania", searchTerms: [] },
  { name: "Auckland", type: "city", country: "New Zealand", region: "Oceania", searchTerms: [] },
  { name: "Wellington", type: "city", country: "New Zealand", region: "Oceania", searchTerms: [] },
  { name: "New Zealand", type: "country", region: "Oceania", searchTerms: [] },
  
  // South America
  { name: "Rio de Janeiro", type: "city", country: "Brazil", region: "South America", searchTerms: ["rio"] },
  { name: "São Paulo", type: "city", country: "Brazil", region: "South America", searchTerms: ["sao paulo"] },
  { name: "Brazil", type: "country", region: "South America", searchTerms: [] },
  { name: "Buenos Aires", type: "city", country: "Argentina", region: "South America", searchTerms: [] },
  { name: "Argentina", type: "country", region: "South America", searchTerms: [] },
  { name: "Lima", type: "city", country: "Peru", region: "South America", searchTerms: [] },
  { name: "Peru", type: "country", region: "South America", searchTerms: ["machu picchu"] },
  { name: "Bogotá", type: "city", country: "Colombia", region: "South America", searchTerms: ["bogota"] },
  { name: "Colombia", type: "country", region: "South America", searchTerms: [] },
  { name: "Santiago", type: "city", country: "Chile", region: "South America", searchTerms: [] },
  { name: "Chile", type: "country", region: "South America", searchTerms: [] },
  { name: "Ecuador", type: "country", region: "South America", searchTerms: ["galapagos"] },
  
  // Africa
  { name: "Cairo", type: "city", country: "Egypt", region: "Africa", searchTerms: [] },
  { name: "Egypt", type: "country", region: "Africa", searchTerms: ["pyramids"] },
  { name: "Cape Town", type: "city", country: "South Africa", region: "Africa", searchTerms: [] },
  { name: "Johannesburg", type: "city", country: "South Africa", region: "Africa", searchTerms: [] },
  { name: "South Africa", type: "country", region: "Africa", searchTerms: [] },
  { name: "Marrakech", type: "city", country: "Morocco", region: "Africa", searchTerms: [] },
  { name: "Morocco", type: "country", region: "Africa", searchTerms: [] },
  { name: "Kenya", type: "country", region: "Africa", searchTerms: ["safari", "nairobi"] },
  { name: "Tanzania", type: "country", region: "Africa", searchTerms: ["safari", "zanzibar", "serengeti"] },
  
  // Caribbean
  { name: "Jamaica", type: "country", region: "Caribbean", searchTerms: ["kingston", "montego bay"] },
  { name: "Bahamas", type: "country", region: "Caribbean", searchTerms: ["nassau"] },
  { name: "Barbados", type: "country", region: "Caribbean", searchTerms: [] },
  { name: "Cuba", type: "country", region: "Caribbean", searchTerms: ["havana"] },
  { name: "Dominican Republic", type: "country", region: "Caribbean", searchTerms: ["punta cana"] },
  
  // Central America
  { name: "Costa Rica", type: "country", region: "Central America", searchTerms: ["san jose"] },
  { name: "Panama", type: "country", region: "Central America", searchTerms: ["panama city"] },
  { name: "Guatemala", type: "country", region: "Central America", searchTerms: [] },
  { name: "Belize", type: "country", region: "Central America", searchTerms: [] },
  
  // Middle East
  { name: "Tel Aviv", type: "city", country: "Israel", region: "Middle East", searchTerms: [] },
  { name: "Jerusalem", type: "city", country: "Israel", region: "Middle East", searchTerms: [] },
  { name: "Israel", type: "country", region: "Middle East", searchTerms: [] },
  { name: "Doha", type: "city", country: "Qatar", region: "Middle East", searchTerms: [] },
  { name: "Qatar", type: "country", region: "Middle East", searchTerms: [] },
  { name: "Jordan", type: "country", region: "Middle East", searchTerms: ["petra", "amman"] },
];
