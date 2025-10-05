export interface CountryInfo {
  powerPlugType: string[];
  voltage: string;
  conservativeDress: boolean;
  religiousSites: boolean;
  altitudeSickness: boolean;
  malariaRisk: boolean;
  visaRequired: boolean;
  drivesSide: 'left' | 'right';
  currency: string;
  languages: string[];
  culturalNotes: string[];
}

export interface ActivityRequirements {
  beach: string[];
  hiking: string[];
  city: string[];
  photography: string[];
  business: string[];
  adventure: string[];
  cultural: string[];
  wildlife: string[];
}

export class DestinationIntelligence {
  private static countryData: Record<string, CountryInfo> = {
    'thailand': {
      powerPlugType: ['A', 'B', 'C'],
      voltage: '220V',
      conservativeDress: true,
      religiousSites: true,
      altitudeSickness: false,
      malariaRisk: true,
      visaRequired: false,
      drivesSide: 'left',
      currency: 'THB',
      languages: ['Thai'],
      culturalNotes: ['Remove shoes when entering temples', 'Dress modestly at religious sites', 'Don\'t point feet towards Buddha statues']
    },
    'japan': {
      powerPlugType: ['A', 'B'],
      voltage: '100V',
      conservativeDress: false,
      religiousSites: true,
      altitudeSickness: false,
      malariaRisk: false,
      visaRequired: false,
      drivesSide: 'left',
      currency: 'JPY',
      languages: ['Japanese'],
      culturalNotes: ['Bow when greeting', 'Remove shoes indoors', 'Don\'t eat while walking']
    },
    'india': {
      powerPlugType: ['C', 'D', 'M'],
      voltage: '230V',
      conservativeDress: true,
      religiousSites: true,
      altitudeSickness: true,
      malariaRisk: true,
      visaRequired: true,
      drivesSide: 'left',
      currency: 'INR',
      languages: ['Hindi', 'English'],
      culturalNotes: ['Dress conservatively', 'Remove shoes at temples', 'Use right hand for eating']
    },
    'peru': {
      powerPlugType: ['A', 'B', 'C'],
      voltage: '220V',
      conservativeDress: false,
      religiousSites: true,
      altitudeSickness: true,
      malariaRisk: true,
      visaRequired: false,
      drivesSide: 'right',
      currency: 'PEN',
      languages: ['Spanish', 'Quechua'],
      culturalNotes: ['Altitude sickness common above 3000m', 'Carry coca leaves for altitude', 'Tip 10% at restaurants']
    },
    'saudi arabia': {
      powerPlugType: ['A', 'B', 'F', 'G'],
      voltage: '127V/220V',
      conservativeDress: true,
      religiousSites: true,
      altitudeSickness: false,
      malariaRisk: false,
      visaRequired: true,
      drivesSide: 'right',
      currency: 'SAR',
      languages: ['Arabic'],
      culturalNotes: ['Very conservative dress required', 'Women must cover arms/legs', 'No alcohol permitted']
    }
  };

  private static activityRequirements: ActivityRequirements = {
    beach: [
      'Reef-safe sunscreen (mineral-based)',
      'Waterproof phone case',
      'Snorkel gear',
      'Beach towel (quick-dry)',
      'Swimwear (2 sets)',
      'Water shoes',
      'Waterproof bag for electronics'
    ],
    hiking: [
      'Hiking boots (broken in)',
      'Trekking poles',
      'First aid kit',
      'Water purification tablets',
      'Trail snacks',
      'Headlamp with extra batteries',
      'Emergency whistle',
      'Blister patches',
      'Quick-dry hiking pants',
      'Moisture-wicking shirts'
    ],
    city: [
      'Comfortable walking shoes',
      'Day backpack',
      'Portable charger',
      'Metro/transport cards holder',
      'Small lock for lockers',
      'Comfortable city shoes',
      'Lightweight jacket'
    ],
    photography: [
      'Extra memory cards (minimum 3)',
      'Lens cleaning kit',
      'Tripod (lightweight)',
      'Camera rain cover',
      'Extra camera batteries',
      'Neutral density filters',
      'Polarizing filter',
      'Lens cap tether'
    ],
    business: [
      'Business cards',
      'Formal attire (2 sets)',
      'Dress shoes',
      'Laptop and charger',
      'Presentation materials',
      'Business casual backup',
      'Portable iron/steamer'
    ],
    adventure: [
      'Multi-tool',
      'Paracord',
      'Emergency shelter',
      'Water filtration system',
      'High-energy snacks',
      'GPS device/satellite messenger',
      'Quick-dry clothing',
      'Sturdy adventure shoes'
    ],
    cultural: [
      'Modest clothing',
      'Head covering for religious sites',
      'Cultural guidebook',
      'Language phrasebook/app',
      'Small gifts from home country',
      'Respectful footwear (easy to remove)'
    ],
    wildlife: [
      'Binoculars',
      'Khaki/neutral colored clothing',
      'Insect repellent (DEET-based)',
      'Long-sleeved shirts',
      'Anti-malaria medication',
      'Quiet-soled shoes',
      'Camera with telephoto lens'
    ]
  };

  static getCountryInfo(destination: string): CountryInfo | null {
    const country = destination.toLowerCase();
    
    // Try to match country name or city in destination
    for (const [countryKey, info] of Object.entries(this.countryData)) {
      if (country.includes(countryKey)) {
        return info;
      }
    }

    // City-based matching for common destinations
    const cityToCountry: Record<string, string> = {
      'paris': 'france',
      'london': 'united kingdom',
      'rome': 'italy',
      'barcelona': 'spain',
      'amsterdam': 'netherlands',
      'berlin': 'germany',
      'vienna': 'austria',
      'prague': 'czech republic',
      'budapest': 'hungary',
      'istanbul': 'turkey',
      'dubai': 'united arab emirates',
      'singapore': 'singapore',
      'hong kong': 'hong kong',
      'tokyo': 'japan',
      'bangkok': 'thailand',
      'new york': 'united states',
      'los angeles': 'united states',
      'san francisco': 'united states',
      'chicago': 'united states',
      'miami': 'united states',
      'toronto': 'canada',
      'vancouver': 'canada',
      'montreal': 'canada',
      'sydney': 'australia',
      'melbourne': 'australia',
      'auckland': 'new zealand',
      'mexico city': 'mexico',
      'rio de janeiro': 'brazil',
      'buenos aires': 'argentina',
      'lima': 'peru',
      'cusco': 'peru',
      'cairo': 'egypt',
      'marrakech': 'morocco',
      'cape town': 'south africa',
      'nairobi': 'kenya',
      'mumbai': 'india',
      'delhi': 'india',
      'bangalore': 'india',
      'seoul': 'south korea',
      'beijing': 'china',
      'shanghai': 'china'
    };

    for (const [city, countryName] of Object.entries(cityToCountry)) {
      if (country.includes(city) && this.countryData[countryName]) {
        return this.countryData[countryName];
      }
    }
    
    // Return null for unknown destinations so we can fetch dynamically
    return null;
  }

  static getActivityRequirements(activities: string[]): string[] {
    const allRequirements = new Set<string>();
    
    activities.forEach(activity => {
      const activityKey = activity.toLowerCase() as keyof ActivityRequirements;
      if (this.activityRequirements[activityKey]) {
        this.activityRequirements[activityKey].forEach(item => 
          allRequirements.add(item)
        );
      }
    });
    
    return Array.from(allRequirements);
  }

  static generateDestinationSpecificItems(countryInfo: CountryInfo): Array<{
    id: string;
    name: string;
    category: string;
    essential: boolean;
    reason: string;
  }> {
    const items = [];

    // Power adapter
    items.push({
      id: 'power-adapter',
      name: `Power Adapter (Type ${countryInfo.powerPlugType.join('/')})`,
      category: 'Electronics',
      essential: true,
      reason: `Required for ${countryInfo.voltage} outlets`
    });

    // Conservative dress requirements
    if (countryInfo.conservativeDress) {
      items.push(
        {
          id: 'modest-clothing',
          name: 'Long pants/skirts',
          category: 'Cultural Requirements',
          essential: true,
          reason: 'Conservative dress code required'
        },
        {
          id: 'long-sleeves',
          name: 'Long-sleeved shirts',
          category: 'Cultural Requirements',
          essential: true,
          reason: 'Arms must be covered in public'
        }
      );
    }

    // Religious sites
    if (countryInfo.religiousSites) {
      items.push({
        id: 'head-covering',
        name: 'Head covering/scarf',
        category: 'Cultural Requirements',
        essential: true,
        reason: 'Required for religious site visits'
      });
    }

    // Altitude sickness
    if (countryInfo.altitudeSickness) {
      items.push(
        {
          id: 'altitude-medication',
          name: 'Altitude sickness medication',
          category: 'Health',
          essential: true,
          reason: 'High altitude destinations'
        },
        {
          id: 'coca-leaves',
          name: 'Coca leaves/tea',
          category: 'Health',
          essential: false,
          reason: 'Natural altitude sickness remedy'
        }
      );
    }

    // Malaria risk
    if (countryInfo.malariaRisk) {
      items.push(
        {
          id: 'malaria-prevention',
          name: 'Anti-malarial medication',
          category: 'Health',
          essential: true,
          reason: 'Malaria risk area'
        },
        {
          id: 'deet-repellent',
          name: 'DEET insect repellent (30%+)',
          category: 'Health',
          essential: true,
          reason: 'Prevent mosquito-borne diseases'
        }
      );
    }

    return items;
  }
}