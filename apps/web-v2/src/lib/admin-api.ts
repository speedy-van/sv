// Typed fetch wrappers for the apps/web admin API.

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || "";
}

async function adminFetch<T>(
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

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  adminRole: string | null;
}

export interface AdminMe {
  user: AdminUser;
  isAdmin: boolean;
}

export interface AdminBooking {
  id: string;
  reference: string;
  status: string;
  totalGBP: number;
  scheduledAt: string;
  createdAt: string;
  customer: { id: string; name: string; email: string };
  driver?: { User: { id: string; name: string } };
  pickupAddress: { line1?: string; postcode: string };
  dropoffAddress: { line1?: string; postcode: string };
}

export interface AdminDriver {
  User: { id: string; name: string; email: string; createdAt: string };
  DriverProfile: { phone: string; address: string } | null;
  DriverVehicle: {
    id: string;
    make: string;
    model: string;
    reg: string;
    weightClass: string;
  } | null;
  DriverPerformance: {
    acceptanceRate: number;
    completionRate: number;
    onTimeRate: number;
    averageRating: number;
  } | null;
  status?: string;
}

export interface AdminAnalytics {
  bookingCounts: { status: string; _count: number }[];
  revenue30d: number;
  revenue7d: number;
  revenue24h: number;
  recentBookings: AdminBooking[];
  realDrivers: number;
}

export interface BookingListResponse {
  orders: AdminBooking[];
  count: number;
  pagination: { page: number; limit: number; total: number };
}

export interface DriverListResponse {
  drivers: AdminDriver[];
  total: number;
}

// ── API calls ───────────────────────────────────────────────────────────────

export function getMe(): Promise<AdminMe> {
  return adminFetch<AdminMe>("/api/admin/me");
}

export function getDashboard(): Promise<AdminAnalytics> {
  return adminFetch<AdminAnalytics>("/api/admin/analytics?range=30d");
}

export function getBookings(params?: {
  page?: number;
  status?: string;
  q?: string;
  limit?: number;
}): Promise<BookingListResponse> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.status) qs.set("status", params.status);
  if (params?.q) qs.set("q", params.q);
  qs.set("limit", String(params?.limit ?? 20));
  return adminFetch<BookingListResponse>(`/api/admin/orders?${qs}`);
}

export function getDrivers(params?: {
  page?: number;
  status?: string;
  search?: string;
}): Promise<DriverListResponse> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.status) qs.set("status", params.status);
  if (params?.search) qs.set("search", params.search);
  qs.set("limit", "50");
  return adminFetch<DriverListResponse>(`/api/admin/drivers?${qs}`);
}

export async function patchBookingStatus(id: string, status: string): Promise<void> {
  await adminFetch(`/api/admin/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function dispatchDriver(
  bookingId: string,
  driverId: string,
): Promise<void> {
  await adminFetch("/api/admin/dispatch", {
    method: "POST",
    body: JSON.stringify({ bookingId, driverId }),
  });
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin: string | null;
  isActive: boolean;
  emailVerified: boolean;
  stats: {
    totalBookings: number;
    totalSpent: number;
  };
}

export interface CustomerListResponse {
  customers: AdminCustomer[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export function getCustomers(params?: {
  page?: number;
  search?: string;
}): Promise<CustomerListResponse> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.search) qs.set("search", params.search);
  qs.set("limit", "25");
  return adminFetch<CustomerListResponse>(`/api/admin/customers?${qs}`);
}
