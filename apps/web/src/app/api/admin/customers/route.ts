import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withApiHandler, requireRole, httpJson } from '@/lib/api/guard';
import { parseJson, parseQueryParams } from '@/lib/validation/helpers';
import {
  customerCreate,
  paginationQuery,
  searchQuery,
} from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

export const GET = withApiHandler(async (request: NextRequest) => {
  const user = await requireRole(request, 'admin');

  const queryParams = parseQueryParams(
    request.url,
    paginationQuery.merge(searchQuery)
  );
  if (!queryParams.ok) return queryParams.error;

  const { page, limit, search, role } = queryParams.data;
  const skip = ((page || 1) - 1) * (limit || 10);

  // Build where clause
  const where: any = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Get customers with pagination (simplified version)
  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        lastLogin: true,
        isActive: true,
        emailVerified: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  // Process customer data (simplified version)
  const processedCustomers = customers.map(customer => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    role: customer.role,
    createdAt: customer.createdAt,
    lastLogin: customer.lastLogin,
    isActive: customer.isActive,
    emailVerified: customer.emailVerified,
    stats: {
      totalBookings: 0,
      totalSpent: 0,
      activeTickets: 0,
      addressCount: 0,
      contactCount: 0,
    },
    recentBookings: [],
    recentTickets: [],
    addresses: [],
    contacts: [],
  }));

  return httpJson(200, {
    customers: processedCustomers,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / (limit || 10)),
    },
  });
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const user = await requireRole(request, 'admin');

  const parsed = await parseJson(request, customerCreate);
  if (!parsed.ok) return parsed.error;

  const { name, phone, email } = parsed.data;

  // Check if email already exists
  if (email) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return httpJson(409, { error: 'Email already exists' });
    }
  }

  // Create customer
  const customer = await prisma.user.create({
    data: {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      role: 'customer',
      password: 'temp-password', // Will be reset by customer
      emailVerified: false,
    },
  });

  return httpJson(201, customer);
});
