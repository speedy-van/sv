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

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'current';

    // Get current tax period
    const currentDate = new Date();
    const currentTaxPeriod = taxCalculator.getVATPeriod(currentDate, 'quarterly');

    // Get VAT summary for current period
    const vatRecord = await prisma.taxRecord.findFirst({
      where: {
        taxPeriod: currentTaxPeriod,
        taxType: 'vat'
      }
    });

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

    // Prepare dashboard data
    const dashboardData = {
      vatSummary,
      corporationTax,
      compliance,
      recentTransactions,
      deadlines,
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
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = (session.user as any).id;
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
            createdBy: adminId
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
