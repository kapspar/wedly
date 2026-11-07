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

  const protectedPaths = ['/dashboard', '/onboarding', '/budget', '/events', '/tasks', '/saved', '/inquiries']
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
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (user && adminPaths.some((path) => pathname.startsWith(path))) {
    const { data: staff } = await supabase
      .from('admin_access' as never)
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    const role = (staff as { role: string } | null)?.role
    if (role !== 'owner' && role !== 'business_admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
