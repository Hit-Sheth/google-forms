import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth'; // IMPORTED TO IDENTIFY USER
import { logActivity } from '@/lib/logger';       // IMPORTED LOGGER

export async function POST(req) {
  try {
    // Identify the user from the token cookie BEFORE we delete it
    const user = await getUserFromRequest(req);

    if (user && (user.userId || user._id)) {
      const actorId = user.userId || user._id;

      // NEW LOG FEATURE: Tracks the logout timestamp into the user's daily bucket array
      await logActivity({
        actorId: actorId,
        action: 'logout'
      });
    }

    const response = NextResponse.json({ message: 'Logged out successfully' });
    
    // Clear the token cookie
    response.cookies.set({
      name: 'token',
      value: '',
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}