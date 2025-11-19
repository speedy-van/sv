import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
    const session = await getServerSession(authOptions);
    const user = (session as any)?.user;
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
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
    const session = await getServerSession(authOptions);
    const user = (session as any)?.user;
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
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
