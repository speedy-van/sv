// Royal Mail PAF Service Integration
// Provides accurate UK addresses using official Postcode Address File data
// Similar to Confused.com's address autocomplete system

export interface PAFAddress {
  id: string;
  line1: string;
  line2?: string;
  line3?: string;
  city: string;
  postcode: string;
  county: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  buildingType: 'house' | 'flat' | 'apartment' | 'commercial' | 'other';
  subBuilding?: string; // Flat number, apartment, etc.
  buildingName?: string;
  confidence: number;
  source: 'paf' | 'loqate' | 'ideal-postcodes';
}

export interface PAFSearchResult {
  id: string;
  text: string;
  description: string;
  postcode: string;
  address: PAFAddress;
  coordinates: {
    lat: number;
    lng: number;
  };
  confidence: number;
  source: string;
}

// Loqate API Configuration
const LOQATE_API_KEY = process.env.LOQATE_API_KEY || process.env.NEXT_PUBLIC_LOQATE_API_KEY;
const LOQATE_BASE_URL = 'https://api.addressy.com/Capture/Interactive';

// Ideal Postcodes API Configuration (Fallback)
const IDEAL_POSTCODES_API_KEY = process.env.IDEAL_POSTCODES_API_KEY || process.env.NEXT_PUBLIC_IDEAL_POSTCODES_API_KEY;
const IDEAL_POSTCODES_BASE_URL = 'https://api.ideal-postcodes.co.uk/v1';

// Royal Mail AddressNow API Configuration (Premium)
const ROYAL_MAIL_API_KEY = process.env.ROYAL_MAIL_API_KEY || process.env.NEXT_PUBLIC_ROYAL_MAIL_API_KEY;
const ROYAL_MAIL_BASE_URL = 'https://api.royalmail.net/addressnow/v1';

export class RoyalMailPAFService {
  private static instance: RoyalMailPAFService;
  private cache = new Map<string, PAFSearchResult[]>();
  private readonly CACHE_DURATION = 300000; // 5 minutes

  static getInstance(): RoyalMailPAFService {
    if (!RoyalMailPAFService.instance) {
      RoyalMailPAFService.instance = new RoyalMailPAFService();
    }
    return RoyalMailPAFService.instance;
  }

  // Main search method with multiple provider fallback
  async searchAddresses(
    query: string,
    options?: {
      limit?: number;
      includeSubBuildings?: boolean;
      proximity?: { lat: number; lng: number };
    }
  ): Promise<PAFSearchResult[]> {
    const limit = options?.limit || 10;
    const cacheKey = this.getCacheKey(query, options);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(`[PAF] Using cached results for: "${query}"`);
      return cached;
    }

    let results: PAFSearchResult[] = [];

    // Try Loqate first (most comprehensive)
    if (LOQATE_API_KEY) {
      try {
        console.log(`[PAF] Searching with Loqate for: "${query}"`);
        results = await this.searchWithLoqate(query, options);
        if (results.length > 0) {
          this.cache.set(cacheKey, results);
          return results;
        }
      } catch (error) {
        console.warn('[PAF] Loqate search failed:', error);
      }
    }

    // Try Ideal Postcodes (cost-effective fallback)
    if (IDEAL_POSTCODES_API_KEY && results.length === 0) {
      try {
        console.log(`[PAF] Searching with Ideal Postcodes for: "${query}"`);
        results = await this.searchWithIdealPostcodes(query, options);
        if (results.length > 0) {
          this.cache.set(cacheKey, results);
          return results;
        }
      } catch (error) {
        console.warn('[PAF] Ideal Postcodes search failed:', error);
      }
    }

    // Try Royal Mail AddressNow (premium option)
    if (ROYAL_MAIL_API_KEY && results.length === 0) {
      try {
        console.log(`[PAF] Searching with Royal Mail AddressNow for: "${query}"`);
        results = await this.searchWithRoyalMail(query, options);
        if (results.length > 0) {
          this.cache.set(cacheKey, results);
          return results;
        }
      } catch (error) {
        console.warn('[PAF] Royal Mail AddressNow search failed:', error);
      }
    }

    console.log(`[PAF] No results found for: "${query}"`);
    return [];
  }

  // Loqate API implementation
  private async searchWithLoqate(
    query: string,
    options?: any
  ): Promise<PAFSearchResult[]> {
    const isPostcodeQuery = this.isUKPostcode(query);
    
    if (isPostcodeQuery) {
      return this.searchPostcodeWithLoqate(query, options);
    } else {
      return this.searchAddressWithLoqate(query, options);
    }
  }

  // Search by postcode using Loqate
  private async searchPostcodeWithLoqate(
    postcode: string,
    options?: any
  ): Promise<PAFSearchResult[]> {
    const formattedPostcode = this.formatUKPostcode(postcode);
    
    // Step 1: Find the postcode
    const findUrl = `${LOQATE_BASE_URL}/Find/v1.1/json3.ws`;
    const findParams = new URLSearchParams({
      Key: LOQATE_API_KEY!,
      Text: formattedPostcode,
      Country: 'GB',
      Limit: '10'
    });

    const findResponse = await fetch(`${findUrl}?${findParams}`);
    const findData = await findResponse.json();

    if (!findData.Items || findData.Items.length === 0) {
      return [];
    }

    // Step 2: Get detailed addresses for the postcode
    const retrieveUrl = `${LOQATE_BASE_URL}/Retrieve/v1.2/json3.ws`;
    const retrieveParams = new URLSearchParams({
      Key: LOQATE_API_KEY!,
      Id: findData.Items[0].Id
    });

    const retrieveResponse = await fetch(`${retrieveUrl}?${retrieveParams}`);
    const retrieveData = await retrieveResponse.json();

    if (!retrieveData.Items) {
      return [];
    }

    // Convert to our format
    return retrieveData.Items.map((item: any, index: number) => 
      this.convertLoqateToPAFResult(item, formattedPostcode, index)
    );
  }

  // Search by address using Loqate
  private async searchAddressWithLoqate(
    address: string,
    options?: any
  ): Promise<PAFSearchResult[]> {
    const findUrl = `${LOQATE_BASE_URL}/Find/v1.1/json3.ws`;
    const findParams = new URLSearchParams({
      Key: LOQATE_API_KEY!,
      Text: address,
      Country: 'GB',
      Limit: String(options?.limit || 10)
    });

    const findResponse = await fetch(`${findUrl}?${findParams}`);
    const findData = await findResponse.json();

    if (!findData.Items || findData.Items.length === 0) {
      return [];
    }

    // Get detailed information for each result
    const results: PAFSearchResult[] = [];
    
    for (const item of findData.Items.slice(0, options?.limit || 10)) {
      try {
        const retrieveUrl = `${LOQATE_BASE_URL}/Retrieve/v1.2/json3.ws`;
        const retrieveParams = new URLSearchParams({
          Key: LOQATE_API_KEY!,
          Id: item.Id
        });

        const retrieveResponse = await fetch(`${retrieveUrl}?${retrieveParams}`);
        const retrieveData = await retrieveResponse.json();

        if (retrieveData.Items && retrieveData.Items.length > 0) {
          results.push(this.convertLoqateToPAFResult(retrieveData.Items[0], '', 0));
        }
      } catch (error) {
        console.warn(`[PAF] Failed to retrieve details for ${item.Id}:`, error);
      }
    }

    return results;
  }

  // Convert Loqate result to our format
  private convertLoqateToPAFResult(item: any, postcode: string, index: number): PAFSearchResult {
    const address = item.Description || '';
    const parts = address.split(',');
    
    let line1 = parts[0]?.trim() || '';
    let line2 = parts[1]?.trim() || '';
    let city = parts[parts.length - 3]?.trim() || '';
    const extractedPostcode = postcode || this.extractPostcodeFromAddress(address);
    
    // Determine building type
    const buildingType = this.determineBuildingType(line1, line2);
    
    // Extract sub-building information
    const subBuilding = this.extractSubBuilding(line1, line2);
    
    return {
      id: `loqate-${item.Id || index}`,
      text: line1,
      description: address,
      postcode: extractedPostcode,
      address: {
        id: `loqate-${item.Id || index}`,
        line1: line1,
        line2: line2 || undefined,
        city: city,
        postcode: extractedPostcode,
        county: parts[parts.length - 2]?.trim() || '',
        country: 'GB',
        coordinates: {
          lat: parseFloat(item.Latitude) || 0,
          lng: parseFloat(item.Longitude) || 0
        },
        buildingType,
        subBuilding,
        confidence: 0.95,
        source: 'loqate'
      },
      coordinates: {
        lat: parseFloat(item.Latitude) || 0,
        lng: parseFloat(item.Longitude) || 0
      },
      confidence: 0.95,
      source: 'loqate'
    };
  }

  // Ideal Postcodes API implementation
  private async searchWithIdealPostcodes(
    query: string,
    options?: any
  ): Promise<PAFSearchResult[]> {
    const isPostcodeQuery = this.isUKPostcode(query);
    
    if (!isPostcodeQuery) {
      return [];
    }

    const formattedPostcode = this.formatUKPostcode(query);
    const url = `${IDEAL_POSTCODES_BASE_URL}/postcodes/${formattedPostcode}?api_key=${IDEAL_POSTCODES_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.result || !Array.isArray(data.result)) {
      return [];
    }

    return data.result.map((item: any, index: number) => 
      this.convertIdealPostcodesToPAFResult(item, formattedPostcode, index)
    );
  }

  // Convert Ideal Postcodes result to our format
  private convertIdealPostcodesToPAFResult(item: any, postcode: string, index: number): PAFSearchResult {
    const line1 = item.line_1 || '';
    const line2 = item.line_2 || '';
    const line3 = item.line_3 || '';
    const city = item.post_town || '';
    const county = item.county || '';
    
    const buildingType = this.determineBuildingType(line1, line2);
    const subBuilding = this.extractSubBuilding(line1, line2);
    
    return {
      id: `ideal-${postcode}-${index}`,
      text: line1,
      description: [line1, line2, line3].filter(Boolean).join(', '),
      postcode: postcode,
      address: {
        id: `ideal-${postcode}-${index}`,
        line1: line1,
        line2: line2 || undefined,
        line3: line3 || undefined,
        city: city,
        postcode: postcode,
        county: county,
        country: 'GB',
        coordinates: {
          lat: parseFloat(item.latitude) || 0,
          lng: parseFloat(item.longitude) || 0
        },
        buildingType,
        subBuilding,
        confidence: 0.9,
        source: 'ideal-postcodes'
      },
      coordinates: {
        lat: parseFloat(item.latitude) || 0,
        lng: parseFloat(item.longitude) || 0
      },
      confidence: 0.9,
      source: 'ideal-postcodes'
    };
  }

  // Royal Mail AddressNow API implementation
  private async searchWithRoyalMail(
    query: string,
    options?: any
  ): Promise<PAFSearchResult[]> {
    const isPostcodeQuery = this.isUKPostcode(query);
    
    if (!isPostcodeQuery) {
      return [];
    }

    const formattedPostcode = this.formatUKPostcode(query);
    const url = `${ROYAL_MAIL_BASE_URL}/addresses`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ROYAL_MAIL_API_KEY}`
      },
      body: JSON.stringify({
        postcode: formattedPostcode,
        limit: options?.limit || 10
      })
    });

    const data = await response.json();

    if (!data.addresses || !Array.isArray(data.addresses)) {
      return [];
    }

    return data.addresses.map((item: any, index: number) => 
      this.convertRoyalMailToPAFResult(item, formattedPostcode, index)
    );
  }

  // Convert Royal Mail result to our format
  private convertRoyalMailToPAFResult(item: any, postcode: string, index: number): PAFSearchResult {
    const line1 = item.line1 || '';
    const line2 = item.line2 || '';
    const city = item.city || '';
    const county = item.county || '';
    
    const buildingType = this.determineBuildingType(line1, line2);
    const subBuilding = this.extractSubBuilding(line1, line2);
    
    return {
      id: `royal-mail-${postcode}-${index}`,
      text: line1,
      description: [line1, line2].filter(Boolean).join(', '),
      postcode: postcode,
      address: {
        id: `royal-mail-${postcode}-${index}`,
        line1: line1,
        line2: line2 || undefined,
        city: city,
        postcode: postcode,
        county: county,
        country: 'GB',
        coordinates: {
          lat: parseFloat(item.latitude) || 0,
          lng: parseFloat(item.longitude) || 0
        },
        buildingType,
        subBuilding,
        confidence: 0.98,
        source: 'paf'
      },
      coordinates: {
        lat: parseFloat(item.latitude) || 0,
        lng: parseFloat(item.longitude) || 0
      },
      confidence: 0.98,
      source: 'royal-mail'
    };
  }

  // Helper methods
  private isUKPostcode(postcode: string): boolean {
    const ukPostcodeRegex = /^[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][ABD-HJLNP-UW-Z]{2}$/i;
    return ukPostcodeRegex.test(postcode.trim());
  }

  private formatUKPostcode(postcode: string): string {
    return postcode.trim().toUpperCase().replace(/\s+/g, ' ');
  }

  private extractPostcodeFromAddress(address: string): string {
    const match = address.match(/\b[A-Z]{1,2}[0-9][A-Z0-9]? [0-9][ABD-HJLNP-UW-Z]{2}\b/i);
    return match ? match[0].toUpperCase().replace(/\s+/g, ' ') : '';
  }

  private determineBuildingType(line1: string, line2: string): 'house' | 'flat' | 'apartment' | 'commercial' | 'other' {
    const text = `${line1} ${line2}`.toLowerCase();
    
    if (text.includes('flat') || text.includes('apartment')) {
      return 'flat';
    }
    if (text.includes('house') || /^\d+/.test(line1)) {
      return 'house';
    }
    if (text.includes('office') || text.includes('building') || text.includes('centre')) {
      return 'commercial';
    }
    
    return 'other';
  }

  private extractSubBuilding(line1: string, line2: string): string | undefined {
    const text = `${line1} ${line2}`.toLowerCase();
    
    // Look for flat/apartment numbers
    const flatMatch = text.match(/(?:flat|apartment|apt)\s*(\d+[a-z]?)/i);
    if (flatMatch) {
      return `Flat ${flatMatch[1]}`;
    }
    
    // Look for unit numbers
    const unitMatch = text.match(/unit\s*(\d+[a-z]?)/i);
    if (unitMatch) {
      return `Unit ${unitMatch[1]}`;
    }
    
    return undefined;
  }

  private getCacheKey(query: string, options?: any): string {
    const optionsStr = options ? JSON.stringify(options) : '';
    return `paf-${query.toLowerCase()}-${optionsStr}`;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const royalMailPAFService = RoyalMailPAFService.getInstance();

// Export utility functions
export const pafUtils = {
  isValidUKPostcode: (postcode: string): boolean => {
    const ukPostcodeRegex = /^[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][ABD-HJLNP-UW-Z]{2}$/i;
    return ukPostcodeRegex.test(postcode.trim());
  },
  
  formatUKPostcode: (postcode: string): string => {
    return postcode.trim().toUpperCase().replace(/\s+/g, ' ');
  },
  
  extractPostcode: (address: string): string => {
    const match = address.match(/\b[A-Z]{1,2}[0-9][A-Z0-9]? [0-9][ABD-HJLNP-UW-Z]{2}\b/i);
    return match ? match[0].toUpperCase().replace(/\s+/g, ' ') : '';
  }
};
