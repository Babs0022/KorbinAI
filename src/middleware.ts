import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')
  const pathname = request.nextUrl.pathname

  const APP_HOSTNAME = 'app.brieflyai.xyz'
  const LANDING_HOSTNAME = 'brieflyai.xyz'

  // App-only paths that should redirect from the landing domain
  const appPaths = [
    '/dashboard', 
    '/login', 
    '/signup', 
    '/forgot-password', 
    '/create-prompt', 
    '/verify-email', 
    '/onboarding'
  ];

  // If on the landing domain but trying to access an app page, redirect to the app domain
  if (hostname === LANDING_HOSTNAME && appPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL(pathname, `https://` + APP_HOSTNAME))
  }

  // If on the app domain and at the root, redirect to the dashboard
  if (hostname === APP_HOSTNAME && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
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
}
