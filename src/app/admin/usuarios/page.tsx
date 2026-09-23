'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShieldCheck, Search, Users, CheckCircle2, Clock,
  AlertTriangle, MessageCircle, Plus, RefreshCw, Trash2,
  Lock, ArrowLeft, Loader2, Sparkles
} from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import {
  getAdminBarbersAction,
  activateUserSubscriptionAction,
  extendUserTrialAction,
  suspendUserAction,
  deleteUserAccountAction,
  type BarberAdminItem
} from '@/app/actions/admin'

type FilterStatus = 'ALL' | 'ACTIVE' | 'TRIAL' | 'EXPIRED'

export default function AdminUsuariosPage() {
  const [barbers, setBarbers] = useState<BarberAdminItem[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('ALL')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getAdminBarbersAction()
      setBarbers(data)
    } catch (err: any) {
      console.error('Erro ao carregar lista de barbeiros:', err)
      setNotice(err?.message || 'Erro ao carregar dados do admin.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleActivate = async (userId: string, name: string) => {
    setActionLoading(userId)
    try {
      await activateUserSubscriptionAction(userId, 30)
      setNotice(`Assinatura de ${name} ativada por +30 dias com sucesso!`)
      await loadData()
    } catch (err: any) {
      setNotice(err?.message || 'Erro ao ativar assinatura.')
    } finally {
      setActionLoading(null)
      setTimeout(() => setNotice(null), 5000)
    }
  }

  const handleExtendTrial = async (userId: string, name: string) => {
    setActionLoading(userId)
    try {
      await extendUserTrialAction(userId, 3)
      setNotice(`Teste gratuito de ${name} prorrogado por +3 dias!`)
      await loadData()
    } catch (err: any) {
      setNotice(err?.message || 'Erro ao prorrogar teste.')
    } finally {
      setActionLoading(null)
      setTimeout(() => setNotice(null), 5000)
    }
  }

  const handleSuspend = async (userId: string, name: string) => {
    if (!confirm(`Tem certeza que deseja suspender o acesso de ${name}?`)) return
    setActionLoading(userId)
    try {
      await suspendUserAction(userId)
      setNotice(`Acesso de ${name} suspenso.`)
      await loadData()
    } catch (err: any) {
      setNotice(err?.message || 'Erro ao suspender acesso.')
    } finally {
      setActionLoading(null)
      setTimeout(() => setNotice(null), 5000)
    }
  }

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`CUIDADO: Deseja realmente EXCLUIR a conta de ${name}? Essa ação não pode ser desfeita.`)) return
    setActionLoading(userId)
    try {
      await deleteUserAccountAction(userId)
      setNotice(`Conta de ${name} removida.`)
      await loadData()
    } catch (err: any) {
      setNotice(err?.message || 'Erro ao excluir conta.')
    } finally {
      setActionLoading(null)
      setTimeout(() => setNotice(null), 5000)
    }
  }

  // Filtros
  const filteredBarbers = barbers.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.salonName.toLowerCase().includes(search.toLowerCase()) ||
      b.email.toLowerCase().includes(search.toLowerCase())

    if (!matchesSearch) return false

    if (filter === 'ACTIVE') return b.status === 'ACTIVE'
    if (filter === 'TRIAL') return b.status === 'TRIAL' && !b.isExpired
    if (filter === 'EXPIRED') return b.isExpired || b.status === 'SUSPENDED'

    return true
  })

  // Totais das métricas
  const totalBarbers = barbers.length
  const totalActive = barbers.filter((b) => b.status === 'ACTIVE').length
  const totalTrial = barbers.filter((b) => b.status === 'TRIAL' && !b.isExpired).length
  const totalExpired = barbers.filter((b) => b.isExpired || b.status === 'SUSPENDED').length

  const formatExpirationDate = (dateStr: string | null) => {
    if (!dateStr) return 'Sem validade definida'
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDaysRemaining = (dateStr: string | null) => {
    if (!dateStr) return null
    const now = new Date()
    const target = new Date(dateStr)
    const diffTime = target.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getWhatsAppUrl = (b: BarberAdminItem) => {
    if (!b.phone) return null
    const digits = b.phone.replace(/\D/g, '')
    if (!digits) return null

    const remainingDays = getDaysRemaining(b.trialEndsAt)

    let msg = ''
    if (b.isExpired || b.status === 'SUSPENDED' || (remainingDays !== null && remainingDays <= 0)) {
      msg = `Olá ${b.name}, sua assinatura do sistema de barbearia expirou. Gostaria de renová-la?`
    } else if (remainingDays !== null && remainingDays <= 3) {
      const daysText = remainingDays <= 0 ? 'hoje' : `${remainingDays} dia${remainingDays > 1 ? 's' : ''}`
      msg = `Olá ${b.name}, sua assinatura do sistema de barbearia está prestes a expirar (vence em ${daysText}). Gostaria de renová-la?`
    } else {
      msg = `Olá ${b.name}, tudo bem? Entrando em contato sobre sua assinatura do sistema Barbearia Solo.`
    }

    const fullPhone = digits.length <= 11 && !digits.startsWith('55') ? `55${digits}` : digits
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 space-y-6 max-w-6xl mx-auto animate-fade-in pb-16">
      
      {/* Botão Voltar */}
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Voltar para Dashboard
      </Link>

      {/* Topo do Painel Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-lg shadow-amber-500/10">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-text-primary">Painel de Administração SaaS</h1>
              <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/30 text-2xs font-bold uppercase tracking-wider">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Gestão geral de barbearias, ativação de assinaturas e controle de validade.
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="btn-secondary text-xs py-2 px-3 flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          <span>Atualizar Dados</span>
        </button>
      </div>

      {/* Aviso de feedback */}
      {notice && (
        <div className="p-3.5 rounded-xl bg-accent/15 border border-accent/30 text-xs text-accent font-semibold flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-2xs opacity-70 hover:opacity-100 uppercase">Fechar</button>
        </div>
      )}

      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-4 space-y-1.5 border-border">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-2xs font-bold uppercase tracking-wider">Total Cadastrados</span>
            <Users className="w-4 h-4 text-accent" />
          </div>
          <p className="text-2xl font-black text-text-primary tabular-nums">{totalBarbers}</p>
          <p className="text-2xs text-text-muted">Barbearias na plataforma</p>
        </div>

        <div className="card p-4 space-y-1.5 border-success/20 bg-success/5">
          <div className="flex items-center justify-between text-success">
            <span className="text-2xs font-bold uppercase tracking-wider">Assinantes Ativos</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-success tabular-nums">{totalActive}</p>
          <p className="text-2xs text-text-muted">Planos ativos liberados</p>
        </div>

        <div className="card p-4 space-y-1.5 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-2xs font-bold uppercase tracking-wider">Em Teste Grátis</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-amber-400 tabular-nums">{totalTrial}</p>
          <p className="text-2xs text-text-muted">Período de teste ativo</p>
        </div>

        <div className="card p-4 space-y-1.5 border-danger/20 bg-danger/5">
          <div className="flex items-center justify-between text-danger">
            <span className="text-2xs font-bold uppercase tracking-wider">Expirados / Suspensos</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-danger tabular-nums">{totalExpired}</p>
          <p className="text-2xs text-text-muted">Aguardando renovação PIX</p>
        </div>
      </div>

      {/* Barra de Pesquisa e Filtros de Abas */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por barbeiro, salão ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 text-xs py-2 w-full"
          />
        </div>

        <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl border border-border w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilter('ALL')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
              filter === 'ALL' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-text-muted hover:text-text-primary'
            )}
          >
            Todos ({totalBarbers})
          </button>
          <button
            onClick={() => setFilter('ACTIVE')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
              filter === 'ACTIVE' ? 'bg-success text-white shadow-sm' : 'text-text-muted hover:text-text-primary'
            )}
          >
            Ativos ({totalActive})
          </button>
          <button
            onClick={() => setFilter('TRIAL')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
              filter === 'TRIAL' ? 'bg-amber-500 text-black shadow-sm' : 'text-text-muted hover:text-text-primary'
            )}
          >
            Testes ({totalTrial})
          </button>
          <button
            onClick={() => setFilter('EXPIRED')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
              filter === 'EXPIRED' ? 'bg-danger text-white shadow-sm' : 'text-text-muted hover:text-text-primary'
            )}
          >
            Expirados ({totalExpired})
          </button>
        </div>
      </div>

      {/* Lista de Barbeiros */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center card">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <p className="text-sm text-text-muted">Carregando contas cadastradas...</p>
          </div>
        ) : filteredBarbers.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-center card">
            <Users className="w-10 h-10 text-text-muted/30" />
            <p className="text-sm font-semibold text-text-primary">Nenhum barbeiro encontrado</p>
            <p className="text-xs text-text-muted">Tente mudar o termo da busca ou o filtro selecionado.</p>
          </div>
        ) : (
          filteredBarbers.map((b) => {
            const isCurrentLoading = actionLoading === b.id
            const isSuperAdmin = b.role === 'ADMIN' || b.email.toLowerCase() === 'rcsfempresa@gmail.com'
            const remainingDays = getDaysRemaining(b.trialEndsAt)
            const waUrl = getWhatsAppUrl(b)

            return (
              <div
                key={b.id}
                className={cn(
                  'card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all duration-200 hover:border-accent/40',
                  b.status === 'SUSPENDED' && 'opacity-70 bg-surface-2/40',
                  isSuperAdmin && 'border-amber-500/30 bg-amber-500/5'
                )}
              >
                {/* Informações da Barbearia & Barbeiro */}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-text-primary truncate">{b.salonName}</h3>
                    <span className="text-xs text-text-muted">•</span>
                    <span className="text-sm font-semibold text-text-secondary truncate">{b.name}</span>

                    {/* Badges Dinâmicos de Status */}
                    {isSuperAdmin ? (
                      <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/40 text-2xs font-black tracking-wide">
                        👑 SUPER ADMIN (VITALÍCIO)
                      </span>
                    ) : (b.isExpired || b.status === 'SUSPENDED' || (remainingDays !== null && remainingDays <= 0)) ? (
                      <span className="badge bg-danger/20 text-danger border border-danger/40 text-2xs font-bold animate-pulse">
                        🔴 EXPIROU {remainingDays !== null && remainingDays < 0 ? `HÁ ${Math.abs(remainingDays)} DIA(S)` : 'HOJE'}
                      </span>
                    ) : (remainingDays !== null && remainingDays <= 3) ? (
                      <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/40 text-2xs font-bold animate-pulse">
                        ⚠️ VENCE EM {remainingDays === 0 ? 'HOJE' : `${remainingDays} DIA(S)`}
                      </span>
                    ) : b.status === 'ACTIVE' ? (
                      <span className="badge bg-success/20 text-success border border-success/30 text-2xs font-bold">
                        🟢 ASSINATURA ATIVA
                      </span>
                    ) : (
                      <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/30 text-2xs font-bold">
                        🟡 TESTE GRÁTIS ({remainingDays !== null ? `${remainingDays}d restantes` : ''})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
                    <span>E-mail: <strong className="text-text-primary">{b.email}</strong></span>
                    {b.phone && <span>Tel: <strong className="text-text-primary">{b.phone}</strong></span>}
                    <span>
                      Vencimento:{' '}
                      <strong className={cn('text-text-primary', isSuperAdmin && 'text-amber-400 font-bold')}>
                        {isSuperAdmin ? 'Vitalício / Acesso Ilimitado' : formatExpirationDate(b.trialEndsAt)}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Botoeira de Ações do Administrador */}
                <div className="flex items-center gap-2 flex-wrap flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
                  {/* Para Super Admin (si mesmo), exibe apenas a indicação */}
                  {isSuperAdmin ? (
                    <span className="text-2xs font-bold text-amber-400/80 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                      Conta do Sistema (Sem Expiração)
                    </span>
                  ) : (
                    <>
                      {/* WhatsApp Direto com Mensagem Dinâmica */}
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1.5 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                          title="Falar no WhatsApp (Mensagem Inteligente de Acordo com a Validade)"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}

                      {/* Ativar +30 dias */}
                      <button
                        onClick={() => handleActivate(b.id, b.name)}
                        disabled={isCurrentLoading}
                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                        title="Ativar ou renovar por +30 dias a partir de hoje"
                      >
                        {isCurrentLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>+30 Dias (Ativar)</span>
                      </button>

                      {/* Prorrogar +3 dias */}
                      <button
                        onClick={() => handleExtendTrial(b.id, b.name)}
                        disabled={isCurrentLoading}
                        className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1 text-amber-400 border-amber-500/30 hover:bg-amber-500/10 font-semibold"
                        title="Adicionar mais 3 dias de teste grátis"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>+3 Dias</span>
                      </button>

                      {/* Suspender */}
                      {b.status !== 'SUSPENDED' && (
                        <button
                          onClick={() => handleSuspend(b.id, b.name)}
                          disabled={isCurrentLoading}
                          className="p-2 rounded-lg bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 transition-colors"
                          title="Suspender Acesso"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Excluir */}
                      <button
                        onClick={() => handleDelete(b.id, b.name)}
                        disabled={isCurrentLoading}
                        className="p-2 rounded-lg bg-surface-3 hover:bg-danger/20 text-text-muted hover:text-danger border border-border transition-colors"
                        title="Excluir Conta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

