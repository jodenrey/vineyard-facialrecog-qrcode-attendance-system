import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcrypt';

// Configure route as dynamic
export const dynamic = 'force-dynamic';

// GET /api/users - Get all users
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    // Define the query
    let where = {};
    if (role) {
      where = { role };
    }

    // Fetch users with optional role filter and include class information
    const users = await prisma.user.findMany({
      where,
      include: {
        class: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ 
      users: users.map(user => {
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      })
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, role, password, classId } = body;

    // Validate required fields
    if (!name || !email || !role || !password) {
      return NextResponse.json(
        { message: 'Name, email, role, and password are required' },
        { status: 400 }
      );
    }

    // For students, classId is required
    if (role === 'STUDENT' && !classId) {
      return NextResponse.json(
        { message: 'Class assignment is required for students' },
        { status: 400 }
      );
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Create the user with appropriate data based on role
    const userData = {
      name,
      email,
      role,
      password: hashedPassword,
    };

    // Only add classId for students
    if (role === 'STUDENT' && classId) {
      Object.assign(userData, { classId });
    }

    const user = await prisma.user.create({
      data: userData,
      include: {
        class: true,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: 'User created successfully', user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 