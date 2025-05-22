import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcrypt';

// Configure route as dynamic
export const dynamic = 'force-dynamic';

interface Params {
  params: {
    id: string;
  };
}

// GET /api/users/[id] - Get a specific user
export async function GET(request: Request, { params }: Params) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        class: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error(`Error fetching user ${params.id}:`, error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update a user
export async function PUT(request: Request, { params }: Params) {
  try {
    const body = await request.json();
    const { name, email, role, password, classId, qrCode } = body;

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json(
        { message: 'Name, email, and role are required' },
        { status: 400 }
      );
    }

    // Find the user to update
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if another user with the same email exists
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          { message: 'Email is already in use' },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const data: any = {
      name,
      email,
      role,
    };

    // Handle class assignment for students
    if (role === 'STUDENT') {
      if (!classId) {
        return NextResponse.json(
          { message: 'Class assignment is required for students' },
          { status: 400 }
        );
      }
      data.classId = classId;
    } else {
      // Clear classId for non-students
      data.classId = null;
    }

    // Only update password if a new one is provided
    if (password) {
      data.password = await hash(password, 10);
    }

    // Update QR code if provided
    if (qrCode !== undefined) {
      data.qrCode = qrCode;
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data,
      include: {
        class: true,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      message: 'User updated successfully',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error(`Error updating user ${params.id}:`, error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(request: Request, { params }: Params) {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error(`Error deleting user ${params.id}:`, error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 