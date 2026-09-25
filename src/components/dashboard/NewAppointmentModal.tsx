'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Calendar, Clock, Scissors, User, Phone, CheckCircle2, Zap } from 'lucide-react'
import { createAppointment } from '@/services/appointments'
import { getOrganizationServices, type ServiceItem } from '@/services/services'
import { formatCurrency, cn } from '@/lib/utils'

interface NewAppointmentModalProps {
  buttonText?: string
  buttonClassName?: string
  organizationSlug?: string
  onSuccess?: () => void
}

export default function NewAppointmentModal({
  buttonText = 'Novo Agendamento',
  buttonClassName,
  organizationSlug,
  onSuccess,
}: NewAppointmentModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [services, setServices] = useState<ServiceItem[]>([])

  // Form states
  const todayStr = new Date().toISOString().split('T')[0]
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [date, setDate] = useState(todayStr)
  const [time, setTime] = useState('19:00')
  const [customTime, setCustomTime] = useState('')

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Load services when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      const slugToUse = organizationSlug || 'vpn-black'
      getOrganizationServices(slugToUse)
        .then((res) => {
          setServices(res || [])
          if (res && res.length > 0) {
            setSelectedServiceId(res[0].id)
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [isOpen, organizationSlug])

  const handleOpen = () => {
    setError(null)
    setSuccessMsg(null)
    setClientName('')
    setClientPhone('')
    setDate(todayStr)

    // Horário padrão inteligente (próximo horário redondo ou 19:00)
    const now = new Date()
    const nextHour = String(now.getHours() + 1).padStart(2, '0')
    setTime(`${nextHour}:00`)
    setCustomTime('')
    setIsOpen(true)
  }

  const handleClose = () => {
    if (submitting) return
    setIsOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName.trim()) {
      setError('Por favor, informe o nome do cliente.')
      return
    }
    if (!selectedServiceId) {
      setError('Por favor, selecione um serviço.')
      return
    }

    const timeToUse = customTime.trim() || time
    if (!timeToUse || !/^\d{2}:\d{2}$/.test(timeToUse)) {
      setError('Por favor, informe um horário válido (ex: 20:30).')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const slugToUse = organizationSlug || 'vpn-black'
      await createAppointment({
        organizationSlug: slugToUse,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim() || 'Presencial',
        serviceId: selectedServiceId,
        date,
        time: timeToUse,
      })

      setSuccessMsg(`Agendamento de ${clientName} marcado para as ${timeToUse} com sucesso!`)
      if (onSuccess) onSuccess()
      router.refresh()

      setTimeout(() => {
        setIsOpen(false)
        setSuccessMsg(null)
      }, 1500)
    } catch (err: any) {
      console.error('Erro ao criar encaixe rápido:', err)
      setError(err?.message || 'Não foi possível realizar o agendamento.')
    } finally {
      setSubmitting(false)
    }
  }

  const QUICK_TIMES = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30']

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleOpen}
        className={cn(
          buttonClassName || 'btn-primary flex items-center gap-1.5 text-sm py-1.5 px-3'
        )}
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">{buttonText}</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full sm:max-w-md max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto bg-surface border border-border sm:rounded-2xl rounded-t-2xl shadow-2xl p-5 space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary leading-tight">
                    Novo Agendamento / Encaixe
                  </h3>
                  <p className="text-2xs text-text-muted">
                    Agende clientes presenciais ou fora do expediente
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={submitting}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notifications */}
            {error && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger animate-fade-in">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/20 text-xs text-success animate-fade-in">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* Cliente */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                  <User className="w-3.5 h-3.5 text-accent" />
                  Nome do Cliente <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: Carlos Silva ou Cliente Presencial"
                  className="input text-sm"
                  autoFocus
                />
              </div>

              {/* Telefone */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                  <Phone className="w-3.5 h-3.5 text-accent" />
                  WhatsApp / Telefone <span className="text-text-muted text-2xs font-normal">(Opcional)</span>
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="input text-sm"
                />
              </div>

              {/* Serviço */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                  <Scissors className="w-3.5 h-3.5 text-accent" />
                  Serviço Desejado
                </label>
                {loading ? (
                  <div className="input text-xs text-text-muted animate-pulse">Carregando serviços...</div>
                ) : (
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="input text-sm"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {formatCurrency(s.price)} ({s.duration_minutes}m)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Data & Horário Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Data */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                    Data
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input text-xs"
                  />
                </div>

                {/* Horário Personalizado */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    Horário (HH:mm)
                  </label>
                  <input
                    type="time"
                    value={customTime || time}
                    onChange={(e) => {
                      setCustomTime(e.target.value)
                      setTime(e.target.value)
                    }}
                    className="input text-xs font-bold"
                  />
                </div>
              </div>

              {/* Atângulos Rápidos de Horário */}
              <div className="space-y-1.5">
                <span className="text-2xs font-semibold text-text-muted uppercase tracking-wider">
                  Sugestões de Horário (ou encaixe):
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {QUICK_TIMES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTime(t)
                        setCustomTime(t)
                      }}
                      className={cn(
                        'py-1.5 rounded-lg text-xs font-bold border transition-all',
                        (customTime || time) === t
                          ? 'bg-accent text-accent-foreground border-transparent'
                          : 'bg-surface-2 text-text-secondary border-border hover:border-accent/40'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Badge Informativo */}
              <div className="p-2.5 rounded-xl bg-accent/5 border border-accent/15 flex items-center gap-2 text-2xs text-accent">
                <Zap className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  Este agendamento é manual e pode ser realizado em <strong>qualquer horário</strong> desejado.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="btn-ghost text-xs py-2 px-3"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !clientName.trim()}
                  className="btn-primary flex items-center gap-1.5 text-xs py-2 px-4 disabled:opacity-40"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {submitting ? 'Confirmando...' : 'Confirmar Encaixe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
