
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
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password'];
const VERIFICATION_ROUTE = '/verify-email';


export function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;
  const authToken = request.cookies.get('firebaseIdToken');

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  // If user is unauthenticated and trying to access a protected route, redirect to login
  if (!authToken && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated and trying to access an auth route, redirect to the root
  if (authToken && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url));
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon.png|manifest.json).*)',
  ],
};
