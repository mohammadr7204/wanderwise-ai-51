import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Users, DollarSign, MapPin, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TripFormData } from '@/pages/CreateTrip';

interface TripBasicsProps {
  formData: TripFormData;
  updateFormData: (updates: Partial<TripFormData>) => void;
}

export const TripBasics = ({ formData, updateFormData }: TripBasicsProps) => {
  return (
    <div className="space-y-6">
      {/* Trip Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Trip Title</Label>
        <Input
          id="title"
          placeholder="e.g., Summer Adventure in Europe"
          value={formData.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
          className="text-base"
        />
        <p className="text-sm text-gray-500">Give your trip a memorable name</p>
      </div>

      {/* Starting Location */}
      <div className="space-y-2">
        <Label htmlFor="startingLocation" className="flex items-center gap-2">
          <Plane className="h-4 w-4" />
          Starting Location (Origin)
        </Label>
        <Input
          id="startingLocation"
          placeholder="e.g., New York, JFK Airport, Los Angeles"
          value={formData.startingLocation}
          onChange={(e) => updateFormData({ startingLocation: e.target.value })}
          className="text-base"
        />
        <p className="text-sm text-gray-500">Enter your departure city or airport for flight analysis</p>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.startDate}
                onSelect={(date) => updateFormData({ startDate: date })}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.endDate}
                onSelect={(date) => updateFormData({ endDate: date })}
                disabled={(date) => date < (formData.startDate || new Date())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Group Size */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Group Size: {formData.groupSize} {formData.groupSize === 1 ? 'traveler' : 'travelers'}
        </Label>
        <Slider
          value={[formData.groupSize]}
          onValueChange={(value) => updateFormData({ groupSize: value[0] })}
          max={10}
          min={1}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>Solo</span>
          <span>Group (10+)</span>
        </div>
      </div>

      {/* Budget Range */}
      <div className="space-y-4">
        <Label className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Budget Range: ${formData.budgetMin.toLocaleString()} - ${formData.budgetMax.toLocaleString()}
        </Label>
        
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Minimum Budget</Label>
            <Slider
              value={[formData.budgetMin]}
              onValueChange={(value) => updateFormData({ budgetMin: value[0] })}
              max={20000}
              min={500}
              step={100}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Maximum Budget</Label>
            <Slider
              value={[formData.budgetMax]}
              onValueChange={(value) => updateFormData({ budgetMax: value[0] })}
              max={20000}
              min={formData.budgetMin}
              step={100}
              className="w-full"
            />
          </div>
        </div>
        
        <div className="flex justify-between text-sm text-gray-500">
          <span>$500</span>
          <span>$20,000+</span>
        </div>
      </div>

      {/* Trip Duration Display */}
      {formData.startDate && formData.endDate && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Trip Duration:</strong> {Math.ceil((formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
          </p>
        </div>
      )}
    </div>
  );
};