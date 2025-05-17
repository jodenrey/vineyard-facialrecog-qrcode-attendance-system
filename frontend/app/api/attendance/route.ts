import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Configure route as dynamic
export const dynamic = 'force-dynamic';

// GET /api/attendance - Get attendance records with filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const classId = searchParams.get('classId');
    const date = searchParams.get('date');
    
    // Define the filters
    const filters: any = {};
    
    if (userId) {
      filters.userId = userId;
    }
    
    if (date) {
      // Filter attendance for a specific date
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);
      
      filters.date = {
        gte: targetDate,
        lt: nextDay,
      };
    }
    
    // If classId is provided, get attendance for all students in that class
    if (classId) {
      // First get all students in the class
      const studentsInClass = await prisma.user.findMany({
        where: {
          class: {
            id: classId
          },
          role: 'STUDENT',
        },
        select: {
          id: true,
        },
      });
      
      const studentIds = studentsInClass.map(student => student.id);
      
      if (studentIds.length > 0) {
        filters.userId = {
          in: studentIds,
        };
      }
    }
    
    // Fetch attendance records
    const attendanceRecords = await (prisma as any).attendance.findMany({
      where: filters,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            class: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
    
    return NextResponse.json({ 
      attendance: attendanceRecords
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/attendance - Create a new attendance record
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, date, status, timeIn } = body;
    
    // Validate required fields
    if (!userId || !status) {
      return NextResponse.json(
        { message: 'User ID and status are required' },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if there's already an attendance record for this user on this date
    let attendanceDate = date ? new Date(date) : new Date();
    
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingRecord = await (prisma as any).attendance.findFirst({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
    
    if (existingRecord) {
      // Update existing record
      const updatedRecord = await (prisma as any).attendance.update({
        where: {
          id: existingRecord.id,
        },
        data: {
          status,
          timeIn,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              class: true,
            },
          },
        },
      });
      
      return NextResponse.json({
        message: 'Attendance record updated successfully',
        attendance: updatedRecord,
      });
    } else {
      // Create new record
      const newRecord = await (prisma as any).attendance.create({
        data: {
          userId,
          date: attendanceDate,
          status,
          timeIn,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              class: true,
            },
          },
        },
      });
      
      return NextResponse.json({
        message: 'Attendance record created successfully',
        attendance: newRecord,
      });
    }
  } catch (error) {
    console.error('Error creating attendance record:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 