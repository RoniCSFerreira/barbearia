'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { decimalToNumber } from '@/lib/utils'
import { TransactionType, TransactionCategory } from '@prisma/client'
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
  eachDayOfInterval,
  parseISO,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

export type FinancialPeriod = 'today' | 'week' | 'month' | 'year' | 'custom'

export interface TimeSeriesPoint {
  label: string
  income: number
  expense: number
}

export interface CategoryBreakdown {
  category: string
  amount: number
  percentage: number
  color: string
}

export interface DailyFinancialSummary {
  date: Date
  /** Soma de todas as transações INCOME no dia */
  grossRevenue: number
  /**
   * Repasse ao salão = Faturamento Bruto × (commission_rate / 100).
   * Será 0 se o barbeiro não tiver repasse configurado.
   */
  salonCommission: number
  /** Soma de todas as transações EXPENSE no dia */
  operationalExpenses: number
  /** Lucro Líquido = Bruto - Repasse - Despesas */
  netProfit: number
  /** Taxa de repasse configurada pelo barbeiro (0 = sem repasse) */
  commissionRate: number
  /** true quando o barbeiro tem repasse > 0 configurado */
  hasCommission: boolean
  transactionCount: number
}

export interface PeriodFinancialSummary {
  period: FinancialPeriod
  startDate: string
  endDate: string
  grossRevenue: number
  salonCommission: number
  operationalExpenses: number
  netProfit: number
  commissionRate: number
  hasCommission: boolean
  transactionCount: number
  ticketAverage: number
  completedAppointmentsCount: number
  goalAmount: number
  timeSeries: TimeSeriesPoint[]
  expenseBreakdown: CategoryBreakdown[]
  incomeBreakdown: CategoryBreakdown[]
}

const CATEGORY_NAMES: Record<string, string> = {
  SUPPLIES: 'Insumos & Produtos',
  EQUIPMENT: 'Equipamentos',
  RENT: 'Aluguel / Cadeira',
  SERVICE: 'Serviços',
  OTHER: 'Outros Gastos',
}

const CATEGORY_COLORS: Record<string, string> = {
  SUPPLIES: '#5B63F6',
  EQUIPMENT: '#00D2FF',
  RENT: '#F59E0B',
  SERVICE: '#10B981',
  OTHER: '#F43F5E',
}

// ─────────────────────────────────────────────────────────────
// SERVER ACTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Calcula o resumo financeiro diário do barbeiro.
 */
export async function getDailyFinancialSummary(
  userId: string,
  organizationId: string,
  date: Date,
): Promise<DailyFinancialSummary> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { commission_rate: true },
  })

  if (!user) throw new Error(`Usuário não encontrado: ${userId}`)

  const commissionRate = decimalToNumber(user.commission_rate)
  const hasCommission = commissionRate > 0

  const dayStart = startOfDay(date)
  const dayEnd   = endOfDay(date)

  const transactions = await db.transaction.findMany({
    where: {
      user_id:         userId,
      organization_id: organizationId,
      created_at: { gte: dayStart, lte: dayEnd },
    },
    select: { type: true, amount: true },
  })

  const grossRevenue = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + decimalToNumber(t.amount), 0)

  const operationalExpenses = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + decimalToNumber(t.amount), 0)

  const salonCommission = hasCommission
    ? grossRevenue * (commissionRate / 100)
    : 0

  const netProfit = grossRevenue - salonCommission - operationalExpenses

  return {
    date,
    grossRevenue:        parseFloat(grossRevenue.toFixed(2)),
    salonCommission:     parseFloat(salonCommission.toFixed(2)),
    operationalExpenses: parseFloat(operationalExpenses.toFixed(2)),
    netProfit:           parseFloat(netProfit.toFixed(2)),
    commissionRate,
    hasCommission,
    transactionCount:    transactions.length,
  }
}

/**
 * Busca o resumo financeiro de hoje do barbeiro principal
 */
export async function getTodayFinancialSummary(): Promise<DailyFinancialSummary> {
  let barber: any = null
  try {
    barber = await getCurrentUser()
  } catch {}

  if (!barber) {
    barber = await db.user.findFirst({
      include: { organization: true },
      orderBy: { created_at: 'desc' },
    })
  }

  if (!barber || !barber.organization_id) {
    throw new Error('Organização ou usuário não encontrado')
  }

  return getDailyFinancialSummary(barber.id, barber.organization_id, new Date())
}

/**
 * Busca o resumo financeiro dinâmico por período (Hoje, Semana, Mês, Ano ou Customizado)
 */
export async function getFinancialSummaryByPeriod(params: {
  period: FinancialPeriod
  customStartDate?: string
  customEndDate?: string
}): Promise<PeriodFinancialSummary> {
  let user: any = null
  try {
    user = await getCurrentUser()
  } catch {}

  let orgId = user?.organization_id

  if (!user || !orgId) {
    const fallbackUser = await db.user.findFirst({
      include: { organization: true },
      orderBy: { created_at: 'desc' },
    })
    user = fallbackUser
    orgId = fallbackUser?.organization_id
  }

  const commissionRate = user ? decimalToNumber(user.commission_rate) : 0
  const hasCommission = commissionRate > 0

  const now = new Date()
  let start: Date
  let end: Date
  let goalAmount = 600

  switch (params.period) {
    case 'today':
      start = startOfDay(now)
      end = endOfDay(now)
      goalAmount = 600
      break
    case 'week':
      start = startOfWeek(now, { weekStartsOn: 1 }) // Segunda
      end = endOfWeek(now, { weekStartsOn: 1 })
      goalAmount = 3500
      break
    case 'year':
      start = startOfYear(now)
      end = endOfYear(now)
      goalAmount = 180000
      break
    case 'custom':
      start = params.customStartDate ? startOfDay(parseISO(params.customStartDate)) : startOfMonth(now)
      end = params.customEndDate ? endOfDay(parseISO(params.customEndDate)) : endOfMonth(now)
      goalAmount = 15000
      break
    case 'month':
    default:
      start = startOfMonth(now)
      end = endOfMonth(now)
      goalAmount = 15000
      break
  }

  let transactions: {
    id: string
    type: TransactionType
    category: TransactionCategory
    amount: any
    created_at: Date
    description: string | null
  }[] = []

  let completedAppointmentsCount = 0

  if (orgId && user) {
    transactions = await db.transaction.findMany({
      where: {
        organization_id: orgId,
        created_at: { gte: start, lte: end },
      },
      select: {
        id: true,
        type: true,
        category: true,
        amount: true,
        created_at: true,
        description: true,
      },
      orderBy: { created_at: 'asc' },
    })

    completedAppointmentsCount = await db.appointment.count({
      where: {
        organization_id: orgId,
        status: 'DONE',
        start_time: { gte: start, lte: end },
      },
    })
  }

  // Cálculos de totais
  let grossRevenue = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + decimalToNumber(t.amount), 0)

  let operationalExpenses = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + decimalToNumber(t.amount), 0)

  // Totais reais calculados do banco
  const salonCommission = hasCommission ? grossRevenue * (commissionRate / 100) : 0
  const netProfit = grossRevenue - salonCommission - operationalExpenses
  const ticketAverage = completedAppointmentsCount > 0 ? grossRevenue / completedAppointmentsCount : 0

  // ── Série Temporal para Gráfico de Barras ──
  const timeSeries: TimeSeriesPoint[] = []

  if (params.period === 'today') {
    const hours = [8, 10, 12, 14, 16, 18, 20]
    hours.forEach(h => {
      const label = `${h.toString().padStart(2, '0')}:00`
      const hIncome = transactions
        .filter(t => t.type === TransactionType.INCOME && t.created_at.getHours() >= h && t.created_at.getHours() < h + 2)
        .reduce((sum, t) => sum + decimalToNumber(t.amount), 0)
      const hExpense = transactions
        .filter(t => t.type === TransactionType.EXPENSE && t.created_at.getHours() >= h && t.created_at.getHours() < h + 2)
        .reduce((sum, t) => sum + decimalToNumber(t.amount), 0)
      timeSeries.push({ label, income: hIncome, expense: hExpense })
    })
  } else if (params.period === 'week') {
    const days = eachDayOfInterval({ start, end })
    days.forEach(d => {
      const label = format(d, 'eee', { locale: ptBR })
      const dStart = startOfDay(d)
      const dEnd = endOfDay(d)
      const dIncome = transactions
        .filter(t => t.type === TransactionType.INCOME && t.created_at >= dStart && t.created_at <= dEnd)
        .reduce((sum, t) => sum + decimalToNumber(t.amount), 0)
      const dExpense = transactions
        .filter(t => t.type === TransactionType.EXPENSE && t.created_at >= dStart && t.created_at <= dEnd)
        .reduce((sum, t) => sum + decimalToNumber(t.amount), 0)
      timeSeries.push({ label: label.toUpperCase(), income: dIncome, expense: dExpense })
    })
  } else if (params.period === 'year') {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    months.forEach((m, idx) => {
      const mIncome = transactions
        .filter(t => t.type === TransactionType.INCOME && t.created_at.getMonth() === idx)
        .reduce((sum, t) => sum + decimalToNumber(t.amount), 0)
      const mExpense = transactions
        .filter(t => t.type === TransactionType.EXPENSE && t.created_at.getMonth() === idx)
        .reduce((sum, t) => sum + decimalToNumber(t.amount), 0)
      timeSeries.push({ label: m, income: mIncome, expense: mExpense })
    })
  } else {
    // Month or Custom — agrupa por dias
    const days = eachDayOfInterval({ start, end })
    if (days.length <= 31) {
      const step = Math.max(1, Math.floor(days.length / 8))
      for (let i = 0; i < days.length; i += step) {
        const d = days[i]
        const label = format(d, 'dd/MM')
        const groupEnd = days[Math.min(i + step - 1, days.length - 1)]
        const gStart = startOfDay(d)
        const gEnd = endOfDay(groupEnd)
        const gIncome = transactions
          .filter(t => t.type === TransactionType.INCOME && t.created_at >= gStart && t.created_at <= gEnd)
          .reduce((sum, t) => sum + decimalToNumber(t.amount), 0)
        const gExpense = transactions
          .filter(t => t.type === TransactionType.EXPENSE && t.created_at >= gStart && t.created_at <= gEnd)
          .reduce((sum, t) => sum + decimalToNumber(t.amount), 0)
        timeSeries.push({ label, income: gIncome, expense: gExpense })
      }
    }
  }

  // ── Distribuição por Categorias de Gastos (Donut) ──
  const expenseMap: Record<string, number> = {}
  transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .forEach(t => {
      const cat = t.category || 'OTHER'
      expenseMap[cat] = (expenseMap[cat] || 0) + decimalToNumber(t.amount)
    })

  const totalExp = Object.values(expenseMap).reduce((a, b) => a + b, 0)
  const expenseBreakdown: CategoryBreakdown[] = totalExp > 0
    ? Object.entries(expenseMap).map(([cat, amount]) => ({
        category: CATEGORY_NAMES[cat] || cat,
        amount: parseFloat(amount.toFixed(2)),
        percentage: Math.round((amount / totalExp) * 100),
        color: CATEGORY_COLORS[cat] || '#94A3B8',
      }))
    : []

  // ── Distribuição por Receita (Serviços / Produtos) ──
  const incomeMap: Record<string, number> = {}
  transactions
    .filter(t => t.type === TransactionType.INCOME)
    .forEach(t => {
      const cat = t.category || 'SERVICE'
      incomeMap[cat] = (incomeMap[cat] || 0) + decimalToNumber(t.amount)
    })

  const totalInc = Object.values(incomeMap).reduce((a, b) => a + b, 0)
  const incomeBreakdown: CategoryBreakdown[] = totalInc > 0
    ? Object.entries(incomeMap).map(([cat, amount]) => ({
        category: CATEGORY_NAMES[cat] || (cat === 'SERVICE' ? 'Serviços & Cortes' : cat),
        amount: parseFloat(amount.toFixed(2)),
        percentage: Math.round((amount / totalInc) * 100),
        color: CATEGORY_COLORS[cat] || '#5B63F6',
      }))
    : []

  return {
    period: params.period,
    startDate: format(start, 'dd/MM/yyyy'),
    endDate: format(end, 'dd/MM/yyyy'),
    grossRevenue: parseFloat(grossRevenue.toFixed(2)),
    salonCommission: parseFloat(salonCommission.toFixed(2)),
    operationalExpenses: parseFloat(operationalExpenses.toFixed(2)),
    netProfit: parseFloat(netProfit.toFixed(2)),
    commissionRate,
    hasCommission,
    transactionCount: transactions.length,
    ticketAverage: parseFloat(ticketAverage.toFixed(2)),
    completedAppointmentsCount,
    goalAmount,
    timeSeries,
    expenseBreakdown,
    incomeBreakdown,
  }
}


