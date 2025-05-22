import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Configure route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Find all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        qrCode: true
      }
    });
    
    console.log(`Found ${users.length} users.`);
    
    // Check if we can find the specific problematic ID
    const targetId = "4a43e393d7f1";
    const foundUser = await prisma.user.findUnique({
      where: { id: targetId },
    });
    
    // Try direct query with the raw QR code
    const rawQrCode = "vineyardacademy/d0e3b829/5b53/4833/9e13/4b2e336ebf7b/7b06fd5a/26e6/494f/a43c/4a43e393d7f1";
    const userByQrCode = await prisma.user.findFirst({
      where: { qrCode: rawQrCode },
    });
    
    // Return diagnostic information
    return NextResponse.json({
      userCount: users.length,
      users,
      specificIdExists: !!foundUser,
      qrCodeDirectMatch: !!userByQrCode,
      suggestion: "Use one of the valid user IDs from the users list for testing"
    });
  } catch (error) {
    console.error('Error in user diagnostics:', error);
    return NextResponse.json(
      { message: 'Internal server error', success: false },
      { status: 500 }
    );
  }
} 