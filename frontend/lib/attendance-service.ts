import { prisma } from '@/lib/prisma';

export interface AttendanceConfig {
  timezone: string;
  schedules: {
    [key: string]: {
      startTime: string;
      endTime: string;
      grades: number[];
    };
  };
}

export const ATTENDANCE_CONFIG: AttendanceConfig = {
  timezone: 'Asia/Manila',
  schedules: {
    'MORNING': {
      startTime: '07:30',
      endTime: '11:30',
      grades: [1, 2, 3]
    },
    'AFTERNOON': {
      startTime: '12:35',
      endTime: '17:30',
      grades: [4, 5, 6]
    }
  }
};

export class AttendanceService {
  private static instance: AttendanceService;
  
  public static getInstance(): AttendanceService {
    if (!AttendanceService.instance) {
      AttendanceService.instance = new AttendanceService();
    }
    return AttendanceService.instance;
  }

  /**
   * Get the current time in Philippine timezone
   */
  private getCurrentPhilippineTime(): Date {
    return new Date(new Date().toLocaleString("en-US", {timeZone: ATTENDANCE_CONFIG.timezone}));
  }

  /**
   * Format time as HH:MM for comparison
   */
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      timeZone: ATTENDANCE_CONFIG.timezone
    });
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-CA', {
      timeZone: ATTENDANCE_CONFIG.timezone
    });
  }

  /**
   * Check if current day is a school day (Monday to Friday)
   */
  private isSchoolDay(date: Date): boolean {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
  }

  /**
   * Get schedule for a specific grade
   */
  private getScheduleForGrade(grade: number): { startTime: string; endTime: string } | null {
    for (const schedule of Object.values(ATTENDANCE_CONFIG.schedules)) {
      if (schedule.grades.includes(grade)) {
        return {
          startTime: schedule.startTime,
          endTime: schedule.endTime
        };
      }
    }
    return null;
  }

  /**
   * Determine attendance status based on login time and schedule
   */
  private determineAttendanceStatus(loginTime: string, startTime: string): 'PRESENT' | 'LATE' {
    // Convert times to minutes for easier comparison
    const [loginHour, loginMinute] = loginTime.split(':').map(Number);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    
    const loginMinutes = loginHour * 60 + loginMinute;
    const startMinutes = startHour * 60 + startMinute;
    
    return loginMinutes <= startMinutes ? 'PRESENT' : 'LATE';
  }

  /**
   * Record attendance for a user on login
   */
  async recordAttendanceOnLogin(userId: string): Promise<{
    success: boolean;
    message: string;
    attendance?: any;
  }> {
    try {
      const currentTime = this.getCurrentPhilippineTime();
      const currentDate = this.formatDate(currentTime);
      const currentTimeStr = this.formatTime(currentTime);

      // Check if it's a school day
      if (!this.isSchoolDay(currentTime)) {
        return {
          success: false,
          message: 'No attendance recording on weekends'
        };
      }

      // Get user with class information
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          class: true,
          teacherClasses: true
        }
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Check if attendance already exists for today
      const startOfDay = new Date(currentTime);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(currentTime);
      endOfDay.setHours(23, 59, 59, 999);

      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          userId: userId,
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      if (existingAttendance) {
        return {
          success: false,
          message: 'Attendance already recorded for today',
          attendance: existingAttendance
        };
      }

      let schedule: { startTime: string; endTime: string } | null = null;

      // Determine schedule based on user role
      if (user.role === 'STUDENT' && user.class) {
        schedule = this.getScheduleForGrade(user.class.grade);
      } else if (user.role === 'TEACHER') {
        // For teachers, use the schedule of their first assigned class
        // In a real system, you might want to handle multiple classes differently
        if (user.teacherClasses.length > 0) {
          const teacherClass = user.teacherClasses[0];
          // Get the class details to determine schedule
          const classDetails = await prisma.class.findUnique({
            where: { id: teacherClass.id }
          });
          if (classDetails) {
            schedule = this.getScheduleForGrade(classDetails.grade);
          }
        }
      }

      if (!schedule) {
        return {
          success: false,
          message: 'No schedule found for user'
        };
      }

      // Determine attendance status
      const status = this.determineAttendanceStatus(currentTimeStr, schedule.startTime);

      // Create attendance record
      const attendance = await prisma.attendance.create({
        data: {
          userId: userId,
          date: currentTime,
          status: status,
          timeIn: currentTimeStr
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              class: true
            }
          }
        }
      });

      return {
        success: true,
        message: `Attendance recorded as ${status}`,
        attendance: attendance
      };

    } catch (error) {
      console.error('Error recording attendance:', error);
      return {
        success: false,
        message: 'Failed to record attendance'
      };
    }
  }

  /**
   * Mark users as absent who haven't logged in by end of day
   * This should be run as a scheduled job
   */
  async markAbsentUsers(): Promise<void> {
    try {
      const currentTime = this.getCurrentPhilippineTime();
      const currentDate = this.formatDate(currentTime);

      // Only run on school days
      if (!this.isSchoolDay(currentTime)) {
        return;
      }

      // Get start and end of today
      const startOfDay = new Date(currentTime);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(currentTime);
      endOfDay.setHours(23, 59, 59, 999);

      // Get all active students and teachers
      const users = await prisma.user.findMany({
        where: {
          role: {
            in: ['STUDENT', 'TEACHER']
          }
        },
        include: {
          class: true,
          teacherClasses: true
        }
      });

      // Check each user for attendance
      for (const user of users) {
        const existingAttendance = await prisma.attendance.findFirst({
          where: {
            userId: user.id,
            date: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        });

        // If no attendance record exists, mark as absent
        if (!existingAttendance) {
          await prisma.attendance.create({
            data: {
              userId: user.id,
              date: currentTime,
              status: 'ABSENT',
              timeIn: null
            }
          });
        }
      }

    } catch (error) {
      console.error('Error marking absent users:', error);
    }
  }
} 