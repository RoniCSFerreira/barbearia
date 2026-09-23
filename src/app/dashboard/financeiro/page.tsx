'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Scissors,
  Calendar,
  Loader2,
} from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import {
  getFinancialSummaryByPeriod,
  type FinancialPeriod,
  type PeriodFinancialSummary,
} from '@/services/financial'
import FinancialPeriodSelector from '@/components/dashboard/FinancialPeriodSelector'
import FinancialBarChart from '@/components/dashboard/FinancialBarChart'
import FinancialDonutChart from '@/components/dashboard/FinancialDonutChart'

export default function FinanceiroPage() {
  const [period, setPeriod] = useState<FinancialPeriod>('month')
  const [customStart, setCustomStart] = useState<string | undefined>()
  const [customEnd, setCustomEnd] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PeriodFinancialSummary | null>(null)

  const fetchSummary = async (p: FinancialPeriod, start?: string, end?: string) => {
    setLoading(true)
    try {
      const summary = await getFinancialSummaryByPeriod({
        period: p,
        customStartDate: start,
        customEndDate: end,
      })
      setData(summary)
    } catch (err) {
      console.error('Erro ao buscar resumo financeiro:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary(period, customStart, customEnd)
  }, [period, customStart, customEnd])

  const handlePeriodChange = (newPeriod: FinancialPeriod, start?: string, end?: string) => {
    setPeriod(newPeriod)
    setCustomStart(start)
    setCustomEnd(end)
  }

  const grossRevenue = data?.grossRevenue ?? 0
  const salonCommission = data?.salonCommission ?? 0
  const operationalExpenses = data?.operationalExpenses ?? 0
  const netProfit = data?.netProfit ?? 0
  const commissionRate = data?.commissionRate ?? 0
  const goalAmount = data?.goalAmount ?? 15000
  const completedAppts = data?.completedAppointmentsCount ?? 0
  const ticketAverage = data?.ticketAverage ?? 0

  const goalPct = goalAmount > 0 ? Math.min(Math.round((grossRevenue / goalAmount) * 100), 100) : 100

  const periodLabelMap: Record<FinancialPeriod, string> = {
    today: 'hoje',
    week: 'esta semana',
    month: 'este mês',
    year: 'este ano',
    custom: `de ${data?.startDate || ''} até ${data?.endDate || ''}`,
  }

  const summaryCards = [
    {
      label: 'Faturamento Bruto',
      value: formatCurrency(grossRevenue),
      icon: DollarSign,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      label: `Repasse ao Salão (${commissionRate}%)`,
      value: formatCurrency(salonCommission),
      icon: TrendingDown,
      color: 'text-danger',
      bg: 'bg-danger/10',
    },
    {
      label: 'Gastos Operacionais',
      value: formatCurrency(operationalExpenses),
      icon: Scissors,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      label: 'Lucro Líquido',
      value: formatCurrency(netProfit),
      icon: TrendingUp,
      color: 'text-success',
      bg: 'bg-success/10',
    },
  ]

  return (
    <div className="min-h-screen bg-background p-4 space-y-5 max-w-4xl mx-auto animate-fade-in pb-12">
      {/* Botão Voltar */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Dashboard
      </Link>

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Gestão Financeira</h1>
            <p className="text-xs text-text-muted">
              Visão detalhada dos ganhos e faturamentos ({periodLabelMap[period]})
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-accent">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Atualizando...</span>
          </div>
        )}
      </div>

      {/* Seletor de Período (Pílulas + Customizado) */}
      <FinancialPeriodSelector
        selectedPeriod={period}
        startDate={customStart}
        endDate={customEnd}
        onPeriodChange={handlePeriodChange}
      />

      {/* Cards Principais de Totais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="card p-3.5 sm:p-4 space-y-2 min-w-0 overflow-hidden hover:border-border-accent transition-colors">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', card.bg)}>
              <card.icon className={cn('w-4 h-4', card.color)} />
            </div>
            <p className="text-2xs text-text-muted uppercase tracking-wider leading-tight font-semibold truncate">
              {card.label}
            </p>
            <p className={cn('text-base sm:text-lg lg:text-xl font-black tabular-nums truncate', card.color)}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Gráfico Principal de Colunas (Receita vs Despesas) */}
      {data && (
        <FinancialBarChart
          data={data.timeSeries}
          title={`Faturamento vs Gastos (${periodLabelMap[period]})`}
        />
      )}

      {/* Grid de 2 colunas: Meta + Gráfico Donut de Despesas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
        {/* Meta do Período */}
        <div className="card p-4 sm:p-5 space-y-4 flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-bold text-text-primary">Meta do Período</h3>
              </div>
              <span
                className={cn(
                  'text-xs font-bold tabular-nums px-2 py-0.5 rounded-full border',
                  goalPct >= 100
                    ? 'bg-success/10 text-success border-success/20'
                    : goalPct >= 60
                    ? 'bg-accent/10 text-accent border-accent/20'
                    : 'bg-warning/10 text-warning border-warning/20'
                )}
              >
                {goalPct}%
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-text-muted">
                <span>Arrecadados: {formatCurrency(grossRevenue)}</span>
                <span>Meta: {formatCurrency(goalAmount)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-surface-2 border border-border overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    goalPct >= 100
                      ? 'bg-success'
                      : goalPct >= 60
                      ? 'bg-gradient-accent'
                      : 'bg-warning'
                  )}
                  style={{ width: `${goalPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
            <div className="text-center">
              <p className="text-lg font-black text-text-primary tabular-nums">
                {formatCurrency(ticketAverage)}
              </p>
              <p className="text-2xs text-text-muted">Ticket Médio</p>
            </div>
            <div className="text-center border-l border-border">
              <p className="text-lg font-black text-text-primary tabular-nums">
                {completedAppts}
              </p>
              <p className="text-2xs text-text-muted">Atendimentos Concluídos</p>
            </div>
          </div>
        </div>

        {/* Gráfico Donut de Despesas por Categoria */}
        {data && (
          <FinancialDonutChart
            items={data.expenseBreakdown}
            title="Categorias de Gastos"
            centerLabel="Gastos"
            centerValue={formatCurrency(operationalExpenses)}
          />
        )}
      </div>

      {/* Gráfico Donut de Distribuição por Serviço / Origem */}
      {data && (
        <FinancialDonutChart
          items={data.incomeBreakdown}
          title="Faturamento por Tipo de Serviço"
          centerLabel="Receita"
          centerValue={formatCurrency(grossRevenue)}
        />
      )}
    </div>
  )
}
