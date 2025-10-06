import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, MapPin, Globe, Thermometer, X, Plane, Clock, Star } from 'lucide-react';
import { useState } from 'react';
import type { TripFormData } from '@/pages/CreateTrip';
import { DestinationCombobox } from '@/components/ui/destination-combobox';

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
          <Label>Select destinations you'd like to visit</Label>
          <div className="flex gap-2">
            <DestinationCombobox
              value={destinationInput}
              onValueChange={(value) => {
                setDestinationInput(value);
                if (value && !formData.specificDestinations.includes(value)) {
                  updateFormData({
                    specificDestinations: [...formData.specificDestinations, value]
                  });
                  setDestinationInput('');
                }
              }}
              placeholder="Search for a city or country..."
              className="flex-1"
            />
          </div>
          
          {formData.specificDestinations.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.specificDestinations.map((destination) => (
                <Badge key={destination} variant="secondary" className="flex items-center gap-1 py-1.5">
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

      {/* Flight Analysis Options */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Include Flight Analysis
            </Label>
            <p className="text-sm text-gray-500">Get flight recommendations and pricing analysis</p>
          </div>
          <Switch
            checked={formData.includeFlightAnalysis}
            onCheckedChange={(checked) => updateFormData({ includeFlightAnalysis: checked })}
          />
        </div>

        {formData.includeFlightAnalysis && (
          <div className="space-y-4 pl-6 border-l-2 border-primary/20">
            {/* Departure Time Preference */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Preferred Departure Time
              </Label>
              <Select
                value={formData.preferredDepartureTime}
                onValueChange={(value: 'early-morning' | 'morning' | 'afternoon' | 'evening' | 'late-night' | 'flexible') => 
                  updateFormData({ preferredDepartureTime: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select departure time preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flexible">Flexible (Any time)</SelectItem>
                  <SelectItem value="early-morning">Early Morning (5:00 - 8:00 AM)</SelectItem>
                  <SelectItem value="morning">Morning (8:00 - 12:00 PM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12:00 - 6:00 PM)</SelectItem>
                  <SelectItem value="evening">Evening (6:00 - 10:00 PM)</SelectItem>
                  <SelectItem value="late-night">Late Night (10:00 PM - 5:00 AM)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Flight Class Preference */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Flight Class Preference
              </Label>
              <Select
                value={formData.flightClass}
                onValueChange={(value: 'economy' | 'premium-economy' | 'business' | 'first') => 
                  updateFormData({ flightClass: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select flight class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="premium-economy">Premium Economy</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="first">First Class</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Direct Flights Preference */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Prefer Direct Flights</Label>
                <p className="text-xs text-gray-500">Prioritize non-stop flights over connections</p>
              </div>
              <Switch
                checked={formData.directFlightsOnly}
                onCheckedChange={(checked) => updateFormData({ directFlightsOnly: checked })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      {(formData.destinationType === 'specific' && formData.specificDestinations.length > 0) ||
       formData.climatePreferences.length > 0 && (
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">Your preferences:</h4>
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
            {formData.includeFlightAnalysis && (
              <>
                <li>• Flight analysis: Enabled</li>
                <li>• Departure time: {formData.preferredDepartureTime.replace('-', ' ')}</li>
                <li>• Flight class: {formData.flightClass.replace('-', ' ')}</li>
                {formData.directFlightsOnly && <li>• Direct flights preferred</li>}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};