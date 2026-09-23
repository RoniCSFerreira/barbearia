'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Calendar, ChevronLeft, ChevronRight, CheckCircle, Clock,
  MessageCircle, Search, CalendarDays, RefreshCw
} from 'lucide-react'
import { type MockAppointment, type AppointmentStatus } from '@/lib/mock-data'
import { getAppointmentsForDate, completeAppointment } from '@/services/appointments'
import { generateWhatsAppLink } from '@/lib/links'
import { formatCurrency, cn } from '@/lib/utils'
import ClearAppointmentsModal from '@/components/dashboard/ClearAppointmentsModal'

type FilterType = 'TODOS' | 'CONFIRMED' | 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELED'

const FILTER_OPTIONS: { label: string; value: FilterType; color: string }[] = [
  { label: 'Todos',        value: 'TODOS',       color: 'text-text-primary' },
  { label: 'Em Corte',     value: 'IN_PROGRESS', color: 'text-success' },
  { label: 'Confirmados',  value: 'CONFIRMED',   color: 'text-accent' },
  { label: 'Pendentes',    value: 'PENDING',      color: 'text-warning' },
  { label: 'Concluídos',   value: 'DONE',        color: 'text-text-muted' },
]

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; badge: string }> = {
  IN_PROGRESS: { label: 'Em Corte',    badge: 'badge-success' },
  CONFIRMED:   { label: 'Confirmado',  badge: 'badge-accent' },
  PENDING:     { label: 'Pendente',    badge: 'bg-warning/20 text-warning border border-warning/30 badge' },
  DONE:        { label: 'Concluído',   badge: 'bg-surface-3 text-text-muted border border-border badge' },
  CANCELED:    { label: 'Cancelado',   badge: 'badge-danger' },
}

function AppointmentCard({
  appt,
  isFutureDate,
  onComplete,
}: {
  appt: MockAppointment
  isFutureDate?: boolean
  onComplete: (id: string) => void
}) {
  const isDone = appt.status === 'DONE'
  const isInProgress = appt.status === 'IN_PROGRESS'
  const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.CONFIRMED
  const whatsappUrl = generateWhatsAppLink(
    appt.clientPhone,
    `Olá ${appt.clientName}! Confirmando seu agendamento às ${appt.startTime} — ${appt.service}. Até breve! ✂️`
  )

  return (
    <div className={cn(
      'card p-4 space-y-3 transition-all duration-200',
      isInProgress && 'border-success/40 bg-success/5',
      isDone && 'opacity-60'
    )}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black',
            isInProgress ? 'bg-success text-white' : 'bg-accent text-accent-foreground'
          )}>
            {appt.barberInitials}
          </div>
          <div className="min-w-0">
            <p className={cn(
              'text-sm font-bold truncate',
              isDone ? 'text-text-muted line-through' : 'text-text-primary'
            )}>
              {appt.clientName}
            </p>
            <p className="text-xs text-text-muted truncate">{appt.service}</p>
          </div>
        </div>
        <span className={cn('text-2xs font-semibold flex-shrink-0 rounded-full px-2 py-0.5', cfg.badge)}>
          {cfg.label}
        </span>
      </div>

      {/* Info row */}
      <div className="flex items-center gap-4 text-xs text-text-muted">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span className="tabular-nums font-medium text-text-secondary">{appt.startTime} – {appt.endTime}</span>
        </div>
        {appt.paymentTag && (
          <>
            <span>·</span>
            <span className="text-accent font-medium">{appt.paymentTag}</span>
          </>
        )}
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
        <p className="text-sm font-black text-text-primary tabular-nums">
          {formatCurrency(appt.price)}
        </p>
        <div className="flex items-center gap-2">
          {appt.clientPhone && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/30 border border-[#25D366]/30 text-[#25D366] transition-all text-2xs font-semibold"
            >
              <MessageCircle className="w-3 h-3" />
              WhatsApp
            </a>
          )}
          {isDone ? (
            <button className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-success/10 text-success border border-success/20 text-2xs font-semibold cursor-default">
              <CheckCircle className="w-3 h-3" />
              Pago / Caixa
            </button>
          ) : isFutureDate ? (
            <button
              disabled
              title="Não é possível concluir cortes de datas futuras. Aguarde o dia do atendimento."
              className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-surface-3 text-text-muted border border-border text-2xs font-semibold opacity-60 cursor-not-allowed"
            >
              <Clock className="w-3 h-3" />
              Data Futura
            </button>
          ) : (
            <button
              onClick={() => onComplete(appt.id)}
              className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-accent/10 text-accent border border-accent/30 text-2xs font-semibold hover:bg-accent hover:text-accent-foreground transition-all duration-150 active:scale-95"
            >
              <CheckCircle className="w-3 h-3" />
              Concluir
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AgendaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Inicializa data baseada na query string ou hoje
  const dateParam = searchParams.get('data')
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const [y, m, d] = dateParam.split('-').map(Number)
      return new Date(y, m - 1, d)
    }
    return new Date()
  })

  const [appointments, setAppointments] = useState<MockAppointment[]>([])
  const [filter, setFilter] = useState<FilterType>('TODOS')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const loadAppointments = useCallback((date: Date) => {
    setLoading(true)
    getAppointmentsForDate(date)
      .then((data) => {
        if (data && data.length > 0) {
          const mapped: MockAppointment[] = data.map((a) => ({
            id: a.id,
            clientName: a.clientName,
            clientPhone: a.clientPhone || '',
            service: a.serviceName,
            price: a.price,
            startTime: a.startTime,
            endTime: a.endTime,
            status: a.status as AppointmentStatus,
            chairId: '1',
            barberName: 'Barbeiro',
            barberInitials: a.clientName.slice(0, 2).toUpperCase(),
            paymentTag: a.status === 'DONE' ? 'PIX PAGO' : undefined,
          }))
          setAppointments(mapped)
        } else {
          setAppointments([])
        }
      })
      .catch((err) => {
        console.error('Erro ao buscar agendamentos:', err)
        setAppointments([])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadAppointments(selectedDate)
  }, [selectedDate, loadAppointments])

  const changeDay = (delta: number) => {
    const next = new Date(selectedDate)
    next.setDate(next.getDate() + delta)
    setSelectedDate(next)
  }

  const setDateString = (iso: string) => {
    if (!iso) return
    const [y, m, d] = iso.split('-').map(Number)
    setSelectedDate(new Date(y, m - 1, d))
  }

  const goToday = () => {
    setSelectedDate(new Date())
  }

  const handleComplete = async (id: string) => {
    try {
      await completeAppointment(id)
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'DONE' as AppointmentStatus } : a))
      )
    } catch (err: any) {
      console.error('Erro ao concluir agendamento:', err)
      alert(err?.message || 'Erro ao concluir agendamento.')
    }
  }

  const filtered = appointments
    .filter((a) => filter === 'TODOS' || a.status === filter)
    .filter(
      (a) =>
        search === '' ||
        a.clientName.toLowerCase().includes(search.toLowerCase()) ||
        a.service.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const counts: Record<FilterType, number> = {
    TODOS: appointments.length,
    IN_PROGRESS: appointments.filter((a) => a.status === 'IN_PROGRESS').length,
    CONFIRMED: appointments.filter((a) => a.status === 'CONFIRMED').length,
    PENDING: appointments.filter((a) => a.status === 'PENDING').length,
    DONE: appointments.filter((a) => a.status === 'DONE').length,
    CANCELED: appointments.filter((a) => a.status === 'CANCELED').length,
  }

  const pad = (n: number) => String(n).padStart(2, '0')
  const dateIsoValue = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`

  const isToday =
    selectedDate.getDate() === new Date().getDate() &&
    selectedDate.getMonth() === new Date().getMonth() &&
    selectedDate.getFullYear() === new Date().getFullYear()

  const formattedDateTitle = selectedDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })

  return (
    <div className="min-h-screen bg-background p-4 space-y-4 max-w-3xl mx-auto animate-fade-in">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <Calendar className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Minha Agenda</h1>
            <p className="text-xs text-text-muted capitalize">
              {formattedDateTitle} · {appointments.length} cortes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ClearAppointmentsModal
            buttonText="Limpar Agenda"
            initialDate={dateIsoValue}
            onSuccess={() => loadAppointments(selectedDate)}
          />
          <button
            onClick={() => loadAppointments(selectedDate)}
            disabled={loading}
            className="p-2 rounded-xl bg-surface-2 border border-border text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            title="Recarregar agendamentos"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin text-accent')} />
          </button>
        </div>
      </div>

      {/* ── BARRA DE NAVEGAÇÃO DE DIAS ── */}
      <div className="card p-3 flex items-center justify-between gap-2 bg-surface/90">
        <button
          onClick={() => changeDay(-1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-text-secondary hover:text-text-primary hover:border-accent/40 text-xs font-semibold transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Dia Anterior</span>
        </button>

        <div className="flex items-center gap-2">
          {!isToday && (
            <button
              onClick={goToday}
              className="px-2.5 py-1 rounded-lg bg-accent/15 border border-accent/30 text-accent text-xs font-bold hover:bg-accent/25 transition-colors"
            >
              Hoje
            </button>
          )}

          <div className="relative flex items-center">
            <input
              type="date"
              value={dateIsoValue}
              onChange={(e) => setDateString(e.target.value)}
              className="bg-surface-2 border border-border rounded-lg px-2.5 py-1.5 text-xs font-bold text-text-primary focus:outline-none focus:border-accent cursor-pointer"
            />
          </div>
        </div>

        <button
          onClick={() => changeDay(1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-text-secondary hover:text-text-primary hover:border-accent/40 text-xs font-semibold transition-all"
        >
          <span className="hidden sm:inline">Próximo Dia</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Buscar cliente ou serviço..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9 text-sm"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_OPTIONS.map((opt) => {
          const count = counts[opt.value]
          const active = filter === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-all duration-150',
                active
                  ? 'bg-accent text-accent-foreground border-transparent font-bold'
                  : 'bg-surface-2 text-text-muted border-border hover:text-text-primary'
              )}
            >
              <span>{opt.label}</span>
              <span
                className={cn(
                  'text-2xs px-1.5 py-0.2 rounded-full font-bold',
                  active ? 'bg-white/20 text-accent-foreground' : 'bg-surface-3 text-text-muted'
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Lista de Agendamentos */}
      {loading ? (
        <div className="card p-8 text-center space-y-2">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-text-muted">Carregando agendamentos do dia...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center space-y-3">
          <CalendarDays className="w-10 h-10 mx-auto text-text-muted/40" />
          <p className="text-sm font-semibold text-text-primary">Nenhum agendamento encontrado</p>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            Não há cortes marcados para {formattedDateTitle}{' '}
            {filter !== 'TODOS' ? `com o status "${filter}"` : ''}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((appt) => {
            const todayStart = new Date().setHours(0, 0, 0, 0)
            const selectedStart = new Date(selectedDate).setHours(0, 0, 0, 0)
            const isFuture = selectedStart > todayStart
            return (
              <AppointmentCard
                key={appt.id}
                appt={appt}
                isFutureDate={isFuture}
                onComplete={handleComplete}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
