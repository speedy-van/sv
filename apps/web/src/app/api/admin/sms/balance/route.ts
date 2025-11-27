import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCustomSession } from '@/lib/custom-auth';
import { getVoodooSMSService } from '@/lib/sms/VoodooSMSService';

export const dynamic = 'force-dynamic';

/**
 * Get SMS balance
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const customSession = await getCustomSession();
    let isAdmin = customSession?.user?.role === 'admin';
    
    if (!customSession?.user) {
      const session = await getServerSession(authOptions);
      isAdmin = (session as any)?.user?.role === 'admin';
      
      if (!session || !isAdmin) {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 401 }
        );
      }
    }
    
    if (!isAdmin) {
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