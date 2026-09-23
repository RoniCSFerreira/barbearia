'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, DollarSign, ShoppingBag, UserCircle, Link2, Copy, Check, ExternalLink } from 'lucide-react'
import { mockOrganization } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import ClearAppointmentsModal from '@/components/dashboard/ClearAppointmentsModal'

const NAV_ITEMS = [
  { icon: Calendar,    label: 'Minha Agenda',   href: '/dashboard/agenda',     color: 'text-accent' },
  { icon: DollarSign,  label: 'Faturamentos',   href: '/dashboard/financeiro', color: 'text-success' },
  { icon: ShoppingBag, label: 'Lançar Gastos',  href: '/dashboard/gastos',     color: 'text-danger' },
  { icon: UserCircle,  label: 'Meu Perfil',     href: '/dashboard/perfil',     color: 'text-text-muted' },
]

interface QuickNavProps {
  organizationSlug?: string | null
}

export default function QuickNav({ organizationSlug }: QuickNavProps) {
  const pathname = usePathname()
  const [copied, setCopied] = useState(false)

  const activeSlug = organizationSlug || mockOrganization.slug
  const bookingPath = `/agendar/${activeSlug}`
  const [bookingUrl, setBookingUrl] = useState(bookingPath)

  useEffect(() => {
    setBookingUrl(`${window.location.origin}${bookingPath}`)
  }, [bookingPath])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* fallback: ignore */
    }
  }

  return (
    <div className="space-y-3">
      {/* ── Booking link card (Dynamic Slug) ── */}
      <div className="card p-4 space-y-3 border-accent/20 bg-accent/[0.03]">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-accent flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-text-primary">Link de Agendamento</p>
            <p className="text-2xs text-text-muted truncate">Compartilhe com seus clientes</p>
          </div>
          <Link
            href={bookingPath}
            target="_blank"
            className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors flex-shrink-0"
            title="Abrir página de agendamento"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* URL display + copy */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-2 border border-border">
          <code className="text-2xs text-text-secondary flex-1 truncate font-mono" suppressHydrationWarning>
            {bookingUrl}
          </code>
          <button
            onClick={handleCopy}
            className={cn(
              'flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-2xs font-semibold transition-all duration-200',
              copied
                ? 'bg-success/20 text-success border border-success/30'
                : 'bg-surface-3 text-text-muted hover:text-accent hover:bg-accent/10 border border-border hover:border-accent/30'
            )}
            title="Copiar link"
          >
            {copied ? (
              <><Check className="w-3 h-3" /> Copiado!</>
            ) : (
              <><Copy className="w-3 h-3" /> Copiar</>
            )}
          </button>
        </div>
      </div>

      {/* ── Nav items ── */}
      <div className="card p-4 space-y-3">
        <span className="text-2xs font-bold text-text-muted uppercase tracking-widest">
          Navegação Rápida
        </span>
        <div className="grid grid-cols-2 gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-xl border transition-all duration-150 group',
                  isActive
                    ? 'border-dashed border-accent/60 bg-accent/15'
                    : 'bg-surface-2 border-border hover:border-accent/30 hover:bg-surface-3'
                )}
              >
                <item.icon className={cn(
                  'w-4 h-4 flex-shrink-0 transition-transform',
                  item.color,
                  !isActive && 'group-hover:scale-110'
                )} />
                <span className={cn(
                  'text-xs font-medium transition-colors leading-tight',
                  isActive ? 'text-text-primary font-semibold' : 'text-text-secondary group-hover:text-text-primary'
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Clear Appointments Card (Danger Zone) ── */}
      <ClearAppointmentsModal variant="card" />
    </div>
  )
}
