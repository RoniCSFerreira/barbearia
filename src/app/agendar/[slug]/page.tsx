'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Scissors, Clock, ChevronLeft, ChevronRight, CheckCircle2,
  Calendar, CalendarX, X, Check,
} from 'lucide-react'
import {
  mockOrganization, mockUser, mockServices, mockAppointments,
  type MockService,
} from '@/lib/mock-data'
import { createAppointment, getAvailableSlots } from '@/services/appointments'
import {
  getOrganizationServices, getPublicOrganizationDetails,
  type ServiceItem, type PublicOrganizationDetails
} from '@/services/services'
import { generateWhatsAppLink, generateGoogleCalendarUrl } from '@/lib/links'
import { formatCurrency, cn } from '@/lib/utils'

// ── Helpers ────────────────────────────────────────────────────

function formatDatePT(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('pt-BR')
}

function toInputDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function fromInputDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Gera os slots disponíveis para um dado dia, excluindo os já ocupados no mock. */
function generateSlots(
  dateStr: string,
  slotDuration: number,
  startTime  = '09:00',
  endTime    = '20:00',
  breakStart = '12:30',
  breakEnd   = '13:30',
): string[] {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }
  const toTime = (mins: number) =>
    `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`

  const start = toMinutes(startTime)
  const end   = toMinutes(endTime)
  const bS    = toMinutes(breakStart)
  const bE    = toMinutes(breakEnd)

  const occupiedToday = mockAppointments.map(a => a.startTime)
  const isToday = dateStr === toInputDate(new Date())

  const slots: string[] = []
  for (let t = start; t + slotDuration <= end; t += slotDuration) {
    if (t < bE && t + slotDuration > bS) continue
    const label = toTime(t)
    if (isToday && occupiedToday.includes(label)) continue
    slots.push(label)
  }
  return slots
}

// ── Step indicator ─────────────────────────────────────────────

function StepBar({ step }: { step: number }) {
  const steps = [
    { n: 1, label: 'Serviço' },
    { n: 2, label: 'Horário' },
    { n: 3, label: 'Seus Dados' },
  ]
  return (
    <div className="flex items-center gap-0 text-xs mb-6">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all duration-300',
            step === s.n
              ? 'bg-accent text-accent-foreground'
              : step > s.n
              ? 'bg-success/20 text-success'
              : 'text-text-muted'
          )}>
            {step > s.n
              ? <Check className="w-3 h-3" />
              : <span className="w-3 h-3 flex items-center justify-center text-2xs font-black">{s.n}</span>
            }
            <span className="hidden sm:inline">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn(
              'w-6 h-px mx-1 transition-colors duration-300',
              step > s.n ? 'bg-success/40' : 'bg-border'
            )} />
          )}
        </div>
      ))}
      <div className="ml-auto text-text-muted text-2xs">
        Passo <span className="font-bold text-text-primary">{Math.min(step, 3)}</span> de 3
      </div>
    </div>
  )
}

// ── Step 1: Service selection ──────────────────────────────────

function Step1Service({
  services, selected, onSelect, onNext,
}: {
  services: ServiceItem[]
  selected: ServiceItem | MockService | null
  onSelect: (s: ServiceItem | MockService) => void
  onNext: () => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Qual serviço você deseja agendar?</h2>
        <p className="text-sm text-text-muted mt-1">Duração e preços transparentes sem cobranças extras no balcão.</p>
      </div>

      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {services.map(svc => {
          const isSelected = selected?.id === svc.id
          return (
            <button
              key={svc.id}
              type="button"
              onClick={() => onSelect(svc)}
              className={cn(
                'w-full text-left p-4 rounded-xl border transition-all duration-150',
                isSelected
                  ? 'border-accent bg-accent/[0.08]'
                  : 'border-border bg-surface-2 hover:border-accent/40 hover:bg-surface-3'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-bold', isSelected ? 'text-accent' : 'text-text-primary')}>
                    {svc.name}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed line-clamp-2">
                    {svc.description}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="w-3 h-3 text-accent" />
                    <span className="text-xs text-accent font-semibold">{svc.duration_minutes} minutos</span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-base font-black text-text-primary tabular-nums">
                    {formatCurrency(svc.price)}
                  </p>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-accent ml-auto mt-1" />}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-end pt-2 border-t border-border/60">
        <button
          onClick={onNext}
          disabled={!selected}
          className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Escolher Horário
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Step 2: Date & time ────────────────────────────────────────

function Step2DateTime({
  service, selectedDate, selectedTime,
  onDateChange, onTimeSelect, onBack, onNext,
  organizationSlug, orgData,
}: {
  service: ServiceItem | MockService
  selectedDate: string
  selectedTime: string
  onDateChange: (d: string) => void
  onTimeSelect: (t: string) => void
  onBack: () => void
  onNext: () => void
  organizationSlug?: string
  orgData?: PublicOrganizationDetails | null
}) {
  const [slotResult, setSlotResult] = useState<{
    slots: string[]
    isWorkDay: boolean
    dayName: string
  } | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)

  useEffect(() => {
    let isMounted = true
    setLoadingSlots(true)
    getAvailableSlots(selectedDate, service.duration_minutes, organizationSlug)
      .then(res => {
        if (isMounted) setSlotResult(res)
      })
      .catch(() => {
        if (isMounted) setSlotResult(null)
      })
      .finally(() => {
        if (isMounted) setLoadingSlots(false)
      })
    return () => { isMounted = false }
  }, [selectedDate, service.duration_minutes, organizationSlug])

  const fallbackSlots = useMemo(
    () => generateSlots(selectedDate, service.duration_minutes),
    [selectedDate, service.duration_minutes]
  )

  const isWorkDay = slotResult ? slotResult.isWorkDay : true
  const dayName = slotResult?.dayName || 'este dia'
  const slots = slotResult ? slotResult.slots : fallbackSlots
  const barberFirstName = (orgData?.barberName || mockUser.name).split(' ')[0]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Escolha o dia e horário livre</h2>
        <p className="text-sm text-text-muted mt-1">
          Os horários abaixo são calculados dinamicamente evitando qualquer sobreposição.
        </p>
      </div>

      {/* Date picker */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
          <Calendar className="w-3.5 h-3.5 text-accent" />
          Data do corte:
        </label>
        <input
          type="date"
          value={selectedDate}
          min={toInputDate(new Date())}
          onChange={e => { onDateChange(e.target.value); onTimeSelect('') }}
          className="input text-sm"
        />
        {selectedDate && (
          <p className="text-xs text-text-muted capitalize">
            {formatDatePT(fromInputDate(selectedDate))}
          </p>
        )}
      </div>

      {/* Time grid or Day Off Warning */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
            <Clock className="w-3.5 h-3.5 text-accent" />
            Grade de Horários com {barberFirstName}:
          </label>
          <div className="flex items-center gap-3 text-2xs text-text-muted">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-accent inline-block" />
              Livre
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-surface-3 border border-border inline-block" />
              Ocupado
            </span>
          </div>
        </div>

        {loadingSlots ? (
          <div className="py-8 text-center text-text-muted text-sm rounded-xl border border-border bg-surface-2 animate-pulse">
            Verificando disponibilidade de horários...
          </div>
        ) : !isWorkDay ? (
          <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <CalendarX className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-amber-300">Sem Atendimento Nesta Data</h3>
            <p className="text-xs text-text-muted leading-relaxed max-w-sm mx-auto">
              O barbeiro não realiza atendimentos aos <span className="font-semibold text-text-primary capitalize">{dayName}s</span> (dia de folga).
              Por favor, selecione outra data acima no calendário para continuar.
            </p>
          </div>
        ) : slots.length === 0 ? (
          <div className="py-8 text-center text-text-muted text-sm rounded-xl border border-border bg-surface-2">
            Nenhum horário disponível para esta data.
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {slots.map(slot => (
              <button
                key={slot}
                type="button"
                onClick={() => onTimeSelect(slot)}
                className={cn(
                  'py-3 rounded-xl text-sm font-bold border transition-all duration-150 active:scale-95',
                  selectedTime === slot
                    ? 'bg-accent text-accent-foreground border-transparent'
                    : 'bg-surface-2 text-text-primary border-border hover:border-accent/50 hover:bg-surface-3'
                )}
              >
                {slot}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/60">
        <button onClick={onBack} className="btn-ghost flex items-center gap-1.5 text-sm">
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </button>
        <button
          onClick={onNext}
          disabled={!selectedTime || !isWorkDay}
          className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Seus Dados
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Step 3: Client data ────────────────────────────────────────

function formatPhoneInput(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2)  return d
  if (d.length <= 7)  return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function Step3ClientData({
  service, date, time,
  name, phone, notes,
  onNameChange, onPhoneChange, onNotesChange,
  onBack, onConfirm, isSubmitting, errorMessage, orgData,
}: {
  service: ServiceItem | MockService; date: string; time: string
  name: string; phone: string; notes: string
  onNameChange: (v: string) => void
  onPhoneChange: (v: string) => void
  onNotesChange: (v: string) => void
  onBack: () => void
  onConfirm: () => void
  isSubmitting?: boolean
  errorMessage?: string
  orgData?: PublicOrganizationDetails | null
}) {
  const canConfirm = name.trim().length >= 3 && phone.replace(/\D/g, '').length >= 10

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Confirme seus dados para o agendamento</h2>
        <p className="text-sm text-text-muted mt-1">
          Enviaremos o lembrete e o link de confirmação diretamente para seu WhatsApp.
        </p>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-border bg-surface-2 p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-text-muted">Barbeiro:</span>
          <span className="font-semibold text-text-primary">{orgData?.barberName || mockUser.name}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-text-muted flex-shrink-0">Serviço:</span>
          <span className="font-semibold text-text-primary text-right">{service.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Horário:</span>
          <span className="font-semibold text-accent tabular-nums">
            {date ? formatDateShort(fromInputDate(date)) : ''} às {time}
          </span>
        </div>
        <div className="flex justify-between pt-1.5 border-t border-border">
          <span className="text-text-muted">Valor Total:</span>
          <span className="font-black text-text-primary tabular-nums">{formatCurrency(service.price)}</span>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary">
            Seu Nome Completo <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => onNameChange(e.target.value)}
            placeholder="Ex: João Pedro Silveira"
            className="input"
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary">
            WhatsApp (com DDD) <span className="text-danger">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => onPhoneChange(formatPhoneInput(e.target.value))}
            placeholder="Ex: (11) 98765-4321"
            className="input"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary">
            Observações / Preferências{' '}
            <span className="text-text-muted font-normal">(Opcional)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            placeholder="Ex: Prefiro navalha bem rente nas costeletas"
            rows={3}
            className="input resize-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/60">
        <button onClick={onBack} className="btn-ghost flex items-center gap-1.5 text-sm">
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </button>
        {errorMessage && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger">
            {errorMessage}
          </div>
        )}

        <button
          onClick={onConfirm}
          disabled={!canConfirm || isSubmitting}
          className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isSubmitting ? 'Confirmando...' : 'Confirmar Agendamento'}
        </button>
      </div>
    </div>
  )
}

// ── Step 4: Confirmation ───────────────────────────────────────

const WaIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

function Step4Confirmed({
  service, date, time, clientName, clientPhone, notes, orgData,
}: {
  service: ServiceItem | MockService; date: string; time: string; clientName: string; clientPhone: string; notes: string
  orgData?: PublicOrganizationDetails | null
}) {
  const orgName = orgData?.name || mockOrganization.name
  const barberName = orgData?.barberName || mockUser.name
  const barberPhone = orgData?.barberPhone || ''

  const startDate = (() => {
    const d = fromInputDate(date)
    const [h, m] = time.split(':').map(Number)
    d.setHours(h, m, 0, 0)
    return d
  })()
  const endDate = new Date(startDate.getTime() + service.duration_minutes * 60_000)

  const calUrl = generateGoogleCalendarUrl({
    title:       `${service.name} — ${orgName}`,
    description: `Barbeiro: ${barberName} | Barbearia Solo`,
    location:    orgName,
    startTime:   startDate,
    endTime:     endDate,
  })

  // Formatação de data exata no modelo: sex., 18/09 às 10:30
  const formatWaDate = (dateStr: string): string => {
    const d = fromInputDate(dateStr)
    const weekday = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
    const dayMonth = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    return `${weekday}., ${dayMonth}`
  }

  // Número do barbeiro para envio do WhatsApp
  const phoneDigits = barberPhone ? barberPhone.replace(/\D/g, '') : ''
  const fullPhone = phoneDigits ? (phoneDigits.length <= 11 && !phoneDigits.startsWith('55') ? `55${phoneDigits}` : phoneDigits) : ''

  const formattedDate = formatWaDate(date)
  const obsText = notes && notes.trim() ? notes.trim() : 'Nenhuma'

  let waMsg = `Olá! Confirmei o agendamento pelo site e estou confirmando por aqui:\n\n`
  waMsg += `• *Serviço:* ${service.name}\n`
  waMsg += `• *Barbeiro:* ${barberName}\n`
  waMsg += `• *Data/Horário:* ${formattedDate} às ${time}\n`
  waMsg += `• *Cliente:* ${clientName}\n`
  waMsg += `• *WhatsApp:* ${clientPhone || 'Não informado'}\n`
  waMsg += `• *Observações:* ${obsText}\n\n`
  waMsg += `Aguardo a confirmação!`

  const waUrl = fullPhone
    ? `https://wa.me/${fullPhone}?text=${encodeURIComponent(waMsg)}`
    : `https://wa.me/${process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '5519996214343'}?text=${encodeURIComponent(waMsg)}`

  return (
    <div className="space-y-6 text-center py-2">
      {/* Success icon */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full border-2 border-accent/60 flex items-center justify-center bg-accent/10">
          <CheckCircle2 className="w-10 h-10 text-accent" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-black text-text-primary">Agendamento Confirmado!</h2>
        <p className="text-sm text-text-muted mt-2 leading-relaxed">
          Tudo pronto, <span className="font-bold text-text-primary">{clientName}</span>!{' '}
          Seu horário está reservado com sucesso no sistema da{' '}
          <span className="text-accent font-semibold">{orgName}</span>.
        </p>
      </div>

      {/* Booking recap */}
      <div className="text-left rounded-xl border border-border bg-surface-2 p-4 space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-accent" />
            <span className="text-sm font-bold text-text-primary">{orgName}</span>
          </div>
          <span className="text-2xs font-bold text-success border border-success/30 bg-success/10 px-2 py-0.5 rounded-full">
            STATUS: CONFIRMED
          </span>
        </div>
        <p className="font-bold text-text-primary">{service.name}</p>
        <p className="text-xs text-text-muted">
          Barbeiro:{' '}
          <span className="font-semibold text-text-secondary">{barberName}</span>
        </p>
        <p className="text-sm font-semibold text-accent capitalize">
          {formatDatePT(fromInputDate(date))} às {time}
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={calUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm"
        >
          <Calendar className="w-4 h-4" />
          Adicionar à Google Agenda
        </a>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm"
        >
          <WaIcon />
          Abrir no WhatsApp
        </a>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────

export default function AgendarPage() {
  const rawParams = useParams<{ slug: string }>()
  const slug = rawParams?.slug ?? mockOrganization.slug

  const [step,        setStep]        = useState(1)
  const [services,    setServices]    = useState<(ServiceItem | MockService)[]>(mockServices)
  const [service,     setService]     = useState<ServiceItem | MockService | null>(null)
  const [date,        setDate]        = useState(toInputDate(new Date()))
  const [time,        setTime]        = useState('')
  const [clientName,  setClientName]  = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [notes,       setNotes]       = useState('')
  const [origin,      setOrigin]      = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [orgData,     setOrgData]     = useState<PublicOrganizationDetails | null>(null)

  useEffect(() => {
    setOrigin(window.location.origin)

    getPublicOrganizationDetails(slug)
      .then(res => {
        if (res) setOrgData(res)
      })
      .catch(() => {})

    getOrganizationServices(slug)
      .then(res => {
        if (res && res.length > 0) setServices(res)
      })
      .catch(() => {})
  }, [slug])

  const handleConfirm = async () => {
    if (!service) return
    setIsSubmitting(true)
    setErrorMessage('')
    try {
      await createAppointment({
        organizationSlug: slug,
        clientName,
        clientPhone,
        serviceId: service.id,
        date,
        time,
      })
      setStep(4)
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao realizar agendamento.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const publicUrl = origin ? `${origin}/agendar/${slug}` : `/agendar/${slug}`
  const salonDisplayName = orgData?.name || mockOrganization.name

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start p-4 py-8">
      <div className="w-full max-w-lg">

        {/* App bar */}
        <div className="flex items-center justify-between mb-5 p-4 rounded-xl bg-surface border border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
              <Scissors className="w-4 h-4 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-black text-text-primary leading-tight">Agendamento Online</p>
              <p className="text-2xs text-text-muted">{salonDisplayName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-2xs font-mono bg-surface-2 border border-border px-2 py-1 rounded-lg text-text-muted">
              {publicUrl}
            </span>
            <Link
              href="/dashboard"
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
            >
              <X className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Wizard card */}
        <div className="card p-6">
          {step < 4 && <StepBar step={step} />}

          {step === 1 && (
            <Step1Service
              services={services}
              selected={service}
              onSelect={setService}
              onNext={() => setStep(2)}
            />
          )}

          {step === 2 && service && (
            <Step2DateTime
              service={service}
              selectedDate={date}
              selectedTime={time}
              onDateChange={setDate}
              onTimeSelect={setTime}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
              organizationSlug={slug}
              orgData={orgData}
            />
          )}

          {step === 3 && service && (
            <Step3ClientData
              service={service}
              date={date}
              time={time}
              name={clientName}
              phone={clientPhone}
              notes={notes}
              onNameChange={setClientName}
              onPhoneChange={setClientPhone}
              onNotesChange={setNotes}
              onBack={() => setStep(2)}
              onConfirm={handleConfirm}
              isSubmitting={isSubmitting}
              errorMessage={errorMessage}
              orgData={orgData}
            />
          )}

          {step === 4 && service && (
            <Step4Confirmed
              service={service}
              date={date}
              time={time}
              clientName={clientName}
              clientPhone={clientPhone}
              notes={notes}
              orgData={orgData}
            />
          )}
        </div>

        <p className="text-center text-2xs text-text-muted/50 mt-4">
          {salonDisplayName} · Barbearia
        </p>
      </div>
    </div>
  )
}
