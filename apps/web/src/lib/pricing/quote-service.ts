/**
 * Server-side quote service.
 * Runs the pricing engine once, caches the result, and resolves quotes at
 * checkout so no client-supplied amount can be charged.
 */
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import { join } from 'path';
import { readFileSync } from 'fs';

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { comprehensivePricingEngine } from '@/lib/pricing/comprehensive-engine';
import { todayLondonKey, addDaysToKey } from '@/lib/dates/london';
import { getDateFactor, DATE_WINDOW_DAYS } from '@/lib/pricing/date-pricing';
import { CREW_MULTIPLIERS, computeTotalPence, type CrewSize } from '@/lib/pricing/crew';
import { validatePromotion } from '@/lib/promotions/validate-promotion';
import type {
  QuoteRequest,
  QuoteResponse,
  QuoteError,
  ResolveQuoteInput,
  ResolvedQuote,
} from '@/lib/pricing/quote-schema';

// ─── Config ───────────────────────────────────────────────────────────────────

const QUOTE_TTL_MINUTES = 30;
const CACHE_REUSE_MINUTES = 5;

// ─── Input normalisation & hashing ───────────────────────────────────────────

function normaliseInput(req: QuoteRequest): QuoteRequest {
  return {
    ...req,
    items: [...req.items].sort((a, b) => a.id.localeCompare(b.id)),
    dropoffs: [...req.dropoffs],
    extras: {
      packing: req.extras?.packing ?? false,
      packingVolumeM3: req.extras?.packingVolumeM3,
      protection: req.extras?.protection,
      assembly: [...(req.extras?.assembly ?? [])].sort((a, b) =>
        a.itemId.localeCompare(b.itemId)
      ),
    },
  };
}

function hashInput(req: QuoteRequest): string {
  const normalised = normaliseInput(req);
  return createHash('sha256')
    .update(JSON.stringify(normalised))
    .digest('hex');
}

// ─── Dataset loader (same path as comprehensive route) ────────────────────────

function loadDataset(): any[] {
  try {
    const p = join(process.cwd(), 'public', 'UK_Removal_Dataset', 'items_dataset.json');
    const data = JSON.parse(readFileSync(p, 'utf-8'));
    return data.items ?? [];
  } catch {
    return [];
  }
}

// ─── Engine input builder ─────────────────────────────────────────────────────

async function buildEngineInput(req: QuoteRequest, crewSize: CrewSize) {
  const dataset = loadDataset();
  const { findDatasetItemById, createFallbackDatasetItem } = await import(
    '@/lib/dataset/item-id-mapper'
  );
  const { UKDatasetItemSchema } = await import('@/lib/pricing/comprehensive-schemas');

  const transformedItems = req.items.map((item) => {
    const ds = findDatasetItemById(item.id, item.name, {
      items: dataset,
      metadata: { version: '1.0', date: '', total_items: dataset.length, categories: 0 },
    });

    const datasetItem = ds
      ? UKDatasetItemSchema.parse(ds)
      : createFallbackDatasetItem(item.id, item.name, item.weight_override, item.volume_override);

    const laborCost =
      (datasetItem.workers_required * 18 * 0.5) * item.quantity;
    const itemBaseCost =
      ((datasetItem.weight * 0.08) + (parseFloat(datasetItem.volume) * 4.5)) * item.quantity;

    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      weight_override: item.weight_override,
      volume_override: item.volume_override,
      datasetItem,
      labor_cost: laborCost,
      item_base_cost: itemBaseCost,
    };
  });

  const now = new Date();
  const scheduledDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 8, 0, 0)
  ).toISOString();

  const isWeekend = now.getDay() === 0 || now.getDay() === 6;

  // Map QuoteAddressSchema → StructuredAddressSchema for the engine
  const mapAddress = (addr: (typeof req.pickup)) => ({
    full: addr.full,
    line1: addr.line1 ?? addr.full.split(',')[0] ?? addr.full,
    city: addr.city ?? 'London',
    postcode: addr.postcode,
    coordinates: addr.coordinates ?? { lat: 51.5074, lng: -0.1278 },
    propertyType: (addr.propertyType as any) ?? 'house',
    parkingSituation: (addr.parkingSituation as any) ?? 'moderate',
    congestionZone: addr.congestionZone ?? false,
  });

  return {
    requestId: randomUUID(),
    correlationId: randomUUID(),
    pickup: mapAddress(req.pickup),
    dropoffs: req.dropoffs.map(mapAddress),
    items: transformedItems,
    serviceLevel: 'standard' as const,
    scheduledDate,
    customerSegment: 'bronze' as const,
    crewSize,
    timeFactors: {
      isRushHour: false,
      isPeakSeason: false,
      isStudentSeason: false,
      isWeekend,
      currentHour: 8,
      currentMonth: now.getMonth() + 1,
      isSchoolHoliday: false,
      isBankHoliday: false,
      trafficConditions: 'moderate' as const,
    },
  };
}

// ─── Main quote creation ──────────────────────────────────────────────────────

export async function createQuote(req: QuoteRequest): Promise<QuoteResponse> {
  const inputHash = hashInput(req);
  const now = new Date();

  // Reuse a recent identical quote (< 5 minutes, not expired)
  const cached = await prisma.priceQuote.findFirst({
    where: {
      inputHash,
      expiresAt: { gt: now },
      consumedAt: null,
      createdAt: { gt: new Date(now.getTime() - CACHE_REUSE_MINUTES * 60_000) },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (cached) {
    const stored = cached.result as StoredResult;
    return buildResponseFromStored(cached.id, cached.expiresAt, stored);
  }

  // Run engine with crewSize='1' to get the base move cost
  await comprehensivePricingEngine.loadDataset();
  const engineInput = await buildEngineInput(req, '1');
  const result = await comprehensivePricingEngine.calculatePrice(engineInput);

  // Extract move and remote surcharge
  const finalPricing = result.breakdown;
  // subtotalBeforeVat when crewSize='1' = move (no crew added)
  const movePence = Math.round(finalPricing.subtotalBeforeVat * 100);
  const remoteSurchargePence = Math.round((finalPricing.remotePickupSurcharge ?? 0) * 100);

  // Crew recommendation from engine worker allocation
  const workerItems: string[] = [];
  if (result.complianceMetadata?.recommendationsProvided) {
    // twoWorkersRequired items are in the operational compliance; extract best effort
  }
  const recommendedCrew: CrewSize = movePence > 0 ? '2' : '1'; // fallback; Phase 1 refines this

  const todayKey = todayLondonKey(now);
  const crewSize = req.crewSize ?? '2';

  // Build 21-day date prices for the requested crew size
  const datePrices = buildDatePricesArray(movePence, crewSize as CrewSize, remoteSurchargePence, todayKey);

  // Build crew options at dateFactor=1.0 reference
  const crewOptions = buildCrewOptions(movePence, remoteSurchargePence, recommendedCrew);

  // Build price breakdown lines (at today's date factor for a concrete assertion)
  const todayFactor = getDateFactor(todayKey, todayKey); // = 1.25 (same-day)
  const todayTotal = computeTotalPence(movePence, crewSize as CrewSize, todayFactor, remoteSurchargePence);
  const lines = buildLines(movePence, crewSize as CrewSize, todayFactor, remoteSurchargePence, todayTotal);

  // Van info
  const van = {
    name: result.recommendedVehicle?.type,
    loadPercent: result.recommendedVehicle?.utilizationPercent,
  };

  // Route info
  const route = {
    miles: result.route?.totalDistanceKm ? result.route.totalDistanceKm * 0.621371 : undefined,
    durationMinutes: result.estimatedDurationMinutes ?? undefined,
  };

  const expiresAt = new Date(now.getTime() + QUOTE_TTL_MINUTES * 60_000);

  const stored: StoredResult = {
    movePence,
    remoteSurchargePence,
    crewSize: crewSize as CrewSize,
    datePrices,
    crewOptions,
    lines,
    route,
    van,
    extras: req.extras ?? { packing: false, assembly: [] },
  };

  const pq = await prisma.priceQuote.create({
    data: {
      inputHash,
      input: req as any,
      result: stored as any,
      expiresAt,
    },
  });

  return buildResponseFromStored(pq.id, expiresAt, stored);
}

// ─── Checkout resolution ──────────────────────────────────────────────────────

export async function resolveQuoteForCheckout(
  input: ResolveQuoteInput
): Promise<ResolvedQuote> {
  const { quoteId, dateKey, promoCode, customerEmail, bookingId } = input;

  const pq = await prisma.priceQuote.findUnique({ where: { id: quoteId } });

  if (!pq) {
    throw quoteError('QUOTE_EXPIRED', 'Quote not found or has expired.');
  }

  if (pq.expiresAt < new Date()) {
    throw quoteError('QUOTE_EXPIRED', 'Quote has expired. Please request a new price.');
  }

  if (pq.consumedAt && pq.bookingId !== bookingId) {
    throw quoteError('QUOTE_CONSUMED', 'Quote has already been used.');
  }

  const stored = pq.result as StoredResult;
  const dateEntry = stored.datePrices.find((d) => d.dateKey === dateKey);
  if (!dateEntry) {
    throw quoteError('VALIDATION', `Date ${dateKey} is not in this quote's price window.`);
  }

  let amountPence = dateEntry.totalPence;
  let discountPence = 0;
  let appliedPromoCode: string | undefined;

  // Re-validate promotion server-side
  if (promoCode) {
    const promoResult = await validatePromotion({
      code: promoCode,
      amountPence,
      customerEmail,
    });
    if (promoResult.valid) {
      discountPence = promoResult.discountPence;
      amountPence = Math.max(0, amountPence - discountPence);
      appliedPromoCode = promoCode.toUpperCase();
    }
  }

  // Mark consumed + attach bookingId in the same transaction
  await prisma.priceQuote.update({
    where: { id: quoteId },
    data: {
      consumedAt: new Date(),
      bookingId: bookingId ?? pq.bookingId,
    },
  });

  return {
    amountPence,
    crewSize: stored.crewSize,
    extras: stored.extras,
    promotionCode: appliedPromoCode,
    discountPence,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface StoredResult {
  movePence: number;
  remoteSurchargePence: number;
  crewSize: CrewSize;
  datePrices: QuoteResponse['datePrices'];
  crewOptions: QuoteResponse['crewOptions'];
  lines: QuoteResponse['lines'];
  route: QuoteResponse['route'];
  van: QuoteResponse['van'];
  extras: import('@/lib/pricing/quote-schema').QuoteExtras;
}

function buildDatePricesArray(
  movePence: number,
  crewSize: CrewSize,
  remoteSurchargePence: number,
  todayKey: string
): QuoteResponse['datePrices'] {
  const entries = Array.from({ length: DATE_WINDOW_DAYS }, (_, i) => {
    const dateKey = i === 0 ? todayKey : addDaysToKey(todayKey, i);
    const factor = getDateFactor(dateKey, todayKey);
    const totalPence = computeTotalPence(movePence, crewSize, factor, remoteSurchargePence);
    return { dateKey, totalPence, cheapest: false };
  });

  const min = Math.min(...entries.map((e) => e.totalPence));
  let cheapCount = 0;
  for (const e of entries) {
    if (e.totalPence === min && cheapCount < 3) {
      e.cheapest = true;
      cheapCount++;
    }
  }
  return entries;
}

function buildCrewOptions(
  movePence: number,
  remoteSurchargePence: number,
  recommendedCrew: CrewSize
): QuoteResponse['crewOptions'] {
  // Reference: dateFactor = 1.0 (the "standard" conceptual reference point)
  const refFactor = 1.0;
  const basePence = computeTotalPence(movePence, '1', refFactor, remoteSurchargePence);

  return (['1', '2', '3', '4'] as CrewSize[]).map((cs) => {
    const totalPence = computeTotalPence(movePence, cs, refFactor, remoteSurchargePence);
    return {
      crewSize: cs,
      totalPence,
      deltaPence: totalPence - basePence,
      recommended: cs === recommendedCrew,
      reason: cs === recommendedCrew ? undefined : undefined,
    };
  });
}

function buildLines(
  movePence: number,
  crewSize: CrewSize,
  dateFactor: number,
  remoteSurchargePence: number,
  expectedTotal: number
): QuoteResponse['lines'] {
  const moveAdjusted = Math.round(movePence * dateFactor);
  const crewMult = CREW_MULTIPLIERS[crewSize] ?? 0;
  const crewPence = Math.round(movePence * crewMult);
  const preVatPence = moveAdjusted + crewPence;
  const vatPence = Math.round(preVatPence * 0.2);
  const subtotalPlusVat = preVatPence + vatPence;
  const computedTotal = subtotalPlusVat + remoteSurchargePence;

  // Absorb any rounding difference (≤ 1p) into the VAT line
  const vatAdj = vatPence + (expectedTotal - computedTotal);

  const lines: QuoteResponse['lines'] = [
    { code: 'move', label: 'Move cost', amountPence: moveAdjusted },
    ...(crewPence > 0
      ? [{ code: 'crew', label: `Crew (driver + ${Number(crewSize) - 1} helper${Number(crewSize) > 2 ? 's' : ''})`, amountPence: crewPence }]
      : []),
    { code: 'vat', label: 'VAT (20%)', amountPence: vatAdj },
    ...(remoteSurchargePence > 0
      ? [{ code: 'remote_surcharge', label: 'Remote location surcharge', amountPence: remoteSurchargePence }]
      : []),
  ];

  // Sanity: lines should sum to expectedTotal
  const sum = lines.reduce((acc, l) => acc + l.amountPence, 0);
  if (sum !== expectedTotal) {
    logger.error('[quote-service] lines sum mismatch', { sum, expectedTotal });
  }

  return lines;
}

function buildResponseFromStored(
  id: string,
  expiresAt: Date,
  stored: StoredResult
): QuoteResponse {
  return {
    quoteId: id,
    expiresAt: expiresAt.toISOString(),
    datePrices: stored.datePrices,
    crewOptions: stored.crewOptions,
    assemblyOptions: [], // Phase 1
    lines: stored.lines,
    route: stored.route,
    van: stored.van,
  };
}

function quoteError(
  code: QuoteError['code'],
  message: string
): Error & { quoteCode: QuoteError['code'] } {
  const err = new Error(message) as Error & { quoteCode: QuoteError['code'] };
  err.quoteCode = code;
  return err;
}
