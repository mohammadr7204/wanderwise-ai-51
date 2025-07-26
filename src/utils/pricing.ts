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
  id: 'essential' | 'premium' | 'executive';
  name: string;
  basePrice: number;
  description: string;
  features: string[];
}

export const SERVICE_TIERS: ServiceTier[] = [
  {
    id: 'essential',
    name: 'Essential Plan',
    basePrice: 39,
    description: 'Perfect for independent travelers',
    features: [
      'Full AI-generated itinerary (unlimited duration)',
      'Restaurant and activity recommendations with booking links',
      'Accommodation suggestions with booking links',
      'Transportation recommendations',
      'PDF itinerary export',
      'Email support (48hr response)',
      'Self-service booking through provided links'
    ]
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    basePrice: 89,
    description: 'Most popular - with booking assistance',
    features: [
      'Everything in Essential (same AI quality)',
      'Human booking assistance for hotels & activities',
      'Flight booking guidance',
      'Multiple destination planning',
      '1 free revision with human review',
      'Priority email support (24hr response)'
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

  // Group size multiplier (natural complexity increase)
  let groupSizeMultiplier = 1;
  if (formData.groupSize >= 5) groupSizeMultiplier = 2.0; // +100%
  else if (formData.groupSize >= 3) groupSizeMultiplier = 1.6; // +60%
  else if (formData.groupSize === 2) groupSizeMultiplier = 1.3; // +30%

  // Duration multiplier (natural complexity increase)
  let durationMultiplier = 1;
  if (formData.startDate && formData.endDate) {
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const duration = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (duration >= 15) durationMultiplier = 2.0; // +100%
    else if (duration >= 8) durationMultiplier = 1.5; // +50%
    else if (duration >= 4) durationMultiplier = 1.2; // +20%
  }

  // Destination complexity multiplier (natural boundary)
  let destinationMultiplier = 1;
  if (formData.travelRadius === 'international') destinationMultiplier += 0.2; // +20%
  if (formData.specificDestinations.length > 1) destinationMultiplier += 0.3; // +30%

  // Rush order surcharge (natural service boundary)
  let rushMultiplier = 1;
  if (formData.startDate) {
    const startDate = new Date(formData.startDate);
    const hoursUntilTrip = (startDate.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilTrip <= 48) rushMultiplier = 1.25; // +25%
  }

  const subtotal = basePrice * groupSizeMultiplier * durationMultiplier * destinationMultiplier;
  const total = subtotal * rushMultiplier;

  return {
    basePrice,
    groupSizeMultiplier,
    durationMultiplier,
    destinationMultiplier,
    rushMultiplier,
    subtotal,
    total: Math.round(total)
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