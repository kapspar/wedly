import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const protectedPaths = ['/dashboard', '/onboarding', '/budget', '/events', '/tasks', '/saved', '/inquiries', '/vendor/get-started', '/vendor/dashboard']
  const adminPaths = ['/admin']
  const authPaths = ['/auth/login', '/auth/signup']

  const pathname = request.nextUrl.pathname

  if (!user && protectedPaths.some((path) => pathname.startsWith(path))) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (!user && adminPaths.some((path) => pathname.startsWith(path))) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (user && authPaths.some((path) => pathname.startsWith(path))) {
    const url = request.nextUrl.clone()
    const { data: isStaff } = await supabase.rpc('is_admin')
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    url.pathname = isStaff ? '/admin' : profile?.role === 'vendor' ? '/vendor/get-started' : '/dashboard'
    return NextResponse.redirect(url)
  }

  if (user && (pathname === '/dashboard' || pathname === '/onboarding' || ['/budget', '/events', '/tasks', '/saved', '/inquiries'].some((path) => pathname.startsWith(path)))) {
    const { data: isStaff } = await supabase.rpc('is_admin')
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (isStaff) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      url.search = ''
      return NextResponse.redirect(url)
    }
    if (profile?.role === 'vendor') {
      const url = request.nextUrl.clone()
      url.pathname = '/vendor/get-started'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  if (user && adminPaths.some((path) => pathname.startsWith(path))) {
    const { data: isStaff } = await supabase.rpc('is_admin')

    if (!isStaff) {
      const url = request.nextUrl.clone()
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      url.pathname = profile?.role === 'vendor' ? '/vendor/get-started' : '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
