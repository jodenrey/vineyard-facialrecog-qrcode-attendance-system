import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Configure route as dynamic
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get all students with their class and teacher info
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        class: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Get all teachers with their classes
    const teachers = await prisma.user.findMany({
      where: { role: 'TEACHER' },
      include: {
        teacherClasses: {
          include: {
            students: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Get all classes
    const classes = await prisma.class.findMany({
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        students: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Get today's attendance records
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const todayAttendance = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json({
      students,
      teachers,
      classes,
      todayAttendance,
      summary: {
        totalStudents: students.length,
        studentsWithTeacher: students.filter(s => s.class?.teacher).length,
        totalTeachers: teachers.length,
        teachersWithClasses: teachers.filter(t => t.teacherClasses.length > 0).length,
        totalClasses: classes.length,
        classesWithTeacher: classes.filter(c => c.teacher).length,
        todayAttendanceCount: todayAttendance.length
      }
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug data', details: error },
      { status: 500 }
    );
  }
} 