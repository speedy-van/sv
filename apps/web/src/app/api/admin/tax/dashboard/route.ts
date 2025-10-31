/**
 * TAX DASHBOARD API ENDPOINT
 * 
 * Provides comprehensive tax dashboard data including:
 * - VAT summary and current period data
 * - Corporation Tax calculations
 * - Compliance status and scores
 * - Recent transactions
 * - Upcoming deadlines
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { taxCalculator } from '@/lib/tax/calculator';
import { taxDeadlineManager } from '@/lib/tax/deadline-manager';
import { taxReportingSystem } from '@/lib/tax/reporting-system';
import { siteDataIntegration } from '@/lib/tax/site-integration';
import { aiTaxAnalyzer } from '@/lib/tax/ai-tax-analyzer';
import { taxValidationService } from '@/lib/tax/validation-service';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    const user = (session as any)?.user;
    const role = user?.role as string | undefined;
    const userId = user?.id as string | undefined;
    if (!user || !role || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = userId;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'current';

    // Get current tax period
    const currentDate = new Date();
    const currentTaxPeriod = taxCalculator.getVATPeriod(currentDate, 'quarterly');

    // Calculate period dates
    const periodStart = new Date(currentDate.getFullYear(), Math.floor((currentDate.getMonth()) / 3) * 3, 1);
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 3);
    periodEnd.setDate(0); // Last day of previous month

    // Get VAT summary for current period from site data
    let vatRecord = await prisma.taxRecord.findFirst({
      where: {
        taxPeriod: currentTaxPeriod,
        taxType: 'vat'
      }
    });

    // If no record exists, calculate from bookings
    if (!vatRecord) {
      const bookingsData = await siteDataIntegration.getBookingsForTaxPeriod(periodStart, periodEnd);
      const totalVATCollected = bookingsData.reduce((sum, b) => sum + b.vatAmount, 0);
      const totalSales = bookingsData.reduce((sum, b) => sum + b.netAmount, 0);
      
      // Create temporary record for display
      vatRecord = {
        netVATDue: totalVATCollected,
        vatOnSales: totalVATCollected,
        vatOnPurchases: 0,
        totalSales: totalSales,
        totalPurchases: 0
      } as any;
    }

    // Get company tax settings
    const taxSettings = await prisma.companyTaxSettings.findFirst({
      where: { isActive: true }
    });

    // Calculate VAT summary
    const vatSummary = {
      currentPeriod: currentTaxPeriod,
      vatDue: vatRecord ? Number(vatRecord.netVATDue) : 0,
      vatCollected: vatRecord ? Number(vatRecord.vatOnSales) : 0,
      vatReclaimed: vatRecord ? Number(vatRecord.vatOnPurchases) : 0,
      netVATDue: vatRecord ? Number(vatRecord.netVATDue) : 0,
    };

    // Calculate Corporation Tax estimate
    const currentYear = currentDate.getFullYear();
    const taxRecords = await prisma.taxRecord.findMany({
      where: {
        taxYear: currentYear,
        taxType: 'vat'
      }
    });

    const annualTurnover = taxRecords.reduce((sum, record) => sum + Number(record.totalSales), 0);
    const annualExpenses = taxRecords.reduce((sum, record) => sum + Number(record.totalPurchases), 0);
    const estimatedProfit = annualTurnover - annualExpenses;

    const corporationTaxCalculation = taxCalculator.calculateCorporationTax(
      estimatedProfit,
      new Date(currentYear, 0, 1),
      new Date(currentYear, 11, 31)
    );

    const corporationTax = {
      estimatedTax: corporationTaxCalculation.corporationTax,
      profit: corporationTaxCalculation.taxableProfit,
      effectiveRate: corporationTaxCalculation.effectiveRate,
      taxFreeAllowance: corporationTaxCalculation.taxFreeAllowance,
    };

    // Get compliance status
    const complianceChecks = await taxDeadlineManager.getComplianceStatus();
    const overallCompliance = complianceChecks.find(check => 
      check.checkType === 'overall_compliance'
    );

    const upcomingDeadlines = await taxDeadlineManager.checkUpcomingDeadlines();
    const overdueDeadlines = await prisma.taxDeadline.count({
      where: {
        status: 'overdue',
        isCompleted: false
      }
    });

    const compliance = {
      overallScore: overallCompliance ? overallCompliance.complianceScore : 100,
      isCompliant: overallCompliance ? overallCompliance.isCompliant : true,
      overdueDeadlines,
      upcomingDeadlines: upcomingDeadlines.length,
    };

    // Get recent transactions
    const recentInvoices = await prisma.taxInvoice.findMany({
      where: {
        issueDate: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      include: {
        customer: true
      },
      orderBy: {
        issueDate: 'desc'
      },
      take: 10
    });

    const recentTransactions = recentInvoices.map(invoice => ({
      id: invoice.id,
      type: 'Invoice Payment',
      amount: Number(invoice.grossAmount),
      date: invoice.issueDate,
      status: invoice.paymentStatus === 'paid' ? 'completed' : 'pending',
    }));

    // Get upcoming deadlines
    const deadlines = upcomingDeadlines.slice(0, 5).map(deadline => ({
      id: deadline.id,
      title: deadline.title,
      dueDate: deadline.dueDate,
      status: deadline.status,
      daysRemaining: Math.ceil((deadline.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    }));

    // Get real-time stats from site
    const realTimeStats = await siteDataIntegration.getRealTimeStats();

    // Get AI insights if available
    let aiInsights = null;
    try {
      const anomalyDetection = await aiTaxAnalyzer.detectAnomalies({
        period: currentTaxPeriod,
        revenue: Number(vatRecord?.totalSales || 0),
        vatCollected: Number(vatRecord?.vatOnSales || 0),
        vatReclaimed: Number(vatRecord?.vatOnPurchases || 0),
        expenses: Number(vatRecord?.totalPurchases || 0),
        transactions: recentInvoices.length
      });
      
      aiInsights = {
        anomalies: anomalyDetection.anomalies.slice(0, 3),
        riskScore: anomalyDetection.overallRiskScore,
        recommendations: anomalyDetection.recommendations.slice(0, 5)
      };
    } catch (error) {
      console.log('AI insights unavailable:', error);
    }

    // Prepare dashboard data
    const dashboardData = {
      vatSummary,
      corporationTax,
      compliance,
      recentTransactions,
      deadlines,
      realTimeStats,
      aiInsights,
      taxSettings: {
        isVATRegistered: taxSettings?.isVATRegistered || false,
        vatRegistrationNumber: taxSettings?.vatRegistrationNumber,
        corporationTaxUTR: taxSettings?.corporationTaxUTR,
        vatReturnFrequency: taxSettings?.vatReturnFrequency || 'quarterly'
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
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    const user = (session as any)?.user;
    const role = user?.role as string | undefined;
    const userId = user?.id as string | undefined;
    if (!user || !role || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = userId;
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'refresh_data':
        // Trigger data refresh
        await taxDeadlineManager.checkUpcomingDeadlines();
        
        return NextResponse.json({
          success: true,
          message: 'Dashboard data refreshed successfully'
        });

      case 'create_deadline':
        // Create new tax deadline
        const deadline = await prisma.taxDeadline.create({
          data: {
            deadlineType: data.deadlineType,
            title: data.title,
            description: data.description,
            dueDate: new Date(data.dueDate),
            taxYear: data.taxYear,
            taxPeriod: data.taxPeriod,
            createdBy: adminId!
          }
        });

        return NextResponse.json({
          success: true,
          data: deadline,
          message: 'Deadline created successfully'
        });

      case 'mark_deadline_completed':
        // Mark deadline as completed
        await prisma.taxDeadline.update({
          where: { id: data.deadlineId },
          data: {
            status: 'completed',
            isCompleted: true,
            submissionDate: new Date(),
            updatedBy: adminId
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Deadline marked as completed'
        });

      case 'sync_bookings':
        // Sync bookings to tax invoices
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
        // Validate VAT number
        const vatValidation = await taxValidationService.validateVATNumberOnline(data.vatNumber);

        return NextResponse.json({
          success: true,
          data: vatValidation,
          message: vatValidation.isValid ? 'VAT number is valid' : 'VAT number validation failed'
        });

      case 'get_ai_insights':
        // Get AI tax insights
        const insights = await aiTaxAnalyzer.answerTaxQuery(data.query, data.context);

        return NextResponse.json({
          success: true,
          data: { answer: insights },
          message: 'AI insights generated'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Tax dashboard POST API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process request'
      },
      { status: 500 }
    );
  }
}
