import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { 
  Mountain, 
  Camera, 
  Waves, 
  UtensilsCrossed, 
  ShoppingBag, 
  TreePine, 
  Music,
  Bed,
  Wifi,
  Car,
  Dumbbell,
  Coffee
} from 'lucide-react';
import type { TripFormData } from '@/pages/CreateTrip';

interface ActivityPreferencesProps {
  formData: TripFormData;
  updateFormData: (updates: Partial<TripFormData>) => void;
}

export const ActivityPreferences = ({ formData, updateFormData }: ActivityPreferencesProps) => {
  const activityOptions = [
    { 
      id: 'adventure', 
      label: 'Adventure', 
      icon: Mountain, 
      description: 'Hiking, water sports, extreme sports',
      color: 'bg-red-100 text-red-800 border-red-200'
    },
    { 
      id: 'cultural', 
      label: 'Cultural', 
      icon: Camera, 
      description: 'Museums, historical sites, local experiences',
      color: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    { 
      id: 'relaxation', 
      label: 'Relaxation', 
      icon: Waves, 
      description: 'Beaches, spas, scenic spots',
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    { 
      id: 'nightlife', 
      label: 'Nightlife', 
      icon: Music, 
      description: 'Bars, clubs, entertainment',
      color: 'bg-pink-100 text-pink-800 border-pink-200'
    },
    { 
      id: 'food-drink', 
      label: 'Food & Drink', 
      icon: UtensilsCrossed, 
      description: 'Local cuisine, fine dining, food tours',
      color: 'bg-orange-100 text-orange-800 border-orange-200'
    },
    { 
      id: 'shopping', 
      label: 'Shopping', 
      icon: ShoppingBag, 
      description: 'Markets, malls, local crafts',
      color: 'bg-green-100 text-green-800 border-green-200'
    },
    { 
      id: 'nature', 
      label: 'Nature', 
      icon: TreePine, 
      description: 'National parks, wildlife, outdoor activities',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
  ];

  const accommodationOptions = [
    { id: 'luxury-hotels', label: 'Luxury Hotels', description: '5-star hotels with premium amenities' },
    { id: 'mid-range-hotels', label: 'Mid-range Hotels', description: '3-4 star hotels with good amenities' },
    { id: 'boutique-stays', label: 'Boutique Stays', description: 'Unique, small-scale accommodations' },
    { id: 'vacation-rentals', label: 'Vacation Rentals', description: 'Apartments, houses, private properties' },
    { id: 'hostels', label: 'Hostels', description: 'Budget-friendly shared accommodations' },
    { id: 'camping', label: 'Camping', description: 'Outdoor camping and glamping' },
  ];

  const amenityOptions = [
    { id: 'pool', label: 'Pool', icon: Waves },
    { id: 'gym', label: 'Gym', icon: Dumbbell },
    { id: 'spa', label: 'Spa', icon: Waves },
    { id: 'wifi', label: 'Free WiFi', icon: Wifi },
    { id: 'parking', label: 'Parking', icon: Car },
    { id: 'breakfast', label: 'Breakfast', icon: Coffee },
  ];

  const toggleActivity = (activity: string) => {
    const current = formData.activityTypes;
    if (current.includes(activity)) {
      updateFormData({
        activityTypes: current.filter(a => a !== activity)
      });
    } else {
      updateFormData({
        activityTypes: [...current, activity]
      });
    }
  };

  const toggleAmenity = (amenity: string) => {
    const current = formData.accommodationAmenities;
    if (current.includes(amenity)) {
      updateFormData({
        accommodationAmenities: current.filter(a => a !== amenity)
      });
    } else {
      updateFormData({
        accommodationAmenities: [...current, amenity]
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Activity Types */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">What activities interest you?</Label>
          <p className="text-sm text-gray-500 mt-1">Select all that apply - this helps us create the perfect itinerary</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activityOptions.map((activity) => {
            const IconComponent = activity.icon;
            const isSelected = formData.activityTypes.includes(activity.id);
            
            return (
              <div
                key={activity.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => toggleActivity(activity.id)}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleActivity(activity.id)}
                    className="mt-1"
                  />
                  <IconComponent className={`h-5 w-5 mt-0.5 ${isSelected ? 'text-primary' : 'text-gray-600'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{activity.label}</div>
                    <div className="text-sm text-gray-500">{activity.description}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {formData.activityTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.activityTypes.map((activityId) => {
              const activity = activityOptions.find(a => a.id === activityId);
              return activity ? (
                <Badge key={activityId} className={activity.color}>
                  {activity.label}
                </Badge>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* Accommodation Type */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium flex items-center gap-2">
            <Bed className="h-4 w-4" />
            Accommodation Preference
          </Label>
          <p className="text-sm text-gray-500 mt-1">What type of accommodation do you prefer?</p>
        </div>
        
        <RadioGroup
          value={formData.accommodationType}
          onValueChange={(value) => updateFormData({ accommodationType: value })}
          className="space-y-3"
        >
          {accommodationOptions.map((option) => (
            <div key={option.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
              <Label htmlFor={option.id} className="cursor-pointer flex-1">
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-gray-500">{option.description}</div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Accommodation Amenities */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Preferred Amenities</Label>
          <p className="text-sm text-gray-500 mt-1">Select amenities that are important to you (optional)</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {amenityOptions.map((amenity) => {
            const IconComponent = amenity.icon;
            const isSelected = formData.accommodationAmenities.includes(amenity.id);
            
            return (
              <div
                key={amenity.id}
                className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => toggleAmenity(amenity.id)}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={() => toggleAmenity(amenity.id)}
                />
                <IconComponent className="h-4 w-4" />
                <Label className="cursor-pointer text-sm font-medium">
                  {amenity.label}
                </Label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {formData.activityTypes.length > 0 && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Your activity preferences:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Activities: {formData.activityTypes.map(id => 
              activityOptions.find(a => a.id === id)?.label
            ).join(', ')}</li>
            <li>• Accommodation: {accommodationOptions.find(a => a.id === formData.accommodationType)?.label}</li>
            {formData.accommodationAmenities.length > 0 && (
              <li>• Preferred amenities: {formData.accommodationAmenities.map(id =>
                amenityOptions.find(a => a.id === id)?.label
              ).join(', ')}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};