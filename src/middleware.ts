
import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';

const PROTECTED_ROUTES = ['/'];
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/verify-email'];


export function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;
  const authToken = request.cookies.get('firebaseIdToken');

  // If user is unauthenticated and trying to access a protected route, redirect to login
  if (!authToken && PROTECTED_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated and trying to access an auth route, redirect to the root
  if (authToken && AUTH_ROUTES.includes(pathname)) {
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
