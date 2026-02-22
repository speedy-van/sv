'use client';

import React from 'react';
import Header from '@/components/site/Header';

/**
 * Client-only wrapper to render both desktop and mobile headers
 * safely inside Server Components.
 */
export default function ClientHeaders() {
  return <Header />;
}

