/**
 * ADVANCED TAX CALCULATOR FOR SPEEDY-VAN
 * 
 * Comprehensive tax calculation system compliant with UK tax regulations
 * Features:
 * - VAT calculations (Standard, Reduced, Zero, Exempt rates)
 * - Corporation Tax with allowances
 * - National Insurance calculations
 * - Reverse Charge mechanism
 * - VAT reclaim calculations
 * - Multi-rate VAT handling
 */

// Removed unused Decimal import

export interface TaxCalculationResult {
  net: number;
  vat: number;
  gross: number;
  rate: number;
  rateType: VatRateType;
  isReverseCharge: boolean;
}

export interface CorporationTaxResult {
  taxableProfit: number;
  corporationTax: number;
  taxFreeAllowance: number;
  effectiveRate: number;
}

export interface NationalInsuranceResult {
  employee: number;
  employer: number;
  total: number;
  employeeRate: number;
  employerRate: number;
}

export enum VatRateType {
  STANDARD = 'standard',
  REDUCED = 'reduced',
  ZERO = 'zero',
  EXEMPT = 'exempt'
}

export enum TaxYear {
  CURRENT = 'current',
  PREVIOUS = 'previous',
  NEXT = 'next'
}

export class AdvancedTaxCalculator {
  private readonly taxRates = {
    vat: {
      [VatRateType.STANDARD]: 0.20,    // 20% - Standard rate
      [VatRateType.REDUCED]: 0.05,     // 5% - Reduced rate (domestic fuel, children's car seats)
      [VatRateType.ZERO]: 0.00,        // 0% - Zero rate (most food, books, children's clothes)
      [VatRateType.EXEMPT]: null       // No VAT charged but cannot reclaim VAT on purchases
    },
    corporationTax: {
      rate: 0.19,                      // 19% for profits up to £50,000
      smallProfitsRate: 0.25,          // 25% for profits over £250,000
      marginalRelief: {
        lowerLimit: 50000,
        upperLimit: 250000,
        marginalFraction: 0.015        // 1.5% marginal relief
      }
    },
    nationalInsurance: {
      employee: {
        primaryThreshold: 12570,       // Annual primary threshold
        upperEarningsLimit: 50270,     // Annual upper earnings limit
        rate1: 0.12,                   // 12% between primary threshold and upper limit
        rate2: 0.02                    // 2% above upper earnings limit
      },
      employer: {
        secondaryThreshold: 9100,      // Annual secondary threshold
        rate: 0.138                    // 13.8% above secondary threshold
      }
    }
  };

  /**
   * Calculate VAT with proper rounding and UK compliance
   */
  calculateVAT(
    amount: number,
    vatRateType: VatRateType = VatRateType.STANDARD,
    isReverseCharge: boolean = false,
    isGrossAmount: boolean = false
  ): TaxCalculationResult {
    const rate = this.taxRates.vat[vatRateType];
    
    if (vatRateType === VatRateType.EXEMPT) {
      return {
        net: this.roundCurrency(amount),
        vat: 0,
        gross: this.roundCurrency(amount),
        rate: 0,
        rateType: vatRateType,
        isReverseCharge: false
      };
    }

    if (isReverseCharge) {
      return {
        net: this.roundCurrency(amount),
        vat: 0,
        gross: this.roundCurrency(amount),
        rate: 0,
        rateType: vatRateType,
        isReverseCharge: true
      };
    }

    let netAmount: number;
    let vatAmount: number;
    let grossAmount: number;

    if (isGrossAmount) {
      // Amount is gross (including VAT)
      grossAmount = amount;
      netAmount = grossAmount / (1 + (rate || 0));
      vatAmount = grossAmount - netAmount;
    } else {
      // Amount is net (excluding VAT)
      netAmount = amount;
      vatAmount = netAmount * (rate || 0);
      grossAmount = netAmount + vatAmount;
    }

    return {
      net: this.roundCurrency(netAmount),
      vat: this.roundCurrency(vatAmount),
      gross: this.roundCurrency(grossAmount),
      rate: rate || 0,
      rateType: vatRateType,
      isReverseCharge: false
    };
  }

  /**
   * Calculate Corporation Tax with allowances and marginal relief
   */
  calculateCorporationTax(
    profit: number,
    accountingPeriodStart: Date,
    accountingPeriodEnd: Date,
    associatedCompanies: number = 0
  ): CorporationTaxResult {
    // Calculate accounting period length in months
    const periodMonths = this.getPeriodMonths(accountingPeriodStart, accountingPeriodEnd);
    
    // Adjust thresholds for period length and associated companies
    const thresholdAdjustment = periodMonths / 12 / (associatedCompanies + 1);
    
    const taxFreeAllowance = this.taxRates.corporationTax.marginalRelief.lowerLimit * thresholdAdjustment;
    const upperLimit = this.taxRates.corporationTax.marginalRelief.upperLimit * thresholdAdjustment;
    
    const taxableProfit = Math.max(0, profit - taxFreeAllowance);
    
    let corporationTax: number;
    let effectiveRate: number;

    if (profit <= taxFreeAllowance) {
      // No tax due
      corporationTax = 0;
      effectiveRate = 0;
    } else if (profit <= upperLimit) {
      // Apply small profits rate (19%)
      corporationTax = taxableProfit * this.taxRates.corporationTax.rate;
      effectiveRate = this.taxRates.corporationTax.rate;
    } else if (profit <= upperLimit * 2) {
      // Apply marginal relief
      const marginalRelief = (upperLimit * 2 - profit) * this.taxRates.corporationTax.marginalRelief.marginalFraction;
      corporationTax = profit * this.taxRates.corporationTax.smallProfitsRate - marginalRelief;
      effectiveRate = corporationTax / profit;
    } else {
      // Apply main rate (25%)
      corporationTax = profit * this.taxRates.corporationTax.smallProfitsRate;
      effectiveRate = this.taxRates.corporationTax.smallProfitsRate;
    }

    return {
      taxableProfit: this.roundCurrency(taxableProfit),
      corporationTax: this.roundCurrency(corporationTax),
      taxFreeAllowance: this.roundCurrency(taxFreeAllowance),
      effectiveRate: this.roundCurrency(effectiveRate)
    };
  }

  /**
   * Calculate National Insurance contributions
   */
  calculateNationalInsurance(
    grossSalary: number,
    isEmployee: boolean = true
  ): NationalInsuranceResult {
    const employeeThresholds = this.taxRates.nationalInsurance.employee;
    const employerThresholds = this.taxRates.nationalInsurance.employer;

    let employeeNI = 0;
    let employerNI = 0;

    if (isEmployee) {
      // Employee National Insurance
      if (grossSalary > employeeThresholds.primaryThreshold) {
        const taxableAmount = Math.min(
          grossSalary - employeeThresholds.primaryThreshold,
          employeeThresholds.upperEarningsLimit - employeeThresholds.primaryThreshold
        );
        employeeNI += taxableAmount * employeeThresholds.rate1;

        // Higher rate for earnings above upper earnings limit
        if (grossSalary > employeeThresholds.upperEarningsLimit) {
          const higherRateAmount = grossSalary - employeeThresholds.upperEarningsLimit;
          employeeNI += higherRateAmount * employeeThresholds.rate2;
        }
      }
    }

    // Employer National Insurance
    if (grossSalary > employerThresholds.secondaryThreshold) {
      const employerTaxableAmount = grossSalary - employerThresholds.secondaryThreshold;
      employerNI = employerTaxableAmount * employerThresholds.rate;
    }

    return {
      employee: this.roundCurrency(employeeNI),
      employer: this.roundCurrency(employerNI),
      total: this.roundCurrency(employeeNI + employerNI),
      employeeRate: this.taxRates.nationalInsurance.employee.rate1,
      employerRate: this.taxRates.nationalInsurance.employer.rate
    };
  }

  /**
   * Calculate VAT reclaim on expenses
   */
  calculateVATReclaim(expenses: Array<{
    amount: number;
    vatRateType: VatRateType;
    isVATReclaimable: boolean;
    isBusinessExpense: boolean;
  }>): number {
    return expenses
      .filter(expense => 
        expense.isVATReclaimable && 
        expense.isBusinessExpense &&
        expense.vatRateType !== VatRateType.EXEMPT
      )
      .reduce((total, expense) => {
        const vatCalculation = this.calculateVAT(expense.amount, expense.vatRateType);
        return total + vatCalculation.vat;
      }, 0);
  }

  /**
   * Calculate VAT return for a period
   */
  calculateVATReturn(periodData: {
    sales: Array<{ amount: number; vatRateType: VatRateType; isReverseCharge: boolean }>;
    purchases: Array<{ amount: number; vatRateType: VatRateType; isVATReclaimable: boolean }>;
  }): {
    totalSales: number;
    totalPurchases: number;
    vatOnSales: number;
    vatOnPurchases: number;
    netVATDue: number;
    breakdown: {
      standardRate: { sales: number; vat: number };
      reducedRate: { sales: number; vat: number };
      zeroRate: { sales: number; vat: number };
      exempt: { sales: number; vat: number };
    };
  } {
    let totalSales = 0;
    let totalPurchases = 0;
    let vatOnSales = 0;
    let vatOnPurchases = 0;

    const breakdown = {
      standardRate: { sales: 0, vat: 0 },
      reducedRate: { sales: 0, vat: 0 },
      zeroRate: { sales: 0, vat: 0 },
      exempt: { sales: 0, vat: 0 }
    };

    // Process sales
    periodData.sales.forEach(sale => {
      const calculation = this.calculateVAT(sale.amount, sale.vatRateType, sale.isReverseCharge);
      totalSales += calculation.net;
      vatOnSales += calculation.vat;

      // Update breakdown
      const rateType = sale.vatRateType as keyof typeof breakdown;
      breakdown[rateType].sales += calculation.net;
      breakdown[rateType].vat += calculation.vat;
    });

    // Process purchases
    periodData.purchases.forEach(purchase => {
      if (purchase.isVATReclaimable) {
        const calculation = this.calculateVAT(purchase.amount, purchase.vatRateType);
        totalPurchases += calculation.net;
        vatOnPurchases += calculation.vat;
      }
    });

    const netVATDue = vatOnSales - vatOnPurchases;

    return {
      totalSales: this.roundCurrency(totalSales),
      totalPurchases: this.roundCurrency(totalPurchases),
      vatOnSales: this.roundCurrency(vatOnSales),
      vatOnPurchases: this.roundCurrency(vatOnPurchases),
      netVATDue: this.roundCurrency(netVATDue),
      breakdown
    };
  }

  /**
   * Get current VAT rates
   */
  getCurrentVATRates(): Record<VatRateType, number> {
    return {
      standard: this.taxRates.vat.standard,
      reduced: this.taxRates.vat.reduced,
      zero: this.taxRates.vat.zero,
      exempt: this.taxRates.vat.exempt || 0
    };
  }

  /**
   * Check if VAT registration is required
   */
  isVATRegistrationRequired(annualTurnover: number): boolean {
    return annualTurnover >= this.taxRates.corporationTax.marginalRelief.lowerLimit;
  }

  /**
   * Round currency to 2 decimal places (UK standard)
   */
  private roundCurrency(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  /**
   * Calculate period length in months
   */
  private getPeriodMonths(start: Date, end: Date): number {
    const startYear = start.getFullYear();
    const startMonth = start.getMonth();
    const endYear = end.getFullYear();
    const endMonth = end.getMonth();
    
    return (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
  }

  /**
   * Validate VAT number format (UK)
   */
  validateVATNumber(vatNumber: string): boolean {
    // Remove spaces and convert to uppercase
    const cleaned = vatNumber.replace(/\s/g, '').toUpperCase();
    
    // UK VAT number format: GB followed by 9 or 12 digits
    const ukVATRegex = /^GB\d{9}(\d{3})?$/;
    
    return ukVATRegex.test(cleaned);
  }

  /**
   * Calculate tax year from date
   */
  getTaxYear(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 0-indexed
    
    // UK tax year runs from 6 April to 5 April
    if (month >= 4) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  }

  /**
   * Get tax period for VAT returns
   */
  getVATPeriod(date: Date, frequency: 'monthly' | 'quarterly' | 'annually' = 'quarterly'): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    switch (frequency) {
      case 'monthly':
        return `${year}-${month.toString().padStart(2, '0')}`;
      case 'quarterly':
        {
          const quarter = Math.ceil(month / 3);
          return `${year}-Q${quarter}`;
        }
      case 'annually':
        return year.toString();
      default:
        throw new Error('Invalid VAT return frequency');
    }
  }
}

// Export singleton instance
export const taxCalculator = new AdvancedTaxCalculator();

// Types are already exported inline above
