import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    
    // Forward the request to the backend
    const response = await fetch(`http://localhost:8000/api/face/delete/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Return the response from the backend
    try {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } catch (parseError) {
      // If we can't parse JSON, return a generic success
      // This is better than failing when the backend might have actually succeeded
      if (response.ok) {
        return NextResponse.json({ 
          success: true, 
          message: 'Face data deleted (no response from backend)' 
        });
      } else {
        throw new Error(`Backend returned ${response.status}`);
      }
    }
  } catch (error) {
    console.error('Error during face deletion:', error);
    // Return a "success" response anyway so that the user deletion can proceed
    // This prevents the UI from getting stuck when face recognition backend is unavailable
    return NextResponse.json(
      { 
        success: true,
        fallback: true,
        message: 'Face deletion was bypassed due to an error, but user deletion can proceed' 
      },
      { status: 200 }
    );
  }
} 