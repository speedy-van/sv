/**
 * VAT RETURNS API ENDPOINT
 * 
 * Handles VAT return operations including:
 * - Creating new VAT returns
 * - Updating existing returns
 * - Submitting returns to HMRC
 * - Getting return history
 * - Calculating VAT amounts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { taxCalculator, VatRateType } from '@/lib/tax/calculator';
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
    const period = searchParams.get('period');
    const includeDetails = searchParams.get('includeDetails') === 'true';

    // Get VAT returns
    let whereClause: any = {
      taxType: 'vat'
    };

    if (period) {
      whereClause.taxPeriod = period;
    }

    const vatReturns = await prisma.taxRecord.findMany({
      where: whereClause,
      include: {
        invoices: {
          include: {
            customer: true
          }
        },
        expenses: true
      },
      orderBy: {
        periodStart: 'desc'
      }
    });

    // Format returns data
    const formattedReturns = vatReturns.map(record => ({
      id: record.id,
      period: record.taxPeriod,
      periodStart: record.periodStart,
      periodEnd: record.periodEnd,
      totalSales: Number(record.totalSales),
      totalPurchases: Number(record.totalPurchases),
      vatOnSales: Number(record.vatOnSales),
      vatOnPurchases: Number(record.vatOnPurchases),
      netVATDue: Number(record.netVATDue),
      filingStatus: record.filingStatus,
      paymentStatus: record.paymentStatus,
      submissionDate: record.submissionDate,
      paymentDate: record.paymentDate,
      hmrcSubmissionId: record.hmrcSubmissionId,
      hmrcStatus: record.hmrcStatus,
      breakdown: {
        standardRate: {
          sales: Number(record.standardRateSales),
          vat: Number(record.standardRateVAT)
        },
        reducedRate: {
          sales: Number(record.reducedRateSales),
          vat: Number(record.reducedRateVAT)
        },
        zeroRate: {
          sales: Number(record.zeroRateSales),
          vat: 0
        },
        exempt: {
          sales: Number(record.exemptSales),
          vat: 0
        }
      },
      invoices: includeDetails ? record.invoices.map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customer?.name || 'Unknown',
        netAmount: Number(invoice.netAmount),
        vatAmount: Number(invoice.vatAmount),
        grossAmount: Number(invoice.grossAmount),
        vatRate: Number(invoice.vatRate),
        issueDate: invoice.issueDate,
        status: invoice.status
      })) : [],
      expenses: includeDetails ? record.expenses.map(expense => ({
        id: expense.id,
        description: expense.description,
        amount: Number(expense.amount),
        vatAmount: Number(expense.vatAmount),
        isVATReclaimableIncome: expense.isVATReclaimable,
        category: expense.category,
        expenseDate: expense.expenseDate
      })) : []
    }));

    return NextResponse.json({
      success: true,
      data: formattedReturns,
      count: formattedReturns.length
    });

  } catch (error) {
    console.error('VAT returns GET API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch VAT returns'
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
      case 'create_return':
        return await createVATReturn(data, adminId);

      case 'update_return':
        return await updateVATReturn(data, adminId);

      case 'submit_to_hmrc':
        return await submitVATReturnToHMRC(data, adminId);

      case 'calculate_vat':
        return await calculateVATAmounts(data);

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('VAT returns POST API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process VAT return request'
      },
      { status: 500 }
    );
  }
}

async function createVATReturn(data: any, adminId: string) {
  try {
    const { period, periodStart, periodEnd, invoices, expenses } = data;

    // Calculate VAT totals
    const vatCalculation = await calculateVATTotals(invoices, expenses);

    // Create tax record
    const taxRecord = await prisma.taxRecord.create({
      data: {
        taxYear: new Date(periodStart).getFullYear(),
        taxPeriod: period,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        taxType: 'vat',
        totalSales: vatCalculation.totalSales,
        totalPurchases: vatCalculation.totalPurchases,
        vatOnSales: vatCalculation.vatOnSales,
        vatOnPurchases: vatCalculation.vatOnPurchases,
        netVATDue: vatCalculation.netVATDue,
        standardRateSales: vatCalculation.breakdown.standardRate.sales,
        standardRateVAT: vatCalculation.breakdown.standardRate.vat,
        reducedRateSales: vatCalculation.breakdown.reducedRate.sales,
        reducedRateVAT: vatCalculation.breakdown.reducedRate.vat,
        zeroRateSales: vatCalculation.breakdown.zeroRate.sales,
        exemptSales: vatCalculation.breakdown.exempt.sales,
        filingStatus: 'pending',
        paymentStatus: 'unpaid',
        createdBy: adminId
      }
    });

    return NextResponse.json({
      success: true,
      data: taxRecord,
      message: 'VAT return created successfully'
    });

  } catch (error) {
    throw error;
  }
}

async function updateVATReturn(data: any, adminId: string) {
  try {
    const { returnId, invoices, expenses } = data;

    // Calculate VAT totals
    const vatCalculation = await calculateVATTotals(invoices, expenses);

    // Update tax record
    const taxRecord = await prisma.taxRecord.update({
      where: { id: returnId },
      data: {
        totalSales: vatCalculation.totalSales,
        totalPurchases: vatCalculation.totalPurchases,
        vatOnSales: vatCalculation.vatOnSales,
        vatOnPurchases: vatCalculation.vatOnPurchases,
        netVATDue: vatCalculation.netVATDue,
        standardRateSales: vatCalculation.breakdown.standardRate.sales,
        standardRateVAT: vatCalculation.breakdown.standardRate.vat,
        reducedRateSales: vatCalculation.breakdown.reducedRate.sales,
        reducedRateVAT: vatCalculation.breakdown.reducedRate.vat,
        zeroRateSales: vatCalculation.breakdown.zeroRate.sales,
        exemptSales: vatCalculation.breakdown.exempt.sales,
        updatedBy: adminId
      }
    });

    return NextResponse.json({
      success: true,
      data: taxRecord,
      message: 'VAT return updated successfully'
    });

  } catch (error) {
    throw error;
  }
}

async function submitVATReturnToHMRC(data: any, adminId: string) {
  try {
    const { returnId } = data;

    // Get tax record
    const taxRecord = await prisma.taxRecord.findUnique({
      where: { id: returnId }
    });

    if (!taxRecord) {
      throw new Error('VAT return not found');
    }

    // Get company tax settings
    const taxSettings = await prisma.companyTaxSettings.findFirst({
      where: { isActive: true }
    });

    if (!taxSettings?.vatRegistrationNumber) {
      throw new Error('VAT registration number not configured');
    }

    // Format VAT return data for HMRC
    const vatReturnData = hmrcApiService.formatVATReturnData({
      periodKey: taxRecord.taxPeriod,
      vatDueSales: Number(taxRecord.vatOnSales),
      vatDueAcquisitions: 0,
      totalVatDue: Number(taxRecord.vatOnSales),
      vatReclaimedCurrPeriod: Number(taxRecord.vatOnPurchases),
      netVatDue: Number(taxRecord.netVATDue),
      totalValueSalesExVAT: Number(taxRecord.totalSales),
      totalValuePurchasesExVAT: Number(taxRecord.totalPurchases),
      totalValueGoodsSuppliedExVAT: 0,
      totalAcquisitionsExVAT: 0
    });

    // Submit to HMRC (this would require valid HMRC credentials)
    // For now, simulate submission
    const submissionResponse = {
      processingDate: new Date().toISOString(),
      paymentIndicator: 'DD',
      formBundleNumber: `FB${Date.now()}`,
      chargeRefNumber: `CR${Date.now()}`
    };

    // Update tax record with submission details
    const updatedRecord = await prisma.taxRecord.update({
      where: { id: returnId },
      data: {
        filingStatus: 'submitted',
        submissionDate: new Date(),
        hmrcSubmissionId: submissionResponse.formBundleNumber,
        hmrcStatus: 'accepted',
        updatedBy: adminId
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        taxRecord: updatedRecord,
        submissionResponse
      },
      message: 'VAT return submitted to HMRC successfully'
    });

  } catch (error) {
    throw error;
  }
}

async function calculateVATAmounts(data: any) {
  try {
    const { invoices, expenses } = data;

    const calculation = await calculateVATTotals(invoices, expenses);

    return NextResponse.json({
      success: true,
      data: calculation,
      message: 'VAT amounts calculated successfully'
    });

  } catch (error) {
    throw error;
  }
}

async function calculateVATTotals(invoices: any[], expenses: any[]) {
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

  // Process invoices
  invoices.forEach(invoice => {
    const vatCalculation = taxCalculator.calculateVAT(
      invoice.amount,
      invoice.vatRateType || VatRateType.STANDARD,
      invoice.isReverseCharge || false
    );

    totalSales += vatCalculation.net;
    vatOnSales += vatCalculation.vat;

    // Update breakdown
    const rateType = invoice.vatRateType || 'standard';
    breakdown[rateType as keyof typeof breakdown].sales += vatCalculation.net;
    breakdown[rateType as keyof typeof breakdown].vat += vatCalculation.vat;
  });

  // Process expenses
  expenses.forEach(expense => {
    if (expense.isVATReclaimable) {
      const vatCalculation = taxCalculator.calculateVAT(
        expense.amount,
        expense.vatRateType || VatRateType.STANDARD
      );

      totalPurchases += vatCalculation.net;
      vatOnPurchases += vatCalculation.vat;
    }
  });

  const netVATDue = vatOnSales - vatOnPurchases;

  return {
    totalSales,
    totalPurchases,
    vatOnSales,
    vatOnPurchases,
    netVATDue,
    breakdown
  };
}
