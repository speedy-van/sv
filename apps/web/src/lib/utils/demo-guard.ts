/**
 * Demo Guard - Prevent Demo Data in Production Accounts
 * 
 * This utility ensures demo/test data is ONLY allowed for the Apple Test Account.
 * All other accounts must use REAL data only.
 * 
 * Apple Test Account:
 * - Email: zadfad41@gmail.com
 * - Driver ID: xRLLVY7d0zwTCC9A
 */

// Apple Test Account - ONLY account allowed for demo data
const APPLE_TEST_ACCOUNT = {
  email: 'zadfad41@gmail.com',
  driverId: 'xRLLVY7d0zwTCC9A',
  userId: 'XYgJzjVjfn1hOH4z', // Can be updated if needed
};

/**
 * Check if a user is the Apple Test Account
 */
export function isAppleTestAccount(userEmail?: string | null, driverId?: string | null): boolean {
  if (!userEmail && !driverId) {
    return false;
  }

  return (
    userEmail === APPLE_TEST_ACCOUNT.email ||
    driverId === APPLE_TEST_ACCOUNT.driverId
  );
}

/**
 * Validate booking reference - prevent DEMO/TEST prefixes in production
 */
export function validateBookingReference(
  reference: string,
  userEmail?: string | null,
  driverId?: string | null
): { valid: boolean; error?: string } {
  // Check if reference has demo/test prefix
  const isDemoReference = 
    reference.startsWith('DEMO-') ||
    reference.startsWith('TEST-') ||
    reference.startsWith('MOCK-');

  if (!isDemoReference) {
    // Real reference - always valid
    return { valid: true };
  }

  // Demo reference - only valid for Apple Test Account
  if (isAppleTestAccount(userEmail, driverId)) {
    return { valid: true };
  }

  // Demo reference for production account - INVALID
  return {
    valid: false,
    error: 'Demo/Test booking references are not allowed in production accounts. Only real customer bookings are permitted.',
  };
}

/**
 * Validate customer data - prevent demo/test customer names
 */
export function validateCustomerData(
  customerName: string,
  customerEmail: string,
  driverEmail?: string | null,
  driverId?: string | null
): { valid: boolean; error?: string } {
  // Check for demo/test indicators
  const nameContainsDemo = /demo|test|mock/i.test(customerName);
  const emailContainsDemo = /demo|test|mock/i.test(customerEmail);

  if (!nameContainsDemo && !emailContainsDemo) {
    // Real customer data - always valid
    return { valid: true };
  }

  // Demo data detected - only valid for Apple Test Account
  if (isAppleTestAccount(driverEmail, driverId)) {
    return { valid: true };
  }

  // Demo customer for production account - INVALID
  return {
    valid: false,
    error: 'Demo/Test customer data is not allowed in production accounts. Only real customers are permitted.',
  };
}

/**
 * Get demo mode status for a user
 */
export function getDemoMode(userEmail?: string | null, driverId?: string | null): {
  isDemoAccount: boolean;
  canUseDemoData: boolean;
  accountType: 'production' | 'test';
} {
  const isDemoAccount = isAppleTestAccount(userEmail, driverId);

  return {
    isDemoAccount,
    canUseDemoData: isDemoAccount,
    accountType: isDemoAccount ? 'test' : 'production',
  };
}

/**
 * Filter out demo data for production accounts
 */
export function filterDemoData<T extends { reference?: string; customerName?: string }>(
  items: T[],
  userEmail?: string | null,
  driverId?: string | null
): T[] {
  // Apple Test Account can see all data (including demo)
  if (isAppleTestAccount(userEmail, driverId)) {
    return items;
  }

  // Production accounts - filter out demo data
  return items.filter(item => {
    // Check reference
    if (item.reference) {
      const isDemoRef = /^(DEMO-|TEST-|MOCK-)/i.test(item.reference);
      if (isDemoRef) return false;
    }

    // Check customer name
    if (item.customerName) {
      const isDemoCustomer = /demo|test|mock/i.test(item.customerName);
      if (isDemoCustomer) return false;
    }

    return true;
  });
}

export default {
  isAppleTestAccount,
  validateBookingReference,
  validateCustomerData,
  getDemoMode,
  filterDemoData,
  APPLE_TEST_ACCOUNT,
};

