'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Trash2, X, Calendar, CheckCircle, Loader2 } from 'lucide-react'
import { deleteAppointmentsAction } from '@/app/actions/appointments'
import { cn } from '@/lib/utils'

interface ClearAppointmentsModalProps {
  onSuccess?: () => void
  buttonText?: string
  className?: string
  variant?: 'card' | 'button'
  initialDate?: string
}

function getTodayIso(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function ClearAppointmentsModal({
  onSuccess,
  buttonText = 'Limpar Agendamentos',
  className,
  variant = 'button',
  initialDate,
}: ClearAppointmentsModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'all' | 'day'>('day')

  const [selectedDate, setSelectedDate] = useState(() => initialDate || getTodayIso())

  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate)
    }
  }, [initialDate])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleOpen = () => {
    setError(null)
    setSuccessMsg(null)
    setIsOpen(true)
  }

  const handleClose = () => {
    if (loading) return
    setIsOpen(false)
  }

  const handleDelete = async () => {
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await deleteAppointmentsAction(mode, mode === 'day' ? selectedDate : undefined)

      if (!res.success) {
        setError(res.error || 'Falha ao excluir agendamentos.')
      } else {
        const count = res.count ?? 0
        const formattedDate = selectedDate.split('-').reverse().join('/')
        const msg =
          mode === 'all'
            ? `Sucesso! Todos os ${count} agendamento(s) foram excluídos permanentemente.`
            : `Sucesso! ${count} agendamento(s) do dia ${formattedDate} foram excluídos.`

        setSuccessMsg(msg)
        setTimeout(() => {
          setIsOpen(false)
          setSuccessMsg(null)
          router.refresh()
          if (onSuccess) onSuccess()
        }, 1500)
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado ao excluir agendamentos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ── TRIGGER BUTTON / CARD ── */}
      {variant === 'card' ? (
        <div className={cn('card p-4 space-y-3 border-danger/25 bg-danger/[0.03]', className)}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-text-primary">Zona de Atenção</p>
              <p className="text-2xs text-text-muted truncate">Exclusão em lote de agendamentos</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpen}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-danger/10 border border-danger/30 text-danger hover:bg-danger hover:text-white transition-all duration-200 text-xs font-bold active:scale-95 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {buttonText}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger/10 border border-danger/30 text-danger hover:bg-danger hover:text-white transition-all duration-200 text-xs font-bold active:scale-95 cursor-pointer',
            className
          )}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{buttonText}</span>
        </button>
      )}

      {/* ── MODAL DIALOG ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md card p-6 space-y-5 border-danger/30 shadow-2xl bg-surface animate-scale-in">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-danger/15 border border-danger/30 flex items-center justify-center text-danger flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Limpar Agendamentos</h3>
                  <p className="text-2xs text-text-muted">Selecione o escopo da exclusão</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ⚠️ IRREVERSIBLE WARNING NOTICE */}
            <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 space-y-1">
              <div className="flex items-center gap-1.5 text-danger font-bold text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>ATENÇÃO: ESTA AÇÃO É IRREVERSÍVEL!</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Os agendamentos excluídos serão removidos permanentemente do banco de dados e não poderão ser recuperados.
              </p>
            </div>

            {/* ERROR OR SUCCESS FEEDBACK */}
            {error && (
              <div className="p-3 rounded-lg bg-danger/20 border border-danger/40 text-danger text-xs font-semibold">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-success/20 border border-success/40 text-success text-xs font-semibold">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* OPTIONS FORM */}
            {!successMsg && (
              <div className="space-y-4">
                <label className="text-2xs text-text-muted uppercase tracking-wider font-semibold">
                  O que você deseja apagar?
                </label>

                <div className="space-y-2">
                  {/* Option 1: Specific day */}
                  <label
                    onClick={() => setMode('day')}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150',
                      mode === 'day'
                        ? 'border-danger/60 bg-danger/10 text-text-primary'
                        : 'border-border bg-surface-2 hover:border-danger/30 text-text-muted'
                    )}
                  >
                    <input
                      type="radio"
                      name="deleteMode"
                      checked={mode === 'day'}
                      onChange={() => setMode('day')}
                      className="accent-danger"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold">Apagar dia específico</p>
                      <p className="text-2xs text-text-muted">Exclui os horários marcados em uma data</p>
                    </div>
                  </label>

                  {/* Date Picker (shown if mode === 'day') */}
                  {mode === 'day' && (
                    <div className="pl-7 pt-1 space-y-1.5 animate-fade-in">
                      <label className="text-xs text-text-secondary font-medium flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-accent" />
                        Selecione a data:
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="input text-xs font-mono w-full bg-surface-2 border-border focus:border-danger"
                      />
                    </div>
                  )}

                  {/* Option 2: All appointments */}
                  <label
                    onClick={() => setMode('all')}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150',
                      mode === 'all'
                        ? 'border-danger/60 bg-danger/10 text-text-primary'
                        : 'border-border bg-surface-2 hover:border-danger/30 text-text-muted'
                    )}
                  >
                    <input
                      type="radio"
                      name="deleteMode"
                      checked={mode === 'all'}
                      onChange={() => setMode('all')}
                      className="accent-danger"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-danger">Apagar TODOS os agendamentos</p>
                      <p className="text-2xs text-text-muted">Zera completamente toda a agenda da barbearia</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            {!successMsg && (
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-border bg-surface-2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-danger hover:bg-danger/90 text-white transition-all duration-150 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir Permanentemente
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
