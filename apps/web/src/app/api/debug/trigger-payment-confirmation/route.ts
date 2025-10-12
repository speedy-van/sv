import { NextRequest, NextResponse } from 'next/server';
import { unifiedEmailService, type PaymentConfirmationData } from '@/lib/email/UnifiedEmailService';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [MANUAL DEBUG] ========== MANUAL PAYMENT CONFIRMATION TRIGGER ==========');
    
    const body = await request.json();
    console.log('🧪 [MANUAL DEBUG] Request body:', body);
    
    const { sessionId, bookingReference, customerEmail, customerName, totalPrice } = body;
    
    if (!customerEmail) {
      console.log('❌ [MANUAL DEBUG] No customer email provided');
      return NextResponse.json({ error: 'Customer email required' }, { status: 400 });
    }
    
    console.log('🧪 [MANUAL DEBUG] Triggering payment confirmation email...');
    
    // Prepare email data
    const emailData: PaymentConfirmationData = {
      customerEmail: customerEmail,
      orderNumber: bookingReference || `MANUAL-${Date.now()}`,
      customerName: customerName || 'Valued Customer',
      amount: totalPrice || 50.00,
      currency: 'GBP',
      paymentMethod: 'Card',
      transactionId: `manual_${Date.now()}`,
    };
    
    console.log('🧪 [MANUAL DEBUG] Email data prepared:', emailData);
    
    // Send email
    const emailResult = await unifiedEmailService.sendPaymentConfirmation(emailData);
    
    console.log('🧪 [MANUAL DEBUG] Email result:', emailResult);
    
    if (emailResult.success) {
      console.log('✅ [MANUAL DEBUG] Payment confirmation email sent successfully!');
      return NextResponse.json({
        success: true,
        message: 'Payment confirmation email sent successfully',
        emailResult,
        sessionId,
        bookingReference,
      });
    } else {
      console.log('❌ [MANUAL DEBUG] Failed to send email:', emailResult.error);
      return NextResponse.json({
        success: false,
        error: emailResult.error,
        emailResult,
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ [MANUAL DEBUG] Error in manual trigger:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
