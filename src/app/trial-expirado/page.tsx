import Link from 'next/link'
import {
  Clock,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  DollarSign,
  Users,
  LogOut,
} from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { logoutBarberAction } from '@/app/actions/auth'

export default async function TrialExpiradoPage() {
  const user = await getCurrentUser()

  // URL de Checkout da Cakto (configure no seu .env)
  const checkoutUrl = process.env.NEXT_PUBLIC_CAKTO_CHECKOUT_URL || '#'

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 selection:bg-accent selection:text-white">
      <div className="w-full max-w-lg space-y-6 animate-fade-in text-center">

        {/* Ícone de Destaque */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-500 mb-2 shadow-lg shadow-amber-500/10">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        {/* Títulos */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
            Período de Testes Encerrado
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
            Seus 3 dias de teste grátis terminaram!
          </h1>
          <p className="text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
            Esperamos que tenha aproveitado a experiência! Seus dados, clientes e agendamentos continuam 100% seguros e salvos.
          </p>
        </div>

        {/* Card de Vantagens Mantidas */}
        <div className="card p-6 bg-surface/90 text-left space-y-4 shadow-xl border-border">
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider">
            O que você continua tendo ao assinar seu plano:
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-2 border border-border/60">
              <Calendar className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="text-xs font-medium text-text-primary">Agenda inteligente online</span>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-2 border border-border/60">
              <Users className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="text-xs font-medium text-text-primary">Link de agendamento 24h</span>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-2 border border-border/60">
              <DollarSign className="w-4 h-4 text-success flex-shrink-0" />
              <span className="text-xs font-medium text-text-primary">Controle financeiro & lucros</span>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-2 border border-border/60">
              <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span className="text-xs font-medium text-text-primary">Histórico seguro em nuvem</span>
            </div>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between text-2xs text-text-muted">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              Nenhum dado cadastrado foi perdido
            </span>
            <span>Liberação rápida via PIX</span>
          </div>
        </div>

        {/* Ação Principal: Checkout */}
        <div className="space-y-3">
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-6 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-accent/40 transition-all duration-200 active:scale-98"
          >
            <DollarSign className="w-5 h-5" />
            Assinar Plano Agora
          </a>

          {/* Sair da Conta */}
          <form action={logoutBarberAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors py-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair da conta atual
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
