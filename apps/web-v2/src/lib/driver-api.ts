// Typed fetch wrappers for the apps/web driver API.

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || "";
}

async function driverFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...((init?.headers as Record<string, string>) || {}),
    },
  });
  if (!res.ok) {
    const err = await res.text().catch(() => String(res.status));
    throw Object.assign(new Error(err), { status: res.status });
  }
  return res.json() as Promise<T>;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface DriverSession {
  isAuthenticated: boolean;
  user?: { id: string; email: string; name: string; role: string };
  driver?: { id: string; onboardingStatus: string };
}

export interface DriverJob {
  id: string;
  reference: string;
  customer: string;
  customerPhone: string;
  date: string;         // YYYY-MM-DD
  time: string;         // HH:MM
  from: string;
  to: string;
  distance: string;     // "5.0 miles"
  estimatedEarnings: number;
  status: "invited" | "accepted" | "available" | "declined" | "completed" | "cancelled";
  duration: string;     // "2h 30m"
}

export interface DriverJobsResponse {
  driver: { id: string; status: string; onboardingStatus: string };
  assignedJobs: DriverJob[];
  availableJobs: DriverJob[];
  statistics?: {
    todayEarnings: number;
    weekEarnings: number;
    totalJobs: number;
    acceptanceRate: number;
    rating: number;
  };
}

export interface DriverProfile {
  id: string;
  userId: string;
  email: string;
  name: string;
  basePostcode: string;
  vehicleType: string;
  onboardingStatus: string;
  rating: number;
  strikes: number;
  DriverAvailability?: {
    status: string;
    locationConsent: boolean;
    lastSeenAt: string;
  };
  performance?: {
    acceptanceRate: number;
    completionRate: number;
    onTimeRate: number;
    totalJobs: number;
  };
}

export interface DriverEarnings {
  period: string;
  summary: {
    totalEarnings: number;
    totalJobs: number;
    paidOut: number;
    pending: number;
  };
  earnings: Array<{
    id: string;
    reference: string;
    date: string;
    amount: number;
    status: string;
  }>;
}

// ── API calls ───────────────────────────────────────────────────────────────

export function getDriverSession(): Promise<DriverSession> {
  return driverFetch<DriverSession>("/api/driver/session");
}

export function getDriverJobs(): Promise<DriverJobsResponse> {
  return driverFetch<DriverJobsResponse>("/api/driver/jobs");
}

export function getDriverDashboard(): Promise<DriverJobsResponse> {
  return driverFetch<DriverJobsResponse>("/api/driver/dashboard");
}

export function getDriverProfile(): Promise<DriverProfile> {
  return driverFetch<DriverProfile>("/api/driver/profile");
}

export function getDriverEarnings(): Promise<DriverEarnings> {
  return driverFetch<DriverEarnings>("/api/driver/earnings");
}

export function postDriverStatus(status: "online" | "offline"): Promise<unknown> {
  return driverFetch("/api/driver/status", {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

export function postLocation(payload: {
  latitude: number;
  longitude: number;
  accuracy?: number;
}): Promise<unknown> {
  return driverFetch("/api/driver/location", {
    method: "POST",
    body: JSON.stringify({ ...payload, timestamp: new Date().toISOString() }),
  });
}

export function postTrackingPing(payload: {
  bookingId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
}): Promise<unknown> {
  return driverFetch("/api/driver/tracking", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
