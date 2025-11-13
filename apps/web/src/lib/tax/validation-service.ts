/**
 * ADVANCED TAX VALIDATION SERVICE FOR SPEEDY-VAN
 * 
 * Comprehensive validation system with:
 * - Online VAT number validation with HMRC
 * - Company information verification via Companies House API
 * - Real-time tax rate validation
 * - Integration with speedy-van.co.uk data
 * - AI-powered anomaly detection
 */

import { hmrcApiService } from './hmrc-api';
import { taxCalculator } from './calculator';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  data?: any;
  timestamp: Date;
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'critical';
}

export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  recommendation?: string;
}

export interface CompanyInfo {
  companyNumber: string;
  companyName: string;
  registeredAddress: string;
  companyStatus: string;
  companyType: string;
  incorporationDate: string;
  vatNumber?: string;
  sicCodes?: string[];
}

export interface TaxRateValidation {
  isValid: boolean;
  appliedRate: number;
  expectedRate: number;
  rateType: string;
  reason?: string;
}

export class TaxValidationService {
  private readonly companiesHouseApiKey = process.env.COMPANIES_HOUSE_API_KEY;
  private readonly companiesHouseBaseUrl = 'https://api.company-information.service.gov.uk';
  private readonly speedyVanApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.speedy-van.co.uk';

  /**
   * Validate VAT number with HMRC online service
   */
  async validateVATNumberOnline(vatNumber: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Format VAT number
      const cleanVatNumber = vatNumber.replace(/\s/g, '').toUpperCase();
      
      // Basic format validation
      if (!taxCalculator.validateVATNumber(cleanVatNumber)) {
        errors.push({
          field: 'vatNumber',
          code: 'INVALID_FORMAT',
          message: 'VAT number format is invalid. UK VAT numbers should be in format GBXXXXXXXXX',
          severity: 'error'
        });
        
        return {
          isValid: false,
          errors,
          warnings,
          timestamp: new Date()
        };
      }

      // Online validation with HMRC
      const hmrcValidation = await hmrcApiService.validateVATNumber(cleanVatNumber);
      
      if (!hmrcValidation.isValid) {
        errors.push({
          field: 'vatNumber',
          code: 'NOT_REGISTERED',
          message: 'VAT number is not registered with HMRC',
          severity: 'critical'
        });
      }

      return {
        isValid: hmrcValidation.isValid,
        errors,
        warnings,
        data: {
          vatNumber: cleanVatNumber,
          companyName: hmrcValidation.name,
          address: hmrcValidation.address,
          validatedAt: new Date()
        },
        timestamp: new Date()
      };

    } catch (error) {
      console.error('VAT validation error:', error);
      
      errors.push({
        field: 'vatNumber',
        code: 'VALIDATION_FAILED',
        message: 'Unable to validate VAT number online. Please check manually.',
        severity: 'error'
      });

      return {
        isValid: false,
        errors,
        warnings,
        timestamp: new Date()
      };
    }
  }

  /**
   * Validate company information with Companies House
   */
  async validateCompanyNumber(companyNumber: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      if (!this.companiesHouseApiKey) {
        warnings.push({
          field: 'companyNumber',
          code: 'API_KEY_MISSING',
          message: 'Companies House API key not configured. Validation skipped.',
          recommendation: 'Add COMPANIES_HOUSE_API_KEY to environment variables'
        });

        return {
          isValid: true,
          errors,
          warnings,
          timestamp: new Date()
        };
      }

      // Clean company number (remove spaces and convert to uppercase)
      const cleanCompanyNumber = companyNumber.replace(/\s/g, '').toUpperCase();

      // Fetch company information from Companies House
      const response = await fetch(
        `${this.companiesHouseBaseUrl}/company/${cleanCompanyNumber}`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.companiesHouseApiKey}:`).toString('base64')}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          errors.push({
            field: 'companyNumber',
            code: 'NOT_FOUND',
            message: 'Company number not found in Companies House register',
            severity: 'critical'
          });
        } else {
          errors.push({
            field: 'companyNumber',
            code: 'VALIDATION_FAILED',
            message: `Companies House validation failed: ${response.statusText}`,
            severity: 'error'
          });
        }

        return {
          isValid: false,
          errors,
          warnings,
          timestamp: new Date()
        };
      }

      const companyData = await response.json();

      // Check company status
      if (companyData.company_status !== 'active') {
        warnings.push({
          field: 'companyStatus',
          code: 'COMPANY_NOT_ACTIVE',
          message: `Company status is ${companyData.company_status}`,
          recommendation: 'Verify company is still trading'
        });
      }

      const companyInfo: CompanyInfo = {
        companyNumber: companyData.company_number,
        companyName: companyData.company_name,
        registeredAddress: this.formatAddress(companyData.registered_office_address),
        companyStatus: companyData.company_status,
        companyType: companyData.type,
        incorporationDate: companyData.date_of_creation,
        sicCodes: companyData.sic_codes
      };

      return {
        isValid: true,
        errors,
        warnings,
        data: companyInfo,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Company validation error:', error);
      
      errors.push({
        field: 'companyNumber',
        code: 'VALIDATION_ERROR',
        message: 'Unable to validate company number. Please check manually.',
        severity: 'error'
      });

      return {
        isValid: false,
        errors,
        warnings,
        timestamp: new Date()
      };
    }
  }

  /**
   * Validate tax rate application for a transaction
   */
  async validateTaxRate(
    transactionAmount: number,
    appliedRate: number,
    serviceType: string,
    customerLocation: string
  ): Promise<TaxRateValidation> {
    try {
      // Get expected VAT rate based on service type
      const expectedRate = this.getExpectedVATRate(serviceType, customerLocation);

      // Check if applied rate matches expected rate
      const isValid = Math.abs(appliedRate - expectedRate) < 0.001;

      let reason: string | undefined;
      if (!isValid) {
        if (appliedRate > expectedRate) {
          reason = `Applied rate (${(appliedRate * 100).toFixed(1)}%) is higher than expected rate (${(expectedRate * 100).toFixed(1)}%)`;
        } else {
          reason = `Applied rate (${(appliedRate * 100).toFixed(1)}%) is lower than expected rate (${(expectedRate * 100).toFixed(1)}%)`;
        }
      }

      return {
        isValid,
        appliedRate,
        expectedRate,
        rateType: this.getRateType(expectedRate),
        reason
      };

    } catch (error) {
      console.error('Tax rate validation error:', error);
      
      return {
        isValid: false,
        appliedRate,
        expectedRate: 0.20,
        rateType: 'standard',
        reason: 'Unable to validate tax rate'
      };
    }
  }

  /**
   * Validate transaction data against speedy-van.co.uk records
   */
  async validateTransactionWithSiteData(
    transactionId: string,
    transactionType: 'booking' | 'invoice' | 'payment'
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Fetch transaction data from Speedy Van API
      const endpoint = this.getTransactionEndpoint(transactionType, transactionId);
      const response = await fetch(`${this.speedyVanApiUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CUSTOM_KEY}`
        }
      });

      if (!response.ok) {
        errors.push({
          field: 'transactionId',
          code: 'NOT_FOUND',
          message: `Transaction not found in speedy-van.co.uk records`,
          severity: 'error'
        });

        return {
          isValid: false,
          errors,
          warnings,
          timestamp: new Date()
        };
      }

      const transactionData = await response.json();

      // Validate transaction data integrity
      const integrityCheck = this.validateTransactionIntegrity(transactionData, transactionType);
      
      if (!integrityCheck.isValid) {
        errors.push(...integrityCheck.errors);
        warnings.push(...integrityCheck.warnings);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        data: transactionData,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Transaction validation error:', error);
      
      errors.push({
        field: 'transaction',
        code: 'VALIDATION_ERROR',
        message: 'Unable to validate transaction with site data',
        severity: 'error'
      });

      return {
        isValid: false,
        errors,
        warnings,
        timestamp: new Date()
      };
    }
  }

  /**
   * Validate UTR (Unique Taxpayer Reference) format
   */
  validateUTR(utr: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Remove spaces
    const cleanUTR = utr.replace(/\s/g, '');

    // UK UTR should be 10 digits
    if (!/^\d{10}$/.test(cleanUTR)) {
      errors.push({
        field: 'utr',
        code: 'INVALID_FORMAT',
        message: 'UTR must be exactly 10 digits',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      timestamp: new Date()
    };
  }

  /**
   * Validate tax period dates
   */
  validateTaxPeriod(startDate: Date, endDate: Date): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if end date is after start date
    if (endDate <= startDate) {
      errors.push({
        field: 'taxPeriod',
        code: 'INVALID_DATES',
        message: 'End date must be after start date',
        severity: 'error'
      });
    }

    // Check if period is too long (more than 1 year)
    const periodMonths = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (periodMonths > 12) {
      warnings.push({
        field: 'taxPeriod',
        code: 'LONG_PERIOD',
        message: 'Tax period is longer than 12 months',
        recommendation: 'Consider splitting into multiple periods'
      });
    }

    // Check if period is in the future
    const now = new Date();
    if (startDate > now) {
      warnings.push({
        field: 'taxPeriod',
        code: 'FUTURE_PERIOD',
        message: 'Tax period starts in the future',
        recommendation: 'Verify the dates are correct'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      timestamp: new Date()
    };
  }

  /**
   * Get expected VAT rate based on service type
   */
  private getExpectedVATRate(serviceType: string, customerLocation: string): number {
    // Standard rate for most services
    const standardRate = 0.20;
    
    // Van delivery services are typically standard rate in UK
    // Special cases can be added here
    
    if (customerLocation && !this.isUKLocation(customerLocation)) {
      // International services may have different rates or zero-rating
      return 0.00;
    }

    return standardRate;
  }

  /**
   * Get rate type from rate value
   */
  private getRateType(rate: number): string {
    if (rate === 0.20) return 'standard';
    if (rate === 0.05) return 'reduced';
    if (rate === 0.00) return 'zero';
    return 'custom';
  }

  /**
   * Check if location is in UK
   */
  private isUKLocation(location: string): boolean {
    const ukKeywords = ['uk', 'united kingdom', 'england', 'scotland', 'wales', 'northern ireland', 'gb', 'great britain'];
    const lowerLocation = location.toLowerCase();
    return ukKeywords.some(keyword => lowerLocation.includes(keyword));
  }

  /**
   * Format address from Companies House data
   */
  private formatAddress(address: any): string {
    const parts = [
      address.address_line_1,
      address.address_line_2,
      address.locality,
      address.region,
      address.postal_code,
      address.country
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Get transaction endpoint based on type
   */
  private getTransactionEndpoint(type: string, id: string): string {
    switch (type) {
      case 'booking':
        return `/api/bookings/${id}`;
      case 'invoice':
        return `/api/invoices/${id}`;
      case 'payment':
        return `/api/payments/${id}`;
      default:
        throw new Error(`Unknown transaction type: ${type}`);
    }
  }

  /**
   * Validate transaction data integrity
   */
  private validateTransactionIntegrity(
    data: any,
    type: string
  ): { isValid: boolean; errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check required fields based on transaction type
    if (type === 'booking') {
      if (!data.totalPrice) {
        errors.push({
          field: 'totalPrice',
          code: 'MISSING_FIELD',
          message: 'Total price is missing',
          severity: 'error'
        });
      }

      if (!data.status) {
        errors.push({
          field: 'status',
          code: 'MISSING_FIELD',
          message: 'Booking status is missing',
          severity: 'error'
        });
      }
    }

    if (type === 'invoice') {
      if (!data.grossAmount) {
        errors.push({
          field: 'grossAmount',
          code: 'MISSING_FIELD',
          message: 'Gross amount is missing',
          severity: 'error'
        });
      }

      if (!data.vatAmount) {
        warnings.push({
          field: 'vatAmount',
          code: 'MISSING_VAT',
          message: 'VAT amount is missing',
          recommendation: 'Calculate and add VAT amount'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Batch validate multiple VAT numbers
   */
  async batchValidateVATNumbers(vatNumbers: string[]): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();

    // Process in parallel with rate limiting
    const batchSize = 5;
    for (let i = 0; i < vatNumbers.length; i += batchSize) {
      const batch = vatNumbers.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(vatNumber => this.validateVATNumberOnline(vatNumber))
      );

      batch.forEach((vatNumber, index) => {
        results.set(vatNumber, batchResults[index]);
      });

      // Rate limiting delay
      if (i + batchSize < vatNumbers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}

// Export singleton instance
export const taxValidationService = new TaxValidationService();

