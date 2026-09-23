'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Clock, RefreshCw, CheckCheck } from 'lucide-react'
import { mockAppointments } from '@/lib/mock-data'
import { getAppointmentsForDate, completeAppointment, type AppointmentItem } from '@/services/appointments'
import { generateWhatsAppLink } from '@/lib/links'
import { formatCurrency, cn } from '@/lib/utils'
import ClearAppointmentsModal from '@/components/dashboard/ClearAppointmentsModal'

const STATUS_TAGS: Record<string, { label: string; className: string }> = {
  'Pré-pago':       { label: 'Pré-pago',       className: 'bg-accent/20 text-accent border border-accent/30' },
  'PIX PAGO':       { label: 'PIX PAGO',        className: 'badge-success' },
  'Chega em 10m':   { label: 'Chega em 10m',    className: 'bg-warning/20 text-warning border border-warning/30' },
  'Cartão na Local':{ label: 'Cartão na Local',  className: 'bg-surface-3 text-text-secondary border border-border' },
}

interface RowAppt {
  id: string
  clientName: string
  clientPhone?: string | null
  service?: string
  serviceName?: string
  price: number
  startTime: string
  endTime: string
  status: string
  paymentTag?: string
  date?: string
}

function AppointmentRow({ appt, onComplete }: { appt: RowAppt; onComplete: (id: string) => void }) {
  const isDone = appt.status === 'DONE'
  const isInProgress = appt.status === 'IN_PROGRESS'
  const serviceDisplayName = appt.serviceName || appt.service || 'Corte'

  const todayStr = new Date().toISOString().split('T')[0]
  const isFutureDate = appt.date ? appt.date > todayStr : false

  return (
    <div className={cn(
      'flex items-center gap-3 py-3 px-1 border-b border-border/50 last:border-0 group hover:bg-surface-2/30 rounded-lg transition-colors -mx-1 px-2',
      isDone && 'opacity-60'
    )}>
      {/* Time */}
      <div className="w-14 flex-shrink-0">
        <p className="text-sm font-bold text-text-primary tabular-nums">{appt.startTime}</p>
        <p className="text-2xs text-text-muted tabular-nums">{appt.endTime}</p>
      </div>

      {/* Left accent bar */}
      <div className={cn(
        'w-0.5 h-10 rounded-full flex-shrink-0',
        isInProgress ? 'bg-success' : isDone ? 'bg-text-muted/30' : 'bg-accent/40'
      )} />

      {/* Client + service */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className={cn(
            'text-sm font-semibold truncate',
            isDone ? 'text-text-muted line-through' : 'text-text-primary'
          )}>
            {appt.clientName}
          </p>
          {isInProgress && (
            <span className="badge badge-success text-2xs">Em Corte</span>
          )}
          {appt.paymentTag && STATUS_TAGS[appt.paymentTag] && (
            <span className={cn('badge text-2xs', STATUS_TAGS[appt.paymentTag].className)}>
              {STATUS_TAGS[appt.paymentTag].label}
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted truncate">
          {serviceDisplayName}
        </p>
      </div>

      {/* Price */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-text-primary tabular-nums">
          {formatCurrency(appt.price)}
        </p>
      </div>

      {/* Right side actions: WhatsApp and status/complete button */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {appt.clientPhone && (
          <a
            href={generateWhatsAppLink(
              appt.clientPhone,
              `Olá ${appt.clientName}! Confirmando seu agendamento às ${appt.startTime} — ${serviceDisplayName}. Até breve! ✂️`
            )}
            target="_blank"
            rel="noopener noreferrer"
            title={`WhatsApp de ${appt.clientName}`}
            onClick={e => e.stopPropagation()}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/30 border border-[#25D366]/30 transition-all duration-150 hover:scale-105 active:scale-95"
          >
            {/* WhatsApp SVG icon */}
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#25D366]" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>
        )}

        {isDone ? (
          <button className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-success/10 text-success border border-success/20 text-2xs font-semibold">
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
            Concluir Corte
          </button>
        )}
      </div>
    </div>
  )
}

interface AppointmentListProps {
  initialAppointments?: AppointmentItem[]
}

export default function AppointmentList({ initialAppointments }: AppointmentListProps) {
  const router = useRouter()
  const [appointments, setAppointments] = useState<RowAppt[]>(
    initialAppointments !== undefined ? initialAppointments : mockAppointments
  )
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const loadData = () => {
    setLoading(true)
    getAppointmentsForDate(new Date())
      .then((data) => {
        setAppointments(data ?? [])
      })
      .catch((err) => {
        console.error('Erro ao carregar agendamentos:', err)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (initialAppointments !== undefined) {
      setAppointments(initialAppointments)
    } else {
      loadData()
    }
  }, [initialAppointments])

  const handleComplete = async (id: string) => {
    try {
      await completeAppointment(id)
      setAppointments(prev =>
        prev.map(a => a.id === id ? { ...a, status: 'DONE' } : a)
      )
      setNotice('Corte marcado como concluído e faturamento lançado no caixa!')
      setTimeout(() => setNotice(null), 4000)
      router.refresh()
    } catch (err: any) {
      console.error('Erro ao concluir agendamento:', err)
      setNotice(err?.message || 'Não foi possível concluir o agendamento.')
      setTimeout(() => setNotice(null), 4000)
      loadData()
    }
  }

  // Sort by start time
  const sorted = [...appointments].sort((a, b) => a.startTime.localeCompare(b.startTime))

  return (
    <div className="card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent flex-shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              Agendamentos do Dia
            </h3>
            <p className="text-xs text-text-muted">
              {appointments.length} agendamentos registrados • Conclua cortes com 1 clique para lançar no caixa
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ClearAppointmentsModal buttonText="Limpar Agenda" onSuccess={loadData} />
          <button
            onClick={loadData}
            className="btn-secondary text-2xs py-1.5 px-2.5 flex items-center gap-1 flex-shrink-0"
            title="Atualizar agendamentos"
          >
            <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
            Atualizar
          </button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-success/10 border border-success/20 text-xs text-success animate-fade-in">
          <CheckCheck className="w-4 h-4 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* List */}
      <div className="overflow-y-auto max-h-[420px] space-y-0 pr-1 scrollbar-thin">
        {sorted.length === 0 ? (
          <div className="py-8 text-center text-text-muted text-sm">
            Nenhum agendamento para hoje.
          </div>
        ) : (
          sorted.map(appt => (
            <AppointmentRow key={appt.id} appt={appt} onComplete={handleComplete} />
          ))
        )}
      </div>
    </div>
  )
}
