import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { assertRole } from '@/lib/guards';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Validation schemas
const addressSchema = z.object({
  label: z.string().min(1, 'Label is required').max(50, 'Label too long'),
  line1: z
    .string()
    .min(1, 'Address line 1 is required')
    .max(100, 'Address line 1 too long'),
  line2: z.string().max(100, 'Address line 2 too long').optional(),
  city: z.string().min(1, 'City is required').max(50, 'City too long'),
  postcode: z
    .string()
    .min(1, 'Postcode is required')
    .max(10, 'Postcode too long'),
  floor: z.string().max(20, 'Floor too long').optional(),
  flat: z.string().max(20, 'Flat too long').optional(),
  lift: z.boolean().optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
  isDefault: z.boolean().optional(),
});

const updateAddressSchema = addressSchema.partial().extend({
  id: z.string().cuid('Invalid address ID'),
});

// GET /api/portal/addresses - Get all addresses for the customer
export async function GET(request: NextRequest) {
  const session = await auth();
  try {
    assertRole(session!, ['customer']);
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === 'UNAUTHORIZED' ? 401 : 403;
    return new Response(msg, { status });
  }

  const userId = session.user.id;

  try {
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

// POST /api/portal/addresses - Create a new address
export async function POST(request: NextRequest) {
  const session = await auth();
  try {
    assertRole(session!, ['customer']);
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === 'UNAUTHORIZED' ? 401 : 403;
    return new Response(msg, { status });
  }

  const userId = session.user.id;

  try {
    const body = await request.json();
    const validatedData = addressSchema.parse(body);
    const customerId = userId;

    // If this is being set as default, unset other defaults
    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: { userId: customerId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        label: validatedData.label,
        line1: validatedData.line1,
        line2: validatedData.line2,
        city: validatedData.city,
        postcode: validatedData.postcode,
        floor: validatedData.floor,
        flat: validatedData.flat,
        lift: validatedData.lift,
        notes: validatedData.notes,
        isDefault: validatedData.isDefault ?? false,
        User: { connect: { id: customerId } },
      },
    });

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating address:', error);
    return NextResponse.json(
      { error: 'Failed to create address' },
      { status: 500 }
    );
  }
}

// PUT /api/portal/addresses - Update an address
export async function PUT(request: NextRequest) {
  const session = await auth();
  try {
    assertRole(session!, ['customer']);
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === 'UNAUTHORIZED' ? 401 : 403;
    return new Response(msg, { status });
  }

  const userId = session.user.id;

  try {
    const body = await request.json();
    const validatedData = updateAddressSchema.parse(body);
    const customerId = userId;

    // Verify the address belongs to the customer
    const existingAddress = await prisma.address.findFirst({
      where: { id: validatedData.id, userId: customerId },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // If this is being set as default, unset other defaults
    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: customerId,
          isDefault: true,
          id: { not: validatedData.id },
        },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id: validatedData.id },
      data: validatedData,
    });

    return NextResponse.json({ address });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating address:', error);
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    );
  }
}

// DELETE /api/portal/addresses - Delete an address
export async function DELETE(request: NextRequest) {
  const session = await auth();
  try {
    assertRole(session!, ['customer']);
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === 'UNAUTHORIZED' ? 401 : 403;
    return new Response(msg, { status });
  }

  const userId = session.user.id;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const customerId = userId;

    if (!id) {
      return NextResponse.json(
        { error: 'Address ID is required' },
        { status: 400 }
      );
    }

    // Verify the address belongs to the customer
    const existingAddress = await prisma.address.findFirst({
      where: { id, userId: customerId },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    await prisma.address.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    );
  }
}
