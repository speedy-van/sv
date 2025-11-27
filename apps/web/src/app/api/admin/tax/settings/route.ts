import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCustomSession } from '@/lib/custom-auth';

// Force dynamic rendering (uses headers/cookies/getServerSession)
export const dynamic = 'force-dynamic';

const defaultSettings = {
  isVATRegistered: true,
  vatRegistrationNumber: process.env.TAX_VAT_REGISTRATION ?? null,
  vatReturnFrequency: 'quarterly',
  corporationTaxUTR: process.env.TAX_CORPORATION_UTR ?? null,
  reminderEmails: [] as string[],
  reminderPhoneNumbers: [] as string[]
};

export async function GET() {
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

    return NextResponse.json({
      success: true,
      data: defaultSettings
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tax settings'
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

    await request.json();

    return NextResponse.json(
      {
        success: false,
        error: 'Persistent tax settings storage is not enabled in this environment.'
      },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update tax settings'
      },
      { status: 500 }
    );
  }
}
