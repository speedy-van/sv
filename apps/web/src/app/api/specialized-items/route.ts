import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { SpecializedItemCategory, InsuranceTier } from '@prisma/client';

/**
 * POST /api/specialized-items
 * Create a specialized item record
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      bookingItemId,
      category,
      technicalSpecs,
      declaredValue,
      handlingRequirements,
      requiredEquipment
    } = body;

    // Validate required fields
    if (!bookingItemId || !category || !declaredValue) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingItemId, category, declaredValue' },
        { status: 400 }
      );
    }

    // Calculate insurance tier based on declared value
    const insuranceTier = calculateInsuranceTier(declaredValue);

    // Calculate complexity and fragility scores
    const fragilityScore = calculateFragilityScore(category, technicalSpecs);
    const complexityScore = calculateComplexityScore(category, technicalSpecs);

    // Get required equipment from workflow
    const workflow = await prisma.specializedWorkflow.findUnique({
      where: { itemCategory: category }
    });

    const equipment = workflow?.mandatoryEquipment || requiredEquipment || [];

    // Create specialized item
    const specializedItem = await prisma.specializedItem.create({
      data: {
        bookingItemId,
        category,
        technicalSpecs: technicalSpecs || {},
        declaredValue,
        insuranceTier,
        fragilityScore,
        complexityScore,
        handlingRequirements: handlingRequirements || [],
        requiredEquipment: equipment,
        temperatureControl: technicalSpecs?.temperatureControl || false,
        humidityControl: technicalSpecs?.humidityControl || false,
        verticalTransport: technicalSpecs?.verticalTransport || false,
        requiresOnSiteVisit: workflow?.requiresOnSiteVisit || false
      }
    });

    // Update booking item to mark as specialized
    await prisma.bookingItem.update({
      where: { id: bookingItemId },
      data: { isSpecialized: true }
    });

    // Get booking and update flag
    const bookingItem = await prisma.bookingItem.findUnique({
      where: { id: bookingItemId },
      include: { Booking: true }
    });

    if (bookingItem) {
      await prisma.booking.update({
        where: { id: bookingItem.bookingId },
        data: { hasSpecializedItems: true }
      });
    }

    return NextResponse.json({
      success: true,
      specializedItem: {
        ...specializedItem,
        technicalSpecs: specializedItem.technicalSpecs
      }
    });
  } catch (error: any) {
    console.error('Error creating specialized item:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Specialized item already exists for this booking item' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create specialized item', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/specialized-items
 * Get specialized item by booking item ID
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingItemId = searchParams.get('bookingItemId');

    if (!bookingItemId) {
      return NextResponse.json(
        { error: 'bookingItemId parameter is required' },
        { status: 400 }
      );
    }

    const specializedItem = await prisma.specializedItem.findUnique({
      where: { bookingItemId },
      include: {
        BookingItem: true,
        ConditionReports: {
          orderBy: { reportedAt: 'desc' }
        }
      }
    });

    if (!specializedItem) {
      return NextResponse.json(
        { error: 'Specialized item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      specializedItem: {
        ...specializedItem,
        technicalSpecs: specializedItem.technicalSpecs
      }
    });
  } catch (error) {
    console.error('Error fetching specialized item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch specialized item' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateInsuranceTier(valueInPence: number): InsuranceTier {
  if (valueInPence <= 500000) return 'STANDARD'; // Up to £5,000
  if (valueInPence <= 2500000) return 'PREMIUM'; // Up to £25,000
  if (valueInPence <= 10000000) return 'PLATINUM'; // Up to £100,000
  return 'BESPOKE'; // Over £100,000
}

function calculateFragilityScore(
  category: SpecializedItemCategory,
  specs: any
): number {
  let score = 5; // Default

  switch (category) {
    case 'FINE_ART_PAINTING':
    case 'FINE_ART_SCULPTURE':
      score = 9;
      break;
    case 'PIANO_GRAND':
      score = 8;
      break;
    case 'PIANO_UPRIGHT':
      score = 7;
      break;
    case 'ANTIQUE_FURNITURE':
      score = 7;
      break;
    case 'LUXURY_FURNITURE':
      score = 6;
      break;
    case 'MEDICAL_EQUIPMENT':
      score = 8;
      break;
    case 'FRAGILE_ELECTRONICS':
      score = 8;
      break;
    default:
      score = 5;
  }

  // Adjust based on specific specs
  if (specs?.glassProtection) score += 1;
  if (specs?.age === 'Victorian (1837-1901)') score += 1;

  return Math.min(10, score);
}

function calculateComplexityScore(
  category: SpecializedItemCategory,
  specs: any
): number {
  let score = 5; // Default

  switch (category) {
    case 'PIANO_GRAND':
      score = 9;
      if (specs?.pianoLength > 7) score = 10; // Concert grand
      break;
    case 'PIANO_UPRIGHT':
      score = 7;
      if (specs?.stairsRequired) score += 1;
      if (specs?.pianoWeight > 280) score += 1;
      break;
    case 'FINE_ART_PAINTING':
      score = 6;
      if (specs?.dimensions?.includes('200') || specs?.dimensions?.includes('300')) {
        score += 2; // Large paintings
      }
      break;
    case 'MEDICAL_EQUIPMENT':
      score = 7;
      break;
    default:
      score = 5;
  }

  // Stairs always add complexity
  if (specs?.stairsRequired || specs?.stairs) score += 1;

  return Math.min(10, score);
}
