'use client'

import { useState } from 'react'
import { CategoryBreakdown } from '@/services/financial'
import { formatCurrency, cn } from '@/lib/utils'
import { PieChart } from 'lucide-react'

interface FinancialDonutChartProps {
  items: CategoryBreakdown[]
  title: string
  centerLabel?: string
  centerValue?: string
}

export default function FinancialDonutChart({
  items,
  title,
  centerLabel = 'Total',
  centerValue,
}: FinancialDonutChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const totalAmount = items.reduce((acc, curr) => acc + curr.amount, 0)
  const displayCenterValue = centerValue || formatCurrency(totalAmount)

  // Cálculo dos arcos SVG em percentual (Perímetro da circunferência = 2 * PI * r)
  // Com r = 40, C ≈ 251.327
  const radius = 40
  const circumference = 2 * Math.PI * radius

  let cumulativePercent = 0

  return (
    <div className="card p-4 sm:p-5 space-y-4 min-w-0 overflow-hidden">
      <div className="flex items-center gap-2 min-w-0">
        <div className="p-2 rounded-lg bg-accent/10 text-accent flex-shrink-0">
          <PieChart className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-text-primary truncate">{title}</h3>
          <p className="text-2xs text-text-muted">Distribuição percentual</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pt-1 min-w-0">
        {/* Gráfico Donut em SVG */}
        <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center flex-shrink-0 my-1 sm:my-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Círculo de fundo */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="stroke-surface-3"
              strokeWidth="14"
              fill="transparent"
            />

            {/* Slices em arco */}
            {items.map((item, idx) => {
              const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`
              const strokeDashoffset = -((cumulativePercent / 100) * circumference)
              cumulativePercent += item.percentage

              const isHovered = hoveredIdx === idx

              return (
                <circle
                  key={item.category}
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke={item.color}
                  strokeWidth={isHovered ? 18 : 14}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="transition-all duration-300 cursor-pointer"
                />
              )
            })}
          </svg>

          {/* Centro do Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2">
            <span className="text-2xs font-semibold text-text-muted uppercase tracking-wider">{centerLabel}</span>
            <span className="text-xs font-black text-text-primary truncate max-w-[85px] tabular-nums">{displayCenterValue}</span>
          </div>
        </div>

        {/* Legenda Lateral */}
        <div className="flex-1 w-full space-y-2 min-w-0">
          {items.length === 0 ? (
            <div className="text-xs text-text-muted italic py-4 text-center sm:text-left">
              Nenhum registro encontrado neste período.
            </div>
          ) : (
            items.map((item, idx) => {
              const isHovered = hoveredIdx === idx
              return (
                <div
                  key={item.category}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-lg transition-all duration-200 cursor-pointer min-w-0 gap-2',
                    isHovered ? 'bg-surface-3 scale-[1.01]' : 'bg-surface-2/60 hover:bg-surface-2'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-medium text-text-primary truncate">{item.category}</span>
                  </div>
                  <div className="text-right flex-shrink-0 flex items-baseline gap-1">
                    <span className="text-xs font-bold text-text-primary tabular-nums whitespace-nowrap">
                      {formatCurrency(item.amount)}
                    </span>
                    <span className="text-2xs font-bold text-text-muted tabular-nums whitespace-nowrap">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
