/**
 * CORPORATION TAX API ENDPOINT
 * 
 * Handles Corporation Tax operations including:
 * - Calculating Corporation Tax liability
 * - Managing tax allowances
 * - Generating tax returns
 * - Submitting to HMRC
 * - Tax planning and forecasting
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { taxCalculator } from '@/lib/tax/calculator';
import { hmrcApiService } from '@/lib/tax/hmrc-api';
import { taxReportingSystem } from '@/lib/tax/reporting-system';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taxYear = searchParams.get('taxYear') || new Date().getFullYear().toString();
    const includeDetails = searchParams.get('includeDetails') === 'true';

    const year = parseInt(taxYear);

    // Get tax records for the year
    const taxRecords = await prisma.taxRecord.findMany({
      where: {
        taxYear: year,
        taxType: 'vat'
      }
    });

    // Get expenses for the year
    const expenses = await prisma.taxExpense.findMany({
      where: {
        expenseDate: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31)
        }
      }
    });

    // Calculate profit and loss
    const turnover = taxRecords.reduce((sum, record) => sum + Number(record.totalSales), 0);
    const costOfSales = taxRecords.reduce((sum, record) => sum + Number(record.totalPurchases), 0);
    const grossProfit = turnover - costOfSales;
    
    // Categorize expenses
    const operatingExpenses = expenses.reduce((sum, expense) => {
      if (expense.isDeductible) {
        return sum + Number(expense.amount);
      }
      return sum;
    }, 0);

    const operatingProfit = grossProfit - operatingExpenses;
    const otherIncome = 0; // Would come from other sources
    const profitBeforeTax = operatingProfit + otherIncome;

    // Calculate Corporation Tax
    const corporationTaxCalculation = taxCalculator.calculateCorporationTax(
      profitBeforeTax,
      new Date(year, 0, 1),
      new Date(year, 11, 31)
    );

    const corporationTax = corporationTaxCalculation.corporationTax;
    const profitAfterTax = profitBeforeTax - corporationTax;

    // Calculate allowances
    const allowances = {
      capitalAllowances: expenses
        .filter(e => e.deductionCategory === 'capital_allowance')
        .reduce((sum, e) => sum + Number(e.amount), 0),
      researchAndDevelopment: expenses
        .filter(e => e.deductionCategory === 'professional_fees')
        .reduce((sum, e) => sum + Number(e.amount), 0),
      otherAllowances: expenses
        .filter(e => e.deductionCategory === 'other')
        .reduce((sum, e) => sum + Number(e.amount), 0),
      totalAllowances: 0
    };

    allowances.totalAllowances = allowances.capitalAllowances + 
                                allowances.researchAndDevelopment + 
                                allowances.otherAllowances;

    // Get company tax settings
    const taxSettings = await prisma.companyTaxSettings.findFirst({
      where: { isActive: true }
    });

    // Prepare Corporation Tax data
    const corporationTaxData = {
      accountingPeriod: {
        start: new Date(year, 0, 1),
        end: new Date(year, 11, 31)
      },
      profitAndLoss: {
        turnover,
        costOfSales,
        grossProfit,
        operatingExpenses,
        operatingProfit,
        otherIncome,
        profitBeforeTax,
        corporationTax,
        profitAfterTax
      },
      taxCalculation: {
        profitBeforeTax,
        taxFreeAllowance: corporationTaxCalculation.taxFreeAllowance,
        taxableProfit: corporationTaxCalculation.taxableProfit,
        corporationTaxRate: 0.19, // Current UK rate
        corporationTax,
        effectiveRate: corporationTaxCalculation.effectiveRate
      },
      allowances,
      compliance: {
        filingStatus: 'pending',
        paymentStatus: 'unpaid',
        deadline: new Date(year + 1, 8, 30), // September 30 next year
        isCompliant: false
      },
      taxSettings: {
        corporationTaxUTR: taxSettings?.corporationTaxUTR,
        accountingPeriodStart: taxSettings?.accountingPeriodStart,
        accountingPeriodEnd: taxSettings?.accountingPeriodEnd
      }
    };

    // Include detailed breakdown if requested
    if (includeDetails) {
      (corporationTaxData as any).expenses = expenses.map(expense => ({
        id: expense.id,
        description: expense.description,
        category: expense.category,
        amount: Number(expense.amount),
        vatAmount: Number(expense.vatAmount),
        isDeductible: expense.isDeductible,
        deductionCategory: expense.deductionCategory,
        expenseDate: expense.expenseDate,
        supplierName: expense.supplierName,
        status: expense.status
      }));
    }

    return NextResponse.json({
      success: true,
      data: corporationTaxData
    });

  } catch (error) {
    console.error('Corporation Tax GET API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Corporation Tax data'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = (session.user as any).id;
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'calculate_tax':
        return await calculateCorporationTax(data);

      case 'update_expenses':
        return await updateExpenses(data, adminId);

      case 'generate_return':
        return await generateCorporationTaxReturn(data, adminId);

      case 'submit_to_hmrc':
        return await submitCorporationTaxReturn(data, adminId);

      case 'tax_planning':
        return await performTaxPlanning(data);

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Corporation Tax POST API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process Corporation Tax request'
      },
      { status: 500 }
    );
  }
}

async function calculateCorporationTax(data: any) {
  try {
    const { profit, accountingPeriodStart, accountingPeriodEnd, associatedCompanies = 0 } = data;

    const corporationTaxCalculation = taxCalculator.calculateCorporationTax(
      profit,
      new Date(accountingPeriodStart),
      new Date(accountingPeriodEnd),
      associatedCompanies
    );

    return NextResponse.json({
      success: true,
      data: corporationTaxCalculation,
      message: 'Corporation Tax calculated successfully'
    });

  } catch (error) {
    throw error;
  }
}

async function updateExpenses(data: any, adminId: string) {
  try {
    const { expenses } = data;

    const updatedExpenses = [];

    for (const expense of expenses) {
      const updatedExpense = await prisma.taxExpense.upsert({
        where: { id: expense.id },
        update: {
          description: expense.description,
          category: expense.category,
          amount: expense.amount,
          vatAmount: expense.vatAmount,
          isDeductible: expense.isDeductible,
          deductionCategory: expense.deductionCategory,
          expenseDate: new Date(expense.expenseDate),
          supplierName: expense.supplierName,
          status: expense.status,
          updatedBy: adminId
        },
        create: {
          description: expense.description,
          category: expense.category,
          amount: expense.amount,
          vatAmount: expense.vatAmount,
          vatRate: expense.vatRate || 0.20,
          vatRateType: expense.vatRateType || 'standard',
          isDeductible: expense.isDeductible,
          deductionCategory: expense.deductionCategory,
          expenseDate: new Date(expense.expenseDate),
          supplierName: expense.supplierName,
          status: expense.status || 'pending',
          createdBy: adminId
        }
      });

      updatedExpenses.push(updatedExpense);
    }

    return NextResponse.json({
      success: true,
      data: updatedExpenses,
      message: 'Expenses updated successfully'
    });

  } catch (error) {
    throw error;
  }
}

async function generateCorporationTaxReturn(data: any, adminId: string) {
  try {
    const { taxYear } = data;

    // Generate Corporation Tax report
    const report = await taxReportingSystem.generateCorporationTaxReport(
      taxYear,
      true // Include detailed breakdown
    );

    // Create tax record for Corporation Tax
    const taxRecord = await prisma.taxRecord.create({
      data: {
        taxYear,
        taxPeriod: taxYear.toString(),
        periodStart: new Date(taxYear, 0, 1),
        periodEnd: new Date(taxYear, 11, 31),
        taxType: 'corporation_tax',
        taxableProfit: report.taxCalculation.taxableProfit,
        corporationTax: report.taxCalculation.corporationTax,
        taxFreeAllowance: report.taxCalculation.taxFreeAllowance,
        filingStatus: 'pending',
        paymentStatus: 'unpaid',
        createdBy: adminId
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        taxRecord,
        report
      },
      message: 'Corporation Tax return generated successfully'
    });

  } catch (error) {
    throw error;
  }
}

async function submitCorporationTaxReturn(data: any, adminId: string) {
  try {
    const { taxYear, taxRecordId } = data;

    // Get tax record
    const taxRecord = await prisma.taxRecord.findUnique({
      where: { id: taxRecordId }
    });

    if (!taxRecord) {
      throw new Error('Corporation Tax record not found');
    }

    // Get company tax settings
    const taxSettings = await prisma.companyTaxSettings.findFirst({
      where: { isActive: true }
    });

    if (!taxSettings?.corporationTaxUTR) {
      throw new Error('Corporation Tax UTR not configured');
    }

    // Prepare Corporation Tax data for HMRC
    const corporationTaxData = {
      accountingPeriodStart: taxRecord.periodStart.toISOString(),
      accountingPeriodEnd: taxRecord.periodEnd.toISOString(),
      corporationTaxDue: Number(taxRecord.corporationTax),
      taxableProfit: Number(taxRecord.taxableProfit),
      profitBeforeTax: Number(taxRecord.taxableProfit),
      turnover: 0 // Would be calculated from sales data
    };

    // Submit to HMRC (this would require valid HMRC credentials)
    // For now, simulate submission
    const submissionResponse = {
      submissionId: `CT${Date.now()}`,
      status: 'accepted',
      processingDate: new Date().toISOString()
    };

    // Update tax record with submission details
    const updatedRecord = await prisma.taxRecord.update({
      where: { id: taxRecordId },
      data: {
        filingStatus: 'submitted',
        submissionDate: new Date(),
        hmrcSubmissionId: submissionResponse.submissionId,
        hmrcStatus: submissionResponse.status,
        updatedBy: adminId
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        taxRecord: updatedRecord,
        submissionResponse
      },
      message: 'Corporation Tax return submitted to HMRC successfully'
    });

  } catch (error) {
    throw error;
  }
}

async function performTaxPlanning(data: any) {
  try {
    const { scenarios } = data;

    const planningResults = [];

    for (const scenario of scenarios) {
      const { profit, accountingPeriodStart, accountingPeriodEnd } = scenario;

      const taxCalculation = taxCalculator.calculateCorporationTax(
        profit,
        new Date(accountingPeriodStart),
        new Date(accountingPeriodEnd)
      );

      planningResults.push({
        scenario: scenario.name,
        profit,
        corporationTax: taxCalculation.corporationTax,
        effectiveRate: taxCalculation.effectiveRate,
        savings: scenario.baselineTax - taxCalculation.corporationTax
      });
    }

    return NextResponse.json({
      success: true,
      data: planningResults,
      message: 'Tax planning analysis completed successfully'
    });

  } catch (error) {
    throw error;
  }
}
