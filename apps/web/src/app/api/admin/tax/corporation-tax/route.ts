import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { taxCalculator } from '@/lib/tax/calculator';
import { taxReportingSystem } from '@/lib/tax/reporting-system';

// Force dynamic rendering (uses headers/cookies/getServerSession)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = (session as any)?.user;
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taxYear = Number(searchParams.get('taxYear') || new Date().getFullYear());
    const report = await taxReportingSystem.generateCorporationTaxReport(taxYear, true);

    return NextResponse.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Corporation tax GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load Corporation Tax data'
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
      case 'calculate_tax':
        return calculateCorporationTax(data);
      case 'generate_return':
        return generateReportPayload(data);
      case 'tax_planning':
        return performTaxPlanning(data);
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Unsupported action',
            details: 'Available actions: calculate_tax, generate_return, tax_planning'
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Corporation tax POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process Corporation Tax request'
      },
      { status: 500 }
    );
  }
}

async function calculateCorporationTax(payload: any) {
  const { profit, accountingPeriodStart, accountingPeriodEnd, associatedCompanies = 0 } = payload;

  const result = taxCalculator.calculateCorporationTax(
    Number(profit),
    new Date(accountingPeriodStart),
    new Date(accountingPeriodEnd),
    associatedCompanies
  );

  return NextResponse.json({
    success: true,
    data: result
  });
}

async function generateReportPayload(payload: any) {
  const taxYear = Number(payload?.taxYear ?? new Date().getFullYear());
  const report = await taxReportingSystem.generateCorporationTaxReport(taxYear, true);

  return NextResponse.json({
    success: true,
    data: report,
    message: `Corporation Tax report prepared for ${taxYear}`
  });
}

async function performTaxPlanning(payload: any) {
  const { scenarios } = payload ?? {};
  const results = Array.isArray(scenarios) ? scenarios : [];

  const reports = await Promise.all(
    results.map(async (scenario) => {
      const { profit = 0, accountingPeriodStart, accountingPeriodEnd, name = 'Scenario' } = scenario;
      const calc = taxCalculator.calculateCorporationTax(
        Number(profit),
        new Date(accountingPeriodStart),
        new Date(accountingPeriodEnd)
      );

      return {
        name,
        inputs: scenario,
        result: calc
      };
    })
  );

  return NextResponse.json({
    success: true,
    data: reports
  });
}
