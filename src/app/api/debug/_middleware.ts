import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Block all debug endpoints in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoints are not available in production' },
      { status: 403 }
    );
  }

  // Optional: Add additional authentication check
  // You can uncomment this to require specific admin users
  /*
  const authHeader = request.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${process.env.DEBUG_TOKEN}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  */

  return NextResponse.next();
}

export const config = {
  matcher: '/api/debug/:path*'
};