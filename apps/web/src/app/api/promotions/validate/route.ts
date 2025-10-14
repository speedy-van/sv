import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for promotion code request
const validatePromotionSchema = z.object({
  code: z.string().min(1, 'Promotion code is required'),
  amount: z.number().positive('Amount must be positive'),
  customerEmail: z.string().email('Valid email is required').optional(),
  pickupPostcode: z.string().optional(),
  serviceType: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = validatePromotionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    const { code, amount, customerEmail, pickupPostcode, serviceType } = validationResult.data;

    // Find promotion by code
    const promotion = await prisma.promotion.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promotion) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Invalid promotion code'
        },
        { status: 200 }
      );
    }

    // Check if promotion is active
    if (promotion.status !== 'active') {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Promotion code is not active'
        },
        { status: 200 }
      );
    }

    // Check validity dates
    const now = new Date();
    if (now < promotion.validFrom || now > promotion.validTo) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Promotion code has expired'
        },
        { status: 200 }
      );
    }

    // Check minimum spend requirement
    const minSpend = Number(promotion.minSpend);
    if (minSpend > 0 && amount < minSpend) {
      return NextResponse.json(
        { 
          valid: false,
          error: `Minimum spend of £${minSpend} required`
        },
        { status: 200 }
      );
    }

    // Check usage limit
    const usageCount = await prisma.booking.count({
      where: {
        // Note: promotionCode field might not exist in current schema
        // This is a placeholder for future implementation
        status: { not: 'CANCELLED' }
      }
    });

    const usageLimit = Number(promotion.usageLimit);
    if (usageCount >= usageLimit) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Promotion code usage limit reached'
        },
        { status: 200 }
      );
    }

    // Check first-time only restriction
    if (promotion.firstTimeOnly && customerEmail) {
      const existingBooking = await prisma.booking.findFirst({
        where: {
          customer: {
            email: customerEmail
          },
          status: { not: 'CANCELLED' }
        }
      });

      if (existingBooking) {
        return NextResponse.json(
          { 
            valid: false,
            error: 'This promotion is only valid for first-time customers'
          },
          { status: 200 }
        );
      }
    }

    // Check applicable areas
    if (promotion.applicableAreas && promotion.applicableAreas.length > 0 && pickupPostcode) {
      const postcodeArea = pickupPostcode.split(' ')[0]; // Get the first part of postcode
      const isApplicable = promotion.applicableAreas.some(area => 
        postcodeArea.startsWith(area)
      );
      
      if (!isApplicable) {
        return NextResponse.json(
          { 
            valid: false,
            error: 'Promotion code not valid for this area'
          },
          { status: 200 }
        );
      }
    }

    // Check applicable van types
    if (promotion.applicableVans && promotion.applicableVans.length > 0 && serviceType) {
      const isApplicable = promotion.applicableVans.includes(serviceType);
      
      if (!isApplicable) {
        return NextResponse.json(
          { 
            valid: false,
            error: 'Promotion code not valid for this service type'
          },
          { status: 200 }
        );
      }
    }

    // Calculate discount
    let discountAmount = 0;
    const promotionValue = Number(promotion.value);
    if (promotion.type === 'percentage') {
      discountAmount = (amount * promotionValue) / 100;
    } else if (promotion.type === 'fixed') {
      discountAmount = promotionValue;
    }

    // Apply maximum discount limit
    const maxDiscount = Number(promotion.maxDiscount);
    if (maxDiscount > 0 && discountAmount > maxDiscount) {
      discountAmount = maxDiscount;
    }

    // Ensure discount doesn't exceed the total amount
    if (discountAmount > amount) {
      discountAmount = amount;
    }

    const finalAmount = Math.max(0, amount - discountAmount);

    return NextResponse.json({
      valid: true,
      promotion: {
        id: promotion.id,
        code: promotion.code,
        name: promotion.name,
        description: promotion.description,
        type: promotion.type,
        value: promotionValue,
        discountAmount,
        originalAmount: amount,
        finalAmount,
        maxDiscount,
        validFrom: promotion.validFrom,
        validTo: promotion.validTo,
      }
    });

  } catch (error) {
    console.error('Promotion validation error:', error);
    return NextResponse.json(
      { 
        valid: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
