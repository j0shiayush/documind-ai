import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // If there is a "next" parameter, use it. Otherwise, default to the home dashboard ("/")
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Successfully exchanged the code for a cookie. Redirect to the main app!
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error("Auth error:", error)
    }
  }

  // If no code is present or there was an error, send them back to login
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`)
}