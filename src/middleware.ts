import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

async function isValidAuthToken(token: string | undefined): Promise<boolean> {
  if (!token) {
    return false;
  }
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const rawToken = request.cookies.get('auth_token')?.value;
  const hasValidToken = await isValidAuthToken(rawToken);
  const isLoginPage = request.nextUrl.pathname === '/login';

  // Define public paths that don't require authentication
  const publicPaths = ['/login', '/public'];
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

  // If not authenticated and trying to access protected route
  if (!hasValidToken && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    if (rawToken) {
      response.cookies.delete('auth_token');
    }
    return response;
  }

  // If authenticated and trying to access login page
  if (hasValidToken && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)',
  ],
};
