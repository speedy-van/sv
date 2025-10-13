// UK Address Database Fallback System
// Provides local address data when external APIs fail

export interface UKAddressRecord {
  postcode: string;
  line1: string;
  line2?: string;
  city: string;
  county: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  buildingType: 'house' | 'flat' | 'commercial' | 'other';
  confidence: number;
}

// Sample UK address database for major cities
// In production, this would be loaded from a proper database or API
const UK_ADDRESS_DATABASE: UKAddressRecord[] = [
  // Hamilton ML3 area (Speedy Van's main office location)
  {
    postcode: 'ML3 0HS',
    line1: 'Office 2.18 1 Barrack St',
    city: 'Hamilton',
    county: 'South Lanarkshire',
    country: 'Scotland',
    coordinates: { lat: 55.7790, lng: -4.0393 },
    buildingType: 'commercial',
    confidence: 0.95
  },
  {
    postcode: 'ML3 0HS',
    line1: '2 Barrack Street',
    city: 'Hamilton',
    county: 'South Lanarkshire',
    country: 'Scotland',
    coordinates: { lat: 55.7791, lng: -4.0394 },
    buildingType: 'commercial',
    confidence: 0.95
  },
  {
    postcode: 'ML3 0HS',
    line1: '3 Barrack Street',
    city: 'Hamilton',
    county: 'South Lanarkshire',
    country: 'Scotland',
    coordinates: { lat: 55.7792, lng: -4.0395 },
    buildingType: 'commercial',
    confidence: 0.95
  },
  {
    postcode: 'ML3 0HS',
    line1: '4 Barrack Street',
    city: 'Hamilton',
    county: 'South Lanarkshire',
    country: 'Scotland',
    coordinates: { lat: 55.7793, lng: -4.0396 },
    buildingType: 'commercial',
    confidence: 0.95
  },
  {
    postcode: 'ML3 0HS',
    line1: '5 Barrack Street',
    city: 'Hamilton',
    county: 'South Lanarkshire',
    country: 'Scotland',
    coordinates: { lat: 55.7794, lng: -4.0397 },
    buildingType: 'commercial',
    confidence: 0.95
  },
  
  // London addresses
  {
    postcode: 'SW1A 1AA',
    line1: '1 Buckingham Palace Road',
    city: 'London',
    county: 'Greater London',
    country: 'England',
    coordinates: { lat: 51.5014, lng: -0.1419 },
    buildingType: 'commercial',
    confidence: 0.98
  },
  {
    postcode: 'SW1A 1AA',
    line1: '3 Buckingham Palace Road',
    city: 'London',
    county: 'Greater London',
    country: 'England',
    coordinates: { lat: 51.5015, lng: -0.1418 },
    buildingType: 'commercial',
    confidence: 0.98
  },
  {
    postcode: 'SW1A 1AA',
    line1: '5 Buckingham Palace Road',
    city: 'London',
    county: 'Greater London',
    country: 'England',
    coordinates: { lat: 51.5016, lng: -0.1417 },
    buildingType: 'commercial',
    confidence: 0.98
  },
  
  // Manchester addresses
  {
    postcode: 'M1 1AA',
    line1: '1 Deansgate',
    city: 'Manchester',
    county: 'Greater Manchester',
    country: 'England',
    coordinates: { lat: 53.4808, lng: -2.2426 },
    buildingType: 'commercial',
    confidence: 0.95
  },
  {
    postcode: 'M1 1AA',
    line1: '3 Deansgate',
    city: 'Manchester',
    county: 'Greater Manchester',
    country: 'England',
    coordinates: { lat: 53.4809, lng: -2.2425 },
    buildingType: 'commercial',
    confidence: 0.95
  },
  
  // Birmingham addresses
  {
    postcode: 'B1 1AA',
    line1: '1 New Street',
    city: 'Birmingham',
    county: 'West Midlands',
    country: 'England',
    coordinates: { lat: 52.4793, lng: -1.9026 },
    buildingType: 'commercial',
    confidence: 0.95
  },
  {
    postcode: 'B1 1AA',
    line1: '3 New Street',
    city: 'Birmingham',
    county: 'West Midlands',
    country: 'England',
    coordinates: { lat: 52.4794, lng: -1.9025 },
    buildingType: 'commercial',
    confidence: 0.95
  },
  
  // Edinburgh addresses
  {
    postcode: 'EH1 1AA',
    line1: '1 Princes Street',
    city: 'Edinburgh',
    county: 'City of Edinburgh',
    country: 'Scotland',
    coordinates: { lat: 55.9533, lng: -3.1883 },
    buildingType: 'commercial',
    confidence: 0.95
  },
  {
    postcode: 'EH1 1AA',
    line1: '3 Princes Street',
    city: 'Edinburgh',
    county: 'City of Edinburgh',
    country: 'Scotland',
    coordinates: { lat: 55.9534, lng: -3.1882 },
    buildingType: 'commercial',
    confidence: 0.95
  }
];

export class UKAddressDatabase {
  private static instance: UKAddressDatabase;
  private database: UKAddressRecord[] = UK_ADDRESS_DATABASE;

  static getInstance(): UKAddressDatabase {
    if (!UKAddressDatabase.instance) {
      UKAddressDatabase.instance = new UKAddressDatabase();
    }
    return UKAddressDatabase.instance;
  }

  // Search addresses by postcode
  searchByPostcode(postcode: string, limit: number = 10): UKAddressRecord[] {
    const normalizedPostcode = postcode.trim().toUpperCase().replace(/\s+/g, ' ');
    
    return this.database
      .filter(record => record.postcode === normalizedPostcode)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  // Search addresses by partial postcode
  searchByPartialPostcode(partialPostcode: string, limit: number = 10): UKAddressRecord[] {
    const normalizedPartial = partialPostcode.trim().toUpperCase();
    
    return this.database
      .filter(record => record.postcode.startsWith(normalizedPartial))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  // Search addresses by street name
  searchByStreet(streetName: string, limit: number = 10): UKAddressRecord[] {
    const normalizedStreet = streetName.trim().toLowerCase();
    
    return this.database
      .filter(record => 
        record.line1.toLowerCase().includes(normalizedStreet) ||
        record.line2?.toLowerCase().includes(normalizedStreet)
      )
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  // Search addresses by city
  searchByCity(cityName: string, limit: number = 10): UKAddressRecord[] {
    const normalizedCity = cityName.trim().toLowerCase();
    
    return this.database
      .filter(record => record.city.toLowerCase().includes(normalizedCity))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  // Convert UK address record to AddressSuggestion format
  convertToAddressSuggestion(record: UKAddressRecord): any {
    return {
      id: `uk-db-${record.postcode}-${record.line1.replace(/\s+/g, '-').toLowerCase()}`,
      text: record.line1,
      place_name: `${record.line1}${record.line2 ? `, ${record.line2}` : ''}, ${record.city}, ${record.postcode}`,
      center: [record.coordinates.lng, record.coordinates.lat],
      context: [],
      properties: {
        accuracy: 'high',
        address: record.line1
      },
      icon: record.buildingType === 'house' ? '🏠' : record.buildingType === 'flat' ? '🏢' : '🏬',
      type: 'address',
      formatted_address: `${record.line1}${record.line2 ? `, ${record.line2}` : ''}, ${record.city}, ${record.postcode}`,
      postcode: record.postcode,
      provider: 'uk-database',
      address: {
        line1: record.line1,
        line2: record.line2,
        city: record.city,
        postcode: record.postcode,
        country: 'GB',
        full_address: `${record.line1}${record.line2 ? `, ${record.line2}` : ''}, ${record.city}, ${record.postcode}`
      },
      coords: record.coordinates,
      priority: 7, // High priority for database results
      isPostcodeMatch: true,
      hasCompleteAddress: true,
      confidence: record.confidence,
      source: 'uk-database'
    };
  }

  // Get all available postcodes
  getAvailablePostcodes(): string[] {
    return [...new Set(this.database.map(record => record.postcode))].sort();
  }

  // Get all available cities
  getAvailableCities(): string[] {
    return [...new Set(this.database.map(record => record.city))].sort();
  }

  // Add new address record (for dynamic updates)
  addAddress(record: UKAddressRecord): void {
    this.database.push(record);
  }

  // Get database statistics
  getStats(): {
    totalAddresses: number;
    postcodes: number;
    cities: number;
    buildingTypes: Record<string, number>;
  } {
    const buildingTypes = this.database.reduce((acc, record) => {
      acc[record.buildingType] = (acc[record.buildingType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAddresses: this.database.length,
      postcodes: new Set(this.database.map(r => r.postcode)).size,
      cities: new Set(this.database.map(r => r.city)).size,
      buildingTypes
    };
  }
}

// Export singleton instance
export const ukAddressDatabase = UKAddressDatabase.getInstance();

// Export utility functions
export const ukAddressUtils = {
  // Validate UK postcode format
  isValidUKPostcode: (postcode: string): boolean => {
    const ukPostcodeRegex = /^[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][ABD-HJLNP-UW-Z]{2}$/i;
    return ukPostcodeRegex.test(postcode.trim());
  },

  // Format UK postcode
  formatUKPostcode: (postcode: string): string => {
    return postcode.trim().toUpperCase().replace(/\s+/g, ' ');
  },

  // Extract postcode from address string
  extractPostcode: (address: string): string => {
    const match = address.match(/\b[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][ABD-HJLNP-UW-Z]{2}\b/i);
    return match ? match[0].toUpperCase().replace(/\s+/g, ' ') : '';
  },

  // Check if address is in supported area
  isInSupportedArea: (postcode: string): boolean => {
    const supportedAreas = ['G21', 'SW1A', 'M1', 'B1', 'EH1'];
    return supportedAreas.some(area => postcode.startsWith(area));
  }
};

