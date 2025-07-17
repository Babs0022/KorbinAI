
import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';

const PROTECTED_ROUTES = [
    '/',
    '/component-wizard',
    '/component-wizard/result',
    '/image-generator',
    '/prompt-generator',
    '/structured-data',
    '/written-content',
    '/chat',
    '/dashboard/projects',
    '/dashboard/account',
    '/dashboard/settings',
    '/dashboard/billing',
];

export function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;
  const authToken = request.cookies.get('firebaseIdToken');

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  // If user is unauthenticated and trying to access a protected route, redirect to login
  if (!authToken && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl);
  }
  
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
