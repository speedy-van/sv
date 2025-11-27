import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCustomSession } from '@/lib/custom-auth';
import { taxReportingSystem } from '@/lib/tax/reporting-system';

// Force dynamic rendering (uses headers/cookies/getServerSession)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const customSession = await getCustomSession();
    let isAdmin = customSession?.user?.role === 'admin' || customSession?.user?.role === 'superadmin';
    
    if (!customSession?.user) {
      const session = await getServerSession(authOptions);
      const user = (session as any)?.user;
      isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
      
      if (!user || !isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    if (!isAdmin) {
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
    const customSession = await getCustomSession();
    let isAdmin = customSession?.user?.role === 'admin' || customSession?.user?.role === 'superadmin';
    
    if (!customSession?.user) {
      const session = await getServerSession(authOptions);
      const user = (session as any)?.user;
      isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
      
      if (!user || !isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    if (!isAdmin) {
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
