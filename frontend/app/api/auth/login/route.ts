import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcrypt';
import { AttendanceService } from '@/lib/attendance-service';

// Configure route as dynamic
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordMatch = await compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Password is correct, record attendance automatically
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

    // Password is correct, return user without the password
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      attendance: attendanceResult
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 