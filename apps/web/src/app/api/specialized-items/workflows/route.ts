import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { SpecializedItemCategory } from '@prisma/client';

/**
 * GET /api/specialized-items/workflows
 * Fetch workflow configuration for a specialized item category
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') as SpecializedItemCategory;

    if (!category) {
      return NextResponse.json(
        { error: 'Category parameter is required' },
        { status: 400 }
      );
    }

    const workflow = await prisma.specializedWorkflow.findUnique({
      where: { 
        itemCategory: category,
        isActive: true
      }
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found for this category' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      workflow: {
        ...workflow,
        requiredFields: JSON.parse(workflow.requiredFields as string),
        optionalFields: workflow.optionalFields 
          ? JSON.parse(workflow.optionalFields as string) 
          : []
      }
    });
  } catch (error) {
    console.error('Error fetching specialized workflow:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    );
  }
}
