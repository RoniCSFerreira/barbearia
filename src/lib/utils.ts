import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utilitário para composição segura de classes Tailwind.
 * Combina `clsx` (lógica condicional) com `tailwind-merge`
 * (resolve conflitos de classes, ex: `p-4` vs `p-2`).
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-accent', 'text-white')
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Formata um valor monetário em Real Brasileiro (BRL).
 * @example formatCurrency(960) // → "R$ 960,00"
 */
export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num)
}

/**
 * Formata um Decimal do Prisma (string) para número JS.
 */
export function decimalToNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value)
  if (value && typeof (value as { toNumber: () => number }).toNumber === 'function') {
    return (value as { toNumber: () => number }).toNumber()
  }
  return 0
}
