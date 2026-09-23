import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'barbearia-secret-key-super-segura-2026-solo'
)

const SESSION_COOKIE = 'barbearia_session'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'rcsfempresa@gmail.com'

interface SessionPayload {
  userId: string
  orgId: string
  email: string
  name: string
  status: string
  role?: string
  trialEndsAt?: string | null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE)?.value

  let session: SessionPayload | null = null

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      session = payload as unknown as SessionPayload
    } catch {
      session = null
    }
  }

  const isAuthRoute = pathname === '/login' || pathname === '/cadastro'
  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isAdminRoute = pathname.startsWith('/admin')
  const isTrialExpiredRoute = pathname === '/trial-expirado'

  const isAdmin = session?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() || session?.role === 'ADMIN'

  // O administrador nunca expira o trial
  const isTrialExpired =
    !isAdmin &&
    session?.status === 'TRIAL' &&
    session?.trialEndsAt &&
    new Date() > new Date(session.trialEndsAt)

  // 1. Rota de Admin (/admin/usuarios) - Requer sessão e e-mail/role de Admin
  if (isAdminRoute) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // 2. Se estiver tentando acessar o dashboard sem sessão
  if (isDashboardRoute && !session) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // 3. Se a sessão estiver com o trial expirado e tentar acessar o dashboard
  if (isDashboardRoute && isTrialExpired) {
    const expiredUrl = new URL('/trial-expirado', request.url)
    return NextResponse.redirect(expiredUrl)
  }

  // 4. Se estiver logado e com trial ativo, não deixar acessar /login ou /cadastro
  if (isAuthRoute && session) {
    if (!isTrialExpired) {
      const dashboardUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(dashboardUrl)
    }
    // Se o trial estiver expirado, permite acessar /login para poder entrar com outra conta ou admin
  }

  // 5. Se acessar /trial-expirado mas não tem sessão
  if (isTrialExpiredRoute) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/cadastro', '/trial-expirado'],
}
