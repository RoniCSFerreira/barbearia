import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { db } from './db'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'barbearia-secret-key-super-segura-2026-solo'
)

export const SESSION_COOKIE = 'barbearia_session'

export interface SessionPayload {
  userId: string
  orgId: string
  email: string
  name: string
  status: string
  trialEndsAt?: string | null
}

/**
 * Gera hash seguro da senha usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

/**
 * Valida a senha contra o hash armazenado
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Assina um JWT para sessão com duração de 7 dias
 */
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

/**
 * Verifica e decodifica o JWT da sessão
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

/**
 * Define o cookie de sessão seguro no navegador
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/',
  })
}

/**
 * Remove o cookie de sessão (Logout)
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

/**
 * Obtém os dados do usuário autenticado no servidor
 */
export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await verifySessionToken(token)
  if (!session?.userId) return null

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { organization: true },
  })

  if (!user) return null

  const adminEmail = (process.env.ADMIN_EMAIL || 'rcsfempresa@gmail.com').toLowerCase()
  const isAdmin = user.email.toLowerCase() === adminEmail || user.role === 'ADMIN'

  // Verifica se o trial expirou
  const isTrial = user.status === 'TRIAL'
  const isExpired = !isAdmin && isTrial && user.trial_ends_at ? new Date() > new Date(user.trial_ends_at) : false

  return {
    ...user,
    isTrial,
    isExpired,
    isAdmin,
  }
}
