import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AttendanceService } from '@/lib/attendance-service';

// Configure route as dynamic
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { faceUserId, qrUserId } = body;

    if (!faceUserId || !qrUserId) {
      return NextResponse.json(
        { message: 'Both face and QR user IDs are required', valid: false },
        { status: 400 }
      );
    }

    console.log(`Verifying biometric match: Face user ID ${faceUserId}, QR user ID ${qrUserId}`);

    // Check if both IDs refer to the same user
    if (faceUserId === qrUserId) {
      // Verify that this user actually exists
      const user = await prisma.user.findUnique({
        where: { id: faceUserId },
      });

      if (!user) {
        return NextResponse.json(
          { message: 'User not found', valid: false },
          { status: 404 }
        );
      }

      // Record attendance automatically for successful biometric login
      let attendanceResult = null;
      if (user.role === 'STUDENT' || user.role === 'TEACHER') {
        try {
          const attendanceService = AttendanceService.getInstance();
          attendanceResult = await attendanceService.recordAttendanceOnLogin(user.id);
        } catch (attendanceError) {
          console.error('Error recording attendance:', attendanceError);
          // Don't fail login if attendance recording fails
        }
      }

      // Both IDs match and user exists
      return NextResponse.json({
        valid: true,
        userId: faceUserId,
        message: 'Biometric verification successful',
        attendance: attendanceResult
      });
    } else {
      // IDs don't match
      return NextResponse.json(
        { message: 'Face and QR code do not match the same user', valid: false },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Biometric verification error:', error);
    return NextResponse.json(
      { message: 'Internal server error', valid: false },
      { status: 500 }
    );
  }
} 