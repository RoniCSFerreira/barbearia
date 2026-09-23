'use client'

import { useState } from 'react'
import { TimeSeriesPoint } from '@/services/financial'
import { formatCurrency, cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'

interface FinancialBarChartProps {
  data: TimeSeriesPoint[]
  title?: string
}

export default function FinancialBarChart({ data, title = 'Evolução Financeira (Faturamento vs Gastos)' }: FinancialBarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.income, d.expense)),
    100
  )

  const totalIncome = data.reduce((acc, curr) => acc + curr.income, 0)
  const totalExpense = data.reduce((acc, curr) => acc + curr.expense, 0)

  return (
    <div className="card p-5 space-y-4">
      {/* Header com Legendas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-accent/10 text-accent">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">{title}</h3>
            <p className="text-2xs text-text-muted">Comparativo por período</p>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-accent inline-block" />
            <span className="text-text-muted">Faturamento:</span>
            <span className="font-bold text-text-primary tabular-nums">{formatCurrency(totalIncome)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-danger inline-block" />
            <span className="text-text-muted">Despesas:</span>
            <span className="font-bold text-text-primary tabular-nums">{formatCurrency(totalExpense)}</span>
          </div>
        </div>
      </div>

      {/* Área do Gráficos de Barras */}
      <div className="relative pt-6 pb-2">
        <div className="h-44 flex items-end justify-between gap-2 px-2 border-b border-border">
          {data.map((item, idx) => {
            const incomeHeightPct = Math.max(Math.round((item.income / maxVal) * 100), item.income > 0 ? 4 : 0)
            const expenseHeightPct = Math.max(Math.round((item.expense / maxVal) * 100), item.expense > 0 ? 4 : 0)
            const isHovered = hoveredIdx === idx

            return (
              <div
                key={`${item.label}-${idx}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="relative flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
              >
                {/* Tooltip no Hover */}
                {isHovered && (
                  <div className="absolute -top-12 z-20 bg-surface-3 border border-border p-2 rounded-lg shadow-xl text-2xs space-y-1 min-w-[110px] animate-fade-in pointer-events-none">
                    <p className="font-bold text-text-primary text-center border-b border-border pb-1">
                      {item.label}
                    </p>
                    <div className="flex justify-between gap-2 text-accent">
                      <span>Entradas:</span>
                      <span className="font-bold">{formatCurrency(item.income)}</span>
                    </div>
                    <div className="flex justify-between gap-2 text-danger">
                      <span>Saídas:</span>
                      <span className="font-bold">{formatCurrency(item.expense)}</span>
                    </div>
                  </div>
                )}

                {/* Colunas Lado a Lado */}
                <div className="w-full flex items-end justify-center gap-1 h-full pt-4">
                  {/* Coluna de Faturamento */}
                  <div
                    style={{ height: `${incomeHeightPct}%` }}
                    className={cn(
                      'w-1/2 max-w-[20px] rounded-t-md bg-accent transition-all duration-300',
                      isHovered ? 'brightness-125 scale-105' : 'opacity-90 hover:opacity-100'
                    )}
                  />
                  {/* Coluna de Despesas */}
                  <div
                    style={{ height: `${expenseHeightPct}%` }}
                    className={cn(
                      'w-1/2 max-w-[20px] rounded-t-md bg-danger transition-all duration-300',
                      isHovered ? 'brightness-125 scale-105' : 'opacity-85 hover:opacity-100'
                    )}
                  />
                </div>

                {/* Label do Eixo X */}
                <span
                  className={cn(
                    'text-2xs font-semibold mt-2 transition-colors truncate max-w-full',
                    isHovered ? 'text-accent font-bold' : 'text-text-muted'
                  )}
                >
                  {item.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
