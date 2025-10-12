import { BookingItem, PropertyInfo } from '@/types';

interface SmartSuggestion {
  type: 'info' | 'warning' | 'alert';
  category: 'workers' | 'equipment' | 'access' | 'handling' | 'tools' | 'zones' | 'timing';
  title: string;
  description: string;
}

export function generateSmartSuggestions(
  items: BookingItem[],
  pickupProperty: any, // Using any to handle database values
  dropoffProperty: any, // Using any to handle database values
  scheduledAt: Date,
  pickupPostcode?: string,
  dropoffPostcode?: string
): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];

  // Calculate totals
  const totalVolume = items.reduce((acc, item) => acc + (item.volume || 0), 0);
  const totalWeight = items.reduce((acc, item) => acc + (item.weight || 0), 0);

  // Analyze items
  const itemCategories = {
    fragile: items.some(item => 
      /glass|fragile|ceramic|mirror|electronics|tv|television/i.test(item.name)
    ),
    furniture: items.some(item =>
      /sofa|table|bed|wardrobe|cabinet|drawer|chair|desk/i.test(item.name)
    ),
    whiteGoods: items.some(item =>
      /fridge|freezer|washing|dishwasher|oven|cooker/i.test(item.name)
    ),
    heavyItems: items.some(item => (item.weight || 0) > 50),
    piano: items.some(item => /piano/i.test(item.name)),
    artworks: items.some(item => /painting|artwork|sculpture|antique/i.test(item.name))
  };

  // Worker recommendations
  if (totalVolume > 15 || itemCategories.piano) {
    suggestions.push({
      type: 'warning',
      category: 'workers',
      title: 'Large Team Required',
      description: `This job requires at least 3 workers due to ${
        itemCategories.piano ? 'presence of a piano' : 'the exceptionally large volume of items'
      }.`
    });
  } else if (totalVolume > 10 || itemCategories.whiteGoods || 
    (itemCategories.furniture && totalWeight > 150)) {
    suggestions.push({
      type: 'warning',
      category: 'workers',
      title: 'Additional Worker Needed',
      description: `Additional worker recommended due to ${
        itemCategories.whiteGoods ? 'presence of white goods' :
        itemCategories.furniture ? 'heavy furniture items' :
        'total volume exceeding 10m³'
      }.`
    });
  }

  // Equipment suggestions
  if (itemCategories.whiteGoods || itemCategories.heavyItems) {
    suggestions.push({
      type: 'warning',
      category: 'equipment',
      title: 'Heavy Duty Equipment Required',
      description: 'Bring appliance dolly, heavy-duty straps, and furniture sliders for safe handling.'
    });
  }

  if (itemCategories.piano) {
    suggestions.push({
      type: 'alert',
      category: 'equipment',
      title: 'Specialized Piano Equipment Required',
      description: 'Piano board, specialized straps, and piano dolly are essential. Ensure proper insurance coverage.'
    });
  }

  // Access considerations
  const pickupFloors = pickupProperty?.floors || 0;
  const dropoffFloors = dropoffProperty?.floors || 0;
  const pickupHasLift = pickupProperty?.accessType === 'WITH_LIFT';
  const dropoffHasLift = dropoffProperty?.accessType === 'WITH_LIFT';

  if ((pickupFloors > 0 && !pickupHasLift) || (dropoffFloors > 0 && !dropoffHasLift)) {
    const locations = [];
    if (pickupFloors > 0 && !pickupHasLift) locations.push(`pickup (${pickupFloors} floors)`);
    if (dropoffFloors > 0 && !dropoffHasLift) locations.push(`dropoff (${dropoffFloors} floors)`);
    
    suggestions.push({
      type: 'warning',
      category: 'access',
      title: 'Stair Carrying Required',
      description: `No lift access at ${locations.join(' and ')}. ${
        itemCategories.heavyItems || itemCategories.whiteGoods ? 
        'Additional workers and stair climbing equipment required.' :
        'Consider additional worker for safety.'
      }`
    });
  }

  // Special handling instructions
  if (itemCategories.fragile) {
    suggestions.push({
      type: 'info',
      category: 'handling',
      title: 'Fragile Items Present',
      description: 'Ensure sufficient bubble wrap, protective blankets, and corner protectors. Document item condition before moving.'
    });
  }

  if (itemCategories.artworks) {
    suggestions.push({
      type: 'info',
      category: 'handling',
      title: 'Artwork/Antiques Present',
      description: 'Use art boxes or crates for paintings. Take detailed photos before moving. Handle with extreme care.'
    });
  }

  // Tools needed
  if (itemCategories.furniture) {
    suggestions.push({
      type: 'info',
      category: 'tools',
      title: 'Furniture Tools Required',
      description: 'Bring basic tool kit (screwdrivers, Allen keys, wrench set) for furniture disassembly. Check with customer about disassembly preferences.'
    });
  }

  // Timing considerations
  const scheduledHour = scheduledAt.getHours();
  const isRushHour = (scheduledHour >= 7 && scheduledHour <= 9) || 
                     (scheduledHour >= 16 && scheduledHour <= 18);

  if (isRushHour) {
    suggestions.push({
      type: 'info',
      category: 'timing',
      title: 'Peak Traffic Hours',
      description: `Job scheduled during ${
        scheduledHour < 12 ? 'morning' : 'evening'
      } rush hour. Add 30-45 minutes to estimated travel time.`
    });
  }

  // Weather-based suggestions (could be expanded with weather API integration)
  const isWinterMonth = [11, 0, 1].includes(scheduledAt.getMonth());
  if (isWinterMonth) {
    suggestions.push({
      type: 'info',
      category: 'timing',
      title: 'Winter Weather Advisory',
      description: 'Check weather forecast. Bring covers to protect items from rain/snow. Allow extra time for adverse conditions.'
    });
  }

  // Zone-based suggestions (ULEZ/LEZ)
  if (pickupPostcode || dropoffPostcode) {
    const ulezPrefixes = ['EC1', 'EC2', 'EC3', 'EC4', 'WC1', 'WC2', 'SE1', 'E1'];
    const lezPrefixes = ['N1', 'E2', 'E8', 'SE11'];
    const congestionChargePrefixes = ['EC1', 'EC2', 'EC3', 'EC4', 'WC1', 'WC2'];
    
    const pickupInULEZ = pickupPostcode && ulezPrefixes.some(prefix => 
      pickupPostcode.toUpperCase().startsWith(prefix)
    );
    const dropoffInULEZ = dropoffPostcode && ulezPrefixes.some(prefix => 
      dropoffPostcode.toUpperCase().startsWith(prefix)
    );
    
    const pickupInLEZ = pickupPostcode && lezPrefixes.some(prefix => 
      pickupPostcode.toUpperCase().startsWith(prefix)
    );
    const dropoffInLEZ = dropoffPostcode && lezPrefixes.some(prefix => 
      dropoffPostcode.toUpperCase().startsWith(prefix)
    );
    
    const pickupInCongestion = pickupPostcode && congestionChargePrefixes.some(prefix => 
      pickupPostcode.toUpperCase().startsWith(prefix)
    );
    const dropoffInCongestion = dropoffPostcode && congestionChargePrefixes.some(prefix => 
      dropoffPostcode.toUpperCase().startsWith(prefix)
    );

    if (pickupInULEZ || dropoffInULEZ) {
      suggestions.push({
        type: 'alert',
        category: 'zones',
        title: 'ULEZ Zone Alert',
        description: `Route passes through ULEZ zone. Ensure vehicle meets ULEZ standards or factor in £12.50 daily charge. Check TfL ULEZ checker before departure.`
      });
    }

    if (pickupInLEZ || dropoffInLEZ) {
      suggestions.push({
        type: 'warning',
        category: 'zones',
        title: 'LEZ Zone Notice',
        description: `Route passes through Low Emission Zone. Ensure vehicle meets LEZ standards or factor in daily charges.`
      });
    }

    if (pickupInCongestion || dropoffInCongestion) {
      suggestions.push({
        type: 'warning',
        category: 'zones',
        title: 'Congestion Charge Zone',
        description: `Route passes through Congestion Charge Zone. Factor in £15 daily charge (Mon-Fri 7am-6pm).`
      });
    }
  }

  return suggestions;
}