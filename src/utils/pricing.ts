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
  id: 'essential' | 'premium' | 'luxury';
  name: string;
  basePrice: number;
  description: string;
  features: string[];
}

export const SERVICE_TIERS: ServiceTier[] = [
  {
    id: 'essential',
    name: 'Essential',
    basePrice: 39,
    description: 'Perfect for straightforward trips',
    features: [
      'Day-by-day itinerary',
      'Restaurant recommendations',
      'Basic activity suggestions',
      'PDF download'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    basePrice: 89,
    description: 'Enhanced planning with insider tips',
    features: [
      'Everything in Essential',
      'Local insider recommendations',
      'Interactive map',
      'Booking links & contacts',
      '1 revision request'
    ]
  },
  {
    id: 'luxury',
    name: 'Luxury',
    basePrice: 249,
    description: 'VIP experience with exclusive access',
    features: [
      'Everything in Premium',
      'Exclusive venue access',
      'Concierge booking assistance',
      'Private tour recommendations',
      'Unlimited revisions',
      'Priority support'
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

  // Group size multiplier
  let groupSizeMultiplier = 1;
  if (formData.groupSize >= 5) groupSizeMultiplier = 2.0; // +100%
  else if (formData.groupSize >= 3) groupSizeMultiplier = 1.6; // +60%
  else if (formData.groupSize === 2) groupSizeMultiplier = 1.3; // +30%

  // Duration multiplier
  let durationMultiplier = 1;
  if (formData.startDate && formData.endDate) {
    const duration = Math.ceil(
      (formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (duration >= 15) durationMultiplier = 2.0; // +100%
    else if (duration >= 8) durationMultiplier = 1.5; // +50%
    else if (duration >= 4) durationMultiplier = 1.2; // +20%
  }

  // Destination complexity multiplier
  let destinationMultiplier = 1;
  if (formData.travelRadius === 'international') destinationMultiplier += 0.2; // +20%
  if (formData.specificDestinations.length > 1) destinationMultiplier += 0.3; // +30%

  // Rush order surcharge (trip starts within 48 hours)
  let rushMultiplier = 1;
  if (formData.startDate) {
    const hoursUntilTrip = (formData.startDate.getTime() - Date.now()) / (1000 * 60 * 60);
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