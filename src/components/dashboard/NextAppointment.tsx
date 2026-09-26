import Link from 'next/link'
import { generateWhatsAppLink } from '@/lib/links'
import { MessageCircle, UserCheck, CalendarCheck, Plus } from 'lucide-react'
import type { AppointmentItem } from '@/services/appointments'
import NewAppointmentModal from '@/components/dashboard/NewAppointmentModal'

interface NextAppointmentProps {
  initialAppointments?: AppointmentItem[]
  organizationSlug?: string
}

export default function NextAppointment({ initialAppointments, organizationSlug }: NextAppointmentProps) {
  // Encontra o próximo atendimento confirmado ou pendente
  const next = initialAppointments
    ? initialAppointments.find(a => a.status === 'CONFIRMED' || a.status === 'PENDING')
    : null

  const bookingHref = organizationSlug ? `/agendar/${organizationSlug}` : '/agendar'

  if (!next) {
    return (
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-2xs font-bold text-text-muted uppercase tracking-widest">
            Próximo Atendimento
          </span>
          <span className="badge badge-success text-2xs">LIVRE</span>
        </div>
        <div className="py-3 text-center space-y-2">
          <CalendarCheck className="w-8 h-8 mx-auto text-accent/60" />
          <p className="text-xs text-text-muted">Nenhum atendimento pendente para hoje</p>
          <div className="flex items-center justify-center gap-3 pt-1">
            <NewAppointmentModal
              buttonText="Encaixe Rápido"
              organizationSlug={organizationSlug}
              buttonClassName="inline-flex items-center gap-1.5 text-xs text-accent bg-accent/10 border border-accent/25 hover:bg-accent/20 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer"
            />
            <Link
              href={bookingHref}
              target="_blank"
              className="inline-flex items-center gap-1 text-2xs text-text-muted hover:text-text-primary transition-colors"
            >
              Link Público ↗
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const clientPhone = next.clientPhone || '11976543210'
  const serviceName = next.serviceName || 'Corte'

  const waLink = generateWhatsAppLink(
    clientPhone,
    `Olá ${next.clientName}! Seu agendamento é às ${next.startTime} para ${serviceName}. Aguardamos você na Barbearia! ✂️`
  )

  return (
    <div className="card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-2xs font-bold text-text-muted uppercase tracking-widest">
          Próximo Atendimento
        </span>
        <span className="text-sm font-bold text-accent tabular-nums">{next.startTime}</span>
      </div>

      {/* Client info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-text-primary">
            {next.clientName.charAt(0)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-text-primary truncate">{next.clientName}</p>
          <p className="text-xs text-text-muted truncate">{serviceName}</p>
          {next.clientPhone && (
            <p className="text-xs text-text-muted">
              {next.clientPhone}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 bg-success/10 text-success border border-success/25 rounded-lg py-2 text-xs font-semibold hover:bg-success/20 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp
        </a>
        <button className="flex items-center justify-center gap-1.5 btn-secondary text-xs py-2">
          <UserCheck className="w-3.5 h-3.5" />
          Check-in
        </button>
      </div>
      
      {/* Encaixe Rápido Button ALWAYS VISIBLE */}
      <div className="pt-2">
        <NewAppointmentModal
          buttonText="Encaixe Rápido"
          organizationSlug={organizationSlug}
          buttonClassName="w-full flex items-center justify-center gap-1.5 text-xs text-accent bg-accent/10 border border-accent/25 hover:bg-accent/20 px-2.5 py-2 rounded-lg font-semibold transition-colors cursor-pointer"
        />
      </div>
    </div>
  )
}
