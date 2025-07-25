import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, MapPin, Globe, Thermometer, X } from 'lucide-react';
import { useState } from 'react';
import type { TripFormData } from '@/pages/CreateTrip';

interface DestinationPreferencesProps {
  formData: TripFormData;
  updateFormData: (updates: Partial<TripFormData>) => void;
}

export const DestinationPreferences = ({ formData, updateFormData }: DestinationPreferencesProps) => {
  const [destinationInput, setDestinationInput] = useState('');

  const addDestination = () => {
    if (destinationInput.trim() && !formData.specificDestinations.includes(destinationInput.trim())) {
      updateFormData({
        specificDestinations: [...formData.specificDestinations, destinationInput.trim()]
      });
      setDestinationInput('');
    }
  };

  const removeDestination = (destination: string) => {
    updateFormData({
      specificDestinations: formData.specificDestinations.filter(d => d !== destination)
    });
  };

  const climateOptions = [
    { id: 'tropical', label: 'Tropical', icon: '🌴' },
    { id: 'temperate', label: 'Temperate', icon: '🌸' },
    { id: 'cold', label: 'Cold/Winter', icon: '❄️' },
    { id: 'desert', label: 'Desert', icon: '🏜️' },
    { id: 'mediterranean', label: 'Mediterranean', icon: '🍇' },
    { id: 'mountain', label: 'Mountain', icon: '🏔️' },
  ];

  const toggleClimatePreference = (climate: string) => {
    const current = formData.climatePreferences;
    if (current.includes(climate)) {
      updateFormData({
        climatePreferences: current.filter(c => c !== climate)
      });
    } else {
      updateFormData({
        climatePreferences: [...current, climate]
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Destination Type */}
      <div className="space-y-4">
        <Label className="text-base font-medium">How do you want to choose your destination?</Label>
        <RadioGroup
          value={formData.destinationType}
          onValueChange={(value: 'surprise' | 'specific') => updateFormData({ destinationType: value })}
          className="space-y-3"
        >
          <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="surprise" id="surprise" />
            <Label htmlFor="surprise" className="flex items-center gap-3 cursor-pointer flex-1">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Surprise me with a destination!</div>
                <div className="text-sm text-gray-500">Let our experts pick the perfect place based on your preferences</div>
              </div>
            </Label>
          </div>
          
          <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="specific" id="specific" />
            <Label htmlFor="specific" className="flex items-center gap-3 cursor-pointer flex-1">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">I have specific destinations in mind</div>
                <div className="text-sm text-gray-500">Tell us where you want to go</div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Specific Destinations Input */}
      {formData.destinationType === 'specific' && (
        <div className="space-y-4">
          <Label>Add destinations you'd like to visit</Label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Paris, Tokyo, New York"
              value={destinationInput}
              onChange={(e) => setDestinationInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addDestination()}
              className="flex-1"
            />
            <Button onClick={addDestination} variant="outline">
              Add
            </Button>
          </div>
          
          {formData.specificDestinations.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.specificDestinations.map((destination) => (
                <Badge key={destination} variant="secondary" className="flex items-center gap-1">
                  {destination}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeDestination(destination)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Travel Radius */}
      <div className="space-y-4">
        <Label className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Travel Radius
        </Label>
        <RadioGroup
          value={formData.travelRadius}
          onValueChange={(value: 'local' | 'national' | 'international') => updateFormData({ travelRadius: value })}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
            <RadioGroupItem value="local" id="local" />
            <Label htmlFor="local" className="cursor-pointer flex-1">
              <div className="font-medium">Local</div>
              <div className="text-sm text-gray-500">Within your region</div>
            </Label>
          </div>
          
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
            <RadioGroupItem value="national" id="national" />
            <Label htmlFor="national" className="cursor-pointer flex-1">
              <div className="font-medium">National</div>
              <div className="text-sm text-gray-500">Within your country</div>
            </Label>
          </div>
          
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
            <RadioGroupItem value="international" id="international" />
            <Label htmlFor="international" className="cursor-pointer flex-1">
              <div className="font-medium">International</div>
              <div className="text-sm text-gray-500">Around the world</div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Climate Preferences */}
      <div className="space-y-4">
        <Label className="flex items-center gap-2">
          <Thermometer className="h-4 w-4" />
          Climate Preferences
        </Label>
        <p className="text-sm text-gray-500">Select the types of climates you enjoy (optional)</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {climateOptions.map((climate) => (
            <div
              key={climate.id}
              className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                formData.climatePreferences.includes(climate.id)
                  ? 'bg-primary/10 border-primary'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => toggleClimatePreference(climate.id)}
            >
              <Checkbox
                checked={formData.climatePreferences.includes(climate.id)}
                onChange={() => toggleClimatePreference(climate.id)}
              />
              <span className="text-lg">{climate.icon}</span>
              <Label className="cursor-pointer text-sm font-medium">
                {climate.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      {(formData.destinationType === 'specific' && formData.specificDestinations.length > 0) ||
       formData.climatePreferences.length > 0 && (
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">Your destination preferences:</h4>
          <ul className="text-sm text-green-700 space-y-1">
            {formData.destinationType === 'surprise' && (
              <li>• Surprise destination based on your preferences</li>
            )}
            {formData.destinationType === 'specific' && formData.specificDestinations.length > 0 && (
              <li>• Specific destinations: {formData.specificDestinations.join(', ')}</li>
            )}
            <li>• Travel radius: {formData.travelRadius}</li>
            {formData.climatePreferences.length > 0 && (
              <li>• Preferred climates: {formData.climatePreferences.join(', ')}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};