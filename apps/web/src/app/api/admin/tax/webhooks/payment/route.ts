/**
 * PAYMENT WEBHOOK API ENDPOINT FOR TAX SYSTEM
 * 
 * Handles payment webhooks from various gateways and automatically
 * records tax transactions for compliance and reporting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { paymentWebhookService, PaymentGateway } from '@/lib/tax/payment-webhooks';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gateway = searchParams.get('gateway') as PaymentGateway;

    if (!gateway) {
      return NextResponse.json(
        { error: 'Payment gateway not specified' },
        { status: 400 }
      );
    }

    // Route to appropriate webhook handler
    switch (gateway) {
      case PaymentGateway.STRIPE:
        return await handleStripeWebhook(request);

      case PaymentGateway.PAYPAL:
        return await handlePayPalWebhook(request);

      case PaymentGateway.WORLDPAY:
        return await handleWorldPayWebhook(request);

      case PaymentGateway.SQUARE:
        return await handleSquareWebhook(request);

      default:
        return NextResponse.json(
          { error: 'Unsupported payment gateway' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Payment webhook error:', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleStripeWebhook(request: NextRequest) {
  try {
    const result = await paymentWebhookService.processStripeWebhook(request);
    
    return NextResponse.json({
      success: true,
      message: 'Stripe webhook processed successfully',
      data: result
    });

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      {
        error: 'Stripe webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handlePayPalWebhook(request: NextRequest) {
  try {
    const result = await paymentWebhookService.processWebhook(request, PaymentGateway.PAYPAL);
    
    return NextResponse.json({
      success: true,
      message: 'PayPal webhook processed successfully',
      data: result
    });

  } catch (error) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json(
      {
        error: 'PayPal webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleWorldPayWebhook(request: NextRequest) {
  try {
    const result = await paymentWebhookService.processWebhook(request, PaymentGateway.WORLDPAY);
    
    return NextResponse.json({
      success: true,
      message: 'WorldPay webhook processed successfully',
      data: result
    });

  } catch (error) {
    console.error('WorldPay webhook error:', error);
    return NextResponse.json(
      {
        error: 'WorldPay webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleSquareWebhook(request: NextRequest) {
  try {
    const result = await paymentWebhookService.processWebhook(request, PaymentGateway.SQUARE);
    
    return NextResponse.json({
      success: true,
      message: 'Square webhook processed successfully',
      data: result
    });

  } catch (error) {
    console.error('Square webhook error:', error);
    return NextResponse.json(
      {
        error: 'Square webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'Tax payment webhook endpoint is operational',
    timestamp: new Date().toISOString()
  });
}
