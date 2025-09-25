export interface TripContext {
  duration: number;
  groupSize: number;
  accommodationType: 'hotel' | 'hostel' | 'airbnb' | 'camping';
  transportType: 'carry-on' | 'checked' | 'backpack';
  laundryAvailable: boolean;
  budget: 'budget' | 'mid-range' | 'luxury';
}

export interface PackingQuantity {
  item: string;
  quantity: number;
  size?: string;
  shareableInGroup: boolean;
  reason: string;
}

export class SmartPackingCalculator {
  static calculateClothingQuantities(duration: number, laundryAvailable: boolean): PackingQuantity[] {
    const laundryFrequency = laundryAvailable ? Math.ceil(duration / 7) : 0;
    const effectiveDuration = laundryAvailable ? Math.min(duration, 7) : duration;
    
    return [
      {
        item: 'Underwear',
        quantity: Math.min(effectiveDuration + 2, 10),
        shareableInGroup: false,
        reason: laundryAvailable ? 'With laundry: 1 week supply + 2 extra' : 'No laundry: full trip supply'
      },
      {
        item: 'Socks',
        quantity: Math.min(effectiveDuration + 3, 12),
        shareableInGroup: false,
        reason: 'Extra pairs for hiking/wet weather'
      },
      {
        item: 'T-shirts/Casual tops',
        quantity: Math.ceil(effectiveDuration / 2) + 1,
        shareableInGroup: false,
        reason: laundryAvailable ? 'Wear twice between washes' : 'Fresh shirt every 2 days'
      },
      {
        item: 'Pants/Trousers',
        quantity: Math.ceil(effectiveDuration / 4) + 1,
        shareableInGroup: false,
        reason: 'Wear 3-4 times between washes'
      },
      {
        item: 'Shorts',
        quantity: Math.ceil(effectiveDuration / 3),
        shareableInGroup: false,
        reason: 'For casual/beach wear'
      }
    ];
  }

  static calculateToiletrySizes(duration: number, transportType: 'carry-on' | 'checked' | 'backpack'): PackingQuantity[] {
    const isCarryOnOnly = transportType === 'carry-on';
    const maxLiquidSize = isCarryOnOnly ? '100ml' : '250ml';
    
    return [
      {
        item: 'Shampoo',
        quantity: 1,
        size: duration > 14 ? (isCarryOnOnly ? '100ml' : '250ml') : '50ml',
        shareableInGroup: true,
        reason: isCarryOnOnly ? 'TSA liquid limits' : 'Optimal size for trip length'
      },
      {
        item: 'Toothpaste',
        quantity: 1,
        size: duration > 21 ? '100ml' : '50ml',
        shareableInGroup: true,
        reason: '1ml per day usage'
      },
      {
        item: 'Sunscreen',
        quantity: 1,
        size: duration > 10 ? maxLiquidSize : '50ml',
        shareableInGroup: true,
        reason: 'Heavy use in sunny destinations'
      },
      {
        item: 'Body wash',
        quantity: 1,
        size: duration > 14 ? maxLiquidSize : '50ml',
        shareableInGroup: true,
        reason: 'Daily use calculation'
      }
    ];
  }

  static calculateGroupOptimizations(groupSize: number): Array<{
    item: string;
    sharedQuantity: number;
    individualQuantity: number;
    savings: string;
  }> {
    if (groupSize <= 1) return [];

    return [
      {
        item: 'First aid kit',
        sharedQuantity: 1,
        individualQuantity: groupSize,
        savings: `${groupSize - 1} fewer kits needed`
      },
      {
        item: 'Phone charger',
        sharedQuantity: Math.ceil(groupSize / 2),
        individualQuantity: groupSize,
        savings: `${Math.floor(groupSize / 2)} fewer chargers`
      },
      {
        item: 'Travel adapter',
        sharedQuantity: Math.ceil(groupSize / 2),
        individualQuantity: groupSize,
        savings: 'Share adapters in rooms'
      },
      {
        item: 'Laundry detergent',
        sharedQuantity: 1,
        individualQuantity: groupSize,
        savings: 'One pack serves whole group'
      },
      {
        item: 'Insect repellent',
        sharedQuantity: Math.ceil(groupSize / 3),
        individualQuantity: groupSize,
        savings: 'Family-size bottles'
      },
      {
        item: 'Sunscreen',
        sharedQuantity: Math.ceil(groupSize / 2),
        individualQuantity: groupSize,
        savings: 'Large bottles for sharing'
      }
    ];
  }

  static generateCarryOnTips(transportType: string): string[] {
    if (transportType !== 'carry-on') return [];

    return [
      'TSA Liquids: Max 3-1-1 rule (3.4oz containers, 1 quart bag, 1 bag per person)',
      'Wear heaviest items: boots, coat, heavy jeans on plane',
      'Pack electronics in easily accessible compartments',
      'Keep medications in original containers',
      'Avoid sharp objects: nail clippers OK, scissors under 4 inches',
      'Power banks: Under 100Wh, keep in carry-on only',
      'Lithium batteries: Keep in carry-on, never checked',
      'Food: Solid foods OK, liquids/gels follow 3-1-1 rule'
    ];
  }

  static calculateSpaceOptimization(items: string[], transportType: string): Array<{
    technique: string;
    items: string[];
    spaceSaved: string;
  }> {
    return [
      {
        technique: 'Rolling method',
        items: ['T-shirts', 'Pants', 'Underwear', 'Socks'],
        spaceSaved: '30% space reduction vs folding'
      },
      {
        technique: 'Compression packing cubes',
        items: ['All clothing', 'Sleeping clothes'],
        spaceSaved: '40% space reduction with compression'
      },
      {
        technique: 'Stuffing technique',
        items: ['Socks in shoes', 'Chargers in toiletry bags', 'Underwear in hats'],
        spaceSaved: 'Utilizes dead space in rigid items'
      },
      {
        technique: 'Layering system',
        items: ['Heavy coat as pillow', 'Boots as storage', 'Hat as electronics protection'],
        spaceSaved: 'Dual-purpose packing'
      },
      {
        technique: 'Coordinate system',
        items: ['3 tops + 2 bottoms = 6 outfits', 'Neutral colors only'],
        spaceSaved: 'More outfits with fewer pieces'
      }
    ];
  }
}