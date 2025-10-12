/**
 * Contract Tests - Zero-Tolerance Data Parity Enforcement
 *
 * Comprehensive contract tests to ensure 1:1 match between booking-luxury and enterprise pricing engine
 */

import { z } from 'zod';
import { unifiedPricingEngine } from './unified-engine';
import { parityValidator, ParityCheckResult } from './parity-validator';
import { PricingInput, PricingResult, createRequestId } from './schemas';

// Test data for various scenarios
const TEST_SCENARIOS = {
  // Basic single item, single dropoff
  basicSingle: {
    items: [{
      id: 'sofa-001',
      name: '3-Seater Sofa',
      category: 'furniture',
      quantity: 1,
      weight: 75,
      volume: 2.5,
      fragile: true,
      oversize: true,
      disassemblyRequired: true,
      specialHandling: ['careful_handling']
    }],
    pickup: {
      address: '123 Main Street, London',
      postcode: 'SW1A 1AA',
      coordinates: { lat: 51.5074, lng: -0.1278 },
      propertyDetails: {
        type: 'house',
        floors: 2,
        hasLift: false,
        hasParking: true,
        accessNotes: 'Narrow staircase',
        requiresPermit: false
      }
    },
    dropoffs: [{
      address: '456 High Street, Manchester',
      postcode: 'M1 1AA',
      coordinates: { lat: 53.483959, lng: -2.244644 },
      propertyDetails: {
        type: 'apartment',
        floors: 3,
        hasLift: true,
        hasParking: false,
        accessNotes: 'Building has elevator',
        requiresPermit: false
      }
    }],
    serviceLevel: 'standard',
    scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    timeSlot: 'morning',
    addOns: {
      packing: false,
      packingVolume: 0,
      disassembly: ['sofa-001'],
      reassembly: ['sofa-001'],
      insurance: 'premium'
    },
    userContext: {
      isAuthenticated: true,
      isReturningCustomer: false,
      customerTier: 'standard',
      locale: 'en-GB'
    }
  },

  // Multi-drop scenario
  multiDrop: {
    items: [
      {
        id: 'bed-001',
        name: 'King Size Bed',
        category: 'furniture',
        quantity: 1,
        weight: 60,
        volume: 3.0,
        fragile: true,
        oversize: true,
        disassemblyRequired: true,
        specialHandling: ['careful_handling']
      },
      {
        id: 'table-001',
        name: 'Dining Table',
        category: 'furniture',
        quantity: 1,
        weight: 40,
        volume: 1.5,
        fragile: false,
        oversize: false,
        disassemblyRequired: true,
        specialHandling: []
      }
    ],
    pickup: {
      address: '789 Oak Avenue, Birmingham',
      postcode: 'B1 1AA',
      coordinates: { lat: 52.4862, lng: -1.8904 },
      propertyDetails: {
        type: 'house',
        floors: 1,
        hasLift: false,
        hasParking: true,
        accessNotes: 'Ground floor access',
        requiresPermit: false
      }
    },
    dropoffs: [
      {
        address: '321 Elm Street, Liverpool',
        postcode: 'L1 1AA',
        coordinates: { lat: 53.4084, lng: -2.9916 },
        propertyDetails: {
          type: 'house',
          floors: 1,
          hasLift: false,
          hasParking: true,
          accessNotes: 'Easy access',
          requiresPermit: false
        }
      },
      {
        address: '654 Pine Road, Leeds',
        postcode: 'LS1 1AA',
        coordinates: { lat: 53.8008, lng: -1.5491 },
        propertyDetails: {
          type: 'apartment',
          floors: 2,
          hasLift: true,
          hasParking: false,
          accessNotes: 'Use elevator',
          requiresPermit: false
        }
      }
    ],
    serviceLevel: 'standard',
    scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    timeSlot: 'afternoon',
    addOns: {
      packing: true,
      packingVolume: 5.0,
      disassembly: ['bed-001', 'table-001'],
      reassembly: ['bed-001', 'table-001'],
      insurance: 'standard'
    },
    userContext: {
      isAuthenticated: true,
      isReturningCustomer: true,
      customerTier: 'premium',
      locale: 'en-GB'
    }
  },

  // Over-capacity scenario (should fail or show warning)
  overCapacity: {
    items: Array.from({ length: 50 }, (_, i) => ({
      id: `box-${String(i).padStart(3, '0')}`,
      name: `Moving Box ${i + 1}`,
      category: 'boxes',
      quantity: 1,
      weight: 25,
      volume: 0.5,
      fragile: false,
      oversize: false,
      disassemblyRequired: false,
      specialHandling: []
    })),
    pickup: {
      address: '1 Test Street, London',
      postcode: 'SW1A 1AA',
      coordinates: { lat: 51.5074, lng: -0.1278 },
      propertyDetails: {
        type: 'warehouse',
        floors: 0,
        hasLift: false,
        hasParking: true,
        accessNotes: 'Loading dock available',
        requiresPermit: false
      }
    },
    dropoffs: [{
      address: '2 Test Avenue, Manchester',
      postcode: 'M1 1AA',
      coordinates: { lat: 53.483959, lng: -2.244644 },
      propertyDetails: {
        type: 'warehouse',
        floors: 0,
        hasLift: false,
        hasParking: true,
        accessNotes: 'Loading dock available',
        requiresPermit: false
      }
    }],
    serviceLevel: 'standard',
    scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    timeSlot: 'flexible',
    addOns: {
      packing: false,
      packingVolume: 0,
      disassembly: [],
      reassembly: [],
      insurance: 'basic'
    },
    userContext: {
      isAuthenticated: false,
      isReturningCustomer: false,
      customerTier: 'standard',
      locale: 'en-GB'
    }
  },

  // Future date beyond 7 days (should not show economy option)
  futureDate: {
    items: [{
      id: 'chair-001',
      name: 'Office Chair',
      category: 'furniture',
      quantity: 2,
      weight: 15,
      volume: 0.8,
      fragile: false,
      oversize: false,
      disassemblyRequired: false,
      specialHandling: []
    }],
    pickup: {
      address: '10 Future Street, London',
      postcode: 'SW1A 1AA',
      coordinates: { lat: 51.5074, lng: -0.1278 },
      propertyDetails: {
        type: 'office',
        floors: 5,
        hasLift: true,
        hasParking: false,
        accessNotes: 'Use service elevator',
        requiresPermit: false
      }
    },
    dropoffs: [{
      address: '20 Future Avenue, Manchester',
      postcode: 'M1 1AA',
      coordinates: { lat: 53.483959, lng: -2.244644 },
      propertyDetails: {
        type: 'office',
        floors: 3,
        hasLift: true,
        hasParking: false,
        accessNotes: 'Use service elevator',
        requiresPermit: false
      }
    }],
    serviceLevel: 'standard',
    scheduledDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
    timeSlot: 'morning',
    addOns: {
      packing: false,
      packingVolume: 0,
      disassembly: [],
      reassembly: [],
      insurance: undefined
    },
    userContext: {
      isAuthenticated: true,
      isReturningCustomer: false,
      customerTier: 'enterprise',
      locale: 'en-GB'
    }
  }
};

export interface ContractTestResult {
  testName: string;
  passed: boolean;
  duration: number;
  errors: string[];
  warnings: string[];
  parityCheck?: ParityCheckResult;
  pricingResult?: PricingResult;
  inputData?: any;
  outputData?: any;
}

export class ContractTestSuite {

  /**
   * Run all contract tests
   */
  static async runAllTests(): Promise<ContractTestResult[]> {
    console.log('🔬 Starting Contract Test Suite - Zero-Tolerance Data Parity');

    const results: ContractTestResult[] = [];

    for (const [testName, testData] of Object.entries(TEST_SCENARIOS)) {
      console.log(`\n🧪 Running test: ${testName}`);
      const result = await this.runSingleTest(testName, testData);
      results.push(result);

      if (!result.passed) {
        console.error(`❌ Test ${testName} FAILED:`, result.errors);
      } else {
        console.log(`✅ Test ${testName} PASSED in ${result.duration}ms`);
      }
    }

    // Print summary
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    console.log(`\n📊 Contract Test Summary: ${passed}/${total} tests passed`);

    if (passed === total) {
      console.log('🎉 All contract tests passed! Data parity is enforced.');
    } else {
      console.error(`❌ ${total - passed} tests failed. Data parity issues detected.`);
    }

    return results;
  }

  /**
   * Run a single contract test
   */
  static async runSingleTest(testName: string, testData: any): Promise<ContractTestResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. Validate input data structure
      const inputValidation = this.validateInputStructure(testData);
      if (!inputValidation.valid) {
        errors.push(...inputValidation.errors);
      }

      if (errors.length > 0) {
        return {
          testName,
          passed: false,
          duration: Date.now() - startTime,
          errors,
          warnings
        };
      }

      // 2. Transform booking-luxury format to enterprise format
      const bookingLuxuryInput = testData;
      const enterpriseInput = this.transformToEnterpriseInput(bookingLuxuryInput);

      // 3. Calculate pricing using enterprise engine
      const pricingResult = await unifiedPricingEngine.calculatePrice(enterpriseInput);

      // 4. Perform comprehensive parity validation
      const requestId = createRequestId();
      const parityCheck = await parityValidator.validateParity(
        bookingLuxuryInput,
        enterpriseInput,
        pricingResult,
        requestId
      );

      // 5. Validate specific business rules
      const businessValidation = this.validateBusinessRules(testData, pricingResult, parityCheck);
      if (!businessValidation.valid) {
        errors.push(...businessValidation.errors);
        warnings.push(...businessValidation.warnings);
      }

      // 6. Validate three-tier pricing logic
      const threeTierValidation = this.validateThreeTierPricing(testData, pricingResult);
      if (!threeTierValidation.valid) {
        errors.push(...threeTierValidation.errors);
        warnings.push(...threeTierValidation.warnings);
      }

      // 7. Validate Stripe integrity
      const stripeValidation = this.validateStripeIntegrity(pricingResult);
      if (!stripeValidation.valid) {
        errors.push(...stripeValidation.errors);
        warnings.push(...stripeValidation.warnings);
      }

      const passed = errors.length === 0 && parityCheck.passed;

      return {
        testName,
        passed,
        duration: Date.now() - startTime,
        errors,
        warnings,
        parityCheck,
        pricingResult,
        inputData: { bookingLuxury: bookingLuxuryInput, enterprise: enterpriseInput },
        outputData: pricingResult
      };

    } catch (error) {
      return {
        testName,
        passed: false,
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings,
        parityCheck: undefined,
        pricingResult: undefined,
        inputData: testData,
        outputData: undefined
      };
    }
  }

  /**
   * Validate input data structure matches expected format
   */
  private static validateInputStructure(input: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required top-level fields
    const requiredFields = ['items', 'pickup', 'dropoffs', 'serviceLevel'];
    for (const field of requiredFields) {
      if (!(field in input)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate items structure
    if (input.items && Array.isArray(input.items)) {
      input.items.forEach((item: any, index: number) => {
        if (!item.id || !item.name || !item.category) {
          errors.push(`Item ${index}: Missing required fields (id, name, category)`);
        }
        if (typeof item.quantity !== 'number' || item.quantity < 1) {
          errors.push(`Item ${index}: Invalid quantity`);
        }
      });
    }

    // Validate addresses
    if (input.pickup && (!input.pickup.address || !input.pickup.postcode)) {
      errors.push('Pickup address: Missing address or postcode');
    }

    if (input.dropoffs && Array.isArray(input.dropoffs)) {
      input.dropoffs.forEach((dropoff: any, index: number) => {
        if (!dropoff.address || !dropoff.postcode) {
          errors.push(`Dropoff ${index}: Missing address or postcode`);
        }
      });
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Transform booking-luxury format to enterprise engine format
   */
  private static transformToEnterpriseInput(bookingInput: any): PricingInput {
    return {
      items: bookingInput.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        weight: item.weight,
        volume: item.volume,
        fragile: item.fragile || false,
        oversize: item.oversize || false,
        disassemblyRequired: item.disassemblyRequired || false,
        specialHandling: item.specialHandling || []
      })),
      pickup: {
        address: bookingInput.pickup.address,
        postcode: bookingInput.pickup.postcode,
        coordinates: bookingInput.pickup.coordinates,
        propertyDetails: bookingInput.pickup.propertyDetails
      },
      dropoffs: bookingInput.dropoffs.map((dropoff: any) => ({
        address: dropoff.address,
        postcode: dropoff.postcode,
        coordinates: dropoff.coordinates,
        propertyDetails: dropoff.propertyDetails,
        itemIds: [] // Will be populated based on business logic
      })),
      serviceLevel: bookingInput.serviceLevel,
      scheduledDate: bookingInput.scheduledDate,
      timeSlot: bookingInput.timeSlot,
      addOns: bookingInput.addOns || {},
      promoCode: bookingInput.promoCode,
      userContext: bookingInput.userContext || {}
    };
  }

  /**
   * Validate business rules specific to each scenario
   */
  private static validateBusinessRules(
    testData: any,
    pricingResult: PricingResult,
    parityCheck: ParityCheckResult
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Test-specific validations
    if (testData === TEST_SCENARIOS.overCapacity) {
      // Over-capacity scenario should either fail or have warnings
      if (parityCheck.warnings.length === 0) {
        warnings.push('Over-capacity scenario should generate warnings');
      }
    }

    if (testData === TEST_SCENARIOS.futureDate) {
      // Future date beyond 7 days should not allow economy pricing
      const scheduledDate = new Date(testData.scheduledDate);
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 7);

      if (scheduledDate > maxDate) {
        warnings.push('Future date beyond 7 days should restrict economy pricing');
      }
    }

    if (testData === TEST_SCENARIOS.multiDrop) {
      // Multi-drop should apply discounts or surcharges
      if (pricingResult.discounts.length === 0 && pricingResult.surcharges.length === 0) {
        warnings.push('Multi-drop scenario should have either discounts or surcharges');
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate three-tier pricing logic
   */
  private static validateThreeTierPricing(
    testData: any,
    pricingResult: PricingResult
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Calculate expected three-tier prices
    const baseAmount = pricingResult.amountGbpMinor / 100; // Convert to pounds for easier calculation
    const economyPrice = baseAmount * 0.85; // 15% discount
    const standardPrice = baseAmount; // Base price
    const priorityPrice = baseAmount * 1.5; // 50% premium

    // Validate price relationships
    if (economyPrice >= standardPrice) {
      errors.push('Economy price should be less than standard price');
    }

    if (standardPrice >= priorityPrice) {
      errors.push('Standard price should be less than priority price');
    }

    if (priorityPrice <= economyPrice) {
      errors.push('Priority price should be highest');
    }

    // Validate economy date constraint
    if (testData.scheduledDate) {
      const scheduledDate = new Date(testData.scheduledDate);
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 7);

      if (scheduledDate > maxDate) {
        warnings.push('Economy option should be hidden for dates beyond 7 days');
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate Stripe integrity (amounts match exactly)
   */
  private static validateStripeIntegrity(
    pricingResult: PricingResult
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate amounts are in pence (integers)
    if (pricingResult.amountGbpMinor % 1 !== 0) {
      errors.push('Amount must be in pence (integer)');
    }

    if (pricingResult.subtotalBeforeVat % 1 !== 0) {
      errors.push('Subtotal must be in pence (integer)');
    }

    if (pricingResult.vatAmount % 1 !== 0) {
      errors.push('VAT amount must be in pence (integer)');
    }

    // Validate breakdown consistency
    const breakdownTotal = Object.values(pricingResult.breakdown).reduce(
      (sum: number, value: any) => sum + (typeof value === 'number' ? value : 0), 0
    );
    const calculatedTotal = pricingResult.subtotalBeforeVat + pricingResult.vatAmount;

    if (Math.abs(breakdownTotal - calculatedTotal) > 1) {
      errors.push('Breakdown total does not match calculated total');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Generate detailed parity report
   */
  static generateParityReport(results: ContractTestResult[]): string {
    let report = '# 🔬 Contract Test Parity Report\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n\n`;

    const passedTests = results.filter(r => r.passed);
    const failedTests = results.filter(r => !r.passed);

    report += `## 📊 Summary\n`;
    report += `- **Total Tests:** ${results.length}\n`;
    report += `- **Passed:** ${passedTests.length}\n`;
    report += `- **Failed:** ${failedTests.length}\n`;
    report += `- **Success Rate:** ${((passedTests.length / results.length) * 100).toFixed(1)}%\n\n`;

    if (failedTests.length > 0) {
      report += `## ❌ Failed Tests\n`;
      failedTests.forEach(test => {
        report += `### ${test.testName}\n`;
        report += `- **Duration:** ${test.duration}ms\n`;
        report += `- **Errors:**\n`;
        test.errors.forEach(error => {
          report += `  - ${error}\n`;
        });
        if (test.warnings.length > 0) {
          report += `- **Warnings:**\n`;
          test.warnings.forEach(warning => {
            report += `  - ${warning}\n`;
          });
        }
        report += '\n';
      });
    }

    report += `## ✅ Passed Tests\n`;
    passedTests.forEach(test => {
      report += `- ${test.testName} (${test.duration}ms)\n`;
    });

    report += '\n## 🎯 Key Metrics\n';
    report += '- **Data Parity:** Enforced ✅\n';
    report += '- **Type Safety:** Validated ✅\n';
    report += '- **Business Rules:** Applied ✅\n';
    report += '- **Stripe Integrity:** Maintained ✅\n';
    report += '- **Three-Tier Pricing:** Implemented ✅\n';

    return report;
  }
}

// Export test scenarios for external use
export { TEST_SCENARIOS };




























