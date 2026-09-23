'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Scissors, Plus, LayoutDashboard, Calendar, DollarSign,
  ShoppingBag, UserCircle, Bell, Menu, X, ChevronRight, LogOut, ShieldCheck,
  AlertTriangle, MessageCircle, Sparkles, Clock
} from 'lucide-react'
import { mockOrganization, mockUser } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import NewAppointmentModal from '@/components/dashboard/NewAppointmentModal'
import ThemeToggle from '@/components/ThemeToggle'

const NAV_LINKS = [
  { icon: LayoutDashboard, label: 'Dashboard',   href: '/dashboard' },
  { icon: Calendar,        label: 'Agenda',       href: '/dashboard/agenda' },
  { icon: DollarSign,      label: 'Financeiro',   href: '/dashboard/financeiro' },
  { icon: ShoppingBag,     label: 'Gastos',       href: '/dashboard/gastos' },
  { icon: UserCircle,      label: 'Perfil',       href: '/dashboard/perfil' },
]

interface DashboardHeaderProps {
  user?: {
    name: string
    salonName?: string
    email?: string
    isAdmin?: boolean
    status?: string
    trialEndsAt?: string | null
    isExpired?: boolean
  }
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length > 1) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase()
  }
  return words[0]?.slice(0, 2).toUpperCase() || 'BS'
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)

  const [headerData, setHeaderData] = useState({
    name: user?.name || mockUser.name,
    initials: user ? getInitials(user.name) : mockUser.initials,
    salonName: user?.salonName || mockOrganization.name,
    subtitle: 'Barbearia Solo',
  })

  // Cálculo de Notificação de Vencimento de Assinatura/Teste
  const getNotificationInfo = () => {
    if (user?.isAdmin || user?.email?.toLowerCase() === 'rcsfempresa@gmail.com') {
      return { hasAlert: false, type: 'SUPER_ADMIN' as const }
    }

    if (!user?.trialEndsAt) {
      return { hasAlert: false, type: 'OK' as const }
    }

    const now = new Date().getTime()
    const end = new Date(user.trialEndsAt).getTime()
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24))

    if (user.isExpired || user.status === 'SUSPENDED' || diffDays <= 0) {
      return {
        hasAlert: true,
        type: 'EXPIRED' as const,
        title: 'Assinatura Expirada 🔴',
        desc: 'Seu período de acesso ao sistema expirou. Entre em contato com a administração via WhatsApp para renovar seu plano.',
        days: 0,
        waText: `Olá! Sou o barbeiro ${user?.name || ''}, minha assinatura expirou e gostaria de renová-la para continuar utilizando o sistema Barbearia Solo.`,
      }
    }

    if (diffDays <= 3) {
      return {
        hasAlert: true,
        type: 'EXPIRING_SOON' as const,
        title: `Vencendo ${diffDays <= 0 ? 'Hoje' : `em ${diffDays} dia(s)`} ⚠️`,
        desc: `Sua assinatura ou teste grátis está prestes a expirar. Fale conosco no WhatsApp para garantir o acesso ininterrupto.`,
        days: diffDays,
        waText: `Olá! Sou o barbeiro ${user?.name || ''}, minha assinatura vence em ${diffDays} dia(s) e gostaria de já renová-la.`,
      }
    }

    return { hasAlert: false, type: 'OK' as const }
  }

  const notifInfo = getNotificationInfo()
  const adminWhatsApp = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '5519996214343'
  const waUrl = notifInfo.hasAlert && notifInfo.waText
    ? `https://wa.me/${adminWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent(notifInfo.waText)}`
    : null

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsNotifOpen(false)
  }, [pathname])

  useEffect(() => {
    if (user) {
      setHeaderData({
        name: user.name,
        initials: getInitials(user.name),
        salonName: user.salonName || 'Minha Barbearia',
        subtitle: 'Barbearia Solo',
      })
    }

    const updateFromStorage = () => {
      try {
        const stored = localStorage.getItem('barbearia_profile')
        if (stored && user?.email) {
          const parsed = JSON.parse(stored)
          // Se o e-mail do localStorage não existir ou for diferente do e-mail logado, limpa o localStorage
          if (!parsed.email || parsed.email.toLowerCase() !== user.email.toLowerCase()) {
            localStorage.removeItem('barbearia_profile')
            if (user) {
              setHeaderData({
                name: user.name,
                initials: getInitials(user.name),
                salonName: user.salonName || 'Minha Barbearia',
                subtitle: 'Barbearia Solo',
              })
            }
            return
          }

          const name = (parsed.name || '').trim() || (user?.name ?? mockUser.name)
          const initials = getInitials(name)
          const salonName = (parsed.salonName || '').trim() || (user?.salonName ?? 'Minha Barbearia')

          setHeaderData({
            name,
            initials,
            salonName,
            subtitle: 'Barbearia Solo',
          })
        }
      } catch {}
    }

    updateFromStorage()
    window.addEventListener('profileUpdated', updateFromStorage)
    window.addEventListener('storage', updateFromStorage)
    return () => {
      window.removeEventListener('profileUpdated', updateFromStorage)
      window.removeEventListener('storage', updateFromStorage)
    }
  }, [user])

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/85 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-4">

          {/* Esquerda: Botão Menu Mobile + Logo + Org */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className="md:hidden p-2 rounded-lg border border-border bg-surface-2 text-text-primary hover:bg-surface-3 transition-colors flex-shrink-0"
              aria-label="Abrir Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-accent" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/dashboard" className="flex items-center gap-2 min-w-0 group">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent flex-shrink-0 group-hover:scale-105 transition-transform duration-150">
                <Scissors className="w-4 h-4 text-accent-foreground" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-text-primary truncate max-w-[130px] sm:max-w-[180px]">
                    {headerData.salonName}
                  </span>
                  <span className="text-text-muted text-xs hidden sm:inline">•</span>
                  <span className="text-xs text-text-muted truncate hidden sm:inline">Barbearia</span>
                </div>
                <span className="text-2xs text-accent font-medium block">{headerData.subtitle}</span>
              </div>
            </Link>
          </div>

          {/* Centro: Navegação Desktop */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-surface-2 border border-border">
            {NAV_LINKS.map(({ icon: Icon, label, href }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  title={label}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all duration-150',
                    isActive
                      ? 'border border-dashed border-accent/60 bg-accent/15 text-accent font-semibold'
                      : 'text-text-muted hover:text-text-primary hover:bg-surface-3'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Direita: Admin + CTA + Notificações + Tema + Perfil */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {(user?.isAdmin || user?.email?.toLowerCase() === 'rcsfempresa@gmail.com') && (
              <Link
                href="/admin/usuarios"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 text-2xs font-bold transition-all shadow-sm"
                title="Painel de Administração SaaS"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Painel Admin</span>
              </Link>
            )}

            <NewAppointmentModal buttonText="Novo Agendamento" />

            <ThemeToggle />

            {/* Notificações e Modal de Avisos */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen((prev) => !prev)}
                className={cn(
                  'relative p-2 rounded-lg border transition-all duration-200',
                  notifInfo.hasAlert
                    ? 'border-amber-500/50 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 shadow-md shadow-amber-500/10 animate-pulse'
                    : 'border-border bg-surface-2 text-text-muted hover:text-text-primary hover:bg-surface-3'
                )}
                title="Notificações do Sistema"
              >
                <Bell className={cn('w-4 h-4', notifInfo.hasAlert && 'text-amber-400')} />
                {notifInfo.hasAlert ? (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-danger border-2 border-background animate-ping" />
                ) : (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </button>

              {/* Popover Dropdown de Notificações */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-surface border border-border p-4 shadow-2xl z-50 animate-fade-in space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-2.5">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-accent" />
                      <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Central de Notificações</h3>
                    </div>
                    <button
                      onClick={() => setIsNotifOpen(false)}
                      className="text-text-muted hover:text-text-primary p-1 rounded-lg text-2xs"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {notifInfo.hasAlert ? (
                    <div className={cn(
                      'p-3.5 rounded-xl border space-y-2.5 text-xs',
                      notifInfo.type === 'EXPIRED' ? 'bg-danger/10 border-danger/30 text-danger' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    )}>
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-extrabold text-sm">{notifInfo.title}</h4>
                          <p className="text-xs text-text-muted mt-1 leading-relaxed">{notifInfo.desc}</p>
                        </div>
                      </div>

                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsNotifOpen(false)}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
                        >
                          <MessageCircle className="w-4 h-4 fill-current" />
                          <span>Falar no WhatsApp (Renovar)</span>
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-center space-y-2">
                      <Sparkles className="w-8 h-8 text-accent/40 mx-auto" />
                      <p className="text-xs font-medium text-text-primary">Nenhuma notificação pendente</p>
                      <p className="text-2xs text-text-muted">Seu acesso está ativo e funcionando perfeitamente.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link href="/dashboard/perfil" className="flex items-center gap-2 group">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-text-primary truncate max-w-[120px]">{headerData.name}</p>
                <p className="text-2xs text-accent font-medium">{mockUser.label}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-150">
                <span className="text-xs font-bold text-accent-foreground">{headerData.initials}</span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* ── OVERLAY MODAL FULLSCREEN DO MENU MOBILE ── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col justify-between p-4 sm:p-6 overflow-y-auto animate-fade-in md:hidden">
          
          {/* Topo do Modal */}
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-primary leading-tight">{headerData.salonName}</h2>
                  <p className="text-2xs text-accent font-medium">{headerData.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-surface-2 text-text-primary border border-border hover:bg-surface-3 transition-colors"
                aria-label="Fechar Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cartão do Barbeiro Logado */}
            <Link
              href="/dashboard/perfil"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-2 border border-border hover:border-accent/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center font-black text-accent-foreground flex-shrink-0 text-sm">
                  {headerData.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text-primary truncate">{headerData.name}</p>
                  <p className="text-2xs text-text-muted truncate">{user?.email || 'barbeiro@navalha.com'}</p>
                </div>
              </div>
              <span className="badge bg-accent/15 text-accent border border-accent/30 text-2xs font-bold flex-shrink-0">
                Barbeiro
              </span>
            </Link>

            {/* Lista de links de navegação */}
            <div className="space-y-2 pt-1">
              <p className="text-2xs font-bold text-text-muted uppercase tracking-wider px-1">Menu Principal</p>
              {NAV_LINKS.map(({ icon: Icon, label, href }) => {
                const isActive = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center justify-between p-3.5 rounded-2xl text-sm font-semibold transition-all border',
                      isActive
                        ? 'bg-accent/15 text-accent border-accent/40 shadow-sm'
                        : 'bg-surface-2/80 text-text-secondary border-border hover:bg-surface-2 hover:text-text-primary'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn('w-5 h-5', isActive ? 'text-accent' : 'text-text-muted')} />
                      <span>{label}</span>
                    </div>
                    <ChevronRight className={cn('w-4 h-4', isActive ? 'text-accent' : 'text-text-muted/40')} />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Rodapé do Modal */}
          <div className="pt-6 border-t border-border space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-text-muted">Tema do App</span>
              <ThemeToggle />
            </div>

            <p className="text-2xs text-center text-text-muted pt-2">
              {headerData.salonName} • Solo App v1.0
            </p>
          </div>
        </div>
      )}

      {/* ── BARRA FIXA DE NAVEGAÇÃO INFERIOR PARA CELULAR (MOBILE BOTTOM NAV BAR) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl border-t border-border px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {NAV_LINKS.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 relative min-w-[56px]',
                isActive ? 'text-accent font-bold scale-105' : 'text-text-muted hover:text-text-primary'
              )}
            >
              <Icon className={cn('w-5 h-5 mb-0.5 transition-transform', isActive && 'scale-110 text-accent')} />
              <span className="text-[10px] leading-tight font-medium">{label}</span>
              {isActive && (
                <span className="absolute -top-1 w-1 h-1 rounded-full bg-accent shadow-[0_0_8px_#5B63F6]" />
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
