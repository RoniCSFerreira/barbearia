import type { Metadata } from 'next'
import Link from 'next/link'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, ArrowLeft } from 'lucide-react'
import StatCards from '@/components/dashboard/StatCards'
import CalendarWidget from '@/components/dashboard/CalendarWidget'
import ChairStatus from '@/components/dashboard/ChairStatus'
import NextAppointment from '@/components/dashboard/NextAppointment'
import QuickNav from '@/components/dashboard/QuickNav'
import AppointmentList from '@/components/dashboard/AppointmentList'
import { getAppointmentsForDate } from '@/services/appointments'
import { getDailyFinancialSummary } from '@/services/financial'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Dashboard | Visão Geral',
  description: 'Visão geral do dia — agendamentos, faturamento e lucro líquido.',
}

// Offset Brasil UTC-3: converte o horário UTC do servidor para o fuso local
const BRT_OFFSET_MS = 3 * 60 * 60 * 1000

export const dynamic = 'force-dynamic'

interface DashboardPageProps {
  searchParams?: Promise<{ data?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedParams = searchParams ? await searchParams : {}
  const dateParam = resolvedParams?.data

  // "Hoje" no fuso do Brasil (UTC-3): evita que às 23h Brasil o servidor
  // UTC já esteja no dia seguinte e mostre dados errados
  const serverNow = new Date()
  const brazilNow = new Date(serverNow.getTime() - BRT_OFFSET_MS)
  const todayStr = format(brazilNow, 'yyyy-MM-dd')

  let targetDateStr = todayStr
  let isCustomDate = false

  if (dateParam && typeof dateParam === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    targetDateStr = dateParam
    isCustomDate = targetDateStr !== todayStr
  }

  // Converte a string de data para um objeto Date local (sem conversão de timezone)
  const [ty, tm, td] = targetDateStr.split('-').map(Number)
  const targetDate = new Date(ty, tm - 1, td)

  // Barbeiro autenticado ou fallback
  const user = await getCurrentUser()
  const barber = user || (await db.user.findFirst({ include: { organization: true } }))

  const orgId = barber?.organization_id
  const barberId = barber?.id
  // Slug da organização para o link de agendamento dinâmico
  const orgSlug = (barber as any)?.organization?.slug ?? null

  const appointments = orgId ? await getAppointmentsForDate(targetDate, orgId) : []
  const financial =
    barberId && orgId ? await getDailyFinancialSummary(barberId, orgId, targetDateStr) : null

  const formattedTargetDate = targetDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-background p-4 space-y-4 animate-fade-in">
      {/* Banner quando navegando por outra data */}
      {isCustomDate && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-accent/10 border border-accent/25 text-xs text-accent">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-accent flex-shrink-0" />
            <span>
              Exibindo agendamentos de:{' '}
              <strong className="text-text-primary capitalize font-bold">
                {formattedTargetDate}
              </strong>
            </span>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-2 border border-border text-text-primary hover:border-accent/40 text-2xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Voltar para Hoje
          </Link>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <StatCards initialFinancial={financial} initialAppointments={appointments} />

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* Left column */}
        <div className="space-y-4">
          <CalendarWidget
            selectedDateStr={targetDateStr}
            todayStr={todayStr}
            dailyCount={appointments.length}
            organizationId={orgId}
          />
          <NextAppointment initialAppointments={appointments} organizationSlug={orgSlug} />
          <QuickNav organizationSlug={orgSlug} />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <ChairStatus initialAppointments={appointments} />
          <AppointmentList initialAppointments={appointments} />
        </div>
      </div>
    </div>
  )
}
