'use client';
import React from 'react';
import { AdminShell } from '@/components/admin';
import AdminManager from '@/components/admin/AdminManager';

export default function AdminUsersPage() {
  return (
    <AdminShell
      title="Admin Users"
      subtitle="Manage admin users, roles, and permissions"
    >
      <AdminManager />
    </AdminShell>
  );
}
