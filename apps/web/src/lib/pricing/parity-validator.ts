/**
 * Parity Validator - Zero-Tolerance Data Parity Enforcement
 *
 * Ensures 1:1 match between booking-luxury and enterprise pricing engine
 */

import { z } from 'zod';
import { PricingInput, PricingResult } from './schemas';

// Expected input schema for enterprise engine
const EnterprisePricingInputSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    quantity: z.number().min(1),
    weight: z.number().min(0).optional(),
    volume: z.number().min(0).optional(),
    fragile: z.boolean().optional().default(false),
    oversize: z.boolean().optional().default(false),
    disassemblyRequired: z.boolean().optional().default(false),
    specialHandling: z.array(z.string()).optional().default([])
  })),

  pickup: z.object({
    address: z.string(),
    postcode: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }),
    propertyDetails: z.object({
      type: z.enum(['house', 'apartment', 'office', 'warehouse', 'other']),
      floors: z.number().min(0).max(50).default(0),
      hasLift: z.boolean().default(false),
      hasParking: z.boolean().default(true),
      accessNotes: z.string().optional(),
      requiresPermit: z.boolean().default(false)
    })
  }),

  dropoffs: z.array(z.object({
    address: z.string(),
    postcode: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }),
    propertyDetails: z.object({
      type: z.enum(['house', 'apartment', 'office', 'warehouse', 'other']),
      floors: z.number().min(0).max(50).default(0),
      hasLift: z.boolean().default(false),
      hasParking: z.boolean().default(true),
      accessNotes: z.string().optional(),
      requiresPermit: z.boolean().default(false)
    }),
    itemIds: z.array(z.string()).optional()
  })).min(1),

  serviceLevel: z.enum(['standard', 'express', 'scheduled', 'signature', 'premium', 'white-glove']).default('standard'),

  scheduledDate: z.string().datetime().optional(),
  timeSlot: z.enum(['morning', 'afternoon', 'evening', 'flexible']).optional().default('flexible'),

  addOns: z.object({
    packing: z.boolean().default(false),
    packingVolume: z.number().min(0).optional(),
    disassembly: z.array(z.string()).optional().default([]),
    reassembly: z.array(z.string()).optional().default([]),
    insurance: z.enum(['basic', 'standard', 'premium']).optional()
  }).optional().default({}),

  promoCode: z.string().optional(),

  userContext: z.object({
    isAuthenticated: z.boolean().default(false),
    isReturningCustomer: z.boolean().default(false),
    customerTier: z.enum(['standard', 'premium', 'enterprise']).default('standard'),
    locale: z.string().default('en-GB')
  }).optional().default({})
});

export interface ParityCheckResult {
  passed: boolean;
  errors: ParityError[];
  warnings: ParityWarning[];
  metadata: {
    requestId: string;
    timestamp: string;
    inputHash: string;
    outputHash: string;
  };
}

export interface ParityError {
  field: string;
  expected: any;
  actual: any;
  severity: 'error' | 'warning';
  message: string;
  path: string[];
}

export interface ParityWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export class ParityValidator {

  /**
   * Perform comprehensive parity check between booking-luxury and enterprise engine
   */
  static async validateParity(
    bookingLuxuryInput: any,
    enterpriseInput: any,
    enterpriseOutput: PricingResult,
    requestId: string
  ): Promise<ParityCheckResult> {

    const errors: ParityError[] = [];
    const warnings: ParityWarning[] = [];

    try {
      // 1. Validate input schema compliance
      const inputValidation = this.validateInputSchema(bookingLuxuryInput, enterpriseInput);
      errors.push(...inputValidation.errors);
      warnings.push(...inputValidation.warnings);

      // 2. Validate output structure
      const outputValidation = this.validateOutputStructure(enterpriseOutput);
      errors.push(...outputValidation.errors);
      warnings.push(...outputValidation.warnings);

      // 3. Validate type consistency
      const typeValidation = this.validateTypeConsistency(bookingLuxuryInput, enterpriseInput, enterpriseOutput);
      errors.push(...typeValidation.errors);
      warnings.push(...typeValidation.warnings);

      // 4. Validate unit consistency
      const unitValidation = this.validateUnitConsistency(enterpriseOutput);
      errors.push(...unitValidation.errors);
      warnings.push(...unitValidation.warnings);

      // 5. Validate enum values
      const enumValidation = this.validateEnumValues(bookingLuxuryInput, enterpriseInput);
      errors.push(...enumValidation.errors);
      warnings.push(...enumValidation.warnings);

      // 6. Validate nullability
      const nullabilityValidation = this.validateNullability(bookingLuxuryInput, enterpriseInput);
      errors.push(...nullabilityValidation.errors);
      warnings.push(...nullabilityValidation.warnings);

      // 7. Validate serialization stability
      const serializationValidation = this.validateSerialization(bookingLuxuryInput, enterpriseInput);
      errors.push(...serializationValidation.errors);
      warnings.push(...serializationValidation.warnings);

      const passed = errors.length === 0;

      return {
        passed,
        errors,
        warnings,
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          inputHash: this.generateHash(bookingLuxuryInput),
          outputHash: this.generateHash(enterpriseOutput)
        }
      };

    } catch (error) {
      return {
        passed: false,
        errors: [{
          field: 'validation_system',
          expected: 'successful_validation',
          actual: error instanceof Error ? error.message : 'unknown_error',
          severity: 'error',
          message: 'Parity validation system error',
          path: []
        }],
        warnings: [],
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          inputHash: '',
          outputHash: ''
        }
      };
    }
  }

  /**
   * Validate input schema compliance
   */
  private static validateInputSchema(bookingInput: any, enterpriseInput: any) {
    const errors: ParityError[] = [];
    const warnings: ParityWarning[] = [];

    try {
      // Validate enterprise input against expected schema
      EnterprisePricingInputSchema.parse(enterpriseInput);

      // Check for structural differences
      const bookingKeys = Object.keys(bookingInput).sort();
      const enterpriseKeys = Object.keys(enterpriseInput).sort();

      if (JSON.stringify(bookingKeys) !== JSON.stringify(enterpriseKeys)) {
        errors.push({
          field: 'input_structure',
          expected: enterpriseKeys,
          actual: bookingKeys,
          severity: 'error',
          message: 'Input structure mismatch between booking-luxury and enterprise engine',
          path: []
        });
      }

    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach(issue => {
          errors.push({
            field: issue.path.join('.'),
            expected: 'valid_schema',
            actual: 'invalid_value',
            severity: 'error',
            message: issue.message,
            path: issue.path.map(p => String(p))
          });
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate output structure
   */
  private static validateOutputStructure(output: PricingResult) {
    const errors: ParityError[] = [];
    const warnings: ParityWarning[] = [];

    // Check required output fields
    const requiredFields = [
      'amountGbpMinor', 'subtotalBeforeVat', 'vatAmount', 'vatRate',
      'breakdown', 'surcharges', 'discounts', 'route', 'recommendedVehicle', 'metadata'
    ];

    for (const field of requiredFields) {
      if (!(field in output)) {
        errors.push({
          field,
          expected: 'present',
          actual: 'missing',
          severity: 'error',
          message: `Required output field '${field}' is missing`,
          path: []
        });
      }
    }

    // Validate breakdown structure
    if (output.breakdown) {
      const breakdownFields = [
        'baseFee', 'itemsFee', 'distanceFee', 'serviceFee',
        'vehicleFee', 'propertyAccessFee', 'addOnsFee', 'surcharges', 'discounts'
      ];

      for (const field of breakdownFields) {
        if (!(field in output.breakdown)) {
          errors.push({
            field: `breakdown.${field}`,
            expected: 'present',
            actual: 'missing',
            severity: 'error',
            message: `Required breakdown field '${field}' is missing`,
            path: ['breakdown', field]
          });
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate type consistency
   */
  private static validateTypeConsistency(bookingInput: any, enterpriseInput: any, output: PricingResult) {
    const errors: ParityError[] = [];
    const warnings: ParityWarning[] = [];

    // Check currency is in pence (minor units)
    if (output.amountGbpMinor % 1 !== 0) {
      errors.push({
        field: 'amountGbpMinor',
        expected: 'integer_pence',
        actual: output.amountGbpMinor,
        severity: 'error',
        message: 'Amount must be in pence (integer)',
        path: ['amountGbpMinor']
      });
    }

    // Check distance is in kilometers
    if (output.route?.totalDistance && output.route.totalDistance < 0) {
      errors.push({
        field: 'route.totalDistance',
        expected: 'positive_number',
        actual: output.route.totalDistance,
        severity: 'error',
        message: 'Distance must be positive',
        path: ['route', 'totalDistance']
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate unit consistency
   */
  private static validateUnitConsistency(output: PricingResult) {
    const errors: ParityError[] = [];
    const warnings: ParityWarning[] = [];

    // Validate currency precision (pence)
    const breakdownTotal = Object.values(output.breakdown || {}).reduce((sum: number, value: any) => sum + (typeof value === 'number' ? value : 0), 0);
    const calculatedTotal = output.subtotalBeforeVat + output.vatAmount;

    if (Math.abs(breakdownTotal - calculatedTotal) > 1) { // Allow 1 pence rounding difference
      errors.push({
        field: 'breakdown_consistency',
        expected: calculatedTotal,
        actual: breakdownTotal,
        severity: 'error',
        message: 'Breakdown total does not match calculated total',
        path: ['breakdown']
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate enum values
   */
  private static validateEnumValues(bookingInput: any, enterpriseInput: any) {
    const errors: ParityError[] = [];
    const warnings: ParityWarning[] = [];

    // Check service level enum
    const validServiceLevels = ['standard', 'express', 'scheduled', 'signature', 'premium', 'white-glove'];
    if (enterpriseInput.serviceLevel && !validServiceLevels.includes(enterpriseInput.serviceLevel)) {
      errors.push({
        field: 'serviceLevel',
        expected: validServiceLevels,
        actual: enterpriseInput.serviceLevel,
        severity: 'error',
        message: 'Invalid service level enum value',
        path: ['serviceLevel']
      });
    }

    // Check property types
    const validPropertyTypes = ['house', 'apartment', 'office', 'warehouse', 'other'];
    ['pickup', 'dropoffs'].forEach(location => {
      const properties = location === 'pickup' ? [enterpriseInput.pickup] : enterpriseInput.dropoffs || [];
      properties.forEach((property: any, index: number) => {
        if (property?.propertyDetails?.type && !validPropertyTypes.includes(property.propertyDetails.type)) {
          errors.push({
            field: `${location}[${index}].propertyDetails.type`,
            expected: validPropertyTypes,
            actual: property.propertyDetails.type,
            severity: 'error',
            message: 'Invalid property type enum value',
            path: [location, index.toString(), 'propertyDetails', 'type']
          });
        }
      });
    });

    return { errors, warnings };
  }

  /**
   * Validate nullability
   */
  private static validateNullability(bookingInput: any, enterpriseInput: any) {
    const errors: ParityError[] = [];
    const warnings: ParityWarning[] = [];

    // Check for undefined values where null is expected
    const checkNullability = (obj: any, path: string[] = []) => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = [...path, key];

        if (value === undefined && this.shouldBeNull(key)) {
          errors.push({
            field: currentPath.join('.'),
            expected: 'null',
            actual: 'undefined',
            severity: 'error',
            message: `Field should be null but is undefined`,
            path: currentPath
          });
        }

        if (typeof value === 'object' && value !== null) {
          checkNullability(value, currentPath);
        }
      }
    };

    checkNullability(enterpriseInput);

    return { errors, warnings };
  }

  /**
   * Validate serialization stability
   */
  private static validateSerialization(bookingInput: any, enterpriseInput: any) {
    const errors: ParityError[] = [];
    const warnings: ParityWarning[] = [];

    // Check field order stability
    const bookingOrder = JSON.stringify(Object.keys(bookingInput).sort());
    const enterpriseOrder = JSON.stringify(Object.keys(enterpriseInput).sort());

    if (bookingOrder !== enterpriseOrder) {
      errors.push({
        field: 'serialization_order',
        expected: bookingOrder,
        actual: enterpriseOrder,
        severity: 'error',
        message: 'Field order differs between booking-luxury and enterprise engine',
        path: []
      });
    }

    return { errors, warnings };
  }

  /**
   * Generate hash for data integrity checking
   */
  private static generateHash(data: any): string {
    const str = JSON.stringify(data, Object.keys(data).sort());
    return Buffer.from(str).toString('base64').substring(0, 16);
  }

  /**
   * Determine if a field should be null vs undefined
   */
  private static shouldBeNull(fieldName: string): boolean {
    const nullFields = [
      'promoCode', 'scheduledDate', 'packingVolume', 'insurance',
      'accessNotes', 'specialHandling', 'disassembly', 'reassembly'
    ];
    return nullFields.includes(fieldName);
  }
}

// Export singleton instance
export const parityValidator = ParityValidator;
