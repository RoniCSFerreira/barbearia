'use server'

import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  setSessionCookie,
  clearSessionCookie,
} from '@/lib/auth'

export interface AuthActionResult {
  error?: string
  success?: boolean
}

/** Gera um slug limpo para URL da barbearia */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

/**
 * Cadastro do Barbeiro Solo:
 * Cria o negócio (Organization) e o usuário (User) com 3 dias de trial gratuito
 */
export async function registerBarberAction(formData: FormData): Promise<AuthActionResult> {
  const name = formData.get('name')?.toString().trim()
  const salonName = formData.get('salonName')?.toString().trim()
  const phone = formData.get('phone')?.toString().trim()
  const email = formData.get('email')?.toString().trim().toLowerCase()
  const password = formData.get('password')?.toString()

  if (!name || !salonName || !email || !password) {
    return { error: 'Por favor, preencha todos os campos obrigatórios.' }
  }

  if (password.length < 6) {
    return { error: 'A senha deve conter no mínimo 6 caracteres.' }
  }

  // Verificar se o e-mail já está em uso
  const existingUser = await db.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    return { error: 'Este e-mail já está cadastrado. Tente fazer login.' }
  }

  try {
    // Gerar slug único
    let baseSlug = slugify(salonName) || 'barbearia'
    let uniqueSlug = baseSlug
    let counter = 1

    while (await db.organization.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter}`
      counter++
    }

    const hashedPassword = await hashPassword(password)
    
    // Período de teste: 3 dias a partir de agora
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 3)

    // Cria Organização e Usuário em transação atômica
    const { organization, user } = await db.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: salonName,
          slug: uniqueSlug,
          commission_rate: 0,
        },
      })

      const u = await tx.user.create({
        data: {
          organization_id: org.id,
          name,
          email,
          phone: phone || null,
          password_hash: hashedPassword,
          role: 'OWNER',
          status: 'TRIAL',
          trial_ends_at: trialEndsAt,
          commission_rate: 0,
        },
      })

      // Cria alguns serviços padrão para agilizar o uso
      await tx.service.createMany({
        data: [
          {
            organization_id: org.id,
            name: 'Corte Cabelo',
            price: 45.0,
            duration_minutes: 35,
          },
          {
            organization_id: org.id,
            name: 'Barba Terapia',
            price: 35.0,
            duration_minutes: 30,
          },
          {
            organization_id: org.id,
            name: 'Combo Cabelo + Barba',
            price: 70.0,
            duration_minutes: 55,
          },
        ],
      })

      return { organization: org, user: u }
    })

    // Gera o token de sessão
    const token = await signSessionToken({
      userId: user.id,
      orgId: organization.id,
      email: user.email,
      name: user.name,
      status: user.status,
      trialEndsAt: user.trial_ends_at?.toISOString() || null,
    })

    await setSessionCookie(token)
  } catch (err) {
    console.error('Erro ao cadastrar barbeiro:', err)
    return { error: 'Ocorreu um erro ao criar sua conta. Tente novamente.' }
  }

  redirect('/dashboard')
}

/**
 * Login do Barbeiro com e-mail e senha
 */
export async function loginBarberAction(formData: FormData): Promise<AuthActionResult> {
  const email = formData.get('email')?.toString().trim().toLowerCase()
  const password = formData.get('password')?.toString()

  if (!email || !password) {
    return { error: 'Informe seu e-mail e senha.' }
  }

  const user = await db.user.findUnique({
    where: { email },
    include: { organization: true },
  })

  if (!user || !user.password_hash) {
    return { error: 'E-mail ou senha incorretos.' }
  }

  const isPasswordValid = await verifyPassword(password, user.password_hash)
  if (!isPasswordValid) {
    return { error: 'E-mail ou senha incorretos.' }
  }

  if (user.status === 'SUSPENDED') {
    return {
      error: 'Seu acesso está temporariamente suspenso. Entre em contato pelo WhatsApp com o administrador.',
    }
  }

  const token = await signSessionToken({
    userId: user.id,
    orgId: user.organization_id,
    email: user.email,
    name: user.name,
    status: user.status,
    trialEndsAt: user.trial_ends_at?.toISOString() || null,
  })

  await setSessionCookie(token)

  redirect('/dashboard')
}

/**
 * Logout do Barbeiro
 */
export async function logoutBarberAction() {
  await clearSessionCookie()
  redirect('/login')
}
