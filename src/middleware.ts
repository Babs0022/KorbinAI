
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware is simplified to only handle basic routing cases.
// The more complex auth logic (like email verification) is handled in the AuthContext.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Reading the auth cookie is unreliable here for server components,
  // so we delegate auth state checking to the client-side AuthProvider.
  // This middleware can still be useful for other purposes like geolocation, etc.

  // Allow all requests to proceed. The client-side AuthProvider will handle redirects.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - public assets (favicon, logo, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo.svg).*)',
  ],
};
