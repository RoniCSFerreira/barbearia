'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Scissors,
  User,
  Store,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { registerBarberAction } from '@/app/actions/auth'

export default function CadastroPage() {
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Máscara para telefone/WhatsApp
  const [phone, setPhone] = useState('')
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 11)
    if (val.length > 2) val = `(${val.slice(0, 2)}) ${val.slice(2)}`
    if (val.length > 9) val = `${val.slice(0, 9)}-${val.slice(9)}`
    setPhone(val)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await registerBarberAction(formData)
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
            Criar Conta de Barbeiro
          </h1>
          <p className="text-sm text-text-muted">
            Gerencie sua agenda, clientes e finanças com liberdade total
          </p>
        </div>

        {/* Badge Trial 3 dias */}
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-accent flex-shrink-0" />
          <span>Teste grátis por 3 dias • Sem necessidade de cartão</span>
        </div>

        {/* Card Form */}
        <div className="card p-6 shadow-xl space-y-5 bg-surface/90 backdrop-blur-md">
          {error && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-medium flex items-center gap-2 animate-shake">
              <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome do Barbeiro */}
            <div className="space-y-1.5">
              <label className="text-2xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-accent" />
                Seu Nome Completo
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="Ex: Carlos Ferreira"
                className="input text-sm"
              />
            </div>

            {/* Nome da Barbearia / Espaço */}
            <div className="space-y-1.5">
              <label className="text-2xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-accent" />
                Nome do seu Negócio / Barbearia
              </label>
              <input
                type="text"
                name="salonName"
                required
                placeholder="Ex: Barbearia Mestre ou Studio Carlos"
                className="input text-sm"
              />
            </div>

            {/* Telefone / WhatsApp */}
            <div className="space-y-1.5">
              <label className="text-2xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-accent" />
                WhatsApp para Contato
              </label>
              <input
                type="tel"
                name="phone"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(11) 99999-9999"
                className="input text-sm"
              />
            </div>

            {/* E-mail */}
            <div className="space-y-1.5">
              <label className="text-2xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-accent" />
                Seu E-mail de Acesso
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="exemplo@barbearia.com"
                className="input text-sm"
              />
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label className="text-2xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-accent" />
                Senha de Acesso (Mínimo 6 dígitos)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  placeholder="••••••••"
                  className="input text-sm pr-10"
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

            {/* Vantagens rápidas */}
            <div className="pt-2 space-y-1 text-2xs text-text-muted">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                <span>Link exclusivo para clientes agendarem pelo WhatsApp</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                <span>Controle de comissões, faturamento e despesas</span>
              </div>
            </div>

            {/* Botão de Enviar */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-4 text-sm font-bold shadow-lg shadow-accent/20"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
                  Criando seu espaço...
                </span>
              ) : (
                <>
                  Iniciar 3 Dias de Teste Grátis
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Rodapé do Card */}
          <div className="pt-4 border-t border-border text-center text-xs text-text-muted">
            Já possui uma conta cadastrada?{' '}
            <Link
              href="/login"
              className="text-accent font-semibold hover:underline inline-flex items-center gap-0.5"
            >
              Entrar agora
            </Link>
          </div>
        </div>

        {/* Segurança */}
        <div className="flex items-center justify-center gap-1.5 text-2xs text-text-muted/60">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Acesso individual e dados 100% confidenciais</span>
        </div>
      </div>
    </div>
  )
}
