'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  UserCircle, Scissors, Percent, CheckCircle2, Info,
  ChevronLeft, Pencil, X, Lock, Clock, Calendar, LogOut,
  ShieldCheck, Sparkles, MessageCircle,
} from 'lucide-react'
import { mockUser, mockOrganization } from '@/lib/mock-data'
import {
  getBarberProfile, updateBarberProfile,
  saveBarberScheduleAction, getBarberScheduleAction,
  type ScheduleData,
} from '@/app/actions/profile'
import { logoutBarberAction } from '@/app/actions/auth'
import { formatCurrency, cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────
type CommissionRate = 0 | 10 | 20 | 30 | 40 | 50
const COMMISSION_OPTIONS: CommissionRate[] = [10, 20, 30, 40, 50]

const STORAGE_COMMISSION = 'barbearia_commission_rate'
const STORAGE_PROFILE    = 'barbearia_profile'
const STORAGE_SCHEDULE   = 'barbearia_schedule'

interface ProfileData {
  name:      string
  phone:     string
  salonName: string
}

type SlotMinutes = 30 | 40 | 45 | 60
const SLOT_OPTIONS: SlotMinutes[] = [30, 40, 45, 60]

const defaultSchedule: ScheduleData = {
  workDays: {
    seg: true,
    ter: true,
    qua: true,
    qui: true,
    sex: true,
    sab: true,
    dom: false,
  },
  startTime: '09:00',
  endTime: '18:00',
  breakEnabled: true,
  breakStart: '12:30',
  breakEnd: '13:30',
  slotMinutes: 30,
}

const DAYS_OF_WEEK = [
  { id: 'seg', label: 'Seg', full: 'Segunda'  },
  { id: 'ter', label: 'Ter', full: 'Terça'    },
  { id: 'qua', label: 'Qua', full: 'Quarta'   },
  { id: 'qui', label: 'Qui', full: 'Quinta'   },
  { id: 'sex', label: 'Sex', full: 'Sexta'    },
  { id: 'sab', label: 'Sáb', full: 'Sábado'  },
  { id: 'dom', label: 'Dom', full: 'Domingo'  },
]

/** Gera lista de opções de horário com passo de 30 minutos */
function buildTimeOptions(startH = 5, endH = 24): string[] {
  const opts: string[] = []
  for (let h = startH; h < endH; h++) {
    opts.push(`${String(h).padStart(2, '0')}:00`)
    opts.push(`${String(h).padStart(2, '0')}:30`)
  }
  return opts
}

const ALL_TIMES   = buildTimeOptions(5, 24)
const BREAK_TIMES = buildTimeOptions(9, 22)

// ── Helpers ────────────────────────────────────────────────────
function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2)  return d
  if (d.length <= 7)  return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

// ── Component ──────────────────────────────────────────────────
export default function PerfilPage() {

  /* commission */
  const [commissionRate, setCommissionRate] = useState<CommissionRate>(
    mockUser.commission_rate as CommissionRate
  )
  const [hasCommission, setHasCommission] = useState(mockUser.commission_rate > 0)
  const [commSaved, setCommSaved] = useState(false)

  /* profile & account */
  const [accountEmail, setAccountEmail] = useState(mockUser.email)
  const [accountStatus, setAccountStatus] = useState('TRIAL')
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)

  const defaultProfile: ProfileData = {
    name:      mockUser.name,
    phone:     mockUser.phone,
    salonName: mockOrganization.name,
  }
  const [profile, setProfile] = useState<ProfileData>(defaultProfile)
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState<ProfileData>(defaultProfile)
  const [profSaved, setProfSaved] = useState(false)

  /* schedule */
  const [schedule, setSchedule] = useState<ScheduleData>(defaultSchedule)
  const [schedSaved, setSchedSaved] = useState(false)

  /* load from server & localStorage on mount */
  useEffect(() => {
    // 1. Carrega dados reais do banco
    getBarberProfile().then((data) => {
      if (data) {
        const loaded: ProfileData = {
          name: data.name,
          phone: data.phone,
          salonName: data.salonName,
        }
        setProfile(loaded)
        setDraft(loaded)
        setAccountEmail(data.email)
        setAccountStatus(data.status)
        setTrialEndsAt(data.trialEndsAt)
        if (data.commissionRate !== undefined) {
          setCommissionRate(data.commissionRate as CommissionRate)
          setHasCommission(data.commissionRate > 0)
        }
        localStorage.setItem(STORAGE_PROFILE, JSON.stringify({ ...loaded, email: data.email }))
      }
    })

    // 2. Carrega horários de atendimento do servidor
    getBarberScheduleAction().then((sched) => {
      if (sched) {
        setSchedule(sched)
        localStorage.setItem(STORAGE_SCHEDULE, JSON.stringify(sched))
      }
    })

    // 3. Fallbacks de localStorage
    const storedComm = localStorage.getItem(STORAGE_COMMISSION)
    if (storedComm !== null) {
      const rate = Number(storedComm) as CommissionRate
      setCommissionRate(rate)
      setHasCommission(rate > 0)
    }
  }, [])

  /* commission handlers */
  const handleToggle = (enabled: boolean) => {
    setHasCommission(enabled)
    if (!enabled) setCommissionRate(0)
    else if (commissionRate === 0) setCommissionRate(30)
  }

  const handleSaveComm = async () => {
    const rate = hasCommission ? commissionRate : 0
    localStorage.setItem(STORAGE_COMMISSION, String(rate))
    await updateBarberProfile({
      name: profile.name,
      phone: profile.phone,
      salonName: profile.salonName,
      commissionRate: rate,
    })
    setCommSaved(true)
    setTimeout(() => setCommSaved(false), 3000)
  }

  /* profile handlers */
  const handleEdit = () => {
    setDraft(profile)
    setEditing(true)
  }

  const handleCancel = () => {
    setDraft(profile)
    setEditing(false)
  }

  const handleSaveProfile = async () => {
    setProfile(draft)
    setEditing(false)
    setProfSaved(true)
    setTimeout(() => setProfSaved(false), 3000)
    await updateBarberProfile({
      name: draft.name,
      phone: draft.phone,
      salonName: draft.salonName,
      commissionRate: hasCommission ? commissionRate : 0,
    })
    localStorage.setItem(STORAGE_PROFILE, JSON.stringify({ ...draft, email: accountEmail }))
  }

  /* schedule handlers */
  const handleToggleDay = (dayId: string) => {
    setSchedule(s => ({
      ...s,
      workDays: {
        ...s.workDays,
        [dayId]: !s.workDays[dayId],
      },
    }))
  }

  const applyDayPreset = (preset: 'seg-sab' | 'ter-sab' | 'all') => {
    setSchedule(s => {
      const next = { ...s.workDays }
      if (preset === 'seg-sab') {
        next.seg = true; next.ter = true; next.qua = true; next.qui = true; next.sex = true; next.sab = true; next.dom = false
      } else if (preset === 'ter-sab') {
        next.seg = false; next.ter = true; next.qua = true; next.qui = true; next.sex = true; next.sab = true; next.dom = false
      } else {
        next.seg = true; next.ter = true; next.qua = true; next.qui = true; next.sex = true; next.sab = true; next.dom = true
      }
      return { ...s, workDays: next }
    })
  }

  const handleSaveSchedule = async () => {
    await saveBarberScheduleAction(schedule)
    localStorage.setItem(STORAGE_SCHEDULE, JSON.stringify(schedule))
    setSchedSaved(true)
    setTimeout(() => setSchedSaved(false), 3000)
  }

  const initials = profile.name
    ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'VB'

  const exampleRevenue = 1000
  const effectiveRate = hasCommission ? commissionRate : 0
  const commission = (exampleRevenue * effectiveRate) / 100
  const net = exampleRevenue - commission

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Back button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Voltar ao Dashboard
      </Link>

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
          <span className="text-lg font-black text-accent-foreground">{initials}</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Meu Perfil</h1>
          <p className="text-sm text-text-muted">Configure suas informações, horários e repasse</p>
        </div>
      </div>

      {/* ── Card: Dados pessoais ── */}
      <div className="card p-5 space-y-4">

        {/* card header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCircle className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold text-text-primary">Dados Pessoais</h2>
          </div>

          {!editing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-semibold border border-border bg-surface-2 text-text-secondary hover:border-accent/40 hover:text-accent transition-all duration-150"
            >
              <Pencil className="w-3 h-3" />
              Editar
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-2xs font-semibold border border-border bg-surface-2 text-text-muted hover:text-text-primary transition-all"
              >
                <X className="w-3 h-3" />
                Cancelar
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-2xs font-semibold btn-primary"
              >
                <CheckCircle2 className="w-3 h-3" />
                Salvar
              </button>
            </div>
          )}
        </div>

        {/* inline success toast */}
        {profSaved && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/20 text-xs text-success">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Perfil atualizado com sucesso!
          </div>
        )}

        {/* fields grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Nome */}
          <div className="space-y-1.5">
            <label className="text-2xs text-text-muted uppercase tracking-wider font-semibold">
              Seu Nome
            </label>
            {editing ? (
              <input
                type="text"
                value={draft.name}
                onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                placeholder="Ex: Carlos Mestre"
                className="input text-sm"
                autoFocus
              />
            ) : (
              <p className="text-text-primary font-medium text-sm">{profile.name}</p>
            )}
          </div>

          {/* Telefone */}
          <div className="space-y-1.5">
            <label className="text-2xs text-text-muted uppercase tracking-wider font-semibold">
              Telefone / WhatsApp
            </label>
            {editing ? (
              <input
                type="tel"
                value={draft.phone}
                onChange={e => setDraft(d => ({ ...d, phone: formatPhone(e.target.value) }))}
                placeholder="(11) 99999-9999"
                className="input text-sm"
              />
            ) : (
              <p className="text-text-primary font-medium text-sm">{profile.phone}</p>
            )}
          </div>

          {/* E-mail — somente leitura */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-2xs text-text-muted uppercase tracking-wider font-semibold">
              E-mail
              <Lock className="w-2.5 h-2.5 opacity-60" />
            </label>
            <p className={cn('text-sm', editing ? 'text-text-muted/60' : 'text-text-secondary')}>
              {accountEmail || mockUser.email}
            </p>
            {editing && (
              <p className="text-2xs text-text-muted/50 -mt-0.5">
                O e-mail não pode ser alterado aqui.
              </p>
            )}
          </div>

          {/* Nome da Barbearia */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-2xs text-text-muted uppercase tracking-wider font-semibold">
              <Scissors className="w-3 h-3 text-accent" />
              Nome da Barbearia
            </label>
            {editing ? (
              <input
                type="text"
                value={draft.salonName}
                onChange={e => setDraft(d => ({ ...d, salonName: e.target.value }))}
                placeholder="Ex: Navalha & Co."
                className="input text-sm"
              />
            ) : (
              <div className="flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-accent" />
                <p className="text-text-primary font-medium text-sm">{profile.salonName}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Card: Horários de Atendimento ── */}
      <div className="card p-5 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent" />
          <div>
            <h2 className="text-sm font-bold text-text-primary">Horários de Atendimento</h2>
            <p className="text-xs text-text-muted">Configure quando você está disponível para clientes</p>
          </div>
        </div>

        {schedSaved && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/20 text-xs text-success">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Horários de atendimento atualizados!
          </div>
        )}

        {/* ── Seção 1: Dias da Semana ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-2xs text-text-muted uppercase tracking-wider font-semibold">
              Dias da Semana de Atendimento
            </label>
            {/* Atalhos rápidos */}
            <div className="flex items-center gap-1.5">
              {(['seg-sab', 'ter-sab', 'all'] as const).map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyDayPreset(preset)}
                  className="px-2.5 py-1 rounded-lg text-2xs font-semibold border border-border bg-surface-2 text-text-secondary hover:border-accent/50 hover:text-accent transition-all duration-150"
                >
                  {preset === 'seg-sab' ? 'Seg a Sáb' : preset === 'ter-sab' ? 'Ter a Sáb' : 'Todos os Dias'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {DAYS_OF_WEEK.map(d => {
              const active = schedule.workDays[d.id]
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleToggleDay(d.id)}
                  className={cn(
                    'flex flex-col items-center py-2.5 px-1 rounded-xl border transition-all duration-150 active:scale-95',
                    active
                      ? 'bg-accent text-accent-foreground border-transparent'
                      : 'bg-surface-2 text-text-muted border-border hover:border-accent/40'
                  )}
                >
                  <span className="text-xs font-bold">{d.label}</span>
                  <span className={cn(
                    'mt-1.5 text-2xs px-1.5 py-0.5 rounded-full font-semibold',
                    active ? 'bg-white/20 text-accent-foreground' : 'bg-surface-3 text-text-muted'
                  )}>
                    {active ? 'Atende' : 'Folga'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="border-t border-border" />

        {/* ── Seção 2: Expediente ── */}
        <div className="space-y-3">
          <label className="text-2xs text-text-muted uppercase tracking-wider font-semibold">
            Horários do Expediente
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-text-secondary font-medium">Início do Expediente</label>
              <select
                value={schedule.startTime}
                onChange={e => setSchedule(s => ({ ...s, startTime: e.target.value }))}
                className="input text-sm"
              >
                {ALL_TIMES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-text-secondary font-medium">Término do Expediente</label>
              <select
                value={schedule.endTime}
                onChange={e => setSchedule(s => ({ ...s, endTime: e.target.value }))}
                className="input text-sm"
              >
                {ALL_TIMES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Seção 3: Intervalo de Almoço/Pausa ── */}
        <div className="rounded-xl border border-border bg-surface-2 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Intervalo de Almoço / Pausa Técnica</p>
                <p className="text-xs text-text-muted">Bloqueia um período do expediente</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSchedule(s => ({ ...s, breakEnabled: !s.breakEnabled }))}
              className={cn(
                'relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0',
                schedule.breakEnabled ? 'bg-accent' : 'bg-surface-3'
              )}
            >
              <span className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300',
                schedule.breakEnabled ? 'translate-x-5' : 'translate-x-0'
              )} />
            </button>
          </div>

          {schedule.breakEnabled && (
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs text-text-secondary font-medium">Início da Pausa</label>
                <select
                  value={schedule.breakStart}
                  onChange={e => setSchedule(s => ({ ...s, breakStart: e.target.value }))}
                  className="input text-sm bg-surface"
                >
                  {BREAK_TIMES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-text-secondary font-medium">Retorno da Pausa</label>
                <select
                  value={schedule.breakEnd}
                  onChange={e => setSchedule(s => ({ ...s, breakEnd: e.target.value }))}
                  className="input text-sm bg-surface"
                >
                  {BREAK_TIMES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ── Seção 4: Intervalo entre clientes ── */}
        <div className="space-y-3">
          <div>
            <label className="text-2xs text-text-muted uppercase tracking-wider font-semibold">
              Intervalo Padrão entre Clientes
            </label>
            <p className="text-xs text-text-muted mt-0.5">Tempo alocado por padrão para geração de novos slots na agenda</p>
          </div>
          <div className="flex items-center gap-2">
            {SLOT_OPTIONS.map(mins => (
              <button
                key={mins}
                type="button"
                onClick={() => setSchedule(s => ({ ...s, slotMinutes: mins as SlotMinutes }))}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all duration-150 active:scale-95',
                  schedule.slotMinutes === mins
                    ? 'bg-accent text-accent-foreground border-transparent'
                    : 'bg-surface-2 text-text-secondary border-border hover:border-accent/40 hover:text-text-primary'
                )}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Salvar */}
        <button
          onClick={handleSaveSchedule}
          className={cn(
            'w-full py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2',
            schedSaved
              ? 'bg-success/20 text-success border border-success/30'
              : 'btn-primary'
          )}
        >
          {schedSaved ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Horários salvos!
            </>
          ) : (
            'Salvar Horários de Atendimento'
          )}
        </button>
      </div>

      {/* ── Card: Configuração de repasse ── */}
      <div className="card p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Percent className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-bold text-text-primary">Configuração de Repasse</h2>
        </div>

        {/* Info box */}
        <div className="flex gap-2.5 p-3 rounded-xl bg-accent/5 border border-accent/15">
          <Info className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary leading-relaxed">
            Você trabalha num salão e repassa uma parte do faturamento ao espaço?
            Ative abaixo e escolha o percentual. Isso será descontado automaticamente
            do seu Lucro Líquido no Dashboard.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-text-primary">Repasse ao salão</p>
            <p className="text-xs text-text-muted">
              {hasCommission
                ? `${commissionRate}% do faturamento bruto`
                : 'Desativado — você fica com 100%'}
            </p>
          </div>
          <button
            onClick={() => handleToggle(!hasCommission)}
            className={cn(
              'relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0',
              hasCommission ? 'bg-accent' : 'bg-surface-3'
            )}
          >
            <span className={cn(
              'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300',
              hasCommission ? 'translate-x-5' : 'translate-x-0'
            )} />
          </button>
        </div>

        {/* Rate selector */}
        {hasCommission && (
          <div className="space-y-3">
            <p className="text-xs text-text-muted font-medium">Selecione o percentual:</p>
            <div className="grid grid-cols-5 gap-2">
              {COMMISSION_OPTIONS.map(rate => (
                <button
                  key={rate}
                  onClick={() => setCommissionRate(rate)}
                  className={cn(
                    'py-3 rounded-xl text-sm font-bold border transition-all duration-150 active:scale-95',
                    commissionRate === rate
                      ? 'bg-accent text-accent-foreground border-transparent'
                      : 'bg-surface-2 text-text-secondary border-border hover:border-accent/40 hover:text-text-primary'
                  )}
                >
                  {rate}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preview simulação */}
        <div className="rounded-xl bg-surface-2 border border-border p-4 space-y-2">
          <p className="text-2xs text-text-muted uppercase tracking-wider">
            Simulação com R$ 1.000,00 de faturamento
          </p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Faturamento Bruto</span>
              <span className="font-semibold text-text-primary tabular-nums">{formatCurrency(exampleRevenue)}</span>
            </div>
            {hasCommission && (
              <div className="flex justify-between">
                <span className="text-text-muted">Repasse ao Salão ({effectiveRate}%)</span>
                <span className="font-semibold text-danger tabular-nums">- {formatCurrency(commission)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1.5 border-t border-border">
              <span className="font-bold text-text-primary">Você recebe</span>
              <span className="font-black text-success tabular-nums">{formatCurrency(net)}</span>
            </div>
          </div>
        </div>

        {/* Save commission button */}
        <button
          onClick={handleSaveComm}
          className={cn(
            'w-full py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2',
            commSaved
              ? 'bg-success/20 text-success border border-success/30'
              : 'btn-primary'
          )}
        >
          {commSaved ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Configuração salva!
            </>
          ) : (
            'Salvar Configuração de Repasse'
          )}
        </button>
      </div>

      {/* ── Card: Sua Conta e Assinatura ── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold text-text-primary">Sua Conta & Acesso</h2>
          </div>
          {accountStatus === 'TRIAL' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sparkles className="w-3 h-3" />
              Teste Grátis (3 Dias)
            </span>
          ) : accountStatus === 'ACTIVE' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-success/10 border border-success/20 text-success">
              <CheckCircle2 className="w-3 h-3" />
              Plano Ativo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-danger/10 border border-danger/20 text-danger">
              Suspenso
            </span>
          )}
        </div>

        <p className="text-xs text-text-secondary leading-relaxed">
          {accountStatus === 'TRIAL'
            ? 'Você está utilizando o período de testes gratuito. Ao término dos 3 dias, converse conosco pelo WhatsApp para manter seu acesso sem interrupções.'
            : 'Sua conta de barbeiro solo está ativa com acesso completo a todas as funcionalidades.'}
        </p>

        {accountStatus === 'TRIAL' && (
          <a
            href={`https://wa.me/${(process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '5511999999999').replace(/\D/g, '')}?text=${encodeURIComponent(
              `Olá! Sou o barbeiro ${profile.name}, estou testando o sistema e quero assinar o plano definitivo.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600/90 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            Falar no WhatsApp para Assinar Plano
          </a>
        )}

        <div className="pt-2 border-t border-border flex items-center justify-between">
          <span className="text-2xs text-text-muted">Desconectar deste dispositivo</span>
          <form action={logoutBarberAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-semibold text-danger bg-danger/10 border border-danger/20 hover:bg-danger/20 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Sair da Conta
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
