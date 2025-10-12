import AsyncStorage from '@react-native-async-storage/async-storage';

console.log('🔍 AsyncStorage imported:', typeof AsyncStorage);

const KEYS = {
  TOKEN: 'auth_token',
  USER: 'current_user',
  DRIVER: 'current_driver',
  PROFILE: 'driver_profile',
  ROUTES: 'active_routes',
  JOB_STATES: 'job_states',
};

// Token
export const saveToken = async (token: string): Promise<void> => {
  try {
    console.log('💾 Saving token, AsyncStorage available:', !!AsyncStorage);
    await AsyncStorage.setItem(KEYS.TOKEN, token);
  } catch (error) {
    console.error('Error saving token:', error);
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    console.log('📖 Getting token, AsyncStorage available:', !!AsyncStorage, typeof AsyncStorage);
    const result = await AsyncStorage.getItem(KEYS.TOKEN);
    console.log('📖 Token retrieved:', !!result);
    return result;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(KEYS.TOKEN);
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

// User
export const saveUser = async (user: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user:', error);
  }
};

export const getUser = async (): Promise<any | null> => {
  try {
    const user = await AsyncStorage.getItem(KEYS.USER);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const removeUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(KEYS.USER);
  } catch (error) {
    console.error('Error removing user:', error);
  }
};

// Driver
export const saveDriver = async (driver: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.DRIVER, JSON.stringify(driver));
  } catch (error) {
    console.error('Error saving driver:', error);
  }
};

export const getDriver = async (): Promise<any | null> => {
  try {
    const driver = await AsyncStorage.getItem(KEYS.DRIVER);
    return driver ? JSON.parse(driver) : null;
  } catch (error) {
    console.error('Error getting driver:', error);
    return null;
  }
};

export const removeDriver = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(KEYS.DRIVER);
  } catch (error) {
    console.error('Error removing driver:', error);
  }
};

// Profile
export const saveProfile = async (profile: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
    console.log('✅ Profile saved to cache');
  } catch (error) {
    console.error('Error saving profile:', error);
  }
};

export const getProfile = async (): Promise<any | null> => {
  try {
    const profile = await AsyncStorage.getItem(KEYS.PROFILE);
    return profile ? JSON.parse(profile) : null;
  } catch (error) {
    console.error('Error getting profile:', error);
    return null;
  }
};

// Routes
export const saveRoutes = async (routes: any[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.ROUTES, JSON.stringify(routes));
    console.log(`✅ ${routes.length} route(s) saved to cache`);
  } catch (error) {
    console.error('Error saving routes:', error);
  }
};

export const getRoutes = async (): Promise<any[] | null> => {
  try {
    const routes = await AsyncStorage.getItem(KEYS.ROUTES);
    return routes ? JSON.parse(routes) : null;
  } catch (error) {
    console.error('Error getting routes:', error);
    return null;
  }
};

// Job States (accept/decline tracking)
export const saveJobState = async (jobId: string, state: 'accepted' | 'declined'): Promise<void> => {
  try {
    const existing = await AsyncStorage.getItem(KEYS.JOB_STATES);
    const states = existing ? JSON.parse(existing) : {};
    states[jobId] = {
      state,
      timestamp: new Date().toISOString(),
    };
    await AsyncStorage.setItem(KEYS.JOB_STATES, JSON.stringify(states));
    console.log(`✅ Job state saved: ${jobId} = ${state}`);
  } catch (error) {
    console.error('Error saving job state:', error);
  }
};

export const getJobState = async (jobId: string): Promise<'accepted' | 'declined' | null> => {
  try {
    const states = await AsyncStorage.getItem(KEYS.JOB_STATES);
    if (states) {
      const parsed = JSON.parse(states);
      return parsed[jobId]?.state || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting job state:', error);
    return null;
  }
};

export const clearJobState = async (jobId: string): Promise<void> => {
  try {
    const existing = await AsyncStorage.getItem(KEYS.JOB_STATES);
    if (existing) {
      const states = JSON.parse(existing);
      delete states[jobId];
      await AsyncStorage.setItem(KEYS.JOB_STATES, JSON.stringify(states));
    }
  } catch (error) {
    console.error('Error clearing job state:', error);
  }
};

// Clear all
export const clearAuth = async (): Promise<void> => {
  try {
    await Promise.all([
      removeToken(),
      removeUser(),
      removeDriver(),
      AsyncStorage.removeItem(KEYS.PROFILE),
      AsyncStorage.removeItem(KEYS.ROUTES),
      AsyncStorage.removeItem(KEYS.JOB_STATES),
      AsyncStorage.removeItem('pending_offers'), // Clear pending offers on logout
    ]);
  } catch (error) {
    console.error('Error clearing auth:', error);
  }
};

// ============ PENDING OFFERS PERSISTENCE ============

export interface PendingOffer {
  id: string; // Unique identifier (assignmentId)
  bookingId: string;
  orderId: string;
  bookingReference: string;
  orderNumber: string;
  matchType: 'order' | 'route';
  jobCount: number;
  assignmentId: string;
  assignedAt: string; // ISO timestamp
  expiresAt: string; // ISO timestamp
  pickupAddress?: any;
  dropoffAddress?: any;
  estimatedEarnings?: number;
  distance?: number;
  customerName?: string;
  receivedAt: string; // ISO timestamp when offer was received
}

/**
 * Save a pending offer to AsyncStorage
 */
export const savePendingOffer = async (offer: PendingOffer): Promise<void> => {
  try {
    console.log('💾 Saving pending offer to storage:', offer.id);
    const offers = await getPendingOffers();
    
    // Check if offer already exists
    const existingIndex = offers.findIndex(o => o.id === offer.id);
    
    if (existingIndex >= 0) {
      // Update existing offer
      offers[existingIndex] = offer;
      console.log('📝 Updated existing pending offer:', offer.id);
    } else {
      // Add new offer
      offers.push(offer);
      console.log('✅ Added new pending offer:', offer.id);
    }
    
    await AsyncStorage.setItem('pending_offers', JSON.stringify(offers));
    console.log(`💾 Total pending offers in storage: ${offers.length}`);
  } catch (error) {
    console.error('❌ Error saving pending offer:', error);
  }
};

/**
 * Get all pending offers from AsyncStorage
 */
export const getPendingOffers = async (): Promise<PendingOffer[]> => {
  try {
    const offersJson = await AsyncStorage.getItem('pending_offers');
    
    if (!offersJson) {
      return [];
    }
    
    const offers: PendingOffer[] = JSON.parse(offersJson);
    const now = Date.now();
    
    // Filter out expired offers
    const activeOffers = offers.filter(offer => {
      const expiryTime = new Date(offer.expiresAt).getTime();
      const isExpired = expiryTime < now;
      
      if (isExpired) {
        console.log(`⏰ Offer ${offer.id} has expired, removing from storage`);
      }
      
      return !isExpired;
    });
    
    // Save back the filtered list if any were removed
    if (activeOffers.length !== offers.length) {
      await AsyncStorage.setItem('pending_offers', JSON.stringify(activeOffers));
      console.log(`🧹 Cleaned ${offers.length - activeOffers.length} expired offers from storage`);
    }
    
    console.log(`📦 Retrieved ${activeOffers.length} active pending offers from storage`);
    return activeOffers;
  } catch (error) {
    console.error('❌ Error getting pending offers:', error);
    return [];
  }
};

/**
 * Remove a specific pending offer by ID
 */
export const removePendingOffer = async (offerId: string): Promise<void> => {
  try {
    console.log('🗑️ Removing pending offer from storage:', offerId);
    const offers = await getPendingOffers();
    const filteredOffers = offers.filter(o => o.id !== offerId);
    
    await AsyncStorage.setItem('pending_offers', JSON.stringify(filteredOffers));
    console.log(`✅ Removed offer ${offerId}. Remaining: ${filteredOffers.length}`);
  } catch (error) {
    console.error('❌ Error removing pending offer:', error);
  }
};

/**
 * Clear all pending offers
 */
export const clearPendingOffers = async (): Promise<void> => {
  try {
    console.log('🗑️ Clearing all pending offers from storage');
    await AsyncStorage.removeItem('pending_offers');
    console.log('✅ All pending offers cleared');
  } catch (error) {
    console.error('❌ Error clearing pending offers:', error);
  }
};

/**
 * Get the most recent pending offer
 */
export const getLatestPendingOffer = async (): Promise<PendingOffer | null> => {
  try {
    const offers = await getPendingOffers();
    
    if (offers.length === 0) {
      return null;
    }
    
    // Sort by receivedAt (most recent first)
    offers.sort((a, b) => {
      return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
    });
    
    const latestOffer = offers[0];
    console.log('📌 Latest pending offer:', latestOffer.id);
    
    return latestOffer;
  } catch (error) {
    console.error('❌ Error getting latest pending offer:', error);
    return null;
  }
};
