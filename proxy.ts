import { type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/proxy'

/**
 * Proxy runs on every request to protected routes.
 * It refreshes the user's session and handles authentication redirects.
 */
export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  const isLoginPage = pathname === '/login'
  const isAuthCallback = pathname.startsWith('/auth/callback')
  const isWebhook = pathname.startsWith('/api/webhooks/')

  const publicMarketingRoutes = new Set([
    '/',
    '/media',
    '/pricing',
    '/login',
    '/design-system',
    '/example-packet.pdf',
    '/robots.txt',
    '/sitemap.xml',
  ])
  const isPublicMarketingRoute =
    publicMarketingRoutes.has(pathname) ||
    pathname.startsWith('/s/') ||
    pathname.startsWith('/blog/') ||
    pathname.startsWith('/use-cases/') ||
    pathname.startsWith('/compare/') ||
    pathname.startsWith('/templates/')

  // Webhooks should bypass authentication (they use signature verification instead)
  if (isWebhook) {
    return supabaseResponse
  }

  // Public marketing and share routes should be crawler-accessible.
  if (isPublicMarketingRoute) {
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
