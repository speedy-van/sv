export const COMPANY_ROLES = [
  'OWNER',
  'ADMIN',
  'FINANCE',
  'DISPATCHER',
  'READONLY',
  'MEMBER',
] as const;
export type CompanyRole = (typeof COMPANY_ROLES)[number];

export const COMPANY_STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED'] as const;
export type CompanyStatus = (typeof COMPANY_STATUSES)[number];

export const COMPANY_INVITATION_STATUSES = ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'] as const;
export type CompanyInvitationStatus = (typeof COMPANY_INVITATION_STATUSES)[number];

