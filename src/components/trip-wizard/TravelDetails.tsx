import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plane, 
  Car, 
  Train, 
  Bus,
  MapPin,
  UtensilsCrossed,
  Heart,
  Accessibility
} from 'lucide-react';
import type { TripFormData } from '@/pages/CreateTrip';

interface TravelDetailsProps {
  formData: TripFormData;
  updateFormData: (updates: Partial<TripFormData>) => void;
}

export const TravelDetails = ({ formData, updateFormData }: TravelDetailsProps) => {
  const transportOptions = [
    { 
      id: 'flights', 
      label: 'Flights', 
      icon: Plane, 
      description: 'Air travel for long distances'
    },
    { 
      id: 'rental-car', 
      label: 'Rental Car', 
      icon: Car, 
      description: 'Freedom to explore at your own pace'
    },
    { 
      id: 'public-transit', 
      label: 'Public Transit', 
      icon: Train, 
      description: 'Trains, buses, local transportation'
    },
    { 
      id: 'rideshare', 
      label: 'Rideshare/Taxi', 
      icon: Car, 
      description: 'Uber, Lyft, local taxis'
    },
    { 
      id: 'walking', 
      label: 'Walking', 
      icon: MapPin, 
      description: 'Explore destinations on foot'
    },
  ];

  const dietaryOptions = [
    { id: 'vegetarian', label: 'Vegetarian', emoji: '🌱' },
    { id: 'vegan', label: 'Vegan', emoji: '🥬' },
    { id: 'gluten-free', label: 'Gluten-Free', emoji: '🌾' },
    { id: 'dairy-free', label: 'Dairy-Free', emoji: '🥛' },
    { id: 'kosher', label: 'Kosher', emoji: '✡️' },
    { id: 'halal', label: 'Halal', emoji: '☪️' },
    { id: 'keto', label: 'Keto', emoji: '🥑' },
    { id: 'pescatarian', label: 'Pescatarian', emoji: '🐟' },
  ];

  const toggleTransport = (transport: string) => {
    const current = formData.transportPreferences;
    if (current.includes(transport)) {
      updateFormData({
        transportPreferences: current.filter(t => t !== transport)
      });
    } else {
      updateFormData({
        transportPreferences: [...current, transport]
      });
    }
  };

  const toggleDietary = (dietary: string) => {
    const current = formData.dietaryRestrictions;
    if (current.includes(dietary)) {
      updateFormData({
        dietaryRestrictions: current.filter(d => d !== dietary)
      });
    } else {
      updateFormData({
        dietaryRestrictions: [...current, dietary]
      });
    }
  };

  const getFoodAdventureLabel = (level: number) => {
    if (level <= 2) return 'Stick to familiar foods';
    if (level <= 4) return 'Somewhat adventurous';
    if (level <= 6) return 'Open to new experiences';
    if (level <= 8) return 'Very adventurous';
    return 'Try absolutely everything!';
  };

  return (
    <div className="space-y-8">
      {/* Transportation Preferences */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Transportation Preferences</Label>
          <p className="text-sm text-gray-500 mt-1">How do you prefer to get around? Select all that apply</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {transportOptions.map((transport) => {
            const IconComponent = transport.icon;
            const isSelected = formData.transportPreferences.includes(transport.id);
            
            return (
              <div
                key={transport.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => toggleTransport(transport.id)}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleTransport(transport.id)}
                    className="mt-1"
                  />
                  <IconComponent className={`h-5 w-5 mt-0.5 ${isSelected ? 'text-primary' : 'text-gray-600'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{transport.label}</div>
                    <div className="text-sm text-gray-500">{transport.description}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {formData.transportPreferences.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.transportPreferences.map((transportId) => {
              const transport = transportOptions.find(t => t.id === transportId);
              return transport ? (
                <Badge key={transportId} variant="secondary">
                  {transport.label}
                </Badge>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* Dietary Restrictions */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4" />
            Dietary Restrictions
          </Label>
          <p className="text-sm text-gray-500 mt-1">Let us know about any dietary requirements (optional)</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {dietaryOptions.map((dietary) => {
            const isSelected = formData.dietaryRestrictions.includes(dietary.id);
            
            return (
              <div
                key={dietary.id}
                className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => toggleDietary(dietary.id)}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={() => toggleDietary(dietary.id)}
                />
                <span className="text-lg">{dietary.emoji}</span>
                <Label className="cursor-pointer text-sm font-medium">
                  {dietary.label}
                </Label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Food Adventure Level */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Food Adventure Level: {formData.foodAdventureLevel}/10
          </Label>
          <p className="text-sm text-gray-500 mt-1">{getFoodAdventureLabel(formData.foodAdventureLevel)}</p>
        </div>
        
        <Slider
          value={[formData.foodAdventureLevel]}
          onValueChange={(value) => updateFormData({ foodAdventureLevel: value[0] })}
          max={10}
          min={1}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>🥪 Safe choices</span>
          <span>🌶️ Adventurous eater</span>
        </div>
      </div>

      {/* Accessibility Needs */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium flex items-center gap-2">
            <Accessibility className="h-4 w-4" />
            Accessibility Requirements
          </Label>
          <p className="text-sm text-gray-500 mt-1">Please describe any accessibility needs we should consider</p>
        </div>
        
        <Textarea
          placeholder="e.g., wheelchair accessible venues, elevator access, hearing accommodations..."
          value={formData.accessibilityNeeds}
          onChange={(e) => updateFormData({ accessibilityNeeds: e.target.value })}
          rows={3}
        />
      </div>

      {/* Special Requests */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Special Requests or Notes</Label>
          <p className="text-sm text-gray-500 mt-1">Anything else you'd like us to know about your trip preferences?</p>
        </div>
        
        <Textarea
          placeholder="e.g., celebrating an anniversary, interested in photography opportunities, prefer small group tours..."
          value={formData.specialRequests}
          onChange={(e) => updateFormData({ specialRequests: e.target.value })}
          rows={4}
        />
      </div>

      {/* Summary */}
      <div className="p-4 bg-purple-50 rounded-lg">
        <h4 className="font-medium text-purple-800 mb-2">Your travel preferences:</h4>
        <ul className="text-sm text-purple-700 space-y-1">
          {formData.transportPreferences.length > 0 && (
            <li>• Transportation: {formData.transportPreferences.map(id => 
              transportOptions.find(t => t.id === id)?.label
            ).join(', ')}</li>
          )}
          {formData.dietaryRestrictions.length > 0 && (
            <li>• Dietary restrictions: {formData.dietaryRestrictions.map(id =>
              dietaryOptions.find(d => d.id === id)?.label
            ).join(', ')}</li>
          )}
          <li>• Food adventure level: {formData.foodAdventureLevel}/10 - {getFoodAdventureLabel(formData.foodAdventureLevel)}</li>
          {formData.accessibilityNeeds && (
            <li>• Accessibility needs specified</li>
          )}
          {formData.specialRequests && (
            <li>• Special requests noted</li>
          )}
        </ul>
      </div>
    </div>
  );
};