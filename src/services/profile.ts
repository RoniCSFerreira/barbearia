'use server'

import { db } from '@/lib/db'
import { decimalToNumber } from '@/lib/utils'

export type CommissionRate = 0 | 10 | 20 | 30 | 40 | 50

const COMMISSION_OPTIONS: CommissionRate[] = [0, 10, 20, 30, 40, 50]

/**
 * Valida se o valor é uma taxa de repasse permitida.
 */
function isValidCommissionRate(rate: number): rate is CommissionRate {
  return (COMMISSION_OPTIONS as number[]).includes(rate)
}

/**
 * Atualiza a taxa de repasse do barbeiro.
 * Valores permitidos: 0, 10, 20, 30, 40, 50.
 * 0 significa sem repasse (barbeiro autônomo sem salão).
 */
export async function updateCommissionRate(
  userId: string,
  rate: number,
): Promise<{ success: boolean; message: string; commissionRate: CommissionRate }> {
  if (!isValidCommissionRate(rate)) {
    throw new Error(
      `Taxa inválida: ${rate}. Use um dos valores: ${COMMISSION_OPTIONS.join(', ')}`
    )
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: { commission_rate: rate },
    select: { commission_rate: true },
  })

  return {
    success: true,
    message: rate === 0
      ? 'Repasse removido. Você fica com 100% do faturamento.'
      : `Repasse de ${rate}% ao salão configurado com sucesso.`,
    commissionRate: decimalToNumber(updated.commission_rate) as CommissionRate,
  }
}

/**
 * Busca o perfil completo do barbeiro para a página de configurações.
 */
export async function getBarberProfile(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      commission_rate: true,
      created_at: true,
      organization: {
        select: { name: true, slug: true },
      },
    },
  })

  if (!user) throw new Error(`Usuário não encontrado: ${userId}`)

  return {
    ...user,
    commission_rate: decimalToNumber(user.commission_rate) as CommissionRate,
  }
}
