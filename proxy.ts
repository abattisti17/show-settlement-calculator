import { type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/proxy'

/**
 * Proxy runs on every request to protected routes.
 * It refreshes the user's session and handles authentication redirects.
 */
export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const isRootPage = request.nextUrl.pathname === '/'
  const isPricingPage = request.nextUrl.pathname === '/pricing'
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth/callback')
  const isWebhook = request.nextUrl.pathname.startsWith('/api/webhooks/')
  const isPublicSharePage = request.nextUrl.pathname.startsWith('/s/')
  const isExamplePacket = request.nextUrl.pathname === '/example-packet.pdf'

  // Webhooks should bypass authentication (they use signature verification instead)
  if (isWebhook) {
    return supabaseResponse
  }

  // Public share pages should be accessible without authentication
  if (isPublicSharePage) {
    return supabaseResponse
  }

  if (isExamplePacket) {
    return supabaseResponse
  }

  // If user is authenticated and trying to access login page, redirect to dashboard
  if (user && isLoginPage) {
    return Response.redirect(new URL('/', request.url))
  }

  // If user is not authenticated and not on login or auth callback, redirect to login
  if (!user && !isLoginPage && !isAuthCallback && !isRootPage && !isPricingPage) {
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
