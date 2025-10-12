import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📱 [SMS DEBUG] ========== MANUAL SMS NOTIFICATION TRIGGER ==========');
    
    const body = await request.json();
    console.log('📱 [SMS DEBUG] Request body:', body);
    
    const { customerPhone, customerName, bookingReference, totalPrice } = body;
    
    if (!customerPhone) {
      console.log('❌ [SMS DEBUG] No customer phone provided');
      return NextResponse.json({ error: 'Customer phone required' }, { status: 400 });
    }
    
    console.log('📱 [SMS DEBUG] Sending SMS notification...');
    
    // Prepare SMS data
    const smsData = {
      customerName: customerName || 'Valued Customer',
      customerPhone: customerPhone,
      bookingReference: bookingReference || `MANUAL-${Date.now()}`,
      scheduledDate: new Date().toLocaleDateString('en-GB'),
      totalPrice: totalPrice || 50.00,
    };
    
    console.log('📱 [SMS DEBUG] SMS data prepared:', smsData);
    
    // Simulate SMS sending (debug endpoint - uses mock)
    const smsResult = {
      success: true,
      messageId: `sms_${Date.now()}`,
      provider: 'voodoo-sms',
    };
    
    console.log('📱 [SMS DEBUG] SMS result:', smsResult);
    
    if (smsResult.success) {
      console.log('✅ [SMS DEBUG] SMS notification sent successfully!');
      return NextResponse.json({
        success: true,
        message: 'SMS notification sent successfully',
        smsResult,
        customerPhone,
        bookingReference,
      });
    } else {
      console.log('❌ [SMS DEBUG] Failed to send SMS');
      return NextResponse.json({
        success: false,
        error: 'Failed to send SMS',
        smsResult,
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ [SMS DEBUG] Error in SMS trigger:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
