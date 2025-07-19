
import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';

// This middleware file is now simplified to allow all traffic through,
// effectively making all pages public by default. Authentication checks
// will be handled at the component/page level for specific features.
export function middleware(request: NextRequest) {
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
     * - auth routes (so they don't get redirected)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon.png|manifest.json|login|signup|forgot-password|verify-email).*)',
  ],
};
