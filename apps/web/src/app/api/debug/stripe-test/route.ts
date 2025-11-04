import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check environment variables
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!stripeSecretKey) {
      return NextResponse.json({
        success: false,
        error: 'STRIPE_SECRET_KEY not found in environment variables',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      });
    }

    // Initialize Stripe with live key
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-04-10',
    });

    // Test Stripe API connectivity
    console.log('🔍 Testing Stripe live API connectivity...');
    
    // Get account information to verify the key works
    const account = await stripe.accounts.retrieve();
    
    // Test creating a payment intent (without charging)
    const testPaymentIntent = await stripe.paymentIntents.create({
      amount: 100, // £1.00 in pence
      currency: 'gbp',
      payment_method_types: ['card'],
      capture_method: 'manual', // Don't capture immediately
      metadata: {
        test: 'true',
        environment: 'production_test',
      },
    });

    // Cancel the test payment intent immediately
    await stripe.paymentIntents.cancel(testPaymentIntent.id);

    return NextResponse.json({
      success: true,
      message: 'Stripe live configuration is working correctly',
      environment: process.env.NODE_ENV,
      stripeConfig: {
        secretKey: stripeSecretKey.substring(0, 12) + '...',
        publishableKey: stripePublishableKey ? stripePublishableKey.substring(0, 12) + '...' : 'NOT SET',
        webhookSecret: webhookSecret ? 'SET' : 'NOT SET',
        accountId: account.id,
        accountCountry: account.country,
        accountType: account.type,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
      },
      testResults: {
        apiConnectivity: 'SUCCESS',
        paymentIntentCreation: 'SUCCESS',
        paymentIntentCancellation: 'SUCCESS',
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Stripe test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      errorType: error.type || 'unknown',
      stripeError: error.code || null,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
