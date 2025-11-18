/**
 * Staff Attendance Utility Functions
 * Handles work schedule parsing, attendance calculations, and status detection
 */

import { prisma } from './prisma';

export interface WorkSchedule {
  defaultShift: {
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
  weeklyOverrides?: {
    [day: string]: {
      start: string;
      end: string;
    };
  };
  breakMinutes: number;
  minHours: number;
}

export interface ShiftInfo {
  start: Date;
  end: Date;
  breakMinutes: number;
  minHours: number;
}

/**
 * Get today's shift for a staff member
 */
export async function getTodayShift(staffId: string): Promise<ShiftInfo | null> {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: { workSchedule: true },
  });

  if (!staff || !staff.workSchedule) {
    return null;
  }

  const schedule = staff.workSchedule as unknown as WorkSchedule;
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const dayAbbr = today.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();

  // Check for weekly override
  const override = schedule.weeklyOverrides?.[dayName] || schedule.weeklyOverrides?.[dayAbbr];
  const shift = override || schedule.defaultShift;

  // Parse times in Europe/London timezone
  const [startHour, startMinute] = shift.start.split(':').map(Number);
  const [endHour, endMinute] = shift.end.split(':').map(Number);

  const start = new Date(today);
  start.setHours(startHour, startMinute, 0, 0);

  const end = new Date(today);
  end.setHours(endHour, endMinute, 0, 0);

  // If end time is before start time, it's next day
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }

  return {
    start,
    end,
    breakMinutes: schedule.breakMinutes || 0,
    minHours: schedule.minHours || 8,
  };
}

/**
 * Calculate late minutes based on check-in time and scheduled start
 */
export function calculateLateMinutes(checkIn: Date, scheduledStart: Date): number {
  if (checkIn <= scheduledStart) {
    return 0;
  }

  const diffMs = checkIn.getTime() - scheduledStart.getTime();
  return Math.floor(diffMs / (1000 * 60)); // Convert to minutes
}

/**
 * Calculate early leave minutes based on check-out time and scheduled end
 */
export function calculateEarlyLeaveMinutes(checkOut: Date, scheduledEnd: Date): number {
  if (checkOut >= scheduledEnd) {
    return 0;
  }

  const diffMs = scheduledEnd.getTime() - checkOut.getTime();
  return Math.floor(diffMs / (1000 * 60)); // Convert to minutes
}

/**
 * Calculate total hours worked (excluding breaks)
 */
export function calculateTotalHours(
  checkIn: Date,
  checkOut: Date,
  breakMinutes: number
): number {
  if (!checkIn || !checkOut) {
    return 0;
  }

  const diffMs = checkOut.getTime() - checkIn.getTime();
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const workingMinutes = totalMinutes - breakMinutes;

  return Math.max(0, workingMinutes / 60); // Convert to hours
}

/**
 * Auto-generate attendance status based on check-in/out times and schedule
 */
export async function generateAttendanceStatus(
  staffId: string,
  checkIn: Date | null,
  checkOut: Date | null,
  date: Date
): Promise<{
  status: 'present' | 'absent' | 'late' | 'early_leave' | 'half_day' | 'pending';
  lateMinutes: number;
  earlyLeaveMinutes: number;
  totalHours: number;
}> {
  const shift = await getTodayShift(staffId);

  // No shift scheduled or no check-in
  if (!shift || !checkIn) {
    return {
      status: 'absent',
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      totalHours: 0,
    };
  }

  // Calculate late minutes
  const lateMinutes = calculateLateMinutes(checkIn, shift.start);

  // Calculate early leave minutes (if checked out)
  let earlyLeaveMinutes = 0;
  let totalHours = 0;

  if (checkOut) {
    earlyLeaveMinutes = calculateEarlyLeaveMinutes(checkOut, shift.end);
    totalHours = calculateTotalHours(checkIn, checkOut, shift.breakMinutes);
  }

  // Determine status
  let status: 'present' | 'absent' | 'late' | 'early_leave' | 'half_day' | 'pending';

  if (!checkOut) {
    status = 'pending';
  } else if (totalHours < shift.minHours * 0.5) {
    status = 'half_day';
  } else if (lateMinutes > 0 && earlyLeaveMinutes > 0) {
    // Both late and early leave
    status = earlyLeaveMinutes > 60 ? 'half_day' : 'late';
  } else if (lateMinutes > 15) {
    // More than 15 minutes late
    status = 'late';
  } else if (earlyLeaveMinutes > 60) {
    // More than 1 hour early leave
    status = 'early_leave';
  } else if (totalHours < shift.minHours) {
    // Worked less than minimum hours
    status = 'half_day';
  } else {
    status = 'present';
  }

  return {
    status,
    lateMinutes,
    earlyLeaveMinutes,
    totalHours,
  };
}

/**
 * Parse time string in Europe/London timezone
 */
export function parseTimeInLondon(timeString: string, date: Date = new Date()): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const londonDate = new Date(date);
  londonDate.setHours(hours, minutes || 0, 0, 0);
  return londonDate;
}

/**
 * Format date to time string (HH:mm)
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Get day name from date
 */
export function getDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
}

/**
 * Check if date is a working day for staff
 */
export async function isWorkingDay(staffId: string, date: Date): Promise<boolean> {
  const shift = await getTodayShift(staffId);
  return shift !== null;
}

/**
 * Get attendance summary for a date range
 */
export async function getAttendanceSummary(
  staffId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  earlyLeaveDays: number;
  halfDays: number;
  totalHours: number;
  attendanceRate: number;
}> {
  const attendances = await prisma.staffAttendance.findMany({
    where: {
      staffId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const totalDays = attendances.length;
  const presentDays = attendances.filter((a) => a.status === 'present').length;
  const absentDays = attendances.filter((a) => a.status === 'absent').length;
  const lateDays = attendances.filter((a) => a.status === 'late').length;
  const earlyLeaveDays = attendances.filter((a) => a.status === 'early_leave').length;
  const halfDays = attendances.filter((a) => a.status === 'half_day').length;
  const totalHours = attendances.reduce((sum, a) => sum + (a.totalHours || 0), 0);

  const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  return {
    totalDays,
    presentDays,
    absentDays,
    lateDays,
    earlyLeaveDays,
    halfDays,
    totalHours,
    attendanceRate,
  };
}

