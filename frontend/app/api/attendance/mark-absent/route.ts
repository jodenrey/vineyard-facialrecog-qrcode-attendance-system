import { NextResponse } from 'next/server';
import { AttendanceService } from '@/lib/attendance-service';

// Configure route as dynamic
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const attendanceService = AttendanceService.getInstance();
    await attendanceService.markAbsentUsers();
    
    return NextResponse.json({
      message: 'Successfully marked absent users',
      success: true
    });
  } catch (error) {
    console.error('Error marking absent users:', error);
    return NextResponse.json(
      { message: 'Failed to mark absent users', success: false },
      { status: 500 }
    );
  }
} 