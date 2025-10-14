import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { assertRole } from '@/lib/guards';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Validation schemas
const contactSchema = z.object({
  label: z.string().min(1, 'Label is required').max(50, 'Label too long'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  phone: z.string().min(1, 'Phone is required').max(20, 'Phone too long'),
  email: z
    .string()
    .email('Invalid email format')
    .max(100, 'Email too long')
    .optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
  isDefault: z.boolean().optional(),
});

const updateContactSchema = contactSchema.partial().extend({
  id: z.string().cuid('Invalid contact ID'),
});

// GET /api/portal/contacts - Get all contacts for the customer
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
    const contacts = await prisma.contact.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

// POST /api/portal/contacts - Create a new contact
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
    const validatedData = contactSchema.parse(body);
    const customerId = userId;

    // If this is being set as default, unset other defaults
    if (validatedData.isDefault) {
      await prisma.contact.updateMany({
        where: { userId: customerId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const contact = await prisma.contact.create({
      data: {
        label: validatedData.label,
        name: validatedData.name,
        phone: validatedData.phone,
        email: validatedData.email,
        notes: validatedData.notes,
        isDefault: validatedData.isDefault ?? false,
        User: { connect: { id: customerId } },
      },
    });

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}

// PUT /api/portal/contacts - Update a contact
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
    const validatedData = updateContactSchema.parse(body);
    const customerId = userId;

    // Verify the contact belongs to the customer
    const existingContact = await prisma.contact.findFirst({
      where: { id: validatedData.id, userId: customerId },
    });

    if (!existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // If this is being set as default, unset other defaults
    if (validatedData.isDefault) {
      await prisma.contact.updateMany({
        where: {
          userId: customerId,
          isDefault: true,
          id: { not: validatedData.id },
        },
        data: { isDefault: false },
      });
    }

    const contact = await prisma.contact.update({
      where: { id: validatedData.id },
      data: validatedData,
    });

    return NextResponse.json({ contact });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}

// DELETE /api/portal/contacts - Delete a contact
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
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    // Verify the contact belongs to the customer
    const existingContact = await prisma.contact.findFirst({
      where: { id, userId: customerId },
    });

    if (!existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    await prisma.contact.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    );
  }
}
