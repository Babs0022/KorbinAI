import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define the marketing-specific pages.
// Any path NOT in this list is considered an "app" page.
const MARKETING_PATHS = ['/', '/privacy-policy', '/terms-of-service'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Construct URLs from environment variables, with fallbacks.
  const marketingUrl = new URL(process.env.NEXT_PUBLIC_MARKETING_URL || 'https://brieflyai-gtgc2.web.app');
  // NOTE: You must create a second site in your Firebase project for the app subdomain.
  // By default, it might be named `your-project-id--app` or you can give it a custom name.
  // For this example, we assume the site is named 'app-brieflyai'.
  const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://app-brieflyai.web.app');

  const isMarketingPath = MARKETING_PATHS.includes(pathname);

  // If on the app domain (e.g., app.domain.com) and accessing a marketing path,
  // redirect to the main marketing domain.
  if (hostname === appUrl.hostname && isMarketingPath) {
    return NextResponse.redirect(new URL(pathname, marketingUrl.origin));
  }

  // If on the marketing domain (e.g., domain.com) and accessing an app path,
  // redirect to the app subdomain.
  if (hostname === marketingUrl.hostname && !isMarketingPath) {
    return NextResponse.redirect(new URL(pathname, appUrl.origin));
  }

  // Otherwise, allow the request to proceed.
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
