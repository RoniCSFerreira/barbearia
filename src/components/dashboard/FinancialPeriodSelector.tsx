'use client'

import { useState } from 'react'
import { Calendar, Filter, X, Check } from 'lucide-react'
import { FinancialPeriod } from '@/services/financial'
import { cn } from '@/lib/utils'

interface FinancialPeriodSelectorProps {
  selectedPeriod: FinancialPeriod
  startDate?: string
  endDate?: string
  onPeriodChange: (period: FinancialPeriod, customStart?: string, customEnd?: string) => void
}

const PERIOD_OPTIONS: { id: FinancialPeriod; label: string }[] = [
  { id: 'today', label: 'Hoje' },
  { id: 'week', label: 'Esta Semana' },
  { id: 'month', label: 'Este Mês' },
  { id: 'year', label: 'Este Ano' },
  { id: 'custom', label: 'Customizado' },
]

export default function FinancialPeriodSelector({
  selectedPeriod,
  startDate,
  endDate,
  onPeriodChange,
}: FinancialPeriodSelectorProps) {
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [tempStart, setTempStart] = useState(startDate || new Date().toISOString().split('T')[0])
  const [tempEnd, setTempEnd] = useState(endDate || new Date().toISOString().split('T')[0])

  const handleSelectPeriod = (period: FinancialPeriod) => {
    if (period === 'custom') {
      setShowCustomModal(true)
    } else {
      setShowCustomModal(false)
      onPeriodChange(period)
    }
  }

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tempStart || !tempEnd) return
    setShowCustomModal(false)
    onPeriodChange('custom', tempStart, tempEnd)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-2 border border-border overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 px-2 text-text-muted">
          <Filter className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-2xs font-semibold uppercase tracking-wider hidden sm:inline">Período</span>
        </div>

        {PERIOD_OPTIONS.map((opt) => {
          const isActive = selectedPeriod === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelectPeriod(opt.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0',
                isActive
                  ? 'bg-accent text-accent-foreground shadow-sm scale-[1.02]'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-3'
              )}
            >
              {opt.id === 'custom' && <Calendar className="w-3.5 h-3.5" />}
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Modal / Card para Seleção Customizada de Datas */}
      {showCustomModal && (
        <div className="card p-4 space-y-3 border-accent/40 bg-surface-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              <h4 className="text-xs font-bold text-text-primary">Selecionar Intervalo de Datas</h4>
            </div>
            <button
              type="button"
              onClick={() => setShowCustomModal(false)}
              className="p-1 text-text-muted hover:text-text-primary rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleApplyCustom} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-2xs font-medium text-text-muted">Data Inicial</label>
              <input
                type="date"
                value={tempStart}
                onChange={(e) => setTempStart(e.target.value)}
                className="input text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-2xs font-medium text-text-muted">Data Final</label>
              <input
                type="date"
                value={tempEnd}
                onChange={(e) => setTempEnd(e.target.value)}
                className="input text-xs"
                required
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="btn-ghost text-xs py-1.5"
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary text-xs py-1.5 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Aplicar Filtro
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
