/**
 * B2B Quote Service
 * 
 * Handles B2B quote operations including:
 * - Quote creation with company-specific pricing
 * - Quote acceptance and conversion to booking
 * - Quote expiry management
 */

import { prisma } from '@/lib/prisma';
import { CompanyQuoteStatus, Prisma } from '@prisma/client';
import { companyAuditService } from './audit.service';
import { companyPricingService } from './pricing.service';
import { orderLimitService } from './order-limit.service';
import crypto from 'crypto';

// Types
export interface CreateQuoteInput {
  companyId: string;
  
  // Pickup
  pickupAddressLine1: string;
  pickupAddressLine2?: string;
  pickupCity: string;
  pickupPostcode: string;
  pickupLat?: number;
  pickupLng?: number;
  pickupNotes?: string;
  
  // Dropoff
  dropoffAddressLine1: string;
  dropoffAddressLine2?: string;
  dropoffCity: string;
  dropoffPostcode: string;
  dropoffLat?: number;
  dropoffLng?: number;
  dropoffNotes?: string;
  
  // Service details
  scheduledDate?: Date;
  serviceType?: string;
  vehicleType?: string;
  crewSize?: number;
  items?: any[];
  specialRequirements?: string;
  
  // Validity
  validDays?: number;
  
  createdBy: string;
}

export interface QuoteListFilters {
  companyId?: string;
  status?: CompanyQuoteStatus;
  search?: string;
  page?: number;
  limit?: number;
}

// Generate unique reference
function generateQuoteReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `QT-${timestamp}-${random}`;
}

// Service Implementation
export const companyQuoteService = {
  /**
   * Create a new B2B quote
   */
  async create(input: CreateQuoteInput) {
    // Calculate pricing using company-specific rules
    const pricing = await companyPricingService.calculatePrice({
      companyId: input.companyId,
      pickupPostcode: input.pickupPostcode,
      dropoffPostcode: input.dropoffPostcode,
      pickupLat: input.pickupLat,
      pickupLng: input.pickupLng,
      dropoffLat: input.dropoffLat,
      dropoffLng: input.dropoffLng,
      items: input.items || [],
      serviceType: input.serviceType,
      vehicleType: input.vehicleType,
      crewSize: input.crewSize,
      scheduledDate: input.scheduledDate,
    });

    // Set validity period
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (input.validDays || 7));

    const quote = await prisma.companyQuote.create({
      data: {
        companyId: input.companyId,
        reference: generateQuoteReference(),
        status: CompanyQuoteStatus.DRAFT,
        
        // Pickup
        pickupAddressLine1: input.pickupAddressLine1,
        pickupAddressLine2: input.pickupAddressLine2,
        pickupCity: input.pickupCity,
        pickupPostcode: input.pickupPostcode,
        pickupLat: input.pickupLat,
        pickupLng: input.pickupLng,
        pickupNotes: input.pickupNotes,
        
        // Dropoff
        dropoffAddressLine1: input.dropoffAddressLine1,
        dropoffAddressLine2: input.dropoffAddressLine2,
        dropoffCity: input.dropoffCity,
        dropoffPostcode: input.dropoffPostcode,
        dropoffLat: input.dropoffLat,
        dropoffLng: input.dropoffLng,
        dropoffNotes: input.dropoffNotes,
        
        // Pricing
        distanceMiles: pricing.distanceMiles,
        estimatedDurationMins: pricing.estimatedDurationMins,
        subtotalGBP: pricing.subtotalGBP,
        vatGBP: pricing.vatGBP,
        totalGBP: pricing.totalGBP,
        discountGBP: pricing.discountGBP || 0,
        discountReason: pricing.discountReason,
        pricingRuleId: pricing.appliedRuleId,
        priceBreakdown: pricing.breakdown,
        
        // Service
        items: input.items,
        specialRequirements: input.specialRequirements,
        scheduledDate: input.scheduledDate,
        serviceType: input.serviceType,
        vehicleType: input.vehicleType,
        crewSize: input.crewSize || 2,
        
        validUntil,
        createdBy: input.createdBy,
      },
    });

    await companyAuditService.log({
      companyId: input.companyId,
      actorId: input.createdBy,
      actorType: 'user',
      action: 'QUOTE_CREATED',
      targetType: 'quote',
      targetId: quote.id,
      metadata: {
        reference: quote.reference,
        totalGBP: quote.totalGBP,
      },
    });

    return quote;
  },

  /**
   * Get quote by ID
   */
  async getById(id: string) {
    return prisma.companyQuote.findUnique({
      where: { id },
      include: {
        Company: {
          select: {
            id: true,
            name: true,
            legalName: true,
          },
        },
      },
    });
  },

  /**
   * Get quote by reference
   */
  async getByReference(reference: string) {
    return prisma.companyQuote.findUnique({
      where: { reference },
      include: {
        Company: {
          select: {
            id: true,
            name: true,
            legalName: true,
          },
        },
      },
    });
  },

  /**
   * List quotes with filtering
   */
  async list(filters: QuoteListFilters = {}) {
    const { companyId, status, search, page = 1, limit = 20 } = filters;

    const where: Prisma.CompanyQuoteWhereInput = {};

    if (companyId) where.companyId = companyId;
    if (status) where.status = status;
    
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { pickupPostcode: { contains: search, mode: 'insensitive' } },
        { dropoffPostcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [quotes, total] = await Promise.all([
      prisma.companyQuote.findMany({
        where,
        include: {
          Company: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.companyQuote.count({ where }),
    ]);

    return {
      quotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Send quote to client
   */
  async send(id: string, actorId: string) {
    const quote = await prisma.companyQuote.update({
      where: { id },
      data: { status: CompanyQuoteStatus.SENT },
    });

    await companyAuditService.log({
      companyId: quote.companyId,
      actorId,
      actorType: 'user',
      action: 'QUOTE_SENT',
      targetType: 'quote',
      targetId: id,
    });

    // TODO: Send email notification

    return quote;
  },

  /**
   * Accept a quote
   */
  async accept(id: string, actorId: string) {
    const quote = await prisma.companyQuote.findUnique({
      where: { id },
    });

    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.status !== CompanyQuoteStatus.SENT && quote.status !== CompanyQuoteStatus.VIEWED) {
      throw new Error(`Cannot accept quote with status: ${quote.status}`);
    }

    if (new Date() > quote.validUntil) {
      await prisma.companyQuote.update({
        where: { id },
        data: { status: CompanyQuoteStatus.EXPIRED },
      });
      throw new Error('Quote has expired');
    }

    const updatedQuote = await prisma.companyQuote.update({
      where: { id },
      data: {
        status: CompanyQuoteStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
    });

    await companyAuditService.log({
      companyId: quote.companyId,
      actorId,
      actorType: 'user',
      action: 'QUOTE_ACCEPTED',
      targetType: 'quote',
      targetId: id,
    });

    return updatedQuote;
  },

  /**
   * Reject a quote
   */
  async reject(id: string, reason: string, actorId: string) {
    const quote = await prisma.companyQuote.update({
      where: { id },
      data: {
        status: CompanyQuoteStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedReason: reason,
      },
    });

    await companyAuditService.log({
      companyId: quote.companyId,
      actorId,
      actorType: 'user',
      action: 'QUOTE_REJECTED',
      targetType: 'quote',
      targetId: id,
      metadata: { reason },
    });

    return quote;
  },

  /**
   * Convert accepted quote to booking
   */
  /**
   * Convert accepted quote to booking
   * CRITICAL: Enforces order limits atomically within transaction
   */
  async convertToBooking(id: string, actorId: string, additionalData?: {
    poNumber?: string;
    costCenter?: string;
    projectCode?: string;
    notes?: string;
  }) {
    const quote = await prisma.companyQuote.findUnique({
      where: { id },
      include: { Company: true },
    });

    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.status !== CompanyQuoteStatus.ACCEPTED) {
      throw new Error('Quote must be accepted before converting to booking');
    }

    // Create booking within transaction WITH ATOMIC LIMIT CHECK
    const result = await prisma.$transaction(async (tx) => {
      // Generate booking reference
      const reference = `SV-B2B-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const bookingId = crypto.randomUUID();

      // CRITICAL: Atomic limit check and increment
      const { monthKey, sequenceNumber } = await orderLimitService.checkAndIncrementWithinTransaction(
        quote.companyId,
        bookingId,
        tx
      );

      // Create addresses
      const pickupAddressId = crypto.randomUUID();
      const dropoffAddressId = crypto.randomUUID();

      await tx.bookingAddress.create({
        data: {
          id: pickupAddressId,
          label: [quote.pickupAddressLine1, quote.pickupCity, quote.pickupPostcode].filter(Boolean).join(', '),
          postcode: quote.pickupPostcode,
          lat: quote.pickupLat,
          lng: quote.pickupLng,
        },
      });

      await tx.bookingAddress.create({
        data: {
          id: dropoffAddressId,
          label: [quote.dropoffAddressLine1, quote.dropoffCity, quote.dropoffPostcode].filter(Boolean).join(', '),
          postcode: quote.dropoffPostcode,
          lat: quote.dropoffLat,
          lng: quote.dropoffLng,
        },
      });

      // Create booking
      const booking = await tx.booking.create({
        data: {
          id: bookingId,
          reference,
          pickupAddressId,
          dropoffAddressId,
          pickupLat: quote.pickupLat,
          pickupLng: quote.pickupLng,
          dropoffLat: quote.dropoffLat,
          dropoffLng: quote.dropoffLng,
          customerName: quote.Company.name,
          customerEmail: quote.Company.email || '',
          customerPhone: quote.Company.phone || '',
          scheduledAt: quote.scheduledDate,
          status: 'CONFIRMED',
          totalGBP: quote.totalGBP,
          serviceType: quote.serviceType || 'standard',
          vehicleType: quote.vehicleType || 'MEDIUM_VAN',
          crewSize: quote.crewSize || 2,
        },
      });

      // Create CompanyBooking link
      await tx.companyBooking.create({
        data: {
          companyId: quote.companyId,
          bookingId: booking.id,
          poNumber: additionalData?.poNumber,
          costCenter: additionalData?.costCenter,
          projectCode: additionalData?.projectCode,
          notes: additionalData?.notes,
          orderSequenceNumber: sequenceNumber,
          countedTowardsLimit: true,
          monthKey,
        },
      });

      // Update quote status
      await tx.companyQuote.update({
        where: { id },
        data: {
          status: CompanyQuoteStatus.CONVERTED,
          convertedToBookingId: booking.id,
        },
      });

      // Log conversion
      await tx.companyAuditLog.create({
        data: {
          companyId: quote.companyId,
          action: 'QUOTE_CONVERTED',
          actorId,
          actorType: 'USER',
          targetType: 'quote',
          targetId: id,
          metadata: {
            bookingId: booking.id,
            bookingReference: reference,
            ...additionalData,
          },
        },
      });

      return {
        booking,
        quote: await tx.companyQuote.findUnique({ where: { id } }),
      };
    });

    return result;
  },

  /**
   * Mark quote as viewed
   */
  async markViewed(id: string) {
    const quote = await prisma.companyQuote.findUnique({
      where: { id },
    });

    if (quote && quote.status === CompanyQuoteStatus.SENT) {
      return prisma.companyQuote.update({
        where: { id },
        data: { status: CompanyQuoteStatus.VIEWED },
      });
    }

    return quote;
  },

  /**
   * Check and expire old quotes
   */
  async expireOldQuotes() {
    const result = await prisma.companyQuote.updateMany({
      where: {
        status: { in: [CompanyQuoteStatus.DRAFT, CompanyQuoteStatus.SENT, CompanyQuoteStatus.VIEWED] },
        validUntil: { lt: new Date() },
      },
      data: { status: CompanyQuoteStatus.EXPIRED },
    });

    return result.count;
  },

  /**
   * Duplicate a quote (for requoting)
   */
  async duplicate(id: string, createdBy: string) {
    const original = await prisma.companyQuote.findUnique({
      where: { id },
    });

    if (!original) {
      throw new Error('Quote not found');
    }

    // Create new quote with same details
    return this.create({
      companyId: original.companyId,
      pickupAddressLine1: original.pickupAddressLine1,
      pickupAddressLine2: original.pickupAddressLine2 || undefined,
      pickupCity: original.pickupCity,
      pickupPostcode: original.pickupPostcode,
      pickupLat: original.pickupLat || undefined,
      pickupLng: original.pickupLng || undefined,
      pickupNotes: original.pickupNotes || undefined,
      dropoffAddressLine1: original.dropoffAddressLine1,
      dropoffAddressLine2: original.dropoffAddressLine2 || undefined,
      dropoffCity: original.dropoffCity,
      dropoffPostcode: original.dropoffPostcode,
      dropoffLat: original.dropoffLat || undefined,
      dropoffLng: original.dropoffLng || undefined,
      dropoffNotes: original.dropoffNotes || undefined,
      scheduledDate: original.scheduledDate || undefined,
      serviceType: original.serviceType || undefined,
      vehicleType: original.vehicleType || undefined,
      crewSize: original.crewSize,
      items: original.items as any[] || undefined,
      specialRequirements: original.specialRequirements || undefined,
      createdBy,
    });
  },
};

export default companyQuoteService;
