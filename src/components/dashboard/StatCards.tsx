import Link from 'next/link'
import { Calendar, TrendingUp, ShoppingBag, Percent, ArrowRight } from 'lucide-react'
import { mockFinancial, mockStats } from '@/lib/mock-data'
import { formatCurrency } from '@/lib/utils'
import type { DailyFinancialSummary } from '@/services/financial'
import type { AppointmentItem } from '@/services/appointments'

interface StatCardsProps {
  initialFinancial?: DailyFinancialSummary | null
  initialAppointments?: AppointmentItem[]
}

function StatCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="stat-card group cursor-default">
      {children}
    </div>
  )
}

export default function StatCards({ initialFinancial, initialAppointments }: StatCardsProps) {
  const grossRevenue = initialFinancial ? initialFinancial.grossRevenue : mockFinancial.grossRevenue
  const salonCommission = initialFinancial ? initialFinancial.salonCommission : (mockFinancial.grossRevenue * (mockFinancial.commissionRate / 100))
  const operationalExpenses = initialFinancial ? initialFinancial.operationalExpenses : mockFinancial.operationalExpenses
  const netProfit = initialFinancial ? initialFinancial.netProfit : (mockFinancial.grossRevenue - salonCommission - mockFinancial.operationalExpenses)
  const hasCommission = initialFinancial ? initialFinancial.hasCommission : false
  const commissionRate = initialFinancial ? initialFinancial.commissionRate : 0

  const totalAppointments = initialAppointments ? initialAppointments.length : mockStats.totalAppointments
  const done = initialAppointments ? initialAppointments.filter(a => a.status === 'DONE').length : mockStats.done
  const inProgress = initialAppointments ? initialAppointments.filter(a => (a.status as string) === 'IN_PROGRESS' || a.status === 'CONFIRMED').length : mockStats.inProgress
  const remaining = initialAppointments ? initialAppointments.filter(a => a.status !== 'DONE' && a.status !== 'CANCELED').length : mockStats.remaining
  const occupancyRate = totalAppointments > 0 ? Math.round((done / totalAppointments) * 100) : (mockStats.occupancyRate || 0)

  const ticketAverage = done > 0 ? grossRevenue / done : 60
  const goalAmount = 600
  const goalPercent = Math.round((grossRevenue / goalAmount) * 100)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">

      {/* Card 1 — Agendamentos */}
      <StatCard>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-accent/10">
              <Calendar className="w-3.5 h-3.5 text-accent" />
            </div>
            <span className="text-2xs font-semibold text-text-muted uppercase tracking-wider">
              Agendamentos do Dia
            </span>
          </div>
          <span className="badge bg-accent/20 text-accent text-2xs font-bold">
            {occupancyRate}% OCUPAÇÃO
          </span>
        </div>

        <div className="mt-3">
          <p className="text-4xl font-black text-text-primary tabular-nums">
            {totalAppointments}
          </p>
          <p className="text-xs text-text-muted mt-0.5">cortes marcados hoje</p>
        </div>

        <div className="flex items-center gap-3 mt-3 text-2xs">
          <div className="text-center">
            <p className="text-success font-bold text-sm">{done}</p>
            <p className="text-text-muted uppercase">Concluídos</p>
          </div>
          <div className="w-px h-6 bg-border" />
          <div className="text-center">
            <p className="text-accent font-bold text-sm">{inProgress}</p>
            <p className="text-text-muted uppercase">Em Corte</p>
          </div>
          <div className="w-px h-6 bg-border" />
          <div className="text-center">
            <p className="text-text-secondary font-bold text-sm">{remaining}</p>
            <p className="text-text-muted uppercase">Restantes</p>
          </div>
        </div>

        <Link href="/dashboard/agenda" className="mt-3 inline-flex items-center gap-1 text-2xs text-accent hover:text-accent-hover transition-colors group-hover:gap-2">
          <span>Ver Minha Agenda</span>
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </StatCard>

      {/* Card 2 — Ganhos */}
      <StatCard>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-success/10">
              <TrendingUp className="w-3.5 h-3.5 text-success" />
            </div>
            <span className="text-2xs font-semibold text-text-muted uppercase tracking-wider">
              Ganhos & Faturamento
            </span>
          </div>
          <span className="badge badge-success">CAIXA DO DIA</span>
        </div>

        <div className="mt-3">
          <p className="text-3xl font-black text-text-primary tabular-nums">
            {formatCurrency(grossRevenue)}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            Ticket Médio: {formatCurrency(ticketAverage)} / cliente
          </p>
        </div>

        <div className="mt-3 space-y-1.5">
          <div className="w-full h-1.5 bg-surface-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-accent rounded-full transition-all duration-500"
              style={{ width: `${Math.min(goalPercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-2xs text-text-muted">
            <span>Meta: {formatCurrency(goalAmount)}</span>
            <span className="text-accent font-semibold">{goalPercent}% atingido</span>
          </div>
        </div>

        <Link href="/dashboard/financeiro" className="mt-2 inline-flex items-center gap-1 text-2xs text-accent hover:text-accent-hover transition-colors group-hover:gap-2">
          <span>Ver Extrato de Ganhos</span>
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </StatCard>

      {/* Card 3 — Gastos */}
      <StatCard>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-danger/10">
              <ShoppingBag className="w-3.5 h-3.5 text-danger" />
            </div>
            <span className="text-2xs font-semibold text-text-muted uppercase tracking-wider">
              Gastos & Despesas
            </span>
          </div>
          <span className="badge badge-danger">SAÍDAS</span>
        </div>

        <div className="mt-3">
          <p className="text-3xl font-black text-text-primary tabular-nums">
            {formatCurrency(operationalExpenses)}
          </p>
          <p className="text-xs text-text-muted mt-0.5">Lâminas, pomadas e insumos</p>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-danger" />
          <span className="text-danger font-medium">Insumos & Reposição</span>
          <span className="text-text-secondary">• Registro em tempo real</span>
        </div>

        <Link href="/dashboard/gastos" className="mt-3 inline-flex items-center gap-1 text-2xs text-accent hover:text-accent-hover transition-colors group-hover:gap-2">
          <span>Gerenciar Gastos</span>
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </StatCard>

      {/* Card 4 — Lucro Líquido */}
      <StatCard>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-accent/10">
              <Percent className="w-3.5 h-3.5 text-accent" />
            </div>
            <span className="text-2xs font-semibold text-text-muted uppercase tracking-wider">
              Lucro Líquido Real
            </span>
          </div>
          {hasCommission && (
            <span className="badge bg-accent-muted text-accent">
              Repasse: {commissionRate}%
            </span>
          )}
        </div>

        <div className="mt-3">
          <p className="text-3xl font-black text-text-primary tabular-nums">
            {formatCurrency(netProfit)}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {hasCommission
              ? `Bruto - Repasse ao Salão (${formatCurrency(salonCommission)}) - Despesas`
              : 'Faturamento Bruto menos Despesas'}
          </p>
        </div>

        <div className="mt-3 space-y-1 text-xs">
          {hasCommission && (
            <div className="flex justify-between">
              <span className="text-text-muted">Repasse ao Salão ({commissionRate}%):</span>
              <span className="text-text-secondary font-semibold tabular-nums">
                {formatCurrency(salonCommission)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-text-muted">Despesas:</span>
            <span className="text-text-secondary font-semibold tabular-nums">
              {formatCurrency(operationalExpenses)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="text-success font-semibold">Margem Líquida</span>
            <span className="text-text-muted">✓ Atualizado</span>
          </div>
        </div>
      </StatCard>
    </div>
  )
}
