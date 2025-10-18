import { NextResponse } from 'next/server';
import { COMPREHENSIVE_CATALOG } from '@/lib/pricing/catalog-dataset';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('📋 API: Serving catalog items:', COMPREHENSIVE_CATALOG.length);
    
    return NextResponse.json({
      success: true,
      items: COMPREHENSIVE_CATALOG,
      total: COMPREHENSIVE_CATALOG.length,
      message: 'Home Furniture Pricing Catalog loaded successfully'
    });
  } catch (error) {
    console.error('❌ API: Failed to fetch catalog items:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch catalog items',
        success: false,
        items: [],
        total: 0
      },
      { status: 500 }
    );
  }
}
