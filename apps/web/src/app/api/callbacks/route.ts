import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = (body?.name || '').trim();
    const preferredTime = (body?.preferredTime || '').trim() || 'Anytime (9am - 6pm)';
    const page = (body?.page || '').trim();
    const phone = (body?.phone || '').trim();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
    }

    // ContactInquiry requires an email; use a safe placeholder for callback requests.
    const placeholderEmail = 'callback@speedy-van.co.uk';

    const record = await prisma.contactInquiry.create({
      data: {
        name,
        email: placeholderEmail,
        phone,
        service: 'callback',
        message: `Callback request at ${preferredTime}${page ? ` (page: ${page})` : ''}`,
        status: 'pending',
        source: 'call_me_back',
      },
    });

    return NextResponse.json({ success: true, id: record.id });
  } catch (error) {
    console.error('❌ Failed to save callback request', error);
    return NextResponse.json({ error: 'Failed to save callback request' }, { status: 500 });
  }
}

