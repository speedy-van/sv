/**
 * Staff Attendance Notifications
 * Handles notifications for attendance events
 */

import { prisma } from './prisma';

export async function notifyLateCheckIn(staffId: string, lateMinutes: number) {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { User: true },
    });

    if (!staff) return;

    // Create admin notification
    await prisma.adminNotification.create({
      data: {
        type: 'staff_late_checkin',
        title: 'Staff Late Check-In',
        message: `${staff.User.name || staff.employeeId} checked in ${lateMinutes} minutes late`,
        priority: 'medium',
        data: {
          staffId: staff.id,
          employeeId: staff.employeeId,
          lateMinutes,
        },
      },
    });

    console.log(`Notification: Staff ${staff.employeeId} checked in ${lateMinutes} minutes late`);
  } catch (error) {
    console.error('Error creating late check-in notification:', error);
  }
}

export async function notifyEarlyCheckOut(staffId: string, earlyMinutes: number) {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { User: true },
    });

    if (!staff) return;

    // Create admin notification
    await prisma.adminNotification.create({
      data: {
        type: 'staff_early_checkout',
        title: 'Staff Early Check-Out',
        message: `${staff.User.name || staff.employeeId} checked out ${earlyMinutes} minutes early`,
        priority: 'medium',
        data: {
          staffId: staff.id,
          employeeId: staff.employeeId,
          earlyMinutes,
        },
      },
    });

    console.log(`Notification: Staff ${staff.employeeId} checked out ${earlyMinutes} minutes early`);
  } catch (error) {
    console.error('Error creating early check-out notification:', error);
  }
}

export async function notifyMissingCheckOut(staffId: string) {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { User: true },
    });

    if (!staff) return;

    // Create notification for staff
    // TODO: Integrate with email/SMS system
    console.log(`Reminder: Staff ${staff.employeeId} forgot to check out`);

    // Create admin notification
    await prisma.adminNotification.create({
      data: {
        type: 'staff_missing_checkout',
        title: 'Missing Check-Out',
        message: `${staff.User.name || staff.employeeId} has not checked out today`,
        priority: 'low',
        data: {
          staffId: staff.id,
          employeeId: staff.employeeId,
        },
      },
    });
  } catch (error) {
    console.error('Error creating missing check-out notification:', error);
  }
}

export async function notifyLeaveRequest(staffId: string, leaveData: any) {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { User: true },
    });

    if (!staff) return;

    // Create admin notification
    await prisma.adminNotification.create({
      data: {
        type: 'staff_leave_request',
        title: 'New Leave Request',
        message: `${staff.User.name || staff.employeeId} submitted a leave request`,
        priority: 'medium',
        data: {
          staffId: staff.id,
          employeeId: staff.employeeId,
          leaveData,
        },
        actionUrl: `/admin/staff/${staff.id}`,
      },
    });

    console.log(`Notification: Staff ${staff.employeeId} submitted leave request`);
  } catch (error) {
    console.error('Error creating leave request notification:', error);
  }
}

