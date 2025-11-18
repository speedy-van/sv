import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { taxReportingSystem } from '@/lib/tax/reporting-system';
import { siteDataIntegration } from '@/lib/tax/site-integration';
import { aiTaxAnalyzer } from '@/lib/tax/ai-tax-analyzer';
import { taxValidationService } from '@/lib/tax/validation-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = (session as any)?.user;
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vatReport = await taxReportingSystem.generateVATReport('current', false);
    const corpReport = await taxReportingSystem.generateCorporationTaxReport(
      new Date().getFullYear(),
      false
    );
    const complianceReport = await taxReportingSystem.generateComplianceReport();

    const recentInvoices = await prisma.taxInvoice.findMany({
      where: {
        issueDate: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { issueDate: 'desc' },
      take: 10
    });

    const recentTransactions = recentInvoices.map(invoice => ({
      id: invoice.id,
      type: 'Tax Invoice',
      amount: Number(invoice.grossAmount),
      date: invoice.issueDate,
      status: invoice.paymentStatus
    }));

    let realTimeStats: Awaited<ReturnType<typeof siteDataIntegration.getRealTimeStats>> | null = null;
    try {
      realTimeStats = await siteDataIntegration.getRealTimeStats();
    } catch (statsError) {
      console.warn('Real-time stats unavailable:', statsError);
    }

    let aiInsights: Awaited<ReturnType<typeof aiTaxAnalyzer.detectAnomalies>> | null = null;
    try {
      aiInsights = await aiTaxAnalyzer.detectAnomalies({
        period: vatReport.period,
        revenue: vatReport.summary.totalSales,
        vatCollected: vatReport.summary.vatOnSales,
        vatReclaimed: vatReport.summary.vatOnPurchases,
        expenses: corpReport.profitAndLoss.operatingExpenses,
        transactions: recentInvoices.length
      });
    } catch (aiError) {
      console.warn('AI insights unavailable:', aiError);
    }

    const dashboardData = {
      vatSummary: {
        currentPeriod: vatReport.period,
        vatDue: vatReport.summary.netVATDue,
        vatCollected: vatReport.summary.vatOnSales,
        vatReclaimed: vatReport.summary.vatOnPurchases,
        netVATDue: vatReport.summary.netVATDue
      },
      corporationTax: {
        estimatedTax: corpReport.taxCalculation.corporationTax,
        profit: corpReport.taxCalculation.taxableProfit,
        effectiveRate: corpReport.taxCalculation.effectiveRate,
        taxFreeAllowance: corpReport.taxCalculation.taxFreeAllowance
      },
      compliance: {
        overallScore: complianceReport.overallScore,
        isCompliant: complianceReport.isCompliant,
        overdueDeadlines: complianceReport.summary.overdueDeadlines,
        upcomingDeadlines: complianceReport.deadlines.length
      },
      deadlines: complianceReport.deadlines,
      recentTransactions,
      realTimeStats,
      aiInsights,
      taxSettings: {
        isVATRegistered: true,
        vatRegistrationNumber: process.env.TAX_VAT_REGISTRATION ?? null,
        corporationTaxUTR: process.env.TAX_CORPORATION_UTR ?? null,
        vatReturnFrequency: 'quarterly'
      }
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Tax dashboard API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = (session as any)?.user;
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body ?? {};

    switch (action) {
      case 'refresh_data':
        await taxReportingSystem.generateComplianceReport();
        return NextResponse.json({
          success: true,
          message: 'Dashboard data refreshed'
        });

      case 'sync_bookings':
        if (!data?.periodStart || !data?.periodEnd) {
          return NextResponse.json(
            { success: false, error: 'periodStart and periodEnd are required' },
            { status: 400 }
          );
        }
        const syncResult = await siteDataIntegration.batchSyncBookingsToInvoices(
          new Date(data.periodStart),
          new Date(data.periodEnd)
        );
        return NextResponse.json({
          success: true,
          data: syncResult,
          message: `Synced ${syncResult.created} bookings to invoices`
        });

      case 'validate_vat':
        if (!data?.vatNumber) {
          return NextResponse.json(
            { success: false, error: 'VAT number is required' },
            { status: 400 }
          );
        }
        const validationResult = await taxValidationService.validateVATNumberOnline(data.vatNumber);
        return NextResponse.json({
          success: true,
          data: validationResult,
          message: validationResult.isValid ? 'VAT number is valid' : 'VAT number is invalid'
        });

      case 'get_ai_insights':
        if (!data?.query) {
          return NextResponse.json(
            { success: false, error: 'Query is required' },
            { status: 400 }
          );
        }
        const answer = await aiTaxAnalyzer.answerTaxQuery(data.query, data.context);
        return NextResponse.json({
          success: true,
          data: { answer },
          message: 'AI insight generated'
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Unsupported action',
            details: 'Available actions: refresh_data, sync_bookings, validate_vat, get_ai_insights'
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Tax dashboard POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process dashboard action'
      },
      { status: 500 }
    );
  }
}
