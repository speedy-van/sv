import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validatePromotion } from '@/lib/promotions/validate-promotion';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const validatePromotionSchema = z.object({
  code: z.string().min(1, 'Promotion code is required'),
  amount: z
    .number()
    .positive()
    .or(
      z.string().transform((val) => {
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0) throw new Error('Amount must be a positive number');
        return num;
      })
    ),
  customerEmail: z.string().email().optional().or(z.literal('')),
  pickupPostcode: z.string().optional().or(z.literal('')),
  serviceType: z.string().optional().or(z.literal('')),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = validatePromotionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const { code, amount, customerEmail, pickupPostcode, serviceType } = parsed.data;
    const amountPence = Math.round(amount * 100);

    const result = await validatePromotion({
      code,
      amountPence,
      customerEmail: customerEmail || undefined,
      pickupPostcode: pickupPostcode || undefined,
      serviceType: serviceType || undefined,
    });

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error }, { status: 200 });
    }

    const discountAmount = result.discountPence / 100;
    const finalAmount = Math.max(0, amount - discountAmount);

    logger.info('[promotions/validate] code applied', {
      code: result.code,
      discountPence: result.discountPence,
    });

    return NextResponse.json({
      valid: true,
      promotion: {
        id: result.promotionId,
        code: result.code,
        name: result.name,
        description: result.description ?? null,
        discountAmount,
        originalAmount: amount,
        finalAmount,
      },
    });
  } catch (error) {
    logger.error('[promotions/validate] unexpected error', error);
    return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 });
  }
}
