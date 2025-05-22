import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Configure route as dynamic
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Find all users
    const users = await prisma.user.findMany();
    
    console.log(`Found ${users.length} users. Regenerating QR codes...`);
    
    // Update each user's QR code to be their user ID for compatibility
    const updatedCount = await Promise.all(
      users.map(async (user) => {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { qrCode: user.id },
          });
          return true;
        } catch (error) {
          console.error(`Error updating QR code for user ${user.id}:`, error);
          return false;
        }
      })
    ).then(results => results.filter(Boolean).length);

    return NextResponse.json({
      message: `Successfully regenerated ${updatedCount} QR codes`,
      success: true,
    });
  } catch (error) {
    console.error('Error regenerating QR codes:', error);
    return NextResponse.json(
      { message: 'Internal server error', success: false },
      { status: 500 }
    );
  }
} 