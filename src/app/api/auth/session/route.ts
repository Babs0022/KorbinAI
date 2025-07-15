
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// This route is responsible for setting and clearing the authentication cookie.
// It receives the Firebase ID token from the client-side AuthContext.

// POST: Set the session cookie
export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
  }

  const options = {
    name: 'firebaseIdToken',
    value: idToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 5, // 5 days
  };

  try {
    cookies().set(options);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to set session cookie' }, { status: 500 });
  }
}

// DELETE: Clear the session cookie
export async function DELETE() {
  try {
    cookies().delete('firebaseIdToken');
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear session cookie' }, { status: 500 });
  }
}
