import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { rateLimits } from '@/lib/rate-limit';

export async function middleware(request: NextRequest) {
  // Apply rate limiting based on the path
  const path = request.nextUrl.pathname;
  
  // Determine which rate limit to apply
  let rateLimitCheck;
  if (path.startsWith('/api/auth')) {
    rateLimitCheck = await rateLimits.auth(request);
  } else if (path.startsWith('/api/recipes') && request.method === 'POST') {
    rateLimitCheck = await rateLimits.write(request);
  } else if (path.startsWith('/api/recipes') && request.method === 'GET') {
    rateLimitCheck = await rateLimits.read(request);
  } else if (path.includes('/upload') || path.includes('/avatar')) {
    rateLimitCheck = await rateLimits.upload(request);
  }
  
  // Return 429 if rate limit exceeded
  if (rateLimitCheck && !rateLimitCheck.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: {
          'Retry-After': rateLimitCheck.retryAfter?.toString() || '60',
          'X-RateLimit-Remaining': '0',
        }
      }
    );
  }
  
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes that require authentication
  const protectedRoutes = [
    '/recipes/new',
    '/recipes/my',
    '/recipes/edit',
    '/profile',
    '/saved',
    '/dashboard',
    '/my-recipes',
    '/saved-recipes',
    '/connections',
    '/interactions'
  ];
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Auth page - redirect authenticated users to home
  if (request.nextUrl.pathname === '/auth' && user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Protected routes - redirect unauthenticated users to auth
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Username onboarding check for authenticated users
  if (user && !request.nextUrl.pathname.startsWith('/onboarding/username')) {
    // Exempt paths that don't require username
    const exemptPaths = [
      '/auth',
      '/api',
      '/_next',
      '/onboarding',
    ];
    
    const isExemptPath = exemptPaths.some(path => 
      request.nextUrl.pathname.startsWith(path)
    );
    
    // Check if user has username (only for non-exempt paths and protected routes)
    if (!isExemptPath && (isProtectedRoute || request.nextUrl.pathname === '/')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();
      
      // Redirect to username onboarding if no profile or no username
      if (!profile || !profile.username) {
        return NextResponse.redirect(new URL('/onboarding/username', request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
