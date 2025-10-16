// Simple reference generation without database dependency
export interface ReferenceData {
  type: 'booking' | 'driver' | 'customer' | 'admin';
  reference: string;
  createdAt: Date;
}

// In-memory cache to avoid duplicates (for single instance)
const generatedReferences = new Set<string>();

export async function generateReference(type: 'booking' | 'driver' | 'customer' | 'admin' | 'route'): Promise<string> {
  const prefix = getPrefix(type);
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  const reference = `${prefix}${timestamp}${random}`;
  
  // Check if reference already exists in memory
  if (generatedReferences.has(reference)) {
    // If exists, generate a new one
    return generateReference(type);
  }
  
  // Add to memory cache
  generatedReferences.add(reference);
  
  return reference;
}

function getPrefix(type: string): string {
  switch (type) {
    case 'booking':
      return 'SV';
    case 'route':
      return 'RT';
    case 'driver':
      return 'SV';
    case 'customer':
      return 'SV';
    case 'admin':
      return 'SV';
    default:
      return 'SV';
  }
}

export async function validateReference(reference: string): Promise<boolean> {
  try {
    // Check if reference exists in memory cache
    return generatedReferences.has(reference);
  } catch (error) {
    console.error('Failed to validate reference:', error);
    return false;
  }
}

export async function getReferenceData(reference: string): Promise<ReferenceData | null> {
  try {
    // Check if reference exists in memory cache
    if (generatedReferences.has(reference)) {
      // Extract type from prefix
      const prefix = reference.substring(0, 2);
      const type = getTypeFromPrefix(prefix);
      
      return {
        type,
        reference,
        createdAt: new Date(), // We don't store actual creation time in memory
      };
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get reference data:', error);
    return null;
  }
}

function getTypeFromPrefix(prefix: string): 'booking' | 'driver' | 'customer' | 'admin' {
  // Since all references now start with 'SV', we default to 'booking'
  // Type distinction is now handled by context/usage rather than prefix
  switch (prefix) {
    case 'SV':
      return 'booking'; // Default to booking for SV prefixed references
    default:
      return 'booking';
  }
}

export async function createUniqueReference(type: 'booking' | 'driver' | 'customer' | 'admin' | 'route'): Promise<string> {
  return await generateReference(type);
}