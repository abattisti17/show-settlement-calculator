import { type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/proxy'

/**
 * Proxy runs on every request to protected routes.
 * It refreshes the user's session and handles authentication redirects.
 */
export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const isLoginPage = request.nextUrl.pathname === '/login'
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth/callback')
  const isWebhook = request.nextUrl.pathname.startsWith('/api/webhooks/')
  const isPublicSharePage = request.nextUrl.pathname.startsWith('/s/')

  // Webhooks should bypass authentication (they use signature verification instead)
  if (isWebhook) {
    return supabaseResponse
  }

  // Public share pages should be accessible without authentication
  if (isPublicSharePage) {
    return supabaseResponse
  }

  // If user is authenticated and trying to access login page, redirect to dashboard
  if (user && isLoginPage) {
    return Response.redirect(new URL('/dashboard', request.url))
  }

  // If user is not authenticated and not on login or auth callback, redirect to login
  if (!user && !isLoginPage && !isAuthCallback) {
    return Response.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
