import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Configure route as dynamic
export const dynamic = 'force-dynamic';

interface Params {
  params: {
    id: string;
  };
}

// GET /api/classes/[id] - Get a specific class
export async function GET(request: Request, { params }: Params) {
  try {
    const classEntity = await prisma.class.findUnique({
      where: { id: params.id },
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

    if (!classEntity) {
      return NextResponse.json(
        { message: 'Class not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ class: classEntity });
  } catch (error) {
    console.error(`Error fetching class ${params.id}:`, error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/classes/[id] - Update a class
export async function PUT(request: Request, { params }: Params) {
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

    // Find the class to update
    const existingClass = await prisma.class.findUnique({
      where: { id: params.id },
    });

    if (!existingClass) {
      return NextResponse.json(
        { message: 'Class not found' },
        { status: 404 }
      );
    }

    // Update the class
    const updatedClass = await prisma.class.update({
      where: { id: params.id },
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

    return NextResponse.json({
      message: 'Class updated successfully',
      class: updatedClass,
    });
  } catch (error) {
    console.error(`Error updating class ${params.id}:`, error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/classes/[id] - Delete a class
export async function DELETE(request: Request, { params }: Params) {
  try {
    // Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id: params.id },
    });

    if (!existingClass) {
      return NextResponse.json(
        { message: 'Class not found' },
        { status: 404 }
      );
    }

    // Delete the class
    await prisma.class.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Class deleted successfully',
    });
  } catch (error) {
    console.error(`Error deleting class ${params.id}:`, error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 