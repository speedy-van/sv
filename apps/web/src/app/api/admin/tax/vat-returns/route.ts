import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { taxReportingSystem } from '@/lib/tax/reporting-system';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = (session as any)?.user;
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'current';
    const report = await taxReportingSystem.generateVATReport(period, true);

    return NextResponse.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('VAT return GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load VAT return'
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
    const period = body?.period || 'current';
    const report = await taxReportingSystem.generateVATReport(period, true);

    return NextResponse.json({
      success: true,
      data: report,
      message: `VAT return generated for ${report.period}`
    });
  } catch (error) {
    console.error('VAT return POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate VAT return'
      },
      { status: 500 }
    );
  }
}
