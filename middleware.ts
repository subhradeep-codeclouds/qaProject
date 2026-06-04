import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session      = request.cookies.get('qa_portal_session')
  const { pathname } = request.nextUrl
  const isLoginPage     = pathname === '/login'
  const isRegisterPage  = pathname === '/register'
  const isVerifyPage    = pathname === '/verify-email'
  const isApiAuth        = pathname.startsWith('/api/auth')
  const isApiNews        = pathname.startsWith('/api/news')
  const isApiAttachments = pathname.startsWith('/api/attachments')

  if (isApiAuth || isApiNews || isApiAttachments) return NextResponse.next()

  if (!session && !isLoginPage && !isRegisterPage && !isVerifyPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session && (isLoginPage || isRegisterPage || isVerifyPage)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
