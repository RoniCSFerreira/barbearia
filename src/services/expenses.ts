'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { decimalToNumber } from '@/lib/utils'
import { TransactionCategory, TransactionType } from '@prisma/client'
import { startOfDay, endOfDay, format, parseISO } from 'date-fns'

export interface ExpenseItem {
  id: string
  description: string
  value: number
  category: string
  createdAt: string
  date: string
}

const CATEGORY_MAP: Record<string, TransactionCategory> = {
  Insumos: TransactionCategory.SUPPLIES,
  Equipamentos: TransactionCategory.EQUIPMENT,
  Limpeza: TransactionCategory.OTHER,
  Alimentação: TransactionCategory.OTHER,
  Outros: TransactionCategory.OTHER,
}

const REVERSE_CATEGORY_MAP: Record<TransactionCategory, string> = {
  [TransactionCategory.SUPPLIES]: 'Insumos',
  [TransactionCategory.EQUIPMENT]: 'Equipamentos',
  [TransactionCategory.RENT]: 'Outros',
  [TransactionCategory.SERVICE]: 'Serviço',
  [TransactionCategory.OTHER]: 'Outros',
}

/**
 * Busca despesas registradas em uma data específica
 */
export async function getExpensesForDate(targetDate: Date = new Date()): Promise<ExpenseItem[]> {
  let user: any = null
  try {
    user = await getCurrentUser()
  } catch {}

  const barber = user || (await db.user.findFirst({ include: { organization: true }, orderBy: { created_at: 'desc' } }))

  if (!barber || !barber.organization_id) return []

  const dayStart = startOfDay(targetDate)
  const dayEnd = endOfDay(targetDate)

  const expenses = await db.transaction.findMany({
    where: {
      organization_id: barber.organization_id,
      type: TransactionType.EXPENSE,
      created_at: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  })

  return expenses.map((e) => ({
    id: e.id,
    description: e.description || 'Despesa sem descrição',
    value: decimalToNumber(e.amount),
    category: REVERSE_CATEGORY_MAP[e.category] || 'Outros',
    createdAt: format(e.created_at, 'HH:mm'),
    date: format(e.created_at, 'yyyy-MM-dd'),
  }))
}

/**
 * Busca despesas registradas hoje
 */
export async function getExpensesForToday(): Promise<ExpenseItem[]> {
  return getExpensesForDate(new Date())
}

/**
 * Cria uma nova despesa no banco de dados, com opção de definir a data
 */
export async function createExpense(data: {
  description: string
  value: number
  category: string
  date?: string // YYYY-MM-DD
}) {
  let user: any = null
  try {
    user = await getCurrentUser()
  } catch {}

  const barber = user || (await db.user.findFirst({ include: { organization: true }, orderBy: { created_at: 'desc' } }))

  if (!barber || !barber.organization_id) {
    throw new Error('Organização ou usuário não encontrado')
  }

  const categoryEnum = CATEGORY_MAP[data.category] || TransactionCategory.OTHER

  let createdAtDate = new Date()
  if (data.date) {
    const parsed = parseISO(data.date)
    const now = new Date()
    parsed.setHours(now.getHours(), now.getMinutes(), now.getSeconds())
    createdAtDate = parsed
  }

  const expense = await db.transaction.create({
    data: {
      organization_id: barber.organization_id,
      user_id: barber.id,
      type: TransactionType.EXPENSE,
      category: categoryEnum,
      amount: data.value,
      description: data.description.trim(),
      created_at: createdAtDate,
    },
  })

  return {
    success: true,
    expense: {
      id: expense.id,
      description: expense.description || data.description,
      value: decimalToNumber(expense.amount),
      category: data.category,
      createdAt: format(expense.created_at, 'HH:mm'),
      date: format(expense.created_at, 'yyyy-MM-dd'),
    },
  }
}

/**
 * Exclui uma despesa do banco de dados
 */
export async function deleteExpense(id: string) {
  try {
    await db.transaction.delete({
      where: { id },
    })
    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir despesa:', error)
    return { success: false }
  }
}
