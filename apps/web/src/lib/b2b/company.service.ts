/**
 * B2B Company Service
 * 
 * Handles all company-related operations including:
 * - Company CRUD operations
 * - User management within companies
 * - Credit limit management
 * - Company onboarding workflow
 */

import { prisma } from '@/lib/prisma';
import { Prisma, CompanyStatus, CompanyRole, CompanyInvitationStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { companyAuditService } from './audit.service';

// Types
export interface CreateCompanyInput {
  name: string;
  legalName?: string;
  vatNumber?: string;
  companyNumber?: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingPostcode?: string;
  billingCountry?: string;
  creditLimitGBP?: number;
  paymentTermsDays?: number;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  createdBy: string;
}

export interface UpdateCompanyInput {
  name?: string;
  legalName?: string;
  vatNumber?: string;
  companyNumber?: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingPostcode?: string;
  billingCountry?: string;
  creditLimitGBP?: number;
  paymentTermsDays?: number;
  status?: CompanyStatus;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  notes?: string;
  riskScore?: number;
}

export interface InviteUserInput {
  companyId: string;
  email: string;
  role: CompanyRole;
  invitedBy: string;
}

export interface CompanyListFilters {
  status?: CompanyStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'creditLimitGBP';
  sortOrder?: 'asc' | 'desc';
}

// Service Implementation
export const companyService = {
  /**
   * Create a new company
   */
  async create(input: CreateCompanyInput) {
    const company = await prisma.company.create({
      data: {
        name: input.name,
        legalName: input.legalName,
        vatNumber: input.vatNumber,
        companyNumber: input.companyNumber,
        billingAddressLine1: input.billingAddressLine1,
        billingAddressLine2: input.billingAddressLine2,
        billingCity: input.billingCity,
        billingPostcode: input.billingPostcode,
        billingCountry: input.billingCountry || 'UK',
        creditLimitGBP: input.creditLimitGBP || 0,
        paymentTermsDays: input.paymentTermsDays || 0,
        industry: input.industry,
        website: input.website,
        phone: input.phone,
        email: input.email,
        status: CompanyStatus.PENDING,
        createdBy: input.createdBy,
      },
    });

    // Log audit
    await companyAuditService.log({
      companyId: company.id,
      actorId: input.createdBy,
      actorType: 'admin',
      action: 'COMPANY_CREATED',
      targetType: 'company',
      targetId: company.id,
      after: company,
    });

    return company;
  },

  /**
   * Get company by ID
   */
  async getById(id: string) {
    return prisma.company.findUnique({
      where: { id },
      include: {
        CompanyUser: {
          include: {
            User: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        ApiKey: {
          select: {
            id: true,
            name: true,
            keyPrefix: true,
            status: true,
            scopes: true,
            lastUsedAt: true,
            createdAt: true,
          },
        },
        PricingRule: true,
        _count: {
          select: {
            CompanyBooking: true,
            CompanyInvoice: true,
            CompanyQuote: true,
          },
        },
      },
    });
  },

  /**
   * Get company by VAT number
   */
  async getByVatNumber(vatNumber: string) {
    return prisma.company.findUnique({
      where: { vatNumber },
    });
  },

  /**
   * List companies with filtering and pagination
   */
  async list(filters: CompanyListFilters = {}) {
    const {
      status,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.CompanyWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { legalName: { contains: search, mode: 'insensitive' } },
        { vatNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: {
          _count: {
            select: {
              CompanyUser: true,
              CompanyBooking: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.company.count({ where }),
    ]);

    return {
      companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Update company
   */
  async update(id: string, input: UpdateCompanyInput, actorId: string) {
    const before = await prisma.company.findUnique({ where: { id } });
    
    const company = await prisma.company.update({
      where: { id },
      data: {
        ...input,
        updatedAt: new Date(),
      },
    });

    // Log audit
    await companyAuditService.log({
      companyId: id,
      actorId,
      actorType: 'admin',
      action: 'COMPANY_UPDATED',
      targetType: 'company',
      targetId: id,
      before,
      after: company,
    });

    return company;
  },

  /**
   * Activate a company
   */
  async activate(id: string, actorId: string) {
    return this.update(
      id,
      {
        status: CompanyStatus.ACTIVE,
      },
      actorId
    );
  },

  /**
   * Suspend a company
   */
  async suspend(id: string, reason: string, actorId: string) {
    const company = await prisma.company.update({
      where: { id },
      data: {
        status: CompanyStatus.SUSPENDED,
        suspendedAt: new Date(),
        suspendedReason: reason,
      },
    });

    await companyAuditService.log({
      companyId: id,
      actorId,
      actorType: 'admin',
      action: 'COMPANY_SUSPENDED',
      targetType: 'company',
      targetId: id,
      metadata: { reason },
    });

    return company;
  },

  /**
   * Update credit limit
   */
  async updateCreditLimit(id: string, newLimitGBP: number, actorId: string) {
    const before = await prisma.company.findUnique({
      where: { id },
      select: { creditLimitGBP: true },
    });

    const company = await prisma.company.update({
      where: { id },
      data: { creditLimitGBP: newLimitGBP },
    });

    await companyAuditService.log({
      companyId: id,
      actorId,
      actorType: 'admin',
      action: 'CREDIT_LIMIT_UPDATED',
      targetType: 'company',
      targetId: id,
      before: { creditLimitGBP: before?.creditLimitGBP },
      after: { creditLimitGBP: newLimitGBP },
    });

    return company;
  },

  /**
   * Check if company has available credit
   */
  async hasAvailableCredit(companyId: string, amountGBP: number): Promise<boolean> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        creditLimitGBP: true,
        currentBalanceGBP: true,
        status: true,
      },
    });

    if (!company || company.status !== CompanyStatus.ACTIVE) {
      return false;
    }

    const availableCredit = company.creditLimitGBP - company.currentBalanceGBP;
    return availableCredit >= amountGBP;
  },

  /**
   * Get available credit for a company
   */
  async getAvailableCredit(companyId: string): Promise<number> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        creditLimitGBP: true,
        currentBalanceGBP: true,
      },
    });

    if (!company) return 0;
    return Math.max(0, company.creditLimitGBP - company.currentBalanceGBP);
  },

  /**
   * Add user to company
   */
  async addUser(companyId: string, userId: string, role: CompanyRole, invitedBy?: string) {
    const companyUser = await prisma.companyUser.create({
      data: {
        companyId,
        userId,
        role,
        invitedBy,
        invitedAt: invitedBy ? new Date() : undefined,
        joinedAt: new Date(),
      },
    });

    await companyAuditService.log({
      companyId,
      actorId: invitedBy || userId,
      actorType: 'user',
      action: 'USER_ADDED',
      targetType: 'company_user',
      targetId: companyUser.id,
      after: { userId, role },
    });

    return companyUser;
  },

  /**
   * Update user role in company
   */
  async updateUserRole(companyId: string, userId: string, newRole: CompanyRole, actorId: string) {
    const before = await prisma.companyUser.findUnique({
      where: { companyId_userId: { companyId, userId } },
      select: { role: true },
    });

    const companyUser = await prisma.companyUser.update({
      where: { companyId_userId: { companyId, userId } },
      data: { role: newRole },
    });

    await companyAuditService.log({
      companyId,
      actorId,
      actorType: 'user',
      action: 'USER_ROLE_UPDATED',
      targetType: 'company_user',
      targetId: companyUser.id,
      before: { role: before?.role },
      after: { role: newRole },
    });

    return companyUser;
  },

  /**
   * Remove user from company
   */
  async removeUser(companyId: string, userId: string, actorId: string) {
    const companyUser = await prisma.companyUser.update({
      where: { companyId_userId: { companyId, userId } },
      data: {
        isActive: false,
        disabledAt: new Date(),
        disabledBy: actorId,
      },
    });

    await companyAuditService.log({
      companyId,
      actorId,
      actorType: 'user',
      action: 'USER_REMOVED',
      targetType: 'company_user',
      targetId: companyUser.id,
      metadata: { userId },
    });

    return companyUser;
  },

  /**
   * Create invitation for a user to join company
   */
  async createInvitation(input: InviteUserInput) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invitation = await prisma.companyInvitation.create({
      data: {
        companyId: input.companyId,
        email: input.email,
        role: input.role,
        token,
        invitedBy: input.invitedBy,
        expiresAt,
        status: CompanyInvitationStatus.PENDING,
      },
    });

    await companyAuditService.log({
      companyId: input.companyId,
      actorId: input.invitedBy,
      actorType: 'user',
      action: 'INVITATION_CREATED',
      targetType: 'invitation',
      targetId: invitation.id,
      metadata: { email: input.email, role: input.role },
    });

    return invitation;
  },

  /**
   * Accept invitation
   */
  async acceptInvitation(token: string, userId: string) {
    const invitation = await prisma.companyInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new Error('Invalid invitation token');
    }

    if (invitation.status !== CompanyInvitationStatus.PENDING) {
      throw new Error('Invitation is no longer valid');
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.companyInvitation.update({
        where: { id: invitation.id },
        data: { status: CompanyInvitationStatus.EXPIRED },
      });
      throw new Error('Invitation has expired');
    }

    // Update invitation
    await prisma.companyInvitation.update({
      where: { id: invitation.id },
      data: {
        status: CompanyInvitationStatus.ACCEPTED,
        acceptedAt: new Date(),
        acceptedBy: userId,
      },
    });

    // Add user to company
    const companyUser = await this.addUser(
      invitation.companyId,
      userId,
      invitation.role,
      invitation.invitedBy
    );

    return companyUser;
  },

  /**
   * Get company users
   */
  async getUsers(companyId: string) {
    return prisma.companyUser.findMany({
      where: { companyId, isActive: true },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            lastLogin: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });
  },

  /**
   * Get user's companies
   */
  async getUserCompanies(userId: string) {
    return prisma.companyUser.findMany({
      where: { userId, isActive: true },
      include: {
        Company: {
          select: {
            id: true,
            name: true,
            legalName: true,
            status: true,
            logoUrl: true,
          },
        },
      },
    });
  },

  /**
   * Check if user has role in company
   */
  async hasRole(companyId: string, userId: string, roles: CompanyRole[]): Promise<boolean> {
    const companyUser = await prisma.companyUser.findUnique({
      where: { companyId_userId: { companyId, userId } },
      select: { role: true, isActive: true },
    });

    if (!companyUser || !companyUser.isActive) {
      return false;
    }

    return roles.includes(companyUser.role);
  },

  /**
   * Get company statistics
   */
  async getStatistics(companyId: string) {
    const [
      bookingsCount,
      invoicesTotal,
      quotesCount,
      usersCount,
    ] = await Promise.all([
      prisma.companyBooking.count({ where: { companyId } }),
      prisma.companyInvoice.aggregate({
        where: { companyId },
        _sum: { totalGBP: true },
      }),
      prisma.companyQuote.count({ where: { companyId } }),
      prisma.companyUser.count({ where: { companyId, isActive: true } }),
    ]);

    return {
      bookingsCount,
      totalInvoicedGBP: invoicesTotal._sum.totalGBP || 0,
      quotesCount,
      usersCount,
    };
  },
};

export default companyService;
