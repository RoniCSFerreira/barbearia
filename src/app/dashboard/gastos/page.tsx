'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, Calendar, ShoppingBag, Plus, Trash2, Tag,
  AlertCircle, TrendingDown, Package, Loader2
} from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { getExpensesForDate, createExpense, deleteExpense, type ExpenseItem } from '@/services/expenses'
import { getFinancialSummaryByPeriod } from '@/services/financial'
import { format, parseISO, addDays, subDays, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Category = 'Insumos' | 'Equipamentos' | 'Limpeza' | 'Alimentação' | 'Outros'

const CATEGORIES: Category[] = ['Insumos', 'Equipamentos', 'Limpeza', 'Alimentação', 'Outros']

const CATEGORY_COLORS: Record<Category, string> = {
  Insumos:      'bg-accent/15 text-accent border border-accent/30',
  Equipamentos: 'bg-warning/15 text-warning border border-warning/30',
  Limpeza:      'bg-blue-500/15 text-blue-400 border border-blue-400/30',
  Alimentação:  'bg-success/15 text-success border border-success/30',
  Outros:       'bg-surface-3 text-text-muted border border-border',
}

export default function GastosPage() {
  const getTodayStr = () => new Date().toISOString().split('T')[0]

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr())
  const [expenseDate, setExpenseDate] = useState<string>(getTodayStr())
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [grossRevenue, setGrossRevenue] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  const [description, setDescription] = useState('')
  const [value, setValue] = useState('')
  const [category, setCategory] = useState<Category>('Insumos')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadDataForDate = async (dateStr: string) => {
    setLoading(true)
    try {
      const parsedDate = parseISO(dateStr)
      
      // 1. Busca as despesas da data selecionada
      const data = await getExpensesForDate(parsedDate)
      setExpenses(data || [])

      // 2. Busca a receita bruta daquela data específica
      const summary = await getFinancialSummaryByPeriod({
        period: 'custom',
        customStartDate: dateStr,
        customEndDate: dateStr,
      })
      setGrossRevenue(summary.grossRevenue || 0)
    } catch (err) {
      console.error('Erro ao carregar dados de gastos:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDataForDate(selectedDate)
    setExpenseDate(selectedDate)
  }, [selectedDate])

  const totalGastos = expenses.reduce((sum, e) => sum + e.value, 0)
  const lucroLiquidoAjustado = grossRevenue - totalGastos

  const handlePrevDay = () => {
    const d = subDays(parseISO(selectedDate), 1)
    setSelectedDate(format(d, 'yyyy-MM-dd'))
  }

  const handleNextDay = () => {
    const d = addDays(parseISO(selectedDate), 1)
    setSelectedDate(format(d, 'yyyy-MM-dd'))
  }

  const handleToday = () => {
    setSelectedDate(getTodayStr())
  }

  const handleAdd = async () => {
    if (!description.trim()) {
      setError('Informe a descrição do gasto.')
      return
    }
    const num = parseFloat(value.replace(',', '.'))
    if (isNaN(num) || num <= 0) {
      setError('Informe um valor válido.')
      return
    }
    setError('')
    setIsSubmitting(true)

    try {
      const res = await createExpense({
        description: description.trim(),
        value: num,
        category,
        date: expenseDate,
      })

      if (res?.expense) {
        // Se o gasto foi lançado para a mesma data visualizada na tela, insere na lista
        if (expenseDate === selectedDate) {
          setExpenses(prev => [res.expense as ExpenseItem, ...prev])
        } else {
          // Se foi para outra data, navega a visualização para aquela data
          setSelectedDate(expenseDate)
        }
      }
      setDescription('')
      setValue('')
    } catch (err: any) {
      setError(err?.message || 'Erro ao cadastrar gasto.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemove = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id))
    try {
      await deleteExpense(id)
      loadDataForDate(selectedDate)
    } catch (err) {
      console.error('Erro ao deletar despesa:', err)
      loadDataForDate(selectedDate)
    }
  }

  const targetDateObj = parseISO(selectedDate)
  const isViewingToday = isToday(targetDateObj)
  const formattedDateLabel = format(targetDateObj, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="min-h-screen bg-background p-4 space-y-4 max-w-2xl mx-auto animate-fade-in pb-12">

      {/* Voltar */}
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Dashboard
      </Link>

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-danger/20 border border-danger/30 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-5 h-5 text-danger" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Lançar & Consultar Gastos</h1>
            <p className="text-xs text-text-muted capitalize">{formattedDateLabel}</p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-accent">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Buscando registros...</span>
          </div>
        )}
      </div>

      {/* Barra de Navegação de Data / Calendário */}
      <div className="card p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-2/70 border-border">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-lg bg-surface-3 hover:bg-border text-text-primary transition-colors"
            title="Dia anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleToday}
            className={cn(
              'px-3 py-1.5 rounded-lg text-2xs font-bold transition-all border',
              isViewingToday
                ? 'bg-accent/20 text-accent border-accent/40'
                : 'bg-surface-3 text-text-secondary hover:bg-border border-border'
            )}
          >
            Hoje
          </button>

          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-lg bg-surface-3 hover:bg-border text-text-primary transition-colors"
            title="Próximo dia"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Input de Data Personalizada */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-accent flex-shrink-0" />
          <span className="text-xs font-semibold text-text-muted hidden sm:inline">Data:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="input text-xs py-1 px-2.5 max-w-[150px] bg-surface-3 text-text-primary font-bold cursor-pointer"
          />
        </div>
      </div>

      {/* Resumo financeiro da data selecionada */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center space-y-1">
          <p className="text-2xs text-text-muted uppercase tracking-wider font-semibold">
            Gastos ({isViewingToday ? 'Hoje' : format(targetDateObj, 'dd/MM')})
          </p>
          <p className="text-lg sm:text-xl font-black text-danger tabular-nums">{formatCurrency(totalGastos)}</p>
        </div>
        <div className="card p-3 text-center space-y-1">
          <p className="text-2xs text-text-muted uppercase tracking-wider font-semibold">Lançamentos</p>
          <p className="text-lg sm:text-xl font-black text-text-primary tabular-nums">{expenses.length}</p>
        </div>
        <div className="card p-3 text-center space-y-1">
          <p className="text-2xs text-text-muted uppercase tracking-wider font-semibold">Lucro Líquido</p>
          <p className={cn(
            'text-lg sm:text-xl font-black tabular-nums',
            lucroLiquidoAjustado >= 0 ? 'text-success' : 'text-danger'
          )}>
            {formatCurrency(lucroLiquidoAjustado)}
          </p>
        </div>
      </div>

      {/* Formulário de lançamento */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold text-text-primary">Novo Gasto</h2>
          </div>
          <span className="text-2xs text-text-muted font-medium">
            Lançando para: <strong className="text-accent">{format(parseISO(expenseDate), 'dd/MM/yyyy')}</strong>
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-3">
          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-2xs text-text-muted uppercase tracking-wider font-semibold">Descrição</label>
            <input
              type="text"
              placeholder="Ex: Lâminas descartáveis (cx 100)"
              value={description}
              onChange={e => { setDescription(e.target.value); setError('') }}
              className="input"
            />
          </div>

          {/* Valor, Categoria e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-2xs text-text-muted uppercase tracking-wider font-semibold">Valor (R$)</label>
              <input
                type="number"
                placeholder="0,00"
                value={value}
                onChange={e => { setValue(e.target.value); setError('') }}
                min="0"
                step="0.01"
                className="input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-2xs text-text-muted uppercase tracking-wider font-semibold">Categoria</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as Category)}
                className="input"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-2xs text-text-muted uppercase tracking-wider font-semibold">Data do Gasto</label>
              <input
                type="date"
                value={expenseDate}
                onChange={e => setExpenseDate(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={isSubmitting}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>Lançar Gasto</span>
          </button>
        </div>
      </div>

      {/* Lista de gastos da data */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <TrendingDown className="w-4 h-4 text-danger flex-shrink-0" />
            <h2 className="text-sm font-bold text-text-primary truncate">
              Gastos em {format(targetDateObj, 'dd/MM/yyyy')}
            </h2>
          </div>
          {expenses.length > 0 && (
            <span className="text-sm font-black text-danger tabular-nums flex-shrink-0">{formatCurrency(totalGastos)}</span>
          )}
        </div>

        {expenses.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
            <Package className="w-10 h-10 text-text-muted/30" />
            <p className="text-text-muted text-sm">
              Nenhum gasto registrado para {format(targetDateObj, 'dd/MM/yyyy')}.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map(exp => (
              <div
                key={exp.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-border hover:border-danger/20 transition-colors group"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-text-primary truncate">{exp.description}</p>
                    <span className={cn('badge text-2xs px-2 py-0.5 rounded-full font-semibold', CATEGORY_COLORS[exp.category as Category] || CATEGORY_COLORS.Outros)}>
                      <Tag className="w-2.5 h-2.5" />
                      {exp.category}
                    </span>
                  </div>
                  <p className="text-2xs text-text-muted">Lançado às {exp.createdAt}</p>
                </div>
                <p className="text-sm font-black text-danger tabular-nums flex-shrink-0">
                  - {formatCurrency(exp.value)}
                </p>
                <button
                  onClick={() => handleRemove(exp.id)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all sm:opacity-0 group-hover:opacity-100"
                  title="Remover"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
