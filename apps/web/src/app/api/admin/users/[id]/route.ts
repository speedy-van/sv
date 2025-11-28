import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withApiHandler, requireRole, httpJson } from '@/lib/api/guard';
import { parseJson, parseParams } from '@/lib/validation/helpers';
import { adminUserUpdate, idParam } from '@/lib/validation/schemas';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCustomSession } from '@/lib/custom-auth';

// PUT /api/admin/users/[id] - Update admin user
export const PUT = withApiHandler(
  async (request: NextRequest) => {
  const user = await requireRole(request, 'admin');

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    if (!id) return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });

    const paramValidation = parseParams({ id }, idParam);
    if (!paramValidation.ok) return paramValidation.error;

    const parsed = await parseJson(request, adminUserUpdate);
    if (!parsed.ok) return parsed.error;

    const userId = paramValidation.data.id;
    const { name, email, adminRole, isActive } = parsed.data;

    // Check if user exists and is an admin
    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        role: 'admin',
      },
    });

    if (!existingUser) {
      return httpJson(404, { error: 'Admin user not found' });
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
        },
      });

      if (emailExists) {
        return httpJson(409, { error: 'Email already in use' });
      }
    }

    // Prevent superadmin from being deactivated by non-superadmin
    if (existingUser.adminRole === 'superadmin' && isActive === false) {
      const customSession = await getCustomSession();
      let currentUserId = customSession?.user?.id;
      
      if (!customSession?.user) {
        const session = await getServerSession(authOptions);
        currentUserId = (session?.user as any)?.id;
      }
      
      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          adminRole: true,
        },
      });

      if (currentUser?.adminRole !== 'superadmin') {
        return httpJson(403, {
          error: 'Only superadmin can deactivate superadmin accounts',
        });
      }
    }

    // Build update data object, only including fields that are provided
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (adminRole !== undefined) updateData.adminRole = adminRole;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update admin user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        adminRole: true,
        isActive: true,
        lastLogin: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  }
);

// DELETE /api/admin/users/[id] - Delete admin user
export const DELETE = withApiHandler(
  async (request: NextRequest) => {
  const user = await requireRole(request, 'admin');

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    if (!id) return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });

    const paramValidation = parseParams({ id }, idParam);
    if (!paramValidation.ok) return paramValidation.error;

    const userId = paramValidation.data.id;

    // Check if user exists and is an admin
    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        role: 'admin',
      },
      select: {
        id: true,
        adminRole: true,
      },
    });

    if (!existingUser) {
      return httpJson(404, { error: 'Admin user not found' });
    }

    // Prevent self-deletion
    const customSession = await getCustomSession();
    let currentUserId = customSession?.user?.id;
    
    if (!customSession?.user) {
      const session = await getServerSession(authOptions);
      currentUserId = (session?.user as any)?.id;
    }
    
    if (userId === currentUserId) {
      return httpJson(400, { error: 'Cannot delete your own account' });
    }

    // Prevent deletion of the last superadmin
    if (existingUser.adminRole === 'superadmin') {
      const superadminCount = await prisma.user.count({
        where: {
          role: 'admin',
          adminRole: 'superadmin',
          isActive: true,
        },
      });

      if (superadminCount <= 1) {
        return httpJson(400, {
          error: 'Cannot delete the last superadmin account',
        });
      }
    }

    // Delete related records first to avoid foreign key constraint errors
    // This is necessary because some relations don't have onDelete: Cascade
    await prisma.$transaction(async (tx) => {
      // Delete driver-related records if user is/was a driver
      const driver = await tx.driver.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (driver) {
        // Delete driver-related records
        await tx.driverAvailability.deleteMany({
          where: { driverId: driver.id },
        });
        
        await tx.assignment.deleteMany({
          where: { driverId: driver.id },
        });
        
        await tx.driverEarnings.deleteMany({
          where: { driverId: driver.id },
        });
        
        // Delete the driver profile
        await tx.driver.delete({
          where: { id: driver.id },
        });
      }

      // Delete drops associated with this user (as customer)
      await tx.drop.deleteMany({
        where: { customerId: userId },
      });

      // Delete bookings
      await tx.booking.deleteMany({
        where: { customerId: userId },
      });

      // Delete quotes
      await tx.quote.deleteMany({
        where: { customerId: userId },
      });

      // Delete addresses
      await tx.address.deleteMany({
        where: { userId },
      });

      // Finally delete the user (select only id to avoid P2022 metadata error)
      await tx.user.delete({
        where: { id: userId },
        select: {
          id: true,
        },
      });
    });

    return NextResponse.json({ message: 'Admin user deleted successfully' });
  }
);
