/**
 * Admin Pending Approvals Page
 * Shows jobs requiring cap approval with real-time updates
 */

import { Metadata } from 'next';
import PendingApprovalsClient from './PendingApprovalsClient';

export const metadata: Metadata = {
  title: 'Pending Approvals | Admin Dashboard',
  description: 'Review and approve driver payments exceeding daily cap',
};

export default function PendingApprovalsPage() {
  return <PendingApprovalsClient />;
}
