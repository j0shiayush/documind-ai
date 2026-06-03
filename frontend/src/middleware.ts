import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // If a user goes to the homepage, let them see it without checking session
  if (request.nextUrl.pathname === '/') {
    return;
  }
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - Root path (/)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (logo.png, icon.png)
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.png|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}