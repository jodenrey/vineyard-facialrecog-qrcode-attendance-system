import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Configure route as dynamic
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { qrCode } = body;

    if (!qrCode) {
      return NextResponse.json(
        { message: 'QR code is required' },
        { status: 400 }
      );
    }

    console.log(`Attempting to verify QR code: ${qrCode}`);

    // Try finding user directly by qrCode field
    let user = await prisma.user.findFirst({
      where: { qrCode },
    });

    // If not found, try extracting ID from slash format
    if (!user) {
      console.log("QR code not found directly, trying to parse...");
      const slashMatch = qrCode.match(/vineyardacademy\/([a-f0-9\/]+)$/i);
      
      if (slashMatch && slashMatch[1]) {
        const parts = slashMatch[1].split('/');
        if (parts.length > 0) {
          const possibleId = parts[parts.length - 1];
          console.log(`Extracted possible ID: ${possibleId}`);
          
          // Try to find user with this ID
          user = await prisma.user.findFirst({
            where: { id: possibleId },
          });

          // If not found by ID, check if it's stored in qrCode field with hyphens instead of slashes
          if (!user) {
            console.log("User not found by ID, trying normalized format...");
            // Convert slashes to hyphens for compatibility
            const normalizedQrCode = qrCode.replace(/\//g, '-');
            user = await prisma.user.findFirst({
              where: { qrCode: normalizedQrCode },
            });
          }
        }
      }
    }

    // If still not found, check if the entire QR code is an ID
    if (!user && /^[a-f0-9-]+$/i.test(qrCode)) {
      console.log("Checking if QR code is direct user ID...");
      user = await prisma.user.findFirst({
        where: { id: qrCode },
      });
    }
    
    // If still not found, check if the QR code is the last part of a user ID
    // This is specifically to handle the case where the scanner only picks up the last part of the UUID
    if (!user && /^[a-f0-9]+$/i.test(qrCode) && qrCode.length >= 12) {
      console.log("Checking if QR code is the tail end of a user ID...");
      const allUsers = await prisma.user.findMany();
      const matchingUser = allUsers.find(u => u.id.endsWith(qrCode) || (u.qrCode && u.qrCode.endsWith(qrCode)));
      
      if (matchingUser) {
        console.log(`Found user by ID suffix match: ${matchingUser.id}`);
        user = matchingUser;
      }
    }

    if (!user) {
      console.log("No user found for QR code");
      return NextResponse.json(
        { message: 'Invalid QR code', valid: false },
        { status: 401 }
      );
    }

    console.log("User found:", user.id);
    
    // QR code is valid, return user ID for further authentication
    return NextResponse.json({
      valid: true,
      userId: user.id,
      message: 'QR code verified successfully',
    });
  } catch (error) {
    console.error('QR verification error:', error);
    return NextResponse.json(
      { message: 'Internal server error', valid: false },
      { status: 500 }
    );
  }
} 