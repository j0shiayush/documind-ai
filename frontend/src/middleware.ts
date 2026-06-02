import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo.png / icon.png (public images)
     * - about (public information page for Google Verification)
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.png|icon.png|about|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}