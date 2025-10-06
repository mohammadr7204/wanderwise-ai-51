import * as React from "react"
import { Check, ChevronsUpDown, MapPin, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { destinations, type Destination } from "@/data/destinations"

interface DestinationComboboxProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function DestinationCombobox({
  value,
  onValueChange,
  placeholder = "Select destination...",
  className
}: DestinationComboboxProps) {
  const [open, setOpen] = React.useState(false)
  
  // Group destinations by region
  const groupedDestinations = React.useMemo(() => {
    const groups: Record<string, Destination[]> = {}
    destinations.forEach(dest => {
      if (!groups[dest.region]) {
        groups[dest.region] = []
      }
      groups[dest.region].push(dest)
    })
    return groups
  }, [])

  const selectedDestination = destinations.find(
    (dest) => `${dest.name}, ${dest.type === 'city' ? dest.country : dest.type}` === value
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedDestination ? (
            <span className="flex items-center gap-2">
              {selectedDestination.type === 'city' ? (
                <MapPin className="h-4 w-4" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              <span>{selectedDestination.name}</span>
              <span className="text-muted-foreground text-xs">
                ({selectedDestination.type === 'city' 
                  ? selectedDestination.country 
                  : 'Country'})
              </span>
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 max-h-[400px]" align="start">
        <Command>
          <CommandInput placeholder="Search destinations..." />
          <CommandList>
            <CommandEmpty>No destination found.</CommandEmpty>
            {Object.entries(groupedDestinations)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([region, dests]) => (
                <CommandGroup key={region} heading={region}>
                  {dests
                    .sort((a, b) => {
                      // Sort countries first, then cities
                      if (a.type === b.type) {
                        return a.name.localeCompare(b.name)
                      }
                      return a.type === 'country' ? -1 : 1
                    })
                    .map((dest) => {
                      const destValue = `${dest.name}, ${dest.type === 'city' ? dest.country : dest.type}`
                      return (
                        <CommandItem
                          key={destValue}
                          value={destValue}
                          keywords={[dest.name, ...(dest.country ? [dest.country] : []), ...dest.searchTerms]}
                          onSelect={(currentValue) => {
                            onValueChange(currentValue === value ? "" : currentValue)
                            setOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === destValue ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {dest.type === 'city' ? (
                            <MapPin className="mr-2 h-4 w-4 text-blue-500" />
                          ) : (
                            <Globe className="mr-2 h-4 w-4 text-green-600" />
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium">{dest.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {dest.type === 'city' ? dest.country : 'Country'}
                            </span>
                          </div>
                        </CommandItem>
                      )
                    })}
                </CommandGroup>
              ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
