export type JobsMarketOfferStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export type JobsMarketOffer = {
  driverId: string;
  driverName?: string;
  offerPence: number;
  currency: 'gbp';
  createdAt: string;
  updatedAt: string;
  status: JobsMarketOfferStatus;
};

export type JobsMarketApprovedOffer = {
  driverId: string;
  offerPence: number;
  approvedAt: string;
  approvedBy: string;
};

export type JobsMarketMeta = {
  driverPricePence: number;
  driverPriceCurrency: 'gbp';
  isPublished: boolean;
  publishedAt?: string;
  publishedBy?: string;
  offerWindowMinutes?: number;
  offers?: JobsMarketOffer[] | null;
  approvedOffer?: JobsMarketApprovedOffer | null;
  assignmentPendingCapture?: boolean;
};

type JobsMarketContainer = {
  jobsMarket?: Partial<JobsMarketMeta>;
} & Record<string, unknown>;

const DEFAULT_OFFER_WINDOW_MINUTES = 5;

function normalizeOffer(input: unknown): JobsMarketOffer | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const offer = input as JobsMarketOffer;

  if (typeof offer.driverId !== 'string' || offer.driverId.length === 0) {
    return null;
  }

  if (!Number.isFinite(offer.offerPence) || offer.offerPence <= 0) {
    return null;
  }

  if (offer.currency !== 'gbp') {
    return null;
  }

  if (typeof offer.createdAt !== 'string' || typeof offer.updatedAt !== 'string') {
    return null;
  }

  const status = offer.status as JobsMarketOfferStatus | undefined;
  if (!status || !['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'].includes(status)) {
    return null;
  }

  return {
    driverId: offer.driverId,
    driverName: typeof offer.driverName === 'string' ? offer.driverName : undefined,
    offerPence: offer.offerPence,
    currency: 'gbp',
    createdAt: offer.createdAt,
    updatedAt: offer.updatedAt,
    status,
  };
}

function normalizeOffers(input: unknown): JobsMarketOffer[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map(normalizeOffer).filter((offer): offer is JobsMarketOffer => offer !== null);
}

function normalizeApprovedOffer(input: unknown): JobsMarketApprovedOffer | undefined {
  if (!input || typeof input !== 'object') {
    return undefined;
  }

  const approved = input as JobsMarketApprovedOffer;

  if (
    typeof approved.driverId !== 'string' ||
    !Number.isFinite(approved.offerPence) ||
    typeof approved.approvedAt !== 'string' ||
    typeof approved.approvedBy !== 'string'
  ) {
    return undefined;
  }

  return {
    driverId: approved.driverId,
    offerPence: approved.offerPence,
    approvedAt: approved.approvedAt,
    approvedBy: approved.approvedBy,
  };
}

export function getJobsMarketMeta(customerPreferences: unknown): JobsMarketMeta | null {
  if (!customerPreferences || typeof customerPreferences !== 'object') {
    return null;
  }

  const container = customerPreferences as JobsMarketContainer;
  const jobsMarket = container.jobsMarket;

  if (!jobsMarket || typeof jobsMarket !== 'object') {
    return null;
  }

  const driverPricePence = typeof jobsMarket.driverPricePence === 'number'
    ? jobsMarket.driverPricePence
    : 0;
  const driverPriceCurrency = jobsMarket.driverPriceCurrency === 'gbp' ? 'gbp' : null;
  const isPublished = jobsMarket.isPublished === true;
  const publishedAt = typeof jobsMarket.publishedAt === 'string' ? jobsMarket.publishedAt : undefined;
  const publishedBy = typeof jobsMarket.publishedBy === 'string' ? jobsMarket.publishedBy : undefined;
  const offerWindowMinutes = typeof jobsMarket.offerWindowMinutes === 'number'
    ? jobsMarket.offerWindowMinutes
    : DEFAULT_OFFER_WINDOW_MINUTES;
  const offers = normalizeOffers((jobsMarket as Record<string, unknown>).offers);
  const approvedOffer = normalizeApprovedOffer((jobsMarket as Record<string, unknown>).approvedOffer);
  const assignmentPendingCapture = (jobsMarket as Record<string, unknown>).assignmentPendingCapture === true;

  if (!driverPriceCurrency) {
    return null;
  }

  return {
    driverPricePence,
    driverPriceCurrency,
    isPublished,
    publishedAt,
    publishedBy,
    offerWindowMinutes,
    offers,
    approvedOffer,
    assignmentPendingCapture,
  };
}

export function setJobsMarketMeta(customerPreferences: unknown, meta: JobsMarketMeta): Record<string, unknown> {
  const safePreferences: Record<string, unknown> =
    customerPreferences && typeof customerPreferences === 'object'
      ? { ...(customerPreferences as Record<string, unknown>) }
      : {};

  const existingContainer = safePreferences as JobsMarketContainer;
  const existingJobsMarket = existingContainer.jobsMarket && typeof existingContainer.jobsMarket === 'object'
    ? existingContainer.jobsMarket
    : undefined;

  const existingOffers = normalizeOffers((existingJobsMarket as Record<string, unknown> | undefined)?.offers);
  const existingApprovedOffer = normalizeApprovedOffer((existingJobsMarket as Record<string, unknown> | undefined)?.approvedOffer);
  const existingOfferWindowMinutes = typeof (existingJobsMarket as Record<string, unknown> | undefined)?.offerWindowMinutes === 'number'
    ? (existingJobsMarket as Record<string, unknown>).offerWindowMinutes as number
    : DEFAULT_OFFER_WINDOW_MINUTES;
  const existingAssignmentPendingCapture = (existingJobsMarket as Record<string, unknown> | undefined)?.assignmentPendingCapture === true;

  const offers = meta.offers === null ? [] : (meta.offers ?? existingOffers);
  const approvedOffer = meta.approvedOffer === null ? undefined : (meta.approvedOffer ?? existingApprovedOffer);
  const offerWindowMinutes = typeof meta.offerWindowMinutes === 'number'
    ? meta.offerWindowMinutes
    : existingOfferWindowMinutes;
  const assignmentPendingCapture = typeof meta.assignmentPendingCapture === 'boolean'
    ? meta.assignmentPendingCapture
    : existingAssignmentPendingCapture;

  return {
    ...safePreferences,
    jobsMarket: {
      driverPricePence: meta.driverPricePence,
      driverPriceCurrency: meta.driverPriceCurrency,
      isPublished: meta.isPublished,
      publishedAt: meta.publishedAt,
      publishedBy: meta.publishedBy,
      offerWindowMinutes,
      offers,
      approvedOffer,
      assignmentPendingCapture,
    },
  };
}

export function getJobsMarketOfferWindowMinutes(meta: JobsMarketMeta): number {
  const minutes = meta.offerWindowMinutes;
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return DEFAULT_OFFER_WINDOW_MINUTES;
  }
  return minutes;
}

export function getJobsMarketOfferWindowExpiresAt(meta: JobsMarketMeta): Date | null {
  if (!meta.publishedAt) {
    return null;
  }
  const publishedTime = Date.parse(meta.publishedAt);
  if (!Number.isFinite(publishedTime)) {
    return null;
  }
  const minutes = getJobsMarketOfferWindowMinutes(meta);
  return new Date(publishedTime + minutes * 60 * 1000);
}

export function getJobsMarketOfferWindowRemainingSeconds(meta: JobsMarketMeta, now: Date = new Date()): number {
  const expiresAt = getJobsMarketOfferWindowExpiresAt(meta);
  if (!expiresAt) {
    return 0;
  }
  const remainingMs = expiresAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

export function isOfferWindowOpen(
  publishedAt?: string,
  offerWindowMinutes?: number,
  now: Date = new Date()
): boolean {
  if (!publishedAt) {
    return false;
  }
  const publishedTime = Date.parse(publishedAt);
  if (!Number.isFinite(publishedTime)) {
    return false;
  }
  const windowMinutes = Number.isFinite(offerWindowMinutes) && (offerWindowMinutes as number) > 0
    ? (offerWindowMinutes as number)
    : DEFAULT_OFFER_WINDOW_MINUTES;
  const expiresAt = publishedTime + windowMinutes * 60 * 1000;
  return now.getTime() < expiresAt;
}

export function getJobsMarketOfferBounds(basePricePence: number): {
  minOfferPence: number;
  maxOfferPence: number;
  maxIncreasePence: number;
} {
  if (!Number.isFinite(basePricePence) || basePricePence <= 0) {
    return { minOfferPence: 0, maxOfferPence: 0, maxIncreasePence: 0 };
  }
  const maxIncreasePence = Math.min(2000, Math.round(basePricePence * 0.25));
  return {
    minOfferPence: basePricePence,
    maxOfferPence: basePricePence + maxIncreasePence,
    maxIncreasePence,
  };
}

export function getJobsMarketMaxOfferPence(basePricePence: number): number {
  return getJobsMarketOfferBounds(basePricePence).maxOfferPence;
}

export function getJobsMarketDriverOffer(meta: JobsMarketMeta, driverId: string): JobsMarketOffer | null {
  if (!driverId || !meta.offers) {
    return null;
  }
  return meta.offers.find((offer) => offer.driverId === driverId) ?? null;
}

export function withJobsMarketOfferExpiry(meta: JobsMarketMeta, now: Date = new Date()): JobsMarketMeta {
  const remainingSeconds = getJobsMarketOfferWindowRemainingSeconds(meta, now);
  if (remainingSeconds > 0) {
    return meta;
  }

  const offers = meta.offers ?? [];
  const updatedOffers = offers.map((offer) =>
    offer.status === 'PENDING'
      ? { ...offer, status: 'EXPIRED', updatedAt: now.toISOString() }
      : offer
  );

  return {
    ...meta,
    offers: updatedOffers,
  };
}

export function upsertJobsMarketOffer(
  meta: JobsMarketMeta,
  payload: {
    driverId: string;
    driverName?: string;
    offerPence: number;
    currency: 'gbp';
    now?: Date;
  }
): JobsMarketMeta {
  const now = payload.now ?? new Date();
  const offers = meta.offers ? [...meta.offers] : [];
  const existingIndex = offers.findIndex((offer) => offer.driverId === payload.driverId);

  if (existingIndex >= 0) {
    const existing = offers[existingIndex];
    if (existing.status === 'APPROVED') {
      return meta;
    }
    offers[existingIndex] = {
      ...existing,
      driverName: payload.driverName ?? existing.driverName,
      offerPence: payload.offerPence,
      currency: 'gbp',
      updatedAt: now.toISOString(),
      status: 'PENDING',
    };
  } else {
    offers.push({
      driverId: payload.driverId,
      driverName: payload.driverName,
      offerPence: payload.offerPence,
      currency: 'gbp',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      status: 'PENDING',
    });
  }

  return {
    ...meta,
    offers,
  };
}
