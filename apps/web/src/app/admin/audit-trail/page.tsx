/**
 * Admin Audit Trail Page
 * Shows all admin approvals with before/after states
 */

import { Metadata } from 'next';
import AuditTrailClient from './AuditTrailClient';

export const metadata: Metadata = {
  title: 'Audit Trail | Admin Dashboard',
  description: 'View complete audit trail of all admin approvals and actions',
};

export default function AuditTrailPage() {
  return <AuditTrailClient />;
}
