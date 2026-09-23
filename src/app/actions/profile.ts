'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export interface ProfileResult {
  name: string
  phone: string
  email: string
  salonName: string
  commissionRate: number
  status: string
  trialEndsAt: string | null
}

export interface ScheduleData {
  workDays: Record<string, boolean>
  startTime: string
  endTime: string
  breakEnabled: boolean
  breakStart: string
  breakEnd: string
  slotMinutes: number
}

const defaultSchedule: ScheduleData = {
  workDays: {
    seg: true,
    ter: true,
    qua: true,
    qui: true,
    sex: true,
    sab: true,
    dom: false, // Domingo é folga por padrão
  },
  startTime: '09:00',
  endTime: '18:00',
  breakEnabled: true,
  breakStart: '12:30',
  breakEnd: '13:30',
  slotMinutes: 30,
}

export async function getBarberProfile(): Promise<ProfileResult | null> {
  const user = await getCurrentUser()
  if (!user) return null

  return {
    name: user.name,
    phone: user.phone || '',
    email: user.email,
    salonName: user.organization.name,
    commissionRate: Number(user.commission_rate) || 0,
    status: user.status,
    trialEndsAt: user.trial_ends_at?.toISOString() || null,
  }
}

export async function updateBarberProfile(data: {
  name: string
  phone: string
  salonName: string
  commissionRate?: number
}) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Usuário não autenticado.' }
  }

  try {
    await db.$transaction(async (tx) => {
      // Atualiza barbearia
      if (data.salonName) {
        await tx.organization.update({
          where: { id: user.organization_id },
          data: { name: data.salonName.trim() },
        })
      }

      // Atualiza usuário
      await tx.user.update({
        where: { id: user.id },
        data: {
          name: data.name.trim(),
          phone: data.phone.trim() || null,
          ...(data.commissionRate !== undefined && {
            commission_rate: data.commissionRate,
          }),
        },
      })
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/perfil')
    return { success: true }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return { error: 'Não foi possível salvar as alterações no perfil.' }
  }
}

export async function saveBarberScheduleAction(schedule: ScheduleData) {
  try {
    const cookieStore = await cookies()
    cookieStore.set('barbearia_schedule', JSON.stringify(schedule), {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/perfil')
    return { success: true }
  } catch (error) {
    console.error('Erro ao salvar horários:', error)
    return { error: 'Não foi possível salvar os horários de atendimento.' }
  }
}

export async function getBarberScheduleAction(): Promise<ScheduleData> {
  try {
    const cookieStore = await cookies()
    const val = cookieStore.get('barbearia_schedule')?.value
    if (val) {
      const parsed = JSON.parse(val)
      return { ...defaultSchedule, ...parsed }
    }
  } catch {}
  return defaultSchedule
}
