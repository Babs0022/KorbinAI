import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const hostname = request.headers.get('host')

  // In development, the host is probably localhost, so we can skip this logic.
  if (process.env.NODE_ENV === 'development' || !hostname || hostname.includes('localhost')) {
    return NextResponse.next()
  }

  const APP_HOSTNAME = process.env.NEXT_PUBLIC_APP_HOSTNAME || 'app.brieflyai.xyz';
  const ROOT_HOSTNAME = process.env.NEXT_PUBLIC_ROOT_HOSTNAME || 'brieflyai.xyz';

  // These are paths that should ONLY exist on the app domain.
  const appPaths = [
    '/dashboard', 
    '/login', 
    '/signup', 
    '/forgot-password', 
    '/create-prompt', 
    '/verify-email', 
    '/onboarding'
  ];

  const isAppPath = appPaths.some(path => pathname.startsWith(path));

  // If on the app domain and trying to access the root, redirect to dashboard.
  if (hostname === APP_HOSTNAME && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If on the root domain but trying to access an app page, redirect to the app domain.
  if (hostname === ROOT_HOSTNAME && isAppPath) {
    return NextResponse.redirect(new URL(`https://${APP_HOSTNAME}${pathname}`))
  }
  
  // If on the app domain but trying to access a page that isn't an app page (e.g. landing page sections),
  // redirect to the root domain.
  if (hostname === APP_HOSTNAME && !isAppPath) {
     return NextResponse.redirect(new URL(`https://${ROOT_HOSTNAME}${pathname}`))
  }

  return NextResponse.next()
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
