import { mockAppointments } from '@/lib/mock-data'
import { formatCurrency, cn } from '@/lib/utils'
import { CheckCircle2, Scissors, Clock, ListTodo } from 'lucide-react'
import type { AppointmentItem } from '@/services/appointments'

interface DayProgressProps {
  initialAppointments?: AppointmentItem[]
}

export default function DayProgress({ initialAppointments }: DayProgressProps) {
  const appointments = initialAppointments !== undefined ? initialAppointments : mockAppointments
  const done = appointments.filter(a => a.status === 'DONE')
  const inProgress = appointments.filter(a => (a.status as string) === 'IN_PROGRESS')
  const pending = appointments.filter(a => a.status === 'PENDING' || a.status === 'CONFIRMED')

  const totalRevenue = done.reduce((s, a) => s + a.price, 0)
  const projectedRevenue = appointments.reduce((s, a) => s + a.price, 0)
  const progressPercent = appointments.length > 0 ? Math.round((done.length / appointments.length) * 100) : 0

  const segments = [
    { label: 'Concluídos', count: done.length, icon: CheckCircle2, colorClass: 'text-success', bgClass: 'bg-success/10 border-success/20', barClass: 'bg-success' },
    { label: 'Em Corte', count: inProgress.length, icon: Scissors, colorClass: 'text-accent', bgClass: 'bg-accent/10 border-accent/20', barClass: 'bg-accent' },
    { label: 'Agendados', count: pending.length, icon: Clock, colorClass: 'text-text-secondary', bgClass: 'bg-surface-3 border-border', barClass: 'bg-surface-3' },
  ]

  return (
    <div className="card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold text-text-primary">Progresso do Dia</h3>
        </div>
        <span className="text-2xs text-text-muted">
          {done.length}/{appointments.length} cortes
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="w-full h-2 bg-surface-3 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-accent rounded-full transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-2xs text-text-muted">
          <span>{progressPercent}% concluído</span>
          <span>Projeção: <span className="text-text-primary font-semibold">{formatCurrency(projectedRevenue)}</span></span>
        </div>
      </div>

      {/* Status segments */}
      <div className="grid grid-cols-3 gap-2">
        {segments.map(({ label, count, icon: Icon, colorClass, bgClass }) => (
          <div key={label} className={cn('rounded-xl border p-3 text-center space-y-1', bgClass)}>
            <Icon className={cn('w-4 h-4 mx-auto', colorClass)} />
            <p className={cn('text-xl font-black tabular-nums', colorClass)}>{count}</p>
            <p className="text-2xs text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue done */}
      <div className="flex items-center justify-between pt-1 border-t border-border text-xs">
        <span className="text-text-muted">Já no caixa:</span>
        <span className="font-bold text-success tabular-nums">{formatCurrency(totalRevenue)}</span>
      </div>
    </div>
  )
}
