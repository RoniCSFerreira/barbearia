'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { UserStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

export interface BarberAdminItem {
  id: string
  name: string
  email: string
  phone: string | null
  salonName: string
  salonSlug: string
  status: UserStatus
  role: string
  trialEndsAt: string | null
  createdAt: string
  isExpired: boolean
}

/**
 * Valida se o usuário conectado possui permissões de Administrador
 */
async function verifyAdminAuth() {
  const user = await getCurrentUser()
  if (!user || !user.isAdmin) {
    throw new Error('Acesso negado. Apenas o administrador da plataforma tem permissão.')
  }
  return user
}

/**
 * Busca a lista completa de barbeiros e barbearias cadastradas para o painel admin
 */
export async function getAdminBarbersAction(): Promise<BarberAdminItem[]> {
  await verifyAdminAuth()

  const users = await db.user.findMany({
    include: {
      organization: true,
    },
    orderBy: {
      created_at: 'desc',
    },
  })

  const now = new Date()

  return users.map((u) => {
    const isTrial = u.status === 'TRIAL'
    const isExpired = isTrial && u.trial_ends_at ? now > u.trial_ends_at : false

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      salonName: u.organization?.name || 'Sem Barbearia',
      salonSlug: u.organization?.slug || '',
      status: u.status,
      role: u.role,
      trialEndsAt: u.trial_ends_at ? u.trial_ends_at.toISOString() : null,
      createdAt: u.created_at.toISOString(),
      isExpired,
    }
  })
}

/**
 * Ativa ou renova a assinatura paga do barbeiro por N dias (padrão: 30 dias).
 * Se a assinatura/teste já estiver vencida, os 30 dias começam a valer a partir de HOJE.
 */
export async function activateUserSubscriptionAction(userId: string, days: number = 30) {
  await verifyAdminAuth()

  const user = await db.user.findUnique({
    where: { id: userId },
  })

  if (!user) throw new Error('Barbeiro não encontrado')

  const now = new Date()
  let baseDate = now

  // Se o vencimento for no futuro, acumula os 30 dias a partir da data futura
  if (user.trial_ends_at && user.trial_ends_at > now) {
    baseDate = new Date(user.trial_ends_at)
  }

  const newExpiration = new Date(baseDate)
  newExpiration.setDate(newExpiration.getDate() + days)

  await db.user.update({
    where: { id: userId },
    data: {
      status: UserStatus.ACTIVE,
      trial_ends_at: newExpiration,
    },
  })

  revalidatePath('/admin/usuarios')
  revalidatePath('/dashboard')

  return { success: true, newExpiration: newExpiration.toISOString() }
}

/**
 * Prorroga o período de teste grátis por N dias (padrão: 3 dias)
 */
export async function extendUserTrialAction(userId: string, days: number = 3) {
  await verifyAdminAuth()

  const now = new Date()
  const newExpiration = new Date(now)
  newExpiration.setDate(newExpiration.getDate() + days)

  await db.user.update({
    where: { id: userId },
    data: {
      status: UserStatus.TRIAL,
      trial_ends_at: newExpiration,
    },
  })

  revalidatePath('/admin/usuarios')
  revalidatePath('/dashboard')

  return { success: true, newExpiration: newExpiration.toISOString() }
}

/**
 * Suspende o acesso do barbeiro por falta de pagamento ou descumprimento
 */
export async function suspendUserAction(userId: string) {
  await verifyAdminAuth()

  await db.user.update({
    where: { id: userId },
    data: {
      status: UserStatus.SUSPENDED,
    },
  })

  revalidatePath('/admin/usuarios')
  revalidatePath('/dashboard')

  return { success: true }
}

/**
 * Remove a conta do barbeiro e sua organização
 */
export async function deleteUserAccountAction(userId: string) {
  await verifyAdminAuth()

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { organization_id: true },
  })

  if (!user) throw new Error('Barbeiro não encontrado')

  // Remove em transação a organização (que por cascade exclui o usuário e serviços)
  await db.$transaction(async (tx) => {
    await tx.user.delete({ where: { id: userId } })
    if (user.organization_id) {
      // Exclui a org se não tiver outros usuários
      const count = await tx.user.count({ where: { organization_id: user.organization_id } })
      if (count === 0) {
        await tx.organization.delete({ where: { id: user.organization_id } })
      }
    }
  })

  revalidatePath('/admin/usuarios')
  return { success: true }
}

/**
 * Reseta a senha do usuário e gera uma nova senha aleatória de 6 dígitos
 */
export async function resetUserPasswordAction(userId: string) {
  await verifyAdminAuth()

  const user = await db.user.findUnique({
    where: { id: userId },
  })

  if (!user) throw new Error('Barbeiro não encontrado')

  // Gera senha de 6 números
  const newPassword = Math.floor(100000 + Math.random() * 900000).toString()
  const password_hash = await bcrypt.hash(newPassword, 10)

  await db.user.update({
    where: { id: userId },
    data: { password_hash },
  })

  return { success: true, newPassword }
}
