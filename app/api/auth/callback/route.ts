import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const rawNext = requestUrl.searchParams.get('next') ?? '/'
  // Only same-origin paths — `//evil.com` or `https://evil.com` would be an open redirect.
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.startsWith('/\\') ? rawNext : '/'

  // Supabase reports provider/confirmation failures as query params.
  const providerError = requestUrl.searchParams.get('error_description') ?? requestUrl.searchParams.get('error')
  if (providerError) {
    return redirectWithError(requestUrl.origin, providerError)
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[AuthCallback] exchangeCodeForSession failed', error)
      return redirectWithError(requestUrl.origin, error.message)
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}

function redirectWithError(origin: string, message: string) {
  const url = new URL('/', origin)
  url.searchParams.set('auth_error', message)
  return NextResponse.redirect(url)
}
