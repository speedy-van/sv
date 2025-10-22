import { NextRequest, NextResponse } from 'next/server';
import { sendTrustpilotFeedbackEmail } from '@/lib/email/trustpilot-helper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'orderNumber',
      'customerName', 
      'customerEmail',
      'serviceType',
      'totalAmount',
      'currency',
      'completedDate'
    ];
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Missing required field: ${field}` 
          },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.customerEmail)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email format' 
        },
        { status: 400 }
      );
    }

    // Validate currency
    const validCurrencies = ['GBP', 'USD', 'EUR'];
    if (!validCurrencies.includes(body.currency)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid currency. Must be GBP, USD, or EUR' 
        },
        { status: 400 }
      );
    }

    // Validate amount
    if (typeof body.totalAmount !== 'number' || body.totalAmount <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Total amount must be a positive number' 
        },
        { status: 400 }
      );
    }

    console.log('📧 Sending Trustpilot feedback email for order:', body.orderNumber);
    
    // Send Trustpilot feedback email
    const result = await sendTrustpilotFeedbackEmail({
      orderNumber: body.orderNumber,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      serviceType: body.serviceType,
      totalAmount: body.totalAmount,
      currency: body.currency,
      completedDate: body.completedDate
    });

    if (result.success) {
      console.log('✅ Trustpilot feedback email sent successfully');
      return NextResponse.json({
        success: true,
        message: 'Trustpilot feedback email sent successfully',
        emailId: result.messageId,
        provider: result.provider
      });
    } else {
      console.error('❌ Failed to send Trustpilot feedback email:', result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to send email' 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Trustpilot feedback API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Trustpilot feedback email endpoint',
    usage: {
      method: 'POST',
      requiredFields: [
        'orderNumber',
        'customerName',
        'customerEmail', 
        'serviceType',
        'totalAmount',
        'currency',
        'completedDate'
      ],
      example: {
        orderNumber: 'SV-2024-001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        serviceType: 'Man and Van Service',
        totalAmount: 150.00,
        currency: 'GBP',
        completedDate: new Date().toISOString()
      }
    }
  });
}
