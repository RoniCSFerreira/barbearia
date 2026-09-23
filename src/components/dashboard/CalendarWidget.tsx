'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAppointmentDaysForMonth } from '@/services/appointments'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]
const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

interface CalendarWidgetProps {
  currentSelectedDate?: Date
  dailyCount?: number
  organizationId?: string
}

export default function CalendarWidget({ currentSelectedDate, dailyCount = 0, organizationId }: CalendarWidgetProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const today = new Date()
  const activeDate = currentSelectedDate || today

  const [viewDate, setViewDate] = useState(() => new Date(activeDate.getFullYear(), activeDate.getMonth(), 1))
  const [appointmentDays, setAppointmentDays] = useState<Set<number>>(new Set())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const prevMonthDays = getDaysInMonth(year, month - 1)

  // Carrega dias com agendamento do banco para este mês (filtrado por organização)
  useEffect(() => {
    getAppointmentDaysForMonth(year, month, organizationId)
      .then((days) => {
        setAppointmentDays(new Set(days))
      })
      .catch((err) => {
        console.error('Erro ao buscar dias com agendamento:', err)
      })
  }, [year, month, organizationId])

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  const handleSelectDay = (day: number) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    const formatted = `${year}-${pad(month + 1)}-${pad(day)}`
    
    // Preserva outros search params se houver
    const params = new URLSearchParams(searchParams.toString())
    params.set('data', formatted)
    router.push(`/dashboard?${params.toString()}`)
  }

  const goToday = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))
    const params = new URLSearchParams(searchParams.toString())
    params.delete('data')
    router.push(`/dashboard${params.toString() ? `?${params.toString()}` : ''}`)
  }

  // Células da grade do calendário
  const cells: { day: number; isCurrentMonth: boolean; isFaded: boolean }[] = []

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, isCurrentMonth: false, isFaded: true })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, isCurrentMonth: true, isFaded: false })
  }
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, isCurrentMonth: false, isFaded: true })
  }

  const isToday = (day: number, isCurrent: boolean) =>
    isCurrent && day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const isSelected = (day: number, isCurrent: boolean) =>
    isCurrent &&
    day === activeDate.getDate() &&
    month === activeDate.getMonth() &&
    year === activeDate.getFullYear()

  const formattedDate = activeDate.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })

  return (
    <div className="card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-primary">
          {MONTHS[month]} {year}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={goToday}
            className="px-2 py-0.5 text-2xs font-semibold text-accent border border-accent/40 rounded-md hover:bg-accent/10 transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={prevMonth}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 text-center">
        {DAYS_SHORT.map((d) => (
          <div key={d} className="text-2xs font-semibold text-text-muted py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((cell, i) => {
          const todayCell = isToday(cell.day, cell.isCurrentMonth)
          const selectedCell = isSelected(cell.day, cell.isCurrentMonth)
          const hasAppt = cell.isCurrentMonth && appointmentDays.has(cell.day)

          return (
            <button
              key={i}
              onClick={() => cell.isCurrentMonth && handleSelectDay(cell.day)}
              disabled={!cell.isCurrentMonth}
              className={cn(
                'relative flex flex-col items-center justify-center h-8 w-full rounded-lg text-xs font-medium transition-all duration-150',
                cell.isFaded && 'text-text-muted/30 cursor-default',
                cell.isCurrentMonth && !selectedCell && !todayCell && 'text-text-secondary hover:bg-surface-2 hover:text-text-primary cursor-pointer',
                todayCell && !selectedCell && 'border border-accent text-accent font-bold',
                selectedCell && 'bg-accent text-accent-foreground font-bold shadow-md shadow-accent/25'
              )}
            >
              {cell.day}
              {hasAppt && (
                <span
                  className={cn(
                    'absolute bottom-0.5 w-1.5 h-1.5 rounded-full',
                    selectedCell ? 'bg-white' : 'bg-accent'
                  )}
                  title="Possui agendamentos"
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-1.5 text-2xs text-text-muted">
          <Clock className="w-3.5 h-3.5 text-accent" />
          <span className="font-medium text-text-primary capitalize">{formattedDate}</span>
        </div>
        <span className="text-2xs font-bold text-accent">
          {dailyCount} {dailyCount === 1 ? 'agendamento' : 'agendamentos'}
        </span>
      </div>
    </div>
  )
}
