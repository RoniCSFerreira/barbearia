'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Scissors,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { loginBarberAction } from '@/app/actions/auth'

export default function LoginPage() {
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await loginBarberAction(formData)
      if (res?.error) {
        setError(res.error)
      }
    })
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 selection:bg-accent selection:text-white">
      <div className="w-full max-w-md space-y-6 animate-fade-in">

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface-2 border border-border shadow-inner text-accent mb-2">
            <Scissors className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Área do Barbeiro
          </h1>
          <p className="text-sm text-text-muted">
            Acesse seu painel para gerenciar sua agenda e clientes
          </p>
        </div>

        {/* Card Form */}
        <div className="card p-6 shadow-xl space-y-5 bg-surface/90 backdrop-blur-md">
          {error && (
            <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-medium flex items-start gap-2 animate-shake">
              <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0 mt-1.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-mail */}
            <div className="space-y-1.5">
              <label className="text-2xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-accent" />
                E-mail
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="seu-email@barbearia.com"
                className="input text-sm"
                autoComplete="email"
              />
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-2xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-accent" />
                  Senha
                </label>
                <a 
                  href="https://wa.me/5519982626830?text=Ol%C3%A1%2C%20esqueci%20minha%20senha%20de%20acesso%20ao%20sistema.%20Poderia%20me%20ajudar%3F" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs font-semibold text-accent hover:text-accent-hover hover:underline transition-colors"
                >
                  Esqueceu?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  placeholder="••••••••"
                  className="input text-sm pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botão de Entrar */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-4 text-sm font-bold shadow-lg shadow-accent/20"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                <>
                  Entrar no Painel
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Rodapé do Card */}
          <div className="pt-4 border-t border-border text-center space-y-3">
            <p className="text-xs text-text-muted">
              Ainda não tem conta de barbeiro?
            </p>
            <Link
              href="/cadastro"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl border border-border bg-surface-2 text-text-primary text-xs font-semibold hover:border-accent/40 hover:text-accent transition-all duration-150"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              Criar conta e testar 3 dias grátis
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
