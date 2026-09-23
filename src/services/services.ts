'use server'

import { db } from '@/lib/db'
import { decimalToNumber } from '@/lib/utils'

export interface ServiceItem {
  id: string
  name: string
  description: string | null
  price: number
  duration_minutes: number
}

/**
 * Busca todos os serviços de uma organização pelo slug
 */
export async function getOrganizationServices(slug: string = 'navalha-negra'): Promise<ServiceItem[]> {
  const org = await db.organization.findUnique({
    where: { slug },
    include: {
      services: {
        orderBy: { price: 'asc' },
      },
    },
  })

  if (!org) {
    // Fallback: busca qualquer organização cadastrada
    const fallbackOrg = await db.organization.findFirst({
      include: {
        services: {
          orderBy: { price: 'asc' },
        },
      },
    })
    if (!fallbackOrg) return []
    return fallbackOrg.services.map((s) => ({
      id: s.id,
      name: s.name,
      description: null,
      price: decimalToNumber(s.price),
      duration_minutes: s.duration_minutes,
    }))
  }

  return org.services.map((s) => ({
    id: s.id,
    name: s.name,
    description: null,
    price: decimalToNumber(s.price),
    duration_minutes: s.duration_minutes,
  }))
}

export interface PublicOrganizationDetails {
  name: string
  slug: string
  barberName: string
  barberPhone: string | null
}

/**
 * Busca detalhes públicos da organização (nome da barbearia, nome do barbeiro e telefone/WhatsApp)
 */
export async function getPublicOrganizationDetails(slug: string): Promise<PublicOrganizationDetails | null> {
  let org = await db.organization.findUnique({
    where: { slug },
    include: {
      users: {
        take: 1,
      },
    },
  })

  if (!org) {
    org = await db.organization.findFirst({
      include: { users: { take: 1 } },
    })
  }

  if (!org) return null

  const barber = org.users[0]
  return {
    name: org.name,
    slug: org.slug,
    barberName: barber?.name || 'Barbeiro',
    barberPhone: barber?.phone || null,
  }
}

