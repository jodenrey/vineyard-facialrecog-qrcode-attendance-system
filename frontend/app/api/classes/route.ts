import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Configure route as dynamic
export const dynamic = 'force-dynamic';

// GET /api/classes - Get all classes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    
    // Create filter based on query parameters
    const where: any = {};
    if (teacherId) {
      where.teacherId = teacherId;
    }
    
    // Using bracket notation to access the "class" model
    const classes = await (prisma as any).class.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        grade: 'asc',
      },
    });

    return NextResponse.json({ classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/classes - Create a new class
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { grade, section, teacherId } = body;

    // Validate required fields
    if (!grade || !section) {
      return NextResponse.json(
        { message: 'Grade and section are required' },
        { status: 400 }
      );
    }

    // Create the class using bracket notation
    const newClass = await (prisma as any).class.create({
      data: {
        grade: parseInt(grade),
        section,
        teacherId,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: 'Class created successfully', class: newClass },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 