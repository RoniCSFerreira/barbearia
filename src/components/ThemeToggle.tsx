'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export default function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        type="button"
        className={cn(
          'p-2 rounded-lg text-text-muted border border-border bg-surface-2 transition-colors',
          className
        )}
        aria-label="Carregando tema..."
      >
        <div className="w-4 h-4" />
      </button>
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
      aria-label={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
      className={cn(
        'relative flex items-center justify-center p-2 rounded-lg transition-all duration-200',
        'border border-border bg-surface-2 hover:bg-surface-3 hover:border-accent/30 hover:scale-105 active:scale-95',
        'text-text-secondary hover:text-text-primary group',
        className
      )}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        <Sun
          className={cn(
            'w-4 h-4 text-warning transition-all duration-300 absolute',
            isDark ? 'opacity-0 rotate-90 scale-50 pointer-events-none' : 'opacity-100 rotate-0 scale-100'
          )}
        />
        <Moon
          className={cn(
            'w-4 h-4 text-accent transition-all duration-300 absolute',
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50 pointer-events-none'
          )}
        />
      </div>

      {showLabel && (
        <span className="ml-2 text-xs font-medium">
          {isDark ? 'Modo Escuro' : 'Modo Claro'}
        </span>
      )}
    </button>
  )
}
