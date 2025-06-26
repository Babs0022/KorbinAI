
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hostname = request.headers.get('host');

  // Define hostnames directly to avoid environment variable issues in production
  const APP_HOSTNAME = 'app.brieflyai.xyz';
  const ROOT_HOSTNAME = 'brieflyai.xyz';

  // Skip all logic if it's a development environment or a preview deployment
  // that doesn't use the custom domains.
  if (hostname !== APP_HOSTNAME && hostname !== ROOT_HOSTNAME) {
    return NextResponse.next();
  }

  // Paths that should only exist on the app subdomain.
  // This list is now more comprehensive.
  const appPaths = [
    '/dashboard',
    '/login',
    '/signup',
    '/forgot-password',
    '/create-prompt',
    '/verify-email',
    '/onboarding',
  ];

  // Check if the current path is an app-specific path
  const isAppPath = appPaths.some(path => pathname.startsWith(path));

  // Handle routing for the app subdomain
  if (hostname === APP_HOSTNAME) {
    // If someone lands on app.brieflyai.xyz/, redirect them to the dashboard
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // If they are on the app domain but try to access a non-app page (e.g. landing page),
    // redirect them to the root domain.
    if (!isAppPath) {
      return NextResponse.redirect(new URL(`https://${ROOT_HOSTNAME}${pathname}`));
    }
  }

  // Handle routing for the root domain
  if (hostname === ROOT_HOSTNAME) {
    // If someone tries to access an app page on the root domain,
    // redirect them to the app subdomain.
    if (isAppPath) {
      return NextResponse.redirect(new URL(`https://${APP_HOSTNAME}${pathname}`));
    }
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
     * - favicon.ico (favicon file)
     * - logo.svg
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo.svg).*)',
  ],
};
