'use client'

import { useState, useEffect } from 'react'
import { Sparkles, MessageCircle, X } from 'lucide-react'

interface TrialBannerProps {
  status?: string
  trialEndsAt?: string | null
  barberName?: string
}

export function TrialBanner({ status, trialEndsAt, barberName }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    if (status !== 'TRIAL' || !trialEndsAt) return

    const calculateTime = () => {
      const now = new Date().getTime()
      const end = new Date(trialEndsAt).getTime()
      const diff = end - now

      if (diff <= 0) {
        setTimeLeft('Expirado')
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

      if (days > 0) {
        setTimeLeft(`${days} ${days === 1 ? 'dia' : 'dias'}${hours > 0 ? ` e ${hours}h` : ''}`)
      } else {
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        setTimeLeft(`${hours}h ${mins}m`)
      }
    }

    calculateTime()
    const timer = setInterval(calculateTime, 60000)
    return () => clearInterval(timer)
  }, [status, trialEndsAt])

  if (status !== 'TRIAL' || dismissed || !trialEndsAt) {
    return null
  }

  const adminWhatsApp = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '5511999999999'
  const message = encodeURIComponent(
    `Olá! Sou o barbeiro ${barberName || ''}, estou usando o teste de 3 dias e gostaria de já assinar o plano definitivo.`
  )
  const whatsappUrl = `https://wa.me/${adminWhatsApp.replace(/\D/g, '')}?text=${message}`

  return (
    <div className="bg-gradient-to-r from-amber-500/15 via-accent/15 to-amber-500/15 border-b border-amber-500/25 px-4 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-amber-300 font-medium">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            <strong className="font-bold text-text-primary">Modo Teste Grátis:</strong>{' '}
            Restam <span className="font-bold text-amber-300">{timeLeft || 'calculando...'}</span> de acesso.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-2xs transition-all shadow-sm"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-current" />
            Garantir Plano no WhatsApp
          </a>

          <button
            onClick={() => setDismissed(true)}
            className="text-text-muted hover:text-text-primary p-1 rounded transition-colors"
            title="Fechar aviso temporariamente"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
