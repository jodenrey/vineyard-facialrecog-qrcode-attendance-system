import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// Configure route as dynamic
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Generate a unique QR code for the user
    // Store just the user ID so our system will be more compatible with barcode scanners
    const qrCodeData = userId;

    // For backwards compatibility, also store the standard format
    console.log(`Generating QR code for user ${userId}`);

    // Update the user with the QR code
    await prisma.user.update({
      where: { id: userId },
      data: { qrCode: qrCodeData },
    });

    // Return the QR code data
    return NextResponse.json({
      qrCodeData,
      message: 'QR code generated successfully',
    });
  } catch (error) {
    console.error('QR generation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 