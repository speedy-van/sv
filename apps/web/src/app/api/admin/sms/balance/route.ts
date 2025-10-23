import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getVoodooSMSService } from '@/lib/sms/VoodooSMSService';

/**
 * Get SMS balance
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log('=== CHECKING SMS BALANCE ===');

    // Get Voodoo SMS service
    const voodooSMS = getVoodooSMSService();

    // Check balance
    const result = await voodooSMS.checkBalance();

    if (!result.success) {
      console.error('Failed to check balance:', result.error);
      return NextResponse.json(
        { error: 'Failed to check balance', details: result.error },
        { status: 500 }
      );
    }

    console.log('✅ Balance checked successfully:', result.balance);

    return NextResponse.json({
      success: true,
      balance: result.balance || 0,
    });

  } catch (error) {
    console.error('=== BALANCE CHECK ERROR ===');
    console.error('Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}