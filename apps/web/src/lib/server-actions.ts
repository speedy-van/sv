'use server';

import { authOptions } from './auth';
import { logAudit } from './audit';
import { prisma } from './prisma';
import { getServerSession } from 'next-auth';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role || '')) {
    throw new Error('Insufficient permissions');
  }
  return user;
}

export async function withAudit<T>(
  action: string,
  resourceId: string | undefined,
  fn: () => Promise<T>
): Promise<T> {
  const user = await getCurrentUser();
  
  try {
    const result = await fn();
    
    // Log successful action
    if (user) {
      await logAudit(user.id, action, resourceId, { success: true });
    }
    
    return result;
  } catch (error) {
    // Log failed action
    if (user) {
      await logAudit(user.id, action, resourceId, { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
    
    throw error;
  }
}

export async function validateUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return user;
}

export async function validateOrder(orderId: string) {
  const order = await prisma.booking.findUnique({
    where: { id: orderId }
  });
  
  if (!order) {
    throw new Error('Order not found');
  }
  
  return order;
}

export async function validateDriver(driverId: string) {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId }
  });
  
  if (!driver) {
    throw new Error('Driver not found');
  }
  
  return driver;
}