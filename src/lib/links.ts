/**
 * @file src/lib/links.ts
 * Utilitários para geração de links externos:
 *  - WhatsApp (wa.me)
 *  - Google Agenda (calendar.google.com)
 */

// ─────────────────────────────────────────────────────────────
// WHATSAPP
// ─────────────────────────────────────────────────────────────

/**
 * Higieniza um número de telefone, mantendo apenas dígitos.
 * Garante o DDI do Brasil (55) caso o número não o possua.
 *
 * Regras:
 *  - Remove tudo que não for dígito
 *  - DDD (2 dígitos) + número local → adiciona 55 na frente
 *  - Já começa com 55 → mantém como está
 *
 * @param phone - Número bruto (ex: "(11) 99876-5432", "11998765432", "5511998765432")
 * @returns Número limpo com DDI 55 (ex: "5511998765432")
 */
function sanitizePhone(phone: string): string {
  // Remove todos os caracteres não numéricos
  const digits = phone.replace(/\D/g, '')

  // Já contém DDI 55 (12 ou 13 dígitos: 55 + DDD + número)
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits
  }

  // Número nacional (10 ou 11 dígitos: DDD + número)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`
  }

  // Retorna como está para casos inesperados
  return digits
}

/**
 * Gera o link de abertura do WhatsApp com mensagem pré-preenchida.
 *
 * @param phone - Número de telefone do cliente (qualquer formato)
 * @param text  - Mensagem a ser pré-preenchida no WhatsApp
 * @returns URL no formato `https://wa.me/{numero}?text={mensagem}`
 *
 * @example
 * generateWhatsAppLink('(11) 99876-5432', 'Olá! Confirmo seu corte às 14h.')
 * // → "https://wa.me/5511998765432?text=Ol%C3%A1!%20Confirmo%20seu%20corte%20%C3%A0s%2014h."
 */
export function generateWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = sanitizePhone(phone)
  const encodedText = encodeURIComponent(text)
  return `https://wa.me/${cleanPhone}?text=${encodedText}`
}

// ─────────────────────────────────────────────────────────────
// GOOGLE AGENDA
// ─────────────────────────────────────────────────────────────

export interface GoogleCalendarParams {
  title: string
  description: string
  location?: string
  startTime: Date
  endTime: Date
}

/**
 * Converte uma Date para o formato UTC sem pontuação exigido pelo
 * Google Calendar: `YYYYMMDDTHHmmssZ`
 *
 * @param date - Objeto Date JavaScript
 * @returns String no formato "20260913T140000Z"
 */
function toGoogleCalendarDate(date: Date): string {
  return date
    .toISOString()           // "2026-09-13T14:00:00.000Z"
    .replace(/[-:]/g, '')    // "20260913T140000.000Z"
    .replace(/\.\d{3}/, '')  // "20260913T140000Z"
}

/**
 * Gera a URL de template do Google Agenda para criar um evento
 * com um clique, sem necessidade de autenticação via OAuth.
 *
 * @param params - Dados do evento (título, descrição, localização, horários)
 * @returns URL completa do Google Calendar render
 *
 * @example
 * generateGoogleCalendarUrl({
 *   title: 'Corte Clássico - Guilherme Prado',
 *   description: 'Barbeiro: Carlos Mestre | Serviço: Corte Clássico Tesoura',
 *   location: 'Navalha & Co. • Barbearia Dom Pedro',
 *   startTime: new Date('2026-09-13T11:00:00-03:00'),
 *   endTime:   new Date('2026-09-13T11:35:00-03:00'),
 * })
 */
export function generateGoogleCalendarUrl(params: GoogleCalendarParams): string {
  const { title, description, location, startTime, endTime } = params

  const startISO = toGoogleCalendarDate(startTime)
  const endISO   = toGoogleCalendarDate(endTime)

  const searchParams = new URLSearchParams({
    action:  'TEMPLATE',
    text:    title,
    dates:   `${startISO}/${endISO}`,
    details: description,
  })

  if (location) {
    searchParams.set('location', location)
  }

  return `https://calendar.google.com/calendar/render?${searchParams.toString()}`
}
