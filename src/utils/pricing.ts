import { TripFormData } from '@/pages/CreateTrip';

export interface PricingBreakdown {
  basePrice: number;
  groupSizeMultiplier: number;
  durationMultiplier: number;
  destinationMultiplier: number;
  rushMultiplier: number;
  subtotal: number;
  total: number;
}

export interface ServiceTier {
  id: 'standard' | 'executive';
  name: string;
  basePrice: number;
  description: string;
  features: string[];
}

export const SERVICE_TIERS: ServiceTier[] = [
  {
    id: 'standard',
    name: 'Standard Plan',
    basePrice: 25,
    description: 'Complete AI travel planning service',
    features: [
      'Full AI-generated itinerary (unlimited duration)',
      'Restaurant and activity recommendations with booking links',
      'Accommodation suggestions with booking links',
      'Transportation recommendations',
      'Human booking assistance for hotels & activities',
      'Flight booking guidance',
      'Multiple destination planning',
      '1 free revision with human review',
      'PDF itinerary export',
      'Delivered in 5-10 minutes',
      'Email support (24hr response)'
    ]
  },
  {
    id: 'executive',
    name: 'Executive Concierge',
    basePrice: 500,
    description: 'White-glove travel planning service',
    features: [
      'One-on-one consultation call',
      'Complete booking service (flights, hotels, transport)',
      'Restaurant reservations & exclusive experiences',
      'Dedicated travel coordinator',
      '24/7 support during travel',
      'Unlimited revisions',
      'Travel insurance coordination'
    ]
  }
];

export function calculateTripPricing(
  formData: TripFormData,
  tier: ServiceTier['id']
): PricingBreakdown {
  const selectedTier = SERVICE_TIERS.find(t => t.id === tier);
  if (!selectedTier) throw new Error('Invalid tier');

  const basePrice = selectedTier.basePrice;

  // For Executive tier, return consultation-based pricing
  if (tier === 'executive') {
    return {
      basePrice,
      groupSizeMultiplier: 1,
      durationMultiplier: 1,
      destinationMultiplier: 1,
      rushMultiplier: 1,
      subtotal: basePrice,
      total: basePrice // Starting price for consultation
    };
  }

  // Calculate duration in days
  let duration = 1;
  if (formData.startDate && formData.endDate) {
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    duration = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  let additionalCharges = 0;

  // Group size: +$3 for each additional person, +$1 for each person after 5
  if (formData.groupSize > 1) {
    const additionalPeople = formData.groupSize - 1;
    if (additionalPeople <= 4) {
      additionalCharges += additionalPeople * 3; // $3 per person for people 2-5
    } else {
      additionalCharges += 4 * 3; // $3 for people 2-5
      additionalCharges += (additionalPeople - 4) * 1; // $1 for people 6+
    }
  }

  // Duration: +$2 for every 5 days
  const durationCharges = Math.floor(duration / 5) * 2;
  additionalCharges += durationCharges;

  // Destinations: +$5-10 for each additional destination (average $7.5)
  const destinationCount = formData.specificDestinations.length || 1;
  if (destinationCount > 1) {
    const additionalDestinations = destinationCount - 1;
    additionalCharges += additionalDestinations * 7.5;
  }

  const total = Math.round(basePrice + additionalCharges);

  // Calculate multipliers for breakdown display
  const groupSizeMultiplier = formData.groupSize > 1 
    ? 1 + (additionalCharges / basePrice) 
    : 1;
  const durationMultiplier = duration > 1 ? 1 + (durationCharges / basePrice) : 1;
  const destinationMultiplier = destinationCount > 1 
    ? 1 + ((destinationCount - 1) * 7.5 / basePrice) 
    : 1;

  return {
    basePrice,
    groupSizeMultiplier,
    durationMultiplier,
    destinationMultiplier,
    rushMultiplier: 1,
    subtotal: total,
    total
  };
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function getTripDuration(startDate: Date, endDate: Date): number {
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}