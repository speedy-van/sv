/**
 * Admin Bonus Requests Page
 * Shows pending bonus requests with driver performance context
 */

import { Metadata } from 'next';
import BonusRequestsClient from './BonusRequestsClient';

export const metadata: Metadata = {
  title: 'Bonus Requests | Admin Dashboard',
  description: 'Review and approve driver bonus requests',
};

export default function BonusRequestsPage() {
  return <BonusRequestsClient />;
}
